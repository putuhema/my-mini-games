// Burger for Two: comparing what was served to the order, and the customer's verdict.

import { customer, pick, type Rand, type Tier } from './customers';
import { dish } from './dishes';
import { ingredient, type Layer } from './ingredients';

export const POINTS = {
	correct: 5,
	extra: -10,
	missing: -8,
	wrongDoneness: -4,
	/** Burgers: scaled by how much of the order's layer sequence the stack follows. Other
	 * dishes get it for having the right things in the right amounts. */
	order: 50,
	/** Scaled by the fraction of time left, and by how right the food is. */
	time: 15
};

export type Score = {
	score: number;
	/** 0–1 of the best possible score. */
	percent: number;
	stars: number;
	tier: Tier;
	tip: number;
	correct: number;
	missing: number;
	extra: number;
	wrongDoneness: number;
	/** 0–1: how well the layer order matches. */
	order: number;
	wrongDish: boolean;
};

const key = (l: Layer) => (l.state ? `${l.ing}:${l.state}` : l.ing);

function counts(items: string[]) {
	const out = new Map<string, number>();
	for (const item of items) out.set(item, (out.get(item) ?? 0) + 1);
	return out;
}

/** Overlap of two multisets. */
function overlap(a: string[], b: string[]) {
	const cb = counts(b);
	let n = 0;
	for (const [k, c] of counts(a)) n += Math.min(c, cb.get(k) ?? 0);
	return n;
}

/** Longest common subsequence length. */
function lcs(a: string[], b: string[]) {
	const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
	for (let i = 1; i <= a.length; i++)
		for (let j = 1; j <= b.length; j++)
			dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
	return dp[a.length][b.length];
}

const STARS = [
	{ min: 0.9, stars: 5 },
	{ min: 0.75, stars: 4 },
	{ min: 0.55, stars: 3 },
	{ min: 0.35, stars: 2 },
	{ min: -Infinity, stars: 1 }
];

export const tierFor = (stars: number): Tier =>
	stars >= 5 ? 'perfect' : stars >= 3 ? 'close' : stars === 2 ? 'confused' : 'angry';

const BASE_TIP = [0, 0, 1, 3, 5, 8];

export function scoreDish(
	target: { dish: string; layers: Layer[] },
	served: { dish?: string; layers: Layer[] },
	opts: { msLeft: number; totalMs: number; customer: string }
): Score {
	const t = target.layers;
	const s = served.layers;
	const ordered = dish(target.dish).ordered;
	const wrongDish = !!s.length && served.dish !== target.dish;
	const correct = wrongDish ? 0 : overlap(t.map((l) => l.ing), s.map((l) => l.ing));
	const exact = wrongDish ? 0 : overlap(t.map(key), s.map(key));
	const wrongDoneness = correct - exact;
	const missing = t.length - correct;
	const extra = s.length - correct;
	const rightFrac = t.length ? exact / t.length : 0;
	const order = wrongDish || !t.length ? 0 : ordered ? lcs(t.map(key), s.map(key)) / t.length : rightFrac;
	const timeFrac = opts.totalMs > 0 ? Math.max(0, Math.min(1, opts.msLeft / opts.totalMs)) : 0;

	const score = Math.round(
		POINTS.correct * correct +
			POINTS.extra * extra +
			POINTS.missing * missing +
			POINTS.wrongDoneness * wrongDoneness +
			POINTS.order * order +
			POINTS.time * timeFrac * rightFrac * order
	);
	// The time bonus sits on top: a perfect dish is 100% even at the buzzer, and speed can
	// make up for a small slip.
	const max = POINTS.correct * t.length + POINTS.order;
	const percent = s.length && !wrongDish ? Math.max(0, Math.min(1, score / max)) : 0;
	let stars = STARS.find((st) => percent >= st.min)!.stars;
	// Five stars means exactly what was ordered.
	const exactMatch =
		!wrongDish &&
		s.length === t.length &&
		(ordered ? s.every((l, i) => key(l) === key(t[i])) : exact === t.length);
	stars = exactMatch ? 5 : Math.min(stars, 4);
	// Raw meat or crunchy noodles: a health hazard (or a dental one), however pretty it looks.
	if (s.some((l) => l.state === 'raw')) stars = Math.min(stars, 2);
	if (wrongDish) stars = 1;
	const tier = tierFor(stars);
	const tip =
		Math.round((BASE_TIP[stars] * customer(opts.customer).tipMultiplier + (stars >= 3 ? 3 * timeFrac : 0)) * 100) / 100;
	return { score, percent, stars, tier, tip, correct, missing, extra, wrongDoneness, order, wrongDish };
}

