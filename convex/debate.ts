import { ConvexError, v, type Infer } from 'convex/values';
import { internal } from './_generated/api';
import { internalMutation, internalQuery, mutation, query, type MutationCtx } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { debateVerdict } from './schema';
import { CODE_CHARS, cleanName } from './rooms';
import {
	fallbackScores,
	MAX_TOPIC,
	other,
	randomTopic,
	ROUND_INFO,
	ROUNDS,
	total,
	type Round,
	type Side
} from './debate/rules';

type Room = Doc<'debateRooms'>;
type Verdict = Infer<typeof debateVerdict>;

const MAX_HISTORY = 20;

async function loadRoom(ctx: MutationCtx, roomId: Id<'debateRooms'>) {
	const room = await ctx.db.get(roomId);
	if (!room) throw new ConvexError('Room not found');
	return room;
}

function sideOf(room: Room, playerId: string): Side | undefined {
	if (!room.players.some((p) => p.id === playerId)) return undefined;
	return room.proId === playerId ? 'pro' : 'con';
}

function requireSide(room: Room, playerId: string) {
	const side = sideOf(room, playerId);
	if (!side) throw new ConvexError('You are not in this debate');
	return side;
}

const isRound = (phase: Room['phase']): phase is Round => (ROUNDS as string[]).includes(phase);

/** Open a round and its clock. */
async function startRound(ctx: MutationCtx, room: Room, round: Round, patch: Partial<Room> = {}) {
	const deadline = Date.now() + ROUND_INFO[round].seconds * 1000;
	await ctx.db.patch(room._id, { ...patch, phase: round, deadline });
	await ctx.scheduler.runAt(deadline, internal.debate.roundTimeout, { roomId: room._id, deadline });
}

/** Move on once both sides have spoken (or the clock ran out). */
async function finishRound(ctx: MutationCtx, room: Room, speeches: Room['speeches']) {
	if (!isRound(room.phase)) return;
	const next = ROUNDS[ROUNDS.indexOf(room.phase) + 1];
	if (next) {
		await startRound(ctx, room, next, { speeches });
	} else {
		await ctx.db.patch(room._id, { speeches, phase: 'judging', deadline: undefined });
		await ctx.scheduler.runAfter(0, internal.debateJudge.judge, { roomId: room._id, debate: room.debate });
	}
}

// ---------- Queries ----------

export const get = query({
	args: { code: v.string(), playerId: v.string() },
	handler: async (ctx, { code, playerId }) => {
		const room = await ctx.db
			.query('debateRooms')
			.withIndex('by_code', (q) => q.eq('code', code.toUpperCase()))
			.unique();
		if (!room) return null;
		const me = sideOf(room, playerId);
		// The opponent's speech for the round in progress stays sealed: you only learn that it's in.
		const speeches = room.speeches.map((s) =>
			s.round === room.phase && s.side !== me ? { ...s, text: '', sealed: true } : { ...s, sealed: false }
		);
		return { ...room, speeches, me };
	}
});

/** Server time, so clients can line their clocks up with the server's. */
export const now = mutation({ args: {}, handler: async () => Date.now() });

// ---------- Lobby ----------

export const create = mutation({
	args: { playerId: v.string(), name: v.string() },
	handler: async (ctx, { playerId, name }) => {
		let code = '';
		for (let attempt = 0; attempt < 10; attempt++) {
			code = Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
			const existing = await ctx.db
				.query('debateRooms')
				.withIndex('by_code', (q) => q.eq('code', code))
				.unique();
			if (!existing) break;
		}
		await ctx.db.insert('debateRooms', {
			code,
			phase: 'waiting',
			players: [{ id: playerId, name: cleanName(name) }],
			proId: playerId,
			topic: randomTopic().text,
			debate: 0,
			speeches: [],
			history: []
		});
		return code;
	}
});

export const join = mutation({
	args: { code: v.string(), playerId: v.string(), name: v.string() },
	handler: async (ctx, { code, playerId, name }) => {
		const room = await ctx.db
			.query('debateRooms')
			.withIndex('by_code', (q) => q.eq('code', code.trim().toUpperCase()))
			.unique();
		if (!room) throw new ConvexError('No room with that code');
		if (room.players.some((p) => p.id === playerId)) return room.code;
		if (room.players.length >= 2) throw new ConvexError('This room already has two debaters');
		await ctx.db.patch(room._id, {
			players: [...room.players, { id: playerId, name: cleanName(name) }],
			phase: 'lobby'
		});
		return room.code;
	}
});

function requireLobby(room: Room) {
	if (room.phase !== 'lobby' && room.phase !== 'waiting') throw new ConvexError('The debate has already started');
}

export const shuffleTopic = mutation({
	args: {
		roomId: v.id('debateRooms'),
		playerId: v.string(),
		kind: v.optional(v.union(v.literal('light'), v.literal('spicy'), v.literal('deep')))
	},
	handler: async (ctx, { roomId, playerId, kind }) => {
		const room = await loadRoom(ctx, roomId);
		requireSide(room, playerId);
		requireLobby(room);
		await ctx.db.patch(roomId, { topic: randomTopic(kind, room.topic).text });
	}
});

export const setTopic = mutation({
	args: { roomId: v.id('debateRooms'), playerId: v.string(), topic: v.string() },
	handler: async (ctx, { roomId, playerId, topic }) => {
		const room = await loadRoom(ctx, roomId);
		requireSide(room, playerId);
		requireLobby(room);
		const clean = topic.trim().replace(/\s+/g, ' ').slice(0, MAX_TOPIC);
		if (clean.length < 5) throw new ConvexError('Write a topic first');
		await ctx.db.patch(roomId, { topic: clean });
	}
});

