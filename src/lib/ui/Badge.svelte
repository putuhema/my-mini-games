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

<span class="badge" class:solid style="--c: var(--{color}); --c-light: var(--{color}-light)">
	{@render children()}
</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.2rem 0.65rem;
		border-radius: 999px;
		background: var(--c-light);
		color: var(--c);
		font-size: 0.75rem;
		font-weight: 900;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		white-space: nowrap;
	}

	.solid {
		background: var(--c);
		color: var(--snow);
	}
</style>
