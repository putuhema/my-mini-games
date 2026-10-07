// Shared board config — imported by both Convex functions and the Svelte client.

/** Board sizes a host can pick when creating a room. */
export const BOARD_SIZES = [50, 100] as const;
export type BoardSize = (typeof BOARD_SIZES)[number];
/** Size of rooms created before the host could choose. */
export const BOARD_SIZE: BoardSize = 50;
export const COLUMNS = 10;

/** A board's snakes, ladders and heart tiles. Each room gets its own (see generateLayout). */
export type Layout = {
	/** Number of tiles: 50 (10×5) or 100 (10×10). */
	size: BoardSize;
	/** bottom tile -> top tile */
	ladders: Record<number, number>;
	/** head tile -> tail tile */
	snakes: Record<number, number>;
	/** Tiles that ask a partner-written secret question, when one is available. */
	hearts: number[];
	/** Guess-their-answer tiles: both players answer, then the roller judges the match. */
	guess: number[];
};

/** The original board, used by rooms created before layouts were randomised. */
export const DEFAULT_LAYOUT: Layout = {
	size: 50,
	ladders: { 4: 23, 9: 30, 16: 35, 21: 41, 33: 48 },
	snakes: { 26: 6, 28: 7, 39: 19, 47: 27, 49: 31 },
	hearts: [3, 11, 18, 25, 32, 37, 44],
	guess: []
};

/** How a layout is stored on the room document (Convex field names can't be numbers). */
export type StoredLayout = {
	size?: number;
	ladders: { from: number; to: number }[];
	snakes: { from: number; to: number }[];
	hearts: number[];
	guess?: number[];
};

export function toStoredLayout(layout: Layout): StoredLayout {
	const pairs = (m: Record<number, number>) =>
		Object.entries(m).map(([from, to]) => ({ from: Number(from), to }));
	return {
		size: layout.size,
		ladders: pairs(layout.ladders),
		snakes: pairs(layout.snakes),
		hearts: layout.hearts,
		guess: layout.guess
	};
}

export function fromStoredLayout(stored: StoredLayout | undefined | null): Layout {
	if (!stored) return DEFAULT_LAYOUT;
	const map = (pairs: { from: number; to: number }[]) =>
		Object.fromEntries(pairs.map((p) => [p.from, p.to])) as Record<number, number>;
	return {
		size: stored.size === 100 ? 100 : 50,
		ladders: map(stored.ladders),
		snakes: map(stored.snakes),
		hearts: stored.hearts,
		guess: stored.guess ?? []
	};
}

const rowOf = (tile: number) => Math.floor((tile - 1) / COLUMNS);
const colOf = (tile: number) => {
	const idx = tile - 1;
	return rowOf(tile) % 2 === 0 ? idx % COLUMNS : COLUMNS - 1 - (idx % COLUMNS);
};

type Segment = { ax: number; ay: number; bx: number; by: number };

/** Board-space segment between two tile centres (x = column, y = row). */
function segment(from: number, to: number): Segment {
	return { ax: colOf(from), ay: rowOf(from), bx: colOf(to), by: rowOf(to) };
}

/** Whether two segments cross (endpoints are always distinct tiles, so touching can't happen). */
function crosses(p: Segment, q: Segment) {
	const side = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) =>
		Math.sign((bx - ax) * (cy - ay) - (by - ay) * (cx - ax));
	const d1 = side(q.ax, q.ay, q.bx, q.by, p.ax, p.ay);
	const d2 = side(q.ax, q.ay, q.bx, q.by, p.bx, p.by);
	const d3 = side(p.ax, p.ay, p.bx, p.by, q.ax, q.ay);
	const d4 = side(p.ax, p.ay, p.bx, p.by, q.bx, q.by);
	return d1 * d2 < 0 && d3 * d4 < 0;
}

/**
 * A fresh random board. Rules keep it fair and readable:
 * every endpoint is a distinct tile (never the start or finish); ladders climb and snakes drop
 * at least one row and stay fairly upright; no piece crosses another; at most one snake head
 * sits on the top row; and total ladder gain roughly balances total snake loss.
 */
