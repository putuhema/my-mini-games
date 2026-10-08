<script lang="ts">
	import { COAT_LABEL, COATS, type Coat } from '../../../convex/creature/world';
	import { cat } from './art';
	import Pixel from './Pixel.svelte';

	/** `random` keeps it a surprise until the box opens. */
	let { coat = $bindable() }: { coat: Coat | 'random' } = $props();
</script>

<div class="picker">
	<span class="label">Which kitten is in the box?</span>
	<div class="grid" role="radiogroup" aria-label="Kitten">
		{#each COATS as c (c)}
			<button
				type="button"
				role="radio"
				aria-checked={coat === c}
				title={COAT_LABEL[c]}
				aria-label={COAT_LABEL[c]}
				onclick={() => (coat = c)}
			>
				<Pixel img={cat(c, 'kitten', undefined, { pose: 'sit', eyes: 'open', mouth: 'smile' })} scale={3} trim />
			</button>
		{/each}
		<button type="button" class="surprise" role="radio" aria-checked={coat === 'random'} onclick={() => (coat = 'random')}>
			?
		</button>
	</div>
	<p class="muted small">{coat === 'random' ? "It's a surprise." : COAT_LABEL[coat]}</p>
</div>

<style>
	.picker {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.picker .label {
		margin: 0;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.5rem;
	}

	button {
		display: grid;
		place-items: center;
		height: 3.6rem;
		padding: 0;
		overflow: hidden;
		border: 0;
		background: var(--moss);
		box-shadow: 0 0 0 2px var(--vine);
		cursor: pointer;
	}

	.surprise {
		place-items: center;
		font-size: 2rem;
		color: var(--pink);
	}

	button[aria-checked='true'] {
		background: var(--pink-light);
		box-shadow:
			0 0 0 2px var(--gap),
			0 0 0 4px var(--pink);
	}

	.small {
		margin: 0;
		font-size: 1rem;
	}
</style>
