<!-- The court record: every statement, ruling and witness answer, newest last. -->
<script lang="ts">
	import { tick } from 'svelte';
	import { ARG_TYPES, isTurnPhase, REACTION_META, type ArgType, type Reaction } from '../../../convex/court/rules';
	import { factName, factTitle, type CourtEntry, type CourtView } from './types';

	let {
		room,
		onDemandProof,
		onCite,
		onRespond
	}: {
		room: CourtView;
		onDemandProof: (seq: number) => void;
		onCite: (key: string) => void;
		onRespond: (seq: number) => void;
	} = $props();

	let list: HTMLOListElement | undefined = $state();

	function heading(e: CourtEntry) {
		const who = e.side === 'court' ? 'MAJELIS' : e.side === 'defense' ? 'PENASIHAT HUKUM' : 'JAKSA';
		const witness = room.case.witnesses[e.witness ?? '']?.name ?? 'saksi';
		const what = {
			opening: 'Pernyataan pembuka',
			present: 'Mengajukan bukti',
			argue: ARG_TYPES[e.argType as ArgType]?.label ?? 'Berargumen',
			clarify: 'Memohon klarifikasi',
			ask: `Memeriksa ${witness}`,
			confront: `Mengonfrontasi ${witness}`,
			objection: `Menuntut bukti atas #${e.targetSeq}`,
			rest: 'Cukup',
			closing: e.side === 'defense' ? 'Pledoi' : 'Tuntutan',
			note: ''
		}[e.kind];
		const suspect = e.suspect ? room.case.suspects[e.suspect]?.short ?? e.suspect : '';
		return { who, what: what + (suspect ? ` · soal ${suspect}` : '') };
	}

	const canObject = (e: CourtEntry) =>
		isTurnPhase(room.phase) && !!room.you && e.side !== 'court' && e.side !== room.you && e.status === 'unverified';

	// Keep the newest line in view as the record grows.
	$effect(() => {
		void room.entries.length;
		tick().then(() => list?.lastElementChild?.scrollIntoView({ block: 'nearest' }));
	});
</script>

