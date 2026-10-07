import { PUBLIC_VAPID_KEY } from '$app/env/public';
import { getConvexClient } from 'convex-svelte';
import { api } from '../../convex/_generated/api';
import { me } from './player.svelte.ts';

export type ReminderState = 'unsupported' | 'needs-install' | 'blocked' | 'off' | 'on';

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () =>
	matchMedia('(display-mode: standalone)').matches ||
	(navigator as Navigator & { standalone?: boolean }).standalone === true;

function urlBase64ToUint8Array(base64: string) {
	const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
	return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

export async function reminderState(): Promise<ReminderState> {
	const supported =
		!!PUBLIC_VAPID_KEY && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
	if (!supported) {
		// iPhone Safari only allows push once the site is added to the Home Screen.
		return isIos() && !isStandalone() ? 'needs-install' : 'unsupported';
	}
	if (Notification.permission === 'denied') return 'blocked';
	const registration = await navigator.serviceWorker.getRegistration();
	const subscription = await registration?.pushManager.getSubscription();
	return subscription && Notification.permission === 'granted' ? 'on' : 'off';
}

export async function enableReminders(): Promise<ReminderState> {
	const permission = await Notification.requestPermission();
	if (permission !== 'granted') return permission === 'denied' ? 'blocked' : 'off';

	const registration = await navigator.serviceWorker.ready;
	const subscription =
		(await registration.pushManager.getSubscription()) ??
		(await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY!)
		}));
	const json = subscription.toJSON();
	await getConvexClient().mutation(api.pushSubscriptions.subscribe, {
		playerId: me.id,
		endpoint: subscription.endpoint,
		p256dh: json.keys!.p256dh,
		auth: json.keys!.auth
	});
	return 'on';
}

export async function disableReminders(): Promise<ReminderState> {
	const registration = await navigator.serviceWorker.getRegistration();
	const subscription = await registration?.pushManager.getSubscription();
	if (subscription) {
		await getConvexClient().mutation(api.pushSubscriptions.unsubscribe, {
			endpoint: subscription.endpoint
		});
		await subscription.unsubscribe();
	}
	return 'off';
}
