<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Props = HTMLButtonAttributes & {
		selected?: boolean;
		children: Snippet;
	};

	let { selected = false, children, class: className = '', ...rest }: Props = $props();
</script>

<!-- A pressable answer option, like Duolingo's multiple-choice tiles. -->
<button type="button" {...rest} class="tile {className}" class:selected aria-pressed={selected}>
	{@render children()}
</button>

<style>
	.tile {
		display: grid;
		place-items: center;
		padding: 0.6rem;
		border: var(--border) solid var(--swan);
		border-bottom-width: calc(var(--border) + var(--depth));
		border-radius: var(--radius);
		background: var(--snow);
		font-weight: 800;
		cursor: pointer;
		touch-action: manipulation;
		transition:
			transform 0.08s ease,
			border-bottom-width 0.08s ease,
			background 0.15s ease;
	}

	@media (hover: hover) {
		.tile:hover:not(:disabled) {
			background: var(--polar);
		}
	}

	.tile:active:not(:disabled) {
		transform: translateY(var(--depth));
		border-bottom-width: var(--border);
	}

	.selected {
		border-color: var(--blue);
		border-bottom-color: var(--blue-shade);
		background: var(--blue-light);
		color: var(--blue-shade);
	}

	.tile:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
