import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';

const MAX_TEXT = 300;
const MAX_PER_AUTHOR = 30;

/** The caller's own secret questions (their partner can't read them until asked). */
export const mine = query({
	args: { roomId: v.id('rooms'), playerId: v.string() },
	handler: async (ctx, { roomId, playerId }) => {
		return await ctx.db
			.query('customQuestions')
			.withIndex('by_room_author', (q) => q.eq('roomId', roomId).eq('authorId', playerId))
			.order('desc')
			.collect();
	}
});

/** How many unasked secret questions the partner has written for the caller — a count only. */
export const incomingCount = query({
	args: { roomId: v.id('rooms'), playerId: v.string() },
	handler: async (ctx, { roomId, playerId }) => {
		const room = await ctx.db.get(roomId);
		const partner = room?.players.find((p) => p.id !== playerId);
		if (!partner) return 0;
		const waiting = await ctx.db
			.query('customQuestions')
			.withIndex('by_room_author', (q) => q.eq('roomId', roomId).eq('authorId', partner.id))
			.filter((q) => q.eq(q.field('usedAt'), undefined))
			.collect();
		return waiting.length;
	}
});

export const add = mutation({
	args: { roomId: v.id('rooms'), playerId: v.string(), text: v.string() },
	handler: async (ctx, { roomId, playerId, text }) => {
		const room = await ctx.db.get(roomId);
		const author = room?.players.find((p) => p.id === playerId);
		if (!room || !author) throw new ConvexError('Not in this room');

		const trimmed = text.trim().slice(0, MAX_TEXT);
		if (!trimmed) throw new ConvexError('Write a question first');

		const existing = await ctx.db
			.query('customQuestions')
			.withIndex('by_room_author', (q) => q.eq('roomId', roomId).eq('authorId', playerId))
			.collect();
		if (existing.length >= MAX_PER_AUTHOR) {
			throw new ConvexError(`You can write up to ${MAX_PER_AUTHOR} secret questions`);
		}

		await ctx.db.insert('customQuestions', {
			roomId,
			authorId: playerId,
			authorName: author.name,
			text: trimmed
		});
	}
});

export const remove = mutation({
	args: { id: v.id('customQuestions'), playerId: v.string() },
	handler: async (ctx, { id, playerId }) => {
		const question = await ctx.db.get(id);
		if (!question || question.authorId !== playerId) throw new ConvexError('Question not found');
		if (question.usedAt) throw new ConvexError('That question has already been asked');
		await ctx.db.delete(id);
	}
});
