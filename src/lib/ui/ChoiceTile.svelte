<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Props = HTMLButtonAttributes & {
		selected?: boolean;
		children: Snippet;
	};

	let { selected = false, children, class: className = '', ...rest }: Props = $props();
</script>

<!-- A pressable answer option: a pixel-framed tile that lights up when picked. -->
<button type="button" {...rest} class="tile {className}" class:selected aria-pressed={selected}>
	{@render children()}
</button>

<style>
	.tile {
		--frame: var(--vine);
		display: grid;
		place-items: center;
		padding: 0.6rem;
		border: none;
		background: var(--moss);
		color: var(--sage);
		box-shadow:
			0 0 0 2px var(--gap),
			0 0 0 4px var(--frame),
			0 var(--depth) 0 4px var(--root);
		cursor: pointer;
		touch-action: manipulation;
		transition: transform 0.1s var(--snap);
	}

	@media (hover: hover) {
		.tile:hover:not(:disabled) {
			--frame: var(--mint);
			color: var(--dew);
		}
	}

	.tile:active:not(:disabled) {
		transform: translateY(3px);
		box-shadow:
			0 0 0 2px var(--gap),
			0 0 0 4px var(--frame),
			0 1px 0 4px var(--root);
	}

	.selected {
		--frame: var(--mint);
		background: var(--mint-light);
		color: var(--mint);
		box-shadow:
			0 0 0 2px var(--gap),
			0 0 0 4px var(--frame),
			0 var(--depth) 0 4px var(--lip-hot),
			0 0 14px var(--glow-mint);
	}

	.tile:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
