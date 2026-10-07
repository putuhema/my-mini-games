// Bomb Defusal rules, shared by the Convex functions and the client.
// Every round has a random bomb *and* a random manual edition (generated from a seed), so
// memorising last round's rules doesn't help. The server keeps the seed away from the defuser
// and checks every move; the expert's browser gets the seed to render the manual.

export type Difficulty = 'easy' | 'normal' | 'hard';

export const DIFFICULTIES: Record<
	Difficulty,
	{ label: string; modules: number; seconds: number; detail: string }
> = {
	easy: { label: 'Rookie', modules: 3, seconds: 300, detail: '3 modules · 5:00' },
	normal: { label: 'Agent', modules: 4, seconds: 300, detail: '4 modules · 5:00' },
	hard: { label: 'Expert', modules: 6, seconds: 360, detail: '6 modules · 6:00' }
};

export const MAX_STRIKES = 3;
/** Each strike knocks this much off the clock. */
export const STRIKE_PENALTY_MS = 15_000;
/** "3, 2, 1" before the clock starts. */
export const COUNTDOWN_MS = 3_000;
/** The button counts as tapped if released within this long (generous for network lag). */
export const TAP_MS = 1_200;

// ---- Randomness ----

/** Deterministic PRNG (mulberry32) so a seed always produces the same manual. */
export function rng(seed: number) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

