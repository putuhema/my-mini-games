// Burger for Two: the menu. Each dish says what goes in it, how the chef cooks it, how a random
// order is put together, and how customers name it. Add a dish by adding an entry here (and a
// way to draw it in src/lib/burger/Dish.svelte).

import type { Doneness, IngredientId, Layer, Voice } from './ingredients';

export type Rand = () => number;

/** One optional (or required) component of an order. */
export type RecipePick = {
	ing: IngredientId;
	/** Chance it's in the order (1 = always). */
	chance: number;
	count?: readonly [number, number];
	/** At most one pick per group makes it in: the first that rolls in, in listed order. */
	group?: string;
};

export type Dish = {
	label: string;
	/** "burger", "sate", "noodles": used in reviews ("Best {dish} ever"). */
	noun: string;
	/** How customers ask for it. */
	names: Partial<Record<Voice, string[]>> & { plain: string[] };
	/** Burgers are stacks, so order matters; plates and bowls are just a set of things. */
	ordered: boolean;
	/** The cooker: a grill for patties and skewers, a pot for noodles. */
	cooker: { kind: 'grill' | 'pot'; slots: number };
	/** Everything the chef can add, in rail order. Cookables go in the cooker first. */
	ingredients: readonly IngredientId[];
	recipe: readonly RecipePick[];
	/** Extra seconds on the clock, for dishes that take longer to cook. */
	extraSeconds: number;
};

export const DISHES = {
	burger: {
		label: 'Burger',
		noun: 'burger',
		names: {
			plain: ['a burger'],
			kid: ['a 🍔'],
			fancy: ['your signature burger'],
			gym: ['a burger'],
			terse: ['burger'],
			grandma: ['one of those hamburgers'],
			tourist: ['ham-bur-ger'],
			chat: ['burger', 'brgr'],
			vague: ['the stacked round thing'],
			riddle: ['Operation Bun']
		},
		ordered: true,
		cooker: { kind: 'grill', slots: 2 },
		ingredients: [
			'beef',
			'chicken',
			'bun_bottom',
			'bun_top',
			'cheese',
			'lettuce',
			'tomato',
			'onion',
			'pickles',
			'bacon',
			'egg',
			'ketchup',
			'mustard'
		],
		recipe: [
			{ ing: 'bun_bottom', chance: 1 },
			{ ing: 'bun_top', chance: 1 },
			{ ing: 'beef', chance: 0.6, count: [1, 2], group: 'patty' },
			{ ing: 'chicken', chance: 1, count: [1, 2], group: 'patty' },
			{ ing: 'cheese', chance: 0.6 },
			{ ing: 'lettuce', chance: 0.45 },
			{ ing: 'tomato', chance: 0.45 },
			{ ing: 'onion', chance: 0.3 },
			{ ing: 'pickles', chance: 0.35 },
			{ ing: 'bacon', chance: 0.3 },
			{ ing: 'egg', chance: 0.2 },
			{ ing: 'ketchup', chance: 0.4 },
			{ ing: 'mustard', chance: 0.3 }
		],
		extraSeconds: 0
	},
	sate: {
		label: 'Sate ayam',
		noun: 'sate',
		names: {
			plain: ['sate ayam (chicken skewers)'],
			kid: ['🍢 sate'],
			fancy: ['the chicken satay'],
			gym: ['sate ayam'],
			terse: ['sate'],
			grandma: ['chicken satay, like we had in Bali'],
			tourist: ['sah-tay ah-yam'],
			chat: ['sate ayam', 'sate aym'],
			vague: ['the plate of sticks'],
			riddle: ['Operation Sword']
		},
		ordered: false,
		cooker: { kind: 'grill', slots: 4 },
		ingredients: [
			'sate',
			'peanut_sauce',
			'kecap',
			'sambal',
			'fried_shallot',
			'shallot',
			'lime',
			'cucumber',
			'lontong',
			'soup'
		],
		recipe: [
			{ ing: 'sate', chance: 1, count: [2, 5] },
			{ ing: 'peanut_sauce', chance: 0.85 },
			{ ing: 'kecap', chance: 0.5 },
			{ ing: 'sambal', chance: 0.4 },
			{ ing: 'fried_shallot', chance: 0.55 },
			{ ing: 'shallot', chance: 0.35 },
			{ ing: 'lime', chance: 0.3 },
			{ ing: 'cucumber', chance: 0.3 },
			// With lontong or with soup (or neither).
			{ ing: 'lontong', chance: 0.55, count: [1, 2], group: 'side' },
			{ ing: 'soup', chance: 0.7, group: 'side' }
		],
		extraSeconds: 10
	},
	noodle: {
		label: 'Mie ayam',
		noun: 'noodles',
		names: {
			plain: ['mie ayam (chicken noodles)'],
			kid: ['🍜 chicken noodles'],
			fancy: ['the chicken noodle bowl'],
			gym: ['mie ayam'],
			terse: ['mie ayam'],
			grandma: ['a bowl of chicken noodles'],
			tourist: ['mee ah-yam'],
			chat: ['mie ayam', 'mie aym'],
			vague: ['the curly bowl'],
			riddle: ['Operation Strings']
		},
		ordered: false,
		cooker: { kind: 'pot', slots: 2 },
		ingredients: [
			'noodles',
			'broth',
			'chicken_topping',
			'bok_choy',
			'meatball',
			'wonton',
			'green_onion',
			'fried_shallot',
			'sambal',
			'kecap'
		],
		recipe: [
			{ ing: 'noodles', chance: 1 },
			{ ing: 'chicken_topping', chance: 0.9 },
			{ ing: 'broth', chance: 0.6 },
			{ ing: 'bok_choy', chance: 0.65 },
			{ ing: 'meatball', chance: 0.5, count: [1, 3] },
			{ ing: 'wonton', chance: 0.4, count: [1, 2] },
			{ ing: 'green_onion', chance: 0.55 },
			{ ing: 'fried_shallot', chance: 0.5 },
			{ ing: 'sambal', chance: 0.4 },
			{ ing: 'kecap', chance: 0.2 }
		],
		extraSeconds: 5
	}
} as const satisfies Record<string, Dish>;

