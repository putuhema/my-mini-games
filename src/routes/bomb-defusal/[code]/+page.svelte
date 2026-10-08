<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { useMutation, useQuery } from 'convex-svelte';
	import { api } from '../../../../convex/_generated/api';
	import {
		DIFFICULTIES,
		formatTimer,
		generateManual,
		MAX_STRIKES,
		type Difficulty
	} from '../../../../convex/bomb';
	import Bomb, { type BombActions } from '#lib/bomb/Bomb.svelte';
	import Manual from '#lib/bomb/Manual.svelte';
	import { errorMessage, me, saveName } from '#lib/player.svelte.ts';
	import { sfx, sound, toggleMute } from '#lib/sound.svelte.ts';
	import { Badge, Button, Card, ChoiceTile } from '#lib/ui/index.ts';
	import {
		ArrowsLeftRightIcon,
		BombIcon,
		BookOpenIcon,
		DoorOpenIcon,
		EnvelopeSimpleOpenIcon,
		HeadsetIcon,
		MagnifyingGlassIcon,
		SealCheckIcon,
		SpeakerHighIcon,
		SpeakerSlashIcon,
		XIcon
	} from '#lib/icons/index.ts';

	const code = $derived((page.params.code ?? '').toUpperCase());

	const roomQuery = useQuery(api.defuse.get, () => ({ code, playerId: me.id }));
	const room = $derived(roomQuery.data);

	const joinRoom = useMutation(api.defuse.join);
	const configure = useMutation(api.defuse.configure);
	const startRound = useMutation(api.defuse.start);
	const playAgain = useMutation(api.defuse.again);
	const serverTime = useMutation(api.defuse.now);
	const cutWire = useMutation(api.defuse.cutWire);
	const pressButton = useMutation(api.defuse.pressButton);
	const releaseButton = useMutation(api.defuse.releaseButton);
	const pressKey = useMutation(api.defuse.pressKey);
	const pressSimon = useMutation(api.defuse.pressSimon);

	const isMember = $derived(room?.players.some((p) => p.id === me.id) ?? false);
	const defuser = $derived(room?.players.find((p) => p.id === room.defuserId));
	const expert = $derived(room?.players.find((p) => p.id !== room.defuserId));
	const iDefuse = $derived(room?.defuserId === me.id);
	const manual = $derived(room?.seed !== undefined ? generateManual(room.seed) : undefined);

	let name = $state(me.name);
	let busy = $state(false);
	let error = $state('');
	let copied = $state(false);
	let postMortem = $state(false);

	// ---- Clock: line up with the server so both screens agree ----
	let offset = $state(0);
	let now = $state(Date.now());
	onMount(() => {
		const t0 = Date.now();
		serverTime({}).then((server) => (offset = server - (t0 + Date.now()) / 2));
		const id = setInterval(() => (now = Date.now()), 100);
		return () => clearInterval(id);
	});
	const serverNow = $derived(now + offset);
	const countdown = $derived(
		room?.status === 'live' && room.startedAt && serverNow < room.startedAt
			? Math.ceil((room.startedAt - serverNow) / 1000)
			: 0
	);
	const msLeft = $derived.by(() => {
		if (!room?.deadline) return 0;
		if (room.status !== 'live') return Math.max(0, room.deadline - (room.endedAt ?? room.deadline));
		return Math.max(0, room.deadline - Math.max(serverNow, room.startedAt ?? 0));
	});

	$effect(() => {
		if (countdown > 0) sfx.blip();
	});

	// Boom or fanfare when a round ends.
	let lastStatus = '';
	$effect(() => {
		const status = room?.status ?? '';
		if (lastStatus === 'live' && status === 'exploded') {
			sfx.boom();
			navigator.vibrate?.([400, 100, 600]);
		}
		if (lastStatus === 'live' && status === 'defused') sfx.win();
		if (status === 'live') postMortem = false;
		lastStatus = status;
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

	/** Bomb moves fire immediately; the room query brings back the result. */
	function move(action: () => Promise<unknown>) {
		error = '';
		action().catch((err) => (error = errorMessage(err)));
	}

	const actions: BombActions = {
		cutWire: (module, wire) => move(() => cutWire({ roomId: room!._id, playerId: me.id, module, wire })),
		pressButton: (module) => move(() => pressButton({ roomId: room!._id, playerId: me.id, module })),
		releaseButton: (module) => move(() => releaseButton({ roomId: room!._id, playerId: me.id, module })),
		pressKey: (module, key) => move(() => pressKey({ roomId: room!._id, playerId: me.id, module, key })),
		pressSimon: (module, color) =>
			move(() => pressSimon({ roomId: room!._id, playerId: me.id, module, color }))
	};

	async function copyInvite() {
		const link = `${location.origin}/bomb-defusal/${code}`;
		try {
			await navigator.clipboard.writeText(link);
		} catch {
			prompt('Copy this link for your partner:', link);
		}
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	const DIFFICULTY_TONE: Record<Difficulty, string> = { easy: 'green', normal: 'orange', hard: 'red' };
</script>

<svelte:head>
	<title>{room?.status === 'live' && iDefuse ? `${formatTimer(msLeft)} · ` : ''}Bomb Defusal · Us, Apart</title>
</svelte:head>

<main class:wide={room?.status === 'live' || postMortem}>
	<nav class="topbar">
		<a class="close" href="/bomb-defusal" aria-label="Leave game"><XIcon weight="bold" size="1.5rem" /></a>
		<div class="tools">
			<button
				class="icon-btn"
				onclick={toggleMute}
				aria-label={sound.muted ? 'Turn sound on' : 'Mute sound'}
				title={sound.muted ? 'Sound off' : 'Sound on'}
			>
				{#if sound.muted}
					<SpeakerSlashIcon weight="fill" size="1.5rem" />
				{:else}
					<SpeakerHighIcon weight="fill" size="1.5rem" />
				{/if}
			</button>
			{#if room}
				<button class="code" onclick={copyInvite} title="Copy invite link">
					{copied ? 'COPIED' : room.code}
				</button>
			{/if}
		</div>
	</nav>

	{#if roomQuery.isLoading}
		<p class="center muted">Loading room…</p>
	{:else if !room}
		<Card class="narrow">
			<div class="stack center">
				<span class="big" style="--c: var(--blue)"><MagnifyingGlassIcon weight="fill" /></span>
				<h2>Room not found</h2>
				<p class="muted">Double-check the code <strong>{code}</strong> with your partner.</p>
				<Button href="/bomb-defusal" full>Back</Button>
			</div>
		</Card>
	{:else if !isMember}
		{#if room.players.length >= 2}
			<Card class="narrow">
				<div class="stack center">
					<span class="big" style="--c: var(--orange)"><DoorOpenIcon weight="fill" /></span>
					<h2>This room is full</h2>
					<p class="muted">Two players are already in room {room.code}.</p>
					<Button href="/bomb-defusal" full>Start your own</Button>
				</div>
			</Card>
		{:else}
			<Card class="narrow">
				<form
					class="stack"
					onsubmit={(e) => {
						e.preventDefault();
						saveName(name);
						run(() => joinRoom({ code, playerId: me.id, name }));
					}}
				>
					<span class="big" style="--c: var(--red)"><BombIcon weight="fill" /></span>
					<h2>{room.players[0]?.name} needs a bomb expert</h2>
					<label class="label" for="name">Your name</label>
					<input id="name" bind:value={name} maxlength="24" autocomplete="nickname" />
					<Button type="submit" size="lg" variant="danger" full disabled={busy || !name.trim()}>
						Join the squad
					</Button>
					{#if error}<p class="error">{error}</p>{/if}
				</form>
			</Card>
		{/if}
	{:else if room.status === 'waiting'}
		<Card class="narrow">
			<div class="stack center">
				<span class="big" style="--c: var(--pink)"><EnvelopeSimpleOpenIcon weight="fill" /></span>
				<h2>Invite your partner</h2>
				<p class="muted">
					Send them the code <strong class="mono">{room.code}</strong>. You'll pick roles once they join.
				</p>
				<Button variant="secondary" size="lg" full onclick={copyInvite}>
					{copied ? 'Link copied' : 'Copy invite link'}
				</Button>
			</div>
		</Card>
	{:else if room.status === 'briefing'}
		<div class="briefing">
			<h1>Round {room.round + 1} briefing</h1>

			<div class="roles">
				<Card tone="red" class="role">
					<span class="role-icon"><BombIcon weight="fill" size="2rem" /></span>
					<div>
						<span class="label">Defuser</span>
						<strong>{defuser?.id === me.id ? 'You' : defuser?.name}</strong>
						<p>Sees the bomb, can't see the manual. Describe everything.</p>
					</div>
				</Card>
				<button
					class="swap"
					aria-label="Swap roles"
					title="Swap roles"
					disabled={busy}
					onclick={() => run(() => configure({ roomId: room._id, playerId: me.id, swap: true }))}
				>
					<ArrowsLeftRightIcon weight="bold" size="1.3rem" />
				</button>
				<Card tone="orange" class="role">
					<span class="role-icon"><BookOpenIcon weight="fill" size="2rem" /></span>
					<div>
						<span class="label">Expert</span>
						<strong>{expert?.id === me.id ? 'You' : expert?.name}</strong>
						<p>Has the manual, can't see the bomb. Ask the right questions.</p>
					</div>
				</Card>
			</div>

			<span class="label">Difficulty</span>
			<div class="levels" role="radiogroup" aria-label="Difficulty">
				{#each Object.entries(DIFFICULTIES) as [key, d] (key)}
					<ChoiceTile
						class="level"
						selected={room.difficulty === key}
						role="radio"
						aria-checked={room.difficulty === key}
						disabled={busy}
						onclick={() =>
							run(() => configure({ roomId: room._id, playerId: me.id, difficulty: key as Difficulty }))}
					>
						<strong>{d.label}</strong>
						<small>{d.detail}</small>
					</ChoiceTile>
				{/each}
			</div>

			<p class="tip">
				<HeadsetIcon weight="fill" size="1.4rem" />
				Start your call first — you'll be talking the whole time.
			</p>

			<Button
				variant="danger"
				size="lg"
				full
				disabled={busy}
				onclick={() => run(() => startRound({ roomId: room._id, playerId: me.id }))}
			>
				Arm the bomb
			</Button>
			{#if error}<p class="error">{error}</p>{/if}

			{@render history()}
		</div>
	{:else if room.status === 'live'}
		{#if iDefuse && room.bomb}
			<p class="hint">
				<BombIcon weight="fill" size="1.2rem" /> Describe what you see. {expert?.name} has the manual.
			</p>
			<Bomb
				bomb={room.bomb}
				{msLeft}
				strikes={room.strikes ?? 0}
				lastStrike={room.lastStrike}
				disabled={countdown > 0}
				{actions}
			/>
		{:else if manual}
			<div class="expert-col">
				<p class="hint live">
					<span class="pulse" aria-hidden="true"></span>
					Bomb is live. {defuser?.name} is holding it — you can't see it. Ask!
				</p>
				<Manual {manual} />
			</div>
		{/if}
		{#if error}<p class="error">{error}</p>{/if}

		{#if countdown > 0}
			{#key countdown}
				<div class="countdown" aria-live="assertive">{countdown}</div>
			{/key}
		{/if}
	{:else}
		{@const boom = room.status === 'exploded'}
		{#if boom}<div class="flash" aria-hidden="true"></div>{/if}
		<div class="result" class:boom>
			<Card tone={boom ? 'red' : 'green'} class="result-card">
				<div class="stack center">
					<span class="big result-icon" style="--c: var(--{boom ? 'red' : 'green'})">
						{#if boom}<BombIcon weight="fill" />{:else}<SealCheckIcon weight="fill" />{/if}
					</span>
					<h2>{boom ? 'BOOM.' : 'Bomb defused!'}</h2>
					<p>
						{#if boom}
							{room.cause === 'strikes' ? `${MAX_STRIKES} strikes — the bomb had enough.` : 'The timer hit 0:00.'}
						{:else}
							With <strong>{formatTimer(msLeft)}</strong> to spare and {room.strikes} strike{room.strikes === 1 ? '' : 's'}.
							{defuser?.name} &amp; {expert?.name}, nerves of steel.
						{/if}
					</p>
					<Button
						size="lg"
						full
						variant={boom ? 'danger' : 'primary'}
						disabled={busy}
						onclick={() => run(() => playAgain({ roomId: room._id, playerId: me.id }))}
					>
						Next round · swap roles
					</Button>
					<Button variant="ghost" full onclick={() => (postMortem = !postMortem)}>
						{postMortem ? 'Hide the bomb & manual' : 'See the bomb & manual'}
					</Button>
				</div>
			</Card>
			{#if error}<p class="error">{error}</p>{/if}
		</div>

		{#if postMortem && room.bomb && manual}
			<div class="post-mortem">
				<Bomb
					bomb={room.bomb}
					{msLeft}
					strikes={room.strikes ?? 0}
					disabled
					actions={{
						cutWire: () => {},
						pressButton: () => {},
						releaseButton: () => {},
						pressKey: () => {},
						pressSimon: () => {}
					}}
				/>
				<Manual {manual} />
			</div>
		{/if}

		<div class="narrow-col">{@render history()}</div>
	{/if}
</main>

{#snippet history()}
	{#if room?.history.length}
		<section class="history">
			<h3>Mission log</h3>
			<ul>
				{#each room.history as h (h.round)}
					<li>
						<Badge color={h.defused ? 'green' : 'red'} solid>{h.defused ? 'Defused' : 'Boom'}</Badge>
						<span class="h-text">
							<strong>Round {h.round}</strong> · {DIFFICULTIES[h.difficulty].label} · {h.defuserName} defusing
						</span>
						<span class="h-time">{h.defused ? formatTimer(h.msLeft) : `${h.strikes}✕`}</span>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
{/snippet}

<style>
	main {
		max-width: 560px;
		margin: 0 auto;
		padding: 1rem 1.25rem 3rem;
	}

	main.wide {
		max-width: 1080px;
	}

	.topbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.close,
	.icon-btn {
		display: grid;
		place-items: center;
		width: 2.4rem;
		height: 2.4rem;
		border: none;
		border-radius: var(--radius-sm);
		background: none;
		color: var(--hare);
		text-decoration: none;
		cursor: pointer;
	}

	@media (hover: hover) {
		.icon-btn:hover {
			background: var(--polar);
		}
	}

	.tools {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.code {
		margin-left: 0.5rem;
		padding: 0.45rem 0.9rem;
		border: var(--border) solid var(--swan);
		border-bottom-width: calc(var(--border) + var(--depth) - 1px);
		border-radius: var(--radius-sm);
		background: var(--snow);
		font-weight: 900;
		letter-spacing: 0.2em;
		color: var(--wolf);
		cursor: pointer;
	}

	.center {
		text-align: center;
		align-items: center;
	}

	:global(.card.narrow) {
		max-width: 420px;
		width: 100%;
		margin: 3rem auto;
	}

	.stack {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}

	.stack p {
		margin: 0;
		line-height: 1.55;
	}

	.big {
		display: inline-flex;
		align-self: center;
		font-size: 3.2rem;
		color: var(--c, var(--eel));
	}

	.mono {
		letter-spacing: 0.2em;
	}

	/* ---- Briefing ---- */

	.briefing {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}

	.briefing h1 {
		font-size: 1.6rem;
		margin-bottom: 0.2rem;
	}

	.roles {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: 0.5rem;
	}

	:global(.card.role) {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		height: 100%;
		padding: 1rem;
	}

	:global(.card.role) strong {
		display: block;
		font-size: 1.2rem;
		font-weight: 900;
		overflow-wrap: anywhere;
	}

	:global(.card.role) p {
		margin: 0.3rem 0 0;
		font-size: 0.85rem;
		line-height: 1.4;
		color: var(--wolf);
	}

	.role-icon {
		display: flex;
		color: var(--eel);
	}

	.swap {
		display: grid;
		place-items: center;
		width: 2.8rem;
		height: 2.8rem;
		border: var(--border) solid var(--swan);
		border-bottom-width: calc(var(--border) + var(--depth));
		border-radius: 0;
		background: var(--snow);
		color: var(--blue);
		cursor: pointer;
	}

	.swap:active:not(:disabled) {
		transform: translateY(var(--depth));
		border-bottom-width: var(--border);
	}

	.levels {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
		margin-top: -0.4rem;
	}

	:global(.tile.level) {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.1rem;
		padding: 0.75rem 0.8rem;
		text-align: left;
	}

	:global(.tile.level) strong {
		font-size: 1.05rem;
		font-weight: 900;
	}

	:global(.tile.level) small {
		color: var(--wolf);
		font-weight: 800;
	}

	.tip {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin: 0;
		padding: 0.75rem 1rem;
		border-radius: var(--radius);
		background: var(--blue-light);
		color: var(--blue-shade);
		font-weight: 800;
		font-size: 0.92rem;
	}

	/* ---- Live ---- */

	.hint {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0 0 0.75rem;
		font-weight: 800;
		color: var(--wolf);
	}

	.hint.live {
		padding: 0.7rem 1rem;
		border-radius: var(--radius);
		background: #22332b;
		color: var(--snow);
	}

	.pulse {
		width: 0.7rem;
		height: 0.7rem;
		flex-shrink: 0;
		border-radius: 0;
		background: var(--red);
		animation: pulse 1s ease-in-out infinite;
	}

	@keyframes pulse {
		50% {
			box-shadow: 0 0 0 6px rgb(255 75 75 / 0.25);
		}
	}

	.expert-col {
		max-width: 720px;
		margin: 0 auto;
	}

	.countdown {
		position: fixed;
		inset: 0;
		z-index: 40;
		display: grid;
		place-items: center;
		background: rgb(30 33 36 / 0.7);
		color: var(--snow);
		font-size: 9rem;
		font-weight: 900;
		animation: count 0.9s var(--ease-out) forwards;
	}

	@keyframes count {
		from {
			font-size: 13rem;
			opacity: 0.2;
		}
	}

	/* ---- Result ---- */

	.flash {
		position: fixed;
		inset: 0;
		z-index: 40;
		pointer-events: none;
		background: radial-gradient(circle, #fff6c2, var(--orange) 40%, var(--red));
		animation: flash 1.2s ease-out forwards;
	}

	@keyframes flash {
		to {
			opacity: 0;
		}
	}

	.result {
		max-width: 440px;
		margin: 2rem auto 0;
	}

	.result.boom {
		animation: quake 0.6s 0.05s ease;
	}

	@keyframes quake {
		20% {
			transform: translate(-12px, 6px) rotate(-2deg);
		}
		40% {
			transform: translate(10px, -8px) rotate(2deg);
		}
		60% {
			transform: translate(-8px, 4px);
		}
		80% {
			transform: translate(4px, -2px);
		}
	}

	.result-icon {
		font-size: 4.5rem;
		animation: pop 0.5s var(--ease-spring);
	}

	@keyframes pop {
		from {
			transform: scale(0.3);
		}
	}

	.result h2 {
		font-size: 2rem;
	}

	.post-mortem {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		align-items: start;
		margin-top: 1.5rem;
	}

	.narrow-col {
		max-width: 440px;
		margin: 0 auto;
	}

	/* ---- Mission log ---- */

	.history {
		margin-top: 1.5rem;
	}

	.history h3 {
		font-size: 1.1rem;
		margin-bottom: 0.5rem;
	}

	.history ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.history li {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.55rem 0.8rem;
		border: var(--border) solid var(--swan);
		border-radius: var(--radius-sm);
		font-size: 0.9rem;
	}

	.h-text {
		flex: 1;
		min-width: 0;
		color: var(--wolf);
	}

	.h-time {
		font-family: var(--font);
		font-weight: 800;
	}

	@media (max-width: 760px) {
		.post-mortem {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 520px) {
		.roles {
			grid-template-columns: 1fr;
		}

		.swap {
			justify-self: center;
		}

		.levels {
			grid-template-columns: 1fr;
		}
	}
</style>
