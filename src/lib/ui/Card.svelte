<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	type Props = HTMLAttributes<HTMLElement> & {
		/** Tint the card with a colour family, e.g. 'green' or 'p1'. */
		tone?: string;
		/** Lift on hover, for clickable cards. */
		interactive?: boolean;
		href?: string;
		children: Snippet;
	};

	let { tone, interactive = false, href, children, class: className = '', ...rest }: Props =
		$props();

	const toneStyle = $derived(
		tone ? `--card-border: var(--${tone}); --card-bg: var(--${tone}-light);` : ''
	);
</script>

{#if href}
	<a {href} class="card interactive {className}" style={toneStyle}>
		{@render children()}
	</a>
{:else}
	<div {...rest} class="card {className}" class:interactive style={toneStyle}>
		{@render children()}
	</div>
{/if}

<style>
	.card {
		display: block;
		padding: 1.25rem;
		border: var(--border) solid var(--card-border, var(--swan));
		border-bottom-width: calc(var(--border) + var(--depth));
		border-radius: var(--radius-lg);
		background: var(--card-bg, var(--snow));
		text-decoration: none;
		color: inherit;
	}

	.interactive {
		cursor: pointer;
		transition:
			transform 0.12s ease,
			border-bottom-width 0.12s ease,
			margin-top 0.12s ease;
	}

	.interactive:active {
		transform: translateY(var(--depth));
		border-bottom-width: var(--border);
	}

	@media (hover: hover) {
		.interactive:hover {
			background: var(--card-bg, var(--polar));
			filter: brightness(0.99);
		}
	}
</style>
