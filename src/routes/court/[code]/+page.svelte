<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { useMutation, useQuery } from 'convex-svelte';
	import { api } from '../../../../convex/_generated/api';
	import {
		isTurnPhase,
		MAX_OPENING,
		paceFor,
		PHASE_TITLE,
		topicsFor,
		SIDE_LABEL,
		type ArgType,
		type ClosingKey,
		type Side
	} from '../../../../convex/court/rules';
	import { errorMessage, me, saveName } from '#lib/player.svelte.ts';
	import { sfx, sound, toggleMute } from '#lib/sound.svelte.ts';
	import Mek from '#lib/court/Mek.svelte';
	import Bench from '#lib/court/Bench.svelte';
	import CourtRecord from '#lib/court/Record.svelte';
	import Folder from '#lib/court/Folder.svelte';
	import EvidenceTab from '#lib/court/EvidenceTab.svelte';
	import WitnessTab from '#lib/court/WitnessTab.svelte';
	import TimelineTab from '#lib/court/TimelineTab.svelte';
	import Composer from '#lib/court/Composer.svelte';
	import Closing from '#lib/court/Closing.svelte';
	import Verdict from '#lib/court/Verdict.svelte';
	import { CourtNotes } from '#lib/court/notes.svelte.ts';
	import type { Cite } from '#lib/court/types.ts';

	const code = $derived((page.params.code ?? '').toUpperCase());

	const roomQuery = useQuery(api.court.get, () => ({ code, playerId: me.id }));
	const room = $derived(roomQuery.data);

	const joinRoom = useMutation(api.court.join);
	const submitOpening = useMutation(api.court.opening);
	const present = useMutation(api.court.present);
	const argue = useMutation(api.court.argue);
	const clarify = useMutation(api.court.clarify);
	const ask = useMutation(api.court.ask);
	const confront = useMutation(api.court.confront);
	const demandProof = useMutation(api.court.demandProof);
	const rest = useMutation(api.court.rest);
	const submitClosing = useMutation(api.court.closing);
	const again = useMutation(api.court.again);
	const chooseCase = useMutation(api.court.chooseCase);
	const casesQuery = useQuery(api.court.cases, {});
	const cases = $derived(casesQuery.data ?? []);
	const serverTime = useMutation(api.court.now);

	const you = $derived(room?.you as Side | undefined);
	const live = $derived(!!room && isTurnPhase(room.phase));
	const myTurn = $derived(live && room?.turn === you && (room?.budgets[you!] ?? 0) > 0);

	let name = $state(me.name);
	let busy = $state(false);
	let error = $state('');
	let toast = $state('');
	let alarm = $state('');
	let copied = $state(false);

	type Tab = 'evidence' | 'timeline' | 'witness' | 'arguments';
	let tab = $state<Tab>('evidence');
	let selected = $state<string>();
	let basket = $state<Cite[]>([]);
	let targetSeq = $state<number>();
	let opening = $state('');

	// The scratchpad belongs to this trial; a new trial starts a clean one.
	const notes = $derived(room ? new CourtNotes(room.code, `${room.trial}.${room.case.id}`) : undefined);
	$effect(() => {
		void room?.trial;
		void room?.case.id;
		untrack(() => {
			basket = [];
			targetSeq = undefined;
			selected = undefined;
		});
	});

	// ---- Clock, lined up with the server for the closing countdown ----
	let offset = $state(0);
	let now = $state(Date.now());
	onMount(() => {
		const t0 = Date.now();
		serverTime({}).then((server) => (offset = server - (t0 + Date.now()) / 2));
		const id = setInterval(() => (now = Date.now()), 250);
		return () => clearInterval(id);
	});
	const msLeft = $derived(room?.closingDeadline ? Math.max(0, room.closingDeadline - (now + offset)) : 0);

	// ---- Sounds and banners as the record grows ----
	let seen = -1;
	let lastTurn: string | undefined;
	$effect(() => {
		if (!room) return;
		const entries = room.entries;
		const newest = entries.at(-1)?.seq ?? 0;
		untrack(() => {
			if (seen >= 0 && newest > seen) {
				for (const e of entries.filter((x) => x.seq > seen)) {
					if (e.reaction === 'contradiction') {
						alarm = e.ruling ?? '';
						sfx.strike();
						setTimeout(() => (alarm = ''), 3200);
					} else if (e.reaction === 'exposed') sfx.miss();
					else if (e.reaction === 'revealed') sfx.secret();
					else if (e.side !== you) sfx.blip();
				}
			}
			seen = newest;
		});
	});
	$effect(() => {
		const turn = live ? `${room?.phase}:${room?.turn}` : undefined;
		untrack(() => {
			if (turn && turn !== lastTurn && room?.turn === you && lastTurn !== undefined) {
				sfx.turn();
				flash('GILIRAN ANDA');
			}
			lastTurn = turn;
		});
	});
	let lastPhase = '';
	$effect(() => {
		const phase = room?.phase ?? '';
		untrack(() => {
			if (lastPhase && phase !== lastPhase) {
				if (phase === 'verdict') sfx.bell();
				else if (phase === 'witness' || phase === 'cross') tab = 'witness';
				else if (phase === 'evidence') tab = 'evidence';
			}
			lastPhase = phase;
		});
	});

	function flash(text: string) {
		toast = text;
		setTimeout(() => toast === text && (toast = ''), 2200);
	}

	async function run(action: () => Promise<unknown>) {
		error = '';
		busy = true;
		try {
			await action();
			return true;
		} catch (err) {
			error = errorMessage(err);
			flash(`! ${error}`);
			return false;
		} finally {
			busy = false;
		}
	}

	const roomId = () => room!._id;

	// ---- Cite basket ----
	function toggleCite(key: string) {
		if (basket.some((c) => c.key === key)) basket = basket.filter((c) => c.key !== key);
		else if (basket.length >= 5) flash('MAKSIMAL LIMA KUTIPAN');
		else {
			basket = [...basket, { key, sealed: false }];
			flash(`DIKUTIP ${key}`);
		}
	}
	function toggleSeal(key: string) {
		basket = basket.map((c) => (c.key === key ? { ...c, sealed: !c.sealed } : c));
	}

	// ---- Moves ----
	const item = $derived(room?.evidence.find((e) => e.id === selected));

	// ---- Evidence folder: a floating card by default, or docked inline ----
	let docked = $state(typeof localStorage !== 'undefined' && localStorage.getItem('court.folderDocked') === '1');
	function toggleDock() {
		docked = !docked;
		localStorage.setItem('court.folderDocked', docked ? '1' : '0');
	}
	// Same order as the evidence tab: public, yours, theirs, court records.
	const browsable = $derived.by(() => {
		if (!room) return [];
		const rank = (k: string) => (k === 'public' ? 0 : k === you ? 1 : k === 'hidden' ? 3 : 2);
		return [...room.evidence].sort((a, b) => rank(a.kind) - rank(b.kind)).map((e) => e.id);
	});
	function step(dir: -1 | 1) {
		if (!browsable.length) return;
		const i = selected ? browsable.indexOf(selected) : -1;
		selected = browsable[(i + dir + browsable.length) % browsable.length];
	}
	const canPresent = $derived(
		!!item && myTurn && (room?.phase === 'evidence' || room?.phase === 'cross') && item.kind === you && !item.onRecord
	);
	const canClarify = $derived(
		!!item && myTurn && (room?.clarifications[you!] ?? 0) > 0 && (item.onRecord || item.kind === you)
	);

	const doPresent = () => item && run(() => present({ roomId: roomId(), playerId: me.id, evidence: item.id }));
	const doClarify = () => item && run(() => clarify({ roomId: roomId(), playerId: me.id, fact: item.id }));
	const doRest = () => {
		if (confirm(`Cukupkan babak ${PHASE_TITLE[room!.phase]}? Sisa aksi Anda hangus.`)) {
			run(() => rest({ roomId: roomId(), playerId: me.id }));
		}
	};

	async function doArgue(arg: { argType: ArgType; suspect?: string; text: string }) {
		const ok = await run(() =>
			argue({
				roomId: roomId(),
				playerId: me.id,
				...arg,
				cites: basket.filter((c) => !c.sealed).map((c) => c.key),
				backing: basket.filter((c) => c.sealed).map((c) => c.key),
				targetSeq
			})
		);
		if (ok) {
			basket = [];
			targetSeq = undefined;
		}
		return !!ok;
	}

	const doAsk = (witness: string, topic?: string, question?: string) =>
		run(() => ask({ roomId: roomId(), playerId: me.id, witness, topic, question }));
	const doConfront = (witness: string, fact: string) =>
		run(() => confront({ roomId: roomId(), playerId: me.id, witness, fact }));
	const doDemand = (seq: number) => run(() => demandProof({ roomId: roomId(), playerId: me.id, targetSeq: seq }));

	function respond(seq: number) {
		targetSeq = seq;
		tab = 'arguments';
	}
	function cite(key: string) {
		toggleCite(key);
		if (!key.includes('.')) selected = key;
	}

	async function copyInvite() {
		const link = `${location.origin}/court/${code}`;
		try {
			await navigator.clipboard.writeText(link);
		} catch {
			prompt('Salin tautan ini untuk lawan Anda:', link);
		}
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	const TABS: { id: Tab; label: string; key: string }[] = [
		{ id: 'evidence', label: 'Bukti', key: 'B' },
		{ id: 'timeline', label: 'Kronologi', key: 'K' },
		{ id: 'witness', label: 'Saksi', key: 'S' },
		{ id: 'arguments', label: 'Argumen', key: 'A' }
	];

	function onKey(e: KeyboardEvent) {
		if (!room || !you || e.metaKey || e.ctrlKey || e.altKey) return;
		if ((e.target as HTMLElement).closest?.('input, textarea, select')) return;
		const k = e.key.toLowerCase();
		const t = TABS.find((x) => x.key.toLowerCase() === k);
		if (t) tab = t.id;
		else if (k === 'c' && item) toggleCite(item.id);
		else if (k === 'p' && canPresent) doPresent();
		else if (k === 'q' && canClarify) doClarify();
		else if (k === 'r' && myTurn) doRest();
		else if (k === 'escape') {
			if (selected) selected = undefined;
			else goto('/court');
		} else if (selected && (k === 'arrowleft' || k === 'arrowright')) step(k === 'arrowleft' ? -1 : 1);
		else if (item && notes && tab !== 'witness' && (k === '7' || k === '8' || k === '9')) notes.mark(item.id, ({ '7': 'key', '8': 'doubt', '9': 'lie' } as const)[k]);
	}

	const pickCase = (caseId: string) => run(() => chooseCase({ roomId: roomId(), playerId: me.id, caseId }));
	const canPickCase = $derived(
		!!room && (room.phase === 'waiting' || (room.phase === 'briefing' && !room.openings.defenseIn && !room.openings.prosecutionIn))
	);
	const accusedName = $derived(room ? (room.case.suspects[room.case.accused]?.name ?? '') : '');

	// One line that always says what you can do right now.
	const pace = $derived(room ? paceFor(room.case) : undefined);
	const openClaims = $derived(
		room && you ? room.entries.filter((e) => e.side !== 'court' && e.side !== you && e.status === 'unverified').map((e) => e.seq) : []
	);
	const guide = $derived.by(() => {
		if (!room || !you || !live) return '';
		if (!myTurn) {
			return room.phase === 'witness'
				? 'Sambil menunggu: baca jawaban saksi, kutip yang berguna (klik chipnya), tandai bukti dengan 7/8/9.'
				: 'Sambil menunggu: susun kutipan dan argumen Anda di tab Argumen — kirim begitu giliran tiba.';
		}
		return {
			evidence: 'Giliran Anda: ajukan bukti rahasia (P), Tuduh/Bantah di tab Argumen, atau mohon klarifikasi majelis (Q) untuk membuka catatan tersegel.',
			witness: `Giliran Anda: tanya saksi di tab Saksi — pilih pertanyaan baku (1–${topicsFor(room.case).length}) atau tulis sendiri. Jawaban masuk berita acara dan bisa dikutip.`,
			cross: 'Giliran Anda: hadapkan saksi dengan bukti di tab Saksi. Saksi yang terbentur bukti memicu kontradiksi — lalu Bantah keterangannya.'
		}[room.phase as 'evidence' | 'witness' | 'cross'];
	});

	// The live courtroom: on desktop it fills the screen, the record stays put and only the left column scrolls.
	const inCourt = $derived(!!room && !!you && room.phase !== 'waiting' && room.phase !== 'verdict');

	const phaseNumber = $derived(
		room ? ({ briefing: 1, evidence: 2, witness: 3, cross: 4, closing: 5, deliberating: 6, verdict: 6, waiting: 0 } as const)[room.phase] : 0
	);
</script>

<svelte:head>
	<title>{room ? `${PHASE_TITLE[room.phase]} · ` : ''}Ruang Sidang · Us, Apart</title>
</svelte:head>

<svelte:window onkeydown={onKey} />

{#snippet casePicker()}
	<div class="picker">
		<span class="eyebrow">Perkara · bisa diganti sebelum pernyataan pembuka</span>
		<div class="cases">
			{#each cases as c (c.id)}
				<button class="case" class:sel={room?.case.id === c.id} disabled={busy} onclick={() => room?.case.id !== c.id && pickCase(c.id)}>
					<strong>{c.title}</strong>
					<span class="dim">{c.tagline}</span>
				</button>
			{/each}
		</div>
	</div>
{/snippet}

<Mek>
	<main class:wide={!!room && room.phase !== 'waiting'} class:shell={inCourt}>
		<nav class="top">
			<a class="btn small" href="/court"><kbd>ESC</kbd> Keluar</a>
			<span class="micro docket">{room?.case.docket ?? ''}</span>
			<div class="tools">
				<button class="btn small" onclick={toggleMute} aria-label={sound.muted ? 'Nyalakan suara' : 'Matikan suara'}>
					{sound.muted ? 'SUARA MATI' : 'SUARA NYALA'}
				</button>
				{#if room}
					<button class="btn small" onclick={copyInvite} title="Salin tautan undangan">{copied ? 'TERSALIN' : `RUANG ${room.code}`}</button>
				{/if}
			</div>
		</nav>

		{#if roomQuery.isLoading}
			<p class="center dim">> Memanggil sidang<span class="blink">_</span></p>
		{:else if !room}
			<div class="panel narrow">
				<h2>Ruang sidang tidak ditemukan</h2>
				<p class="dim">Periksa lagi kode <b>{code}</b> dengan lawan Anda.</p>
				<a class="btn full" href="/court">Kembali</a>
			</div>
		{:else if !you}
			<div class="panel narrow">
				{#if room.players.length >= 2}
					<h2>Sidang sedang berlangsung</h2>
					<p class="dim">Kedua pihak sudah duduk di ruang {room.code}.</p>
					<a class="btn full" href="/court">Buka ruang sidang sendiri</a>
				{:else}
					<form
						class="stack"
						onsubmit={(e) => {
							e.preventDefault();
							saveName(name);
							run(() => joinRoom({ code, playerId: me.id, name }));
						}}
					>
						<span class="eyebrow side-prosecution">Dicari: Jaksa Penuntut</span>
						<h2>{room.players[0]?.name} membela {accusedName}</h2>
						<p class="dim">{room.case.title} — ambil perkara ini atas nama negara.</p>
						<label class="eyebrow" for="name">Nama Anda</label>
						<input id="name" bind:value={name} maxlength="24" autocomplete="nickname" />
						<button class="btn primary full" disabled={busy || !name.trim()}>Jadi Jaksa <kbd>↵</kbd></button>
						{#if error}<p class="err">! {error}</p>{/if}
					</form>
				{/if}
			</div>
		{:else if room.phase === 'waiting'}
			<div class="panel narrow stack">
				<span class="eyebrow">Menunggu lawan</span>
				<h2>Kirim berkas perkara</h2>
				<p class="dim">Berikan kode <b class="code">{room.code}</b> ke lawan Anda. Mereka menuntut; Anda membela.</p>
				{@render casePicker()}
				<button class="btn primary full" onclick={copyInvite}>{copied ? 'Tautan tersalin' : 'Salin tautan undangan'}</button>
				<p class="dim">> Menunggu<span class="blink">_</span></p>
			</div>
		{:else if room.phase === 'verdict'}
			<Verdict {room} {cases} {busy} onAgain={(caseId) => run(() => again({ roomId: roomId(), playerId: me.id, caseId }))} />
			<details class="transcript">
				<summary class="eyebrow">Berita acara lengkap</summary>
				<CourtRecord {room} onDemandProof={() => {}} onCite={() => {}} onRespond={() => {}} />
			</details>
		{:else}
			<div class="court">
				<div class="main">
					<Bench {room} />

					<div class="phasebar">
						<span class="eyebrow">Babak {phaseNumber}/6 · <b>{PHASE_TITLE[room.phase]}</b></span>
						{#if live}
							<span class="turn">
								{#if myTurn}
									<span class="marker"></span> <b>Giliran Anda</b> · sisa {room.budgets[you]} aksi
								{:else}
									Menunggu {room.turn ? SIDE_LABEL[room.turn] : ''}<span class="blink">_</span>
								{/if}
							</span>
							<button class="btn small danger" disabled={!myTurn || busy} onclick={doRest}>Cukup <kbd>R</kbd></button>
						{/if}
					</div>
					{#if guide}
						<p class="guide" class:mine={myTurn}>
							› {guide}
							{#if openClaims.length}
								<b>Klaim lawan {openClaims.map((n) => `#${n}`).join(', ')} belum terbukti — klik “Tuntut bukti” di berita acara bila Anda curiga gertakan.</b>
							{/if}
						</p>
					{/if}

					{#if room.phase === 'briefing'}
						{@const done = you === 'defense' ? room.openings.defenseIn : room.openings.prosecutionIn}
						{@const theyDone = you === 'defense' ? room.openings.prosecutionIn : room.openings.defenseIn}
						<section class="panel brief">
							<span class="tag">PERSIAPAN</span>
							<span class="eyebrow side-{you}">Anda adalah {SIDE_LABEL[you]}</span>
							<h2>{room.case.title}</h2>
							<p class="micro">{room.case.docket} · {room.case.setting}</p>
							<p class="charge">{room.case.charge}</p>
							<p>{room.case.brief}</p>
							<p class="dim">{room.case.goals[you]}</p>
							<p class="dim">
								Tiap pihak mendapat {pace?.evidence} aksi pembuktian, {pace?.witness} pertanyaan saksi, dan
								{pace?.cross} langkah pemeriksaan silang, ditambah {pace?.clarifications} permohonan klarifikasi yang bisa membuka catatan tersegel.
							</p>
							{#if canPickCase}{@render casePicker()}{/if}
							{#if done}
								<p class="sealed">Pernyataan pembuka Anda tersegel. {theyDone ? 'Sidang dibuka…' : 'Menunggu lawan'}<span class="blink">_</span></p>
							{:else}
								<form
									class="stack"
									onsubmit={(e) => {
										e.preventDefault();
										run(() => submitOpening({ roomId: roomId(), playerId: me.id, text: opening }));
									}}
								>
									<label class="eyebrow" for="opening">Pernyataan pembuka · tersegel sampai keduanya masuk</label>
									<textarea id="opening" bind:value={opening} maxlength={MAX_OPENING} placeholder="Yang Mulia, bukti-bukti akan menunjukkan…"></textarea>
									<div class="row">
										<span class="micro">{theyDone ? 'Lawan sudah siap.' : 'Lawan masih bersiap.'}</span>
										<button class="btn primary" disabled={busy || opening.trim().length < 20}>Bacakan <kbd>↵</kbd></button>
									</div>
								</form>
							{/if}
						</section>
					{:else if room.phase === 'closing'}
						<Closing
							{room}
							{msLeft}
							{busy}
							onSubmit={(parts: Record<ClosingKey, string>, cites: string[]) =>
								run(() => submitClosing({ roomId: roomId(), playerId: me.id, parts, cites }))}
						/>
					{:else if room.phase === 'deliberating'}
						<section class="panel recess">
							<span class="eyebrow">Sidang diskors</span>
							<h2>Majelis bermusyawarah<span class="blink">…</span></h2>
							<p class="dim">Hakim menimbang setiap argumen, keberatan, dan gertakan di berita acara.</p>
						</section>
					{/if}

					{#if notes && room.phase !== 'deliberating'}
						{#if docked || item}
							<Folder
								{room}
								{item}
								{notes}
								{docked}
								position={item ? `${browsable.indexOf(item.id) + 1}/${browsable.length}` : ''}
								cited={!!item && basket.some((c) => c.key === item.id)}
								{canPresent}
								{canClarify}
								onPresent={doPresent}
								onClarify={doClarify}
								onCite={() => item && toggleCite(item.id)}
								onClose={() => (selected = undefined)}
								onStep={step}
								onToggleDock={toggleDock}
							/>
						{/if}

						<div class="tabs" role="tablist">
							{#each TABS as t (t.id)}
								<button role="tab" aria-selected={tab === t.id} class:sel={tab === t.id} onclick={() => (tab = t.id)}>
									<kbd>{t.key}</kbd>
									{t.label}
									{#if t.id === 'arguments' && basket.length}<span class="count">{basket.length}</span>{/if}
								</button>
							{/each}
						</div>
						<div class="panel tabpanel">
							{#if tab === 'evidence'}
								<EvidenceTab {room} {notes} {selected} basket={basket.map((c) => c.key)} onSelect={(id) => (selected = selected === id ? undefined : id)} />
							{:else if tab === 'timeline'}
								<TimelineTab {room} {notes} />
							{:else if tab === 'witness'}
								<WitnessTab {room} {myTurn} {busy} onAsk={doAsk} onConfront={doConfront} onCite={toggleCite} />
							{:else}
								<Composer
									{room}
									{basket}
									{myTurn}
									{busy}
									{targetSeq}
									onClearTarget={() => (targetSeq = undefined)}
									onToggleSeal={toggleSeal}
									onRemove={(key) => (basket = basket.filter((c) => c.key !== key))}
									onArgue={doArgue}
								/>
							{/if}
						</div>
					{/if}
				</div>

				<aside class="side">
					<CourtRecord {room} onDemandProof={doDemand} onCite={cite} onRespond={respond} />
				</aside>
			</div>
		{/if}
	</main>

	{#if alarm}
		<div class="alarm" role="alert">
			<span class="big">⚠️ KONTRADIKSI DITEMUKAN</span>
			<p>{alarm}</p>
		</div>
	{/if}
	{#if toast}<div class="toast">{toast}</div>{/if}
</Mek>

<style>
	main {
		max-width: 560px;
		margin: 0 auto;
		padding: 0 16px 60px;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	main.wide {
		max-width: 1440px;
	}
	.top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
		padding: 12px 0;
		border-bottom: 2px solid var(--rule);
	}
	.tools {
		display: flex;
		gap: 8px;
	}
	@media (max-width: 640px) {
		.docket {
			display: none;
		}
	}
	.center {
		text-align: center;
		padding: 60px 0;
	}
	.dim {
		color: var(--ink-dim);
	}
	.err {
		color: var(--hp);
	}
	.narrow {
		margin-top: 40px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.stack {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
	}
	.code {
		font-family: var(--font-ui);
		color: var(--signal);
		letter-spacing: 0.3em;
		font-weight: 400;
	}

	.phasebar {
		display: flex;
		align-items: center;
		gap: 16px;
		flex-wrap: wrap;
		border-top: 2px solid var(--rule-hi);
		border-bottom: 2px solid var(--rule-hi);
		padding: 8px 0;
	}
	.turn {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-left: auto;
		color: var(--ink-2);
	}
	.turn b {
		color: var(--ink);
		font-weight: 400;
	}

	.court {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 420px;
		gap: 16px;
		align-items: start;
	}
	.main {
		display: flex;
		flex-direction: column;
		gap: 14px;
		min-width: 0;
	}
	.side {
		display: flex;
		flex-direction: column;
		height: 60dvh;
		min-height: 320px;
	}
	.side :global(.record) {
		flex: 1;
		min-height: 0;
	}

	/* Desktop: a fixed-height shell. The record is a fixed column that scrolls on its own. */
	@media (min-width: 1001px) {
		main.shell {
			height: 100dvh;
			padding-bottom: 12px;
			overflow: hidden;
		}
		.shell .court {
			flex: 1;
			min-height: 0;
			grid-template-rows: minmax(0, 1fr);
			align-items: stretch;
		}
		.shell .main {
			overflow-y: auto;
			overscroll-behavior: contain;
			/* Room for the turn outline on the bench. */
			padding: 4px 8px 24px 4px;
		}
		.shell .side {
			height: auto;
			min-height: 0;
		}
	}
	@media (max-width: 1000px) {
		.court {
			grid-template-columns: 1fr;
		}
	}

	.brief {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.brief h2 {
		font-size: 26px;
	}
	.charge {
		color: var(--parchment);
	}
	.sealed {
		color: var(--signal);
	}
	.recess {
		text-align: center;
		padding: 48px 16px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.tabs {
		display: flex;
		gap: 0;
		margin-bottom: -14px;
		flex-wrap: wrap;
	}
	.tabs button {
		all: unset;
		cursor: pointer;
		display: flex;
		gap: 8px;
		align-items: center;
		font-family: var(--font-ui);
		font-size: 12px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		padding: 10px 16px;
		color: var(--ink-dim);
		border: 2px solid transparent;
		border-bottom: none;
	}
	.tabs button:hover {
		color: var(--ink);
	}
	.tabs button:focus-visible {
		outline: 2px dashed var(--ink-dim);
	}
	.tabs button.sel {
		color: var(--ink);
		background: var(--night-2);
		border-color: var(--rule);
		position: relative;
		z-index: 1;
		margin-bottom: -2px;
	}
	.tabs button.sel kbd {
		background: var(--cursor);
		color: var(--void);
		border-color: var(--cursor);
	}
	.count {
		color: var(--signal);
	}
	.tabpanel {
		min-height: 320px;
	}

	.transcript {
		max-width: 1000px;
		margin: 0 auto;
		width: 100%;
	}
	.transcript summary {
		cursor: pointer;
		padding: 10px 0;
	}
	.transcript :global(.record) {
		max-height: 70dvh;
	}

	.alarm {
		position: fixed;
		inset: 0;
		z-index: 150;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 16px;
		background: rgba(109, 46, 58, 0.82);
		text-align: center;
		padding: 24px;
		pointer-events: none;
		animation: shake 360ms steps(6);
	}
	.alarm .big {
		font-family: var(--font-ui);
		font-size: clamp(22px, 5vw, 48px);
		color: var(--ink);
		border: 4px solid var(--hp);
		background: var(--void);
		padding: 14px 22px;
		letter-spacing: 0.06em;
	}
	.alarm p {
		color: var(--ink);
		font-size: 28px;
		max-width: 30ch;
	}
	@keyframes shake {
		25% {
			transform: translateX(-8px);
		}
		50% {
			transform: translateX(8px);
		}
		75% {
			transform: translateX(-4px);
		}
	}
	.picker {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin: 6px 0;
	}
	.cases {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 8px;
	}
	.case {
		all: unset;
		box-sizing: border-box;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 8px 10px;
		border: 2px solid var(--rule);
		background: var(--night-2);
		line-height: 1.05;
	}
	.case strong {
		font-family: var(--font-ui);
		font-size: 11px;
		letter-spacing: 0.06em;
		color: var(--ink);
	}
	.case:hover {
		border-color: var(--rule-hi);
	}
	.case:focus-visible,
	.case.sel {
		outline: 2px solid var(--cursor);
		outline-offset: 2px;
	}
	.guide {
		margin: -4px 0 10px;
		color: var(--ink-dim);
		line-height: 1.05;
	}
	.guide.mine {
		color: var(--ink-2);
	}
	.guide b {
		display: block;
		font-weight: 400;
		color: var(--luck);
		margin-top: 2px;
	}
</style>