<div class="record panel dark">
	<span class="tag">BERITA ACARA SIDANG</span>
	{#if !room.entries.length}
		<p class="empty">> Berita acara masih kosong. Pernyataan pembuka lebih dulu.</p>
	{/if}
	<ol bind:this={list}>
		{#each room.entries as e, i (e._id)}
			{@const h = heading(e)}
			{@const r = e.reaction as Reaction | undefined}
			{@const newest = i === room.entries.length - 1}
			<li class="entry side-{e.side}" class:newest class:struck={e.status === 'exposed'} class:court={e.side === 'court'}>
				<div class="head">
					<span class="seq">#{String(e.seq).padStart(2, '0')}</span>
					<span class="who">{h.who}</span>
					{#if h.what}<span class="what">{h.what}</span>{/if}
				</div>
				{#if e.text}<p class="line">{e.text}</p>{/if}
				{#if e.kind === 'ask' || e.kind === 'confront'}
					<p class="answer">
						{#if e.pending}
							<span class="blink">…</span> Saksi menimbang pertanyaan.
						{:else}
							“{e.answer}”
						{/if}
					</p>
				{/if}
				{#if e.cites.length || e.backing?.length}
					<div class="cites">
						{#each e.cites as key (key)}
							<button class="chip" title={`${factTitle(key, room.evidence, room.case)} — klik untuk mengutip`} onclick={() => onCite(key)}>
								{factName(key, room.case)}
							</button>
						{/each}
						{#each e.backing ?? [] as key (key)}
							<span class="chip sealed" title="Ditahan sebagai dasar tersegel">🔒 {key}</span>
						{/each}
					</div>
				{/if}
				{#if r && r !== 'answered' && !(e.kind === 'present' && r === 'noted')}
					<p class="ruling tone-{REACTION_META[r].tone}" class:alarm={r === 'contradiction'}>
						<span class="badge">{REACTION_META[r].label}</span>
						{#if e.ruling}{e.ruling}{/if}
					</p>
				{:else if e.ruling}
					<p class="ruling tone-dim">{e.ruling}</p>
				{/if}
				{#if e.status === 'exposed'}
					<p class="ruling tone-bad"><span class="badge">DICORET</span> Terbukti tanpa dasar.</p>
				{:else if e.status === 'proven'}
					<p class="ruling tone-good"><span class="badge">TERBUKTI</span> Dasarnya ditunjukkan saat diminta.</p>
				{/if}
				{#if canObject(e) || (isTurnPhase(room.phase) && room.you && e.side === (room.you === 'defense' ? 'prosecution' : 'defense') && e.kind === 'argue')}
					<div class="acts">
						{#if canObject(e)}
							<button class="btn small danger" onclick={() => onDemandProof(e.seq)}>Tuntut bukti</button>
						{/if}
						{#if room.turn === room.you}
							<button class="btn small" onclick={() => onRespond(e.seq)}>Tanggapi</button>
						{/if}
					</div>
				{/if}
			</li>
		{/each}
	</ol>
</div>

<style>
	.record {
		display: flex;
		flex-direction: column;
		min-height: 0;
		padding: 12px 0 0;
	}
	ol {
		list-style: none;
		margin: 0;
		padding: 8px 14px 14px;
		overflow-y: auto;
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.empty {
		padding: 16px;
		color: var(--ink-ghost);
	}

	.entry {
		border-left: 2px solid var(--rule-hi);
		padding-left: 10px;
	}
	.entry.side-defense {
		border-left-color: var(--def-deep);
	}
	.entry.side-prosecution {
		border-left-color: var(--atk-deep);
	}
	.entry.court {
		border-left-color: var(--luck-deep);
	}
	.entry.struck .line {
		text-decoration: line-through;
		color: var(--ink-dim);
	}

	.head {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: baseline;
		font-family: var(--font-ui);
		font-size: 10px;
		letter-spacing: 0.1em;
	}
	.seq {
		color: var(--ink-ghost);
	}
	.what {
		color: var(--ink-dim);
	}

	.line {
		color: var(--ink-2);
		letter-spacing: 0.04em;
		line-height: 1.05;
		margin-top: 2px;
	}
	.line::before,
	.answer::before {
		content: '> ';
		color: var(--ink-ghost);
	}
	.newest .line {
		color: var(--signal);
	}
	.court .line {
		color: var(--luck);
	}
	.answer {
		color: var(--parchment);
		line-height: 1.05;
		margin-top: 2px;
	}

	.cites {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		margin-top: 4px;
	}
	.chip {
		font-family: var(--font-ui);
		font-size: 10px;
		letter-spacing: 0.06em;
		background: var(--night-3);
		color: var(--ink-2);
		border: 2px solid var(--rule-hi);
		padding: 1px 6px;
		cursor: pointer;
	}
	.chip:hover {
		color: var(--ink);
		border-color: var(--ink-dim);
	}
	.chip.sealed {
		cursor: default;
		color: var(--luck);
		border-color: var(--luck-deep);
	}

	.ruling {
		margin-top: 4px;
		line-height: 1.05;
	}
	.badge {
		font-family: var(--font-ui);
		font-size: 10px;
		letter-spacing: 0.1em;
		margin-right: 6px;
	}
	.entry .ruling.alarm {
		border: 2px solid var(--hp);
		background: var(--hp-deep);
		color: var(--ink);
		padding: 6px 8px;
		animation: mek-blink 900ms steps(1) 3;
	}
	.alarm .badge {
		color: var(--hp);
		display: block;
		font-size: 12px;
		margin-bottom: 2px;
		color: var(--ink);
	}

	.acts {
		display: flex;
		gap: 6px;
		margin-top: 6px;
	}
</style>