export type DishId = keyof typeof DISHES;
export const DISH_IDS = Object.keys(DISHES) as DishId[];

export function dish(id: string): Dish {
	const found = (DISHES as Record<string, Dish>)[id];
	if (!found) throw new Error(`Unknown dish: ${id}`);
	return found;
}

export const isDish = (id: string): id is DishId => id in DISHES;

/** Orders from before there was a menu were all burgers. */
export const dishOf = (order: { dish?: string }) => order.dish ?? 'burger';

// ---- Difficulty ----

export type Difficulty = 'chill' | 'busy' | 'rush';

export const DIFFICULTIES: Record<
	Difficulty,
	{
		label: string;
		detail: string;
		customers: number;
		/** Multiplies every customer's patience. */
		time: number;
		/** Extra components per order (each point raises the odds of every optional pick). */
		size: number;
		/** Chance an order comes with "and NO onions". */
		refuse: number;
		/** Multiplies each customer's chance of changing their mind mid-order. */
		changes: number;
	}
> = {
	chill: { label: 'Chill', detail: '5 customers · relaxed', customers: 5, time: 1.15, size: -1, refuse: 0.1, changes: 0 },
	busy: { label: 'Busy', detail: '6 customers · mind changes', customers: 6, time: 1, size: 0.5, refuse: 0.35, changes: 1 },
	rush: { label: 'Rush hour', detail: '7 customers · big orders', customers: 7, time: 0.75, size: 1.5, refuse: 0.6, changes: 1.6 }
};

export const DIFFICULTY_IDS = Object.keys(DIFFICULTIES) as Difficulty[];

// ---- Building an order ----

