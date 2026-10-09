<!-- The verdict, then the truth, then the numbers. -->
<script lang="ts">
	import { SIDE_LABEL, type Side } from '../../../convex/court/rules';
	import Portrait from './Portrait.svelte';
	import { factName, factTitle, type CourtView } from './types';

	let {
		room,
		cases,
		busy,
		onAgain
	}: {
		room: CourtView;
		cases: { id: string; title: string; tagline: string }[];
		busy: boolean;
		onAgain: (caseId: string) => void;
	} = $props();

	let picked = $state<string>();
	const nextCase = $derived(picked ?? room.case.id);

	const v = $derived(room.verdict!);
	const truth = $derived(room.truth!);
	const stats = $derived(room.stats!);
	const guilty = $derived(v.verdict === 'guilty');

	let revealed = $state(false);
	// The judge brings the gavel down when the verdict lands.
	let gaveling = $state(true);
	$effect(() => {
		const t = setTimeout(() => (gaveling = false), 1600);
		return () => clearTimeout(t);
	});
	// Winners beam, losers sweat.
	const winner = $derived<Side>(guilty ? 'prosecution' : 'defense');

	const name = (side: Side) =>
		room.players.find((p) => (side === 'defense' ? p.id === room.defenseId : p.id !== room.defenseId))?.name ?? '—';
	const pad = (n: number) => String(n).padStart(2, '0');
	const entryText = (seq: number) => {
		const e = room.entries.find((x) => x.seq === seq);
		return e ? `${e.side === 'defense' ? 'PH' : 'JPU'} · ${e.text ?? ''}` : `#${seq}`;
	};
	const CALL = {
		supported: { label: 'BERDASAR', tone: 'good' },
		interpretation: { label: 'TAFSIRAN', tone: 'gold' },
		mistake: { label: 'KEKELIRUAN', tone: 'weak' },
		lie: { label: 'DUSTA', tone: 'bad' }
	} as const;

	const STAT_ROWS = [
		['evidenceUsed', 'Bukti dipakai'],
		['contradictionsFound', 'Kontradiksi ditemukan'],
		['argumentsAccepted', 'Argumen diterima'],
		['unsupportedClaims', 'Klaim tanpa dasar'],
		['bluffsExposed', 'Gertakan terbongkar'],
		['witnessesChallenged', 'Saksi digugat']
	] as const;
</script>

