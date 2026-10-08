<script lang="ts">
	// A single ingredient as a small picture, for the chef's ingredient tiles.
	import { ingredient, type Layer } from '../../../convex/burger/ingredients';
	import Ingredient from './Ingredient.svelte';
	import Item from './Item.svelte';

	let { layer }: { layer: Layer } = $props();
</script>

{#if ingredient(layer.ing).shape}
	<Ingredient {layer} crop />
{:else}
	<svg viewBox="0 0 40 40" role="img" aria-label={ingredient(layer.ing).label}>
		<Item {layer} />
	</svg>
{/if}

<style>
	svg {
		display: block;
		width: 100%;
		height: auto;
	}
</style>
