// Pixel art for the Snakes & Ladders board, drawn with the same painter as Our Little Creature
// (see creature/pixels.ts): every snake and the ladders get their own dark outline, then they're
// stacked into one image that covers the board.

import { outlined, paint, Painter, type Img, type Pt } from '../creature/pixels';

/** Art pixels per board tile. */
export const TILE = 24;

const WOOD = '#b07a4f';
const WOOD_L = '#c98f5f';
const WOOD_D = '#8f5d3c';
const EYE = '#2b1d24';

type SnakePal = { base: string; shade: string; band: string };
const SNAKE: SnakePal = { base: '#7ccf6a', shade: '#4e9a45', band: '#6bbf5a' };

/** A cubic bezier: head, two control points, tail. In tile units. */
export type Curve = [Pt, Pt, Pt, Pt];

const add = (a: Pt, b: Pt, k = 1): Pt => ({ x: a.x + b.x * k, y: a.y + b.y * k });
const unit = (a: Pt, b: Pt): Pt => {
	const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
	return { x: (b.x - a.x) / len, y: (b.y - a.y) / len };
};

function bezier([a, b, c, d]: Curve, t: number): Pt {
	const u = 1 - t;
	return {
		x: u ** 3 * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t ** 3 * d.x,
		y: u ** 3 * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t ** 3 * d.y
	};
}

function disc(p: Painter, c: Pt, r: number, color: string) {
	const d = Math.max(1, Math.round(r * 2));
	p.ellipse(Math.round(c.x - d / 2), Math.round(c.y - d / 2), d, d, color);
}

/** A straight stroke `size` pixels thick, with no gaps on diagonals. */
function brush(p: Painter, a: Pt, b: Pt, size: number, color: string) {
	const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 2);
	for (let i = 0; i <= steps; i++) {
		const t = steps ? i / steps : 0;
		p.rect(
			Math.round(a.x + (b.x - a.x) * t - size / 2),
			Math.round(a.y + (b.y - a.y) * t - size / 2),
			size,
			size,
			color
		);
	}
}

function ladder(p: Painter, from: Pt, to: Pt) {
	const u = unit(from, to);
	const n = { x: -u.y, y: u.x };
	// Poke out a little past both tile centres.
	const a = add(from, u, -3);
	const b = add(to, u, 3);
	const len = Math.hypot(b.x - a.x, b.y - a.y);
	const half = 4.5;

	const rungs = Math.max(2, Math.round(len / 7));
	for (let i = 0; i < rungs; i++) {
		const c = add(a, u, ((i + 0.5) / rungs) * len);
		p.line(add(c, n, -half), add(c, n, half), WOOD_L);
	}
	for (const side of [-1, 1]) {
		const ra = add(a, n, half * side);
		const rb = add(b, n, half * side);
		brush(p, ra, rb, 2, WOOD_D);
		p.line(add(ra, n, -0.5), add(rb, n, -0.5), WOOD);
	}
}

function snake(p: Painter, curve: Curve, pal: SnakePal) {
	let len = 0;
	for (let i = 1; i <= 32; i++) {
		const a = bezier(curve, (i - 1) / 32);
		const b = bezier(curve, i / 32);
		len += Math.hypot(b.x - a.x, b.y - a.y);
	}
	const n = Math.ceil(len * 2);
	const pts = Array.from({ length: n + 1 }, (_, i) => bezier(curve, i / n));
	const radius = (i: number) => 2.6 - 1.6 * (i / n);
	const lit = (q: Pt): Pt => ({ x: q.x - 0.5, y: q.y - 0.5 });

	// Tail first, so the body nearer the head sits on top.
	for (let i = n; i >= 0; i--) disc(p, pts[i], radius(i), pal.shade);
	for (let i = n; i >= 0; i--) {
		// Stripes every few pixels along the body, none on the neck.
		const striped = i > 10 && (i / 2) % 9 < 2;
		disc(p, lit(pts[i]), radius(i) - 0.8, striped ? pal.band : pal.base);
	}

	const h = pts[0];
	const fwd = unit(pts[Math.min(8, n)], h);
	const side = { x: -fwd.y, y: fwd.x };
	disc(p, add(h, fwd, 1), 3.5, pal.shade);
	disc(p, lit(add(h, fwd, 1)), 2.8, pal.base);

	for (const s of [-1, 1]) {
		const e = add(add(h, fwd, 1.5), side, 1.8 * s);
		p.rect(Math.round(e.x - 1), Math.round(e.y - 1), 2, 2, '#ffffff');
		p.px(Math.round(e.x - 1 + Math.max(0, fwd.x)), Math.round(e.y - 1 + Math.max(0, fwd.y)), EYE);
	}
}

/**
 * The board's ladders and snakes as one image, `TILE` art pixels per tile plus a 1px outline
 * border on every side (`off`). Points are in tile units.
 */
export function boardArt(columns: number, rows: number, ladders: [Pt, Pt][], snakes: Curve[]): Img {
	const W = columns * TILE;
	const H = rows * TILE;
	const px = (q: Pt): Pt => ({ x: q.x * TILE - 0.5, y: q.y * TILE - 0.5 });
	const key = JSON.stringify([columns, rows, ladders, snakes]);

	return paint(`snakes|${key}`, W + 2, H + 2, (out) => {
		const layer = (draw: (p: Painter) => void) => {
			const p = new Painter(W, H);
			draw(p);
			outlined(p.grid).forEach((row, y) => row.forEach((c, x) => c && (out.grid[y][x] = c)));
		};
		layer((p) => ladders.forEach(([a, b]) => ladder(p, px(a), px(b))));
		snakes.forEach((s) => layer((p) => snake(p, s.map(px) as Curve, SNAKE)));
	});
}
