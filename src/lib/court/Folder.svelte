<!-- The evidence folder: the item in hand and what you can do with it. Floats over the court by default; can be docked inline. -->
<script lang="ts">
	import type { CourtNotes, Mark } from './notes.svelte';
	import type { CourtView, EvidenceItem } from './types';

	let {
		room,
		item,
		notes,
		cited,
		canPresent,
		canClarify,
		onPresent,
		onClarify,
		onCite,
		docked,
		position,
		onClose,
		onStep,
		onToggleDock
	}: {
		room: CourtView;
		item?: EvidenceItem;
		notes: CourtNotes;
		cited: boolean;
		canPresent: boolean;
		canClarify: boolean;
		onPresent: () => void;
		onClarify: () => void;
		onCite: () => void;
		docked: boolean;
		/** "3/14": where the item sits in the evidence you can see. */
		position: string;
		onClose: () => void;
		onStep: (dir: -1 | 1) => void;
		onToggleDock: () => void;
	} = $props();

	const KIND = {
		public: 'UMUM',
		defense: 'BERKAS PENASIHAT HUKUM',
		prosecution: 'BERKAS JAKSA',
		hidden: 'CATATAN PENGADILAN'
	};

	const MARKS: { mark: Mark; label: string; key: string }[] = [
		{ mark: 'key', label: '★ Kunci', key: '7' },
		{ mark: 'doubt', label: '? Ragu', key: '8' },
		{ mark: 'lie', label: '✗ Palsu', key: '9' }
	];
</script>

