<script lang="ts">
	import { HAIRS, SHIRTS, type Hair, type Shirt } from '../../../convex/creature/world';
	import { character, SHIRT_COLOR } from './art';
	import Pixel from './Pixel.svelte';

	let { shirt = $bindable(), hair = $bindable() }: { shirt: Shirt; hair: Hair } = $props();

	const HAIR_LABEL: Record<Hair, string> = { short: 'Short hair', long: 'Long hair', bun: 'Bun' };
</script>

<div class="picker">
	<div class="preview" aria-hidden="true">
		<Pixel img={character({ shirt, hair }, 'down')} scale={5} />
	</div>
	<div class="options">
		<span class="label">Your look</span>
		<div class="row" role="radiogroup" aria-label="Shirt colour">
			{#each SHIRTS as s (s)}
				<button
					type="button"
					class="swatch"
					role="radio"
					aria-checked={shirt === s}
					aria-label={s}
					style="--c: {SHIRT_COLOR[s][0]}; --s: {SHIRT_COLOR[s][1]}"
					onclick={() => (shirt = s)}
				></button>
			{/each}
		</div>
		<div class="row" role="radiogroup" aria-label="Hair">
			{#each HAIRS as h (h)}
				<button
					type="button"
					class="hair"
					role="radio"
					aria-checked={hair === h}
					title={HAIR_LABEL[h]}
					aria-label={HAIR_LABEL[h]}
					onclick={() => (hair = h)}
				>
					<Pixel img={character({ shirt, hair: h }, 'down')} scale={2} />
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
	.picker {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.preview {
		display: grid;
		place-items: center;
		width: 5.5rem;
		height: 6.5rem;
		background: var(--well);
		box-shadow: inset 0 2px 0 var(--well-shadow);
	}

	.options {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.options .label {
		margin: 0;
	}

	.row {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.swatch {
		width: 1.8rem;
		height: 1.8rem;
		border: 0;
		padding: 0;
		background: linear-gradient(180deg, var(--c) 0 65%, var(--s) 65%);
		box-shadow: 0 0 0 2px var(--night);
		cursor: pointer;
	}

	.hair {
		display: grid;
		place-items: center;
		width: 2.6rem;
		height: 2.8rem;
		padding: 0;
		border: 0;
		background: var(--moss);
		box-shadow: 0 0 0 2px var(--vine);
		cursor: pointer;
	}

	.swatch[aria-checked='true'],
	.hair[aria-checked='true'] {
		box-shadow:
			0 0 0 2px var(--gap),
			0 0 0 4px var(--mint);
	}
</style>
