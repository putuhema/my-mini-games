<script lang="ts">
	import { ProgressBar } from '#lib/ui/index.ts';
	import {
		COAT_LABEL,
		dayOf,
		EVOLUTION_LABEL,
		NEED_LABEL,
		NEEDS,
		needsAt,
		NEXT_STAGE_DAY,
		STAGE_LABEL,
		type Coat,
		type Need
	} from '../../../convex/creature/world';
	import { cat } from './art';
	import Pixel from './Pixel.svelte';
	import { type PetView } from './room';

	let { pet, startedAt, now, status }: { pet: PetView; startedAt: number; now: number; status: string } = $props();

	const ICON: Record<Need, string> = { hunger: 'fish', happiness: 'heart', energy: 'bolt', cleanliness: 'drop' };
	const COLOR: Record<Need, string> = { hunger: 'orange', happiness: 'pink', energy: 'gold', cleanliness: 'blue' };

	// Needs move slowly, so a coarse clock is plenty here.
	const minute = $derived(Math.floor(now / 30_000) * 30_000);
	const needs = $derived(needsAt(pet, minute));
	const day = $derived(Math.max(1, dayOf(startedAt, now)));
	const next = $derived(NEXT_STAGE_DAY[pet.stage]);
	const stage = $derived(
		pet.stage === 'adult' && pet.evolution ? EVOLUTION_LABEL[pet.evolution] : STAGE_LABEL[pet.stage]
	);
	const portrait = $derived(
		cat(pet.coat as Coat, pet.stage === 'box' ? 'kitten' : pet.stage, pet.evolution, { pose: 'sit', eyes: 'open', mouth: 'smile' })
	);
</script>

<section class="panel" aria-label="{pet.name}'s needs">
	<header>
		<span class="portrait"><Pixel img={portrait} scale={3} trim /></span>
		<div>
			<p class="muted">{COAT_LABEL[pet.coat as Coat] ?? 'Cat'} · {stage} · Day {day}</p>
			<span class="status">{status}</span>
		</div>
	</header>

	{#if pet.stage !== 'box'}
		<ul class="needs">
			{#each NEEDS as need (need)}
				<li>
					<Pixel name={ICON[need]} scale={2} />
					<span class="name">{NEED_LABEL[need]}</span>
					<ProgressBar value={Math.round(needs[need])} color={COLOR[need]} label={NEED_LABEL[need]} />
				</li>
			{/each}
		</ul>
	{:else}
		<p class="muted">Someone is hiding in the box. Say hello — it comes out once you've both visited.</p>
	{/if}

	{#if pet.personality.length}
		<p class="trait">Lately {pet.name} seems {pet.personality.join(' and ')}.</p>
	{:else if pet.stage !== 'box'}
		<p class="muted small">{pet.name}'s personality is still forming. Everything you do together shapes it.</p>
	{/if}
	{#if next}
		<p class="muted small">
			{next - day <= 0 ? 'Growing any moment now' : `Grows up a little in ${next - day} day${next - day === 1 ? '' : 's'}`}
		</p>
	{/if}
</section>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	header {
		display: flex;
		align-items: center;
		gap: 0.9rem;
	}

	.portrait {
		display: grid;
		place-items: center;
		width: 5rem;
		height: 4.5rem;
		background: var(--well);
		box-shadow: inset 0 2px 0 var(--well-shadow);
	}

	header p {
		margin: 0 0 0.35rem;
		font-size: 1.05rem;
	}

	.status {
		padding: 0.1rem 0.5rem;
		background: var(--mint-light);
		color: var(--mint-shade);
		box-shadow: 0 0 0 2px var(--mint);
		font-size: 1rem;
		white-space: nowrap;
	}

	.needs {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.needs li {
		display: grid;
		grid-template-columns: auto 4.5rem 1fr;
		align-items: center;
		gap: 0.5rem;
	}

	.name {
		font-size: 1rem;
		color: var(--sage);
	}

	.trait {
		margin: 0;
		color: var(--lilac);
		font-size: 1.1rem;
	}

	.small {
		margin: 0;
		font-size: 0.95rem;
	}
</style>