<section class="verdict">
	<div class="banner" class:guilty>
		<Portrait who="judge" size={84} mood={gaveling ? 'gavel' : 'idle'} talking={gaveling} />
		<div>
			<span class="eyebrow">{room.case.docket} · majelis menyatakan terdakwa</span>
			<h1>{guilty ? 'BERSALAH' : 'BEBAS'}</h1>
			<span class="micro">{v.by === 'ai' ? 'Diputus oleh hakim AI (GLM-5)' : 'Diputus oleh panitera (hakim AI tidak tersedia)'}</span>
		</div>
	</div>

	<div class="panel">
		<span class="tag">PERTIMBANGAN</span>
		<p class="reason">{v.reasoning}</p>
	</div>

	<div class="sides">
		{#each ['defense', 'prosecution'] as const as side (side)}
			{@const s = v[side]}
			{@const st = stats[side]}
			<div class="panel side">
				<header>
					<Portrait who={side} size={40} mood={side === winner ? 'happy' : 'sweat'} />
					<span class="eyebrow side-{side}">{SIDE_LABEL[side]} · {name(side)}</span>
					<span class="score">{s.score}</span>
				</header>
				<dl>
					<dt class="tone-good">Terkuat</dt>
					<dd>{s.strongest}</dd>
					<dt class="tone-bad">Terlemah</dt>
					<dd>{s.weakest}</dd>
				</dl>
				<table class="stats">
					<tbody>
						{#each STAT_ROWS as [key, label] (key)}
							<tr><td>{label}</td><td class="n">{pad(st[key])}</td></tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/each}
	</div>

	<div class="grid2">
		<div class="panel">
			<span class="tag">BUKTI PENENTU</span>
			{#if !v.keyEvidence.length}<p class="dim">> Tak ada yang menonjol.</p>{/if}
			{#each v.keyEvidence as k (k.id)}
				<p><b class="id">{k.id}</b> {factTitle(k.id, room.evidence, room.case).split(' · ')[1] ?? ''} — <span class="dim">{k.why}</span></p>
			{/each}
		</div>
		<div class="panel">
			<span class="tag">KONTRADIKSI</span>
			{#if !room.contradictions.length}<p class="dim">> Tak seorang pun menemukan kontradiksi.</p>{/if}
			{#each room.contradictions as c (c.seq)}
				<p><span class="side-{c.side}">{c.side === 'defense' ? 'PH' : 'JPU'}</span> ⚠ {c.text}</p>
			{/each}
		</div>
	</div>

	{#if v.claims.length}
		<div class="panel">
			<span class="tag">DUSTA · TAFSIRAN · KEKELIRUAN</span>
			{#each v.claims as c (c.seq)}
				<div class="claim">
					<span class="micro tone-{CALL[c.call].tone}">{CALL[c.call].label}</span>
					<p><span class="dim">#{c.seq}</span> {entryText(c.seq)}</p>
					<p class="dim">› {c.note}</p>
				</div>
			{/each}
		</div>
	{/if}

	{#if v.unresolved.length}
		<div class="panel">
			<span class="tag">TAK TERSENTUH</span>
			<div class="chips">
				{#each v.unresolved as id (id)}<span class="chip" title={factTitle(id, room.evidence, room.case)}>{factName(id, room.case)} · {factTitle(id, room.evidence, room.case).split(' · ')[1] ?? ''}</span>{/each}
			</div>
		</div>
	{/if}

	{#if !revealed}
		<button class="btn primary full reveal" onclick={() => (revealed = true)}>Ungkap kebenaran <kbd>↵</kbd></button>
	{:else}
		<div class="panel truth">
			<span class="tag">YANG SEBENARNYA TERJADI</span>
			<span class="eyebrow">Pelaku</span>
			<h2>{room.case.suspects[truth.culprit]?.name ?? truth.culprit} <span class="micro">{room.case.suspects[truth.culprit]?.role}</span></h2>
			<span class="eyebrow">Motif</span>
			<p>{truth.motive}</p>
			<p class="summary">{truth.summary}</p>
			<ol class="tl">
				{#each truth.timeline as t (t.time + t.text)}
					<li><span class="time">{t.time}</span> {t.text}</li>
				{/each}
			</ol>
			<div class="grid2">
				<div>
					<span class="eyebrow side-defense">Penasihat Hukum vs kebenaran</span>
					<p>{v.defense.vsTruth}</p>
				</div>
				<div>
					<span class="eyebrow side-prosecution">Jaksa vs kebenaran</span>
					<p>{v.prosecution.vsTruth}</p>
				</div>
			</div>
		</div>

		<div class="panel">
			<span class="tag">STATISTIK PERKARA</span>
			<div class="grid3">
				<div>
					<span class="eyebrow tone-good">Bukti yang berperan</span>
					{#each stats.mattered as id (id)}<p><b class="id">{id}</b> {factTitle(id, room.evidence, room.case).split(' · ')[1]}</p>{/each}
					{#if !stats.mattered.length}<p class="dim">> Tak satu pun dipakai.</p>{/if}
				</div>
				<div>
					<span class="eyebrow tone-gold">Bukti kunci terlewat</span>
					{#each stats.missed as id (id)}<p><b class="id">{id}</b> {factTitle(id, room.evidence, room.case).split(' · ')[1]}</p>{/each}
					{#if !stats.missed.length}<p class="dim">> Tidak ada. Jeli sekali.</p>{/if}
				</div>
				<div>
					<span class="eyebrow tone-bad">Bukti yang menyesatkan</span>
					{#each stats.misleading as id (id)}<p><b class="id">{id}</b> {factTitle(id, room.evidence, room.case).split(' · ')[1]}</p>{/each}
				</div>
			</div>
		</div>

		<div class="panel">
			<span class="tag">SIDANG BERIKUTNYA</span>
			<div class="cases">
				{#each cases as c (c.id)}
					<button class="case" class:sel={nextCase === c.id} onclick={() => (picked = c.id)}>
						<strong>{c.title}</strong>
						<span class="dim">{c.tagline}</span>
					</button>
				{/each}
			</div>
		</div>
		<button class="btn primary full" disabled={busy} onclick={() => onAgain(nextCase)}>Sidang baru · tukar peran <kbd>N</kbd></button>
	{/if}

	{#if room.history.length > 1}
		<div class="panel">
			<span class="tag">REGISTER PERKARA</span>
			{#each room.history as h (h.trial)}
				<p class="dim">Sidang {pad(h.trial)}{h.caseTitle ? ` · ${h.caseTitle}` : ''} · PH {h.defenseName} v JPU {h.prosecutionName} · <span class={h.verdict === 'guilty' ? 'tone-bad' : 'side-defense'}>{h.verdict === 'guilty' ? 'BERSALAH' : 'BEBAS'}</span></p>
			{/each}
		</div>
	{/if}
</section>

<svelte:window
	onkeydown={(e) => {
		if ((e.target as HTMLElement).closest?.('input, textarea, select')) return;
		if (e.key === 'Enter' && !revealed) revealed = true;
		else if ((e.key === 'n' || e.key === 'N') && revealed && !busy) onAgain(nextCase);
	}}
/>

<style>
	.verdict {
		display: flex;
		flex-direction: column;
		gap: 16px;
		max-width: 1000px;
		margin: 0 auto;
	}
	.banner {
		display: flex;
		align-items: center;
		gap: 20px;
		padding: 20px;
		border: 2px solid var(--def);
		background: var(--def-deep);
		animation: slam 400ms steps(4) both;
	}
	.banner.guilty {
		border-color: var(--hp);
		background: var(--hp-deep);
	}
	@keyframes slam {
		from {
			transform: scale(1.3);
			opacity: 0;
		}
	}
	h1 {
		font-size: clamp(36px, 7vw, 72px);
		line-height: 0.95;
		margin: 6px 0;
	}
	.reason {
		color: var(--ink);
		font-size: 24px;
		line-height: 1.1;
	}
	.sides,
	.grid2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
	}
	.grid3 {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
	}
	@media (max-width: 760px) {
		.sides,
		.grid2,
		.grid3 {
			grid-template-columns: 1fr;
		}
	}
	.side header {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 8px;
	}
	.side header .eyebrow {
		flex: 1;
	}
	.score {
		font-family: var(--font-ui);
		font-size: 30px;
		letter-spacing: 0.18em;
		color: var(--signal);
	}
	dl {
		margin: 0 0 10px;
	}
	dt {
		font-family: var(--font-ui);
		font-size: 10px;
		letter-spacing: 0.12em;
		margin-top: 6px;
	}
	dd {
		margin: 0;
		color: var(--ink-2);
		line-height: 1.05;
	}
	.stats {
		width: 100%;
		border-collapse: collapse;
		font-family: var(--font-ui);
		font-size: 11px;
		letter-spacing: 0.08em;
	}
	.stats td {
		padding: 4px 0;
		border-top: 2px solid var(--rule);
		color: var(--ink-dim);
	}
	.stats .n {
		text-align: right;
		color: var(--ink);
		font-size: 14px;
		letter-spacing: 0.18em;
	}
	.id {
		font-family: var(--font-ui);
		font-size: 12px;
		color: var(--ink);
		font-weight: 400;
	}
	.dim {
		color: var(--ink-dim);
	}
	.claim {
		border-left: 2px solid var(--rule-hi);
		padding-left: 10px;
		margin-top: 8px;
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.chip {
		font-family: var(--font-ui);
		font-size: 10px;
		border: 2px solid var(--rule-hi);
		padding: 3px 7px;
		color: var(--ink-2);
	}
	.reveal {
		padding: 16px;
		font-size: 15px;
	}
	.truth {
		border-color: var(--luck-deep);
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.truth h2 {
		font-size: 22px;
	}
	.summary {
		color: var(--parchment);
		margin: 6px 0;
		line-height: 1.1;
	}
	.tl {
		list-style: none;
		padding: 0;
		margin: 0 0 10px;
		border-left: 2px solid var(--luck-deep);
	}
	.tl li {
		padding-left: 10px;
	}
	.time {
		font-family: var(--font-ui);
		font-size: 12px;
		color: var(--luck);
	}
	.cases {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 8px;
	}
	.case {
		all: unset;
		box-sizing: border-box;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 10px;
		border: 2px solid var(--rule);
		background: var(--night-2);
	}
	.case strong {
		font-family: var(--font-ui);
		font-size: 12px;
		letter-spacing: 0.06em;
		color: var(--ink);
	}
	.case:hover {
		border-color: var(--rule-hi);
	}
	.case.sel {
		outline: 2px solid var(--cursor);
		outline-offset: 2px;
	}
</style>
