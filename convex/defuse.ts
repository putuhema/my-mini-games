import { ConvexError, v } from 'convex/values';
import { internal } from './_generated/api';
import { internalMutation, mutation, query, type MutationCtx } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import {
	buttonAction,
	COUNTDOWN_MS,
	DIFFICULTIES,
	formatTimer,
	generateBomb,
	generateManual,
	keypadOrder,
	MAX_STRIKES,
	simonPress,
	STRIKE_PENALTY_MS,
	TAP_MS,
	visibleModule,
	wireToCut,
	type BombModule
} from './bomb';
import { difficulty } from './schema';
import { CODE_CHARS, cleanName } from './rooms';

const MAX_HISTORY = 20;

type Room = Doc<'bombRooms'>;

async function loadRoom(ctx: MutationCtx, roomId: Id<'bombRooms'>) {
	const room = await ctx.db.get(roomId);
	if (!room) throw new ConvexError('Room not found');
	return room;
}

function requireMember(room: Room, playerId: string) {
	if (!room.players.some((p) => p.id === playerId)) throw new ConvexError('Not in this room');
}

export const get = query({
	args: { code: v.string(), playerId: v.string() },
	handler: async (ctx, { code, playerId }) => {
		const room = await ctx.db
			.query('bombRooms')
			.withIndex('by_code', (q) => q.eq('code', code.toUpperCase()))
			.unique();
		if (!room) return null;
		const { bomb, ...rest } = room;
		const live = room.status === 'live';
		const isDefuser = room.defuserId === playerId;
		const ended = room.status === 'defused' || room.status === 'exploded';
		// The defuser sees the bomb but never the manual's seed; the expert sees only the manual.
		// Once the round is over, both get everything for the post-mortem.
		const showBomb = bomb && (ended || (live && isDefuser));
		return {
			...rest,
			deadline: ended || isDefuser ? room.deadline : undefined,
			strikes: ended || isDefuser ? room.strikes : undefined,
			lastStrike: isDefuser ? room.lastStrike : undefined,
			seed: bomb && (ended || (live && !isDefuser)) ? bomb.seed : undefined,
			bomb: showBomb
				? {
						serial: bomb.serial,
						batteries: bomb.batteries,
						indicators: bomb.indicators,
						modules: bomb.modules.map(visibleModule)
					}
				: undefined
		};
	}
});

/** Server time, so clients can line their countdown up with the server's. */
export const now = mutation({ args: {}, handler: async () => Date.now() });

export const create = mutation({
	args: { playerId: v.string(), name: v.string(), difficulty: v.optional(difficulty) },
	handler: async (ctx, { playerId, name, difficulty }) => {
		let code = '';
		for (let attempt = 0; attempt < 10; attempt++) {
			code = Array.from(
				{ length: 4 },
				() => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
			).join('');
			const existing = await ctx.db
				.query('bombRooms')
				.withIndex('by_code', (q) => q.eq('code', code))
				.unique();
			if (!existing) break;
		}
		await ctx.db.insert('bombRooms', {
			code,
			status: 'waiting',
			players: [{ id: playerId, name: cleanName(name) }],
			defuserId: playerId,
			difficulty: difficulty ?? 'easy',
			round: 0,
			strikes: 0,
			history: []
		});
		return code;
	}
});

export const join = mutation({
	args: { code: v.string(), playerId: v.string(), name: v.string() },
	handler: async (ctx, { code, playerId, name }) => {
		const room = await ctx.db
			.query('bombRooms')
			.withIndex('by_code', (q) => q.eq('code', code.trim().toUpperCase()))
			.unique();
		if (!room) throw new ConvexError('No room with that code');
		if (room.players.some((p) => p.id === playerId)) return room.code;
		if (room.players.length >= 2) throw new ConvexError('This room already has two players');
		await ctx.db.patch(room._id, {
			players: [...room.players, { id: playerId, name: cleanName(name) }],
			status: 'briefing'
		});
		return room.code;
	}
});

/** Briefing: change the difficulty or swap who defuses. */
export const configure = mutation({
	args: {
		roomId: v.id('bombRooms'),
		playerId: v.string(),
		difficulty: v.optional(difficulty),
		swap: v.optional(v.boolean())
	},
	handler: async (ctx, { roomId, playerId, difficulty, swap }) => {
		const room = await loadRoom(ctx, roomId);
		requireMember(room, playerId);
		if (room.status === 'live') throw new ConvexError('The bomb is already ticking');
		const other = room.players.find((p) => p.id !== room.defuserId);
		await ctx.db.patch(roomId, {
			difficulty: difficulty ?? room.difficulty,
			defuserId: swap && other ? other.id : room.defuserId
		});
	}
});

