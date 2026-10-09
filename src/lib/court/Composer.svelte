<!-- Build an argument: one of four moves, who it's about, what it cites, and the words. -->
<script lang="ts">
	import { ARG_TYPES, type ArgType, type Side } from '../../../convex/court/rules';
	import { factName, factTitle, type Cite, type CourtView } from './types';

	let {
		room,
		basket,
		myTurn,
		busy,
		targetSeq,
		onClearTarget,
		onToggleSeal,
		onRemove,
		onToggleCite,
		onArgue
	}: {
		room: CourtView;
		basket: Cite[];
		myTurn: boolean;
		busy: boolean;
		targetSeq?: number;
		onClearTarget: () => void;
		onToggleSeal: (key: string) => void;
		onRemove: (key: string) => void;
		onToggleCite: (key: string) => void;
		onArgue: (arg: { argType: ArgType; suspect?: string; text: string }) => Promise<boolean>;
	} = $props();

	let argType = $state<ArgType>('accuse');
	let picked = $state<string>();
	let text = $state('');

	const you = $derived((room.you ?? 'defense') as Side);
	// Jaksa menuduh terdakwa; pembela menunjuk orang lain.
	const fallbackSuspect = $derived(
		you === 'prosecution' ? room.case.accused : (Object.keys(room.case.suspects).find((id) => id !== room.case.accused) ?? room.case.accused)
	);
	const suspect = $derived(picked && room.case.suspects[picked] ? picked : fallbackSuspect);
	const suspects = $derived(
		Object.entries(room.case.suspects).filter(([id]) => (you === 'prosecution' ? id === room.case.accused : id !== room.case.accused))
	);

	const meta = $derived(ARG_TYPES[argType]);
	const moves = Object.entries(ARG_TYPES) as [ArgType, (typeof ARG_TYPES)[ArgType]][];
	const allowed = $derived(room.phase === 'evidence' || room.phase === 'cross');
	const sealable = (key: string) => {
		const ev = room.evidence.find((e) => e.id === key);
		return !!ev && ev.kind === room.you && !ev.onRecord;
	};
	const publicCites = $derived(basket.filter((c) => !c.sealed));
	// Everything you can cite, right here: no trip to the evidence tab.
	const pickable = $derived([
		...room.evidence.filter((e) => (e.onRecord || e.kind === room.you) && !e.discredited).map((e) => ({ key: e.id, title: e.title })),
		...room.onRecord.filter((k) => k.includes('.')).map((k) => ({ key: k, title: factTitle(k, room.evidence, room.case) }))
	]);
	const inBasket = (key: string) => basket.some((c) => c.key === key);
	const problem = $derived.by(() => {
		if (meta.pair && publicCites.length !== 2) return 'Kutip tepat dua butir (tidak tersegel).';
		if (meta.target && !publicCites.length) return 'Kutip dulu butir yang Anda bantah.';
		return '';
	});
	const slotLabel = (i: number) => (meta.pair ? ['A', 'B'][i] ?? '+' : meta.target ? (i === 0 ? 'SASARAN' : 'DASAR') : String(i + 1));

	async function submit(e: Event) {
		e.preventDefault();
		if (problem || busy || !myTurn) return;
		const ok = await onArgue({ argType, suspect: meta.suspect ? suspect : undefined, text: text.trim() });
		if (ok) text = '';
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && document.activeElement?.closest('.composer')) return submit(e);
		if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement).closest?.('input, textarea, select')) return;
		const move = moves.find(([, m]) => m.key === e.key);
		if (move) argType = move[0];
	}
</script>

<svelte:window onkeydown={onKey} />

