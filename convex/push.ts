'use node';

import { v } from 'convex/values';
import webpush from 'web-push';
import { internal } from './_generated/api';
import { internalAction } from './_generated/server';

/** Send a turn reminder to every device the player has enabled reminders on. */
export const notify = internalAction({
	args: {
		playerId: v.string(),
		title: v.string(),
		body: v.string(),
		url: v.string(),
		tag: v.string()
	},
	handler: async (ctx, { playerId, ...payload }) => {
		const publicKey = process.env.VAPID_PUBLIC_KEY;
		const privateKey = process.env.VAPID_PRIVATE_KEY;
		if (!publicKey || !privateKey) {
			console.warn('Turn reminders are off: set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY');
			return { sent: 0 };
		}
		webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? 'mailto:you@example.com', publicKey, privateKey);

		const subscriptions = await ctx.runQuery(internal.pushSubscriptions.forPlayer, { playerId });
		let sent = 0;
		for (const sub of subscriptions) {
			try {
				await webpush.sendNotification(
					{ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
					JSON.stringify(payload),
					{ TTL: 60 * 60 * 24 * 7, urgency: 'normal' }
				);
				sent++;
			} catch (err) {
				const status = (err as { statusCode?: number }).statusCode;
				if (status === 404 || status === 410) {
					await ctx.runMutation(internal.pushSubscriptions.removeEndpoint, { endpoint: sub.endpoint });
				} else {
					console.error('Push failed', status, (err as Error).message);
				}
			}
		}
		return { sent };
	}
});