export const start = mutation({
	args: { roomId: v.id('bombRooms'), playerId: v.string() },
	handler: async (ctx, { roomId, playerId }) => {
		const room = await loadRoom(ctx, roomId);
		requireMember(room, playerId);
		if (room.players.length < 2) throw new ConvexError('Wait for your partner to join');
		if (room.status === 'live') throw new ConvexError('The bomb is already ticking');
		const startedAt = Date.now() + COUNTDOWN_MS;
		const deadline = startedAt + DIFFICULTIES[room.difficulty].seconds * 1000;
		const round = room.round + 1;
		await ctx.db.patch(roomId, {
			status: 'live',
			round,
			bomb: generateBomb(room.difficulty),
			startedAt,
			deadline,
			endedAt: undefined,
			strikes: 0,
			cause: undefined,
			lastStrike: undefined
		});
		await ctx.scheduler.runAt(deadline, internal.defuse.timeout, { roomId, round });
	}
});

/** Fires at the deadline; a no-op if the round already ended or the clock moved. */
export const timeout = internalMutation({
	args: { roomId: v.id('bombRooms'), round: v.number() },
	handler: async (ctx, { roomId, round }) => {
		const room = await ctx.db.get(roomId);
		if (!room || room.status !== 'live' || room.round !== round) return;
		if (Date.now() < room.deadline!) return;
		await finish(ctx, room, { status: 'exploded', cause: 'time', now: room.deadline! });
	}
});

async function finish(
	ctx: MutationCtx,
	room: Room,
	end: {
		status: 'defused' | 'exploded';
		cause?: 'time' | 'strikes';
		now: number;
		strikes?: number;
		deadline?: number;
		modules?: BombModule[];
	}
) {
	const deadline = end.deadline ?? room.deadline!;
	const strikes = end.strikes ?? room.strikes;
	const defuser = room.players.find((p) => p.id === room.defuserId)!;
	const expert = room.players.find((p) => p.id !== room.defuserId)!;
	await ctx.db.patch(room._id, {
		status: end.status,
		cause: end.cause,
		endedAt: end.now,
		strikes,
		deadline,
		bomb: end.modules ? { ...room.bomb!, modules: end.modules } : room.bomb,
		history: [
			{
				round: room.round,
				difficulty: room.difficulty,
				defuserName: defuser.name,
				expertName: expert.name,
				defused: end.status === 'defused',
				msLeft: Math.max(0, deadline - end.now),
				strikes
			},
			...room.history
		].slice(0, MAX_HISTORY)
	});
}

/** Load a live room for a move on one module, or explode it if time already ran out. */
async function liveModule(
	ctx: MutationCtx,
	roomId: Id<'bombRooms'>,
	playerId: string,
	index: number
) {
	const room = await loadRoom(ctx, roomId);
	if (room.status !== 'live' || !room.bomb) throw new ConvexError('The bomb is not live');
	if (room.defuserId !== playerId) throw new ConvexError('Only the defuser can touch the bomb');
	const now = Date.now();
	if (now < room.startedAt!) throw new ConvexError('Wait for the countdown');
	const module = room.bomb.modules[index];
	if (!module) throw new ConvexError('No such module');
	if (now >= room.deadline!) {
		await finish(ctx, room, { status: 'exploded', cause: 'time', now: room.deadline! });
		return null;
	}
	return { room, bomb: room.bomb, module, now, manual: generateManual(room.bomb.seed) };
}

/** Save a module after a move: apply any strike, then check for a win or a boom. */
async function commit(
	ctx: MutationCtx,
	room: Room,
	index: number,
	module: BombModule,
	struck: boolean,
	now: number
) {
	const modules = room.bomb!.modules.map((m, i) => (i === index ? module : m));
	const strikes = room.strikes + (struck ? 1 : 0);
	const deadline = room.deadline! - (struck ? STRIKE_PENALTY_MS : 0);

	if (strikes >= MAX_STRIKES) {
		return finish(ctx, room, { status: 'exploded', cause: 'strikes', now, strikes, deadline, modules });
	}
	if (now >= deadline) {
		return finish(ctx, room, { status: 'exploded', cause: 'time', now: deadline, strikes, deadline, modules });
	}
	if (modules.every((m) => m.solved)) {
		return finish(ctx, room, { status: 'defused', now, strikes, deadline, modules });
	}
	await ctx.db.patch(room._id, {
		bomb: { ...room.bomb!, modules },
		strikes,
		deadline,
		lastStrike: struck ? { module: index, at: now } : room.lastStrike
	});
	if (struck) {
		await ctx.scheduler.runAt(deadline, internal.defuse.timeout, { roomId: room._id, round: room.round });
	}
}

