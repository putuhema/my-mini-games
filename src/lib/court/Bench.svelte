<!-- The top row: Defense, Judge, Prosecution. -->
<script lang="ts">
	import { isTurnPhase, paceFor, PHASE_TITLE, REACTION_META, SIDE_LABEL, type Reaction, type Side } from '../../../convex/court/rules';
	import Portrait from './Portrait.svelte';
	import type { CourtView } from './types';

	let { room }: { room: CourtView } = $props();

	const name = (side: Side) =>
		room.players.find((p) => (side === 'defense' ? p.id === room.defenseId : p.id !== room.defenseId))?.name ?? '—';

	const lastRuling = $derived([...room.entries].reverse().find((e) => e.ruling || e.side === 'court'));
	const live = $derived(isTurnPhase(room.phase));
</script>

<section class="bench">
	{#each ['defense', 'judge', 'prosecution'] as const as seat (seat)}
		{#if seat === 'judge'}
			<div class="seat judge">
				<div class="portrait"><Portrait who="judge" speaking={room.phase === 'deliberating'} /></div>
				<span class="eyebrow">Yang Mulia Hakim · <b>{PHASE_TITLE[room.phase]}</b></span>
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
				<div class="who">
					<span class="eyebrow side-{seat}">{SIDE_LABEL[seat]}</span>
					{#if turn}<span class="marker" aria-label="Giliran mereka"></span>{/if}
				</div>
				<div class="portrait"><Portrait who={seat} speaking={turn} /></div>
				<strong class="name">{name(seat)}{room.you === seat ? ' (Anda)' : ''}</strong>
				{#if live}
					<div class="meters micro">
						<span title="Sisa aksi babak ini">AKSI {String(room.budgets[seat]).padStart(2, '0')}</span>
						<span title="Sisa permohonan klarifikasi">KLAR {room.clarifications[seat]}/{paceFor(room.case).clarifications}</span>
					</div>
				{/if}
			</div>
		{/if}
	{/each}
</section>

<style>
	.bench {
		display: grid;
		grid-template-columns: 1fr 1.6fr 1fr;
		gap: 12px;
		align-items: stretch;
	}

	.seat {
		border: 2px solid var(--rule);
		background: var(--night-2);
		padding: 12px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		text-align: center;
		position: relative;
	}
	.seat.turn {
		outline: 2px solid var(--cursor);
		outline-offset: 2px;
	}
	.seat.mine {
		background: var(--night-3);
	}

	.who {
		display: flex;
		align-items: center;
		gap: 8px;
		min-height: 18px;
	}

	.portrait {
		padding: 6px;
		background: var(--void);
		border: 2px solid var(--rule-hi);
	}

	.name {
		font-family: var(--font-ui);
		font-size: 13px;
		color: var(--ink);
		letter-spacing: 0.06em;
	}

	.meters {
		display: flex;
		gap: 10px;
	}

	.judge {
		background: var(--void);
		border-color: var(--rule-hi);
	}
	.judge .portrait {
		border-color: var(--luck-deep);
	}
	.speech {
		width: 100%;
		min-height: 3.2em;
		border-top: 2px solid var(--rule);
		padding-top: 8px;
		color: var(--ink);
		font-size: 21px;
		line-height: 1.05;
		text-align: left;
	}
	.speech .micro {
		display: block;
		margin-bottom: 4px;
	}

	@media (max-width: 720px) {
		.bench {
			grid-template-columns: 1fr 1fr;
		}
		.judge {
			grid-column: 1 / -1;
			order: -1;
			flex-direction: row;
			flex-wrap: wrap;
			text-align: left;
		}
		.judge .portrait :global(svg) {
			width: 48px;
			height: 48px;
		}
		.seat :global(svg) {
			width: 48px;
			height: 48px;
		}
	}
</style>
