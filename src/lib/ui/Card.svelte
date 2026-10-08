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
	/* A raised panel: gap ring + frame ring. Interactive cards gain a lip and light up. */
	.card {
		--frame: var(--card-border, var(--vine));
		display: block;
		padding: 1.25rem;
		background: var(--card-bg, var(--canopy));
		box-shadow:
			0 0 0 2px var(--gap),
			0 0 0 4px var(--frame);
		text-decoration: none;
		color: inherit;
	}

	.interactive {
		cursor: pointer;
		box-shadow:
			0 0 0 2px var(--gap),
			0 0 0 4px var(--frame),
			0 var(--depth) 0 4px var(--root);
		transition: transform 0.1s var(--snap);
	}

	.interactive:active {
		transform: translateY(3px);
		box-shadow:
			0 0 0 2px var(--gap),
			0 0 0 4px var(--frame),
			0 1px 0 4px var(--root);
	}

	@media (hover: hover) {
		.interactive:hover {
			--frame: var(--mint);
			box-shadow:
				0 0 0 2px var(--gap),
				0 0 0 4px var(--frame),
				0 var(--depth) 0 4px var(--lip-hot),
				0 0 18px var(--glow-mint);
		}
	}

	.interactive:focus-visible {
		--frame: var(--mint);
		outline: none;
	}
</style>
