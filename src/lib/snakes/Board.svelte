<script lang="ts" module>
	/** Colour family per player index; use as `var(--p1)`, `var(--p1-shade)`, `var(--p1-light)`. */
	export const PLAYER_TONES = ['p1', 'p2'];
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { COLUMNS, DEFAULT_LAYOUT, type Layout } from '../../../convex/board';
	import { FlagCheckeredIcon, HeartIcon, TargetIcon } from '../icons/index.ts';
	import { sfx } from '../sound.svelte.ts';

	type Token = { id: string; name: string; position: number };
	let {
		players,
		highlight,
		moving = $bindable(false),
		columns = COLUMNS,
		layout = DEFAULT_LAYOUT
	}: {
		/** This game's snakes, ladders and heart tiles. */
		layout?: Layout;
		players: Token[];
		highlight?: number;
		moving?: boolean;
		/** Board width in tiles; use fewer columns for a tall layout on portrait phones. */
		columns?: number;
	} = $props();

	const size = $derived(layout.size);
	const rows = $derived(size / columns);

	/** Grid cell (col, row-from-top) for a tile, laid out boustrophedon from the bottom-left. */
	function cell(tile: number) {
		const idx = tile - 1;
		const rowFromBottom = Math.floor(idx / columns);
		const col = rowFromBottom % 2 === 0 ? idx % columns : columns - 1 - (idx % columns);
		return { col, row: rows - 1 - rowFromBottom };
	}

	type Point = { x: number; y: number };

	function center(tile: number): Point {
		// Tile 0 is the start, just off the left edge next to tile 1.
		if (tile === 0) return { x: -0.6, y: rows - 0.5 };
		const { col, row } = cell(tile);
		return { x: col + 0.5, y: row + 0.5 };
	}

	// Tiles in visual (top-left → bottom-right) order for the CSS grid.
	const tiles = $derived(
		Array.from({ length: size }, (_, i) => i + 1).sort((a, b) => {
			const ca = cell(a);
			const cb = cell(b);
			return ca.row - cb.row || ca.col - cb.col;
		})
	);

	const ladders = $derived(Object.entries(layout.ladders).map(([from, to]) => {
		const a = center(Number(from));
		const b = center(to);
		const len = Math.hypot(b.x - a.x, b.y - a.y);
		const nx = (-(b.y - a.y) / len) * 0.16;
		const ny = ((b.x - a.x) / len) * 0.16;
		const rungCount = Math.max(2, Math.round(len / 0.32));
		const rungs = Array.from({ length: rungCount }, (_, i) => {
			const t = (i + 0.5) / rungCount;
			const x = a.x + (b.x - a.x) * t;
			const y = a.y + (b.y - a.y) * t;
			return { x1: x - nx, y1: y - ny, x2: x + nx, y2: y + ny };
		});
		return { a, b, nx, ny, rungs, key: from };
	}));

	const snakes = $derived(Object.entries(layout.snakes).map(([from, to]) => {
		const h = center(Number(from));
		const t = center(to);
		const dx = t.x - h.x;
		const dy = t.y - h.y;
		const len = Math.hypot(dx, dy);
		// Gentle curve: the layout generator guarantees straight paths don't cross, so keep snakes close to them.
		const wiggle = Math.min(0.3, len * 0.12);
		const px = (-dy / len) * wiggle;
		const py = (dx / len) * wiggle;
		const c1 = { x: h.x + dx * 0.33 + px, y: h.y + dy * 0.33 + py };
		const c2 = { x: h.x + dx * 0.66 - px, y: h.y + dy * 0.66 - py };
		const d = `M ${h.x} ${h.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${t.x} ${t.y}`;
		return { d, h, t, c1, c2, key: from };
	}));
	const snakeByHead = $derived(new Map(snakes.map((s) => [Number(s.key), s])));

	// ---- Token movement ----

	type Rendered = Point & { tile: number; lift: number; squash: number };
	type Segment =
		| { kind: 'step'; from: number; to: number }
		| { kind: 'ladder' | 'snake' | 'jump'; from: number; to: number };

	const rendered = $state<Record<string, Rendered>>({});
	let activeAnimations = $state(0);
	const generation: Record<string, number> = {};
	const targets: Record<string, number> = {};
	const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

	$effect(() => {
		moving = activeAnimations > 0;
	});

	// The layout changed shape: snap every token onto its tile in the new grid.
	let laidOutColumns = untrack(() => columns);
	$effect(() => {
		const c = columns;
		untrack(() => {
			if (c === laidOutColumns) return;
			laidOutColumns = c;
			for (const id of Object.keys(rendered)) {
				generation[id] = (generation[id] ?? 0) + 1;
				place(id, targets[id] ?? rendered[id].tile);
			}
		});
	});

	$effect(() => {
		for (const p of players) {
			const target = p.position;
			untrack(() => moveToken(p.id, target));
		}
	});

	/** Break a position change into animated segments: dice steps, bounces, ladders, snakes. */
	function plan(from: number, to: number): Segment[] {
		if (layout.ladders[from] === to) return [{ kind: 'ladder', from, to }];
		if (layout.snakes[from] === to) return [{ kind: 'snake', from, to }];
		const steps = (a: number, b: number) => {
			const dir = Math.sign(b - a);
			return Array.from({ length: Math.abs(b - a) }, (_, i) => ({
				kind: 'step' as const,
				from: a + dir * i,
				to: a + dir * (i + 1)
			}));
		};
		if (to > from && to - from <= 6) return steps(from, to);
		// A few steps that end on a ladder or snake (e.g. a guess bonus): hop, then climb or slide.
		for (let k = 1; k <= 6 && from + k < size; k++) {
			const mid = from + k;
			if (layout.ladders[mid] === to) return [...steps(from, mid), { kind: 'ladder', from: mid, to }];
			if (layout.snakes[mid] === to) return [...steps(from, mid), { kind: 'snake', from: mid, to }];
		}
		// Overshot the finish and bounced back.
		if (to < from && to > 0 && 2 * size - from - to <= 6) {
			return [...steps(from, size), ...steps(size, to)];
		}
		return [{ kind: 'jump', from, to }];
	}

	function place(id: string, tile: number) {
		rendered[id] = { ...center(tile), tile, lift: 0, squash: 0 };
	}

	async function moveToken(id: string, target: number) {
		if (targets[id] === target) return;
		targets[id] = target;
		const current = rendered[id];
		if (!current || reducedMotion) return place(id, target);

		// A newer move cancels any walk still in progress.
		const gen = (generation[id] = (generation[id] ?? 0) + 1);
		const segments = plan(current.tile, target);
		activeAnimations++;
		try {
			let hop = 0;
			for (const seg of segments) {
				if (seg.kind === 'ladder') sfx.ladder();
				if (seg.kind === 'snake') sfx.snake();
				const ok = await animateSegment(id, seg, gen);
				if (!ok) return;
				if (seg.kind === 'step') sfx.step(hop++);
			}
		} finally {
			activeAnimations--;
		}
	}

	const DURATION = { step: 300, ladder: 900, snake: 1100, jump: 550 };
	const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
	const easeIn = (t: number) => t * t * t;

	function pathPoint(seg: Segment, t: number): Point {
		const a = center(seg.from);
		const b = center(seg.to);
		const snake = seg.kind === 'snake' ? snakeByHead.get(seg.from) : undefined;
		if (snake) {
			const u = 1 - t;
			return {
				x: u ** 3 * a.x + 3 * u * u * t * snake.c1.x + 3 * u * t * t * snake.c2.x + t ** 3 * b.x,
				y: u ** 3 * a.y + 3 * u * u * t * snake.c1.y + 3 * u * t * t * snake.c2.y + t ** 3 * b.y
			};
		}
		return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
	}

	function animateSegment(id: string, seg: Segment, gen: number) {
		const duration = DURATION[seg.kind];
		const ease = seg.kind === 'snake' ? easeIn : easeInOut;
		const hop = seg.kind === 'step' ? 0.45 : seg.kind === 'jump' ? 0.8 : 0;
		return new Promise<boolean>((resolve) => {
			const start = performance.now();
			const frame = (now: number) => {
				if (generation[id] !== gen) return resolve(false);
				const raw = Math.min(1, (now - start) / duration);
				const t = ease(raw);
				const p = pathPoint(seg, t);
				rendered[id] = {
					...p,
					tile: raw === 1 ? seg.to : seg.from,
					lift: Math.sin(Math.PI * raw) * hop,
					// Squash briefly as the token touches down.
					squash: raw > 0.85 && hop ? (raw - 0.85) / 0.15 : 0
				};
				if (raw < 1) requestAnimationFrame(frame);
				else setTimeout(() => resolve(true), seg.kind === 'step' ? 40 : 120);
			};
			requestAnimationFrame(frame);
		});
	}

	function tokenStyle(id: string, index: number) {
		const r = rendered[id];
		const shared = players.some((p) => p.id !== id && rendered[p.id]?.tile === r.tile);
		const offset = shared && r.tile > 0 ? (index === 0 ? -0.2 : 0.2) : 0;
		const squash = Math.sin(Math.PI * r.squash) * 0.18;
		return [
			`left: ${((r.x + offset) / columns) * 100}%`,
			`top: ${(r.y / rows) * 100}%`,
			// Lift is in tiles; a tile is 10/7 of the token's size.
			`--lift: ${r.lift * (100 / 0.7)}%`,
			`--sx: ${1 + squash}`,
			`--sy: ${1 - squash}`,
			`--c: var(--${PLAYER_TONES[index]})`,
			`--c-shade: var(--${PLAYER_TONES[index]}-shade)`
		].join('; ');
	}
