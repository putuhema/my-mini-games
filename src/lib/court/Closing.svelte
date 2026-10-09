<!-- Closing argument: theory, key evidence, the opponent's weaknesses, what's uncertain, why you win. -->
<script lang="ts">
	import { CLOSING_PARTS, SIDE_LABEL, type ClosingKey, type Side } from '../../../convex/court/rules';
	import { factName, factTitle, type CourtView } from './types';

	let {
		room,
		msLeft,
		busy,
		onSubmit
	}: {
		room: CourtView;
		msLeft: number;
		busy: boolean;
		onSubmit: (parts: Record<ClosingKey, string>, cites: string[]) => void;
	} = $props();

	const you = $derived(room.you as Side);
	const them = $derived<Side>(you === 'defense' ? 'prosecution' : 'defense');
	const done = $derived(you === 'defense' ? room.closings.defenseIn : room.closings.prosecutionIn);
	const theyDone = $derived(them === 'defense' ? room.closings.defenseIn : room.closings.prosecutionIn);

	let parts = $state<Record<ClosingKey, string>>({ theory: '', opponent: '', uncertain: '', why: '' });
	let cites = $state<string[]>([]);

	// Key evidence comes from the record.
	const options = $derived([
		...room.evidence.filter((e) => e.onRecord && !e.discredited).map((e) => e.id),
		...room.onRecord.filter((k) => k.includes('.'))
	]);

	const clock = $derived.by(() => {
		const s = Math.max(0, Math.ceil(msLeft / 1000));
		return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
	});

	function toggle(key: string) {
		cites = cites.includes(key) ? cites.filter((k) => k !== key) : cites.length < 5 ? [...cites, key] : cites;
	}
</script>

<section class="closing panel">
	<header>
		<div>
			<span class="eyebrow">Babak 5 · {you === 'defense' ? 'Pledoi' : 'Tuntutan'}</span>
			<h2>Sampaikan {you === 'defense' ? 'pembelaan' : 'tuntutan'} Anda</h2>
		</div>
		<div class="clock" class:urgent={msLeft < 30000}>{clock}</div>
	</header>

	{#if done}
		<p class="wait">
			{you === 'defense' ? 'Pledoi' : 'Tuntutan'} Anda sudah di tangan majelis.
			{#if theyDone}Majelis mundur untuk bermusyawarah…{:else}Menunggu {SIDE_LABEL[them]}<span class="blink">_</span>{/if}
		</p>
	{:else}
		<form
			onsubmit={(e) => {
				e.preventDefault();
				onSubmit(parts, cites);
			}}
		>
			{#each CLOSING_PARTS as p, i (p.key)}
				<label class="part">
					<span class="eyebrow"><b>{i === 0 ? 1 : i + 2}</b> · {p.label}</span>
					<textarea bind:value={parts[p.key]} maxlength="600" rows="2"></textarea>
				</label>
				{#if i === 0}
					<div class="part">
						<span class="eyebrow"><b>2</b> · Bukti andalan (maks. 5)</span>
						<div class="keys">
							{#each options as key (key)}
								<button type="button" class="chip" class:sel={cites.includes(key)} title={factTitle(key, room.evidence, room.case)} onclick={() => toggle(key)}>
									{factName(key, room.case)}
								</button>
							{/each}
						</div>
					</div>
				{/if}
			{/each}
			<div class="send">
				<span class="micro">{theyDone ? `${SIDE_LABEL[them]} sudah selesai.` : `${SIDE_LABEL[them]} masih menulis.`}</span>
				<button class="btn primary" disabled={busy || !parts.theory.trim()}>Serahkan <kbd>↵</kbd></button>
			</div>
		</form>
	{/if}
</section>

<style>
	.closing {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
	}
	h2 {
		font-size: 22px;
		margin-top: 4px;
	}
	.clock {
		font-family: var(--font-ui);
		font-size: 30px;
		letter-spacing: 0.18em;
		color: var(--ink);
	}
	.clock.urgent {
		color: var(--hp);
		animation: mek-blink 900ms steps(1) infinite;
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.part {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.keys {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.chip {
		font-family: var(--font-ui);
		font-size: 10px;
		background: var(--void);
		color: var(--ink-2);
		border: 2px solid var(--rule-hi);
		padding: 4px 7px;
		cursor: pointer;
	}
	.chip.sel {
		border-color: var(--cursor);
		color: var(--ink);
	}
	.send {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.wait {
		color: var(--signal);
	}
</style>