export function generateLayout(size: BoardSize = 50, random: () => number = Math.random): Layout {
	const int = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
	const big = size === 100;
	const pieces = big ? [7, 9] : [4, 5];
	const ladderSpan = big ? [10, 32] : [8, 22];
	const snakeSpan = big ? [10, 36] : [8, 24];
	const heartCount = big ? 12 : 7;
	const guessCount = big ? 6 : 4;

	for (let attempt = 0; attempt < 500; attempt++) {
		const used = new Set<number>();
		const ladders: Record<number, number> = {};
		const snakes: Record<number, number> = {};
		const free = (...tiles: number[]) =>
			tiles.every((t) => t > 1 && t < size && !used.has(t));

		const ladderCount = int(pieces[0], pieces[1]);
		const snakeCount = int(pieces[0], pieces[1]);
		const placed: Segment[] = [];
		// Sideways drift at most one column more than the rows climbed, and no crossings.
		const fits = (from: number, to: number) => {
			const rows = Math.abs(rowOf(to) - rowOf(from));
			if (rows < 1 || Math.abs(colOf(to) - colOf(from)) > rows + 1) return false;
			const seg = segment(from, to);
			return placed.every((other) => !crosses(seg, other));
		};
		let tries = 0;

		while (Object.keys(ladders).length < ladderCount && tries++ < 400) {
			const from = int(2, size - 10);
			const to = from + int(ladderSpan[0], ladderSpan[1]);
			if (to > size - 2 || !free(from, to) || !fits(from, to)) continue;
			ladders[from] = to;
			used.add(from).add(to);
			placed.push(segment(from, to));
		}

		tries = 0;
		let topRowHeads = 0;
		while (Object.keys(snakes).length < snakeCount && tries++ < 400) {
			const from = int(12, size - 1);
			const to = from - int(snakeSpan[0], snakeSpan[1]);
			if (to < 2 || !free(from, to) || !fits(from, to)) continue;
			if (rowOf(from) === rowOf(size)) {
				if (topRowHeads >= 1) continue;
				topRowHeads++;
			}
			snakes[from] = to;
			used.add(from).add(to);
			placed.push(segment(from, to));
		}

		if (Object.keys(ladders).length < ladderCount || Object.keys(snakes).length < snakeCount) continue;

		const gain = Object.entries(ladders).reduce((sum, [f, t]) => sum + t - Number(f), 0);
		const loss = Object.entries(snakes).reduce((sum, [f, t]) => sum + Number(f) - t, 0);
		if (Math.abs(gain - loss) > size * 0.4) continue;

		// Heart tiles spread evenly: one per equal band of the board.
		const hearts: number[] = [];
		const bandSize = (size - 2) / heartCount;
		const bands = Array.from({ length: heartCount }, (_, i) => [
			2 + Math.round(i * bandSize),
			1 + Math.round((i + 1) * bandSize)
		]);
		for (const [lo, hi] of bands) {
			const options = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).filter((t) => free(t));
			if (!options.length) break;
			const tile = options[int(0, options.length - 1)];
			hearts.push(tile);
			used.add(tile);
		}
		if (hearts.length < bands.length) continue;

		// Guess tiles, spread the same way and kept off every other special tile.
		const guess: number[] = [];
		const guessBand = (size - 2) / guessCount;
		for (let i = 0; i < guessCount; i++) {
			const lo = 2 + Math.round(i * guessBand);
			const hi = 1 + Math.round((i + 1) * guessBand);
			const options = Array.from({ length: hi - lo + 1 }, (_, k) => lo + k).filter((t) => free(t));
			if (!options.length) break;
			const tile = options[int(0, options.length - 1)];
			guess.push(tile);
			used.add(tile);
		}
		if (guess.length < guessCount) continue;

		return { size, ladders, snakes, hearts, guess };
	}
	return size === 50 ? DEFAULT_LAYOUT : { ...DEFAULT_LAYOUT, size };
}

/** Reaction keys; the client maps each to an icon. */
export const REACTIONS = ['love', 'laugh', 'aww', 'wow', 'fire', 'hug'] as const;
export type Reaction = (typeof REACTIONS)[number];

export type Category =
	| 'guess'
	| 'fun'
	| 'deep'
	| 'memory'
	| 'future'
	| 'ladder'
	| 'snake'
	| 'finale'
	| 'custom';

export const CATEGORY_META: Record<Category, { label: string }> = {
	fun: { label: 'Just for Fun' },
	deep: { label: 'Deep Talk' },
	memory: { label: 'Our Memories' },
	future: { label: 'Our Future' },
	ladder: { label: 'Ladder · Sweet Words' },
	snake: { label: 'Snake · Confession' },
	finale: { label: 'Finish Line' },
	custom: { label: 'Secret Question' },
	guess: { label: 'Guess My Answer' }
};

/** Which question deck a tile draws from. */
export function categoryForTile(tile: number, layout: Layout): Category {
	if (tile === layout.size) return 'finale';
	if (layout.ladders[tile]) return 'ladder';
	if (layout.snakes[tile]) return 'snake';
	if (layout.guess.includes(tile)) return 'guess';
	const cycle: Category[] = ['fun', 'deep', 'memory', 'future'];
	return cycle[tile % cycle.length];
}

/** Final destination after applying a ladder or snake. */
export function resolveTile(tile: number, layout: Layout): number {
	return layout.ladders[tile] ?? layout.snakes[tile] ?? tile;
}

/** Match reward: the guesser moves forward this many tiles. */
export const GUESS_BONUS = 3;

/** Fill a guess question's {their}/{they}/{them} for the subject ("your") or the guesser (the subject's name). */
export function phraseGuess(template: string, subjectName: string, forSubject: boolean) {
	return template
		.replaceAll('{their}', forSubject ? 'your' : `${subjectName}'s`)
		.replaceAll('{they}', forSubject ? 'you' : subjectName)
		.replaceAll('{them}', forSubject ? 'you' : subjectName);
}

/** Move by a dice roll, bouncing back if the roll overshoots the last tile. */
export function moveBy(from: number, roll: number, size: number): number {
	const raw = from + roll;
	return raw > size ? size - (raw - size) : raw;
}
