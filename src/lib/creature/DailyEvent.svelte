<script lang="ts">
	import type { FunctionReturnType } from 'convex/server';
	import type { api } from '../../../convex/_generated/api';
	import { event, fill } from '../../../convex/creature/events';
	import Pixel from './Pixel.svelte';
	import type { Couple } from './room';

	type Today = NonNullable<FunctionReturnType<typeof api.pets.today>>;

	let {
		today,
		couple,
		meId,
		petName,
		busy,
		onvote,
		onalone
	}: {
		today: Today;
		couple: Couple;
		meId: string;
		petName: string;
		busy: boolean;
		onvote: (choice: string) => void;
		onalone: () => void;
	} = $props();

	const ev = $derived(event(today.eventId));
	const partner = $derived(couple.players.find((p) => p.id !== meId));
	const label = (id: string | undefined) => fill(ev?.choices.find((c) => c.id === id)?.label ?? '', petName);
	const nameOf = (id: string) => (id === meId ? 'You' : (couple.players.find((p) => p.id === id)?.name ?? '?'));
</script>

{#if ev}
	<section class="event" aria-label="Today's question">
		<p class="eyebrow">Today's little question</p>
		<div class="prompt">
			<Pixel name={ev.icon} scale={3} />
			<p>{fill(ev.prompt, petName)}</p>
		</div>

		{#if today.result}
			<div class="reveal" class:agreed={today.result.agreed}>
				{#if today.votes.length === 2}
					<ul class="votes">
						{#each today.votes as v (v.playerId)}
							<li>
								<span class="who">{nameOf(v.playerId)}</span>
								<Pixel name={ev.choices.find((c) => c.id === v.choice)?.icon} scale={2} />
								{label(v.choice)}
							</li>
						{/each}
					</ul>
				{/if}
				<p>
					{#if today.result.agreed}<Pixel name="heart" scale={2} />{/if}
					{today.result.text}
				</p>
			</div>
			<p class="muted small">A new question tomorrow.</p>
		{:else}
			<div class="choices" role="radiogroup" aria-label="Choices">
				{#each ev.choices as c (c.id)}
					<button
						class="choice"
						role="radio"
						aria-checked={today.mine === c.id}
						disabled={busy}
						onclick={() => onvote(c.id)}
					>
						<Pixel name={c.icon} scale={3} />
						<span>{fill(c.label, petName)}</span>
					</button>
				{/each}
			</div>
			{#if today.mine}
				<p class="waiting">
					{#if !partner}
						You picked {label(today.mine)}. <button class="link" disabled={busy} onclick={onalone}>Decide without them</button>
					{:else if today.partnerVoted}
						Revealing...
					{:else}
						You picked {label(today.mine)}. Secret until {partner.name} picks too.
					{/if}
				</p>
			{:else if today.partnerVoted && partner}
				<p class="waiting">{partner.name} already picked. Your turn — it stays secret until you do.</p>
			{/if}
		{/if}
	</section>
{/if}

<style>
	.event {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.eyebrow {
		margin: 0;
		font-size: 0.85rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--lilac);
	}

	.prompt {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.prompt p {
		margin: 0;
		font-size: 1.3rem;
		line-height: 1.1;
	}

	.choices {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.6rem;
	}

	.choice {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		padding: 0.7rem 0.4rem 0.5rem;
		border: 0;
		background: var(--moss);
		color: var(--dew);
		font-size: 1rem;
		line-height: 1;
		text-align: center;
		cursor: pointer;
		box-shadow:
			0 0 0 2px var(--gap),
			0 0 0 4px var(--vine),
			0 var(--depth) 0 4px var(--root);
		transition: transform 0.1s var(--snap);
	}

	.choice:active:not(:disabled) {
		transform: translateY(3px);
	}

	.choice[aria-checked='true'] {
		background: var(--lilac-light);
		box-shadow:
			0 0 0 2px var(--gap),
			0 0 0 4px var(--lilac),
			0 var(--depth) 0 4px var(--lilac-shade);
	}

	.waiting {
		margin: 0;
		color: var(--sage);
		font-size: 1rem;
	}

	.link {
		padding: 0;
		border: 0;
		background: none;
		color: var(--mint);
		text-decoration: underline;
		cursor: pointer;
	}

	.reveal {
		padding: 0.75rem;
		background: var(--soil);
		animation: flip 0.4s steps(4, end);
	}

	.reveal.agreed {
		background: var(--pink-light);
		box-shadow: 0 0 0 2px var(--pink);
	}

	.reveal p {
		display: flex;
		gap: 0.5rem;
		align-items: flex-start;
		margin: 0;
		font-size: 1.1rem;
		line-height: 1.15;
	}

	.votes {
		list-style: none;
		margin: 0 0 0.6rem;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.votes li {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		font-size: 1.05rem;
	}

	.who {
		min-width: 4.5rem;
		color: var(--sage);
	}

	.small {
		margin: 0;
		font-size: 0.9rem;
	}

	@keyframes flip {
		from {
			transform: scaleY(0.2);
		}
	}
</style>