</script>

<div class="board" style="--cols: {columns}; --rows: {rows}">
	<div class="grid">
		{#each tiles as tile (tile)}
			<div
				class="tile"
				class:alt={(cell(tile).col + cell(tile).row) % 2 === 1}
				class:ladder={layout.ladders[tile]}
				class:snake={layout.snakes[tile]}
				class:finish={tile === size}
				class:heart={layout.hearts.includes(tile)}
				class:guess={layout.guess.includes(tile)}
				class:highlight={tile === highlight}
			>
				{#if tile === size}
					<span aria-label="Finish"><FlagCheckeredIcon weight="fill" size="1.9em" /></span>
				{:else if layout.guess.includes(tile)}
					<span class="heart-label" title="Guess-my-answer tile">
						{tile}<TargetIcon weight="fill" size="1.1em" />
					</span>
				{:else if layout.hearts.includes(tile)}
					<span class="heart-label" title="Secret question tile">
						{tile}<HeartIcon weight="fill" size="1.1em" />
					</span>
				{:else}
					<span>{tile}</span>
				{/if}
			</div>
		{/each}
	</div>

	<svg viewBox="0 0 {columns} {rows}" aria-hidden="true">
		{#each ladders as l (l.key)}
			<g class="ladder-art">
				<line x1={l.a.x - l.nx} y1={l.a.y - l.ny} x2={l.b.x - l.nx} y2={l.b.y - l.ny} />
				<line x1={l.a.x + l.nx} y1={l.a.y + l.ny} x2={l.b.x + l.nx} y2={l.b.y + l.ny} />
				{#each l.rungs as r, i (i)}
					<line class="rung" {...r} />
				{/each}
			</g>
		{/each}
		{#each snakes as s (s.key)}
			<g class="snake-art">
				<path class="body" d={s.d} />
				<path class="scales" d={s.d} />
				<circle class="head" cx={s.h.x} cy={s.h.y} r="0.19" />
				<circle class="eye" cx={s.h.x - 0.075} cy={s.h.y - 0.04} r="0.065" />
				<circle class="eye" cx={s.h.x + 0.075} cy={s.h.y - 0.04} r="0.065" />
				<circle class="pupil" cx={s.h.x - 0.06} cy={s.h.y - 0.03} r="0.032" />
				<circle class="pupil" cx={s.h.x + 0.09} cy={s.h.y - 0.03} r="0.032" />
			</g>
		{/each}
	</svg>

	{#each players as player, i (player.id)}
		{#if rendered[player.id]}
			<div
				class="token"
				class:airborne={rendered[player.id].lift > 0.05}
				style={tokenStyle(player.id, i)}
				title={player.name}
			>
				<span class="disc">{player.name.slice(0, 1).toUpperCase()}</span>
			</div>
		{/if}
	{/each}
</div>

<style>
	.board {
		position: relative;
		container-type: inline-size;
		width: 100%;
		aspect-ratio: var(--cols) / var(--rows);
		border-radius: var(--radius);
		overflow: hidden;
		box-shadow:
			0 0 0 var(--border) var(--swan),
			0 calc(var(--depth) + var(--border)) 0 var(--border) var(--swan);
	}

	.grid {
		position: absolute;
		inset: 0;
		display: grid;
		grid-template-columns: repeat(var(--cols), 1fr);
		grid-template-rows: repeat(var(--rows), 1fr);
	}

	.tile {
		position: relative;
		background: var(--snow);
		font-size: clamp(0.5rem, calc(100cqw / var(--cols) * 0.19), 1rem);
		font-weight: 900;
		color: var(--hare);
	}

	.tile span {
		position: absolute;
		top: 0.25em;
		left: 0.4em;
	}

	.tile.alt {
		background: var(--polar);
	}

	.tile.ladder {
		background: var(--gold-light);
		color: var(--gold-shade);
	}

	.tile.snake {
		background: var(--green-light);
		color: var(--green-shade);
	}

	.tile.heart {
		background: var(--pink-light);
		color: var(--pink-shade);
	}

	.tile.guess {
		background: var(--purple-light);
		color: var(--purple-shade);
	}

	.heart-label {
		display: inline-flex;
		align-items: center;
		gap: 0.15em;
	}

	.tile.finish {
		background: var(--gold);
	}

	.tile.finish span {
		inset: 0;
		display: grid;
		place-items: center;
		color: var(--eel);
	}

	.tile.highlight::after {
		content: '';
		position: absolute;
		inset: 2px;
		border-radius: var(--radius-sm);
		border: 3px solid var(--blue);
		background: color-mix(in srgb, var(--blue-light) 60%, transparent);
		animation: pulse 1.4s ease-in-out infinite;
	}

	@keyframes pulse {
		50% {
			opacity: 0.25;
		}
	}

	svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	.ladder-art line {
		stroke: var(--orange);
		stroke-width: 0.08;
		stroke-linecap: round;
	}

	.ladder-art .rung {
		stroke: var(--gold);
		stroke-width: 0.06;
	}

	.snake-art .body {
		fill: none;
		stroke: var(--green);
		stroke-width: 0.22;
		stroke-linecap: round;
	}

	.snake-art .scales {
		fill: none;
		stroke: #89e219;
		stroke-width: 0.07;
		stroke-dasharray: 0.05 0.15;
		stroke-linecap: round;
	}

	.snake-art .head {
		fill: var(--green-shade);
	}

	.snake-art .eye {
		fill: var(--snow);
	}

	.snake-art .pupil {
		fill: var(--eel);
	}

	.token {
		position: absolute;
		width: calc(70% / var(--cols));
		aspect-ratio: 1;
		translate: -50% -50%;
		z-index: 1;
	}

	.token.airborne {
		z-index: 2;
	}

	/* Ground shadow stays put while the disc hops above it. */
	.token::before {
		content: '';
		position: absolute;
		inset: 70% 10% -12%;
		border-radius: 50%;
		background: radial-gradient(rgba(0, 0, 0, 0.3), transparent 70%);
	}

	.disc {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--c);
		color: var(--snow);
		font-weight: 900;
		font-size: calc(100cqw / var(--cols) * 0.3);
		border: 2px solid var(--snow);
		box-shadow: 0 3px 0 var(--c-shade);
		transform-origin: 50% 100%;
		transform: translateY(calc(var(--lift) * -1)) scale(var(--sx), var(--sy));
	}
</style>
