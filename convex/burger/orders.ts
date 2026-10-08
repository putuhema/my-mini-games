// Burger for Two: random orders and the text customers use to describe them.

import { CUSTOMER_IDS, customer, pick, VOICES, type Direction, type Rand } from './customers';
import {
	arrange,
	DIFFICULTIES,
	dish,
	DISH_IDS,
	pickComponents,
	withDoneness,
	type Difficulty
} from './dishes';
import { ingredient, type Layer } from './ingredients';

export type Order = {
	customer: string;
	name: string;
	dish: string;
	/** What they ask for first. Burgers run bottom to top. */
	layers: Layer[];
	text: string;
	/** Shown as a picture on the cashier's screen instead of described. */
	picture: boolean;
	seconds: number;
	/** A change of mind partway through: shown to the cashier at `at` (fraction of the clock). */
	followUp?: { at: number; text: string; layers: Layer[] };
};

/** "Next customer…" before the clock starts. */
export const COUNTDOWN_MS = 3_000;

function shuffle<T>(r: Rand, arr: readonly T[]) {
	const out = [...arr];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(r() * (i + 1));
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}

function weighted<T extends string>(r: Rand, weights: Partial<Record<T, number>>): T {
	const entries = Object.entries(weights) as [T, number][];
	let roll = r() * entries.reduce((sum, [, w]) => sum + w, 0);
	for (const [key, w] of entries) {
		roll -= w;
		if (roll <= 0) return key;
	}
	return entries[0][0];
}

/** Consecutive identical layers, so "two beef patties" is said once. */
function groups(layers: Layer[]) {
	const out: { layer: Layer; count: number }[] = [];
	for (const layer of layers) {
		const last = out.at(-1);
		if (last && last.layer.ing === layer.ing && last.layer.state === layer.state) last.count++;
		else out.push({ layer, count: 1 });
	}
	return out;
}

/** An ingredient's name in a customer's voice, with doneness if it's wanted overdone. */
function nameIn(customerId: string, layer: Layer, r: Rand) {
	const c = customer(customerId);
	const ing = ingredient(layer.ing);
	const name = pick(r, ing.names[c.voice] ?? ing.names.plain);
	return layer.state === 'burnt' && ing.cook ? VOICES[c.voice].overdone(name, ing.cook.overdone) : name;
}

export function describe(customerId: string, dishId: string, layers: Layer[], dir: Direction, r: Rand) {
	const c = customer(customerId);
	const d = dish(dishId);
	// Plates and bowls: group like with like, so "three skewers" isn't split up.
	const ordered = d.ordered ? (dir === 'up' ? layers : [...layers].reverse()) : sortByIngredient(layers);
	const parts = groups(ordered).map(({ layer, count }) => {
		const name = nameIn(customerId, layer, r);
		return count > 1 ? VOICES[c.voice].repeat(name, count) : name;
	});
	return c.speak({ dish: pick(r, d.names[c.voice] ?? d.names.plain), parts, ordered: d.ordered, dir, r });
}

function sortByIngredient(layers: Layer[]) {
	const firstSeen = new Map<string, number>();
	layers.forEach((l, i) => firstSeen.has(l.ing) || firstSeen.set(l.ing, i));
	return [...layers].sort((a, b) => firstSeen.get(a.ing)! - firstSeen.get(b.ing)!);
}

/** Things the customer may add, drop or swap in: no buns, nothing that needs cooking. */
const changeable = (ing: string) => !ingredient(ing).bun && !ingredient(ing).cook;

function changeOfMind(customerId: string, dishId: string, layers: Layer[], refused: string | undefined, r: Rand) {
	const c = customer(customerId);
	const voice = VOICES[c.voice];
	const d = dish(dishId);
	const present = [...new Set(layers.map((l) => l.ing))].filter(changeable);
	const absent = d.ingredients.filter((ing) => changeable(ing) && !present.includes(ing) && ing !== refused);
	const name = (ing: string) => nameIn(customerId, { ing }, r);
	const kinds = [absent.length && 'add', present.length && 'remove', present.length && absent.length && 'swap'].filter(
		Boolean
	) as ('add' | 'remove' | 'swap')[];
	if (!kinds.length) return undefined;
	const kind = pick(r, kinds);
	let next: Layer[];
	let line: string;
	if (kind === 'add') {
		const ing = pick(r, absent);
		// Burgers: new layers go just under the top bun, and the customer says so.
		next = d.ordered ? [...layers.slice(0, -1), { ing }, ...layers.slice(-1)] : [...layers, { ing }];
		line = voice.add(name(ing)) + (d.ordered ? ' (Right under the top bun.)' : '');
	} else if (kind === 'remove') {
		const ing = pick(r, present);
		next = layers.filter((l) => l.ing !== ing);
		line = voice.remove(name(ing));
	} else {
		const from = pick(r, present);
		const to = pick(r, absent);
		// The first one becomes the new thing; any repeats of the old one go.
		const at = layers.findIndex((l) => l.ing === from);
		next = layers.flatMap((l, i) => (i === at ? [{ ing: to }] : l.ing === from ? [] : [l]));
		line = voice.swap(name(from), name(to));
	}
	return { at: 0.3 + r() * 0.2, text: `${pick(r, c.change.intro)} ${line}`, layers: next };
}

export function generateOrder(
	customerId: string,
	opts: { difficulty: Difficulty; index: number },
	r: Rand = Math.random
): Order {
	const c = customer(customerId);
	const level = DIFFICULTIES[opts.difficulty];
	const dishId = weighted(r, c.dishes);
	const d = dish(dishId);
	// Later customers in a shift order more.
	const size = level.size + (c.taste.size ?? 0) + opts.index * 0.25;
	const picked = pickComponents(dishId, c.taste, size, r);
	const layers = withDoneness(
		arrange(dishId, picked, r),
		(ing) => !!ingredient(ing).cook,
		c.taste.overdone ?? 0.1,
		r
	);

	const picture = r() < c.pictureChance;
	const dir: Direction = r() < 0.7 ? 'up' : 'down';
	let text = picture
		? pick(r, c.pictureLines).replaceAll('{dish}', d.noun)
		: describe(customerId, dishId, layers, dir, r);

	// "...and NO onions": something the chef might reach for out of habit.
	let refused: string | undefined;
	if (r() < level.refuse) {
		const options = d.ingredients.filter((ing) => changeable(ing) && !layers.some((l) => l.ing === ing));
		if (options.length) {
			refused = pick(r, options);
			text += ` ${VOICES[c.voice].refuse(nameIn(customerId, { ing: refused }, r))}`;
		}
	}

	const followUp =
		r() < Math.min(0.9, c.change.chance * level.changes)
			? changeOfMind(customerId, dishId, layers, refused, r)
			: undefined;

	return {
		customer: customerId,
		name: pick(r, c.names),
		dish: dishId,
		layers,
		text,
		picture,
		seconds: Math.round((c.seconds + d.extraSeconds + (followUp ? 10 : 0)) * level.time),
		...(followUp ? { followUp } : {})
	};
}

/** A shift's customers: no type twice until every type has come in. */
export function generateShift(difficulty: Difficulty, r: Rand = Math.random): Order[] {
	const count = DIFFICULTIES[difficulty].customers;
	const types: string[] = [];
	while (types.length < count) types.push(...shuffle(r, CUSTOMER_IDS));
	return types.slice(0, count).map((id, index) => generateOrder(id, { difficulty, index }, r));
}

export { DISH_IDS };
