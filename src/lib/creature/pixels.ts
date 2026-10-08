// Pixel art for Our Little Creature. Sprites are drawn once to a canvas and cached as PNG data
// URLs, then shown as <img> with image-rendering: pixelated at whole-pixel positions. Each one
// keeps a mask of its filled pixels so taps can hit exactly what's drawn.
//
// Two ways to make one:
// - `sprite(rows, colors)`: one string per row, '.' is empty, letters map to colours.
// - `paint(w, h, draw)`: draw with rects, ellipses and polygons, for furniture and the room.
// Either can get an automatic dark outline (`outline`), which keeps everything cohesive.

export const INK = '#3b2730';

export type Grid = (string | null)[][];

const cache = new Map<string, Img>();

/** `off` is how far the image grew on each side when it was outlined. */
export type Img = { url: string; w: number; h: number; mask: Uint8Array; off: number };

const rgba = new Map<string, [number, number, number, number]>();
function parse(c: string) {
	let v = rgba.get(c);
	if (!v) {
		const hex = c.slice(1);
		const full = hex.length <= 4 ? [...hex].map((h) => h + h).join('') : hex;
		v = [
			parseInt(full.slice(0, 2), 16),
			parseInt(full.slice(2, 4), 16),
			parseInt(full.slice(4, 6), 16),
			full.length >= 8 ? parseInt(full.slice(6, 8), 16) : 255
		];
		rgba.set(c, v);
	}
	return v;
}

function toImg(grid: Grid, off: number): Img {
	const h = grid.length;
	const w = grid[0]?.length ?? 0;
	const canvas = document.createElement('canvas');
	canvas.width = Math.max(1, w);
	canvas.height = Math.max(1, h);
	const ctx = canvas.getContext('2d')!;
	const data = ctx.createImageData(canvas.width, canvas.height);
	const mask = new Uint8Array(w * h);
	for (let y = 0; y < h; y++)
		for (let x = 0; x < w; x++) {
			const c = grid[y][x];
			if (!c) continue;
			const [r, g, b, a] = parse(c);
			const i = (y * w + x) * 4;
			data.data[i] = r;
			data.data[i + 1] = g;
			data.data[i + 2] = b;
			data.data[i + 3] = a;
			mask[y * w + x] = 1;
		}
	ctx.putImageData(data, 0, 0);
	return { url: canvas.toDataURL(), w, h, mask, off };
}

/** Whether pixel (x, y) of an image is filled. */
export const hits = (img: Img, x: number, y: number) =>
	x >= 0 && y >= 0 && x < img.w && y < img.h && img.mask[Math.floor(y) * img.w + Math.floor(x)] === 1;

/** Adds a 1px outline around every filled pixel (grows the grid by 1 on each side). */
export function outlined(grid: Grid, color = INK): Grid {
	const h = grid.length + 2;
	const w = (grid[0]?.length ?? 0) + 2;
	const at = (x: number, y: number) => grid[y - 1]?.[x - 1] ?? null;
	const out: Grid = [];
	for (let y = 0; y < h; y++) {
		const row: (string | null)[] = [];
		for (let x = 0; x < w; x++) {
			const c = at(x, y);
			if (c) row.push(c);
			else if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1)) row.push(color);
			else row.push(null);
		}
		out.push(row);
	}
	return out;
}

export function gridOf(rows: string[], colors: Record<string, string>): Grid {
	const w = Math.max(...rows.map((r) => r.length));
	return rows.map((r) => Array.from({ length: w }, (_, x) => (r[x] && r[x] !== '.' ? (colors[r[x]] ?? null) : null)));
}

/** A string sprite. Cached by its content. */
export function sprite(rows: string[], colors: Record<string, string>, opts: { outline?: boolean } = {}): Img {
	const key = `s|${opts.outline ? 1 : 0}|${rows.join('/')}|${JSON.stringify(colors)}`;
	let img = cache.get(key);
	if (!img) {
		if (import.meta.env?.DEV && new Set(rows.map((r) => r.length)).size > 1)
			console.warn('Ragged sprite rows', rows);
		const grid = gridOf(rows, colors);
		img = toImg(opts.outline ? outlined(grid) : grid, opts.outline ? 1 : 0);
		cache.set(key, img);
	}
	return img;
}

/** Mirrors the left half of a symmetric sprite into a whole one. */
export const mirror = (half: string[]) => half.map((r) => r + [...r].reverse().join(''));

