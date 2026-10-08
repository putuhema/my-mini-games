// Burger for Two: rooms and moves. The server owns the orders, the chef's dish in progress,
// the cooker and the clock. The chef's view never includes the order, the cashier's never
// includes what the chef is making, and every move is checked here so the two screens can't
// drift apart.

import { ConvexError, v } from 'convex/values';
import { internal } from './_generated/api';
import { internalMutation, mutation, query, type MutationCtx } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { dish, dishOf, isDish, type Difficulty } from './burger/dishes';
import { donenessAfter, ingredient, isIngredient, MAX_STACK } from './burger/ingredients';
import { COUNTDOWN_MS, generateShift } from './burger/orders';
import { scoreDish, verdict } from './burger/scoring';
import { burgerDifficulty } from './schema';
import { CODE_CHARS, cleanName } from './rooms';

const MAX_HISTORY = 20;

type Room = Doc<'burgerRooms'>;

async function loadRoom(ctx: MutationCtx, roomId: Id<'burgerRooms'>) {
	const room = await ctx.db.get(roomId);
	if (!room) throw new ConvexError('Room not found');
	return room;
}

function requireMember(room: Room, playerId: string) {
	if (!room.players.some((p) => p.id === playerId)) throw new ConvexError('Not in this room');
}

const chefId = (room: Room) => room.players.find((p) => p.id !== room.cashierId)?.id;

/** The chef may only touch the kitchen while a customer is waiting. */
function requireCooking(room: Room, playerId: string) {
	requireMember(room, playerId);
	if (room.status !== 'cooking') throw new ConvexError('No customer right now');
	if (chefId(room) !== playerId) throw new ConvexError('Only the chef can cook');
	const now = Date.now();
	if (room.startedAt && now < room.startedAt) throw new ConvexError('The customer is still walking in');
	if (room.deadline && now > room.deadline) throw new ConvexError("Time's up!");
}

/** The chef has picked a dish for this customer; returns it. */
function requireDish(room: Room) {
	if (!room.dish || !isDish(room.dish)) throw new ConvexError('Pick what you are making first');
	return dish(room.dish);
}

/** The order as it stands: after the change of mind, if the cashier has heard it. */
function currentTarget(room: Room) {
	const order = room.orders[room.customerIndex];
	const layers = room.followUpShown && order.followUp ? order.followUp.layers : order.layers;
	return { ...order, dish: dishOf(order), layers };
}

export const get = query({
	args: { code: v.string(), playerId: v.string() },
	handler: async (ctx, { code, playerId }) => {
		const room = await ctx.db
			.query('burgerRooms')
			.withIndex('by_code', (q) => q.eq('code', code.toUpperCase()))
			.unique();
		if (!room) return null;
		const { orders, stack, grill, dish: making, ...rest } = room;
		const member = room.players.some((p) => p.id === playerId);
		const isCashier = member && room.cashierId === playerId;
		const isChef = member && !isCashier;
		const order = orders[room.customerIndex];
		const active = room.status === 'cooking' || room.status === 'served';
		// The cashier sees the order (and the change of mind, once it happens); the chef only
		// sees who's at the counter until it's served.
		const { followUp, ...first } = order ?? {};
		const current =
			!order || !active || !member
				? undefined
				: room.status === 'served'
					? { ...order, dish: dishOf(order) }
					: isCashier
						? {
								...first,
								dish: dishOf(order),
								followUp: followUp && room.followUpShown ? { text: followUp.text } : undefined
							}
						: { customer: order.customer, name: order.name, seconds: order.seconds };
		const cooking = isChef && room.status === 'cooking';
		return {
			...rest,
			difficulty: room.difficulty ?? 'busy',
			customerCount: orders.length,
			current,
			dish: cooking ? making : undefined,
			stack: cooking ? stack : undefined,
			grill: cooking ? grill : undefined
		};
	}
});

/** Server time, so clients can line their countdown up with the server's. */
export const now = mutation({ args: {}, handler: async () => Date.now() });

export const create = mutation({
	args: { playerId: v.string(), name: v.string() },
	handler: async (ctx, { playerId, name }) => {
		let code = '';
		for (let attempt = 0; attempt < 10; attempt++) {
			code = Array.from(
				{ length: 4 },
				() => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
			).join('');
			const existing = await ctx.db
				.query('burgerRooms')
				.withIndex('by_code', (q) => q.eq('code', code))
				.unique();
			if (!existing) break;
		}
		await ctx.db.insert('burgerRooms', {
			code,
			status: 'waiting',
			players: [{ id: playerId, name: cleanName(name) }],
			cashierId: playerId,
			shift: 0,
			customerIndex: 0,
			orders: [],
			stack: [],
			grill: [],
			difficulty: 'busy',
			results: [],
			history: []
		});
		return code;
	}
});

