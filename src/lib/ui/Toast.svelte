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
		top: calc(0.75rem + env(safe-area-inset-top));
		left: 50%;
		z-index: 30;
		translate: -50% 0;
		width: max-content;
		max-width: calc(100vw - 1.5rem);
		display: flex;
		align-items: center;
		gap: 0.65rem;
		padding: 0.5rem 1rem 0.5rem 0.5rem;
		border: var(--border) solid var(--c);
		border-bottom-width: calc(var(--border) + var(--depth));
		border-bottom-color: var(--c-shade);
		border-radius: 999px;
		background: var(--c-light);
		color: var(--c-shade);
		animation: drop 0.4s var(--ease-spring);
	}

	.icon {
		width: 2.3rem;
		height: 2.3rem;
		flex-shrink: 0;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--snow);
		animation: pop 0.45s 0.12s var(--ease-spring) backwards;
	}

	.text {
		display: flex;
		flex-direction: column;
		min-width: 0;
		line-height: 1.25;
	}

	strong {
		font-size: 0.95rem;
		font-weight: 900;
	}

	.body {
		font-size: 0.82rem;
		font-weight: 800;
		opacity: 0.9;
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
