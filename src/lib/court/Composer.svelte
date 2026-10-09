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
	const problem = $derived.by(() => {
		if (meta.pair && publicCites.length !== 2) return 'Kutip tepat dua butir (tidak tersegel).';
		if (meta.target && !publicCites.length) return 'Kutip dulu butir yang Anda bantah.';
		if (text.trim().length < 8) return 'Sampaikan argumen Anda dalam satu-dua kalimat.';
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
		<p class="micro">Argumen diajukan di babak pembuktian dan pemeriksaan silang.</p>
	{/if}

	<div class="moves" role="radiogroup" aria-label="Langkah">
		{#each moves as [key, m] (key)}
			<button type="button" role="radio" aria-checked={argType === key} class="move" class:sel={argType === key} onclick={() => (argType = key)}>
				<kbd>{m.key}</kbd>
				<strong>{m.label}</strong>
			</button>
		{/each}
	</div>
	<div class="explain">
		<p class="hint">› {meta.hint[you]}</p>
		<p class="example micro">Contoh: {meta.example}</p>
	</div>

	{#if meta.suspect}
		<div class="row">
			<span class="eyebrow">{you === 'prosecution' ? 'Terdakwa' : 'Pelaku lain'}</span>
			{#each suspects as [id, s] (id)}
				<button type="button" class="chip" class:sel={suspect === id} onclick={() => (picked = id)}>{s.name}</button>
			{/each}
		</div>
	{/if}

	<div class="cites">
		<span class="eyebrow">Kutipan</span>
		<div class="slots">
			{#each basket as c, i (c.key)}
				<div class="cite" class:sealed={c.sealed}>
					<span class="n">{slotLabel(i)}</span>
					<span class="k" title={factTitle(c.key, room.evidence, room.case)}>{factName(c.key, room.case)}</span>
					{#if sealable(c.key)}
						<button type="button" class="mini" title="Dasar tersegel tetap tersembunyi kecuali lawan menuntut bukti" onclick={() => onToggleSeal(c.key)}>
							{c.sealed ? '🔒 SEGEL' : 'BUKA'}
						</button>
					{/if}
					<button type="button" class="mini" aria-label="Hapus" onclick={() => onRemove(c.key)}>×</button>
				</div>
			{/each}
			{#each Array(Math.max(0, 2 - basket.length)) as _, i (i)}
				<div class="cite slot"><span class="n">{slotLabel(basket.length + i)}</span><span class="micro">kosong</span></div>
			{/each}
		</div>
		<p class="micro">
			Tekan <kbd>C</kbd> pada bukti, atau klik chip di berita acara, untuk mengutip. Bukti rahasia yang dikutip ikut diajukan — atau
			<b>segel</b> sebagai dasar tersembunyi dan menggertak.
		</p>
	</div>

	{#if targetSeq !== undefined}
		<p class="target">Menanggapi #{targetSeq} <button type="button" class="mini" onclick={onClearTarget}>×</button></p>
	{/if}

	<textarea bind:value={text} maxlength="600" placeholder="Yang Mulia, …" disabled={!allowed}></textarea>

	<div class="send">
		<span class="micro problem">{allowed ? (myTurn ? problem : 'Siapkan sekarang — kirim saat giliran Anda.') : ''}</span>
		<button class="btn primary" disabled={!allowed || !myTurn || busy || !!problem}>
			{myTurn ? meta.label : 'Tunggu giliran'} <kbd>⌘↵</kbd>
		</button>
	</div>
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

	.cites {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.slots {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.cite {
		display: flex;
		align-items: center;
		gap: 6px;
		min-width: 120px;
		min-height: 36px;
		padding: 4px 8px;
		border: 2px solid var(--rule-hi);
		background: var(--night-2);
	}
	.cite.slot {
		border-style: dashed;
		border-color: var(--rule);
		justify-content: center;
	}
	.cite.sealed {
		border-color: var(--luck-deep);
	}
	.n {
		font-family: var(--font-ui);
		font-size: 10px;
		color: var(--ink-ghost);
	}
	.k {
		color: var(--ink);
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
		justify-content: space-between;
		align-items: center;
		gap: 12px;
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
	.explain {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.example {
		color: var(--ink-ghost);
	}
	@media (max-width: 720px) {
		.moves {
			grid-template-columns: 1fr 1fr;
		}
	}
</style>