export const join = mutation({
	args: { code: v.string(), playerId: v.string(), name: v.string() },
	handler: async (ctx, { code, playerId, name }) => {
		const room = await ctx.db
			.query('burgerRooms')
			.withIndex('by_code', (q) => q.eq('code', code.trim().toUpperCase()))
			.unique();
		if (!room) throw new ConvexError('No room with that code');
		// Rejoining (another tab, a refresh) keeps your seat and your role.
		if (room.players.some((p) => p.id === playerId)) return room.code;
		if (room.players.length >= 2) throw new ConvexError('This room already has two players');
		await ctx.db.patch(room._id, {
			players: [...room.players, { id: playerId, name: cleanName(name) }],
			status: 'lobby'
		});
		return room.code;
	}
});

export const chooseRole = mutation({
	args: {
		roomId: v.id('burgerRooms'),
		playerId: v.string(),
		role: v.union(v.literal('cashier'), v.literal('chef'), v.literal('random'), v.literal('swap'))
	},
	handler: async (ctx, { roomId, playerId, role }) => {
		const room = await loadRoom(ctx, roomId);
		requireMember(room, playerId);
		if (room.status !== 'lobby' && room.status !== 'reviews')
			throw new ConvexError('Roles are locked during a shift');
		const other = room.players.find((p) => p.id !== playerId)?.id ?? playerId;
		const cashierId = {
			cashier: playerId,
			chef: other,
			random: Math.random() < 0.5 ? playerId : other,
			swap: room.cashierId === playerId ? other : playerId
		}[role];
		await ctx.db.patch(roomId, { cashierId });
	}
});

export const configure = mutation({
	args: { roomId: v.id('burgerRooms'), playerId: v.string(), difficulty: burgerDifficulty },
	handler: async (ctx, { roomId, playerId, difficulty }) => {
		const room = await loadRoom(ctx, roomId);
		requireMember(room, playerId);
		if (room.status !== 'lobby' && room.status !== 'reviews') throw new ConvexError('Not during a shift');
		await ctx.db.patch(roomId, { difficulty });
	}
});

/** Patch for a customer walking up to the counter; schedules their timeout and change of mind. */
async function welcome(ctx: MutationCtx, room: Room, customerIndex: number, shift: number, orders: Room['orders']) {
	const order = orders[customerIndex];
	const startedAt = Date.now() + COUNTDOWN_MS;
	const totalMs = order.seconds * 1000;
	const deadline = startedAt + totalMs;
	const at = { roomId: room._id, shift, customerIndex };
	await ctx.scheduler.runAt(deadline, internal.kitchen.timeout, at);
	if (order.followUp) await ctx.scheduler.runAt(startedAt + totalMs * order.followUp.at, internal.kitchen.changeOfMind, at);
	return {
		status: 'cooking' as const,
		shift,
		customerIndex,
		orders,
		// The chef has to ask what's being ordered before picking a station.
		dish: undefined,
		stack: [],
		grill: [],
		followUpShown: false,
		startedAt,
		deadline
	};
}

async function beginShift(ctx: MutationCtx, room: Room, cashierId: string) {
	const difficulty: Difficulty = room.difficulty ?? 'busy';
	await ctx.db.patch(room._id, {
		cashierId,
		results: [],
		...(await welcome(ctx, room, 0, room.shift + 1, generateShift(difficulty)))
	});
}

export const startShift = mutation({
	args: { roomId: v.id('burgerRooms'), playerId: v.string() },
	handler: async (ctx, { roomId, playerId }) => {
		const room = await loadRoom(ctx, roomId);
		requireMember(room, playerId);
		if (room.players.length < 2) throw new ConvexError('Wait for your partner to join');
		if (room.status !== 'lobby' && room.status !== 'reviews') throw new ConvexError('The shift has already started');
		await beginShift(ctx, room, room.cashierId);
	}
});

/** From the reviews screen: another shift, optionally with roles swapped. */
export const again = mutation({
	args: { roomId: v.id('burgerRooms'), playerId: v.string(), swap: v.boolean() },
	handler: async (ctx, { roomId, playerId, swap }) => {
		const room = await loadRoom(ctx, roomId);
		requireMember(room, playerId);
		if (room.status !== 'reviews') throw new ConvexError('The shift is not over yet');
		await beginShift(ctx, room, swap ? (chefId(room) ?? room.cashierId) : room.cashierId);
	}
});

