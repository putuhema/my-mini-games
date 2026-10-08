// Our Little Creature: a couple's shared room and the cat that lives in it. The server owns
// the cat (needs, growth, where it walks, what it says), where each player stands, their emotes
// and chat bubbles, the light switch and radio, gifts, memories and daily events. While anyone
// is in the room a scheduled loop gives the cat a life of its own; when everyone leaves it
// stops, and needs are worked out lazily from timestamps on the next visit.

import { ConvexError, v } from 'convex/values';
import { internal } from './_generated/api';
import { internalMutation, mutation, query, type MutationCtx } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { CODE_CHARS, cleanName } from './rooms';
import { dayKey, event, EVENTS, fill } from './creature/events';
import { foodLine, idleLine, LINES, pick } from './creature/lines';
import {
	addNeeds,
	chooseEvolution,
	COATS,
	COME_OUT_AFTER,
	DAY,
	dayOf,
	DECOR_SLOTS,
	EMOTES,
	EVOLUTION_LABEL,
	FOODS,
	freeSpot,
	GIFTS,
	HAIRS,
	has,
	HOUR,
	HUG_RANGE,
	isCoat,
	isFood,
	isGift,
	isObject,
	isPlay,
	MAX_CHAT,
	MAX_DECOR,
	MAX_MESSAGE,
	motionAt,
	needsAt,
	OBJECTS,
	OFFLINE_AFTER_MS,
	PET_RUN_SPEED,
	PET_SPEED,
	PLAYER_SPEED,
	type Point,
	route,
	SEATS,
	SHIRTS,
	sleepLength,
	SPAWN,
	stageFor,
	topTraits,
	TOYS,
	TRAIT_WORD,
	type Decor,
	type Food,
	type Trait,
	walkTo,
	walkVia
} from './creature/world';

type Couple = Doc<'creatureCouples'>;
type Pet = Doc<'creatures'>;
type Presence = Doc<'creaturePresence'>;

const TICK_MIN = 3_500;
const TICK_JITTER = 2_500;
const TALK_GAP = 16_000;

// ---- Loading and saving ----

async function loadCouple(ctx: MutationCtx, coupleId: Id<'creatureCouples'>) {
	const couple = await ctx.db.get(coupleId);
	if (!couple) throw new ConvexError('Room not found');
	return couple;
}

function requirePlayer(couple: Couple, playerId: string) {
	const player = couple.players.find((p) => p.id === playerId);
	if (!player) throw new ConvexError('Not in this room');
	return player;
}

async function loadPet(ctx: MutationCtx, coupleId: Id<'creatureCouples'>) {
	const pet = await ctx.db
		.query('creatures')
		.withIndex('by_coupleId', (q) => q.eq('coupleId', coupleId))
		.unique();
	if (!pet) throw new ConvexError('No cat here');
	return pet;
}

/** Handlers edit the cat in place, then save it once. */
async function savePet(ctx: MutationCtx, pet: Pet) {
	const { _id, _creationTime, ...rest } = pet;
	await ctx.db.replace(_id, rest);
}

async function presenceRows(ctx: MutationCtx, coupleId: Id<'creatureCouples'>) {
	return await ctx.db
		.query('creaturePresence')
		.withIndex('by_coupleId_and_playerId', (q) => q.eq('coupleId', coupleId))
		.take(4);
}

const isOnline = (row: Presence | undefined, t: number) => !!row && row.online && t - row.lastSeen < OFFLINE_AFTER_MS;

const nameOf = (couple: Couple, id: string | undefined) => couple.players.find((p) => p.id === id)?.name ?? 'Someone';
const partnerOf = (couple: Couple, id: string) => couple.players.find((p) => p.id !== id);

async function log(ctx: MutationCtx, coupleId: Id<'creatureCouples'>, icon: string, text: string, playerId?: string) {
	await ctx.db.insert('creatureLog', { coupleId, playerId, icon, text });
}

/** Writes to the memory book. With a key, only the first time it happens. */
async function remember(ctx: MutationCtx, couple: Couple, pet: Pet, icon: string, text: string, key?: string) {
	if (key) {
		if (pet.firsts.includes(key)) return false;
		pet.firsts = [...pet.firsts, key];
	}
	await ctx.db.insert('creatureMemories', {
		coupleId: couple._id,
		day: dayOf(couple.startedAt, Date.now()),
		icon,
		text
	});
	return true;
}

// ---- Small cat helpers ----

const petAt = (pet: Pet, t: number) => motionAt(pet.motion, t);
const asleep = (pet: Pet, t: number) => !!pet.sleep && t < pet.sleep.until;
const busy = (pet: Pet, t: number) => petAt(pet, t).moving || (!!pet.activity && t < pet.activity.until);
const awake = (pet: Pet, t: number) => pet.stage !== 'box' && !asleep(pet, t);

function say(pet: Pet, text: string, at = Date.now()) {
	pet.say = { text, at };
	pet.lastSaidAt = at;
}

function addTraits(pet: Pet, traits: Partial<Record<Trait, number>>) {
	const next = { ...pet.traits };
	for (const [k, n] of Object.entries(traits)) next[k] = (next[k] ?? 0) + (n ?? 0);
	pet.traits = next;
}

/** Walks the cat somewhere (around the furniture); returns when it gets there. */
function goTo(pet: Pet, to: Point, t: number, speed = PET_SPEED) {
	pet.motion = walkTo(petAt(pet, t), to, t, speed);
	return t + pet.motion.dur;
}

/** Runs through several spots in a row: zoomies. */
function dash(pet: Pet, stops: Point[], t: number) {
	let here: Point = petAt(pet, t);
	const path: Point[] = [];
	for (const stop of stops) {
		const legs = route(here, freeSpot(stop));
		path.push(...legs);
		here = legs[legs.length - 1];
	}
	pet.motion = walkVia(petAt(pet, t), path, t, PET_RUN_SPEED);
	return t + pet.motion.dur;
}

function act(pet: Pet, kind: string, start: number, ms: number, by?: string) {
	pet.activity = { kind, start, until: start + ms, ...(by ? { by } : {}) };
}

function stop(pet: Pet, t: number) {
	const p = petAt(pet, t);
	pet.motion = { fx: p.x, fy: p.y, tx: p.x, ty: p.y, at: t, dur: 0 };
}

const near = (p: Point, dx = 0, dy = 0) => ({ x: p.x + dx, y: p.y + dy });
const randomSpot = () => freeSpot({ x: 20 + Math.random() * 120, y: 20 + Math.random() * 120 });

/** Bring the stored needs up to now and end a finished nap. */
function settle(pet: Pet, t: number) {
	pet.needs = needsAt(pet, t);
	pet.needsAt = t;
	if (pet.sleep && pet.sleep.until <= t) pet.sleep = undefined;
}

async function comeOut(ctx: MutationCtx, couple: Couple, pet: Pet, t: number) {
	pet.stage = 'kitten';
	pet.outAt = t;
	pet.motion = walkTo(SEATS.box, { x: 82, y: 122 }, t + 600, PET_SPEED);
	act(pet, 'excited', t + 600 + pet.motion.dur, 3_000);
	say(pet, pick(LINES.comeOut), t + 300);
	await remember(ctx, couple, pet, 'paw', 'You came out of the box!', 'out');
	await log(ctx, couple._id, 'paw', `${pet.name} came out of the box!`);
}