const between = (r: Rand, [min, max]: readonly [number, number]) => min + Math.floor(r() * (max - min + 1));

export type Taste = {
	/** Ingredients this customer goes for: more likely, and more of them. */
	likes?: readonly IngredientId[];
	/** Never ordered. */
	dislikes?: readonly IngredientId[];
	/** Bigger or smaller orders than usual (adds to the difficulty's size). */
	size?: number;
	/** Chance a cookable is wanted overdone (burnt skewers, soft noodles). */
	overdone?: number;
};

/** Picks the components of an order, unarranged. */
export function pickComponents(dishId: string, taste: Taste, size: number, r: Rand): Layer[] {
	const d = dish(dishId);
	const out: Layer[] = [];
	const groupsUsed = new Set<string>();
	for (const p of d.recipe) {
		if (p.group && groupsUsed.has(p.group)) continue;
		if (taste.dislikes?.includes(p.ing)) continue;
		const liked = taste.likes?.includes(p.ing) ?? false;
		const chance = p.chance >= 1 ? 1 : Math.min(0.95, p.chance + 0.12 * size + (liked ? 0.35 : 0));
		if (r() >= chance) continue;
		if (p.group) groupsUsed.add(p.group);
		const [min, max] = p.count ?? [1, 1];
		// Liking something (or a big appetite) means one more, never more than that.
		const bonus = p.count ? Math.min(1, (liked ? 1 : 0) + (size >= 1 ? 1 : 0)) : 0;
		const count = Math.max(1, between(r, [min, max + bonus]));
		for (let i = 0; i < count; i++) out.push({ ing: p.ing });
	}
	return out;
}

/** Puts burger layers in a sensible-but-varied order: buns outside, patties low, cheese
 * melting onto a patty, sauces next to the buns. Other dishes keep their pick order. */
export function arrange(dishId: string, layers: Layer[], r: Rand): Layer[] {
	if (!dish(dishId).ordered) return layers;
	const shuffle = <T>(arr: T[]) => {
		const out = [...arr];
		for (let i = out.length - 1; i > 0; i--) {
			const j = Math.floor(r() * (i + 1));
			[out[i], out[j]] = [out[j], out[i]];
		}
		return out;
	};
	const isPatty = (l: Layer) => l.ing === 'beef' || l.ing === 'chicken';
	const isSauce = (l: Layer) => l.ing === 'ketchup' || l.ing === 'mustard';
	const inner = layers.filter((l) => l.ing !== 'bun_bottom' && l.ing !== 'bun_top');
	const sauces = inner.filter(isSauce);
	let middle = shuffle(inner.filter((l) => !isSauce(l)));
	const firstPatty = middle.findIndex(isPatty);
	if (firstPatty > 0 && r() < 0.7) middle.unshift(...middle.splice(firstPatty, 1));
	const cheese = middle.findIndex((l) => l.ing === 'cheese');
	if (cheese >= 0 && r() < 0.6) {
		const [slice] = middle.splice(cheese, 1);
		middle.splice(middle.findIndex(isPatty) + 1, 0, slice);
	}
	for (const sauce of sauces) {
		const at = r() < 0.4 ? 0 : r() < 0.7 ? middle.length : Math.floor(r() * (middle.length + 1));
		middle.splice(at, 0, sauce);
	}
	middle = middle.slice(0, 12);
	return [{ ing: 'bun_bottom' }, ...middle, { ing: 'bun_top' }];
}

/** Sets how done each cookable should be: one roll per ingredient, so all skewers match. */
export function withDoneness(layers: Layer[], cookable: (ing: string) => boolean, overdone: number, r: Rand) {
	const wanted = new Map<string, Doneness>();
	return layers.map((l): Layer => {
		if (!cookable(l.ing)) return l;
		if (!wanted.has(l.ing)) wanted.set(l.ing, r() < overdone ? 'burnt' : 'cooked');
		return { ing: l.ing, state: wanted.get(l.ing) };
	});
}
