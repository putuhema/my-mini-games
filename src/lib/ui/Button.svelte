<script lang="ts" module>
	export type ButtonVariant =
		| 'primary'
		| 'secondary'
		| 'danger'
		| 'gold'
		| 'super'
		| 'outline'
		| 'ghost';
	export type ButtonSize = 'sm' | 'md' | 'lg';
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Props = HTMLButtonAttributes & {
		variant?: ButtonVariant;
		size?: ButtonSize;
		/** Stretch to the container width. */
		full?: boolean;
		/** Render as a link instead of a button. */
		href?: string;
		children: Snippet;
	};

	let {
		variant = 'primary',
		size = 'md',
		full = false,
		href,
		children,
		class: className = '',
		...rest
	}: Props = $props();
</script>

{#if href}
	<a {href} class="btn {variant} {size} {className}" class:full>
		{@render children()}
	</a>
{:else}
	<button type="button" {...rest} class="btn {variant} {size} {className}" class:full>
		{@render children()}
	</button>
{/if}

<style>
	/* Filled buttons use a bevel fill: light strip on top, base, shade strip below. */
	.btn {
		--bg: var(--mint-fill);
		--hi: color-mix(in srgb, var(--bg) 50%, #fff);
		--lo: color-mix(in srgb, var(--bg) 62%, #000);
		--fg: var(--on-fill);

		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		min-height: 48px;
		padding: 0.1rem 1.4rem 0;
		border: none;
		background: linear-gradient(
			180deg,
			var(--hi) 0 4px,
			var(--bg) 4px calc(100% - 5px),
			var(--lo) calc(100% - 5px) 100%
		);
		color: var(--fg);
		box-shadow:
			0 0 0 2px var(--night),
			0 var(--depth) 0 2px var(--night);
		font-family: var(--font);
		font-size: 1.15rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		text-decoration: none;
		white-space: nowrap;
		cursor: pointer;
		user-select: none;
		touch-action: manipulation;
		transition:
			transform 0.1s var(--snap),
			filter 0.1s var(--snap);
	}

	/* Press: drop onto the lip. */
	.btn:active:not(:disabled) {
		transform: translateY(3px);
		box-shadow:
			0 0 0 2px var(--night),
			0 1px 0 2px var(--night);
	}

	@media (hover: hover) {
		.btn:hover:not(:disabled) {
			filter: brightness(1.1) drop-shadow(0 0 10px color-mix(in srgb, var(--bg) var(--glow-amt), transparent));
		}
	}

	.btn:focus-visible {
		outline: 2px solid var(--dew);
		outline-offset: 6px;
	}

	.btn:disabled {
		--bg: var(--ring-off);
		--hi: var(--vine);
		--lo: var(--root);
		--fg: var(--bog);
		cursor: not-allowed;
		filter: none;
	}

	/* Full-width buttons can sit in narrow columns, so let long labels wrap. */
	.full {
		width: 100%;
		white-space: normal;
		text-align: center;
		line-height: 1.05;
		letter-spacing: 0.08em;
	}

	.sm {
		min-height: 36px;
		padding: 0.1rem 0.9rem 0;
		font-size: 0.95rem;
	}

	.lg {
		min-height: 58px;
		padding: 0.1rem 2rem 0;
		font-size: 1.4rem;
		letter-spacing: 0.12em;
	}

	.secondary {
		--bg: var(--sky-fill);
	}

	.danger {
		--bg: var(--berry-fill);
	}

	.gold {
		--bg: var(--amber-fill);
	}

	.super {
		--bg: var(--pink-fill);
	}

	/* Outline: the quiet frame button. */
	.outline {
		--frame: var(--vine);
		background: var(--moss);
		color: var(--dew);
		box-shadow:
			0 0 0 2px var(--gap),
			0 0 0 4px var(--frame),
			0 var(--depth) 0 4px var(--root);
	}

	@media (hover: hover) {
		.outline:hover:not(:disabled) {
			--frame: var(--mint);
			filter: none;
			box-shadow:
				0 0 0 2px var(--gap),
				0 0 0 4px var(--frame),
				0 var(--depth) 0 4px var(--lip-hot),
				0 0 18px var(--glow-mint);
		}
	}

	.outline:active:not(:disabled) {
		box-shadow:
			0 0 0 2px var(--gap),
			0 0 0 4px var(--frame),
			0 1px 0 4px var(--root);
	}

	.ghost {
		background: transparent;
		color: var(--mint);
		box-shadow: none;
	}

	.ghost:active:not(:disabled) {
		box-shadow: none;
	}

	@media (hover: hover) {
		.ghost:hover:not(:disabled) {
			filter: none;
			text-shadow: 0 0 10px var(--glow-mint);
		}
	}

	.outline:disabled,
	.ghost:disabled {
		background: transparent;
		color: var(--bog);
		box-shadow: 0 0 0 2px var(--ring-off);
	}
</style>