/** Growth, evolution and today's event: things that happen with the calendar. */
async function catchUp(ctx: MutationCtx, couple: Couple, pet: Pet, t: number) {
	if (pet.stage === 'box') {
		const everyone = couple.players.length === 2 && couple.players.every((p) => pet.greetedBy.includes(p.id));
		if (everyone || t - couple.startedAt >= COME_OUT_AFTER) await comeOut(ctx, couple, pet, t);
		return;
	}
	const stage = stageFor(dayOf(couple.startedAt, t), true);
	if (stage !== pet.stage) {
		pet.stage = stage;
		if (stage === 'young') await remember(ctx, couple, pet, 'sprout', "You're growing up so fast.", 'stage:young');
		if (stage === 'teen') {
			const words = topTraits(pet.traits).map((k) => TRAIT_WORD[k]);
			const text = words.length
				? `Your personality is showing: ${words.join(' and ')}.`
				: 'Your personality is starting to show.';
			await remember(ctx, couple, pet, 'sparkle', text, 'stage:teen');
		}
		if (stage === 'adult' && !pet.evolution) {
			pet.evolution = chooseEvolution(pet.traits);
			pet.evolutionSeen = [];
			const kind = EVOLUTION_LABEL[pet.evolution];
			await remember(ctx, couple, pet, 'star', `You grew into a ${kind}!`, 'evolved');
			await log(ctx, couple._id, 'star', `${pet.name} grew into a ${kind}!`);
		}
	}
	await ensureEvent(ctx, couple, pet, t);
}

/** Marks that someone cared for the cat; notices when both partners do it close together. */
async function cared(ctx: MutationCtx, couple: Couple, pet: Pet, playerId: string, t: number, sayAt: number) {
	const last = pet.lastCare;
	if (last && last.by !== playerId && t - last.at < 90_000) {
		pet.needs = addNeeds(pet.needs, { happiness: 5 });
		say(pet, pick(LINES.together), sayAt);
		if (await remember(ctx, couple, pet, 'heart', 'Both of us played with you.', 'together'))
			await log(ctx, couple._id, 'heart', `You both looked after ${pet.name} together.`);
	}
	pet.lastCare = { by: playerId, at: t };
}

// ---- Autonomy loop ----

async function ensureTick(ctx: MutationCtx, pet: Pet, t: number) {
	if (pet.tickAt && pet.tickAt > t - 15_000) return;
	pet.tickAt = t + 1_500;
	await ctx.scheduler.runAt(pet.tickAt, internal.pets.tick, { petId: pet._id, due: pet.tickAt });
}

export const tick = internalMutation({
	args: { petId: v.id('creatures'), due: v.number() },
	handler: async (ctx, { petId, due }) => {
		const pet = await ctx.db.get(petId);
		// Another loop took over (or this one was stopped).
		if (!pet || pet.tickAt !== due) return;
		const couple = await ctx.db.get(pet.coupleId);
		if (!couple) return;
		const t = Date.now();
		const rows = await presenceRows(ctx, couple._id);

		// Say goodbye to anyone whose heartbeat stopped.
		for (const row of rows) {
			if (row.online && t - row.lastSeen >= OFFLINE_AFTER_MS) {
				await ctx.db.patch(row._id, { online: false });
				if (awake(pet, t)) say(pet, pick(LINES.bye(nameOf(couple, row.playerId))), t);
			}
		}
		const here = rows.filter((r) => isOnline(r, t));
		if (here.length === 0) {
			pet.tickAt = undefined;
			await savePet(ctx, pet);
			return;
		}

		settle(pet, t);
		await catchUp(ctx, couple, pet, t);
		if (pet.stage !== 'box') await live(ctx, couple, pet, here, t);

		pet.tickAt = t + TICK_MIN + Math.random() * TICK_JITTER;
		await ctx.scheduler.runAt(pet.tickAt, internal.pets.tick, { petId, due: pet.tickAt });
		await savePet(ctx, pet);
	}
});

/** One beat of the cat's own life: wander, nap, groom, zoom, get up to mischief. */
async function live(ctx: MutationCtx, couple: Couple, pet: Pet, here: Presence[], t: number) {
	const canTalk = !pet.lastSaidAt || t - pet.lastSaidAt > TALK_GAP;
	const talk = (lines: string[], at = t, chance = 1) => {
		if (canTalk && Math.random() < chance) say(pet, pick(lines), at);
	};
	if (asleep(pet, t)) {
		talk(LINES.sleeping, t, 0.15);
		return;
	}
	if (busy(pet, t)) return;

	const n = pet.needs;
	const traits = pet.traits as Partial<Record<Trait, number>>;

	if (n.energy < 22 || (has(traits, 'lazy') && n.energy < 45 && Math.random() < 0.08)) {
		const seat = pick([SEATS.petBed, SEATS.petBed, SEATS.bed, SEATS.sofa]);
		const arrive = goTo(pet, seat, t);
		pet.sleep = { since: arrive, until: arrive + sleepLength(n.energy) };
		say(pet, pick(LINES.sleepy), t);
		await log(ctx, couple._id, 'moon', `${pet.name} curled up for a nap.`);
		return;
	}

	if (canTalk && Math.random() < 0.3) {
		const need =
			n.hunger < 35 ? LINES.hungry : n.happiness < 40 ? LINES.bored : n.cleanliness < 35 ? LINES.dirty : n.energy < 35 ? LINES.sleepy : null;
		if (need) {
			if (need === LINES.hungry && Math.random() < 0.5) {
				const arrive = goTo(pet, near(OBJECTS.bowl.spot, 4, 4), t);
				act(pet, 'sad', arrive, 3_000);
			}
			say(pet, pick(need), t);
			return;
		}
	}

	if (couple.radioOn && Math.random() < 0.22) {
		const arrive = goTo(pet, near(OBJECTS.radio.spot, 10, 6), t);
		act(pet, 'vibe', arrive, 6_000);
		talk(LINES.music, arrive, 0.5);
		return;
	}

	const mischief = 0.04 + (has(traits, 'mischievous') ? 0.08 : 0) + (couple.lightsOff ? 0.03 : 0);
	if (Math.random() < mischief && (await misbehave(ctx, couple, pet, here, t))) return;

	const toys = couple.decor.filter((d) => TOYS.includes(d.item) && !d.stolen);
	const roll = Math.random();
	if (roll < 0.17) {
		goTo(pet, randomSpot(), t);
	} else if (roll < 0.29) {
		const player = pick(here);
		const p = motionAt(player.motion, t);
		const arrive = goTo(pet, near(p, Math.random() < 0.5 ? -9 : 9, 6), t);
		act(pet, 'bonk', arrive, 2_200);
		talk(Math.random() < 0.5 ? LINES.bonk : [idleLine(traits)], arrive, 0.6);
	} else if (roll < 0.37 && toys.length && n.energy > 30) {
		const toy = pick(toys);
		const arrive = goTo(pet, near(toy, 6, 4), t);
		act(pet, 'pounce', arrive, 3_000);
		talk(LINES.toy, arrive, 0.6);
	} else if (roll < 0.47) {
		const spot = pick(['window', 'fish', 'plant', 'rug'] as const);
		if (spot === 'window') {
			const arrive = goTo(pet, SEATS.catTree, t);
			act(pet, 'chatter', arrive, 6_000);
			talk(LINES.window, arrive + 800, 0.6);
		} else if (spot === 'fish') {
			const arrive = goTo(pet, near(OBJECTS.fishTank.spot, 0, 2), t);
			act(pet, 'stare', arrive, 6_000);
			talk(LINES.fish, arrive + 600, 0.6);
		} else if (spot === 'plant') {
			const arrive = goTo(pet, near(OBJECTS.plant.spot, 2, 4), t);
			act(pet, 'sit', arrive, 4_000);
			talk(LINES.plant, arrive, 0.5);
		} else {
			const arrive = goTo(pet, near(OBJECTS.rug.spot, Math.random() * 20 - 10, Math.random() * 16 - 8), t);
			act(pet, 'loaf', arrive, 9_000);
		}
	} else if (roll < 0.55) {
		act(pet, 'groom', t, 4_500);
		talk(LINES.groom, t, 0.3);
	} else if (roll < 0.6) {
		act(pet, 'stretch', t, 2_200);
		talk(LINES.stretch, t, 0.3);
	} else if (roll < 0.66) {
		const seat = pick([SEATS.sofa, SEATS.bed, null]);
		const arrive = seat ? goTo(pet, seat, t) : t;
		act(pet, 'knead', arrive, 5_000);
		talk(LINES.knead, arrive, 0.5);
	} else if (roll < 0.7 && n.energy > 40) {
		act(pet, 'spin', t, 2_600);
		talk(LINES.spin, t, 0.5);
	} else if (roll < 0.74 && n.energy > 50) {
		const arrive = dash(pet, [randomSpot(), randomSpot(), randomSpot()], t);
		act(pet, 'excited', arrive, 1_200);
		say(pet, pick(LINES.zoomies), t);
		pet.needs = addNeeds(pet.needs, { energy: -4 });
		await remember(ctx, couple, pet, 'bolt', 'Your first case of the zoomies.', 'zoomies');
	} else if (roll < 0.78) {
		const arrive = goTo(pet, SEATS.box, t);
		act(pet, 'sit', arrive, 8_000);
		talk(LINES.box, arrive, 0.6);
	} else if (roll < 0.82) {
		const arrive = goTo(pet, SEATS.catTree, t);
		act(pet, 'sit', arrive, 7_000);
		talk(LINES.tree, arrive, 0.5);
	} else if (roll < 0.9) {
		act(pet, 'sit', t, 3_000 + Math.random() * 4_000);
	} else {
		talk([idleLine(traits)]);
	}
}