export type Pt = { x: number; y: number };

export class Painter {
	grid: Grid;
	constructor(
		public w: number,
		public h: number
	) {
		this.grid = Array.from({ length: h }, () => Array<string | null>(w).fill(null));
	}
	get(x: number, y: number) {
		return this.grid[Math.round(y)]?.[Math.round(x)] ?? null;
	}
	px(x: number, y: number, c: string | null) {
		x = Math.round(x);
		y = Math.round(y);
		if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.grid[y][x] = c;
		return this;
	}
	rect(x: number, y: number, w: number, h: number, c: string | null) {
		for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c);
		return this;
	}
	hline(x: number, y: number, w: number, c: string) {
		return this.rect(x, y, w, 1, c);
	}
	vline(x: number, y: number, h: number, c: string) {
		return this.rect(x, y, 1, h, c);
	}
	/** Filled ellipse inside the box (x, y, w, h). */
	ellipse(x: number, y: number, w: number, h: number, c: string) {
		const rx = w / 2;
		const ry = h / 2;
		for (let j = 0; j < h; j++)
			for (let i = 0; i < w; i++) {
				const dx = (i + 0.5 - rx) / rx;
				const dy = (j + 0.5 - ry) / ry;
				if (dx * dx + dy * dy <= 1) this.px(x + i, y + j, c);
			}
		return this;
	}
	/** Filled polygon: every pixel whose centre is inside. */
	poly(pts: Pt[], c: string) {
		const xs = pts.map((p) => p.x);
		const ys = pts.map((p) => p.y);
		const x0 = Math.max(0, Math.floor(Math.min(...xs)));
		const x1 = Math.min(this.w - 1, Math.ceil(Math.max(...xs)));
		const y0 = Math.max(0, Math.floor(Math.min(...ys)));
		const y1 = Math.min(this.h - 1, Math.ceil(Math.max(...ys)));
		for (let y = y0; y <= y1; y++)
			for (let x = x0; x <= x1; x++) {
				const px = x + 0.5;
				const py = y + 0.5;
				let inside = false;
				for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
					const a = pts[i];
					const b = pts[j];
					if (a.y > py !== b.y > py && px < ((b.x - a.x) * (py - a.y)) / (b.y - a.y) + a.x) inside = !inside;
				}
				if (inside) this.grid[y][x] = c;
			}
		return this;
	}
	/** A 1px line. */
	line(a: Pt, b: Pt, c: string) {
		let x0 = Math.round(a.x);
		let y0 = Math.round(a.y);
		const x1 = Math.round(b.x);
		const y1 = Math.round(b.y);
		const dx = Math.abs(x1 - x0);
		const dy = -Math.abs(y1 - y0);
		const sx = x0 < x1 ? 1 : -1;
		const sy = y0 < y1 ? 1 : -1;
		let err = dx + dy;
		for (;;) {
			this.px(x0, y0, c);
			if (x0 === x1 && y0 === y1) break;
			const e2 = 2 * err;
			if (e2 >= dy) {
				err += dy;
				x0 += sx;
			}
			if (e2 <= dx) {
				err += dx;
				y0 += sy;
			}
		}
		return this;
	}
	/** Stamps a string sprite at (x, y). */
	stamp(x: number, y: number, rows: string[], colors: Record<string, string>) {
		rows.forEach((r, j) => [...r].forEach((ch, i) => ch !== '.' && colors[ch] && this.px(x + i, y + j, colors[ch])));
		return this;
	}
	/** Recolours every pixel of one colour that passes a test. */
	tint(from: string, to: string, test: (x: number, y: number) => boolean = () => true) {
		for (let y = 0; y < this.h; y++)
			for (let x = 0; x < this.w; x++) if (this.grid[y][x] === from && test(x, y)) this.grid[y][x] = to;
		return this;
	}
}

/** A painted image, cached by `key`. */
export function paint(key: string, w: number, h: number, draw: (p: Painter) => void, opts: { outline?: boolean } = {}) {
	const k = `p|${opts.outline ? 1 : 0}|${key}`;
	let img = cache.get(k);
	if (!img) {
		const p = new Painter(w, h);
		draw(p);
		img = toImg(opts.outline ? outlined(p.grid) : p.grid, opts.outline ? 1 : 0);
		cache.set(k, img);
	}
	return img;
}
