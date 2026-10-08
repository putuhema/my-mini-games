<script lang="ts">
	import { sfx } from '#lib/sound.svelte.ts';

	let {
		wires,
		cut,
		disabled = false,
		oncut
	}: {
		wires: string[];
		cut: number[];
		disabled?: boolean;
		oncut: (wire: number) => void;
	} = $props();
</script>

<div class="wires">
	{#each wires as color, i (i)}
		{@const isCut = cut.includes(i)}
		<button
			class="wire"
			class:cut={isCut}
			style="--w: var(--wire-{color})"
			disabled={disabled || isCut}
			aria-label="{color} wire {i + 1}{isCut ? ', cut' : ''}"
			onclick={() => {
				sfx.snip();
				oncut(i);
			}}
		>
			<span class="post"></span>
			<span class="strand left"></span>
			<span class="strand right"></span>
			<span class="post"></span>
		</button>
	{/each}
</div>

<style>
	.wires {
		--wire-red: var(--red);
		--wire-blue: var(--blue);
		--wire-yellow: var(--gold);
		--wire-white: #f4f4f4;
		--wire-black: #262626;

		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding: 0.2rem 0;
	}

	.wire {
		display: flex;
		align-items: center;
		height: 2.1rem;
		padding: 0;
		border: none;
		background: none;
		cursor: crosshair;
		touch-action: manipulation;
	}

	.post {
		width: 0.9rem;
		height: 1.3rem;
		flex-shrink: 0;
		border-radius: 0;
		background: #7f998b;
		box-shadow: inset 0 -3px 0 #5a7366;
	}

	.strand {
		flex: 1;
		height: 0.7rem;
		background: var(--w);
		box-shadow:
			inset 0 -3px 0 rgb(0 0 0 / 0.22),
			0 0 0 1.5px rgb(0 0 0 / 0.35);
		transition:
			transform 0.25s var(--ease-spring),
			flex 0.2s ease;
	}

	@media (hover: hover) {
		.wire:hover:not(:disabled) .strand {
			filter: brightness(1.12);
			height: 0.85rem;
		}
	}

	/* A cut wire springs apart and droops. */
	.cut .strand.left {
		flex: 0.82;
		transform-origin: left center;
		transform: rotate(7deg);
		border-radius: 0 6px 6px 0;
	}

	.cut .strand.right {
		flex: 0.82;
		margin-left: 18%;
		transform-origin: right center;
		transform: rotate(-7deg);
		border-radius: 6px 0 0 6px;
	}

	.wire:disabled {
		cursor: default;
	}
</style>