/** Something unexpected and funny. Returns false if nothing fit right now. */
async function misbehave(ctx: MutationCtx, couple: Couple, pet: Pet, here: Presence[], t: number) {
	if (!here.length) return false;
	const options: (() => Promise<void>)[] = [];

	const gifts = couple.decor.filter((d) => d.from && !d.stolen);
	if (gifts.length) {
		options.push(async () => {
			const gift = pick(gifts);
			const owner = nameOf(couple, couple.players.find((p) => p.id !== gift.from)?.id);
			const arrive = goTo(pet, near(gift), t);
			const bed = SEATS.petBed;
			await ctx.db.patch(couple._id, {
				decor: couple.decor.map((d) => (d.key === gift.key ? { ...d, x: bed.x + 6, y: bed.y - 8, stolen: true } : d))
			});
			act(pet, 'excited', arrive, 2_000);
			say(pet, pick(LINES.steal(owner, `the ${gift.item}`)), arrive);
			await remember(ctx, couple, pet, 'paw', `You stole ${owner}'s ${gift.item}.`, 'mischief:steal');
			await log(ctx, couple._id, 'paw', `${pet.name} stole ${owner}'s ${gift.item}.`);
		});
	}
	if (!couple.cupDown) {
		options.push(async () => {
			const arrive = goTo(pet, SEATS.table, t);
			act(pet, 'knock', arrive, 2_400);
			say(pet, pick(LINES.knock), arrive);
			await ctx.db.patch(couple._id, { cupDown: true });
			await remember(ctx, couple, pet, 'cup', 'You knocked a cup off the table. On purpose.', 'mischief:cup');
			await log(ctx, couple._id, 'cup', `${pet.name} knocked the cup off the table.`);
		});
	}
	options.push(async () => {
		const arrive = goTo(pet, SEATS.box, t);
		act(pet, 'hide', arrive, 15_000);
		say(pet, pick(LINES.hide), arrive);
		await remember(ctx, couple, pet, 'magnifier', 'You hid in the box and nobody could find you.', 'mischief:hide');
		await log(ctx, couple._id, 'magnifier', `${pet.name} is hiding in the box.`);
	});
	options.push(async () => {
		const arrive = goTo(pet, SEATS.sofa, t);
		act(pet, 'sit', arrive, 12_000);
		say(pet, pick(LINES.sofa), arrive);
		await remember(ctx, couple, pet, 'sofa', 'You decided the sofa belongs to you.', 'mischief:sofa');
		await log(ctx, couple._id, 'sofa', `${pet.name} has decided the sofa belongs to them.`);
	});
	options.push(async () => {
		const arrive = goTo(pet, near(OBJECTS.sofa.spot, 0, 6), t);
		act(pet, 'scratch', arrive, 3_500);
		say(pet, pick(LINES.scratch), arrive);
		await log(ctx, couple._id, 'paw', `${pet.name} scratched the sofa.`);
	});
	if (pet.stage === 'teen' || pet.stage === 'adult') {
		options.push(async () => {
			const arrive = goTo(pet, OBJECTS.door.spot, t);
			act(pet, 'excited', arrive, 3_000);
			say(pet, pick(LINES.door), arrive);
			await remember(ctx, couple, pet, 'door', 'You learned how to open doors.', 'mischief:door');
			await log(ctx, couple._id, 'door', `${pet.name} has learned how to open doors.`);
		});
	}
	await pick(options)();
	return true;
}

// ---- Daily events ----

async function ensureEvent(ctx: MutationCtx, couple: Couple, pet: Pet, t: number) {
	const day = dayKey(t);
	const latest = await ctx.db
		.query('creatureEvents')
		.withIndex('by_coupleId_and_day', (q) => q.eq('coupleId', couple._id))
		.order('desc')
		.first();
	if (latest?.day === day) return;
	// Settle yesterday's question with whatever votes came in.
	if (latest && !latest.result && latest.votes.length) await resolve(ctx, couple, pet, latest);
	const recent = await ctx.db
		.query('creatureEvents')
		.withIndex('by_coupleId_and_day', (q) => q.eq('coupleId', couple._id))
		.order('desc')
		.take(6);
	const fresh = EVENTS.filter((e) => !recent.some((r) => r.eventId === e.id));
	const next = pick(fresh.length ? fresh : EVENTS);
	await ctx.db.insert('creatureEvents', { coupleId: couple._id, day, eventId: next.id, votes: [] });
}

async function resolve(ctx: MutationCtx, couple: Couple, pet: Pet, row: Doc<'creatureEvents'>) {
	const ev = event(row.eventId);
	if (!ev) return;
	const picks = row.votes.map((vote) => vote.choice);
	const agreed = picks.length === 2 && picks[0] === picks[1];
	const chosenId = agreed || picks.length === 1 ? picks[0] : pick(picks);
	const choice = ev.choices.find((c) => c.id === chosenId) ?? ev.choices[0];
	const label = fill(choice.label, pet.name);
	const outcome = fill(choice.outcome, pet.name);
	const head =
		picks.length === 1
			? `${nameOf(couple, row.votes[0].playerId)} chose ${label}.`
			: agreed
				? `You both chose ${label}!`
				: `You two couldn't agree. ${pet.name} picked ${label}.`;
	if (choice.traits) addTraits(pet, choice.traits);
	if (choice.needs) pet.needs = addNeeds(pet.needs, choice.needs);
	if (choice.decor) await addDecor(ctx, couple, choice.decor);
	await ctx.db.patch(row._id, { result: { choice: choice.id, agreed, text: `${head} ${outcome}` } });
	await log(ctx, couple._id, choice.icon, `${head} ${outcome}`);
	if (agreed) await remember(ctx, couple, pet, 'heart', `We both chose ${label.toLowerCase()}. ${outcome}`);
	else if (picks.length === 2)
		await remember(ctx, couple, pet, 'laugh', `We couldn't agree, so ${pet.name} picked ${label.toLowerCase()}.`, 'disagree');
}

