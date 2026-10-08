<script lang="ts">
	// A burger: layers stacked bottom to top on a plate. New layers drop in with a bounce.
	import { backOut } from 'svelte/easing';
	import type { Layer } from '../../../convex/burger/ingredients';
	import Ingredient from './Ingredient.svelte';

	let {
		layers,
		animate = false,
		sketch = false,
		plate = true,
		empty = 'Empty plate'
	}: {
		layers: Layer[];
		/** Drop new layers in (the chef's live burger). */
		animate?: boolean;
		/** Draw it like a child's crayon drawing. */
		sketch?: boolean;
		plate?: boolean;
		/** Shown on an empty plate. */
		empty?: string;
	} = $props();

	const uid = $props.id();

	function drop(_node: Element, { enabled }: { enabled: boolean }) {
		if (!enabled) return { duration: 0 };
		return {
			duration: 420,
			css: (t: number) => {
				const e = backOut(t);
				// A little squash as it lands.
				const squash = 1 - 0.22 * Math.sin(Math.PI * Math.max(0, (t - 0.55) / 0.45));
				return `transform: translateY(${(1 - e) * -140}px) scaleY(${squash}); opacity: ${Math.min(1, t * 3)}`;
			}
		};
	}

	function lift(_node: Element, { enabled }: { enabled: boolean }) {
		if (!enabled) return { duration: 0 };
		return { duration: 180, css: (t: number) => `transform: translateY(${(1 - t) * -40}px); opacity: ${t}` };
	}
</script>

<div class="burger" class:sketch style={sketch ? `filter: url(#crayon-${uid})` : ''}>
	{#if sketch}
		<svg width="0" height="0" aria-hidden="true" class="defs">
			<filter id="crayon-{uid}">
				<feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="3" />
				<feDisplacementMap in="SourceGraphic" scale="5" />
			</filter>
		</svg>
	{/if}
	<div class="layers">
		{#each layers as layer, i (`${i}:${layer.ing}:${layer.state ?? ''}`)}
			<div class="layer" in:drop={{ enabled: animate }} out:lift={{ enabled: animate }}>
				<Ingredient {layer} />
			</div>
		{/each}
		{#if !layers.length && empty}
			<p class="empty">{empty}</p>
		{/if}
	</div>
	{#if plate}
		<div class="plate" aria-hidden="true"></div>
	{/if}
</div>

<style>
	.burger {
		position: relative;
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.defs {
		position: absolute;
	}

	.layers {
		width: 84%;
		display: flex;
		flex-direction: column-reverse;
		align-items: stretch;
		position: relative;
		z-index: 1;
	}

	/* Layers overlap a touch so the burger looks squashed together. */
	.layer {
		margin-top: -1.6%;
		transform-origin: bottom center;
	}

	.layer:first-child {
		margin-top: 0;
	}

	.empty {
		margin: 0 0 4%;
		text-align: center;
		color: var(--hare);
		font-weight: 800;
		font-size: 0.85rem;
	}

	.plate {
		width: 100%;
		aspect-ratio: 10 / 1;
		margin-top: -3%;
		border-radius: 0;
		background: var(--snow);
		border: var(--border) solid var(--swan);
		border-bottom-width: calc(var(--border) + 3px);
	}

	.sketch .plate {
		background: none;
		border-style: dashed;
	}
</style>
