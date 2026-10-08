<script lang="ts">
	import type { Snippet } from 'svelte';
	import { XIcon } from '#lib/icons/index.ts';

	let {
		title,
		onclose,
		wide = false,
		children
	}: {
		title: string;
		/** Leave out to make the dialog undismissable. */
		onclose?: () => void;
		wide?: boolean;
		children: Snippet;
	} = $props();

	function keydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && onclose) onclose();
	}
</script>

<svelte:window onkeydown={keydown} />

<div class="backdrop" role="presentation" onclick={(e) => e.target === e.currentTarget && onclose?.()}>
	<div class="dialog px-corners" class:wide role="dialog" aria-modal="true" aria-label={title}>
		<header>
			<h2>{title}</h2>
			{#if onclose}
				<button class="close" onclick={onclose} aria-label="Close"><XIcon weight="bold" size="1.3rem" /></button>
			{/if}
		</header>
		<div class="body">{@render children()}</div>
	</div>
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 40;
		display: grid;
		place-items: center;
		padding: 1rem;
		background: color-mix(in srgb, var(--night) 55%, transparent);
		animation: fade 0.2s steps(3, end);
	}

	.dialog {
		width: min(440px, 100%);
		max-height: calc(100dvh - 2rem);
		display: flex;
		flex-direction: column;
		background: var(--canopy);
		box-shadow: inset 0 0 0 3px var(--vine);
		animation: rise 0.3s var(--ease-spring);
	}

	.dialog.wide {
		width: min(560px, 100%);
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 1rem 1rem 0.25rem 1.25rem;
	}

	h2 {
		font-size: 1.6rem;
	}

	.close {
		display: grid;
		place-items: center;
		width: 2.2rem;
		height: 2.2rem;
		border: 0;
		background: none;
		color: var(--sage);
		cursor: pointer;
	}

	.body {
		padding: 0.5rem 1.25rem 1.25rem;
		overflow-y: auto;
	}

	@keyframes fade {
		from {
			opacity: 0;
		}
	}

	@keyframes rise {
		from {
			transform: translateY(24px);
			opacity: 0;
		}
	}
</style>