type Rand = () => number;
const int = (r: Rand, n: number) => Math.floor(r() * n);
const pick = <T>(r: Rand, arr: readonly T[]) => arr[int(r, arr.length)];
function shuffle<T>(r: Rand, arr: readonly T[]) {
	const out = [...arr];
	for (let i = out.length - 1; i > 0; i--) {
		const j = int(r, i + 1);
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}

// ---- Edgework: serial number, batteries and indicators printed on the casing ----

export const INDICATOR_LABELS = ['CAR', 'FRK', 'SND', 'BOB', 'MSA', 'NSA', 'TRN'] as const;

export type Edgework = {
	serial: string;
	batteries: number;
	indicators: { label: string; lit: boolean }[];
};

const serialOdd = (e: Edgework) => Number(e.serial.at(-1)) % 2 === 1;
const serialVowel = (e: Edgework) => /[AEIOU]/.test(e.serial);
const hasLit = (e: Edgework, label: string) =>
	e.indicators.some((i) => i.lit && i.label === label);

function generateEdgework(r: Rand): Edgework {
	const letters = 'ABCDEFGHIJKLMNPQRSTUVWXZ';
	const chars = letters + '0123456789';
	const serial =
		Array.from({ length: 5 }, () => pick(r, chars.split(''))).join('') + String(int(r, 10));
	const labels = shuffle(r, INDICATOR_LABELS).slice(0, int(r, 3));
	return {
		serial,
		batteries: int(r, 5),
		indicators: labels.map((label) => ({ label, lit: r() < 0.6 }))
	};
}

// ---- Wires ----

export const WIRE_COLORS = ['red', 'blue', 'yellow', 'white', 'black'] as const;
export type WireColor = (typeof WIRE_COLORS)[number];

type WireCond =
	| { kind: 'none' | 'many' | 'one' | 'last' | 'first'; color: WireColor }
	| { kind: 'odd' }
	| { kind: 'batteries'; n: number }
	| { kind: 'lit'; label: string };
type WireAction =
	| { kind: 'pos'; n: number }
	| { kind: 'last' }
	| { kind: 'lastOf' | 'firstOf'; color: WireColor };
export type WireRule = { cond: WireCond; action: WireAction };
/** Rules for one wire count, checked top to bottom; `fallback` is the 1-based wire to cut. */
export type WireTable = { count: number; rules: WireRule[]; fallback: number };

function wireCond(r: Rand): WireCond {
	const kind = pick(r, ['none', 'many', 'one', 'last', 'first', 'odd', 'batteries', 'lit'] as const);
	if (kind === 'odd') return { kind };
	if (kind === 'batteries') return { kind, n: 2 + int(r, 2) };
	if (kind === 'lit') return { kind, label: pick(r, INDICATOR_LABELS) };
	return { kind, color: pick(r, WIRE_COLORS) };
}

function wireAction(r: Rand, cond: WireCond, count: number): WireAction {
	// "Cut the last blue wire" only makes sense when the condition guarantees a blue wire.
	if ((cond.kind === 'many' || cond.kind === 'one') && r() < 0.6) {
		return { kind: cond.kind === 'many' && r() < 0.5 ? 'firstOf' : 'lastOf', color: cond.color };
	}
	if (r() < 0.25) return { kind: 'last' };
	return { kind: 'pos', n: 1 + int(r, count) };
}

function generateWireTable(r: Rand, count: number): WireTable {
	const rules: WireRule[] = [];
	const seen = new Set<string>();
	while (rules.length < (count <= 4 ? 3 : 4)) {
		const cond = wireCond(r);
		const key = JSON.stringify(cond);
		if (seen.has(key)) continue;
		seen.add(key);
		rules.push({ cond, action: wireAction(r, cond, count) });
	}
	return { count, rules, fallback: 1 + int(r, count) };
}

function wireCondHolds(cond: WireCond, wires: string[], e: Edgework) {
	switch (cond.kind) {
		case 'none':
			return !wires.includes(cond.color);
		case 'many':
			return wires.filter((w) => w === cond.color).length > 1;
		case 'one':
			return wires.filter((w) => w === cond.color).length === 1;
		case 'last':
			return wires.at(-1) === cond.color;
		case 'first':
			return wires[0] === cond.color;
		case 'odd':
			return serialOdd(e);
		case 'batteries':
			return e.batteries >= cond.n;
		case 'lit':
			return hasLit(e, cond.label);
	}
}

/** 0-based index of the wire to cut. */
export function wireToCut(wires: string[], e: Edgework, manual: Manual) {
	const table = manual.wires.find((t) => t.count === wires.length)!;
	for (const { cond, action } of table.rules) {
		if (!wireCondHolds(cond, wires, e)) continue;
		switch (action.kind) {
			case 'pos':
				return action.n - 1;
			case 'last':
				return wires.length - 1;
			case 'firstOf':
				return wires.indexOf(action.color);
			case 'lastOf':
				return wires.lastIndexOf(action.color);
		}
	}
	return table.fallback - 1;
}

const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'];

export function describeWireCond(c: WireCond) {
	switch (c.kind) {
		case 'none':
			return `there are no ${c.color} wires`;
		case 'many':
			return `there is more than one ${c.color} wire`;
		case 'one':
			return `there is exactly one ${c.color} wire`;
		case 'last':
			return `the last wire is ${c.color}`;
		case 'first':
			return `the first wire is ${c.color}`;
		case 'odd':
			return 'the last digit of the serial number is odd';
		case 'batteries':
			return `there are ${c.n} or more batteries`;
		case 'lit':
			return `there is a lit indicator labelled ${c.label}`;
	}
}

export function describeWireAction(a: WireAction) {
	switch (a.kind) {
		case 'pos':
			return `cut the ${ORDINALS[a.n - 1]} wire`;
		case 'last':
			return 'cut the last wire';
		case 'firstOf':
			return `cut the first ${a.color} wire`;
		case 'lastOf':
			return `cut the last ${a.color} wire`;
	}
}

export const ordinal = (n: number) => ORDINALS[n - 1];

// ---- The Button ----

export const BUTTON_COLORS = ['red', 'blue', 'yellow', 'white'] as const;
export const BUTTON_LABELS = ['ABORT', 'DETONATE', 'HOLD', 'PRESS'] as const;
export const STRIP_COLORS = ['blue', 'white', 'yellow', 'red'] as const;

type ButtonCond =
	| { kind: 'color'; color: string }
	| { kind: 'label'; label: string }
	| { kind: 'colorLabel'; color: string; label: string }
	| { kind: 'batteries'; n: number }
	| { kind: 'lit'; label: string };
export type ButtonAction = 'tap' | 'hold';
export type ButtonManual = {
	rules: { cond: ButtonCond; action: ButtonAction }[];
	fallback: ButtonAction;
	/** Release the held button when the timer shows this digit, by strip colour. */
	strip: Record<string, number>;
};

function generateButtonManual(r: Rand): ButtonManual {
	const rules: ButtonManual['rules'] = [];
	const seen = new Set<string>();
	while (rules.length < 5) {
		const kind = pick(r, ['color', 'label', 'colorLabel', 'batteries', 'lit'] as const);
		const cond: ButtonCond =
			kind === 'color'
				? { kind, color: pick(r, BUTTON_COLORS) }
				: kind === 'label'
					? { kind, label: pick(r, BUTTON_LABELS) }
					: kind === 'colorLabel'
						? { kind, color: pick(r, BUTTON_COLORS), label: pick(r, BUTTON_LABELS) }
						: kind === 'batteries'
							? { kind, n: 1 + int(r, 2) }
							: { kind, label: pick(r, INDICATOR_LABELS) };
		const key = JSON.stringify(cond);
		if (seen.has(key)) continue;
		seen.add(key);
		rules.push({ cond, action: r() < 0.5 ? 'tap' : 'hold' });
	}
	const digits = shuffle(r, [1, 2, 3, 4, 5]);
	return {
		rules,
		fallback: r() < 0.5 ? 'tap' : 'hold',
		strip: Object.fromEntries(STRIP_COLORS.map((c, i) => [c, digits[i]]))
	};
}

function buttonCondHolds(c: ButtonCond, color: string, label: string, e: Edgework) {
	switch (c.kind) {
		case 'color':
			return color === c.color;
		case 'label':
			return label === c.label;
		case 'colorLabel':
			return color === c.color && label === c.label;
		case 'batteries':
			return e.batteries > c.n;
		case 'lit':
			return hasLit(e, c.label);
	}
}

export function buttonAction(color: string, label: string, e: Edgework, manual: Manual) {
	const rule = manual.button.rules.find((r) => buttonCondHolds(r.cond, color, label, e));
	return rule ? rule.action : manual.button.fallback;
}

export function describeButtonCond(c: ButtonCond) {
	switch (c.kind) {
		case 'color':
			return `the button is ${c.color}`;
		case 'label':
			return `the button says "${c.label}"`;
		case 'colorLabel':
			return `the button is ${c.color} and says "${c.label}"`;
		case 'batteries':
			return `there are more than ${c.n} ${c.n === 1 ? 'battery' : 'batteries'}`;
		case 'lit':
			return `there is a lit indicator labelled ${c.label}`;
	}
}

/** What the timer shows: M:SS, rounded up so it reads 0:00 only at the very end. */
export function formatTimer(ms: number) {
	const total = Math.max(0, Math.ceil(ms / 1000));
	return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

// ---- Keypad ----

/** Keypad glyph names; the client maps each to an icon. They're never labelled on the bomb. */
export const KEYPAD_SYMBOLS = [
	'anchor', 'atom', 'butterfly', 'crown', 'eye', 'ghost', 'leaf', 'moon', 'planet', 'skull',
	'spiral', 'sun', 'tree', 'cactus', 'feather', 'fish', 'flask', 'flower', 'hourglass', 'key',
	'pawprint', 'bird', 'snowflake', 'umbrella', 'yinyang', 'alien', 'bone', 'pentagram'
] as const;
export type KeypadSymbol = (typeof KEYPAD_SYMBOLS)[number];

const KEYPAD_COLUMNS = 6;
const KEYPAD_COLUMN_LENGTH = 7;

function generateKeypadColumns(r: Rand): string[][] {
	return Array.from({ length: KEYPAD_COLUMNS }, () =>
		shuffle(r, KEYPAD_SYMBOLS).slice(0, KEYPAD_COLUMN_LENGTH)
	);
}

/** The four keys in the order they must be pressed. */
export function keypadOrder(symbols: string[], manual: Manual) {
	const column = manual.keypad.find((col) => symbols.every((s) => col.includes(s)))!;
	return column.filter((s) => symbols.includes(s));
}

// ---- Simon Says ----

export const SIMON_COLORS = ['red', 'blue', 'green', 'yellow'] as const;
export type SimonManual = {
	/** [strikes 0, 1, 2]: flashing colour → colour to press. */
	vowel: Record<string, string>[];
	noVowel: Record<string, string>[];
};

function generateSimonManual(r: Rand): SimonManual {
	const table = () =>
		Array.from({ length: 3 }, () => {
			const to = shuffle(r, SIMON_COLORS);
			return Object.fromEntries(SIMON_COLORS.map((c, i) => [c, to[i]]));
		});
	return { vowel: table(), noVowel: table() };
}

export function simonPress(flash: string, e: Edgework, strikes: number, manual: Manual) {
	const table = serialVowel(e) ? manual.simon.vowel : manual.simon.noVowel;
	return table[Math.min(strikes, 2)][flash];
}

// ---- The manual edition ----

export type Manual = {
	edition: string;
	wires: WireTable[];
	button: ButtonManual;
	keypad: string[][];
	simon: SimonManual;
};

export function generateManual(seed: number): Manual {
	const r = rng(seed);
	return {
		edition: `${1 + (seed % 9)}-${'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(seed / 9) % 24]}`,
		wires: [3, 4, 5, 6].map((count) => generateWireTable(r, count)),
		button: generateButtonManual(r),
		keypad: generateKeypadColumns(r),
		simon: generateSimonManual(r)
	};
}

// ---- Bomb generation ----

export type ModuleType = 'wires' | 'button' | 'keypad' | 'simon';
const MODULE_TYPES: ModuleType[] = ['wires', 'button', 'keypad', 'simon'];

export type BombModule =
	| { type: 'wires'; wires: string[]; cut: number[]; solved: boolean }
	| {
			type: 'button';
			color: string;
			label: string;
			strip: string;
			holdingSince?: number;
			solved: boolean;
	  }
	| { type: 'keypad'; symbols: string[]; pressed: number[]; solved: boolean }
	| { type: 'simon'; sequence: string[]; stage: number; input: number; solved: boolean };

export type Bomb = Edgework & { seed: number; modules: BombModule[] };

function generateModule(r: Rand, type: ModuleType, manual: Manual): BombModule {
	switch (type) {
		case 'wires': {
			const count = 3 + int(r, 4);
			return { type, wires: Array.from({ length: count }, () => pick(r, WIRE_COLORS)), cut: [], solved: false };
		}
		case 'button':
			return {
				type,
				color: pick(r, BUTTON_COLORS),
				label: pick(r, BUTTON_LABELS),
				strip: pick(r, STRIP_COLORS),
				solved: false
			};
		case 'keypad': {
			// Four keys from one column that no other column also fully contains.
			for (;;) {
				const column = pick(r, manual.keypad);
				const symbols = shuffle(r, column).slice(0, 4);
				const matches = manual.keypad.filter((col) => symbols.every((s) => col.includes(s)));
				if (matches.length === 1) return { type, symbols, pressed: [], solved: false };
			}
		}
		case 'simon':
			return {
				type,
				sequence: Array.from({ length: 3 + int(r, 3) }, () => pick(r, SIMON_COLORS)),
				stage: 1,
				input: 0,
				solved: false
			};
	}
}

export function generateBomb(difficulty: Difficulty): Bomb {
	const r = Math.random;
	const seed = Math.floor(r() * 2 ** 31);
	const manual = generateManual(seed);
	const count = DIFFICULTIES[difficulty].modules;
	// Every module type before any repeats, in a random order.
	const types = [...shuffle(r, MODULE_TYPES), ...Array.from({ length: 4 }, () => pick(r, MODULE_TYPES))]
		.slice(0, count);
	return {
		seed,
		...generateEdgework(r),
		modules: types.map((t) => generateModule(r, t, manual))
	};
}

/** What the defuser's browser may see: no seed, and the strip only lights while held. */
export function visibleModule(m: BombModule) {
	if (m.type === 'button') {
		const { strip, ...rest } = m;
		return { ...rest, strip: m.holdingSince ? strip : undefined };
	}
	if (m.type === 'simon') return { ...m, sequence: m.sequence.slice(0, m.stage), length: m.sequence.length };
	return m;
}

export type VisibleModule = ReturnType<typeof visibleModule>;
