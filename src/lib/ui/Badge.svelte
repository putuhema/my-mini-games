<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		color = 'blue',
		solid = false,
		children
	}: {
		/** Colour family name. */
		color?: string;
		/** Filled background instead of a light tint. */
		solid?: boolean;
		children: Snippet;
	} = $props();
</script>

<span class="badge" class:solid style="--c: var(--{color}); --c-light: var(--{color}-light); --c-fill: var(--{color}-fill)">
	{@render children()}
</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.2rem 0.6rem 0.1rem;
		background: var(--c-light);
		color: var(--c);
		box-shadow: 0 0 0 2px var(--c);
		font-size: 0.85rem;
		letter-spacing: 0.12em;
		line-height: 1.1;
		text-transform: uppercase;
		white-space: nowrap;
		text-shadow: 0 0 8px color-mix(in srgb, var(--c) var(--glow-amt), transparent);
	}

	.solid {
		background: var(--c-fill);
		color: var(--on-fill);
		box-shadow: 0 0 0 2px var(--night);
		text-shadow: none;
	}
</style>