async function addDecor(ctx: MutationCtx, couple: Couple, item: Decor, from?: string) {
	const fresh = await ctx.db.get(couple._id);
	const decor = fresh?.decor ?? couple.decor;
	const taken = (p: Point) => decor.some((d) => d.x === p.x && d.y === p.y);
	const slot = DECOR_SLOTS.find((p) => !taken(p));
	const kept = slot ? decor : decor.slice(1);
	const spot = slot ?? DECOR_SLOTS[0];
	const key = `${item}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`;
	const next = [...kept, { key, item, x: spot.x, y: spot.y, from }].slice(-MAX_DECOR);
	await ctx.db.patch(couple._id, { decor: next });
	couple.decor = next;
}

// ---- Queries ----

export const get = query({
	args: { code: v.string(), playerId: v.string() },
	handler: async (ctx, { code, playerId }) => {
		const couple = await ctx.db
			.query('creatureCouples')
			.withIndex('by_code', (q) => q.eq('code', code.toUpperCase()))
			.unique();
		if (!couple) return null;
		const member = couple.players.some((p) => p.id === playerId);
		const pet = await ctx.db
			.query('creatures')
			.withIndex('by_coupleId', (q) => q.eq('coupleId', couple._id))
			.unique();
		if (!member || !pet) return { couple, member, pet: null };
		// The personality stays hidden: only words, and only once it has had time to show.
		const { traits, tickAt, firsts, lastCare, ...shown } = pet;
		const day = dayOf(couple.startedAt, pet.needsAt);
		const personality = day >= 14 ? topTraits(traits).map((k) => TRAIT_WORD[k]) : [];
		return { couple, member, pet: { ...shown, personality } };
	}
});

export const presence = query({
	args: { coupleId: v.id('creatureCouples') },
	handler: async (ctx, { coupleId }) => {
		const rows = await ctx.db
			.query('creaturePresence')
			.withIndex('by_coupleId_and_playerId', (q) => q.eq('coupleId', coupleId))
			.take(4);
		return rows.map(({ playerId, motion, lastSeen, online, emote, chat }) => ({
			playerId,
			motion,
			lastSeen,
			online,
			emote,
			chat
		}));
	}
});

/** Today's question. Each player sees their own vote, never their partner's until the reveal. */
export const today = query({
	args: { coupleId: v.id('creatureCouples'), playerId: v.string() },
	handler: async (ctx, { coupleId, playerId }) => {
		const row = await ctx.db
			.query('creatureEvents')
			.withIndex('by_coupleId_and_day', (q) => q.eq('coupleId', coupleId))
			.order('desc')
			.first();
		if (!row) return null;
		return {
			_id: row._id,
			day: row.day,
			eventId: row.eventId,
			mine: row.votes.find((x) => x.playerId === playerId)?.choice,
			partnerVoted: row.votes.some((x) => x.playerId !== playerId),
			votes: row.result ? row.votes : [],
			result: row.result
		};
	}
});

export const memories = query({
	args: { coupleId: v.id('creatureCouples') },
	handler: async (ctx, { coupleId }) => {
		return await ctx.db
			.query('creatureMemories')
			.withIndex('by_coupleId', (q) => q.eq('coupleId', coupleId))
			.take(300);
	}
});

export const recent = query({
	args: { coupleId: v.id('creatureCouples') },
	handler: async (ctx, { coupleId }) => {
		return await ctx.db
			.query('creatureLog')
			.withIndex('by_coupleId', (q) => q.eq('coupleId', coupleId))
			.order('desc')
			.take(20);
	}
});

/** Server time, so clients can line their animations up with the server's. */
export const now = mutation({ args: {}, handler: async () => Date.now() });

// ---- Setting up ----

const look = { shirt: v.string(), hair: v.string() };

function cleanLook(shirt: string, hair: string) {
	return {
		shirt: (SHIRTS as readonly string[]).includes(shirt) ? shirt : 'pink',
		hair: (HAIRS as readonly string[]).includes(hair) ? hair : 'short'
	};
}

export const create = mutation({
	args: { playerId: v.string(), name: v.string(), petName: v.string(), coat: v.string(), ...look },
	handler: async (ctx, { playerId, name, petName, coat, shirt, hair }) => {
		let code = '';
		for (let attempt = 0; attempt < 10; attempt++) {
			code = Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
			const existing = await ctx.db
				.query('creatureCouples')
				.withIndex('by_code', (q) => q.eq('code', code))
				.unique();
			if (!existing) break;
		}
		const t = Date.now();
		const coupleId = await ctx.db.insert('creatureCouples', {
			code,
			startedAt: t,
			players: [{ id: playerId, name: cleanName(name), ...cleanLook(shirt, hair) }],
			decor: []
		});
		const box = SEATS.box;
		await ctx.db.insert('creatures', {
			coupleId,
			name: petName.trim().slice(0, 16) || 'Mochi',
			coat: isCoat(coat) ? coat : pick(COATS),
			stage: 'box',
			greetedBy: [],
			evolutionSeen: [],
			needs: { hunger: 80, happiness: 70, energy: 90, cleanliness: 100 },
			needsAt: t,
			traits: {},
			xp: 0,
			motion: { fx: box.x, fy: box.y, tx: box.x, ty: box.y, at: t, dur: 0 },
			firsts: ['box']
		});
		await ctx.db.insert('creatureMemories', { coupleId, day: 1, icon: 'box', text: 'We found a box by the door. It mewed.' });
		return code;
	}
});

export const join = mutation({
	args: { code: v.string(), playerId: v.string(), name: v.string(), ...look },
	handler: async (ctx, { code, playerId, name, shirt, hair }) => {
		const couple = await ctx.db
			.query('creatureCouples')
			.withIndex('by_code', (q) => q.eq('code', code.trim().toUpperCase()))
			.unique();
		if (!couple) throw new ConvexError('No room with that code');
		if (couple.players.some((p) => p.id === playerId)) return couple.code;
		if (couple.players.length >= 2) throw new ConvexError('This room already belongs to two people');
		const player = { id: playerId, name: cleanName(name), ...cleanLook(shirt, hair) };
		await ctx.db.patch(couple._id, { players: [...couple.players, player] });
		const pet = await loadPet(ctx, couple._id);
		await remember(ctx, couple, pet, 'heart', `${player.name} moved in.`, 'joined');
		await savePet(ctx, pet);
		return couple.code;
	}
});

export const restyle = mutation({
	args: { coupleId: v.id('creatureCouples'), playerId: v.string(), ...look },
	handler: async (ctx, { coupleId, playerId, shirt, hair }) => {
		const couple = await loadCouple(ctx, coupleId);
		requirePlayer(couple, playerId);
		await ctx.db.patch(coupleId, {
			players: couple.players.map((p) => (p.id === playerId ? { ...p, ...cleanLook(shirt, hair) } : p))
		});
	}
});

// ---- Arriving, moving, leaving ----