/** The chef picks burger, sate or noodles. Switching starts over with a clean station. */
export const chooseDish = mutation({
	args: { roomId: v.id('burgerRooms'), playerId: v.string(), dish: v.string() },
	handler: async (ctx, { roomId, playerId, dish: dishId }) => {
		const room = await loadRoom(ctx, roomId);
		requireCooking(room, playerId);
		if (!isDish(dishId)) throw new ConvexError('Not on the menu');
		if (room.dish === dishId) return;
		const slots = dish(dishId).cooker.slots;
		await ctx.db.patch(roomId, { dish: dishId, stack: [], grill: Array.from({ length: slots }, () => null) });
	}
});

export const addLayer = mutation({
	args: { roomId: v.id('burgerRooms'), playerId: v.string(), ing: v.string() },
	handler: async (ctx, { roomId, playerId, ing }) => {
		const room = await loadRoom(ctx, roomId);
		requireCooking(room, playerId);
		const d = requireDish(room);
		if (!isIngredient(ing) || !d.ingredients.includes(ing)) throw new ConvexError("That doesn't go in this dish");
		if (ingredient(ing).cook) throw new ConvexError(`That needs cooking first`);
		if (room.stack.length >= MAX_STACK) throw new ConvexError("There's no room for more!");
		await ctx.db.patch(roomId, { stack: [...room.stack, { ing }] });
	}
});

export const grillPatty = mutation({
	args: { roomId: v.id('burgerRooms'), playerId: v.string(), ing: v.string() },
	handler: async (ctx, { roomId, playerId, ing }) => {
		const room = await loadRoom(ctx, roomId);
		requireCooking(room, playerId);
		const d = requireDish(room);
		if (!isIngredient(ing) || !d.ingredients.includes(ing) || !ingredient(ing).cook)
			throw new ConvexError(`That doesn't go in the ${d.cooker.kind}`);
		const slot = room.grill.findIndex((s) => s === null);
		if (slot < 0) throw new ConvexError(`The ${d.cooker.kind} is full`);
		const grill = [...room.grill];
		grill[slot] = { ing, placedAt: Date.now() };
		await ctx.db.patch(roomId, { grill });
	}
});

/** Moves a patty from the grill onto the burger, as done as it is right now. */
export const takeOffGrill = mutation({
	args: { roomId: v.id('burgerRooms'), playerId: v.string(), slot: v.number() },
	handler: async (ctx, { roomId, playerId, slot }) => {
		const room = await loadRoom(ctx, roomId);
		requireCooking(room, playerId);
		const patty = room.grill[slot];
		if (!patty) throw new ConvexError('Nothing there');
		if (room.stack.length >= MAX_STACK) throw new ConvexError("There's no room for more!");
		const grill = [...room.grill];
		grill[slot] = null;
		const state = donenessAfter(patty.ing, Date.now() - patty.placedAt);
		await ctx.db.patch(roomId, { grill, stack: [...room.stack, { ing: patty.ing, state }] });
	}
});

/** Throws a patty off the grill without using it. */
export const binPatty = mutation({
	args: { roomId: v.id('burgerRooms'), playerId: v.string(), slot: v.number() },
	handler: async (ctx, { roomId, playerId, slot }) => {
		const room = await loadRoom(ctx, roomId);
		requireCooking(room, playerId);
		const grill = [...room.grill];
		grill[slot] = null;
		await ctx.db.patch(roomId, { grill });
	}
});

export const undo = mutation({
	args: { roomId: v.id('burgerRooms'), playerId: v.string() },
	handler: async (ctx, { roomId, playerId }) => {
		const room = await loadRoom(ctx, roomId);
		requireCooking(room, playerId);
		await ctx.db.patch(roomId, { stack: room.stack.slice(0, -1) });
	}
});

export const clear = mutation({
	args: { roomId: v.id('burgerRooms'), playerId: v.string() },
	handler: async (ctx, { roomId, playerId }) => {
		const room = await loadRoom(ctx, roomId);
		requireCooking(room, playerId);
		await ctx.db.patch(roomId, { stack: [] });
	}
});

