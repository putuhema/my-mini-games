<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Icon as IconType } from '../icons/index.ts';

	let {
		tone = 'green',
		icon: Icon,
		iconTone,
		title,
		children
	}: {
		/** 'green' for good news, 'red' for setbacks, or any colour family. */
		tone?: string;
		icon?: IconType;
		/** Colour family for the icon; defaults to the toast tone. */
		iconTone?: string;
		title: string;
		children?: Snippet;
	} = $props();
</script>

<!-- A small notification that drops in from the top, clear of the game controls. -->
<div
	class="toast"
	role="status"
	style="--c: var(--{tone}); --c-shade: var(--{tone}-shade); --c-light: var(--{tone}-light)"
>
	{#if Icon}
		<span class="icon" aria-hidden="true" style="color: var(--{iconTone ?? tone})">
			<Icon weight="fill" size="1.4rem" />
		</span>
	{/if}
	<div class="text">
		<strong>{title}</strong>
		{#if children}<span class="body">{@render children()}</span>{/if}
	</div>
</div>

<style>
	.toast {
		position: fixed;
		top: calc(0.9rem + env(safe-area-inset-top));
		left: 50%;
		z-index: 30;
		translate: -50% 0;
		width: max-content;
		max-width: calc(100vw - 1.5rem);
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 1rem 0.5rem 0.5rem;
		background: var(--canopy);
		color: var(--c);
		box-shadow:
			0 0 0 2px var(--gap),
			0 0 0 4px var(--c),
			0 0 22px color-mix(in srgb, var(--c) var(--glow-amt), transparent),
			8px 8px 0 4px var(--hard);
		animation: drop 0.45s var(--ease-spring);
	}

	.icon {
		width: 2.4rem;
		height: 2.4rem;
		flex-shrink: 0;
		display: grid;
		place-items: center;
		background: var(--c-light);
		box-shadow: 0 0 0 2px var(--c);
		animation: pop 0.3s 0.12s steps(3, end) backwards;
	}

	.text {
		display: flex;
		flex-direction: column;
		min-width: 0;
		line-height: 1.15;
	}

	strong {
		color: var(--c);
		font-size: 1.15rem;
		letter-spacing: 0.06em;
		text-shadow: 0 0 10px color-mix(in srgb, var(--c) var(--glow-amt), transparent);
	}

	.body {
		color: var(--sage);
		font-size: 1rem;
	}

	@keyframes drop {
		from {
			opacity: 0;
			transform: translateY(-140%);
		}
	}

	@keyframes pop {
		from {
			transform: scale(0.3);
		}
	}
</style>
