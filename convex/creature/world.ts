// Our Little Creature: the room, the cat's needs and growth. Shared by the server (which owns
// the state) and the client (which draws it and extrapolates needs between updates).

export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;

// ---- The room ----
// The floor is a square, ROOM units on each side. `x` runs along the right-hand back wall, `y`
// along the left-hand one, so (0, 0) is the back corner and (ROOM, ROOM) the front corner. It's
// drawn isometrically: one floor unit is one sprite pixel across, half a pixel down.

export const ROOM = 160;
/** How tall the back walls are, in pixels. */
export const WALL_H = 84;
/** The drawn scene, and where the back corner of the floor sits in it. */
export const SCENE_W = 352;
export const SCENE_H = 282;
export const ORIGIN = { x: 176, y: 100 };

export type Point = { x: number; y: number };

/** Floor point (with height `z` above it) to scene pixels. */
export const toScreen = (x: number, y: number, z = 0): Point => ({
	x: ORIGIN.x + x - y,
	y: ORIGIN.y + (x + y) / 2 - z
});

/** Scene pixels back to the floor point under them. */
export function toFloor(sx: number, sy: number): Point {
	const a = sx - ORIGIN.x;
	const b = 2 * (sy - ORIGIN.y);
	return { x: (a + b) / 2, y: (b - a) / 2 };
}

/** Feet can go anywhere in here. */
export const WALK = { min: 6, max: ROOM - 6 };
/** Floor units per second. */
export const PLAYER_SPEED = 46;
export const PET_SPEED = 30;
export const PET_RUN_SPEED = 70;

export const clampToFloor = ({ x, y }: Point): Point => ({
	x: Math.round(Math.min(WALK.max, Math.max(WALK.min, x))),
	y: Math.round(Math.min(WALK.max, Math.max(WALK.min, y)))
});

type Box = { x0: number; y0: number; x1: number; y1: number };

/** Furniture footprints on the floor. The art in src/lib/creature/art.ts is drawn to match. */
export const FURNITURE = {
	plant: { x0: 3, y0: 3, x1: 17, y1: 17 },
	radio: { x0: 2, y0: 24, x1: 16, y1: 42 },
	sofa: { x0: 2, y0: 52, x1: 28, y1: 98 },
	catTree: { x0: 34, y0: 2, x1: 52, y1: 20 },
	fishTank: { x0: 72, y0: 2, x1: 96, y1: 14 },
	lamp: { x0: 100, y0: 2, x1: 112, y1: 14 },
	bed: { x0: 116, y0: 2, x1: 158, y1: 56 },
	table: { x0: 48, y0: 68, x1: 68, y1: 86 },
	bowl: { x0: 118, y0: 84, x1: 132, y1: 94 },
	toybox: { x0: 142, y0: 98, x1: 156, y1: 112 },
	box: { x0: 52, y0: 128, x1: 70, y1: 146 },
	tub: { x0: 96, y0: 136, x1: 120, y1: 154 },
	petBed: { x0: 128, y0: 124, x1: 152, y1: 146 },
	rug: { x0: 60, y0: 66, x1: 118, y1: 120 }
} as const satisfies Record<string, Box>;

/** Things you can't walk through. */
const SOLID: (keyof typeof FURNITURE)[] = [
	'plant',
	'radio',
	'sofa',
	'catTree',
	'fishTank',
	'lamp',
	'bed',
	'table',
	'bowl',
	'toybox',
	'box',
	'tub'
];
export const BLOCKERS: Box[] = SOLID.map((k) => FURNITURE[k]);

/** Things you can tap. `spot` is where you stand to use it. */
export const OBJECTS = {
	plant: { label: 'Water the plant', spot: { x: 22, y: 14 } },
	radio: { label: 'Radio', spot: { x: 22, y: 33 } },
	sofa: { label: 'Sofa', spot: { x: 34, y: 75 } },
	catTree: { label: 'Cat tree', spot: { x: 44, y: 26 } },
	window: { label: 'Window', spot: { x: 62, y: 10 } },
	fishTank: { label: 'Fish tank', spot: { x: 84, y: 20 } },
	lamp: { label: 'Lights', spot: { x: 106, y: 20 } },
	bed: { label: 'Bed', spot: { x: 136, y: 62 } },
	door: { label: 'Door', spot: { x: 12, y: 126 } },
	table: { label: 'Table', spot: { x: 58, y: 92 } },
	bowl: { label: 'Food bowl', spot: { x: 125, y: 100 } },
	toybox: { label: 'Toy basket', spot: { x: 138, y: 105 } },
	box: { label: 'Cardboard box', spot: { x: 76, y: 137 } },
	tub: { label: 'Bath', spot: { x: 108, y: 130 } },
	petBed: { label: 'Cat bed', spot: { x: 140, y: 118 } },
	rug: { label: 'Rug', spot: { x: 88, y: 92 } }
} as const satisfies Record<string, { label: string; spot: Point }>;