async function serveDish(ctx: MutationCtx, room: Room, timedOut: boolean) {
	const order = currentTarget(room);
	const now = Date.now();
	const msLeft = timedOut ? 0 : Math.max(0, (room.deadline ?? now) - Math.max(now, room.startedAt ?? now));
	const served = { dish: room.dish, layers: room.stack };
	const score = scoreDish(order, served, { msLeft, totalMs: order.seconds * 1000, customer: order.customer });
	const { reaction, review } = verdict(
		order.customer,
		order,
		served,
		score.tier,
		room.results.map((r) => r.review)
	);
	const { score: points, percent, stars, tier, tip, correct, missing, extra, wrongDoneness, wrongDish } = score;
	await ctx.db.patch(room._id, {
		status: 'served',
		stack: [],
		grill: [],
		results: [
			...room.results,
			{
				order,
				served: served.layers,
				servedDish: served.dish,
				wrongDish,
				score: points,
				percent,
				stars,
				tier,
				tip,
				correct,
				missing,
				extra,
				wrongDoneness,
				reaction,
				review,
				msLeft,
				timedOut
			}
		]
	});
}

export const serve = mutation({
	args: { roomId: v.id('burgerRooms'), playerId: v.string() },
	handler: async (ctx, { roomId, playerId }) => {
		const room = await loadRoom(ctx, roomId);
		requireCooking(room, playerId);
		await serveDish(ctx, room, false);
	}
});

/** Fires at the deadline: serves whatever is on the plate. A no-op if it was already served. */
export const timeout = internalMutation({
	args: { roomId: v.id('burgerRooms'), shift: v.number(), customerIndex: v.number() },
	handler: async (ctx, { roomId, shift, customerIndex }) => {
		const room = await ctx.db.get(roomId);
		if (!room || room.status !== 'cooking' || room.shift !== shift || room.customerIndex !== customerIndex)
			return;
		await serveDish(ctx, room, true);
	}
});

/** Partway through the clock, some customers change their mind; the cashier hears it now. */
export const changeOfMind = internalMutation({
	args: { roomId: v.id('burgerRooms'), shift: v.number(), customerIndex: v.number() },
	handler: async (ctx, { roomId, shift, customerIndex }) => {
		const room = await ctx.db.get(roomId);
		if (!room || room.status !== 'cooking' || room.shift !== shift || room.customerIndex !== customerIndex)
			return;
		await ctx.db.patch(roomId, { followUpShown: true });
	}
});

export const nextCustomer = mutation({
	args: { roomId: v.id('burgerRooms'), playerId: v.string(), customerIndex: v.number() },
	handler: async (ctx, { roomId, playerId, customerIndex }) => {
		const room = await loadRoom(ctx, roomId);
		requireMember(room, playerId);
		// Both players may tap at once; only the first tap for this customer counts.
		if (room.status !== 'served' || room.customerIndex !== customerIndex) return;
		const next = room.customerIndex + 1;
		if (next < room.orders.length) {
			await ctx.db.patch(roomId, await welcome(ctx, room, next, room.shift, room.orders));
			return;
		}
		const name = (id: string | undefined) => room.players.find((p) => p.id === id)?.name ?? '?';
		const stars = room.results.reduce((sum, r) => sum + r.stars, 0) / Math.max(1, room.results.length);
		const tips = room.results.reduce((sum, r) => sum + r.tip, 0);
		await ctx.db.patch(roomId, {
			status: 'reviews',
			startedAt: undefined,
			deadline: undefined,
			history: [
				{
					shift: room.shift,
					cashierName: name(room.cashierId),
					chefName: name(chefId(room)),
					stars: Math.round(stars * 10) / 10,
					tips: Math.round(tips * 100) / 100
				},
				...room.history
			].slice(0, MAX_HISTORY)
		});
	}
});

// ---- Presence: lets each screen show when the partner has dropped off ----

export const heartbeat = mutation({
	args: { roomId: v.id('burgerRooms'), playerId: v.string() },
	handler: async (ctx, { roomId, playerId }) => {
		const room = await loadRoom(ctx, roomId);
		requireMember(room, playerId);
		const existing = await ctx.db
			.query('burgerPresence')
			.withIndex('by_roomId_and_playerId', (q) => q.eq('roomId', roomId).eq('playerId', playerId))
			.unique();
		if (existing) await ctx.db.patch(existing._id, { lastSeen: Date.now() });
		else await ctx.db.insert('burgerPresence', { roomId, playerId, lastSeen: Date.now() });
	}
});

export const presence = query({
	args: { roomId: v.id('burgerRooms') },
	handler: async (ctx, { roomId }) => {
		const rows = await ctx.db
			.query('burgerPresence')
			.withIndex('by_roomId_and_playerId', (q) => q.eq('roomId', roomId))
			.take(4);
		return rows.map((r) => ({ playerId: r.playerId, lastSeen: r.lastSeen }));
	}
});
