<!-- Evidence slots, grouped by where they came from. -->
<script lang="ts">
	import { FLAG_LABEL, type Side } from '../../../convex/court/rules';
	import type { CourtNotes } from './notes.svelte';
	import type { CourtView, EvidenceItem } from './types';

	let {
		room,
		notes,
		selected,
		basket,
		onSelect
	}: {
		room: CourtView;
		notes: CourtNotes;
		selected?: string;
		basket: string[];
		onSelect: (id: string) => void;
	} = $props();

	const you = $derived(room.you as Side | undefined);
	const groups = $derived([
		{ title: 'Berkas umum', items: room.evidence.filter((e) => e.kind === 'public') },
		{ title: 'Berkas Anda · rahasia', items: room.evidence.filter((e) => e.kind === you) },
		{
			title: 'Berkas lawan · diajukan',
			items: room.evidence.filter((e) => e.kind !== 'public' && e.kind !== 'hidden' && e.kind !== you)
		},
		{ title: 'Catatan pengadilan · terbuka', items: room.evidence.filter((e) => e.kind === 'hidden') }
	]);

	const MARK = { key: '★', doubt: '?', lie: '✗' } as const;

	function state(e: EvidenceItem) {
		if (e.discredited) return 'GUGUR';
		if (e.kind === you && !e.onRecord) return 'TERSEGEL';
		return e.onRecord ? 'TERCATAT' : '';
	}
</script>

<div class="groups">
	{#each groups as g (g.title)}
		{#if g.items.length || g.title.startsWith('Catatan')}
			<div class="group">
				<span class="eyebrow">{g.title}</span>
				{#if !g.items.length}
					<div class="slot empty"><span class="micro">Mohon klarifikasi majelis untuk membuka catatan tersegel.</span></div>
				{/if}
				<div class="grid">
					{#each g.items as e (e.id)}
						{@const mark = notes.data.marks[e.id]}
						<button
							class="item kind-{e.kind}"
							class:sel={selected === e.id}
							class:struck={e.discredited}
							class:cited={basket.includes(e.id)}
							onclick={() => onSelect(e.id)}
						>
							<span class="id">{e.id}{#if mark}<i class="mark mark-{mark}">{MARK[mark]}</i>{/if}</span>
							<span class="title">{e.title}</span>
							<span class="foot micro">
								{state(e)}
								{#if e.flag && (e.onRecord || e.kind === you)}<em class="flag">{FLAG_LABEL[e.flag]}</em>{/if}
							</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}
	{/each}
</div>

<style>
	.groups {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 8px;
	}
	.empty {
		padding: 10px;
		border: 2px dashed var(--rule);
	}

	.item {
		all: unset;
		box-sizing: border-box;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 8px 10px;
		background: var(--night-2);
		border: 2px solid var(--rule);
		min-height: 84px;
	}
	.item:hover {
		border-color: var(--rule-hi);
	}
	.item:focus-visible {
		outline: 2px dashed var(--ink-dim);
		outline-offset: 2px;
	}
	.item.sel {
		outline: 2px solid var(--cursor);
		outline-offset: 2px;
	}
	.item.cited {
		background: var(--night-3);
	}
	.item.struck .title {
		text-decoration: line-through;
		color: var(--ink-dim);
	}

	.id {
		font-family: var(--font-ui);
		font-size: 14px;
		color: var(--ink);
		display: flex;
		justify-content: space-between;
	}
	.kind-defense .id {
		color: var(--def);
	}
	.kind-prosecution .id {
		color: var(--atk);
	}
	.kind-hidden .id {
		color: var(--luck);
	}

	.title {
		font-size: 19px;
		line-height: 1;
		color: var(--ink-2);
		flex: 1;
	}
	.foot {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
	}
	.flag {
		font-style: normal;
		color: var(--olive);
	}

	.mark {
		font-style: normal;
	}
	.mark-key {
		color: var(--luck);
	}
	.mark-doubt {
		color: var(--ink-dim);
	}
	.mark-lie {
		color: var(--hp);
	}
</style>