export const swapSides = mutation({
	args: { roomId: v.id('debateRooms'), playerId: v.string() },
	handler: async (ctx, { roomId, playerId }) => {
		const room = await loadRoom(ctx, roomId);
		requireSide(room, playerId);
		requireLobby(room);
		const con = room.players.find((p) => p.id !== room.proId);
		if (con) await ctx.db.patch(roomId, { proId: con.id });
	}
});

export const start = mutation({
	args: { roomId: v.id('debateRooms'), playerId: v.string() },
	handler: async (ctx, { roomId, playerId }) => {
		const room = await loadRoom(ctx, roomId);
		requireSide(room, playerId);
		if (room.phase !== 'lobby') throw new ConvexError('Wait for your opponent to join');
		await startRound(ctx, room, 'opening', { speeches: [], verdict: undefined });
	}
});

// ---------- Rounds ----------

export const speak = mutation({
	args: { roomId: v.id('debateRooms'), playerId: v.string(), text: v.string() },
	handler: async (ctx, { roomId, playerId, text }) => {
		const room = await loadRoom(ctx, roomId);
		const side = requireSide(room, playerId);
		const round = room.phase;
		if (!isRound(round)) throw new ConvexError('No round is open');
		if (room.speeches.some((s) => s.round === round && s.side === side)) {
			throw new ConvexError('You already submitted this round');
		}
		const clean = text.trim().slice(0, ROUND_INFO[round].max);
		if (!clean) throw new ConvexError('Write your argument first');
		const speeches = [...room.speeches, { round, side, text: clean, at: Date.now() }];
		if (speeches.some((s) => s.round === round && s.side === other(side))) {
			await finishRound(ctx, room, speeches);
		} else {
			await ctx.db.patch(roomId, { speeches });
		}
	}
});

/** The clock ran out: whoever hasn't spoken stays silent this round. */
export const roundTimeout = internalMutation({
	args: { roomId: v.id('debateRooms'), deadline: v.number() },
	handler: async (ctx, { roomId, deadline }) => {
		const room = await ctx.db.get(roomId);
		if (!room || room.deadline !== deadline || !isRound(room.phase)) return;
		const round = room.phase;
		const silent = (['pro', 'con'] as const)
			.filter((side) => !room.speeches.some((s) => s.round === round && s.side === side))
			.map((side) => ({ round, side, text: '', at: deadline }));
		await finishRound(ctx, room, [...room.speeches, ...silent]);
	}
});

// ---------- Verdict ----------

export const transcript = internalQuery({
	args: { roomId: v.id('debateRooms'), debate: v.number() },
	handler: async (ctx, { roomId, debate }) => {
		const room = await ctx.db.get(roomId);
		if (!room || room.debate !== debate || room.phase !== 'judging') return null;
		const name = (side: Side) =>
			room.players.find((p) => (side === 'pro' ? p.id === room.proId : p.id !== room.proId))?.name ?? side;
		return { topic: room.topic, speeches: room.speeches, names: { pro: name('pro'), con: name('con') } };
	}
});

function fallbackVerdict(room: Room): Verdict {
	const pro = fallbackScores(room.speeches, 'pro');
	const con = fallbackScores(room.speeches, 'con');
	const diff = total(pro) - total(con);
	const winner = Math.abs(diff) < 2 ? 'tie' : diff > 0 ? 'pro' : 'con';
	const side = (scores: typeof pro) => ({
		scores,
		best: '',
		missed: '',
		tip: scores.evidence < 5 ? 'Back your claims with a concrete example or number.' : 'Quote your opponent directly, then answer it.'
	});
	return {
		winner,
		by: 'fallback',
		summary:
			'The AI judge was unavailable, so this was scored by rule of thumb: reasons and examples given, ' +
			"and how much each side picked up the other's points.",
		turningPoint: '',
		pro: side(pro),
		con: side(con)
	};
}

export const decide = internalMutation({
	args: { roomId: v.id('debateRooms'), debate: v.number(), verdict: v.optional(debateVerdict) },
	handler: async (ctx, { roomId, debate, verdict }) => {
		const room = await ctx.db.get(roomId);
		if (!room || room.debate !== debate || room.phase !== 'judging') return;
		const final = verdict ?? fallbackVerdict(room);
		const name = (side: Side) =>
			room.players.find((p) => (side === 'pro' ? p.id === room.proId : p.id !== room.proId))?.name ?? '';
		await ctx.db.patch(roomId, {
			phase: 'verdict',
			verdict: final,
			history: [
				...room.history,
				{ topic: room.topic, proName: name('pro'), conName: name('con'), winner: final.winner }
			].slice(-MAX_HISTORY)
		});
	}
});

/** Back to the lobby with a fresh topic and the sides swapped. */
export const again = mutation({
	args: { roomId: v.id('debateRooms'), playerId: v.string() },
	handler: async (ctx, { roomId, playerId }) => {
		const room = await loadRoom(ctx, roomId);
		requireSide(room, playerId);
		if (room.phase !== 'verdict') throw new ConvexError('The debate is not over yet');
		const con = room.players.find((p) => p.id !== room.proId);
		await ctx.db.patch(roomId, {
			phase: 'lobby',
			debate: room.debate + 1,
			proId: con?.id ?? room.proId,
			topic: randomTopic(undefined, room.topic).text,
			speeches: [],
			verdict: undefined,
			deadline: undefined
		});
	}
});
