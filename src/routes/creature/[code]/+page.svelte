<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { useMutation, useQuery } from 'convex-svelte';
	import { api } from '../../../../convex/_generated/api';
	import {
		EMOTES,
		FOODS,
		freeSpot,
		HEARTBEAT_MS,
		HUG_RANGE,
		MAX_CHAT,
		MENU,
		motionAt,
		needsAt,
		NEEDS,
		OBJECTS,
		OFFLINE_AFTER_MS,
		PLAYER_SPEED,
		PLAYS,
		type Coat,
		type Emote,
		type Food,
		type Gift,
		type Hair,
		type Play,
		type Point,
		type Shirt,
		walkTo
	} from '../../../../convex/creature/world';
	import { event } from '../../../../convex/creature/events';
	import { errorMessage, me, saveName } from '#lib/player.svelte.ts';
	import { radio, sfx, sound, toggleMute } from '#lib/sound.svelte.ts';
	import { Button, Card } from '#lib/ui/index.ts';
	import {
		BookOpenTextIcon,
		ChatCircleDotsIcon,
		DoorOpenIcon,
		LinkIcon,
		MagnifyingGlassIcon,
		SpeakerHighIcon,
		SpeakerSlashIcon,
		XIcon
	} from '#lib/icons/index.ts';
	import { cat, character, skyNow } from '#lib/creature/art.ts';
	import DailyEvent from '#lib/creature/DailyEvent.svelte';
	import Dialog from '#lib/creature/Dialog.svelte';
	import Evolution from '#lib/creature/Evolution.svelte';
	import LeaveSomething from '#lib/creature/LeaveSomething.svelte';
	import LookPicker from '#lib/creature/LookPicker.svelte';
	import MemoryBook from '#lib/creature/MemoryBook.svelte';
	import Needs from '#lib/creature/Needs.svelte';
	import Pixel from '#lib/creature/Pixel.svelte';
	import Room from '#lib/creature/Room.svelte';
	import {
		asleep,
		LAST_ROOM_KEY,
		loadLook,
		poseAt,
		saveLook,
		speaking,
		type Motion
	} from '#lib/creature/room.ts';

	const code = $derived((page.params.code ?? '').toUpperCase());
	const view = useQuery(api.pets.get, () => ({ code, playerId: me.id }));
	const couple = $derived(view.data?.couple);
	const pet = $derived(view.data?.pet ?? undefined);
	const member = $derived(view.data?.member ?? false);
	const partner = $derived(couple?.players.find((p) => p.id !== me.id));
	const myself = $derived(couple?.players.find((p) => p.id === me.id));

	const live = $derived(couple && member ? { coupleId: couple._id } : null);
	const presenceQ = useQuery(api.pets.presence, () => live ?? 'skip');
	const todayQ = useQuery(api.pets.today, () => (live ? { ...live, playerId: me.id } : 'skip'));
	const recentQ = useQuery(api.pets.recent, () => live ?? 'skip');

	const joinRoom = useMutation(api.pets.join);
	const restyle = useMutation(api.pets.restyle);
	const arrive = useMutation(api.pets.arrive);
	const heartbeat = useMutation(api.pets.heartbeat);
	const moveTo = useMutation(api.pets.move);
	const care = useMutation(api.pets.care);
	const playWith = useMutation(api.pets.play);
	const callCat = useMutation(api.pets.call);
	const interact = useMutation(api.pets.interact);
	const greet = useMutation(api.pets.greet);
	const emote = useMutation(api.pets.emote);
	const chat = useMutation(api.pets.chat);
	const vote = useMutation(api.pets.vote);
	const decideAlone = useMutation(api.pets.decideAlone);
	const leaveGift = useMutation(api.pets.leaveGift);
	const goodbye = useMutation(api.pets.goodbye);
	const sawEvolution = useMutation(api.pets.sawEvolution);
	const serverTime = useMutation(api.pets.now);

	// ---- Clock: line up with the server so both screens animate the same moment ----
	let offset = $state(0);
	let clientNow = $state(Date.now());
	const now = $derived(clientNow + offset);
	function syncClock() {
		const t0 = Date.now();
		serverTime({})
			.then((server) => (offset = server - (t0 + Date.now()) / 2))
			.catch(() => {});
	}
	onMount(() => {
		syncClock();
		let id = 0;
		let last = 0;
		const loop = (t: number) => {
			if (t - last > 30) {
				clientNow = Date.now();
				last = t;
			}
			id = requestAnimationFrame(loop);
		};
		id = requestAnimationFrame(loop);
		return () => {
			cancelAnimationFrame(id);
			radio(false);
		};
	});

	// ---- Arriving: the "while you were away" story ----
	type Summary = Awaited<ReturnType<typeof arrive>>;
	let summary = $state<Summary | null>(null);
	let arrived = $state(false);
	let myMotion = $state<Motion | null>(null);

	async function doArrive() {
		if (!couple) return;
		try {
			const result = await arrive({ coupleId: couple._id, playerId: me.id });
			myMotion = null;
			arrived = true;
			if (result.firstVisit || result.gifts.length || (result.away && result.items.length)) summary = result;
		} catch {
			// The heartbeat will try again.
		}
	}

	$effect(() => {
		if (couple && member && !arrived) {
			localStorage.setItem(LAST_ROOM_KEY, code);
			void doArrive();
		}
	});

	// Start my own walk from where the server put me.
	$effect(() => {
		if (!arrived || myMotion || !presenceQ.data) return;
		const row = presenceQ.data.find((r) => r.playerId === me.id);
		if (row) myMotion = row.motion;
	});

	// ---- Presence ----
	$effect(() => {
		if (!live || !arrived) return;
		const args = { ...live, playerId: me.id };
		const beat = () => heartbeat(args).catch(() => {});
		const id = setInterval(beat, HEARTBEAT_MS);
		let hiddenAt = 0;
		const onVisible = () => {
			if (document.visibilityState === 'hidden') {
				hiddenAt = Date.now();
				return;
			}
			syncClock();
			// Gone long enough to count as having left: arrive again for the greeting and story.
			if (hiddenAt && Date.now() - hiddenAt > OFFLINE_AFTER_MS) void doArrive();
			else beat();
		};
		document.addEventListener('visibilitychange', onVisible);
		return () => {
			clearInterval(id);
			document.removeEventListener('visibilitychange', onVisible);
		};
	});

	const partnerRow = $derived(presenceQ.data?.find((r) => r.playerId === partner?.id));
	const partnerOnline = $derived(!!partnerRow && partnerRow.online && now - partnerRow.lastSeen < OFFLINE_AFTER_MS);

	// ---- Moving and doing things ----
	let toast = $state('');
	let toastTimer: ReturnType<typeof setTimeout> | undefined;
	function say(message: string) {
		toast = message;
		clearTimeout(toastTimer);
		toastTimer = setTimeout(() => (toast = ''), 2800);
	}
	function attempt(action: () => Promise<unknown>) {
		action().catch((err) => say(errorMessage(err)));
	}

	const myPos = $derived(myMotion ? motionAt(myMotion, now) : null);
	const petPos = $derived(pet ? motionAt(pet.motion, now) : null);

	/** Walks me somewhere; returns how long it takes. */
	function walk(to: Point) {
		if (!couple || !myMotion) return 0;
		const from = motionAt(myMotion, now);
		const target = freeSpot(to);
		myMotion = walkTo(from, target, now, PLAYER_SPEED);
		moveTo({ coupleId: couple._id, playerId: me.id, ...target }).catch(() => {});
		return myMotion.dur;
	}

	const beside = (p: Point | null) => {
		if (!p || !myPos) return p ?? { x: 80, y: 90 };
		return { x: p.x + (myPos.x < p.x ? -12 : 12), y: p.y + 6 };
	};

	type Tray = 'feed' | 'play' | 'talk' | null;
	type Panel = 'pet' | 'partner' | 'event' | 'journal' | 'menu' | null;
	let tray = $state<Tray>(null);
	let panel = $state<Panel>(null);
	let aiming = $state<'ball' | 'laser' | null>(null);
	let gifting = $state<'leave' | 'gift' | null>(null);
	let giftBusy = $state(false);
	let giftError = $state('');

	const base = () => ({ coupleId: couple!._id, playerId: me.id });
	const sleeping = $derived(pet ? asleep(pet, now) : false);
	const inBox = $derived(pet?.stage === 'box');

	const toggleTray = (t: Tray) => {
		aiming = null;
		tray = tray === t ? null : t;
	};

	const act = {
		feed(food: Food) {
			tray = null;
			walk(OBJECTS.bowl.spot);
			sfx.pop();
			attempt(() => care({ ...base(), action: 'feed', food }));
		},
		play(toy: Play) {
			tray = null;
			if (sleeping) return say(`Shh... ${pet?.name} is sleeping.`);
			if (PLAYS[toy].aim) {
				aiming = toy as 'ball' | 'laser';
				return;
			}
			sfx.whoosh();
			attempt(() => playWith({ ...base(), toy }));
		},
		pet() {
			walk(beside(petPos));
			sfx.purr();
			attempt(() => care({ ...base(), action: 'pet' }));
		},
		brush() {
			if (sleeping) return say(`Shh... ${pet?.name} is sleeping.`);
			walk(beside(petPos));
			sfx.splash();
			attempt(() => care({ ...base(), action: 'clean' }));
		},
		call() {
			if (sleeping) return say(`Shh... ${pet?.name} is sleeping.`);
			attempt(() => callCat(base()));
		},
		bed() {
			walk(OBJECTS.petBed.spot);
			attempt(() => care({ ...base(), action: sleeping ? 'wake' : 'sleep' }));
		},
		greet() {
			walk(OBJECTS.box.spot);
			sfx.pop();
			attempt(() => greet(base()));
		}
	};

	function onfloor(p: Point) {
		if (aiming) {
			const toy = aiming;
			aiming = null;
			sfx.whoosh();
			attempt(() => playWith({ ...base(), toy, x: p.x, y: p.y }));
			return;
		}
		tray = null;
		walk(p);
	}

	function onthing(key: string, p: Point) {
		if (!pet) return;
		tray = tray === 'talk' ? tray : null;
		if (key === 'pet') return inBox ? act.greet() : act.pet();
		if (key === 'me') return toggleTray('talk');
		if (key === 'partner') {
			if (partnerRow) walk(beside(motionAt(partnerRow.motion, now)));
			tray = 'talk';
			return;
		}
		if (key === 'box' && inBox) return act.greet();
		if (inBox && ['bowl', 'tub', 'petBed', 'toybox'].includes(key)) {
			walk(p);
			return say('Nobody to use that yet. Say hello to the box!');
		}
		if (key === 'bowl') {
			walk(OBJECTS.bowl.spot);
			tray = 'feed';
			return;
		}
		if (key === 'petBed') return act.bed();
		if (key === 'toybox') {
			walk(OBJECTS.toybox.spot);
			tray = 'play';
			return;
		}
		if (key === 'door') {
			walk(OBJECTS.door.spot);
			gifting = 'leave';
			return;
		}
		if (key === 'rug') return walk(p);
		if (key === 'lamp' || key === 'radio') sfx.blip();
		const spot = key in OBJECTS ? OBJECTS[key as keyof typeof OBJECTS].spot : { x: p.x, y: p.y + 4 };
		walk(spot);
		attempt(() => interact({ ...base(), target: key }));
	}

	// ---- Talking: emotes and chat bubbles ----
	let message = $state('');
	function sendEmote(kind: Emote) {
		if (kind === 'hug') {
			if (!partnerOnline || !partnerRow) return say(partner ? `${partner.name} isn't here right now` : 'Invite your partner first');
			const theirs = motionAt(partnerRow.motion, now);
			const close = myPos && Math.hypot(myPos.x - theirs.x, myPos.y - theirs.y) <= HUG_RANGE - 4;
			const wait = close ? 0 : walk(beside(theirs));
			tray = null;
			setTimeout(() => {
				sfx.reaction();
				attempt(() => emote({ ...base(), kind }));
			}, wait + 150);
			return;
		}
		tray = null;
		sfx.reaction();
		attempt(() => emote({ ...base(), kind }));
	}
	function sendChat(e: SubmitEvent) {
		e.preventDefault();
		const text = message.trim();
		if (!text) return;
		message = '';
		tray = null;
		sfx.send();
		attempt(() => chat({ ...base(), text }));
	}
	const EMOTE_ICON: Record<Emote, string> = { wave: 'hand', heart: 'heart', laugh: 'laugh', hug: 'hug', cry: 'cry', sleepy: 'z', wow: 'wow' };
	const EMOTE_LABEL: Record<Emote, string> = { wave: 'Wave', heart: 'Love', laugh: 'Haha', hug: 'Hug', cry: 'Miss you', sleepy: 'Sleepy', wow: 'Wow' };

	// Keyboard walking: arrows or WASD, along the room's diagonals.
	let lastKey = 0;
	function keydown(e: KeyboardEvent) {
		if (!myPos || summary || panel || gifting) return;
		if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
		if (e.key === 'Escape') {
			tray = null;
			aiming = null;
			return;
		}
		const dir = {
			ArrowUp: [-1, -1],
			KeyW: [-1, -1],
			ArrowDown: [1, 1],
			KeyS: [1, 1],
			ArrowLeft: [-1, 1],
			KeyA: [-1, 1],
			ArrowRight: [1, -1],
			KeyD: [1, -1]
		}[e.code];
		if (!dir) return;
		e.preventDefault();
		if (performance.now() - lastKey < 110) return;
		lastKey = performance.now();
		walk({ x: myPos.x + dir[0] * 9, y: myPos.y + dir[1] * 9 });
	}

	// ---- Leaving ----
	async function leave(gift?: { item: Gift; message: string }) {
		if (!couple) return;
		giftBusy = true;
		giftError = '';
		try {
			if (gift) await leaveGift({ ...base(), item: gift.item, message: gift.message || undefined });
			if (gifting === 'leave') {
				await goodbye(base());
				await goto('/creature');
			} else {
				gifting = null;
				say(partner ? `Left for ${partner.name}` : 'Given!');
			}
		} catch (err) {
			giftError = errorMessage(err);
		} finally {
			giftBusy = false;
		}
	}

	// ---- Joining (when opening an invite link), and changing my look ----
	const saved = loadLook();
	let name = $state(me.name);
	let shirt = $state<Shirt>(saved.shirt);
	let hair = $state<Hair>(saved.hair);
	let joinBusy = $state(false);
	let joinError = $state('');
	async function join() {
		joinBusy = true;
		joinError = '';
		try {
			saveName(name);
			saveLook({ shirt, hair });
			await joinRoom({ code, playerId: me.id, name, shirt, hair });
		} catch (err) {
			joinError = errorMessage(err);
		} finally {
			joinBusy = false;
		}
	}
	$effect(() => {
		if (myself && panel !== 'menu') {
			shirt = myself.shirt as Shirt;
			hair = myself.hair as Hair;
		}
	});
	function saveMyLook() {
		saveLook({ shirt, hair });
		attempt(() => restyle({ ...base(), shirt, hair }));
	}

	let copied = $state(false);
	async function copyInvite() {
		const link = `${location.origin}/creature/${code}`;
		try {
			await navigator.clipboard.writeText(link);
		} catch {
			prompt('Copy this link for your partner:', link);
		}
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	// ---- Status ----
	const minute = $derived(Math.floor(now / 20_000) * 20_000);
	const needs = $derived(pet ? needsAt(pet, minute) : null);
	const status = $derived.by(() => {
		if (!pet || !needs) return '';
		if (pet.stage === 'box') return 'Hiding in a box';
		if (sleeping) return 'Sleeping';
		if (needs.hunger < 35) return 'Hungry';
		if (needs.happiness < 35) return 'A bit lonely';
		if (needs.cleanliness < 35) return 'Messy fur';
		if (needs.energy < 30) return 'Sleepy';
		return 'Doing great';
	});
	const NEED_COLOR = { hunger: '#ff9a4d', happiness: '#ff6b9a', energy: '#ffc44d', cleanliness: '#86bcff' };
	const portrait = $derived(
		pet ? cat(pet.coat as Coat, pet.stage === 'box' ? 'kitten' : pet.stage, pet.evolution, { pose: 'sit', eyes: 'open', mouth: 'smile' }) : null
	);
	const todayEvent = $derived(todayQ.data ? event(todayQ.data.eventId) : undefined);
	const eventWaiting = $derived(!!todayQ.data && !todayQ.data.result && !todayQ.data.mine);

	// ---- Things happening, as they happen: little notes from the room ----
	let ticker = $state<{ id: string; icon: string; text: string }[]>([]);
	let seen = new Set<string>();
	let primed = false;
	$effect(() => {
		const rows = recentQ.data;
		if (!rows || !arrived) return;
		if (!primed) {
			rows.forEach((r) => seen.add(r._id));
			primed = true;
			return;
		}
		for (const r of [...rows].reverse()) {
			if (seen.has(r._id)) continue;
			seen.add(r._id);
			if (r.playerId === me.id) continue;
			ticker = [...ticker, { id: r._id, icon: r.icon, text: r.text }].slice(-3);
			setTimeout(() => (ticker = ticker.filter((x) => x.id !== r._id)), 5_000);
		}
	});

	// ---- Sounds and moments ----
	let heard = '';
	let lastPose = '';
	let lastStage = '';
	$effect(() => {
		if (!pet) return;
		const words = speaking(pet, now);
		const key = words ? `${pet.say?.at}:${words}` : '';
		if (key && key !== heard) sfx.meow();
		heard = key || heard;
		const pose = poseAt(pet, now);
		if (pose !== lastPose) {
			if (pose === 'eat') sfx.munch();
			if (pose === 'bath') sfx.splash();
			if (pose === 'pounce') sfx.pop();
		}
		lastPose = pose;
		if (lastStage === 'box' && pet.stage === 'kitten') {
			sfx.win();
			say(`${pet.name} came out of the box!`);
		}
		lastStage = pet.stage;
	});
	$effect(() => {
		radio(!!couple?.radioOn && !sound.muted && arrived);
	});

	const evolving = $derived(!!pet?.evolution && !pet.evolutionSeen.includes(me.id));
	const sky = $derived(skyNow(new Date(Math.floor(now / 60_000) * 60_000)));
</script>

<svelte:window onkeydown={keydown} />

<svelte:head>
	<title>{pet ? `${pet.name} · ` : ''}Our Little Creature · Us, Apart</title>
</svelte:head>

{#if view.isLoading}
	<main class="page"><p class="center muted">Opening the door...</p></main>
{:else if !couple}
	<main class="page">
		<Card class="narrow">
			<div class="stack center">
				<span class="big"><MagnifyingGlassIcon weight="fill" /></span>
				<h2>Room not found</h2>
				<p class="muted">Double-check the code <strong>{code}</strong> with your partner.</p>
				<Button href="/creature" full>Back</Button>
			</div>
		</Card>
	</main>
{:else if !member}
	<main class="page">
		{#if couple.players.length >= 2}
			<Card class="narrow">
				<div class="stack center">
					<span class="big"><DoorOpenIcon weight="fill" /></span>
					<h2>This room is taken</h2>
					<p class="muted">Room {couple.code} already belongs to two people.</p>
					<Button href="/creature" full>Find your own kitten</Button>
				</div>
			</Card>
		{:else}
			<Card class="narrow">
				<form
					class="stack"
					onsubmit={(e) => {
						e.preventDefault();
						join();
					}}
				>
					<h2>{couple.players[0]?.name} found a box with a kitten in it</h2>
					<p class="muted">It needs both of you. Move in and help raise it.</p>
					<label class="label" for="name">Your name</label>
					<input id="name" bind:value={name} maxlength="24" autocomplete="nickname" />
					<LookPicker bind:shirt bind:hair />
					<Button type="submit" size="lg" variant="super" full disabled={joinBusy || !name.trim()}>Move in</Button>
					{#if joinError}<p class="error">{joinError}</p>{/if}
				</form>
			</Card>
		{/if}
	</main>
{:else if pet && myMotion}
	<main class="game {sky}" class:dark={couple.lightsOff && sky === 'night'}>
		<Room
			{couple}
			{pet}
			presence={presenceQ.data ?? []}
			meId={me.id}
			{myMotion}
			{now}
			{aiming}
			{onfloor}
			{onthing}
		/>

		<!-- Top left: leave, and the cat at a glance. -->
		<div class="hud top-left">
			<a class="hud-btn" href="/creature" aria-label="Back to the lobby"><XIcon weight="bold" size="1.3rem" /></a>
			<button class="chip pet-chip" onclick={() => (panel = 'pet')} aria-label="{pet.name}: {status}">
				{#if portrait}<span class="face"><Pixel img={portrait} scale={2} trim /></span>{/if}
				<span class="who">
					<strong>{pet.name}</strong>
					<small>{status}</small>
				</span>
				{#if needs && !inBox}
					<span class="bars" aria-hidden="true">
						{#each NEEDS as n (n)}
							<span class="bar"><span style="height: {Math.round(needs[n])}%; background: {NEED_COLOR[n]}"></span></span>
						{/each}
					</span>
				{/if}
			</button>
		</div>

		<!-- Top right: your partner, today's question, the journal, sound, menu. -->
		<div class="hud top-right">
			<button class="chip partner-chip" onclick={() => (partner ? (panel = 'partner') : copyInvite())}>
				{#if partner}
					<Pixel img={character(partner, 'down')} scale={2} />
					<span class="dot" class:online={partnerOnline}></span>
					<span class="who"><strong>{partner.name}</strong><small>{partnerOnline ? 'Here now' : 'Away'}</small></span>
				{:else}
					<LinkIcon weight="bold" size="1.2rem" />
					<span class="who"><strong>{copied ? 'Copied!' : 'Invite'}</strong><small>Code {couple.code}</small></span>
				{/if}
			</button>
			{#if todayEvent && !inBox}
				<button class="hud-btn" class:ping={eventWaiting} onclick={() => (panel = 'event')} aria-label="Today's question" title="Today's question">
					<Pixel name={todayEvent.icon} scale={2} />
				</button>
			{/if}
			<button class="hud-btn" onclick={() => (panel = 'journal')} aria-label="Journal" title="Journal">
				<BookOpenTextIcon weight="fill" size="1.3rem" />
			</button>
			<button class="hud-btn sound-btn" onclick={toggleMute} aria-label={sound.muted ? 'Turn sound on' : 'Mute sound'}>
				{#if sound.muted}<SpeakerSlashIcon weight="fill" size="1.3rem" />{:else}<SpeakerHighIcon weight="fill" size="1.3rem" />{/if}
			</button>
			<button class="hud-btn" onclick={() => (panel = 'menu')} aria-label="Menu" title="Menu">
				<DoorOpenIcon weight="fill" size="1.3rem" />
			</button>
		</div>

		<div class="notes" aria-live="polite">
			{#if toast}<p class="note toast" role="status">{toast}</p>{/if}
			{#each ticker as t (t.id)}
				<p class="note"><Pixel name={t.icon} scale={2} /> {t.text}</p>
			{/each}
		</div>

		<!-- Bottom: talking, and looking after the cat. -->
		<div class="hud bottom">
			{#if tray === 'feed'}
				<div class="tray" role="menu" aria-label="Food">
					{#each MENU as food (food)}
						<button class="tray-item" role="menuitem" onclick={() => act.feed(food)}>
							<Pixel name={food} scale={3} /><span>{FOODS[food].label}</span>
						</button>
					{/each}
				</div>
			{:else if tray === 'play'}
				<div class="tray" role="menu" aria-label="Toys">
					{#each Object.keys(PLAYS) as toy (toy)}
						<button class="tray-item" role="menuitem" onclick={() => act.play(toy as Play)}>
							<Pixel name={toy} scale={3} /><span>{PLAYS[toy as Play].label}</span>
						</button>
					{/each}
				</div>
			{:else if tray === 'talk'}
				<div class="tray talk" aria-label="Say something">
					<div class="emotes">
						{#each EMOTES as e (e)}
							<button class="tray-item small" onclick={() => sendEmote(e)} title={EMOTE_LABEL[e]}>
								<Pixel name={EMOTE_ICON[e]} scale={2} /><span>{EMOTE_LABEL[e]}</span>
							</button>
						{/each}
					</div>
					<form class="say" onsubmit={sendChat}>
						<input bind:value={message} maxlength={MAX_CHAT} placeholder={partnerOnline ? `Say something to ${partner?.name}...` : `Say something to ${pet.name}...`} aria-label="Message" />
						<Button type="submit" size="sm" variant="super" disabled={!message.trim()}>Say</Button>
					</form>
				</div>
			{/if}

			<div class="dock" role="toolbar" aria-label="Look after {pet.name}">
				<button class="act talk-btn" class:on={tray === 'talk'} onclick={() => toggleTray('talk')} aria-label="Talk">
					<ChatCircleDotsIcon weight="fill" size="1.6rem" /><span>Talk</span>
				</button>
				<span class="sep"></span>
				{#if inBox}
					<button class="act wide" onclick={act.greet}>
						<Pixel name="box" scale={3} /><span>{pet.greetedBy.includes(me.id) ? 'Knock again' : 'Say hello'}</span>
					</button>
				{:else}
					<button class="act" class:on={tray === 'feed'} onclick={() => toggleTray('feed')} disabled={sleeping}>
						<Pixel name="kibble" scale={2} /><span>Feed</span>
					</button>
					<button class="act" class:on={tray === 'play' || !!aiming} onclick={() => toggleTray('play')} disabled={sleeping}>
						<Pixel name="ball" scale={2} /><span>{aiming ? 'Aim' : 'Play'}</span>
					</button>
					<button class="act" onclick={act.pet}>
						<Pixel name="hand" scale={2} /><span>Pet</span>
					</button>
					<button class="act" onclick={act.brush} disabled={sleeping}>
						<Pixel name="brush" scale={2} /><span>Brush</span>
					</button>
					<button class="act" onclick={act.call} disabled={sleeping}>
						<Pixel name="paw" scale={2} /><span>Call</span>
					</button>
					<button class="act" onclick={act.bed}>
						<Pixel name="moon" scale={2} /><span>{sleeping ? 'Wake' : 'Nap'}</span>
					</button>
				{/if}
			</div>
		</div>
	</main>
{:else}
	<main class="page"><p class="center muted">Opening the door...</p></main>
{/if}

{#if panel === 'pet' && pet && couple}
	<Dialog title={pet.name} onclose={() => (panel = null)}>
		<Needs {pet} startedAt={couple.startedAt} {now} {status} />
	</Dialog>
{:else if panel === 'partner' && partner && pet}
	<Dialog title={partner.name} onclose={() => (panel = null)}>
		<div class="stack">
			<div class="partner">
				<Pixel img={character(partner, 'down')} scale={4} />
				<p class="muted">
					{partnerOnline ? `${partner.name} is in the room right now.` : `${partner.name} is away. Leave them something to find.`}
				</p>
			</div>
			<div class="row">
				{#if partnerOnline}
					<Button variant="super" onclick={() => { panel = null; sendEmote('hug'); }}>Hug</Button>
					<Button variant="secondary" onclick={() => { panel = null; sendEmote('wave'); }}>Wave</Button>
				{/if}
				<Button variant={partnerOnline ? 'outline' : 'super'} onclick={() => { panel = null; gifting = 'gift'; }}>Leave a surprise</Button>
			</div>
		</div>
	</Dialog>
{:else if panel === 'event' && todayQ.data && couple && pet}
	<Dialog title="Today's question" onclose={() => (panel = null)}>
		<DailyEvent
			today={todayQ.data}
			{couple}
			meId={me.id}
			petName={pet.name}
			busy={false}
			onvote={(choice) => attempt(() => vote({ ...base(), eventId: todayQ.data!._id, choice }))}
			onalone={() => attempt(() => decideAlone({ ...base(), eventId: todayQ.data!._id }))}
		/>
	</Dialog>
{:else if panel === 'journal' && couple && pet}
	<MemoryBook coupleId={couple._id} petName={pet.name} recent={recentQ.data ?? []} {now} onclose={() => (panel = null)} />
{:else if panel === 'menu' && couple && pet}
	<Dialog title="Menu" onclose={() => (panel = null)}>
		<div class="stack">
			<LookPicker bind:shirt bind:hair />
			<Button variant="secondary" onclick={saveMyLook}>Save my look</Button>
			<Button variant="outline" onclick={toggleMute}>{sound.muted ? 'Turn sound on' : 'Mute sound'}</Button>
			<div class="invite">
				<span class="muted">Room code</span>
				<strong class="mono">{couple.code}</strong>
				<Button size="sm" variant="outline" onclick={copyInvite}>{copied ? 'Copied' : 'Copy link'}</Button>
			</div>
			<Button variant="super" onclick={() => { panel = null; gifting = 'gift'; }}>
				{partner ? `Leave something for ${partner.name}` : `Leave a treat for ${pet.name}`}
			</Button>
			<Button variant="outline" onclick={() => { panel = null; gifting = 'leave'; }}>Leave the room</Button>
		</div>
	</Dialog>
{/if}

{#if summary && pet}
	<Dialog title={summary.firstVisit ? `Welcome home` : 'While you were away...'} onclose={() => (summary = null)}>
		<div class="summary">
			{#if summary.firstVisit}
				<p>
					This is your room, and {pet.name}'s.
					{pet.stage === 'box'
						? `There's a box by the door, and something inside it is mewing. Tap it to say hello — the kitten comes out once ${partner ? "you've both" : 'you and your partner have'} visited.`
						: `Tap the floor to walk, tap ${pet.name} for scritches, and tap anything in the room to see what it does. Drag to look around.`}
				</p>
			{/if}
			{#each summary.gifts as g, i (i)}
				<div class="gift">
					<Pixel name={g.item} scale={3} />
					<div>
						<strong>{g.from} left you {g.item === 'letter' ? 'a letter' : g.item === 'star' ? 'a star lamp' : `a ${g.item}`}</strong>
						{#if g.message}<p class="message">"{g.message}"</p>{/if}
					</div>
				</div>
			{/each}
			{#if summary.items.length}
				<ul class="feed">
					{#each summary.items as item, i (i)}
						<li><Pixel name={item.icon} scale={2} /><span>{item.text}</span></li>
					{/each}
				</ul>
			{/if}
			<Button full variant="super" onclick={() => (summary = null)}>
				{summary.firstVisit ? "Let's go" : `Say hi to ${pet.name}`}
			</Button>
		</div>
	</Dialog>
{/if}

{#if gifting && pet}
	<LeaveSomething
		partnerName={partner?.name}
		petName={pet.name}
		leaving={gifting === 'leave'}
		busy={giftBusy}
		error={giftError}
		onsend={(item, message) => leave({ item, message })}
		onskip={() => leave()}
		onclose={() => (gifting = null)}
	/>
{/if}

{#if evolving && pet?.evolution && couple}
	<Evolution
		evolution={pet.evolution}
		coat={pet.coat as Coat}
		petName={pet.name}
		ondone={() => attempt(() => sawEvolution({ coupleId: couple._id, playerId: me.id }))}
	/>
{/if}

<style>
	.page {
		max-width: 1040px;
		margin: 0 auto;
		padding: 0.75rem 1rem 3rem;
	}

	.game {
		position: fixed;
		inset: 0;
		overflow: hidden;
		background:
			radial-gradient(ellipse at 50% 55%, #f7efe4 0%, #e3d5c6 55%, #c9b8a8 100%);
	}

	.game.dusk {
		background: radial-gradient(ellipse at 50% 55%, #f3d9c9 0%, #cfa9a0 60%, #8f7486 100%);
	}

	.game.night {
		background: radial-gradient(ellipse at 50% 55%, #3a3558 0%, #232039 60%, #15132a 100%);
	}

	.hud {
		position: absolute;
		z-index: 10;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		pointer-events: none;
	}

	.hud > :global(*) {
		pointer-events: auto;
	}

	.top-left {
		left: max(0.6rem, env(safe-area-inset-left));
		top: max(0.6rem, env(safe-area-inset-top));
	}

	.top-right {
		right: max(0.6rem, env(safe-area-inset-right));
		top: max(0.6rem, env(safe-area-inset-top));
		justify-content: flex-end;
	}

	.hud-btn,
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		border: 0;
		background: var(--canopy);
		color: var(--dew);
		text-decoration: none;
		cursor: pointer;
		box-shadow:
			0 0 0 2px var(--gap),
			0 0 0 4px var(--vine),
			0 4px 0 4px var(--hard);
	}

	.hud-btn {
		position: relative;
		justify-content: center;
		width: 2.6rem;
		height: 2.6rem;
		color: var(--sage);
	}

	.hud-btn.ping::after {
		content: '!';
		position: absolute;
		right: -6px;
		top: -8px;
		display: grid;
		place-items: center;
		width: 1.1rem;
		height: 1.1rem;
		background: var(--pink-fill);
		color: #fff;
		font-size: 0.9rem;
		box-shadow: 0 0 0 2px var(--night);
		animation: px-blink 1.2s steps(2, end) infinite;
	}

	.chip {
		height: 2.6rem;
		padding: 0 0.6rem 0 0.4rem;
		max-width: 46vw;
	}

	.face {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		overflow: hidden;
	}

	.who {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		min-width: 0;
		line-height: 1;
	}

	.who strong {
		font-size: 1.15rem;
		font-weight: 400;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 8rem;
	}

	.who small {
		color: var(--sage);
		font-size: 0.85rem;
		white-space: nowrap;
	}

	.bars {
		display: flex;
		gap: 3px;
		height: 1.6rem;
		margin-left: 0.15rem;
	}

	.bar {
		position: relative;
		width: 5px;
		height: 100%;
		background: var(--well);
		box-shadow: 0 0 0 1px var(--hairline);
	}

	.bar span {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		transition: height 0.4s var(--snap);
	}

	.partner-chip {
		position: relative;
	}

	.dot {
		position: absolute;
		left: 1.6rem;
		top: 0.3rem;
		width: 8px;
		height: 8px;
		background: var(--bog);
		box-shadow: 0 0 0 2px var(--canopy);
	}

	.dot.online {
		background: var(--mint-fill);
		animation: px-blink 2s steps(2, end) infinite;
	}

	.notes {
		position: absolute;
		z-index: 9;
		left: 50%;
		top: 4rem;
		translate: -50% 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		pointer-events: none;
		width: min(92vw, 28rem);
	}

	.note {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		margin: 0;
		padding: 0.3rem 0.75rem 0.2rem;
		background: color-mix(in srgb, var(--canopy) 92%, transparent);
		color: var(--dew);
		font-size: 1.05rem;
		line-height: 1.1;
		box-shadow:
			0 0 0 2px var(--gap),
			0 0 0 4px var(--vine);
		animation: drop 0.3s var(--ease-spring);
	}

	.note.toast {
		box-shadow:
			0 0 0 2px var(--gap),
			0 0 0 4px var(--pink);
	}

	.bottom {
		left: 50%;
		bottom: max(0.75rem, env(safe-area-inset-bottom));
		translate: -50% 0;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		width: min(96vw, 40rem);
	}

	.dock {
		display: flex;
		align-items: stretch;
		gap: 0.35rem;
		padding: 0.4rem;
		background: color-mix(in srgb, var(--canopy) 94%, transparent);
		box-shadow:
			0 0 0 2px var(--gap),
			0 0 0 4px var(--vine),
			0 6px 0 4px var(--hard);
	}

	.sep {
		width: 2px;
		margin: 0.2rem 0.15rem;
		background: var(--vine);
	}

	.act {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.2rem;
		min-width: 3.3rem;
		padding: 0.4rem 0.3rem 0.25rem;
		border: 0;
		background: var(--moss);
		color: var(--dew);
		font-size: 0.95rem;
		line-height: 1;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		cursor: pointer;
		touch-action: manipulation;
		box-shadow: 0 0 0 2px var(--vine);
		transition: transform 0.1s var(--snap);
	}

	.act:active:not(:disabled) {
		transform: translateY(2px);
	}

	.act.on {
		background: var(--amber-light);
		box-shadow: 0 0 0 2px var(--amber);
	}

	.act.wide {
		flex-direction: row;
		gap: 0.6rem;
		padding: 0.45rem 1.1rem;
		font-size: 1.15rem;
		background: var(--pink-light);
		box-shadow: 0 0 0 2px var(--pink);
		animation: px-blink 2.4s steps(2, end) infinite;
	}

	.talk-btn {
		color: var(--mint);
	}

	.act:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.tray {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.6rem;
		background: color-mix(in srgb, var(--canopy) 96%, transparent);
		box-shadow:
			0 0 0 2px var(--gap),
			0 0 0 4px var(--amber),
			0 6px 0 4px var(--hard);
		animation: rise 0.2s var(--ease-spring);
	}

	.tray.talk {
		flex-direction: column;
		align-items: stretch;
		width: 100%;
		box-shadow:
			0 0 0 2px var(--gap),
			0 0 0 4px var(--mint),
			0 6px 0 4px var(--hard);
	}

	.emotes {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.4rem;
	}

	.tray-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3rem;
		min-width: 4.2rem;
		padding: 0.45rem 0.5rem 0.3rem;
		border: 0;
		background: var(--moss);
		color: var(--dew);
		font-size: 1rem;
		line-height: 1;
		cursor: pointer;
		box-shadow: 0 0 0 2px var(--vine);
	}

	.tray-item.small {
		min-width: 3.4rem;
		font-size: 0.85rem;
	}

	.say {
		display: flex;
		gap: 0.5rem;
	}

	.say input {
		flex: 1;
		min-width: 0;
	}

	.partner {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.partner p {
		margin: 0;
		font-size: 1.15rem;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.invite {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0.75rem;
		background: var(--soil);
	}

	.invite strong {
		flex: 1;
		font-weight: 400;
		font-size: 1.4rem;
	}

	.feed {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}

	.feed li {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		font-size: 1.05rem;
		line-height: 1.1;
	}

	.summary {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.summary > p {
		margin: 0;
		font-size: 1.15rem;
		line-height: 1.2;
	}

	.gift {
		display: flex;
		gap: 0.75rem;
		align-items: flex-start;
		padding: 0.75rem;
		background: var(--pink-light);
		box-shadow: 0 0 0 2px var(--pink);
		animation: drop 0.4s var(--ease-spring);
	}

	.gift strong {
		font-size: 1.15rem;
	}

	.message {
		margin: 0.3rem 0 0;
		font-size: 1.3rem;
		color: var(--pink-shade);
	}

	.center {
		text-align: center;
		align-items: center;
	}

	:global(.card.narrow) {
		max-width: 440px;
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
	}

	.big {
		display: inline-flex;
		align-self: center;
		font-size: 3.2rem;
		color: var(--pink);
	}

	.mono {
		letter-spacing: 0.2em;
		color: var(--dew);
	}

	@keyframes drop {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
	}

	@media (max-width: 560px) {
		.act {
			min-width: 2.7rem;
			font-size: 0.8rem;
			padding: 0.35rem 0.15rem 0.2rem;
		}

		.chip .who,
		.sound-btn {
			display: none;
		}

		.hud {
			gap: 0.45rem;
		}
	}
</style>