<form class="composer" onsubmit={submit}>
	{#if !allowed}
		<p class="micro dim">Argumen diajukan di babak pembuktian dan pemeriksaan silang.</p>
	{/if}

	<div class="moves" role="radiogroup" aria-label="Langkah">
		{#each moves as [key, m] (key)}
			<button type="button" role="radio" aria-checked={argType === key} class="move" class:sel={argType === key} onclick={() => (argType = key)}>
				<kbd>{m.key}</kbd>
				<strong>{m.label}</strong>
			</button>
		{/each}
	</div>
	<p class="hint" title={`Contoh: ${meta.example}`}>{meta.hint[you]}</p>

	{#if meta.suspect && suspects.length > 1}
		<div class="row">
			<span class="eyebrow">Tuduh</span>
			{#each suspects as [id, s] (id)}
				<button type="button" class="chip" class:sel={suspect === id} onclick={() => (picked = id)}>{s.name}</button>
			{/each}
		</div>
	{/if}

	<div class="cites">
		<span class="eyebrow">
			Kutipan
			{#if basket.length}
				{#each basket as c, i (c.key)}
					<span class="cite" class:sealed={c.sealed}>
						<i>{slotLabel(i)}</i>
						<b title={factTitle(c.key, room.evidence, room.case)}>{factName(c.key, room.case)}</b>
						{#if sealable(c.key)}
							<button type="button" class="mini" title="Segel: tetap tersembunyi kecuali lawan menuntut bukti (gertakan)" onclick={() => onToggleSeal(c.key)}>
								{c.sealed ? '🔒' : '🔓'}
							</button>
						{/if}
						<button type="button" class="mini" aria-label="Hapus" onclick={() => onRemove(c.key)}>×</button>
					</span>
				{/each}
			{:else}
				<span class="dim">· pilih di bawah</span>
			{/if}
		</span>
		<div class="pick" aria-label="Pilih kutipan">
			{#each pickable as p (p.key)}
				<button type="button" class="chip" class:sel={inBasket(p.key)} title={p.title} onclick={() => onToggleCite(p.key)}>
					{factName(p.key, room.case)}
				</button>
			{/each}
		</div>
	</div>

	{#if targetSeq !== undefined}
		<p class="target">Menanggapi #{targetSeq} <button type="button" class="mini" onclick={onClearTarget}>×</button></p>
	{/if}

	<div class="send">
		<input bind:value={text} maxlength="600" placeholder="Kalimat Anda (opsional)" disabled={!allowed} aria-label="Kalimat argumen" />
		<button class="btn primary" disabled={!allowed || !myTurn || busy || !!problem} title={myTurn ? problem : 'Siapkan sekarang, kirim saat giliran Anda'}>
			{myTurn ? meta.label : 'Tunggu giliran'} <kbd>⌘↵</kbd>
		</button>
	</div>
	{#if allowed && myTurn && problem}<p class="micro problem">{problem}</p>{/if}
</form>

<style>
	.composer {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		align-items: center;
	}
	.chip {
		font-family: var(--font-ui);
		font-size: 11px;
		letter-spacing: 0.06em;
		background: var(--void);
		color: var(--ink-2);
		border: 2px solid var(--rule-hi);
		padding: 5px 8px;
		cursor: pointer;
	}
	.chip:hover {
		color: var(--ink);
	}
	.chip.sel {
		border-color: var(--cursor);
		color: var(--ink);
	}
	.hint {
		color: var(--ink-dim);
	}

	.mini {
		all: unset;
		cursor: pointer;
		font-family: var(--font-ui);
		font-size: 9px;
		letter-spacing: 0.08em;
		color: var(--ink-dim);
		padding: 0 2px;
	}
	.sealed .mini {
		color: var(--luck);
	}
	.mini:hover {
		color: var(--ink);
	}
	.target {
		color: var(--signal);
		font-family: var(--font-ui);
		font-size: 11px;
	}
	.send {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.send input {
		flex: 1;
		min-width: 0;
	}
	.hint {
		color: var(--ink-dim);
		line-height: 1.05;
	}
	.cites {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.cites .eyebrow {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
	}
	.cite {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 1px 4px 1px 6px;
		border: 2px solid var(--cursor);
		color: var(--ink);
		letter-spacing: 0.04em;
	}
	.cite i {
		font-style: normal;
		color: var(--ink-dim);
	}
	.cite b {
		font-weight: 400;
	}
	.cite.sealed {
		border-color: var(--luck);
	}
	.problem {
		color: var(--olive);
	}
	.moves {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 6px;
	}
	.move {
		all: unset;
		box-sizing: border-box;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px;
		border: 2px solid var(--rule-hi);
		background: var(--void);
		font-family: var(--font-ui);
		font-size: 11px;
		letter-spacing: 0.06em;
		color: var(--ink-2);
	}
	.move:hover {
		color: var(--ink);
	}
	.move:focus-visible,
	.move.sel {
		outline: 2px solid var(--cursor);
		outline-offset: 2px;
		color: var(--ink);
	}
	@media (max-width: 720px) {
		.moves {
			grid-template-columns: 1fr 1fr;
		}
	}
	.pick {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}
	.pick .chip {
		padding: 3px 7px;
		font-size: 10px;
	}
</style>