export type RoomObject = keyof typeof OBJECTS;
export const isObject = (k: string): k is RoomObject => k in OBJECTS;

/** Where the cat sits up on (or in) furniture, and how high off the floor that is. */
export const SEATS = {
	sofa: { x: 15, y: 72, z: 9, on: 'sofa' },
	bed: { x: 138, y: 34, z: 14, on: 'bed' },
	catTree: { x: 43, y: 11, z: 40, on: 'catTree' },
	table: { x: 58, y: 77, z: 12, on: 'table' },
	box: { x: 61, y: 137, z: 1, on: 'box' },
	tub: { x: 108, y: 145, z: 2, on: 'tub' },
	petBed: { x: 140, y: 135, z: 2, on: 'petBed' }
} as const satisfies Record<string, Point & { z: number; on: keyof typeof FURNITURE }>;
export type Seat = keyof typeof SEATS;

/** Where gifts and toys can sit on the floor, in the order they fill up. */
export const DECOR_SLOTS: Point[] = [
	{ x: 90, y: 30 },
	{ x: 104, y: 62 },
	{ x: 30, y: 110 },
	{ x: 86, y: 116 },
	{ x: 70, y: 50 },
	{ x: 112, y: 78 },
	{ x: 40, y: 142 },
	{ x: 150, y: 70 }
];

/** Where the knocked-over cup lands. */
export const CUP_SPOT: Point = { x: 72, y: 88 };

export const SPAWN: Point = { x: 14, y: 126 };

// ---- Walking around furniture ----

const CELL = 8;
const CELLS = ROOM / CELL;

function inside(p: Point, b: Box, pad: number) {
	return p.x > b.x0 - pad && p.x < b.x1 + pad && p.y > b.y0 - pad && p.y < b.y1 + pad;
}
const blocked = (p: Point, pad = 3) => BLOCKERS.some((b) => inside(p, b, pad));

/** Nudges a point out of any furniture, to the nearest free edge. */
export function freeSpot(p: Point): Point {
	let { x, y } = clampToFloor(p);
	for (const b of BLOCKERS) {
		if (!inside({ x, y }, b, 2)) continue;
		const moves = [
			{ x: b.x0 - 3, y, d: x - b.x0 },
			{ x: b.x1 + 3, y, d: b.x1 - x },
			{ x, y: b.y0 - 3, d: y - b.y0 },
			{ x, y: b.y1 + 3, d: b.y1 - y }
		]
			.filter((m) => m.x >= WALK.min && m.y >= WALK.min && m.x <= WALK.max && m.y <= WALK.max)
			.sort((a, c) => a.d - c.d);
		if (moves[0]) ({ x, y } = clampToFloor(moves[0]));
	}
	return { x, y };
}

function clearLine(a: Point, b: Point) {
	const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 2);
	for (let i = 1; i < n; i++) {
		const k = i / n;
		if (blocked({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k }, 2)) return false;
	}
	return true;
}

const cellOf = (p: Point) => ({
	cx: Math.min(CELLS - 1, Math.max(0, Math.floor(p.x / CELL))),
	cy: Math.min(CELLS - 1, Math.max(0, Math.floor(p.y / CELL)))
});
const centre = (cx: number, cy: number): Point => ({ x: cx * CELL + CELL / 2, y: cy * CELL + CELL / 2 });

let openCells: boolean[] | null = null;
function open() {
	openCells ??= Array.from({ length: CELLS * CELLS }, (_, i) => {
		const c = centre(i % CELLS, Math.floor(i / CELLS));
		return c.x >= WALK.min && c.y >= WALK.min && c.x <= WALK.max && c.y <= WALK.max && !blocked(c, 4);
	});
	return openCells;
}

