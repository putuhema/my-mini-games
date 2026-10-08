<script lang="ts">
	import {
		motionAt,
		needsAt,
		OBJECTS,
		OFFLINE_AFTER_MS,
		ROOM,
		SCENE_H,
		SCENE_W,
		toFloor,
		toScreen,
		type Coat,
		type Point,
		type Shirt
	} from '../../../convex/creature/world';
	import {
		CAT_H,
		CAT_W,
		cat,
		character,
		closedBox,
		cupPlaced,
		fairyLights,
		furniture,
		icon,
		openBox,
		roomBackground,
		SHIRT_COLOR,
		skyNow,
		type Placed
	} from './art';
	import { hits, type Img } from './pixels';
	import {
		activityAt,
		bubbleUp,
		catFlip,
		catLookFor,
		facingOf,
		liftAt,
		poseAt,
		speaking,
		type Couple,
		type Motion,
		type PetView,
		type PresenceRow
	} from './room';

	let {
		couple,
		pet,
		presence,
		meId,
		myMotion,
		now,
		aiming = null,
		onfloor,
		onthing
	}: {
		couple: Couple;
		pet: PetView;
		presence: PresenceRow[];
		meId: string;
		/** My own walk, predicted locally so it feels instant. */
		myMotion: Motion;
		/** Server time, updated every frame. */
		now: number;
		/** Pointing a toy: the next tap throws the ball or shines the laser there. */
		aiming?: 'ball' | 'laser' | null;
		onfloor: (p: Point) => void;
		/** Furniture (object key), a gift ("decor:key"), the cat ("pet"), "partner", "me" or "cup". */
		onthing: (key: string, at: Point) => void;
	} = $props();

	// ---- Camera: fit the room, but never let it get too small to see; follow me around ----
	let vw = $state(0);
	let vh = $state(0);
	const scale = $derived.by(() => {
		if (!vw || !vh) return 2;
		const fit = Math.min(vw / SCENE_W, (vh * 0.94) / SCENE_H);
		return Math.max(fit, Math.min(2, (vh * 0.72) / SCENE_H));
	});
	let pan = $state({ x: 0, y: 0 });
	$effect(() => {
		// Walking somewhere new brings the camera back to me.
		void myMotion.at;
		pan = { x: 0, y: 0 };
	});

	let sky = $state(skyNow());
	$effect(() => {
		const id = setInterval(() => (sky = skyNow()), 60_000);
		return () => clearInterval(id);
	});
	const dark = $derived(sky === 'night' || couple.lightsOff);

	const background = roomBackground();
	const lights = fairyLights();
	const fishFrame = $derived(Math.floor(now / 700) % 2);
	const pieces = $derived(
		furniture({ sky, lightsOff: !!couple.lightsOff, radioOn: !!couple.radioOn, frame: fishFrame })
	);

	type Drawable = Placed & { flip?: boolean; glow?: boolean; label?: string; id: string };

	const LABEL: Record<string, string> = Object.fromEntries(Object.entries(OBJECTS).map(([k, o]) => [k, o.label]));

	// ---- People ----
	const people = $derived(
		couple.players.flatMap((p) => {
			const isMe = p.id === meId;
			const row = presence.find((r) => r.playerId === p.id);
			const online = isMe || (!!row && row.online && now - row.lastSeen < OFFLINE_AFTER_MS);
			if (!online) return [];
			const m = isMe ? myMotion : row!.motion;
			const pos = motionAt(m, now);
			const frame = pos.moving ? 1 + (Math.floor(now / 150) % 2) : 0;
			const s = toScreen(pos.x, pos.y);
			const img = character(p, facingOf(m, now), frame);
			return [
				{
					...p,
					isMe,
					pos,
					sx: s.x,
					sy: s.y,
					img,
					emote: row && bubbleUp(row.emote, now) ? row.emote!.kind : null,
					chat: row && bubbleUp(row.chat, now) ? row.chat!.text : null
				}
			];
		})
	);

	// ---- The cat ----
	const petPos = $derived(motionAt(pet.motion, now));
	const pose = $derived(poseAt(pet, now));
	const act = $derived(activityAt(pet, now));
	const dirty = $derived(pet.stage !== 'box' && needsAt(pet, now).cleanliness < 35);
	const look = $derived(catLookFor(pose, now, dirty));
	const lift = $derived(liftAt(pet.motion, now));
	const petImg = $derived(cat(pet.coat as Coat, pet.stage, pet.evolution, look));
	const petScreen = $derived(toScreen(petPos.x, petPos.y, lift.z));
	const petFlip = $derived(catFlip(pet.motion, now, !!look.spin));
	const said = $derived(pet.stage === 'box' ? (pose === 'wiggle' ? speaking(pet, now) : null) : speaking(pet, now));
	/** Top of the cat's head, roughly, in scene pixels. */
	const petHead = $derived({ x: petScreen.x, y: petScreen.y - (pet.stage === 'kitten' ? 15 : pet.stage === 'adult' ? 22 : 19) + look.hop });

	// ---- Toys in play ----
	const toy = $derived.by(() => {
		const t = pet.toy;
		if (!t) return null;
		if (t.kind === 'laser') {
			if (now > t.pickup + 1_500) return null;
			return { kind: 'laser', x: t.x, y: t.y, z: 0 };
		}
		if (t.kind === 'feather') {
			if (!act || act.kind !== 'pounce' || act.start !== t.pickup) return now < t.pickup ? featherAt(t) : null;
			return featherAt(t);
		}
		if (now < t.pickup) {
			const k = Math.min(1, (now - t.at) / 450);
			return { kind: 'ball', x: t.x, y: t.y, z: Math.round((1 - k) * 22 + Math.sin(k * Math.PI) * 8) };
		}
		if (act?.kind === 'pounce' && act.start === t.pickup)
			return { kind: 'ball', x: petPos.x + (petFlip ? -4 : 4), y: petPos.y + 1, z: 2 };
		return null;
	});
	function featherAt(t: { x: number; y: number }) {
		const owner = people.find((p) => p.id === pet.activity?.by) ?? people.find((p) => p.isMe);
		const at = owner?.pos ?? t;
		return { kind: 'feather', x: at.x + 6, y: at.y + 2, z: 12 + Math.round(Math.sin(now / 120) * 3) };
	}

	const cupDown = $derived(!!couple.cupDown && !(act?.kind === 'knock' && now < act.start + 900));

	const drawables = $derived.by(() => {
		const list: Drawable[] = [...lights, ...pieces].map((f) => ({ ...f, id: f.key, label: f.hit ? LABEL[f.hit] : undefined }));
		if (pet.stage === 'box') {
			const wiggle = pose === 'wiggle' ? [0, -1, 0, 1][Math.floor(now / 80) % 4] : 0;
			list.push({ ...closedBox(pet.coat as Coat, Math.min(2, pet.greetedBy.length), wiggle), id: 'box', label: 'Say hello' });
		} else {
			for (const b of openBox()) list.push({ ...b, id: b.key, label: LABEL.box });
		}
		list.push({ ...cupPlaced(cupDown), id: 'cup', label: cupDown ? 'Pick up the cup' : undefined });

		for (const d of couple.decor) {
			const img = icon(d.item);
			const s = toScreen(d.x, d.y);
			list.push({
				key: d.key,
				id: `decor-${d.key}`,
				img,
				x: Math.round(s.x - img.w / 2),
				y: Math.round(s.y - img.h + 2),
				depth: d.x + d.y,
				hit: `decor:${d.key}`,
				label: d.stolen ? `Take back the ${d.item}` : d.item,
				glow: d.item === 'star' && dark
			});
		}

		const shadow = icon('shadow');
		for (const p of people) {
			list.push({ key: 'shadow', id: `sh-${p.id}`, img: shadow, x: Math.round(p.sx - shadow.w / 2), y: Math.round(p.sy - 2), depth: p.pos.x + p.pos.y - 0.1 });
			list.push({
				key: p.id,
				id: `p-${p.id}`,
				img: p.img,
				x: Math.round(p.sx - p.img.w / 2),
				y: Math.round(p.sy - p.img.h + 1),
				depth: p.pos.x + p.pos.y,
				hit: p.isMe ? 'me' : 'partner',
				label: p.isMe ? undefined : p.name
			});
		}

		if (pet.stage !== 'box') {
			const depth = lift.depth ?? petPos.x + petPos.y;
			if (lift.z < 1)
				list.push({ key: 'shadow', id: 'sh-pet', img: shadow, x: Math.round(petScreen.x - shadow.w / 2), y: Math.round(petScreen.y - 2), depth: depth - 0.1 });
			list.push({
				key: 'pet',
				id: 'pet',
				img: petImg,
				x: Math.round(petScreen.x - CAT_W / 2 - petImg.off),
				y: Math.round(petScreen.y - (CAT_H - 1) - petImg.off + look.hop),
				depth: depth + 0.05,
				flip: petFlip,
				hit: 'pet',
				label: pet.name
			});
		}

		if (toy) {
			const img = icon(toy.kind === 'laser' ? 'dot' : toy.kind);
			const s = toScreen(toy.x, toy.y, toy.z);
			list.push({
				key: 'toy',
				id: 'toy',
				img,
				x: Math.round(s.x - img.w / 2),
				y: Math.round(s.y - img.h + (toy.kind === 'laser' ? 2 : 1)),
				depth: toy.kind === 'laser' ? toy.x + toy.y - 0.5 : toy.x + toy.y + 0.2,
				glow: toy.kind === 'laser'
			});
		}
		return list.sort((a, b) => a.depth - b.depth);
	});

	// ---- Particles, keyed to the activity so they replay each time ----
	const particles = $derived.by(() => {
		const key = `${pose}-${pet.activity?.start ?? 0}`;
		if (pose === 'pet' || pose === 'eat' || pose === 'bonk' || pose === 'knead') return { kind: 'heart', key };
		if (pose === 'brush' || pose === 'bath') return { kind: 'bubble', key };
		if (pose === 'excited' || pose === 'happy') return { kind: 'sparkle', key };
		if (pose === 'vibe') return { kind: 'note', key: 'vibe' };
		if (pose === 'sleep') return { kind: 'z', key: 'sleep' };
		return null;
	});

	// ---- Camera ----
	const focus = $derived.by(() => {
		const me = people.find((p) => p.isMe);
		return me ? { x: me.sx, y: me.sy - 20 } : { x: petScreen.x, y: petScreen.y };
	});
	function axis(size: number, view: number, target: number, offset: number) {
		const full = size * scale;
		if (full <= view) return (view - full) / 2;
		return Math.min(0, Math.max(view - full, view / 2 - target * scale + offset));
	}
	const camX = $derived(axis(SCENE_W, vw, focus.x, pan.x));
	const camY = $derived(axis(SCENE_H, vh, focus.y, pan.y));

	// ---- Input: tap to walk or use things, drag to look around ----
	let viewport: HTMLDivElement;
	let press: { x: number; y: number; pan: { x: number; y: number }; dragging: boolean } | null = null;
	let hovered = $state<string | null>(null);
	let hoverAt = $state({ x: 0, y: 0 });

	function sceneAt(e: PointerEvent): Point {
		const r = viewport.getBoundingClientRect();
		return { x: (e.clientX - r.left - camX) / scale, y: (e.clientY - r.top - camY) / scale };
	}

	function pick(s: Point): Drawable | null {
		for (let i = drawables.length - 1; i >= 0; i--) {
			const d = drawables[i];
			if (!d.hit) continue;
			let lx = s.x - d.x;
			const ly = s.y - d.y;
			if (d.flip) lx = d.img.w - 1 - lx;
			if (hits(d.img, lx, ly)) return d;
		}
		return null;
	}

	function down(e: PointerEvent) {
		press = { x: e.clientX, y: e.clientY, pan: { ...pan }, dragging: false };
	}

	function move(e: PointerEvent) {
		if (press) {
			const dx = e.clientX - press.x;
			const dy = e.clientY - press.y;
			if (!press.dragging && Math.hypot(dx, dy) > 8) {
				press.dragging = true;
				viewport.setPointerCapture(e.pointerId);
			}
			if (press.dragging) pan = { x: press.pan.x + dx, y: press.pan.y + dy };
			return;
		}
		if (e.pointerType !== 'mouse') return;
		const d = pick(sceneAt(e));
		hovered = d?.hit ?? null;
		const r = viewport.getBoundingClientRect();
		hoverAt = { x: e.clientX - r.left, y: e.clientY - r.top };
	}

	function up(e: PointerEvent) {
		const was = press;
		press = null;
		if (!was || was.dragging) return;
		const s = sceneAt(e);
		const f = toFloor(s.x, s.y);
		const onFloor = f.x >= 0 && f.y >= 0 && f.x <= ROOM && f.y <= ROOM;
		if (aiming) {
			if (onFloor) onfloor(f);
			return;
		}
		const d = pick(s);
		if (d?.hit) onthing(d.hit, f);
		else if (onFloor) onfloor(f);
	}

	const hoverLabel = $derived.by(() => {
		if (!hovered || aiming) return null;
		return drawables.find((d) => d.hit === hovered && d.label)?.label ?? null;
	});

	// Screen position of a scene point, for the crisp text overlay.
	const screen = (x: number, y: number) => ({ left: `${x * scale + camX}px`, top: `${y * scale + camY}px` });
	const tagColor = (shirt: string) => SHIRT_COLOR[shirt as Shirt]?.[1] ?? '#3b2730';
	const EMOTE_ICON: Record<string, string> = { wave: 'hand', heart: 'heart', laugh: 'laugh', hug: 'hug', cry: 'cry', sleepy: 'z', wow: 'wow' };

	const lampAt = toScreen(106, 8, 30);
	const windowAt = toScreen(48, 0, 46);
	const radioAt = toScreen(9, 33, 26);
	const imgStyle = (d: { img: Img; x: number; y: number }) =>
		`left: ${d.x}px; top: ${d.y}px; width: ${d.img.w}px; height: ${d.img.h}px`;
