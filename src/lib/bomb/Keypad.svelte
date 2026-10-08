<script lang="ts">
	import type { KeypadSymbol } from '../../../convex/bomb';
	import { sfx } from '#lib/sound.svelte.ts';
	import { SYMBOL_ICON } from './symbols.ts';

	let {
		symbols,
		pressed,
		disabled = false,
		onpress
	}: {
		symbols: string[];
		pressed: number[];
		disabled?: boolean;
		onpress: (key: number) => void;
	} = $props();
</script>

<div class="keypad">
	{#each symbols as symbol, i (i)}
		{@const Icon = SYMBOL_ICON[symbol as KeypadSymbol]}
		{@const done = pressed.includes(i)}
		<button
			class="key"
			class:done
			disabled={disabled || done}
			aria-label="Key {i + 1}{done ? ', pressed' : ''}"
			onclick={() => {
				sfx.blip();
				onpress(i);
			}}
		>
			<span class="led" aria-hidden="true"></span>
			<Icon weight="bold" size="2.2rem" />
		</button>
	{/each}
</div>

<style>
	.keypad {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.6rem;
		max-width: 15rem;
		margin: 0 auto;
	}

	.key {
		position: relative;
		display: grid;
		place-items: center;
		aspect-ratio: 1.15;
		padding: 0.9rem 0 0.4rem;
		border: var(--border) solid #d6cfb8;
		border-bottom-width: calc(var(--border) + var(--depth));
		border-radius: var(--radius-sm);
		background: #f6f0dc;
		color: #3a3326;
		cursor: pointer;
		touch-action: manipulation;
		transition:
			transform 0.06s ease,
			border-bottom-width 0.06s ease;
	}

	.key:active:not(:disabled),
	.key.done {
		transform: translateY(var(--depth));
		border-bottom-width: var(--border);
	}

	.key:disabled {
		cursor: default;
	}

	.led {
		position: absolute;
		top: 0.4rem;
		left: 50%;
		translate: -50% 0;
		width: 1.4rem;
		height: 0.35rem;
		border-radius: 0;
		background: #16231c;
	}

	.done .led {
		background: var(--green);
		box-shadow: 0 0 8px var(--green);
	}
</style>