/** A walkable route from `a` to `b` as waypoints (not including `a`). A* on a coarse grid,
 * then pulled tight. The last leg may hop onto furniture (the cat jumping up). */
export function route(a: Point, b: Point): Point[] {
	if (clearLine(a, b)) return [b];
	const ok = open();
	// Either end may be on furniture (the cat hopping up or down): use the nearest open cell.
	const nearestOpen = (p: Point) => {
		const c = cellOf(p);
		if (ok[c.cy * CELLS + c.cx]) return c;
		let best = Infinity;
		let pick = c;
		for (let i = 0; i < ok.length; i++) {
			if (!ok[i]) continue;
			const q = centre(i % CELLS, Math.floor(i / CELLS));
			const d = Math.hypot(q.x - p.x, q.y - p.y);
			if (d < best) {
				best = d;
				pick = cellOf(q);
			}
		}
		return pick;
	};
	const start = nearestOpen(a);
	const goal = nearestOpen(b);
	const key = (cx: number, cy: number) => cy * CELLS + cx;
	const g = new Map<number, number>([[key(start.cx, start.cy), 0]]);
	const from = new Map<number, number>();
	const frontier: { k: number; f: number }[] = [{ k: key(start.cx, start.cy), f: 0 }];
	const goalKey = key(goal.cx, goal.cy);
	const h = (cx: number, cy: number) => {
		const dx = Math.abs(cx - goal.cx);
		const dy = Math.abs(cy - goal.cy);
		return Math.max(dx, dy) + 0.41 * Math.min(dx, dy);
	};
	let found = false;
	for (let steps = 0; frontier.length && steps < 2000; steps++) {
		frontier.sort((p, q) => p.f - q.f);
		const { k } = frontier.shift()!;
		if (k === goalKey) {
			found = true;
			break;
		}
		const cx = k % CELLS;
		const cy = Math.floor(k / CELLS);
		for (let dx = -1; dx <= 1; dx++)
			for (let dy = -1; dy <= 1; dy++) {
				if (!dx && !dy) continue;
				const nx = cx + dx;
				const ny = cy + dy;
				if (nx < 0 || ny < 0 || nx >= CELLS || ny >= CELLS) continue;
				if (!ok[key(nx, ny)]) continue;
				// No cutting corners past furniture.
				if (dx && dy && (!ok[key(cx + dx, cy)] || !ok[key(cx, cy + dy)])) continue;
				const cost = (g.get(k) ?? 0) + (dx && dy ? 1.41 : 1);
				const nk = key(nx, ny);
				if (cost < (g.get(nk) ?? Infinity)) {
					g.set(nk, cost);
					from.set(nk, k);
					frontier.push({ k: nk, f: cost + h(nx, ny) });
				}
			}
	}
	if (!found) return [b];
	const cells: Point[] = [];
	for (let k: number | undefined = goalKey; k !== undefined; k = from.get(k))
		cells.unshift(centre(k % CELLS, Math.floor(k / CELLS)));
	const points = [...cells, b];
	// Pull the string: skip every waypoint we can see past.
	const out: Point[] = [];
	let here = a;
	let i = 0;
	while (i < points.length) {
		let j = points.length - 1;
		while (j > i && !clearLine(here, points[j])) j--;
		out.push(points[j]);
		here = points[j];
		i = j + 1;
	}
	return out.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) }));
}

// ---- Motion: a walk along waypoints, starting at `at` and taking `dur` ms ----

export type MotionData = {
	fx: number;
	fy: number;
	tx: number;
	ty: number;
	at: number;
	dur: number;
	/** Waypoints between the start and the end, flattened as x, y, x, y... */
	via?: number[];
};

function pointsOf(m: MotionData): Point[] {
	const pts = [{ x: m.fx, y: m.fy }];
	for (let i = 0; m.via && i + 1 < m.via.length; i += 2) pts.push({ x: m.via[i], y: m.via[i + 1] });
	pts.push({ x: m.tx, y: m.ty });
	return pts;
}

