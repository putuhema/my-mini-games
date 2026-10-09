<!-- Build a structured argument: a type, who it's about, what it cites, and the words. -->
<script lang="ts">
	import { ARG_TYPES, type ArgType } from '../../../convex/court/rules';
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

	let argType = $state<ArgType>('identity');
	let picked = $state<string>();
	const suspect = $derived(picked && room.case.suspects[picked] ? picked : room.case.accused);
	let text = $state('');

	const meta = $derived(ARG_TYPES[argType]);
	const allowed = $derived(room.phase === 'evidence' || room.phase === 'cross');
	const sealable = (key: string) => {
		const ev = room.evidence.find((e) => e.id === key);
		return !!ev && ev.kind === room.you && !ev.onRecord;
	};
	const publicCites = $derived(basket.filter((c) => !c.sealed));
	const problem = $derived.by(() => {
		if (meta.pair && publicCites.length !== 2) return 'Kutip tepat dua butir (tidak tersegel).';
		if (meta.target && !publicCites.length) return 'Kutip dulu butir yang Anda serang.';
		if (text.trim().length < 8) return 'Sampaikan argumen Anda dalam satu-dua kalimat.';
		return '';
	});

	const evidenceTypes = Object.entries(ARG_TYPES).filter(([, m]) => m.group === 'evidence') as [ArgType, (typeof ARG_TYPES)[ArgType]][];
	const rhetoricTypes = Object.entries(ARG_TYPES).filter(([, m]) => m.group === 'rhetoric') as [ArgType, (typeof ARG_TYPES)[ArgType]][];

	async function submit(e: Event) {
		e.preventDefault();
		if (problem || busy) return;
		const ok = await onArgue({ argType, suspect: meta.suspect ? suspect : undefined, text: text.trim() });
		if (ok) text = '';
	}
</script>

<form class="composer" onsubmit={submit}>
	{#if !allowed}
		<p class="micro">Argumen diajukan di babak pembuktian dan pemeriksaan silang.</p>
	{/if}

	<div class="types">
		<span class="eyebrow">Argumen pembuktian</span>
		<div class="chips">
			{#each evidenceTypes as [key, m] (key)}
				<button type="button" class="chip" class:sel={argType === key} onclick={() => (argType = key)}>{m.label}</button>
			{/each}
		</div>
		<span class="eyebrow">Argumen retorika</span>
		<div class="chips">
			{#each rhetoricTypes as [key, m] (key)}
				<button type="button" class="chip" class:sel={argType === key} onclick={() => (argType = key)}>{m.label}</button>
			{/each}
		</div>
		<p class="hint">› {meta.hint}</p>
	</div>

	{#if meta.suspect}
		<div class="row">
			<span class="eyebrow">Tentang</span>
			{#each Object.entries(room.case.suspects) as [id, s] (id)}
				<button type="button" class="chip" class:sel={suspect === id} onclick={() => (picked = id)}>{s.name}</button>
			{/each}
		</div>
	{/if}

	<div class="cites">
		<span class="eyebrow">Kutipan {#if meta.target}<b>· pertama = sasaran</b>{/if}</span>
		<div class="slots">
			{#each basket as c, i (c.key)}
				<div class="cite" class:sealed={c.sealed}>
					<span class="n">{i + 1}</span>
					<span class="k" title={factTitle(c.key, room.evidence, room.case)}>{factName(c.key, room.case)}</span>
					{#if sealable(c.key)}
						<button type="button" class="mini" title="Dasar tersegel tetap tersembunyi kecuali lawan menuntut bukti" onclick={() => onToggleSeal(c.key)}>
							{c.sealed ? '🔒 SEGEL' : 'BUKA'}
						</button>
					{/if}
					<button type="button" class="mini" aria-label="Hapus" onclick={() => onRemove(c.key)}>×</button>
				</div>
			{/each}
			{#each Array(Math.max(0, 3 - basket.length)) as _, i (i)}
				<div class="cite slot"><span class="micro">kosong</span></div>
			{/each}
		</div>
		<p class="micro">Tekan <kbd>C</kbd> pada butir atau klik chip di berita acara untuk mengutip. Mengutip bukti rahasia Anda berarti mengajukannya — atau segel sebagai dasar tersembunyi dan menggertak.</p>
	</div>

	{#if targetSeq !== undefined}
		<p class="target">Menanggapi #{targetSeq} <button type="button" class="mini" onclick={onClearTarget}>×</button></p>
	{/if}

	<textarea bind:value={text} maxlength="600" placeholder="Yang Mulia, …" disabled={!allowed}></textarea>

	<div class="send">
		<span class="micro problem">{allowed && myTurn ? problem : ''}</span>
		<button class="btn primary" disabled={!allowed || !myTurn || busy || !!problem}>
			{myTurn ? 'Ajukan' : 'Tunggu giliran'} <kbd>⌘↵</kbd>
		</button>
	</div>
</form>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && document.activeElement?.closest('.composer')) submit(e);
	}}
/>

<style>
	.composer {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.types {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.chips,
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
</style>
