<!-- The witness box: structured questions, free questions, and confrontations in cross-examination. -->
<script lang="ts">
	import { topicLabel, topicsFor } from '../../../convex/court/rules';
	import { factName, factTitle, type CourtView } from './types';

	let {
		room,
		myTurn,
		busy,
		onAsk,
		onConfront,
		onCite
	}: {
		room: CourtView;
		myTurn: boolean;
		busy: boolean;
		onAsk: (witness: string, topic?: string, question?: string) => void;
		onConfront: (witness: string, fact: string) => void;
		onCite: (key: string) => void;
	} = $props();

	const ids = $derived(Object.keys(room.case.witnesses));
	let picked = $state<string>();
	const witness = $derived(picked && ids.includes(picked) ? picked : ids[0]);
	let question = $state('');
	let confrontWith = $state('');

	const w = $derived(room.case.witnesses[witness]);
	const said = $derived(room.entries.filter((e) => (e.kind === 'ask' || e.kind === 'confront') && e.witness === witness));
	const asked = $derived(new Set(room.onRecord.filter((k) => k.startsWith(`${witness}.`)).map((k) => k.split('.')[1])));
	const canAsk = $derived(room.phase === 'witness' && myTurn && !busy);
	const canConfront = $derived(room.phase === 'cross' && myTurn && !busy);
	// Anything you could put in front of a witness: the record, plus your own file.
	const confrontable = $derived(room.evidence.filter((e) => e.onRecord || e.kind === room.you));
	const topics = $derived(topicsFor(room.case));

	function onKey(e: KeyboardEvent) {
		if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement).closest?.('input, textarea, select')) return;
		const topic = topics[Number(e.key) - 1];
		if (topic && canAsk && !asked.has(topic)) onAsk(witness, topic);
	}
</script>

<svelte:window onkeydown={onKey} />

<div class="box">
	<div class="picker" role="tablist" aria-label="Saksi">
		{#each ids as id, i (id)}
			<button role="tab" class="who" class:sel={witness === id} aria-selected={witness === id} onclick={() => (picked = id)}>
				<span class="micro">S{i + 1}</span>
				<strong>{room.case.witnesses[id].name}</strong>
				<span class="micro">{room.case.witnesses[id].role}</span>
			</button>
		{/each}
	</div>

	<p class="bio">{w.bio}</p>

	<div class="testimony">
		<span class="eyebrow">Keterangan</span>
		{#if !said.length}
			<p class="none">> Belum diperiksa.</p>
		{/if}
		{#each said as e (e._id)}
			<div class="qa">
				<p class="q"><span class="side-{e.side}">{e.side === 'defense' ? 'PH' : 'JPU'}</span> {e.text}</p>
				<p class="a">{e.pending ? '…' : `“${e.answer}”`}</p>
				{#each e.cites.filter((k) => k.includes('.')) as key (key)}
					<button class="btn small" title={factTitle(key, room.evidence, room.case)} onclick={() => onCite(key)}>Kutip {factName(key, room.case)}</button>
				{/each}
			</div>
		{/each}
	</div>

	{#if room.phase === 'witness'}
		<div class="ask">
			<span class="eyebrow">Tanya {w.short} {#if !myTurn}<b>· tunggu giliran Anda</b>{/if}</span>
			<div class="topics">
				{#each topics as topic, i (topic)}
					<button class="btn small" disabled={!canAsk || asked.has(topic)} onclick={() => onAsk(witness, topic)}>
						<kbd>{i + 1}</kbd>{topicLabel(topic, room.case)}
					</button>
				{/each}
			</div>
			<form
				class="free"
				onsubmit={(e) => {
					e.preventDefault();
					onAsk(witness, undefined, question);
					question = '';
				}}
			>
				<input bind:value={question} maxlength="200" placeholder="Atau ajukan pertanyaan sendiri…" disabled={!canAsk} />
				<button class="btn primary" disabled={!canAsk || question.trim().length < 5}>Tanya <kbd>↵</kbd></button>
			</form>
		</div>
	{:else if room.phase === 'cross'}
		<div class="ask">
			<span class="eyebrow">Konfrontasi {w.short} dengan bukti {#if !myTurn}<b>· tunggu giliran Anda</b>{/if}</span>
			<form
				class="free"
				onsubmit={(e) => {
					e.preventDefault();
					if (confrontWith) onConfront(witness, confrontWith);
				}}
			>
				<select bind:value={confrontWith} disabled={!canConfront}>
					<option value="">Pilih barang bukti…</option>
					{#each confrontable as e (e.id)}
						<option value={e.id}>{e.id} · {e.title}{e.onRecord ? '' : ' (sekaligus diajukan)'}</option>
					{/each}
				</select>
				<button class="btn danger" disabled={!canConfront || !confrontWith}>Konfrontasi <kbd>↵</kbd></button>
			</form>
			<p class="micro">Saksi yang terbentur bukti memicu kontradiksi.</p>
		</div>
	{:else}
		<p class="micro">Saksi diperiksa di babak 3 dan dikonfrontasi di babak 4.</p>
	{/if}
</div>

<style>
	.box {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.picker {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
	}
	.who {
		all: unset;
		box-sizing: border-box;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 8px 10px;
		border: 2px solid var(--rule);
		background: var(--night-2);
	}
	.who strong {
		font-family: var(--font-ui);
		font-size: 12px;
		color: var(--ink);
		font-weight: 400;
	}
	.who.sel {
		outline: 2px solid var(--cursor);
		outline-offset: 2px;
	}
	.who:focus-visible {
		outline: 2px dashed var(--ink-dim);
	}
	.bio {
		color: var(--ink-dim);
	}

	.testimony {
		display: flex;
		flex-direction: column;
		gap: 8px;
		max-height: 300px;
		overflow-y: auto;
	}
	.none {
		color: var(--ink-ghost);
	}
	.qa {
		border-left: 2px solid var(--rule-hi);
		padding-left: 10px;
	}
	.q {
		color: var(--ink-2);
	}
	.q span {
		font-family: var(--font-ui);
		font-size: 10px;
	}
	.a {
		color: var(--parchment);
		margin: 2px 0 4px;
	}

	.ask {
		display: flex;
		flex-direction: column;
		gap: 8px;
		border-top: 2px solid var(--rule);
		padding-top: 10px;
	}
	.topics {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 6px;
	}
	.topics .btn {
		justify-content: flex-start;
		text-align: left;
		text-transform: none;
		font-family: var(--font-log);
		font-size: 19px;
		letter-spacing: 0.04em;
	}
	.free {
		display: flex;
		gap: 8px;
	}
	.free .btn {
		flex-shrink: 0;
	}
</style>