/** Where a walker is at `t`, and which way they're heading. */
export function motionAt(m: MotionData, t: number): Point & { moving: boolean; dx: number; dy: number } {
	const pts = pointsOf(m);
	const last = pts.length - 1;
	const finalDir = { dx: pts[last].x - pts[last - 1].x, dy: pts[last].y - pts[last - 1].y };
	if (m.dur <= 0 || t >= m.at + m.dur) return { x: m.tx, y: m.ty, moving: false, ...finalDir };
	if (t <= m.at) return { x: m.fx, y: m.fy, moving: false, dx: pts[1].x - pts[0].x, dy: pts[1].y - pts[0].y };
	const lengths = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y));
	const total = lengths.reduce((s, l) => s + l, 0) || 1;
	let d = ((t - m.at) / m.dur) * total;
	for (let i = 0; i < lengths.length; i++) {
		if (d <= lengths[i] || i === lengths.length - 1) {
			const k = lengths[i] ? Math.min(1, d / lengths[i]) : 1;
			const a = pts[i];
			const b = pts[i + 1];
			return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, moving: true, dx: b.x - a.x, dy: b.y - a.y };
		}
		d -= lengths[i];
	}
	return { x: m.tx, y: m.ty, moving: false, ...finalDir };
}

/** A walk through the given waypoints, in order. */
export function walkVia(from: Point, stops: Point[], at: number, speed: number): MotionData {
	const pts = [{ x: Math.round(from.x), y: Math.round(from.y) }, ...stops];
	let dist = 0;
	for (let i = 1; i < pts.length; i++) dist += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
	const end = pts[pts.length - 1];
	const middle = pts.slice(1, -1).flatMap((p) => [p.x, p.y]);
	return {
		fx: pts[0].x,
		fy: pts[0].y,
		tx: end.x,
		ty: end.y,
		at,
		dur: Math.round((dist / speed) * 1000),
		...(middle.length ? { via: middle } : {})
	};
}

/** Walk to `to`, around the furniture. Seats are allowed as the destination (a hop up). */
export function walkTo(from: Point, to: Point, at: number, speed: number): MotionData {
	const seat = Object.values(SEATS).some((s) => s.x === to.x && s.y === to.y);
	const target = seat ? to : freeSpot(to);
	return walkVia(from, route(from, target), at, speed);
}

/** The seat a point is on, if any. */
export const seatAt = (p: Point): Seat | undefined =>
	(Object.keys(SEATS) as Seat[]).find((k) => Math.abs(SEATS[k].x - p.x) < 2 && Math.abs(SEATS[k].y - p.y) < 2);

// ---- Players ----

export const SHIRTS = ['pink', 'mint', 'amber', 'sky', 'lilac'] as const;
export const HAIRS = ['short', 'long', 'bun'] as const;
export type Shirt = (typeof SHIRTS)[number];
export type Hair = (typeof HAIRS)[number];

export const EMOTES = ['wave', 'heart', 'laugh', 'hug', 'cry', 'sleepy', 'wow'] as const;
export type Emote = (typeof EMOTES)[number];
export const MAX_CHAT = 80;
/** How long an emote or chat bubble stays up. */
export const BUBBLE_MS = 5_000;
/** Close enough to hug. */
export const HUG_RANGE = 26;

// ---- The cat ----

export const COATS = ['orange', 'tuxedo', 'calico', 'siamese', 'black', 'gray', 'cream'] as const;
export type Coat = (typeof COATS)[number];
export const COAT_LABEL: Record<Coat, string> = {
	orange: 'Orange tabby',
	tuxedo: 'Tuxedo',
	calico: 'Calico',
	siamese: 'Siamese',
	black: 'Black cat',
	gray: 'Gray tabby',
	cream: 'Cream'
};
export const isCoat = (k: string): k is Coat => (COATS as readonly string[]).includes(k);

// ---- Needs ----

export const NEEDS = ['hunger', 'happiness', 'energy', 'cleanliness'] as const;
export type Need = (typeof NEEDS)[number];
export type Needs = Record<Need, number>;

export const NEED_LABEL: Record<Need, string> = {
	hunger: 'Full',
	happiness: 'Happy',
	energy: 'Energy',
	cleanliness: 'Clean'
};

