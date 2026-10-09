<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { useMutation, useQuery } from 'convex-svelte';
	import { api } from '../../../../convex/_generated/api';
	import {
		CRITERIA,
		CRITERION_KEYS,
		CRITERION_MAX,
		formatClock,
		MAX_TOPIC,
		other,
		ROUND_INFO,
		ROUNDS,
		SIDE_LABEL,
		TOPIC_KINDS,
		total,
		type Round,
		type Side,
		type TopicKind
	} from '../../../../convex/debate/rules';
	import { errorMessage, me, saveName } from '#lib/player.svelte.ts';
	import { sfx } from '#lib/sound.svelte.ts';
	import Mek from '#lib/court/Mek.svelte';
	import Portrait from '#lib/court/Portrait.svelte';

	const code = $derived((page.params.code ?? '').toUpperCase());

	const roomQuery = useQuery(api.debate.get, () => ({ code, playerId: me.id }));
	const room = $derived(roomQuery.data);

	const joinRoom = useMutation(api.debate.join);
	const shuffleTopic = useMutation(api.debate.shuffleTopic);
	const setTopic = useMutation(api.debate.setTopic);
	const swapSides = useMutation(api.debate.swapSides);
	const startDebate = useMutation(api.debate.start);
	const speak = useMutation(api.debate.speak);
	const playAgain = useMutation(api.debate.again);
	const serverTime = useMutation(api.debate.now);

	const mySide = $derived(room?.me);
	const nameOf = (side: Side) =>
		room?.players.find((p) => (side === 'pro' ? p.id === room.proId : p.id !== room.proId))?.name ?? '…';
	const round = $derived(room && (ROUNDS as string[]).includes(room.phase) ? (room.phase as Round) : undefined);
	const speechOf = (r: Round, side: Side) => room?.speeches.find((s) => s.round === r && s.side === side);
	const mine = $derived(round && mySide ? speechOf(round, mySide) : undefined);
	const theirs = $derived(round && mySide ? speechOf(round, other(mySide)) : undefined);
	/** Rounds already revealed to both. */
	const revealed = $derived(ROUNDS.filter((r) => speechOf(r, 'pro') && speechOf(r, 'con') && r !== room?.phase));

	let name = $state(me.name);
	let busy = $state(false);
	let error = $state('');
	let copied = $state(false);
	let customTopic = $state('');
	let editingTopic = $state(false);

	// ---- Clock lined up with the server ----
	let offset = $state(0);
	let now = $state(Date.now());
	onMount(() => {
		const t0 = Date.now();
		serverTime({}).then((server) => (offset = server - (t0 + Date.now()) / 2));
		const id = setInterval(() => (now = Date.now()), 250);
		return () => clearInterval(id);
	});
	const msLeft = $derived(room?.deadline ? Math.max(0, room.deadline - (now + offset)) : 0);

	// ---- Draft, kept in localStorage so a refresh doesn't lose it ----
	const draftKey = $derived(room && round ? `debate.${code}.${room.debate}.${round}` : '');
	let draft = $state('');
	let loadedKey = '';
	$effect(() => {
		if (draftKey && draftKey !== loadedKey) {
			loadedKey = draftKey;
			draft = localStorage.getItem(draftKey) ?? '';
		}
	});
	$effect(() => {
		if (draftKey && !mine) localStorage.setItem(draftKey, draft);
	});

	// ---- Sounds on phase changes ----
	let lastPhase = '';
	$effect(() => {
		const phase = room?.phase ?? '';
		if (lastPhase && phase !== lastPhase) {
			if ((ROUNDS as string[]).includes(phase)) sfx.turn();
			if (phase === 'verdict') sfx.win();
		}
		lastPhase = phase;
	});
	let lastTick = 0;
	$effect(() => {
		const s = Math.ceil(msLeft / 1000);
		if (round && !mine && s > 0 && s <= 10 && s !== lastTick) {
			lastTick = s;
			sfx.tick(s <= 5);
		}
	});

	async function run(action: () => Promise<unknown>) {
		error = '';
		busy = true;
		try {
			await action();
		} catch (err) {
			error = errorMessage(err);
		} finally {
			busy = false;
		}
	}

	async function submit() {
		if (!room || !draft.trim()) return;
		await run(async () => {
			await speak({ roomId: room._id, playerId: me.id, text: draft });
			sfx.send();
			localStorage.removeItem(draftKey);
		});
	}

	async function copyInvite() {
		const link = `${location.origin}/debate/${code}`;
		try {
			await navigator.clipboard.writeText(link);
		} catch {
			prompt('Copy this link for your opponent:', link);
		}
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	const winnerName = $derived(
		room?.verdict ? (room.verdict.winner === 'tie' ? 'A tie' : `${nameOf(room.verdict.winner)} wins`) : ''
	);
	const portrait = (side: Side) => (side === 'pro' ? 'defense' : 'prosecution');
	const sideClass = (side: Side) => (side === 'pro' ? 'side-defense' : 'side-prosecution');
</script>

<svelte:head>
	<title>{round && !mine ? `${formatClock(msLeft)} · ` : ''}Debate Room · Us, Apart</title>
</svelte:head>

{#snippet speechCard(r: Round, side: Side)}
	{@const s = speechOf(r, side)}
	<article class="speech panel {side}">
		<header>
			<span class="eyebrow {sideClass(side)}">{SIDE_LABEL[side]} · {nameOf(side)}</span>
		</header>
		{#if s?.text}
			<p class="text">{s.text}</p>
		{:else}
			<p class="text tone-dim">(said nothing — the clock ran out)</p>
		{/if}
	</article>
{/snippet}

{#snippet transcript(rounds: Round[])}
	{#each rounds as r (r)}
		<section class="round-log">
			<h3 class="eyebrow">▸ {ROUND_INFO[r].label}</h3>
			<div class="pair">
				{@render speechCard(r, 'pro')}
				{@render speechCard(r, 'con')}
			</div>
		</section>
	{/each}
{/snippet}

<Mek>
	<main>
		<nav class="top">
			<a class="btn small" href="/debate"><kbd>ESC</kbd> Leave</a>
			<span class="micro">ROOM {code}</span>
		</nav>

		{#if roomQuery.isLoading}
			<p class="center tone-dim">Loading<span class="blink">…</span></p>
		{:else if !room}
			<section class="panel narrow">
				<h2>No debate here</h2>
				<p class="tone-dim">There's no room with code {code}.</p>
				<a class="btn primary" href="/debate">Back</a>
			</section>
		{:else if !mySide}
			{#if room.players.length >= 2}
				<section class="panel narrow">
					<h2>This room is full</h2>
					<p class="tone-dim">Two debaters are already in.</p>
					<a class="btn primary" href="/debate">Open your own</a>
				</section>
			{:else}
				<section class="panel narrow">
					<span class="tag">JOIN</span>
					<h2>{room.players[0]?.name} wants to debate you</h2>
					<p class="topic-preview">“{room.topic}”</p>
					<label class="eyebrow" for="name">Your name</label>
					<input id="name" bind:value={name} maxlength="24" autocomplete="nickname" />
					<button
						class="btn primary full"
						disabled={busy || !name.trim()}
						onclick={() =>
							run(async () => {
								saveName(name);
								await joinRoom({ code, playerId: me.id, name });
							})}
					>
						Take the floor
					</button>
				</section>
			{/if}
		{:else}
			<!-- Topic banner, shown in every phase -->
			<section class="motion">
				<span class="eyebrow">The motion</span>
				<h1>“{room.topic}”</h1>
				<div class="sides">
					{#each ['pro', 'con'] as const as side (side)}
						<div class="seat {side}" class:me={side === mySide}>
							<Portrait
								who={portrait(side)}
								size={48}
								talking={!!round && !speechOf(round, side)}
								mood={room.verdict ? (room.verdict.winner === side ? 'happy' : room.verdict.winner === 'tie' ? 'nod' : 'sweat') : 'idle'}
							/>
							<div>
								<span class="eyebrow {sideClass(side)}">{SIDE_LABEL[side]}</span>
								<strong>{nameOf(side)}{side === mySide ? ' (you)' : ''}</strong>
								{#if round}
									<span class="micro">{speechOf(round, side) ? '✓ SUBMITTED' : 'WRITING…'}</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</section>

			{#if room.phase === 'waiting'}
				<section class="panel narrow">
					<span class="tag">WAITING</span>
					<h2>Waiting for your opponent<span class="blink">…</span></h2>
					<p class="tone-dim">Send them the code <b class="code">{code}</b> or the link.</p>
					<button class="btn primary" onclick={copyInvite}>{copied ? 'Copied!' : 'Copy invite link'}</button>
				</section>
			{:else if room.phase === 'lobby'}
				<section class="panel lobby">
					<span class="tag">SET THE MOTION</span>
					<div class="row">
						<span class="eyebrow">New topic</span>
						<button class="btn small" disabled={busy} onclick={() => run(() => shuffleTopic({ roomId: room._id, playerId: me.id }))}>
							Any
						</button>
						{#each Object.entries(TOPIC_KINDS) as [kind, label] (kind)}
							<button
								class="btn small"
								disabled={busy}
								onclick={() => run(() => shuffleTopic({ roomId: room._id, playerId: me.id, kind: kind as TopicKind }))}
							>
								{label}
							</button>
						{/each}
						<button class="btn small gold" onclick={() => (editingTopic = !editingTopic)}>Write your own</button>
					</div>
					{#if editingTopic}
						<form
							class="row"
							onsubmit={(e) => {
								e.preventDefault();
								run(async () => {
									await setTopic({ roomId: room._id, playerId: me.id, topic: customTopic });
									customTopic = '';
									editingTopic = false;
								});
							}}
						>
							<input bind:value={customTopic} maxlength={MAX_TOPIC} placeholder="e.g. Indomie goreng beats Indomie kuah." />
							<button class="btn" disabled={busy || customTopic.trim().length < 5}>Set</button>
						</form>
					{/if}
					<div class="row">
						<span class="eyebrow">Sides</span>
						<span>
							<b class="side-defense">{nameOf('pro')}</b> argues For, <b class="side-prosecution">{nameOf('con')}</b> argues Against.
						</span>
						<button class="btn small" disabled={busy} onclick={() => run(() => swapSides({ roomId: room._id, playerId: me.id }))}>
							Swap sides
						</button>
					</div>
					<p class="tone-dim">
						Three rounds: {ROUNDS.map((r) => `${ROUND_INFO[r].label} (${formatClock(ROUND_INFO[r].seconds * 1000)})`).join(' → ')}.
						Both of you write at the same time; each round is revealed once you've both submitted.
					</p>
					<button class="btn primary full" disabled={busy} onclick={() => run(() => startDebate({ roomId: room._id, playerId: me.id }))}>
						Start the debate <kbd>↵</kbd>
					</button>
				</section>
			{:else if round}
				<ol class="steps">
					{#each ROUNDS as r (r)}
						<li class:done={ROUNDS.indexOf(r) < ROUNDS.indexOf(round)} class:now={r === round}>{ROUND_INFO[r].label}</li>
					{/each}
				</ol>

				{@render transcript(revealed)}

				<section class="panel composer {mySide}">
					<span class="tag">{ROUND_INFO[round].label.toUpperCase()}</span>
					<div class="row between">
						<span class="eyebrow {sideClass(mySide)}">You argue {SIDE_LABEL[mySide]}</span>
						<span class="clock" class:urgent={msLeft < 20_000}>{formatClock(msLeft)}</span>
					</div>
					<p class="prompt">{ROUND_INFO[round].prompt}</p>
					{#if mine}
						<p class="text mine">{mine.text}</p>
						<p class="tone-dim">
							{#if theirs}Revealing…{:else}Sealed. Waiting for {nameOf(other(mySide))}<span class="blink">…</span>{/if}
						</p>
					{:else}
						<textarea
							bind:value={draft}
							maxlength={ROUND_INFO[round].max}
							rows="8"
							placeholder={round === 'opening' ? 'My first reason is…' : round === 'rebuttal' ? 'My opponent says… but…' : 'In the end…'}
							onkeydown={(e) => {
								if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
							}}
						></textarea>
						<div class="row between">
							<span class="micro">{draft.length}/{ROUND_INFO[round].max}{theirs ? ' · OPPONENT HAS SUBMITTED' : ''}</span>
							<button class="btn primary" disabled={busy || !draft.trim()} onclick={submit}>Submit <kbd>⌘↵</kbd></button>
						</div>
					{/if}
				</section>
			{:else if room.phase === 'judging'}
				<section class="panel judging">
					<Portrait who="judge" size={96} mood="think" />
					<h2>The judge is deliberating<span class="blink">…</span></h2>
					<p class="tone-dim">Weighing logic, evidence, rebuttal and delivery.</p>
				</section>
				{@render transcript(ROUNDS)}
			{:else if room.phase === 'verdict' && room.verdict}
				{@const v = room.verdict}
				<section class="panel verdict">
					<span class="tag">{v.by === 'ai' ? 'AI JUDGE' : 'RULE OF THUMB'}</span>
					<div class="banner">
						<Portrait who="judge" size={80} mood="gavel" />
						<div>
							<span class="eyebrow">Verdict</span>
							<h2 class={v.winner === 'tie' ? 'side-court' : sideClass(v.winner)}>{winnerName}</h2>
							<span class="micro">
								{SIDE_LABEL.pro} {total(v.pro.scores)} — {total(v.con.scores)} {SIDE_LABEL.con}
							</span>
						</div>
					</div>
					<p class="summary">{v.summary}</p>
					{#if v.turningPoint}
						<p class="turning"><span class="eyebrow">Turning point</span> {v.turningPoint}</p>
					{/if}

					<div class="scores">
						{#each CRITERION_KEYS as k (k)}
							<div class="crit" title={CRITERIA[k].hint}>
								<span class="num side-defense">{v.pro.scores[k]}</span>
								<div class="bar left"><i style:width="{(v.pro.scores[k] / CRITERION_MAX) * 100}%"></i></div>
								<span class="eyebrow">{CRITERIA[k].label}</span>
								<div class="bar right"><i style:width="{(v.con.scores[k] / CRITERION_MAX) * 100}%"></i></div>
								<span class="num side-prosecution">{v.con.scores[k]}</span>
							</div>
						{/each}
					</div>

					{#if v.by === 'ai'}
						<div class="pair">
							{#each ['pro', 'con'] as const as side (side)}
								<div class="notes {side}">
									<span class="eyebrow {sideClass(side)}">{nameOf(side)}</span>
									<p><b class="tone-good">Best</b> {v[side].best}</p>
									<p><b class="tone-bad">Missed</b> {v[side].missed}</p>
									<p><b class="tone-gold">Tip</b> {v[side].tip}</p>
								</div>
							{/each}
						</div>
					{:else}
						<div class="pair">
							{#each ['pro', 'con'] as const as side (side)}
								<p class="notes {side}"><b class="tone-gold">Tip for {nameOf(side)}</b> {v[side].tip}</p>
							{/each}
						</div>
					{/if}

					<button class="btn primary full" disabled={busy} onclick={() => run(() => playAgain({ roomId: room._id, playerId: me.id }))}>
						Rematch · swap sides
					</button>
				</section>

				{@render transcript(ROUNDS)}

				{#if room.history.length > 1}
					<section class="panel history">
						<span class="tag">PAST DEBATES</span>
						<ul>
							{#each room.history.toReversed() as h, i (i)}
								<li>
									<span>“{h.topic}”</span>
									<span class="micro">
										{h.winner === 'tie' ? 'TIE' : `${h.winner === 'pro' ? h.proName : h.conName} WON`} · {h.proName} for, {h.conName} against
									</span>
								</li>
							{/each}
						</ul>
					</section>
				{/if}
			{/if}
		{/if}

		{#if error}<p class="toast">! {error}</p>{/if}
	</main>
</Mek>

<style>
	main {
		max-width: 1000px;
		margin: 0 auto;
		padding: 0 20px 80px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}
	.top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 0;
		border-bottom: 2px solid var(--rule);
	}
	.center {
		text-align: center;
		padding: 60px 0;
	}
	.narrow {
		max-width: 520px;
		width: 100%;
		margin: 40px auto 0;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.code {
		color: var(--cursor);
		font-family: var(--font-ui);
		font-weight: 400;
		letter-spacing: 0.2em;
	}
	.topic-preview {
		color: var(--ink);
		font-size: 26px;
	}

	.motion {
		text-align: center;
		padding: 24px 0 4px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		align-items: center;
	}
	.motion h1 {
		font-size: clamp(22px, 4vw, 36px);
		max-width: 26ch;
		color: var(--ink);
	}
	.sides {
		display: flex;
		gap: 16px;
		flex-wrap: wrap;
		justify-content: center;
	}
	.seat {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 14px 8px 8px;
		border: 2px solid var(--rule);
		background: var(--night-2);
		text-align: left;
	}
	.seat div {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.seat strong {
		color: var(--ink);
		font-weight: 400;
	}
	.seat.me.pro {
		border-color: var(--def-deep);
	}
	.seat.me.con {
		border-color: var(--atk-deep);
	}

	.row {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
	}
	.row.between {
		justify-content: space-between;
	}
	.row input {
		flex: 1;
		min-width: 200px;
	}
	.lobby {
		display: flex;
		flex-direction: column;
		gap: 18px;
		padding: 24px;
	}
	.lobby b {
		font-weight: 400;
	}

	.steps {
		list-style: none;
		display: flex;
		gap: 0;
		padding: 0;
		margin: 0;
		border-top: 2px solid var(--rule-hi);
	}
	.steps li {
		flex: 1;
		padding-top: 8px;
		font-family: var(--font-ui);
		font-size: 12px;
		color: var(--ink-ghost);
	}
	.steps li.done {
		color: var(--ink-dim);
	}
	.steps li.now {
		color: var(--cursor);
		box-shadow: inset 0 2px 0 var(--cursor);
	}

	.composer {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 20px;
	}
	.composer.pro {
		border-color: var(--def-deep);
	}
	.composer.con {
		border-color: var(--atk-deep);
	}
	.composer textarea {
		min-height: 12rem;
		resize: vertical;
	}
	.prompt {
		color: var(--ink);
	}
	.clock {
		font-family: var(--font-ui);
		font-size: 22px;
		color: var(--ink);
	}
	.clock.urgent {
		color: var(--hp);
		animation: mek-blink var(--dur-blink) steps(1) infinite;
	}
	.text {
		white-space: pre-wrap;
		color: var(--ink-2);
	}
	.text.mine {
		border-left: 2px solid var(--rule-hi);
		padding-left: 12px;
	}

	.round-log {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.pair {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}
	@media (max-width: 720px) {
		.pair {
			grid-template-columns: 1fr;
		}
	}
	.speech {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.speech.pro {
		border-left-color: var(--def);
	}
	.speech.con {
		border-left-color: var(--atk);
	}

	.judging {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 40px 20px;
		text-align: center;
	}

	.verdict {
		display: flex;
		flex-direction: column;
		gap: 18px;
		padding: 24px;
		border-color: var(--luck-deep);
	}
	.banner {
		display: flex;
		align-items: center;
		gap: 18px;
	}
	.banner h2 {
		font-size: clamp(26px, 5vw, 44px);
		margin: 4px 0;
	}
	.summary {
		color: var(--ink);
	}
	.turning .eyebrow {
		color: var(--luck);
		margin-right: 6px;
	}
	.scores {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.crit {
		display: grid;
		grid-template-columns: 2ch 1fr 10ch 1fr 2ch;
		align-items: center;
		gap: 10px;
		text-align: center;
	}
	.num {
		font-family: var(--font-ui);
		font-size: 16px;
	}
	.bar {
		height: 12px;
		background: var(--void);
		border: 2px solid var(--rule);
		display: flex;
	}
	.bar.left {
		justify-content: flex-end;
	}
	.bar.left i {
		background: var(--def);
	}
	.bar.right i {
		background: var(--atk);
	}
	.bar i {
		display: block;
		height: 100%;
		transition: width 600ms var(--ease-step);
	}
	.notes {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 12px;
		border: 2px solid var(--rule);
		background: var(--void);
	}
	.notes.pro {
		border-left-color: var(--def);
	}
	.notes.con {
		border-left-color: var(--atk);
	}
	.notes b {
		font-family: var(--font-ui);
		font-size: 11px;
		font-weight: 400;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		margin-right: 6px;
	}

	.history ul {
		list-style: none;
		padding: 0;
		margin: 8px 0 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.history li {
		display: flex;
		flex-direction: column;
	}
</style>