</script>

<div
	class="viewport"
	class:aiming
	class:pointer={!!hovered}
	bind:this={viewport}
	bind:clientWidth={vw}
	bind:clientHeight={vh}
	onpointerdown={down}
	onpointermove={move}
	onpointerup={up}
	onpointercancel={() => (press = null)}
	onpointerleave={() => (hovered = null)}
	role="application"
	aria-label="The room. Tap the floor to walk, tap things to use them."
>
	<div
		class="scene"
		style="width: {SCENE_W}px; height: {SCENE_H}px; transform: translate({camX}px, {camY}px) scale({scale})"
	>
		<img class="bg" src={background.url} alt="" width={SCENE_W} height={SCENE_H} draggable="false" />

		{#each drawables as d (d.id)}
			<img
				class="d"
				class:flip={d.flip}
				class:glow={d.glow}
				class:lit={dark && d.id.startsWith('lights')}
				class:hover={!!d.hit && d.hit === hovered && d.hit !== 'me'}
				src={d.img.url}
				alt=""
				style={imgStyle(d)}
				draggable="false"
			/>
		{/each}

		{#if particles}
			{#key particles.key}
				<div class="fx {particles.kind}" style="left: {petHead.x}px; top: {petHead.y}px" aria-hidden="true">
					{#each [0, 1, 2] as i (i)}
						{@const img = icon(particles.kind)}
						<img src={img.url} alt="" style="--i: {i}" width={img.w} height={img.h} />
					{/each}
				</div>
			{/key}
		{/if}
		{#if couple.radioOn}
			<div class="fx note radio" style="left: {radioAt.x}px; top: {radioAt.y}px" aria-hidden="true">
				{#each [0, 1, 2] as i (i)}
					{@const img = icon('note')}
					<img src={img.url} alt="" style="--i: {i}" width={img.w} height={img.h} />
				{/each}
			</div>
		{/if}

		<!-- Light: dusk and night from each of your own clocks, and the shared light switch. -->
		{#if sky !== 'day' || couple.lightsOff}
			<div class="shade" class:night={sky === 'night'} class:off={couple.lightsOff} class:dusk={sky === 'dusk'} aria-hidden="true"></div>
			<div
				class="glow-layer"
				aria-hidden="true"
				style="--lx: {lampAt.x}px; --ly: {lampAt.y}px; --wx: {windowAt.x}px; --wy: {windowAt.y}px"
				class:off={couple.lightsOff}
				class:moon={sky === 'night'}
			></div>
		{/if}
	</div>

	<!-- Text sits outside the scaled scene so it stays crisp. -->
	<div class="labels" aria-hidden="true">
		{#each people as p (p.id)}
			{@const at = screen(p.sx, p.sy - p.img.h - 1)}
			<span class="tag" style="left: {at.left}; top: {at.top}; --c: {tagColor(p.shirt)}">{p.isMe ? 'You' : p.name}</span>
			{#if p.chat}
				{@const c = screen(p.sx, p.sy - p.img.h - 8)}
				<p class="bubble chat" style="left: {c.left}; top: {c.top}">{p.chat}</p>
			{:else if p.emote}
				{@const c = screen(p.sx, p.sy - p.img.h - 8)}
				{@const img = icon(EMOTE_ICON[p.emote] ?? 'heart')}
				<span class="emote" style="left: {c.left}; top: {c.top}">
					<img src={img.url} alt="" width={img.w * Math.max(2, Math.round(scale))} height={img.h * Math.max(2, Math.round(scale))} />
				</span>
			{/if}
		{/each}
		{#if said}
			{@const at = screen(petHead.x, petHead.y - 3)}
			<p class="bubble" style="left: {at.left}; top: {at.top}" aria-live="polite">{said}</p>
		{/if}
		{#if hoverLabel}
			<span class="hover-label" style="left: {hoverAt.x}px; top: {hoverAt.y}px">{hoverLabel}</span>
		{/if}
	</div>
	{#if aiming}
		<p class="hint">Tap the floor to {aiming === 'ball' ? 'throw the ball' : 'point the laser'}</p>
	{/if}
</div>

<style>
	.viewport {
		position: absolute;
		inset: 0;
		overflow: hidden;
		cursor: default;
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
	}

	.viewport.pointer {
		cursor: pointer;
	}

	.viewport.aiming {
		cursor: crosshair;
	}

	.scene {
		position: absolute;
		left: 0;
		top: 0;
		transform-origin: 0 0;
	}

	.scene img {
		display: block;
		image-rendering: pixelated;
		-webkit-user-drag: none;
		pointer-events: none;
	}

	.bg {
		position: absolute;
		inset: 0;
	}

	.d {
		position: absolute;
	}

	.d.hover {
		filter: brightness(1.12) drop-shadow(0 0 1px #fff) drop-shadow(0 0 1px #fff);
	}

	.d.glow {
		filter: drop-shadow(0 0 3px #ffd166);
	}

	.d.lit {
		filter: drop-shadow(0 0 2px #ffe9a8) brightness(1.4);
		z-index: 4;
	}

	.flip {
		transform: scaleX(-1);
	}

	.fx {
		position: absolute;
		pointer-events: none;
		z-index: 2;
	}

	.fx img {
		position: absolute;
		left: calc(-6px + var(--i) * 5px);
		top: 0;
		opacity: 0;
		animation: rise 1.6s steps(8, end) calc(var(--i) * 0.35s) forwards;
	}

	.fx.z img,
	.fx.note img {
		animation-iteration-count: infinite;
		animation-duration: 2.4s;
		animation-delay: calc(var(--i) * 0.8s);
	}

	.fx.bubble img {
		animation-iteration-count: 2;
	}

	@keyframes rise {
		0% {
			opacity: 0;
			transform: translate(0, 0);
		}
		15% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: translate(calc((var(--i) - 1) * 3px), -16px);
		}
	}

	.shade {
		position: absolute;
		inset: -40px;
		pointer-events: none;
		z-index: 3;
		mix-blend-mode: multiply;
		background: #ffe2d011;
	}

	.shade.dusk {
		background: #ffb08a40;
	}

	.shade.night {
		background: #3a3f8a66;
	}

	.shade.off {
		background: #4a4a6a55;
	}

	.shade.night.off {
		background: #141a4ad9;
	}

	.glow-layer {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 3;
		mix-blend-mode: screen;
		background: radial-gradient(70px 55px at var(--lx) var(--ly), #ffcf7a40, transparent 70%);
	}

	.glow-layer.off {
		background: none;
	}

	.glow-layer.off.moon {
		background: radial-gradient(60px 70px at var(--wx) calc(var(--wy) + 30px), #8fb0ff30, transparent 75%);
	}

	.labels {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.tag {
		position: absolute;
		translate: -50% -100%;
		padding: 0 0.3rem;
		background: var(--c);
		color: #fff;
		font-size: 0.8rem;
		line-height: 1.1;
		white-space: nowrap;
		box-shadow: 0 0 0 1px #3b2730;
	}

	.emote {
		position: absolute;
		translate: -50% -100%;
		animation: pop 0.3s var(--ease-spring);
	}

	.emote img {
		display: block;
		image-rendering: pixelated;
		filter: drop-shadow(0 2px 0 #3b273066);
		animation: bob 0.8s steps(2, end) infinite;
	}

	@keyframes bob {
		50% {
			transform: translateY(-3px);
		}
	}

	.bubble {
		position: absolute;
		z-index: 4;
		translate: -50% -100%;
		margin: 0;
		max-width: min(16rem, 70vw);
		width: max-content;
		padding: 0.2rem 0.5rem 0.15rem;
		background: #fffaf0;
		color: #3b2730;
		font-size: 1rem;
		line-height: 1.1;
		text-align: center;
		pointer-events: none;
		box-shadow:
			0 0 0 2px #3b2730,
			3px 3px 0 2px #3b273055;
		animation: pop 0.25s steps(3, end);
	}

	.bubble.chat {
		background: #f3fcfd;
		color: #102224;
	}

	.bubble::after {
		content: '';
		position: absolute;
		left: 50%;
		bottom: -6px;
		width: 6px;
		height: 6px;
		translate: -50% 0;
		background: inherit;
		box-shadow: 2px 2px 0 0 #3b2730;
	}

	@keyframes pop {
		from {
			transform: scale(0.4);
		}
	}

	.hover-label {
		position: absolute;
		translate: 12px 12px;
		padding: 0.05rem 0.45rem;
		background: #3b2730;
		color: #fff;
		font-size: 0.95rem;
		white-space: nowrap;
	}

	.hint {
		position: absolute;
		left: 50%;
		top: 4.5rem;
		translate: -50% 0;
		margin: 0;
		padding: 0.2rem 0.75rem;
		background: #3b2730;
		color: #fff;
		font-size: 1.1rem;
		pointer-events: none;
		animation: px-blink 1.4s steps(2, end) infinite;
	}
</style>
