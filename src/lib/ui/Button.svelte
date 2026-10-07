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
	.btn {
		--bg: var(--green);
		--shade: var(--green-shade);
		--fg: var(--snow);

		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		min-height: 50px;
		padding: 0 1.4rem;
		border: none;
		border-radius: var(--radius);
		background: var(--bg);
		color: var(--fg);
		box-shadow: 0 var(--depth) 0 var(--shade);
		font-family: var(--font);
		font-size: 0.95rem;
		font-weight: 800;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		text-decoration: none;
		white-space: nowrap;
		cursor: pointer;
		user-select: none;
		touch-action: manipulation;
		transition:
			transform 0.08s ease,
			box-shadow 0.08s ease,
			filter 0.15s ease;
	}

	/* Press: drop onto the lip. */
	.btn:active:not(:disabled) {
		transform: translateY(var(--depth));
		box-shadow: 0 0 0 var(--shade);
	}

	@media (hover: hover) {
		.btn:hover:not(:disabled) {
			filter: brightness(1.06);
		}
	}

	.btn:disabled {
		--bg: var(--swan);
		--shade: var(--swan);
		--fg: var(--hare);
		cursor: not-allowed;
		box-shadow: none;
		transform: translateY(var(--depth));
	}

	.full {
		width: 100%;
	}

	.sm {
		min-height: 38px;
		padding: 0 0.9rem;
		font-size: 0.8rem;
		border-radius: var(--radius-sm);
	}

	.lg {
		min-height: 58px;
		padding: 0 2rem;
		font-size: 1.05rem;
	}

	.secondary {
		--bg: var(--blue);
		--shade: var(--blue-shade);
	}

	.danger {
		--bg: var(--red);
		--shade: var(--red-shade);
	}

	.gold {
		--bg: var(--gold);
		--shade: var(--gold-shade);
	}

	.super {
		--bg: var(--pink);
		--shade: var(--pink-shade);
	}

	.outline {
		--bg: var(--snow);
		--shade: var(--swan);
		--fg: var(--blue);
		border: var(--border) solid var(--swan);
	}

	.ghost {
		--bg: transparent;
		--shade: transparent;
		--fg: var(--blue);
	}

	.outline:disabled,
	.ghost:disabled {
		--bg: var(--snow);
	}
</style>
