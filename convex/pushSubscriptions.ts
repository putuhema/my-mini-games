import { v } from 'convex/values';
import { internalMutation, internalQuery, mutation } from './_generated/server';

export const subscribe = mutation({
	args: {
		playerId: v.string(),
		endpoint: v.string(),
		p256dh: v.string(),
		auth: v.string()
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query('pushSubscriptions')
			.withIndex('by_endpoint', (q) => q.eq('endpoint', args.endpoint))
			.unique();
		if (existing) await ctx.db.patch(existing._id, args);
		else await ctx.db.insert('pushSubscriptions', args);
	}
});

export const unsubscribe = mutation({
	args: { endpoint: v.string() },
	handler: async (ctx, { endpoint }) => {
		const existing = await ctx.db
			.query('pushSubscriptions')
			.withIndex('by_endpoint', (q) => q.eq('endpoint', endpoint))
			.unique();
		if (existing) await ctx.db.delete(existing._id);
	}
});

export const forPlayer = internalQuery({
	args: { playerId: v.string() },
	handler: async (ctx, { playerId }) => {
		return await ctx.db
			.query('pushSubscriptions')
			.withIndex('by_player', (q) => q.eq('playerId', playerId))
			.collect();
	}
});

/** Drop a subscription the push service says is gone (expired or revoked). */
export const removeEndpoint = internalMutation({
	args: { endpoint: v.string() },
	handler: async (ctx, { endpoint }) => {
		const existing = await ctx.db
			.query('pushSubscriptions')
			.withIndex('by_endpoint', (q) => q.eq('endpoint', endpoint))
			.unique();
		if (existing) await ctx.db.delete(existing._id);
	}
});
