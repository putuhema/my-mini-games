<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import type { OptimisticLocalStore } from 'convex/browser';
	import { useMutation, useQuery } from 'convex-svelte';
	import { api } from '../../../../convex/_generated/api';
	import { customer } from '../../../../convex/burger/customers';
	import { DIFFICULTIES, DIFFICULTY_IDS, dish as dishInfo } from '../../../../convex/burger/dishes';
	import { donenessAfter } from '../../../../convex/burger/ingredients';
	import { errorMessage, me, saveName } from '#lib/player.svelte.ts';
	import { sfx, sound, toggleMute } from '#lib/sound.svelte.ts';
	import { Button, Card, ChoiceTile } from '#lib/ui/index.ts';
	import {
		ArrowsLeftRightIcon,
		CashRegisterIcon,
		ChefHatIcon,
		CoinsIcon,
		DoorOpenIcon,
		EnvelopeSimpleOpenIcon,
		HamburgerIcon,
		HeadsetIcon,
		MagnifyingGlassIcon,
		ShuffleIcon,
		SpeakerHighIcon,
		SpeakerSlashIcon,
		WifiSlashIcon,
		XIcon
	} from '#lib/icons/index.ts';
	import Counter from '#lib/burger/Counter.svelte';
	import Customer from '#lib/burger/Customer.svelte';
	import Kitchen, { type KitchenActions } from '#lib/burger/Kitchen.svelte';
	import Reaction from '#lib/burger/Reaction.svelte';
	import Reviews from '#lib/burger/Reviews.svelte';
	import {
		formatSeconds,
		HEARTBEAT_MS,
		LAST_ROOM_KEY,
		money,
		OFFLINE_AFTER_MS,
		type RoomView
	} from '#lib/burger/room.ts';

	const code = $derived((page.params.code ?? '').toUpperCase());
	const queryArgs = $derived({ code, playerId: me.id });

	const roomQuery = useQuery(api.kitchen.get, () => queryArgs);
	const room = $derived(roomQuery.data);
	const presenceQuery = useQuery(api.kitchen.presence, () => (room ? { roomId: room._id } : 'skip'));

	const joinRoom = useMutation(api.kitchen.join);
	const chooseRole = useMutation(api.kitchen.chooseRole);
	const startShift = useMutation(api.kitchen.startShift);
	const again = useMutation(api.kitchen.again);
	const serverTime = useMutation(api.kitchen.now);
	const heartbeat = useMutation(api.kitchen.heartbeat);
	const configure = useMutation(api.kitchen.configure);
	const chooseDish = useMutation(api.kitchen.chooseDish);
	const addLayer = useMutation(api.kitchen.addLayer);
	const grillPatty = useMutation(api.kitchen.grillPatty);
	const takeOffGrill = useMutation(api.kitchen.takeOffGrill);
	const binPatty = useMutation(api.kitchen.binPatty);
	const undo = useMutation(api.kitchen.undo);
	const clear = useMutation(api.kitchen.clear);
	const serve = useMutation(api.kitchen.serve);
	const nextCustomer = useMutation(api.kitchen.nextCustomer);

	const isMember = $derived(room?.players.some((p) => p.id === me.id) ?? false);
	const cashier = $derived(room?.players.find((p) => p.id === room.cashierId));
	const chef = $derived(room?.players.find((p) => p.id !== room.cashierId));
	const partner = $derived(room?.players.find((p) => p.id !== me.id));
	const iCashier = $derived(room?.cashierId === me.id);
	const role = $derived(iCashier ? 'cashier' : 'chef');
	const tips = $derived(room?.results.reduce((sum, r) => sum + r.tip, 0) ?? 0);
	const lastResult = $derived(room?.status === 'served' ? room.results.at(-1) : undefined);

	let name = $state(me.name);
	let busy = $state(false);
	let error = $state('');
	let copied = $state(false);

	// Remember the room so the lobby can offer "Back to room" after the tab closes.
	$effect(() => {
		if (isMember) localStorage.setItem(LAST_ROOM_KEY, code);
		else if (roomQuery.data === null && localStorage.getItem(LAST_ROOM_KEY) === code)
			localStorage.removeItem(LAST_ROOM_KEY);
	});

	// ---- Clock: line up with the server so both screens agree ----
	let offset = $state(0);
	let now = $state(Date.now());
	function syncClock() {
		const t0 = Date.now();
		serverTime({})
			.then((server) => (offset = server - (t0 + Date.now()) / 2))
			.catch(() => {});
	}
	onMount(() => {
		syncClock();
		const id = setInterval(() => (now = Date.now()), 100);
		return () => clearInterval(id);
	});
	const serverNow = $derived(now + offset);
	const cooking = $derived(room?.status === 'cooking');
	const countdown = $derived(
		cooking && room?.startedAt && serverNow < room.startedAt ? Math.ceil((room.startedAt - serverNow) / 1000) : 0
	);
	const totalMs = $derived((room?.current?.seconds ?? 60) * 1000);
	const msLeft = $derived(
		cooking && room?.deadline ? Math.max(0, room.deadline - Math.max(serverNow, room.startedAt ?? 0)) : 0
	);
	const urgent = $derived(cooking && !countdown && msLeft < Math.min(10_000, totalMs * 0.3));

	// ---- Presence: heartbeats so each side knows if the other dropped ----
	$effect(() => {
		if (!room || !isMember) return;
		const roomId = room._id;
		const beat = () => heartbeat({ roomId, playerId: me.id }).catch(() => {});
		beat();
		const id = setInterval(beat, HEARTBEAT_MS);
		const onVisible = () => {
			if (document.visibilityState === 'visible') {
				beat();
				syncClock();
			}
		};
		document.addEventListener('visibilitychange', onVisible);
		return () => {
			clearInterval(id);
			document.removeEventListener('visibilitychange', onVisible);
		};
	});
	const partnerOffline = $derived.by(() => {
		if (!partner || !presenceQuery.data) return false;
		const seen = presenceQuery.data.find((p) => p.playerId === partner.id)?.lastSeen;
		return !seen || serverNow - seen > OFFLINE_AFTER_MS;
	});

	// ---- Sound cues ----
	let lastStatus = '';
	let lastIndex = -1;
	$effect(() => {
		const status = room?.status ?? '';
		const index = room?.customerIndex ?? -1;
		if (status === 'served' && lastStatus === 'cooking' && lastResult) {
			sfx.bell();
			const good = lastResult.tier === 'perfect' || lastResult.tier === 'close';
			setTimeout(() => (good ? sfx.match() : sfx.miss()), 350);
			if (lastResult.tip > 0) setTimeout(() => sfx.cash(), 1100);
			if (lastResult.tier === 'angry') navigator.vibrate?.([120, 60, 120]);
		}
		if (status === 'reviews' && lastStatus === 'served') sfx.win();
		if (status === 'cooking' && (lastStatus !== 'cooking' || index !== lastIndex)) sfx.pop();
		lastStatus = status;
		lastIndex = index;
	});
	// A change of mind: a sparkle and a buzz on the cashier's phone.
	let heardChange = '';
	$effect(() => {
		const change = room?.current && 'followUp' in room.current ? room.current.followUp?.text : undefined;
		if (change && change !== heardChange) {
			sfx.secret();
			navigator.vibrate?.([60, 40, 60]);
		}
		heardChange = change ?? '';
	});
	let lastSecond = 0;
	$effect(() => {
		const s = Math.ceil(msLeft / 1000);
		if (cooking && !countdown && s !== lastSecond && s <= 5 && s > 0) sfx.tick(true);
		lastSecond = s;
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

	/** Kitchen moves fire straight away and show instantly; the server confirms or rejects them. */
	function move(action: () => Promise<unknown>) {
		error = '';
		action().catch((err) => {
			const message = errorMessage(err);
			error = message;
			setTimeout(() => {
				if (error === message) error = '';
			}, 2500);
		});
	}

	function optimistic(change: (room: RoomView) => Partial<RoomView>) {
		const args = queryArgs;
		return {
			optimisticUpdate: (store: OptimisticLocalStore) => {
				const current = store.getQuery(api.kitchen.get, args);
				if (current) store.setQuery(api.kitchen.get, args, { ...current, ...change(current) });
			}
		};
	}

	const base = () => ({ roomId: room!._id, playerId: me.id });
	const actions: KitchenActions = {
		pickDish: (dish) => {
			sfx.pop();
			const slots = dishInfo(dish).cooker.slots;
			move(() =>
				chooseDish(
					{ ...base(), dish },
					optimistic(() => ({ dish, stack: [], grill: Array.from({ length: slots }, () => null) }))
				)
			);
		},
		add: (ing) => {
			sfx.plop();
			navigator.vibrate?.(8);
			move(() => addLayer({ ...base(), ing }, optimistic((r) => ({ stack: [...(r.stack ?? []), { ing }] }))));
		},
		grill: (ing) => {
			sfx.sizzle();
			move(() =>
				grillPatty(
					{ ...base(), ing },
					optimistic((r) => {
						const grill = [...(r.grill ?? [])];
						const slot = grill.findIndex((s) => s === null);
						if (slot >= 0) grill[slot] = { ing, placedAt: serverNow };
						return { grill };
					})
				)
			);
		},
		takeOff: (slot) => {
			sfx.plop();
			navigator.vibrate?.(8);
			move(() =>
				takeOffGrill(
					{ ...base(), slot },
					optimistic((r) => {
						const grill = [...(r.grill ?? [])];
						const patty = grill[slot];
						if (!patty) return {};
						grill[slot] = null;
						const state = donenessAfter(patty.ing, serverNow - patty.placedAt);
						return { grill, stack: [...(r.stack ?? []), { ing: patty.ing, state }] };
					})
				)
			);
		},
		bin: (slot) =>
			move(() =>
				binPatty(
					{ ...base(), slot },
					optimistic((r) => ({ grill: (r.grill ?? []).map((p, i) => (i === slot ? null : p)) }))
				)
			),
		undo: () => move(() => undo(base(), optimistic((r) => ({ stack: (r.stack ?? []).slice(0, -1) })))),
		clear: () => move(() => clear(base(), optimistic(() => ({ stack: [] })))),
		serve: () => run(() => serve(base()))
	};

	async function copyInvite() {
		const link = `${location.origin}/burger/${code}`;
		try {
			await navigator.clipboard.writeText(link);
		} catch {
			prompt('Copy this link for your partner:', link);
		}
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<svelte:head>
	<title>{cooking && !countdown ? `${formatSeconds(msLeft)} · ` : ''}Burger for Two · Us, Apart</title>
</svelte:head>

<main class:shift={cooking || room?.status === 'served'}>
	<nav class="topbar">
		<a class="close" href="/burger" aria-label="Leave game"><XIcon weight="bold" size="1.5rem" /></a>
		{#if room && isMember && (cooking || room.status === 'served')}
			<span class="role {role}">
				{#if iCashier}<CashRegisterIcon weight="fill" size="1.1rem" /> Cashier{:else}<ChefHatIcon
						weight="fill"
						size="1.1rem"
					/> Chef{/if}
			</span>
		{/if}
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

	{#if room && isMember && partnerOffline && room.status !== 'waiting'}
		<p class="offline" role="status">
			<WifiSlashIcon weight="fill" size="1.2rem" />
			{partner?.name} seems to be offline. They'll drop back in where they left off.
		</p>
	{/if}

	{#if roomQuery.isLoading}
		<p class="center muted">Loading room…</p>
	{:else if !room}
		<Card class="narrow">
			<div class="stack center">
				<span class="big" style="--c: var(--blue)"><MagnifyingGlassIcon weight="fill" /></span>
				<h2>Room not found</h2>
				<p class="muted">Double-check the code <strong>{code}</strong> with your partner.</p>
				<Button href="/burger" full>Back</Button>
			</div>
		</Card>
	{:else if !isMember}
		{#if room.players.length >= 2}
			<Card class="narrow">
				<div class="stack center">
					<span class="big" style="--c: var(--orange)"><DoorOpenIcon weight="fill" /></span>
					<h2>This room is full</h2>
					<p class="muted">Two players are already in room {room.code}.</p>
					<Button href="/burger" full>Start your own</Button>
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
					<span class="big" style="--c: var(--orange)"><HamburgerIcon weight="fill" /></span>
					<h2>{room.players[0]?.name} is opening a burger joint</h2>
					<label class="label" for="name">Your name</label>
					<input id="name" bind:value={name} maxlength="24" autocomplete="nickname" />
					<Button type="submit" size="lg" full disabled={busy || !name.trim()}>Join the crew</Button>
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
					Send them the code <strong class="mono">{room.code}</strong>. You'll pick who cooks once they join.
				</p>
				<Button variant="secondary" size="lg" full onclick={copyInvite}>
					{copied ? 'Link copied' : 'Copy invite link'}
				</Button>
			</div>
		</Card>
	{:else if room.status === 'lobby'}
		<div class="lobby">
			<h1>Who's doing what?</h1>
			<div class="roles">
				<button
					class="role-card cashier"
					class:mine={iCashier}
					disabled={busy}
					onclick={() => run(() => chooseRole({ ...base(), role: 'cashier' }))}
				>
					<span class="role-icon"><CashRegisterIcon weight="fill" size="2.2rem" /></span>
					<span class="label">Cashier</span>
					<strong>{iCashier ? 'You' : cashier?.name}</strong>
					<small>Sees the customer and their order. Describes it to the chef.</small>
				</button>
				<button
					class="role-card chef"
					class:mine={!iCashier}
					disabled={busy}
					onclick={() => run(() => chooseRole({ ...base(), role: 'chef' }))}
				>
					<span class="role-icon"><ChefHatIcon weight="fill" size="2.2rem" /></span>
					<span class="label">Chef</span>
					<strong>{iCashier ? chef?.name : 'You'}</strong>
					<small>Sees only the kitchen. Builds what they're told.</small>
				</button>
			</div>
			<div class="role-tools">
				<Button variant="outline" size="sm" disabled={busy} onclick={() => run(() => chooseRole({ ...base(), role: 'swap' }))}>
					<ArrowsLeftRightIcon weight="bold" size="1rem" /> Swap
				</Button>
				<Button variant="outline" size="sm" disabled={busy} onclick={() => run(() => chooseRole({ ...base(), role: 'random' }))}>
					<ShuffleIcon weight="bold" size="1rem" /> Random
				</Button>
			</div>

			{@render difficultyPicker()}

			<p class="tip">
				<HeadsetIcon weight="fill" size="1.4rem" />
				Start your call first. Burgers, sate ayam and mie ayam are on the menu — and the chef has
				to ask which one.
			</p>

			<Button size="lg" full disabled={busy} onclick={() => run(() => startShift(base()))}>Open for business</Button>
			{#if error}<p class="error">{error}</p>{/if}
		</div>
	{:else if room.status === 'cooking' && room.current}
		<div class="hud">
			<ol class="dots" aria-label="Customer {room.customerIndex + 1} of {room.customerCount}">
				{#each { length: room.customerCount } as _, i (i)}
					<li class:done={i < room.customerIndex} class:now={i === room.customerIndex}></li>
				{/each}
			</ol>
			<span class="hud-tips"><CoinsIcon weight="fill" size="1rem" /> {money(tips)}</span>
			<span class="clock" class:urgent>{formatSeconds(countdown ? totalMs : msLeft)}</span>
		</div>
		<div class="timer" aria-hidden="true">
			<span class:urgent style="width: {(countdown ? 1 : msLeft / totalMs) * 100}%"></span>
		</div>

		{#if iCashier && 'text' in room.current}
			<Counter order={room.current} {urgent} chefName={chef?.name ?? 'the chef'} />
		{:else if !iCashier && room.stack && room.grill}
			<Kitchen
				dish={room.dish}
				stack={room.stack}
				grill={room.grill}
				{serverNow}
				disabled={countdown > 0}
				{urgent}
				guest={room.current}
				cashierName={cashier?.name ?? 'the cashier'}
				{actions}
			/>
		{/if}
		{#if error}<p class="error toast" role="alert">{error}</p>{/if}

		{#if countdown > 0}
			<div class="arrival" aria-live="assertive">
				<div class="arrival-face"><Customer type={room.current.customer} /></div>
				<p>
					<strong>{room.current.name}</strong>
					{customer(room.current.customer).label} · {room.current.seconds}s
				</p>
				{#key countdown}<span class="count">{countdown}</span>{/key}
			</div>
		{/if}
	{:else if room.status === 'served' && lastResult}
		<Reaction
			result={lastResult}
			index={room.customerIndex}
			total={room.customerCount}
			{busy}
			onnext={() => run(() => nextCustomer({ ...base(), customerIndex: room.customerIndex }))}
		/>
		{#if error}<p class="error">{error}</p>{/if}
	{:else if room.status === 'reviews'}
		<Reviews
			results={room.results}
			history={room.history}
			{busy}
			onagain={(swap) => run(() => again({ ...base(), swap }))}
		/>
		<div class="next-level">{@render difficultyPicker()}</div>
		{#if error}<p class="error">{error}</p>{/if}
	{/if}
</main>

{#snippet difficultyPicker()}
	{#if room}
		<span class="label">How busy is the restaurant?</span>
		<div class="levels" role="radiogroup" aria-label="Difficulty">
			{#each DIFFICULTY_IDS as key (key)}
				<ChoiceTile
					class="level"
					selected={room.difficulty === key}
					role="radio"
					aria-checked={room.difficulty === key}
					disabled={busy}
					onclick={() => run(() => configure({ ...base(), difficulty: key }))}
				>
					<strong>{DIFFICULTIES[key].label}</strong>
					<small>{DIFFICULTIES[key].detail}</small>
				</ChoiceTile>
			{/each}
		</div>
	{/if}
{/snippet}

<style>
	main {
		max-width: 560px;
		margin: 0 auto;
		padding: 0.75rem 1rem 3rem;
	}

	main.shift {
		padding-bottom: 1rem;
	}

	.topbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.6rem;
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
		margin-left: 0.25rem;
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

	/* Always-visible role indicator during a shift. */
	.role {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.4rem 0.9rem;
		border-radius: 0;
		color: var(--snow);
		font-size: 0.85rem;
		font-weight: 900;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.role.cashier {
		background: var(--gold-shade);
	}

	.role.chef {
		background: var(--orange);
	}

	.offline {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0 0 0.75rem;
		padding: 0.6rem 0.9rem;
		border-radius: var(--radius);
		background: var(--red-light);
		color: var(--red-shade);
		font-size: 0.88rem;
		font-weight: 800;
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

	/* ---- Lobby ---- */

	.lobby {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}

	.lobby h1 {
		font-size: 1.6rem;
	}

	.roles {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.6rem;
	}

	.role-card {
		--c: var(--gold);
		--c-shade: var(--gold-shade);
		--c-light: var(--gold-light);
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.25rem;
		padding: 1rem;
		border: var(--border) solid var(--swan);
		border-bottom-width: calc(var(--border) + var(--depth));
		border-radius: var(--radius-lg);
		background: var(--snow);
		text-align: left;
		cursor: pointer;
		touch-action: manipulation;
		transition: transform 0.08s ease;
	}

	.role-card.chef {
		--c: var(--orange);
		--c-shade: var(--orange-shade);
		--c-light: var(--orange-light);
	}

	.role-card.mine {
		border-color: var(--c);
		background: var(--c-light);
	}

	.role-card:active:not(:disabled) {
		transform: translateY(var(--depth));
		border-bottom-width: var(--border);
	}

	.role-icon {
		display: flex;
		color: var(--c-shade);
		margin-bottom: 0.25rem;
	}

	.role-card .label {
		margin: 0;
	}

	.role-card strong {
		font-size: 1.25rem;
		font-weight: 900;
		overflow-wrap: anywhere;
	}

	.role-card small {
		font-size: 0.82rem;
		line-height: 1.4;
		color: var(--wolf);
		font-weight: 700;
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
		padding: 0.7rem 0.75rem;
		text-align: left;
	}

	:global(.tile.level) small {
		color: var(--wolf);
		line-height: 1.2;
	}

	.next-level {
		margin-top: 1.25rem;
	}

	.role-tools {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
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

	/* ---- Shift HUD ---- */

	.hud {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.dots {
		display: flex;
		gap: 0.3rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.dots li {
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 0;
		background: var(--swan);
	}

	.dots li.done {
		background: var(--green);
	}

	.dots li.now {
		background: var(--orange);
		box-shadow: 0 0 0 3px var(--orange-light);
	}

	.hud-tips {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		color: var(--gold-shade);
		font-weight: 900;
		font-size: 0.9rem;
	}

	.clock {
		margin-left: auto;
		font-size: 1.5rem;
		font-weight: 900;
		font-variant-numeric: tabular-nums;
	}

	.clock.urgent {
		color: var(--red);
		animation: throb 0.5s ease-in-out infinite alternate;
	}

	@keyframes throb {
		to {
			transform: scale(1.12);
		}
	}

	.timer {
		height: 10px;
		margin: 0.4rem 0 0.85rem;
		border-radius: 0;
		background: var(--swan);
		overflow: hidden;
	}

	.timer span {
		display: block;
		height: 100%;
		border-radius: 0;
		background: var(--green);
		transition: width 0.1s linear;
	}

	.timer span.urgent {
		background: var(--red);
	}

	.toast {
		position: fixed;
		left: 50%;
		bottom: 6.2rem;
		z-index: 30;
		transform: translateX(-50%);
		padding: 0.55rem 1rem;
		border-radius: 0;
		background: var(--eel);
		color: var(--snow);
		white-space: nowrap;
		animation: toast 0.25s var(--ease-spring);
	}

	@keyframes toast {
		from {
			transform: translate(-50%, 10px) scale(0.9);
			opacity: 0;
		}
	}

	/* "Next customer" walk-in. */
	.arrival {
		position: fixed;
		inset: 0;
		z-index: 40;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.6rem;
		background: rgb(255 248 235 / 0.96);
		text-align: center;
	}

	.arrival-face {
		width: 11rem;
		animation: walk 0.9s var(--ease-out);
	}

	@keyframes walk {
		from {
			transform: translateX(-60vw) rotate(-8deg);
		}
		60% {
			transform: translateX(4vw) rotate(3deg);
		}
	}

	.arrival p {
		display: flex;
		flex-direction: column;
		margin: 0;
		color: var(--wolf);
		font-weight: 800;
	}

	.arrival strong {
		font-size: 1.5rem;
		font-weight: 900;
		color: var(--eel);
	}

	.count {
		font-size: 4.5rem;
		font-weight: 900;
		color: var(--orange);
		animation: count 0.9s var(--ease-out) forwards;
	}

	@keyframes count {
		from {
			transform: scale(1.6);
			opacity: 0.2;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.clock.urgent,
		.arrival-face,
		.count {
			animation: none;
		}
	}
</style>