const moveArgs = { roomId: v.id('bombRooms'), playerId: v.string(), module: v.number() };

export const cutWire = mutation({
	args: { ...moveArgs, wire: v.number() },
	handler: async (ctx, { roomId, playerId, module: index, wire }) => {
		const live = await liveModule(ctx, roomId, playerId, index);
		if (!live) return;
		const { room, bomb, module, now, manual } = live;
		if (module.type !== 'wires' || module.solved) return;
		if (module.cut.includes(wire) || wire < 0 || wire >= module.wires.length) return;
		const correct = wireToCut(module.wires, bomb, manual) === wire;
		await commit(
			ctx,
			room,
			index,
			{ ...module, cut: [...module.cut, wire], solved: correct },
			!correct,
			now
		);
	}
});

export const pressButton = mutation({
	args: moveArgs,
	handler: async (ctx, { roomId, playerId, module: index }) => {
		const live = await liveModule(ctx, roomId, playerId, index);
		if (!live) return;
		const { room, module, now } = live;
		if (module.type !== 'button' || module.solved || module.holdingSince) return;
		await commit(ctx, room, index, { ...module, holdingSince: now }, false, now);
	}
});

export const releaseButton = mutation({
	args: moveArgs,
	handler: async (ctx, { roomId, playerId, module: index }) => {
		const live = await liveModule(ctx, roomId, playerId, index);
		if (!live) return;
		const { room, bomb, module, now, manual } = live;
		if (module.type !== 'button' || module.solved || !module.holdingSince) return;
		const held = now - module.holdingSince;
		let correct: boolean;
		if (buttonAction(module.color, module.label, bomb, manual) === 'tap') {
			correct = held < TAP_MS;
		} else {
			// Accept what the timer showed a moment ago too, to forgive the network round trip.
			const digit = String(manual.button.strip[module.strip]);
			correct =
				held >= TAP_MS &&
				[now, now - 800].some((t) => formatTimer(room.deadline! - t).includes(digit));
		}
		await commit(ctx, room, index, { ...module, holdingSince: undefined, solved: correct }, !correct, now);
	}
});

export const pressKey = mutation({
	args: { ...moveArgs, key: v.number() },
	handler: async (ctx, { roomId, playerId, module: index, key }) => {
		const live = await liveModule(ctx, roomId, playerId, index);
		if (!live) return;
		const { room, module, now, manual } = live;
		if (module.type !== 'keypad' || module.solved) return;
		if (module.pressed.includes(key) || key < 0 || key >= module.symbols.length) return;
		const order = keypadOrder(module.symbols, manual);
		const correct = module.symbols[key] === order[module.pressed.length];
		const pressed = correct ? [...module.pressed, key] : module.pressed;
		await commit(
			ctx,
			room,
			index,
			{ ...module, pressed, solved: pressed.length === module.symbols.length },
			!correct,
			now
		);
	}
});

export const pressSimon = mutation({
	args: { ...moveArgs, color: v.string() },
	handler: async (ctx, { roomId, playerId, module: index, color }) => {
		const live = await liveModule(ctx, roomId, playerId, index);
		if (!live) return;
		const { room, bomb, module, now, manual } = live;
		if (module.type !== 'simon' || module.solved) return;
		const expected = simonPress(module.sequence[module.input], bomb, room.strikes, manual);
		if (color !== expected) {
			// A wrong colour restarts the current stage.
			return commit(ctx, room, index, { ...module, input: 0 }, true, now);
		}
		const input = module.input + 1;
		const stageDone = input === module.stage;
		const solved = stageDone && module.stage === module.sequence.length;
		await commit(
			ctx,
			room,
			index,
			{
				...module,
				input: stageDone ? 0 : input,
				stage: stageDone && !solved ? module.stage + 1 : module.stage,
				solved
			},
			false,
			now
		);
	}
});

/** After a round: back to the briefing with roles swapped. */
export const again = mutation({
	args: { roomId: v.id('bombRooms'), playerId: v.string() },
	handler: async (ctx, { roomId, playerId }) => {
		const room = await loadRoom(ctx, roomId);
		requireMember(room, playerId);
		if (room.status !== 'defused' && room.status !== 'exploded') return;
		const other = room.players.find((p) => p.id !== room.defuserId);
		await ctx.db.patch(roomId, {
			status: 'briefing',
			defuserId: other?.id ?? room.defuserId,
			bomb: undefined,
			startedAt: undefined,
			deadline: undefined,
			endedAt: undefined,
			strikes: 0,
			cause: undefined,
			lastStrike: undefined
		});
	}
});
