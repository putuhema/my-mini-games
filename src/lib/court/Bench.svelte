<!-- The top of the courtroom: Defense, Judge, Prosecution, and the court's running balance beneath them. -->
<script lang="ts">
	import { untrack } from 'svelte';
	import { isTurnPhase, other, paceFor, REACTION_META, SIDE_LABEL, type Reaction, type Side } from '../../../convex/court/rules';
	import Portrait, { type Mood } from './Portrait.svelte';
	import Scales from './Scales.svelte';
	import type { CourtView } from './types';

	let { room, urgent = false }: { room: CourtView; /** The turn clock is nearly out. */ urgent?: boolean } = $props();

	// ---- Faces: each seat reacts to what just happened, then settles back ----
	type Seat = Side | 'judge';
	let flash = $state<Partial<Record<Seat, { mood: Mood; until: number }>>>({});
	let talk = $state<Partial<Record<Seat, number>>>({});
	let clock = $state(Date.now());
	$effect(() => {
		const id = setInterval(() => (clock = Date.now()), 200);
		return () => clearInterval(id);
	});

	function react(seat: Seat, mood: Mood, ms = 1800) {
		flash = { ...flash, [seat]: { mood, until: Date.now() + ms } };
	}
	function speak(seat: Seat, ms = 1100) {
		talk = { ...talk, [seat]: Date.now() + ms };
	}

	// What each ruling does to the speaker, their opponent and the judge.
	const REACT: Partial<Record<Reaction, [self: Mood, them: Mood, judge: Mood]>> = {
		contradiction: ['point', 'shock', 'gavel'],
		strong: ['happy', 'sweat', 'nod'],
		sustained: ['smug', 'sweat', 'gavel'],
		proven: ['smug', 'shock', 'nod'],
		accepted: ['happy', 'idle', 'nod'],
		exposed: ['shock', 'smug', 'gavel'],
		overruled: ['sweat', 'smug', 'stern'],
		weak: ['sweat', 'smug', 'stern'],
		revealed: ['think', 'think', 'gavel'],
		unverified: ['smug', 'think', 'stern']
	};

	let seenSeq: number | undefined;
	$effect(() => {
		const entries = room.entries;
		untrack(() => {
			const newest = entries.at(-1)?.seq ?? 0;
			if (seenSeq === undefined) return void (seenSeq = newest);
			for (const e of entries.filter((x) => x.seq > seenSeq!)) {
				if (e.side === 'court') {
					speak('judge');
					continue;
				}
				const self = e.side;
				const them = other(self);
				if (e.text) speak(self);
				if (e.ruling) speak('judge', 1400);
				if (e.kind === 'objection') react(self, 'point');
				if ((e.kind === 'ask' || e.kind === 'confront') && e.pending) react(self, 'think', 2400);
				const r = REACT[e.reaction as Reaction];
				if (r) {
					react(self, r[0]);
					if (r[1] !== 'idle') react(them, r[1]);
					react('judge', r[2], 1300);
				}
			}
			seenSeq = newest;
		});
	});

	// Shouts: the shouter points (or ponders); the other side flinches.
	let seenShout: number | undefined;
	$effect(() => {
		const sh = room.shout;
		untrack(() => {
			if (seenShout === undefined) return void (seenShout = sh?.at ?? 0);
			if (!sh || sh.at === seenShout) return;
			seenShout = sh.at;
			if (sh.kind === 'hmm') react(sh.side, 'think', 1600);
			else {
				react(sh.side, 'point', 1500);
				react(other(sh.side), sh.kind === 'tunggu' ? 'sweat' : 'shock', 1500);
			}
			speak(sh.side, 900);
		});
	});

	function moodOf(seat: Seat): Mood {
		const f = flash[seat];
		if (f && f.until > clock) return f.mood;
		if (seat === 'judge') return room.phase === 'deliberating' ? 'sleep' : 'idle';
		if (urgent && room.turn === seat) return 'sweat';
		return 'idle';
	}
	const talking = (seat: Seat) => (talk[seat] ?? 0) > clock;

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
				<div class="portrait"><Portrait who="judge" size={52} mood={moodOf('judge')} talking={talking('judge')} /></div>
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
				<div class="portrait"><Portrait who={seat} size={52} mood={moodOf(seat)} talking={talking(seat)} /></div>
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