/** Called when a player opens the room. Returns what happened while they were away. */
export const arrive = mutation({
	args: { coupleId: v.id('creatureCouples'), playerId: v.string() },
	handler: async (ctx, { coupleId, playerId }) => {
		const couple = await loadCouple(ctx, coupleId);
		const me = requirePlayer(couple, playerId);
		const pet = await loadPet(ctx, coupleId);
		const t = Date.now();
		const rows = await presenceRows(ctx, coupleId);
		const mine = rows.find((r) => r.playerId === playerId);
		const since = mine?.lastSeen;
		const returning = !mine || !isOnline(mine, t);
		const partner = partnerOf(couple, playerId);
		const partnerHere = isOnline(rows.find((r) => r.playerId === partner?.id), t);
		const lastAnyone = Math.max(0, ...rows.map((r) => r.lastSeen));

		settle(pet, t);

		// Nobody around for a while: the cat napped. Don't simulate it, just tell the story.
		if (pet.stage !== 'box' && lastAnyone && !partnerHere && !pet.sleep) {
			const napHours = Math.min(8, Math.floor(((t - lastAnyone) / HOUR) * 0.5));
			if (napHours >= 1) {
				pet.needs = addNeeds(pet.needs, { energy: napHours * 30 });
				await log(ctx, coupleId, 'moon', `${pet.name} slept for ${napHours} hour${napHours === 1 ? '' : 's'}.`);
			}
		}

		await catchUp(ctx, couple, pet, t);

		// Gifts waiting for me: claim them, and put the keepsakes in the room.
		const gifts = await ctx.db
			.query('creatureGifts')
			.withIndex('by_coupleId_and_recipientId_and_claimedAt', (q) =>
				q.eq('coupleId', coupleId).eq('recipientId', playerId).eq('claimedAt', undefined)
			)
			.take(20);
		for (const gift of gifts) {
			await ctx.db.patch(gift._id, { claimedAt: t });
			if (isGift(gift.item) && GIFTS[gift.item].decor) await addDecor(ctx, couple, gift.item as Decor, gift.senderId);
		}

		const items = since
			? (
					await ctx.db
						.query('creatureLog')
						.withIndex('by_coupleId', (q) => q.eq('coupleId', coupleId).gt('_creationTime', since))
						.order('desc')
						.take(12)
				)
					.filter((e) => e.playerId !== playerId)
					.reverse()
					.map(({ icon, text }) => ({ icon, text }))
			: [];

		if (returning) {
			const motion = { fx: SPAWN.x, fy: SPAWN.y, tx: SPAWN.x, ty: SPAWN.y, at: t, dur: 0 };
			if (mine) await ctx.db.patch(mine._id, { motion, lastSeen: t, online: true });
			else await ctx.db.insert('creaturePresence', { coupleId, playerId, motion, lastSeen: t, online: true });
			await log(ctx, coupleId, 'door', `${me.name} visited.`, playerId);
			if (awake(pet, t)) {
				const lonely = !pet.lastCare || t - pet.lastCare.at > 2 * DAY;
				const line = partnerHere ? pick(LINES.everyone) : lonely && since ? pick(LINES.forgot) : pick(LINES.hello(me.name));
				const arriveAt = goTo(pet, near(SPAWN, 14, 4), t, PET_RUN_SPEED);
				act(pet, partnerHere ? 'excited' : 'bonk', arriveAt, 2_000);
				say(pet, line, t);
				if (partnerHere && (await remember(ctx, couple, pet, 'heart', 'Everyone was home at the same time.', 'everyone')))
					await log(ctx, coupleId, 'heart', 'Everyone was home at the same time.');
			}
		} else if (mine) {
			await ctx.db.patch(mine._id, { lastSeen: t, online: true });
		}

		await ensureTick(ctx, pet, t);
		await savePet(ctx, pet);

		return {
			away: !!since && returning && t - since > 2 * 60_000,
			firstVisit: !since,
			items,
			gifts: gifts.map((g) => ({ item: g.item, message: g.message, from: nameOf(couple, g.senderId) }))
		};
	}
});

export const heartbeat = mutation({
	args: { coupleId: v.id('creatureCouples'), playerId: v.string() },
	handler: async (ctx, { coupleId, playerId }) => {
		const couple = await loadCouple(ctx, coupleId);
		requirePlayer(couple, playerId);
		const t = Date.now();
		const row = (await presenceRows(ctx, coupleId)).find((r) => r.playerId === playerId);
		if (row) await ctx.db.patch(row._id, { lastSeen: t, online: true });
		const pet = await loadPet(ctx, coupleId);
		if (!pet.tickAt || pet.tickAt < t - 15_000) {
			await ensureTick(ctx, pet, t);
			await savePet(ctx, pet);
		}
	}
});

async function myRow(ctx: MutationCtx, coupleId: Id<'creatureCouples'>, playerId: string) {
	const row = (await presenceRows(ctx, coupleId)).find((r) => r.playerId === playerId);
	if (!row) throw new ConvexError('Open the room first');
	return row;
}

export const move = mutation({
	args: { coupleId: v.id('creatureCouples'), playerId: v.string(), x: v.number(), y: v.number() },
	handler: async (ctx, { coupleId, playerId, x, y }) => {
		const couple = await loadCouple(ctx, coupleId);
		requirePlayer(couple, playerId);
		const t = Date.now();
		const row = await myRow(ctx, coupleId, playerId);
		// The walk starts from wherever the server thinks you are, so nobody can teleport.
		const motion = walkTo(motionAt(row.motion, t), freeSpot({ x, y }), t, PLAYER_SPEED);
		await ctx.db.patch(row._id, { motion, lastSeen: t, online: true });
	}
});

