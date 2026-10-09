<script lang="ts">
	import { goto } from '$app/navigation';
	import { useMutation, useQuery } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import { errorMessage, me, saveName } from '#lib/player.svelte.ts';
	import Mek from '#lib/court/Mek.svelte';
	import Portrait from '#lib/court/Portrait.svelte';

	const createRoom = useMutation(api.court.create);
	const joinRoom = useMutation(api.court.join);
	const cases = useQuery(api.court.cases, {});

	let name = $state(me.name);
	let code = $state('');
	let picked = $state<string>();
	let busy = $state(false);
	let error = $state('');

	const list = $derived(cases.data ?? []);
	const chosen = $derived(list.find((c) => c.id === picked) ?? list[0]);

	async function run(action: () => Promise<string>) {
		error = '';
		busy = true;
		try {
			saveName(name);
			const roomCode = await action();
			await goto(`/court/${roomCode}`);
		} catch (err) {
			error = errorMessage(err);
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head><title>Ruang Sidang · Us, Apart</title></svelte:head>

<Mek>
	<main>
		<nav class="top">
			<a class="btn small" href="/"><kbd>ESC</kbd> Semua permainan</a>
			<span class="micro">{chosen?.docket ?? ''}</span>
		</nav>

		<section class="hero">
			<div>
				<p class="eyebrow">▸ Ruang sidang untuk berdua · <b>{list.length} perkara</b></p>
				<h1>RUANG<br /><span>SIDANG</span><i class="caret"></i></h1>
				<p class="lede">
					Satu orang menjadi <b>Penasihat Hukum</b>, satu lagi <b>Jaksa Penuntut</b>. Masing-masing memegang bukti yang
					tak bisa dilihat lawan. Hakim AI tahu apa yang sebenarnya terjadi — tetapi memutus berdasarkan siapa yang
					<b>berargumen</b> lebih baik.
				</p>
				<p class="lede">
					Perkara-perkara ini fiktif, tapi berangkat dari hal yang akrab: pinjol dan judi online, dana desa menjelang
					Pilkades, konflik lahan sawit. Hati-hati dengan yang viral.
				</p>
			</div>
			<div class="bench">
				<div class="seat"><Portrait who="defense" size={64} /><span class="eyebrow side-defense">Penasihat Hukum</span><span class="micro">Pemain 1</span></div>
				<div class="seat judge"><Portrait who="judge" size={84} /><span class="eyebrow side-court">Hakim</span><span class="micro">GLM-5</span></div>
				<div class="seat"><Portrait who="prosecution" size={64} /><span class="eyebrow side-prosecution">Jaksa</span><span class="micro">Pemain 2</span></div>
			</div>
		</section>

		<section class="cases" aria-label="Pilih perkara">
			{#each list as c, i (c.id)}
				<button class="case panel" class:sel={chosen?.id === c.id} aria-pressed={chosen?.id === c.id} onclick={() => (picked = c.id)}>
					<span class="micro">
						{#if c.tutorial}<b class="badge">MULAI DI SINI · LATIHAN</b>{:else}PERKARA {String(i).padStart(2, '0')}{/if} · {c.setting}
					</span>
					<strong>{c.title}</strong>
					<span class="tagline">{c.tagline}</span>
				</button>
			{/each}
		</section>

		<section class="form panel">
			<span class="tag">DAFTAR HADIR KUASA</span>
			<label class="eyebrow" for="name">Nama Anda</label>
			<div class="chat">
				<span class="p">&gt;</span>
				<input id="name" bind:value={name} maxlength="24" placeholder="mis. Sayang" autocomplete="nickname" />
			</div>

			<button
				class="btn primary full"
				disabled={busy || !name.trim() || !chosen}
				onclick={() => run(() => createRoom({ playerId: me.id, name, caseId: chosen?.id }))}
			>
				Buka sidang · Anda membela <kbd>↵</kbd>
			</button>

			<div class="divider"><span class="micro">atau masuk sebagai jaksa</span></div>

			<form
				class="join"
				onsubmit={(e) => {
					e.preventDefault();
					run(() => joinRoom({ code, playerId: me.id, name }));
				}}
			>
				<input class="code" bind:value={code} maxlength="4" placeholder="KODE" aria-label="Kode ruang" autocapitalize="characters" autocomplete="off" />
				<button class="btn" disabled={busy || !name.trim() || code.trim().length < 4}>Masuk</button>
			</form>

			{#if error}<p class="err">! {error}</p>{/if}
		</section>

		<section class="phases">
			{#each ['Persiapan', 'Pembuktian', 'Saksi', 'Pemeriksaan Silang', 'Tuntutan & Pledoi', 'Putusan'] as p, i (p)}
				<div class="phase"><span class="n">{String(i + 1).padStart(2, '0')}</span><span>{p}</span></div>
			{/each}
		</section>
	</main>
</Mek>

<svelte:window onkeydown={(e) => e.key === 'Escape' && goto('/')} />

<style>
	main {
		max-width: 1100px;
		margin: 0 auto;
		padding: 0 24px 80px;
	}
	.top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 0;
		border-bottom: 2px solid var(--rule);
	}
	.hero {
		display: grid;
		grid-template-columns: 1.2fr 0.8fr;
		gap: 40px;
		align-items: end;
		padding: 56px 0 32px;
	}
	@media (max-width: 860px) {
		.hero {
			grid-template-columns: 1fr;
		}
	}
	h1 {
		font-size: clamp(40px, 7vw, 84px);
		line-height: 0.9;
		letter-spacing: 0;
		margin: 14px 0 20px;
	}
	h1 span {
		color: var(--signal);
	}
	.caret {
		display: inline-block;
		width: 0.5em;
		height: 0.12em;
		background: var(--cursor);
		margin-left: 6px;
		animation: mek-blink var(--dur-blink) steps(1) infinite;
	}
	.lede {
		max-width: 62ch;
		color: var(--ink-dim);
		font-size: 23px;
		margin-bottom: 10px;
	}
	.lede b {
		color: var(--ink-2);
		font-weight: 400;
	}
	.bench {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		gap: 12px;
	}
	.seat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		padding: 12px;
		border: 2px solid var(--rule);
		background: var(--night-2);
	}
	.seat.judge {
		border-color: var(--luck-deep);
		background: var(--void);
		padding-bottom: 28px;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 12px;
		max-width: 520px;
		padding: 24px;
	}
	.chat {
		display: flex;
		align-items: center;
		gap: 8px;
		border: 2px solid var(--rule-hi);
		background: var(--void);
		padding: 2px 12px;
	}
	.chat .p {
		color: var(--signal);
		font-size: 24px;
	}
	.chat input {
		border: none;
		padding: 6px 0;
		background: transparent;
	}
	.chat input:focus {
		outline: none;
	}
	.chat:focus-within {
		outline: 2px solid var(--cursor);
		outline-offset: 2px;
	}
	.divider {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		height: 2px;
		background: var(--rule);
	}
	.join {
		display: flex;
		gap: 8px;
	}
	.code {
		text-transform: uppercase;
		letter-spacing: 0.4em;
		text-align: center;
		font-family: var(--font-ui);
		font-size: 18px;
	}
	.err {
		color: var(--hp);
	}

	.phases {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 0;
		margin-top: 40px;
		border-top: 2px solid var(--rule-hi);
	}
	@media (max-width: 760px) {
		.phases {
			grid-template-columns: repeat(3, 1fr);
		}
	}
	.phase {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 16px 12px 0 0;
		font-family: var(--font-ui);
		font-size: 13px;
		color: var(--ink);
	}
	.phase .n {
		color: var(--signal);
		font-size: 12px;
	}
	.cases {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 12px;
		margin-bottom: 24px;
	}
	.case {
		all: unset;
		box-sizing: border-box;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 16px;
		border: 2px solid var(--rule);
		background: var(--night-2);
	}
	.case strong {
		font-family: var(--font-ui);
		font-size: 14px;
		letter-spacing: 0.06em;
		color: var(--ink);
	}
	.case .tagline {
		color: var(--ink-dim);
		font-size: 20px;
		line-height: 1.05;
	}
	.case:hover {
		border-color: var(--rule-hi);
	}
	.case:focus-visible,
	.case.sel {
		outline: 2px solid var(--cursor);
		outline-offset: 2px;
	}
	.badge {
		color: var(--exp);
		font-weight: 400;
	}
</style>
