<script lang="ts" module>
	type Spot = {
		x: number;
		y: number;
		size: number;
		dx?: number;
		dy?: number;
		rotate?: number;
		/** Draw it again at these offsets too (one portion of noodles fills the bowl). */
		copies?: [number, number][];
	};

	/** Where each component sits on the sate plate (200×140), back to front. Repeats step by dx/dy. */
	const PLATE: Record<string, Spot> = {
		soup: { x: 146, y: 2, size: 50 },
		lontong: { x: 6, y: 34, size: 40, dx: 13, dy: 8 },
		sate: { x: 30, y: 14, size: 100, dx: 13, dy: 9 },
		kecap: { x: 62, y: 46, size: 62, rotate: -20 },
		peanut_sauce: { x: 70, y: 52, size: 54, dx: 8, dy: 4 },
		fried_shallot: { x: 76, y: 50, size: 44, dx: 10, dy: 2 },
		shallot: { x: 26, y: 84, size: 32, dx: 10 },
		cucumber: { x: 12, y: 64, size: 34, dx: 8, dy: 6 },
		sambal: { x: 136, y: 80, size: 30, dx: 12 },
		lime: { x: 152, y: 56, size: 32, dx: 6, dy: 8 }
	};

	/** Where each topping sits in the noodle bowl (200×150), back to front. */
	const BOWL: Record<string, Spot> = {
		noodles: { x: 22, y: 34, size: 56, copies: [[48, -4], [96, 2], [26, 14], [74, 12]] },
		bok_choy: { x: 26, y: 26, size: 42, dx: 12 },
		kecap: { x: 64, y: 40, size: 48 },
		chicken_topping: { x: 78, y: 32, size: 42, dx: 10 },
		wonton: { x: 128, y: 34, size: 36, dx: 12, dy: 6 },
		meatball: { x: 112, y: 44, size: 26, dx: 16, dy: -2 },
		fried_shallot: { x: 58, y: 48, size: 30, dx: 14 },
		green_onion: { x: 92, y: 50, size: 28, dx: 10 },
		sambal: { x: 152, y: 52, size: 22, dx: 8 }
	};
</script>

<script lang="ts">
	// Draws any dish: a burger stack, a sate plate or a noodle bowl.
	import { backOut } from 'svelte/easing';
	import { dish } from '../../../convex/burger/dishes';
	import { layerColors, type Layer } from '../../../convex/burger/ingredients';
	import Burger from './Burger.svelte';
	import Item from './Item.svelte';

	let {
		dish: dishId,
		layers,
		animate = false,
		sketch = false,
		empty = 'Empty plate'
	}: {
		/** Unset: the chef hasn't picked yet, so show an empty plate. */
		dish?: string;
		layers: Layer[];
		animate?: boolean;
		sketch?: boolean;
		empty?: string;
	} = $props();

	const uid = $props.id();
	const kind = $derived(dishId ? dishId : 'burger');

	/** Each component with its place: the nth of a kind steps along from the first. */
	function placed(spots: Record<string, Spot>) {
		const seen = new Map<string, number>();
		const items = layers.map((layer, i) => {
			const n = seen.get(layer.ing) ?? 0;
			seen.set(layer.ing, n + 1);
			const s = spots[layer.ing] ?? { x: 80, y: 40, size: 30 };
			return {
				key: `${layer.ing}:${n}:${layer.state ?? ''}`,
				layer,
				order: Object.keys(spots).indexOf(layer.ing),
				i,
				x: s.x + n * (s.dx ?? 6),
				y: s.y + n * (s.dy ?? 4),
				size: s.size,
				rotate: s.rotate ?? 0,
				copies: s.copies ?? []
			};
		});
		return items.sort((a, b) => a.order - b.order || a.i - b.i);
	}

	const plateItems = $derived(kind === 'sate' ? placed(PLATE) : []);
	const bowlItems = $derived(kind === 'noodle' ? placed(BOWL) : []);
	const hasBroth = $derived(layers.some((l) => l.ing === 'broth'));
	const broth = $derived(layerColors({ ing: 'broth' }));

	function pop(_node: Element, { enabled }: { enabled: boolean }) {
		if (!enabled) return { duration: 0 };
		return {
			duration: 380,
			css: (t: number) => `transform: translateY(${(1 - backOut(t)) * -30}px) scale(${0.4 + 0.6 * backOut(t)}); opacity: ${Math.min(1, t * 3)}`
		};
	}