/** Points lost per hour while awake. Gentle: a full cat stays fine for most of a day. */
const DECAY: Needs = { hunger: 4, happiness: 2.5, energy: 3, cleanliness: 2 };
const SLEEP_REGEN = 40;
/** Needs never fall below this: the cat gets sad, never sick. */
export const MIN_NEED = 12;
/** Below this, needs drain at half speed so a long absence doesn't bottom everything out. */
const SOFT = 40;

function drain(value: number, amount: number) {
	if (amount <= 0) return value;
	const above = Math.max(0, value - SOFT);
	if (amount <= above) return value - amount;
	return Math.max(MIN_NEED, Math.min(value, SOFT) - (amount - above) / 2);
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));

type NeedsState = { needs: Needs; needsAt: number; sleep?: { since: number; until: number } };

/** The cat's needs at time `t`, worked out from the last stored snapshot. */
export function needsAt(pet: NeedsState, t: number): Needs {
	const from = pet.needsAt;
	if (t <= from) return pet.needs;
	const hours = (t - from) / HOUR;
	let asleep = 0;
	if (pet.sleep) {
		const s = Math.max(from, pet.sleep.since);
		const e = Math.min(t, pet.sleep.until);
		asleep = Math.max(0, e - s) / HOUR;
	}
	const awake = hours - asleep;
	const n = pet.needs;
	return {
		hunger: drain(n.hunger, DECAY.hunger * awake + 1.5 * asleep),
		happiness: drain(n.happiness, DECAY.happiness * hours),
		energy: clamp(drain(n.energy, DECAY.energy * awake) + SLEEP_REGEN * asleep),
		cleanliness: drain(n.cleanliness, DECAY.cleanliness * hours)
	};
}

/** How long a nap takes to refill energy, in ms. At least 20 minutes. */
export const sleepLength = (energy: number) => Math.max(20 * 60_000, ((100 - energy) / SLEEP_REGEN) * HOUR);

export function addNeeds(n: Needs, d: Partial<Needs>): Needs {
	return {
		hunger: clamp(n.hunger + (d.hunger ?? 0)),
		happiness: clamp(n.happiness + (d.happiness ?? 0)),
		energy: clamp(n.energy + (d.energy ?? 0)),
		cleanliness: clamp(n.cleanliness + (d.cleanliness ?? 0))
	};
}

// ---- Food, toys and gifts ----

export const FOODS = {
	kibble: { label: 'Kibble', effect: { hunger: 24 } },
	fish: { label: 'Fish', effect: { hunger: 30, happiness: 4 } },
	chicken: { label: 'Chicken', effect: { hunger: 26, happiness: 6 } },
	treat: { label: 'Treat', effect: { hunger: 6, happiness: 10 } }
} as const satisfies Record<string, { label: string; effect: Partial<Needs> }>;
export type Food = keyof typeof FOODS;
export const MENU: Food[] = ['kibble', 'fish', 'chicken', 'treat'];
export const isFood = (k: string): k is Food => k in FOODS;

/** Ways to play. The ball and the laser go where you point; the feather stays in your hand. */
export const PLAYS = {
	ball: { label: 'Ball', aim: true },
	laser: { label: 'Laser', aim: true },
	feather: { label: 'Feather', aim: false }
} as const;
export type Play = keyof typeof PLAYS;
export const isPlay = (k: string): k is Play => k in PLAYS;

/** Things that can be left behind. `for` is who receives it; `decor` items stay in the room. */
export const GIFTS = {
	letter: { label: 'Just a letter', for: 'partner', decor: false },
	flower: { label: 'A flower', for: 'partner', decor: true },
	star: { label: 'A star lamp', for: 'partner', decor: true },
	treat: { label: 'Treats for the cat', for: 'pet', decor: false },
	mouse: { label: 'A toy mouse for the cat', for: 'pet', decor: true }
} as const satisfies Record<string, { label: string; for: 'partner' | 'pet'; decor: boolean }>;
export type Gift = keyof typeof GIFTS;
export const isGift = (k: string): k is Gift => k in GIFTS;

/** Decor items: gifts plus toys from daily events. */
export const DECOR = ['flower', 'star', 'mouse', 'ball', 'yarn', 'sprout'] as const;
export type Decor = (typeof DECOR)[number];
export const TOYS: readonly string[] = ['mouse', 'ball', 'yarn'];
export const MAX_DECOR = DECOR_SLOTS.length;