const SPECIAL_REVIEWS = {
	empty: ['They handed me an empty plate and called it "minimalism".', 'I waited. I waited some more. Nothing came.'],
	wrongDish: [
		'I ordered {a dish}. They gave me something else entirely. Bold.',
		'Wrong dish. Right attitude, I suppose.',
		'Asked for {a dish}. Got a surprise. Did not like surprises.'
	],
	raw: ['The meat was still clucking.', 'Raw meat. I am now writing this from the hospital.'],
	crunchyNoodles: ['The noodles crunched. Noodles should not crunch.', 'Al dente is one thing. This was al rock.'],
	noBuns: ['No bun. Just a pile of stuff in my hands.', 'Is a burger without a bun just a salad with commitment issues?'],
	burnt: ['Tasted like a campfire, and not in a good way.', 'Charcoal is not a topping.'],
	soggy: ['The noodles had given up on life. So did I.', 'Soggy noodles. Like eating a wet sock, lovingly.'],
	upsideDown: ['The bun was on the wrong end. I had to eat it upside down.']
};

/** Fills in "{dish}" and "{a dish}" in a line. */
export function fillDish(line: string, dishId: string) {
	const d = dish(dishId);
	const article = d.noun === 'burger' ? `a ${d.noun}` : d.noun;
	return line.replaceAll('{a dish}', article).replaceAll('{dish}', d.noun);
}

/** The customer's instant reaction line and their review for the end screen. */
export function verdict(
	customerId: string,
	target: { dish: string; layers: Layer[] },
	served: { dish?: string; layers: Layer[] },
	tier: Tier,
	/** Reviews already given this shift, so the end screen doesn't repeat itself. */
	used: string[] = [],
	r: Rand = Math.random
) {
	const c = customer(customerId);
	const fill = (line: string) => fillDish(line, target.dish);
	const fresh = (pool: readonly string[]) => {
		const unused = pool.map(fill).filter((line) => !used.includes(line));
		return unused.length ? pick(r, unused) : fill(pick(r, pool));
	};
	const reaction = fill(pick(r, c.reactions[tier]));
	let review = fresh(c.reviews[tier]);
	const s = served.layers;
	if (tier !== 'perfect') {
		const overdone = (layers: Layer[], style: 'burnt' | 'soft') =>
			layers.filter((l) => l.state === 'burnt' && ingredient(l.ing).cook?.overdone === style).length;
		const isNoodles = (l: Layer) => ingredient(l.ing).cook?.overdone === 'soft';
		if (!s.length) review = fresh(SPECIAL_REVIEWS.empty);
		else if (served.dish !== target.dish) review = fresh(SPECIAL_REVIEWS.wrongDish);
		else if (s.some((l) => l.state === 'raw' && isNoodles(l))) review = fresh(SPECIAL_REVIEWS.crunchyNoodles);
		else if (s.some((l) => l.state === 'raw')) review = fresh(SPECIAL_REVIEWS.raw);
		else if (served.dish === 'burger' && !s.some((l) => ingredient(l.ing).bun)) review = fresh(SPECIAL_REVIEWS.noBuns);
		else if (served.dish === 'burger' && s[0].ing === 'bun_top' && s.at(-1)?.ing === 'bun_bottom')
			review = fresh(SPECIAL_REVIEWS.upsideDown);
		else if (overdone(s, 'soft') > overdone(target.layers, 'soft')) review = fresh(SPECIAL_REVIEWS.soggy);
		else if (overdone(s, 'burnt') > overdone(target.layers, 'burnt') && r() < 0.6)
			review = fresh(SPECIAL_REVIEWS.burnt);
	}
	return { reaction, review };
}
