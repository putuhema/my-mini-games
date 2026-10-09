<!-- The top of the courtroom: Defense, Judge, Prosecution, and the court's running balance beneath them. -->
<script lang="ts">
	import { isTurnPhase, paceFor, REACTION_META, SIDE_LABEL, type Reaction, type Side } from '../../../convex/court/rules';
	import Portrait from './Portrait.svelte';
	import Scales from './Scales.svelte';
	import type { CourtView } from './types';

	let { room }: { room: CourtView } = $props();

	const name = (side: Side) =>
		room.players.find((p) => (side === 'defense' ? p.id === room.defenseId : p.id !== room.defenseId))?.name ?? '—';

	const lastRuling = $derived([...room.entries].reverse().find((e) => e.ruling || e.side === 'court'));
	const live = $derived(isTurnPhase(room.phase));
	const pace = $derived(paceFor(room.case));
</script>

<section class="bench">
	{#each ['defense', 'judge', 'prosecution'] as const as seat (seat)}
		{#if seat === 'judge'}
			<div class="seat judge">
				<div class="portrait"><Portrait who="judge" size={44} speaking={room.phase === 'deliberating'} /></div>
				<div class="speech">
					{#if room.phase === 'deliberating'}
						<p>Majelis bermusyawarah<span class="blink">…</span></p>
					{:else if lastRuling}
						{@const r = lastRuling.reaction as Reaction | undefined}
						{#if r && lastRuling.side !== 'court' && r !== 'answered'}
							<span class="micro tone-{REACTION_META[r].tone}">{REACTION_META[r].label}</span>
						{/if}
						<p>{lastRuling.ruling ?? lastRuling.text}</p>
					{:else}
						<p>Sidang dibuka dan terbuka untuk umum.</p>
					{/if}
				</div>
			</div>
		{:else}
			{@const turn = live && room.turn === seat}
			<div class="seat {seat}" class:turn class:mine={room.you === seat}>
				<div class="portrait"><Portrait who={seat} size={40} speaking={turn} /></div>
				<div class="who">
					<span class="eyebrow side-{seat}" title={SIDE_LABEL[seat]}>{seat === 'defense' ? 'PEMBELA' : 'JAKSA'}</span>
					<strong class="name">{name(seat)}{room.you === seat ? ' · Anda' : ''}</strong>
					{#if live}
						<span class="micro meters">
							<span title="Sisa aksi babak ini">{room.budgets[seat]} aksi</span>
							<span title="Sisa permohonan klarifikasi">{room.clarifications[seat]}/{pace.clarifications} klar</span>
						</span>
					{/if}
				</div>
			</div>
		{/if}
	{/each}
	<div class="balance"><Scales {room} /></div>
</section>

<style>
	.bench {
		display: grid;
		grid-template-columns: 1fr 1.5fr 1fr;
		gap: 8px;
		align-items: stretch;
	}

	.seat {
		border: 2px solid var(--rule);
		background: var(--night-2);
		padding: 8px 10px;
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
	}
	.seat.prosecution {
		flex-direction: row-reverse;
		text-align: right;
	}
	.seat.turn {
		outline: 2px solid var(--cursor);
		outline-offset: 2px;
	}
	.seat.mine {
		background: var(--night-3);
	}
	.portrait {
		flex-shrink: 0;
		padding: 3px;
		background: var(--void);
		border: 2px solid var(--rule-hi);
		line-height: 0;
	}
	.who {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}
	.eyebrow {
		font-size: 9px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.name {
		font-family: var(--font-ui);
		font-size: 12px;
		color: var(--ink);
		letter-spacing: 0.04em;
		font-weight: 400;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.meters {
		display: flex;
		flex-wrap: wrap;
		gap: 0 8px;
		color: var(--ink-dim);
		white-space: nowrap;
	}
	.prosecution .meters {
		justify-content: flex-end;
	}

	.judge {
		background: var(--void);
		border-color: var(--rule-hi);
		align-items: flex-start;
	}
	.judge .portrait {
		border-color: var(--luck-deep);
	}
	.speech {
		min-width: 0;
		color: var(--ink);
		font-size: 19px;
		line-height: 1.05;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		overflow: hidden;
	}
	.speech .micro {
		display: block;
		margin-bottom: 2px;
	}

	.balance {
		grid-column: 1 / -1;
	}

	@media (max-width: 720px) {
		.bench {
			grid-template-columns: 1fr 1fr;
		}
		.judge {
			grid-column: 1 / -1;
			order: -1;
		}
	}
</style>