<div class="folder" class:floating={!docked} role={docked ? undefined : 'dialog'} aria-label="Map barang bukti">
	<div class="tab-ear">MAP BARANG BUKTI</div>
	{#if item}
		<div class="bar">
			<button class="btn small" onclick={() => onStep(-1)} aria-label="Bukti sebelumnya"><kbd>←</kbd></button>
			<span class="micro">{position}</span>
			<button class="btn small" onclick={() => onStep(1)} aria-label="Bukti berikutnya"><kbd>→</kbd></button>
			<span class="grow"></span>
			<button class="btn small" onclick={onToggleDock} title={docked ? 'Jadikan jendela mengambang' : 'Tempel di halaman'}>
				{docked ? 'Ambangkan' : 'Tempel'}
			</button>
			<button class="btn small" onclick={onClose} aria-label="Tutup">× <kbd>ESC</kbd></button>
		</div>
		<article class="inspect" class:struck={item.discredited}>
			<header>
				<span class="id kind-{item.kind}">{item.id}</span>
				<div>
					<div class="t">{item.title}</div>
					<div class="s">
						{KIND[item.kind]}{item.onRecord ? ' · TERCATAT' : item.kind === room.you ? ' · TERSEGEL (hanya Anda yang bisa melihat)' : ''}
					</div>
				</div>
			</header>
			<p class="text">{item.text}</p>
			{#if item.flag && (item.onRecord || item.kind === room.you)}
				<p class="flag">⚑ {item.flag === 'unreliable' ? 'Tak andal: gunakan dengan hati-hati.' : 'Bertentangan: sebagian isinya mungkin tak bertahan.'}</p>
			{/if}
			{#if item.discredited}
				<p class="stamp">DIKESAMPINGKAN DARI PERTIMBANGAN</p>
			{/if}
			{#if 'truth' in item && item.truth}
				<p class="truth">FAKTA › {item.truth}</p>
			{/if}
			<div class="marks">
				{#each MARKS as m (m.mark)}
					<button class="btn small" class:on={notes.data.marks[item.id] === m.mark} onclick={() => notes.mark(item.id, m.mark)}>
						{m.label} <kbd>{m.key}</kbd>
					</button>
				{/each}
			</div>
			<div class="acts">
				<button class="btn small" class:on={cited} onclick={onCite}>
					{cited ? 'Batal kutip' : 'Kutip'} <kbd>C</kbd>
				</button>
				{#if canPresent}
					<button class="btn small primary" onclick={onPresent}>Ajukan <kbd>P</kbd></button>
				{/if}
				{#if canClarify}
					<button class="btn small gold" onclick={onClarify}>Mohon klarifikasi <kbd>Q</kbd></button>
				{/if}
			</div>
		</article>
	{:else}
		<div class="empty">
			<span class="marker"></span>
			<p>Pilih barang bukti dari tab Bukti untuk membukanya di sini.</p>
		</div>
	{/if}
</div>

<style>
	.folder {
		position: relative;
		background: var(--olive-dk, #615a32);
		background: linear-gradient(var(--luck-deep), var(--luck-deep)) top / 100% 6px no-repeat, var(--night-3);
		border: 2px solid var(--luck-deep);
		padding: 22px 14px 14px;
	}
	.tab-ear {
		position: absolute;
		top: -2px;
		left: 14px;
		font-family: var(--font-ui);
		font-size: 10px;
		letter-spacing: 0.12em;
		background: var(--luck-deep);
		color: var(--parchment);
		padding: 3px 10px;
	}

	.bar {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 10px;
	}
	.grow {
		flex: 1;
	}

	/* Floating card over the court: the record and tabs stay usable behind it. */
	.floating {
		position: fixed;
		z-index: 40;
		left: 50%;
		bottom: 16px;
		translate: -50% 0;
		width: min(640px, calc(100vw - 32px));
		max-height: min(72dvh, 680px);
		overflow-y: auto;
		box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.6);
		animation: folder-in 160ms cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	@keyframes folder-in {
		from {
			opacity: 0;
			translate: -50% 12px;
		}
	}
	/* Desktop: centre over the left column, clear of the court record. */
	@media (min-width: 1001px) {
		.floating {
			left: calc(50% - 218px);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.floating {
			animation: none;
		}
	}
	@media (max-width: 720px) {
		.floating {
			left: 0;
			right: 0;
			bottom: 0;
			translate: none;
			width: auto;
			max-height: 80dvh;
			padding-bottom: calc(14px + env(safe-area-inset-bottom));
		}
		@keyframes folder-in {
			from {
				opacity: 0;
				translate: 0 24px;
			}
		}
	}

	.inspect {
		background: var(--void);
		border: 2px solid var(--rule-hi);
		box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.5);
	}
	.inspect header {
		display: flex;
		gap: 12px;
		align-items: center;
		padding: 10px 12px;
		border-bottom: 2px solid var(--rule);
	}
	.id {
		font-family: var(--font-ui);
		font-size: 18px;
		width: 44px;
		height: 44px;
		display: grid;
		place-items: center;
		border: 2px solid var(--rule-hi);
		color: var(--ink);
		flex-shrink: 0;
	}
	.kind-defense {
		color: var(--def);
		border-color: var(--def-deep);
	}
	.kind-prosecution {
		color: var(--atk);
		border-color: var(--atk-deep);
	}
	.kind-hidden {
		color: var(--luck);
		border-color: var(--luck-deep);
	}
	.t {
		font-family: var(--font-ui);
		font-size: 13px;
		color: var(--ink);
		letter-spacing: 0.04em;
	}
	.s {
		font-family: var(--font-ui);
		font-size: 10px;
		color: var(--ink-dim);
		letter-spacing: 0.08em;
		margin-top: 2px;
	}
	.text {
		padding: 12px;
		color: var(--parchment);
		font-size: 23px;
		line-height: 1.1;
	}
	.struck .text {
		text-decoration: line-through;
		color: var(--ink-dim);
	}
	.flag {
		padding: 0 12px 8px;
		color: var(--olive);
	}
	.stamp {
		margin: 0 12px 10px;
		display: inline-block;
		font-family: var(--font-ui);
		font-size: 11px;
		color: var(--hp);
		border: 2px solid var(--hp);
		padding: 2px 8px;
		transform: rotate(-2deg);
	}
	.truth {
		padding: 0 12px 10px;
		color: var(--exp);
	}
	.marks,
	.acts {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		padding: 0 12px 10px;
	}
	.acts {
		border-top: 2px solid var(--rule);
		padding-top: 10px;
	}
	:global(.mek) .btn.on {
		border-color: var(--cursor);
		color: var(--ink);
	}

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		padding: 28px 12px;
		color: var(--ink-dim);
		text-align: center;
	}
</style>