</script>

{#if kind === 'burger'}
	<Burger {layers} {animate} {sketch} {empty} />
{:else}
	<div class="dish" style={sketch ? `filter: url(#crayon-${uid})` : ''} aria-label={dish(kind).label}>
		{#if sketch}
			<svg width="0" height="0" aria-hidden="true" class="defs">
				<filter id="crayon-{uid}">
					<feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="3" />
					<feDisplacementMap in="SourceGraphic" scale="4" />
				</filter>
			</svg>
		{/if}
		{#if kind === 'sate'}
			<svg viewBox="0 0 200 140" role="img" aria-label="Sate plate">
				<ellipse cx="100" cy="98" rx="96" ry="38" fill="#d9d1c3" />
				<ellipse cx="100" cy="94" rx="96" ry="38" fill="#f4efe6" />
				<path d="M20,94 C30,62 90,56 130,62 C170,68 186,88 176,104 C150,126 60,128 20,94 Z" fill="#3f9a3a" />
				<path d="M26,94 C70,84 130,84 172,98" stroke="#2e7a2a" stroke-width="2" fill="none" />
				{#each plateItems as it (it.key)}
					<g class="pop" in:pop={{ enabled: animate }}>
						<Item layer={it.layer} x={it.x} y={it.y} size={it.size} rotate={it.rotate} />
					</g>
				{/each}
			</svg>
		{:else}
			<svg viewBox="0 0 200 150" role="img" aria-label="Noodle bowl">
				<ellipse cx="100" cy="58" rx="90" ry="26" fill="#cfc6b6" />
				<ellipse cx="100" cy="60" rx="84" ry="22" fill={hasBroth ? broth[0] : '#e9e2d4'} />
				{#each bowlItems as it (it.key)}
					<g class="pop" in:pop={{ enabled: animate }}>
						<Item layer={it.layer} x={it.x} y={it.y} size={it.size} rotate={it.rotate} />
						{#each it.copies as [dx, dy] (`${dx}${dy}`)}
							<Item layer={it.layer} x={it.x + dx} y={it.y + dy} size={it.size} rotate={it.rotate} />
						{/each}
					</g>
				{/each}
				<!-- Bowl body, in front of the food -->
				<path d="M10,60 C14,104 50,140 100,140 C150,140 186,104 190,60 C170,84 30,84 10,60 Z" fill="#f4efe6" />
				<path d="M22,88 C50,104 150,104 178,88" stroke="#e3261b" stroke-width="5" fill="none" />
				<path d="M30,100 C60,114 140,114 170,100" stroke="#e3261b" stroke-width="2" fill="none" />
				<path d="M10,60 C30,84 170,84 190,60" stroke="#cfc6b6" stroke-width="3" fill="none" />
				<ellipse cx="100" cy="141" rx="36" ry="5" fill="#cfc6b6" />
			</svg>
		{/if}
		{#if !layers.length && empty}
			<p class="empty">{empty}</p>
		{/if}
	</div>
{/if}

<style>
	.dish {
		position: relative;
		width: 100%;
	}

	.defs {
		position: absolute;
	}

	svg {
		display: block;
		width: 100%;
		height: auto;
		overflow: visible;
	}

	.pop {
		transform-box: fill-box;
		transform-origin: center;
	}

	.empty {
		position: absolute;
		inset: 40% 0 auto;
		margin: 0;
		text-align: center;
		color: var(--hare);
		font-size: 0.85rem;
	}
</style>