export const MESSAGE_PRESETS = [
	'I miss you',
	'Good morning, love',
	'Sleep well',
	'Thinking of you',
	'Take care of our baby'
];
export const MAX_MESSAGE = 160;

// ---- Personality (hidden) ----

export const TRAITS = [
	'playful',
	'curious',
	'affectionate',
	'foodie',
	'adventurous',
	'lazy',
	'mischievous',
	'nature'
] as const;
export type Trait = (typeof TRAITS)[number];
export type Traits = Partial<Record<Trait, number>>;

/** How the cat comes across, for the status panel. Words only, never numbers. */
export const TRAIT_WORD: Record<Trait, string> = {
	playful: 'playful',
	curious: 'curious',
	affectionate: 'cuddly',
	foodie: 'food-obsessed',
	adventurous: 'adventurous',
	lazy: 'sleepy',
	mischievous: 'a little troublemaker',
	nature: 'loves plants'
};

/** Strongest traits first; only ones that have really shown up. */
export function topTraits(traits: Traits, n = 2): Trait[] {
	return (Object.entries(traits) as [Trait, number][])
		.filter(([, v]) => v >= 3)
		.sort((a, b) => b[1] - a[1])
		.slice(0, n)
		.map(([k]) => k);
}

export const has = (traits: Traits, t: Trait) => topTraits(traits, 3).includes(t);

// ---- Growth ----

export type Stage = 'box' | 'kitten' | 'young' | 'teen' | 'adult';
export const EVOLUTIONS = ['chonk', 'floof', 'sleek', 'forest'] as const;
export type Evolution = (typeof EVOLUTIONS)[number];

export const STAGE_LABEL: Record<Stage, string> = {
	box: 'Hiding in a box',
	kitten: 'Kitten',
	young: 'Growing up',
	teen: 'Almost grown',
	adult: 'Grown up'
};

export const EVOLUTION_LABEL: Record<Evolution, string> = {
	chonk: 'Chonky Loaf',
	floof: 'Fluffball',
	sleek: 'Sleek Hunter',
	forest: 'Forest Cat'
};

export const EVOLUTION_BLURB: Record<Evolution, string> = {
	chonk: 'All those snacks and naps made a magnificent, round, heavy cat.',
	floof: 'All those cuddles grew the softest, fluffiest coat.',
	sleek: 'All that playing made a fast, bouncy little hunter.',
	forest: 'All that time with the plants made a cat who smells like leaves.'
};

/** Day 1 is the day the box turned up. */
export const dayOf = (createdAt: number, t: number) => Math.floor((t - createdAt) / DAY) + 1;

/** The stage the cat should be at on `day`. Missed days are fine: growth goes by the calendar. */
export function stageFor(day: number, out: boolean): Stage {
	if (!out) return 'box';
	if (day >= 30) return 'adult';
	if (day >= 14) return 'teen';
	if (day >= 7) return 'young';
	return 'kitten';
}

export const NEXT_STAGE_DAY: Partial<Record<Stage, number>> = { kitten: 7, young: 14, teen: 30 };

/** The couple's combined habits decide what kind of cat it grows into. Deliberately fuzzy. */
export function chooseEvolution(t: Traits, roll = Math.random()): Evolution {
	const v = (k: Trait) => t[k] ?? 0;
	const scores: Record<Evolution, number> = {
		chonk: v('foodie') + v('lazy') * 0.8,
		floof: v('affectionate') + v('lazy') * 0.3,
		sleek: v('playful') + v('adventurous') + v('mischievous') * 0.5,
		forest: v('nature') * 1.4 + v('curious') * 0.6
	};
	const best = Math.max(...Object.values(scores));
	const top = EVOLUTIONS.filter((e) => scores[e] >= best - 0.01);
	return top[Math.floor(roll * top.length)];
}

/** The kitten comes out once both partners have said hello, or by itself after a day. */
export const COME_OUT_AFTER = DAY;

// ---- Presence ----

/** A player counts as gone after this long without a heartbeat. */
export const OFFLINE_AFTER_MS = 45_000;
export const HEARTBEAT_MS = 10_000;
/** How long a speech bubble stays up. */
export const SAY_MS = 4_500;
