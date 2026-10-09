<!-- The agreed timeline, your own reconstruction, suspects and notes. Private to you. -->
<script lang="ts">
	import type { CourtNotes, SuspectMark } from './notes.svelte';
	import type { CourtView } from './types';

	let { room, notes }: { room: CourtView; notes: CourtNotes } = $props();

	let time = $state('');
	let text = $state('');

	const MARKS: { mark: SuspectMark; label: string }[] = [
		{ mark: 'suspect', label: 'Curiga' },
		{ mark: 'unsure', label: 'Ragu' },
		{ mark: 'cleared', label: 'Bersih' }
	];

	// The case timeline keeps its own order (times or dates); your reconstruction follows.
	const merged = $derived([
		...room.case.timeline.map((t) => ({ ...t, mine: -1 })),
		...notes.data.timeline.map((t, i) => ({ ...t, mine: i }))
	]);
</script>

<div class="cols">
	<div class="col">
		<span class="eyebrow">Kronologi</span>
		<ol class="line">
			{#each merged as t, i (`${t.time}-${i}`)}
				<li class:mine={t.mine >= 0}>
					<span class="time">{t.time}</span>
					<span class="text">{t.text}</span>
					{#if t.mine >= 0}
						<button class="x" aria-label="Hapus" onclick={() => notes.removeEvent(t.mine)}>×</button>
					{/if}
				</li>
			{/each}
		</ol>
		<form
			class="add"
			onsubmit={(e) => {
				e.preventDefault();
				if (!time.trim() || !text.trim()) return;
				notes.addEvent(time.trim(), text.trim());
				time = '';
				text = '';
			}}
		>
			<input class="t" bind:value={time} placeholder="23:35" maxlength="8" aria-label="Waktu" />
			<input bind:value={text} placeholder="Teori Anda: apa yang terjadi saat itu?" maxlength="120" aria-label="Peristiwa" />
			<button class="btn small">Tambah</button>
		</form>
	</div>

	<div class="col">
		<span class="eyebrow">Tokoh perkara</span>
		{#each Object.entries(room.case.suspects) as [id, s] (id)}
			{@const mark = notes.data.suspects[id]}
			<div class="suspect mark-{mark ?? 'none'}">
				<div>
					<strong>{s.name}</strong> <span class="micro">{s.role}</span>
					<p>{s.bio}</p>
				</div>
				<div class="marks">
					{#each MARKS as m (m.mark)}
						<button class="btn small" class:on={mark === m.mark} onclick={() => notes.suspect(id, m.mark)}>{m.label}</button>
					{/each}
				</div>
			</div>
		{/each}

		<label class="eyebrow" for="court-notes">Catatan · hanya Anda yang bisa melihat</label>
		<textarea id="court-notes" bind:value={notes.data.text} oninput={() => notes.save()} placeholder="Siapa yang punya akses? Siapa yang diuntungkan?"></textarea>
	</div>
</div>

<style>
	.cols {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
	}
	@media (max-width: 720px) {
		.cols {
			grid-template-columns: 1fr;
		}
	}
	.col {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.line {
		list-style: none;
		margin: 0;
		padding: 0;
		border-left: 2px solid var(--rule-hi);
	}
	.line li {
		display: flex;
		gap: 10px;
		padding: 2px 0 2px 10px;
		position: relative;
		align-items: baseline;
	}
	.line li::before {
		content: '';
		position: absolute;
		left: -5px;
		top: 10px;
		width: 8px;
		height: 8px;
		background: var(--rule-hi);
	}
	.line li.mine::before {
		background: var(--signal);
	}
	.time {
		font-family: var(--font-ui);
		font-size: 12px;
		color: var(--ink-dim);
		flex-shrink: 0;
	}
	.mine .text {
		color: var(--signal);
	}
	.x {
		all: unset;
		cursor: pointer;
		color: var(--ink-dim);
		margin-left: auto;
		padding: 0 6px;
	}
	.add {
		display: flex;
		gap: 6px;
	}
	.add .t {
		width: 5.2em;
		flex-shrink: 0;
	}

	.suspect {
		display: flex;
		flex-direction: column;
		gap: 6px;
		border: 2px solid var(--rule);
		padding: 8px 10px;
		background: var(--night-2);
	}
	.suspect strong {
		font-family: var(--font-ui);
		font-size: 12px;
		color: var(--ink);
		font-weight: 400;
	}
	.suspect p {
		color: var(--ink-dim);
		line-height: 1.05;
	}
	.mark-suspect {
		border-color: var(--hp-deep);
	}
	.mark-cleared {
		border-color: var(--spd-deep);
	}
	.marks {
		display: flex;
		gap: 6px;
	}
	:global(.mek) .btn.on {
		border-color: var(--cursor);
		color: var(--ink);
	}
</style>