/** A little reaction over your head. A hug needs your partner close by. */
export const emote = mutation({
	args: { coupleId: v.id('creatureCouples'), playerId: v.string(), kind: v.string() },
	handler: async (ctx, { coupleId, playerId, kind }) => {
		const couple = await loadCouple(ctx, coupleId);
		const me = requirePlayer(couple, playerId);
		if (!(EMOTES as readonly string[]).includes(kind)) throw new ConvexError('Unknown emote');
		const t = Date.now();
		const rows = await presenceRows(ctx, coupleId);
		const row = rows.find((r) => r.playerId === playerId);
		if (!row) throw new ConvexError('Open the room first');

		if (kind === 'hug') {
			const partner = partnerOf(couple, playerId);
			const theirs = rows.find((r) => r.playerId === partner?.id);
			if (!partner || !theirs || !isOnline(theirs, t)) throw new ConvexError('Nobody here to hug');
			const a = motionAt(row.motion, t);
			const b = motionAt(theirs.motion, t);
			if (Math.hypot(a.x - b.x, a.y - b.y) > HUG_RANGE) throw new ConvexError(`Get closer to ${partner.name} first`);
			await ctx.db.patch(theirs._id, { emote: { kind, at: t } });
			await ctx.db.patch(row._id, { emote: { kind, at: t }, lastSeen: t });
			const pet = await loadPet(ctx, coupleId);
			settle(pet, t);
			if (awake(pet, t) && !busy(pet, t)) {
				const arrive = goTo(pet, near({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, 4, 10), t, PET_RUN_SPEED);
				act(pet, 'excited', arrive, 2_000);
				say(pet, pick(LINES.hug), arrive);
			}
			pet.needs = addNeeds(pet.needs, { happiness: 4 });
			if (await remember(ctx, couple, pet, 'heart', `${me.name} and ${partner.name} hugged in the room.`, 'hug'))
				await log(ctx, coupleId, 'heart', `${me.name} hugged ${partner.name}.`);
			await savePet(ctx, pet);
			return;
		}
		await ctx.db.patch(row._id, { emote: { kind, at: t }, lastSeen: t });
	}
});

/** Say something out loud in the room. The cat perks up at its own name. */
export const chat = mutation({
	args: { coupleId: v.id('creatureCouples'), playerId: v.string(), text: v.string() },
	handler: async (ctx, { coupleId, playerId, text }) => {
		const couple = await loadCouple(ctx, coupleId);
		const me = requirePlayer(couple, playerId);
		const clean = text.trim().slice(0, MAX_CHAT);
		if (!clean) return;
		const t = Date.now();
		const row = await myRow(ctx, coupleId, playerId);
		await ctx.db.patch(row._id, { chat: { text: clean, at: t }, lastSeen: t });
		const pet = await loadPet(ctx, coupleId);
		if (awake(pet, t) && clean.toLowerCase().includes(pet.name.toLowerCase())) {
			settle(pet, t);
			const p = motionAt(row.motion, t);
			const arrive = goTo(pet, near(p, 9, 6), t);
			act(pet, 'happy', arrive, 1_800);
			say(pet, pick(LINES.named(me.name)), t + 600);
			await savePet(ctx, pet);
		}
	}
});

/** Leave a gift or letter for your partner (or treats for the cat). */
export const leaveGift = mutation({
	args: {
		coupleId: v.id('creatureCouples'),
		playerId: v.string(),
		item: v.string(),
		message: v.optional(v.string())
	},
	handler: async (ctx, { coupleId, playerId, item, message }) => {
		const couple = await loadCouple(ctx, coupleId);
		const me = requirePlayer(couple, playerId);
		if (!isGift(item)) throw new ConvexError("You can't leave that");
		const text = message?.trim().slice(0, MAX_MESSAGE) || undefined;
		const partner = partnerOf(couple, playerId);
		const gift = GIFTS[item];
		if (gift.for === 'partner' && !partner) throw new ConvexError('Invite your partner first');
		if (item === 'letter' && !text) throw new ConvexError('Write something first');

		if ((gift.for === 'partner' || text) && partner)
			await ctx.db.insert('creatureGifts', {
				coupleId,
				senderId: playerId,
				recipientId: partner.id,
				item: gift.for === 'partner' ? item : 'letter',
				message: text
			});
		const pet = await loadPet(ctx, coupleId);
		const t = Date.now();
		settle(pet, t);
		if (item === 'treat') {
			pet.needs = addNeeds(pet.needs, FOODS.treat.effect);
			await log(ctx, coupleId, 'treat', `${me.name} left ${pet.name} some treats.`, playerId);
		} else if (item === 'mouse') {
			await addDecor(ctx, couple, 'mouse', playerId);
			await log(ctx, coupleId, 'mouse', `${me.name} left ${pet.name} a toy mouse.`, playerId);
		} else if (partner) {
			const what = item === 'letter' ? 'a letter' : `a ${item === 'star' ? 'star lamp' : 'flower'}`;
			await log(ctx, coupleId, item, `${me.name} left you ${what}.`, playerId);
		}
		if (text && gift.for === 'pet' && partner) await log(ctx, coupleId, 'letter', `${me.name} left you a message.`, playerId);
		const first = gift.for === 'pet' ? 'You received your first gift.' : `${me.name} left the very first gift.`;
		await remember(ctx, couple, pet, 'gift', first, 'gift');
		await savePet(ctx, pet);
	}
});

export const goodbye = mutation({
	args: { coupleId: v.id('creatureCouples'), playerId: v.string() },
	handler: async (ctx, { coupleId, playerId }) => {
		const couple = await loadCouple(ctx, coupleId);
		const me = requirePlayer(couple, playerId);
		const row = (await presenceRows(ctx, coupleId)).find((r) => r.playerId === playerId);
		if (row) await ctx.db.patch(row._id, { online: false, lastSeen: Date.now() });
		const pet = await loadPet(ctx, coupleId);
		if (awake(pet, Date.now())) {
			say(pet, pick(LINES.bye(me.name)));
			await savePet(ctx, pet);
		}
	}
});

// ---- Looking after the cat ----

async function loadForCare(ctx: MutationCtx, coupleId: Id<'creatureCouples'>, playerId: string) {
	const couple = await loadCouple(ctx, coupleId);
	const me = requirePlayer(couple, playerId);
	const pet = await loadPet(ctx, coupleId);
	const t = Date.now();
	settle(pet, t);
	await catchUp(ctx, couple, pet, t);
	return { couple, me, pet, t };
}

function requireOut(pet: Pet) {
	if (pet.stage === 'box') throw new ConvexError("It's still hiding in the box. Say hello!");
}

/** Day 1: say hello to the box. The kitten comes out once you both have. */
export const greet = mutation({
	args: { coupleId: v.id('creatureCouples'), playerId: v.string() },
	handler: async (ctx, { coupleId, playerId }) => {
		const { couple, me, pet, t } = await loadForCare(ctx, coupleId, playerId);
		if (pet.stage !== 'box') return;
		act(pet, 'wiggle', t, 1_500);
		say(pet, pick(LINES.boxHello), t);
		if (!pet.greetedBy.includes(playerId)) {
			pet.greetedBy = [...pet.greetedBy, playerId];
			await log(ctx, coupleId, 'box', `${me.name} said hello to the box.`, playerId);
		}
		await catchUp(ctx, couple, pet, t);
		await savePet(ctx, pet);
	}
});

export const care = mutation({
	args: {
		coupleId: v.id('creatureCouples'),
		playerId: v.string(),
		action: v.union(v.literal('feed'), v.literal('pet'), v.literal('clean'), v.literal('sleep'), v.literal('wake')),
		food: v.optional(v.string())
	},
	handler: async (ctx, { coupleId, playerId, action, food }) => {
		const { couple, me, pet, t } = await loadForCare(ctx, coupleId, playerId);
		requireOut(pet);
		const traits = pet.traits as Partial<Record<Trait, number>>;
		const sleeping = asleep(pet, t);
		if (sleeping && action !== 'pet' && action !== 'wake') throw new ConvexError(`Shh... ${pet.name} is sleeping.`);

		if (action === 'feed') {
			if (!food || !isFood(food)) throw new ConvexError('Pick something to eat');
			if (pet.needs.hunger >= 95 && !has(traits, 'foodie') && food !== 'treat') {
				say(pet, pick(LINES.full), t);
				await savePet(ctx, pet);
				return;
			}
			const arrive = goTo(pet, near(OBJECTS.bowl.spot, 2, -2), t, PET_RUN_SPEED);
			act(pet, 'eat', arrive, 2_600, playerId);
			pet.needs = addNeeds(pet.needs, FOODS[food].effect);
			pet.xp += 2;
			addTraits(pet, { foodie: food === 'treat' ? 2 : 1 });
			say(pet, foodLine(food, traits), arrive + 1_200);
			const label = { kibble: 'some kibble', fish: 'a fish', chicken: 'some chicken', treat: 'a treat' }[food as Food];
			await log(ctx, coupleId, food, `${me.name} fed ${pet.name} ${label}.`, playerId);
			await remember(ctx, couple, pet, food, `You tried ${FOODS[food].label.toLowerCase()} for the first time.`, `food:${food}`);
			await cared(ctx, couple, pet, playerId, t, arrive + 1_200);
		}

		if (action === 'pet') {
			const happy = pet.needs.happiness >= 40;
			pet.needs = addNeeds(pet.needs, { happiness: has(traits, 'affectionate') ? 8 : 5 });
			pet.xp += 1;
			addTraits(pet, { affectionate: 1 });
			if (sleeping) {
				say(pet, '*purrs in its sleep*', t);
			} else {
				stop(pet, t);
				act(pet, 'pet', t, 2_400, playerId);
				say(pet, pick(pet.needs.cleanliness < 30 ? LINES.petDirty : happy ? LINES.petHappy : LINES.petSad), t + 300);
				await cared(ctx, couple, pet, playerId, t, t + 300);
			}
			if (await remember(ctx, couple, pet, 'heart', `${me.name} gave you your first scritches.`, 'pet'))
				await log(ctx, coupleId, 'heart', `${me.name} petted ${pet.name}.`, playerId);
		}

		if (action === 'clean') {
			// A brush, wherever the cat is. (The bath is in the room, for emergencies.)
			stop(pet, t);
			act(pet, 'brush', t, 3_000, playerId);
			pet.needs = addNeeds(pet.needs, { cleanliness: 45, happiness: 3 });
			pet.xp += 2;
			addTraits(pet, { affectionate: 0.5 });
			say(pet, pick(LINES.brush), t + 500);
			await log(ctx, coupleId, 'brush', `${me.name} brushed ${pet.name}.`, playerId);
			await remember(ctx, couple, pet, 'brush', 'Your first brushing. So much fluff.', 'brush');
			await cared(ctx, couple, pet, playerId, t, t + 500);
		}

		if (action === 'sleep') {
			if (pet.needs.energy >= 85) {
				say(pet, pick(LINES.notSleepy), t);
				await savePet(ctx, pet);
				return;
			}
			const arrive = goTo(pet, SEATS.petBed, t);
			pet.activity = undefined;
			pet.sleep = { since: arrive, until: arrive + sleepLength(pet.needs.energy) };
			if (pet.needs.energy > 55) addTraits(pet, { lazy: 1 });
			say(pet, pick(LINES.sleepy), t);
			await log(ctx, coupleId, 'moon', `${me.name} tucked ${pet.name} into bed.`, playerId);
		}

		if (action === 'wake') {
			if (!sleeping) return;
			pet.sleep = undefined;
			pet.needs = addNeeds(pet.needs, { happiness: -3 });
			act(pet, 'sad', t, 2_000);
			say(pet, pick(LINES.woken), t);
		}

		await savePet(ctx, pet);
	}
});

/** Play: throw the ball, shine the laser somewhere, or wave the feather wand. */
export const play = mutation({
	args: {
		coupleId: v.id('creatureCouples'),
		playerId: v.string(),
		toy: v.string(),
		x: v.optional(v.number()),
		y: v.optional(v.number())
	},
	handler: async (ctx, { coupleId, playerId, toy, x, y }) => {
		const { couple, me, pet, t } = await loadForCare(ctx, coupleId, playerId);
		requireOut(pet);
		if (!isPlay(toy)) throw new ConvexError('Not a toy');
		if (asleep(pet, t)) throw new ConvexError(`Shh... ${pet.name} is sleeping.`);
		const traits = pet.traits as Partial<Record<Trait, number>>;
		if (pet.needs.energy < 15) {
			say(pet, pick(LINES.tooTired), t);
			await savePet(ctx, pet);
			return;
		}
		if (has(traits, 'lazy') && pet.needs.energy < 70 && Math.random() < 0.3) {
			act(pet, 'loaf', t, 3_000);
			say(pet, pick(LINES.lazyRefuse), t);
			await savePet(ctx, pet);
			return;
		}

		let pickup: number;
		if (toy === 'feather') {
			const row = await myRow(ctx, coupleId, playerId);
			const p = motionAt(row.motion, t);
			const arrive = goTo(pet, near(p, 10, 4), t, PET_RUN_SPEED);
			pickup = arrive;
			pet.toy = { kind: 'feather', x: p.x, y: p.y, at: t, pickup };
			act(pet, 'pounce', arrive, 3_200, playerId);
			say(pet, pick(LINES.feather), arrive);
			addTraits(pet, { playful: 1, affectionate: 0.5 });
		} else {
			const spot = freeSpot({ x: x ?? 80, y: y ?? 90 });
			const delay = toy === 'ball' ? 250 : 120;
			pet.motion = walkTo(petAt(pet, t), spot, t + delay, PET_RUN_SPEED);
			pickup = Math.max(t + 450, pet.motion.at + pet.motion.dur);
			pet.toy = { kind: toy, x: spot.x, y: spot.y, at: t, pickup };
			act(pet, 'pounce', pickup, 1_800, playerId);
			say(pet, pick(toy === 'laser' ? LINES.laser : LINES.catch), pickup);
			addTraits(pet, toy === 'laser' ? { playful: 1, curious: 0.5 } : { playful: 1, adventurous: 0.5 });
		}
		pet.needs = addNeeds(pet.needs, { happiness: 12, energy: -8, cleanliness: -2 });
		pet.xp += 4;
		await log(ctx, coupleId, toy, `${me.name} played with ${pet.name}.`, playerId);
		await remember(ctx, couple, pet, toy, { ball: 'You caught your first ball.', laser: 'You met the red dot. You will never catch it.', feather: 'You caught the feather!' }[toy], `play:${toy}`);
		await cared(ctx, couple, pet, playerId, t, pickup);
		await savePet(ctx, pet);
	}
});

/** Call the cat over. Cats being cats, it might not come. */
export const call = mutation({
	args: { coupleId: v.id('creatureCouples'), playerId: v.string() },
	handler: async (ctx, { coupleId, playerId }) => {
		const { pet, t } = await loadForCare(ctx, coupleId, playerId);
		requireOut(pet);
		if (asleep(pet, t)) throw new ConvexError(`Shh... ${pet.name} is sleeping.`);
		const traits = pet.traits as Partial<Record<Trait, number>>;
		if (Math.random() < (has(traits, 'mischievous') ? 0.4 : 0.12)) {
			stop(pet, t);
			act(pet, 'groom', t, 2_500);
			say(pet, pick(LINES.ignore), t);
		} else {
			const p = motionAt((await myRow(ctx, coupleId, playerId)).motion, t);
			say(pet, pick(LINES.called), t);
			const arrive = goTo(pet, near(p, 9, 6), t, PET_RUN_SPEED);
			act(pet, 'bonk', arrive, 2_200);
			addTraits(pet, { affectionate: 0.5 });
		}
		await savePet(ctx, pet);
	}
});

/** Tapping furniture, a gift on the floor, or the fallen cup. */
export const interact = mutation({
	args: { coupleId: v.id('creatureCouples'), playerId: v.string(), target: v.string() },
	handler: async (ctx, { coupleId, playerId, target }) => {
		const { couple, me, pet, t } = await loadForCare(ctx, coupleId, playerId);
		const up = awake(pet, t);
		const free = up && !busy(pet, t);
		const traits = pet.traits as Partial<Record<Trait, number>>;

		if (target === 'cup') {
			if (couple.cupDown) {
				await ctx.db.patch(coupleId, { cupDown: false });
				await log(ctx, coupleId, 'cup', `${me.name} put the cup back on the table.`, playerId);
				if (up && Math.random() < 0.5) say(pet, '*watches the cup intently*', t);
			}
			await savePet(ctx, pet);
			return;
		}

		if (target.startsWith('decor:')) {
			const item = couple.decor.find((d) => d.key === target.slice(6));
			if (!item) throw new ConvexError("That's not here anymore");
			if (item.stolen) {
				// Taking it back from the cat bed.
				const spot = DECOR_SLOTS.find((p) => !couple.decor.some((d) => d.x === p.x && d.y === p.y)) ?? DECOR_SLOTS[0];
				await ctx.db.patch(coupleId, {
					decor: couple.decor.map((d) => (d.key === item.key ? { ...d, x: spot.x, y: spot.y, stolen: false } : d))
				});
				if (up) say(pet, '*innocent slow blink*', t);
			} else if (up && TOYS.includes(item.item)) {
				const arrive = goTo(pet, near(item, 6, 4), t, PET_RUN_SPEED);
				act(pet, 'pounce', arrive, 2_500, playerId);
				pet.needs = addNeeds(pet.needs, { happiness: 6, energy: -3 });
				addTraits(pet, item.item === 'mouse' ? { mischievous: 0.5, playful: 0.5 } : { playful: 1 });
				say(pet, pick(LINES.toy), arrive);
				await cared(ctx, couple, pet, playerId, t, arrive);
			} else if (up && (item.item === 'flower' || item.item === 'sprout')) {
				const arrive = goTo(pet, near(item, 6, 4), t);
				act(pet, 'sit', arrive, 2_000);
				addTraits(pet, { nature: 1 });
				say(pet, '*sniff sniff*', arrive);
			}
			await savePet(ctx, pet);
			return;
		}

		if (!isObject(target)) throw new ConvexError('Nothing to do there');
		addTraits(pet, { curious: 0.3 });

		switch (target) {
			case 'lamp': {
				const off = !couple.lightsOff;
				await ctx.db.patch(coupleId, { lightsOff: off });
				await log(ctx, coupleId, 'lamp', `${me.name} turned the lights ${off ? 'off' : 'on'}.`, playerId);
				if (up) say(pet, pick(off ? LINES.dark : LINES.light), t + 300);
				break;
			}
			case 'radio': {
				const on = !couple.radioOn;
				await ctx.db.patch(coupleId, { radioOn: on });
				await log(ctx, coupleId, 'note', `${me.name} turned the radio ${on ? 'on' : 'off'}.`, playerId);
				if (on && free) {
					const arrive = goTo(pet, near(OBJECTS.radio.spot, 10, 6), t);
					act(pet, 'vibe', arrive, 6_000);
					say(pet, pick(LINES.music), arrive);
					if (await remember(ctx, couple, pet, 'note', `${me.name} played music and you danced.`, 'music'))
						addTraits(pet, { playful: 1 });
				}
				break;
			}
			case 'window':
				addTraits(pet, { curious: 1 });
				if (free) {
					const arrive = goTo(pet, SEATS.catTree, t);
					act(pet, 'chatter', arrive, 6_000);
					say(pet, pick(LINES.window), arrive);
				}
				break;
			case 'catTree':
				addTraits(pet, { adventurous: 1 });
				if (free) {
					const arrive = goTo(pet, SEATS.catTree, t);
					act(pet, 'sit', arrive, 8_000);
					say(pet, pick(LINES.tree), arrive);
					await remember(ctx, couple, pet, 'star', 'You climbed all the way to the top of the cat tree.', 'tree');
				}
				break;
			case 'fishTank':
				addTraits(pet, { curious: 1 });
				if (free) {
					const arrive = goTo(pet, near(OBJECTS.fishTank.spot, 0, 2), t);
					act(pet, 'stare', arrive, 6_000);
					say(pet, pick(LINES.fish), arrive + 400);
				}
				break;
			case 'box':
				if (free) {
					const arrive = goTo(pet, SEATS.box, t);
					act(pet, 'sit', arrive, 8_000);
					say(pet, pick(LINES.box), arrive);
					await remember(ctx, couple, pet, 'box', 'You still love your box.', 'box:back');
				}
				break;
			case 'tub': {
				requireOut(pet);
				if (!up) throw new ConvexError(`Shh... ${pet.name} is sleeping.`);
				const arrive = goTo(pet, SEATS.tub, t);
				act(pet, 'bath', arrive, 3_400, playerId);
				const calm = has(traits, 'affectionate') && !has(traits, 'mischievous') && Math.random() < 0.6;
				pet.needs = addNeeds(pet.needs, { cleanliness: 100, happiness: calm ? 2 : -4 });
				pet.xp += 2;
				say(pet, pick(calm ? LINES.bathHappy : LINES.bathGrumpy), arrive + 600);
				await log(ctx, coupleId, 'bubble', `${me.name} gave ${pet.name} a bath.`, playerId);
				await remember(ctx, couple, pet, 'bubble', 'Your first bath. You did not approve.', 'bath');
				await cared(ctx, couple, pet, playerId, t, arrive + 600);
				break;
			}
			case 'plant':
				if (pet.wateredAt && t - pet.wateredAt < 2 * HOUR) {
					if (up) say(pet, 'The plant is already happy!', t);
				} else {
					pet.wateredAt = t;
					addTraits(pet, { nature: 2 });
					await log(ctx, coupleId, 'sprout', `${me.name} watered the plant.`, playerId);
					await remember(ctx, couple, pet, 'sprout', `${me.name} watered the plant and you watched very closely.`, 'plant');
					if (free) {
						const arrive = goTo(pet, near(OBJECTS.plant.spot, 4, 6), t);
						act(pet, 'happy', arrive, 2_000);
						pet.needs = addNeeds(pet.needs, { happiness: 3 });
						say(pet, pick(LINES.plant), arrive);
					}
				}
				break;
			case 'sofa':
			case 'bed': {
				if (free) {
					const arrive = goTo(pet, SEATS[target], t);
					act(pet, 'knead', arrive, 5_000);
					pet.needs = addNeeds(pet.needs, { happiness: 2 });
					addTraits(pet, target === 'sofa' ? { affectionate: 0.5, lazy: 0.5 } : { adventurous: 1 });
					say(pet, pick(LINES.knead), arrive);
				}
				if (target === 'sofa') {
					const partner = partnerOf(couple, playerId);
					const row = (await presenceRows(ctx, coupleId)).find((r) => r.playerId === partner?.id);
					const p = row && isOnline(row, t) ? motionAt(row.motion, t) : null;
					if (p && Math.hypot(p.x - OBJECTS.sofa.spot.x, p.y - OBJECTS.sofa.spot.y) < 30) {
						pet.needs = addNeeds(pet.needs, { happiness: 6 });
						if (up) say(pet, 'Sofa party!', t + 600);
						if (await remember(ctx, couple, pet, 'sofa', 'We all sat on the sofa together.', 'sofa:together'))
							await log(ctx, coupleId, 'sofa', 'You all sat on the sofa together.');
					}
				}
				break;
			}
			default:
				break;
		}
		await savePet(ctx, pet);
	}
});

export const vote = mutation({
	args: { coupleId: v.id('creatureCouples'), playerId: v.string(), eventId: v.id('creatureEvents'), choice: v.string() },
	handler: async (ctx, { coupleId, playerId, eventId, choice }) => {
		const couple = await loadCouple(ctx, coupleId);
		requirePlayer(couple, playerId);
		const row = await ctx.db.get(eventId);
		if (!row || row.coupleId !== coupleId) throw new ConvexError('No event here');
		if (row.result) throw new ConvexError('Already decided');
		const ev = event(row.eventId);
		if (!ev?.choices.some((c) => c.id === choice)) throw new ConvexError('Not a choice');
		const votes = [...row.votes.filter((x) => x.playerId !== playerId), { playerId, choice }];
		await ctx.db.patch(eventId, { votes });
		const everyone = couple.players.every((p) => votes.some((x) => x.playerId === p.id));
		if (everyone && couple.players.length === 2) {
			const pet = await loadPet(ctx, coupleId);
			settle(pet, Date.now());
			await resolve(ctx, couple, pet, { ...row, votes });
			await savePet(ctx, pet);
		}
	}
});

/** Before the partner joins, one player can settle today's question alone. */
export const decideAlone = mutation({
	args: { coupleId: v.id('creatureCouples'), playerId: v.string(), eventId: v.id('creatureEvents') },
	handler: async (ctx, { coupleId, playerId, eventId }) => {
		const couple = await loadCouple(ctx, coupleId);
		requirePlayer(couple, playerId);
		const row = await ctx.db.get(eventId);
		if (!row || row.coupleId !== coupleId || row.result) return;
		if (couple.players.length === 2) throw new ConvexError('Wait for your partner to vote too');
		if (!row.votes.length) throw new ConvexError('Pick something first');
		const pet = await loadPet(ctx, coupleId);
		settle(pet, Date.now());
		await resolve(ctx, couple, pet, row);
		await savePet(ctx, pet);
	}
});

export const sawEvolution = mutation({
	args: { coupleId: v.id('creatureCouples'), playerId: v.string() },
	handler: async (ctx, { coupleId, playerId }) => {
		const couple = await loadCouple(ctx, coupleId);
		requirePlayer(couple, playerId);
		const pet = await loadPet(ctx, coupleId);
		if (pet.evolutionSeen.includes(playerId)) return;
		await ctx.db.patch(pet._id, { evolutionSeen: [...pet.evolutionSeen, playerId] });
	}
});

/** For testing growth: `npx convex run pets:ageRoom '{"code":"ABCD","days":6}'` moves the
 * room's start date back, as if that many days had passed. */
export const ageRoom = internalMutation({
	args: { code: v.string(), days: v.number() },
	handler: async (ctx, { code, days }) => {
		const couple = await ctx.db
			.query('creatureCouples')
			.withIndex('by_code', (q) => q.eq('code', code.toUpperCase()))
			.unique();
		if (!couple) throw new ConvexError('No room with that code');
		await ctx.db.patch(couple._id, { startedAt: couple.startedAt - days * DAY });
	}
});
