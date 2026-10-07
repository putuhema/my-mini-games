/// <reference lib="webworker" />
// Receives turn reminders (Web Push) and opens the room when one is tapped.
declare const self: ServiceWorkerGlobalScope;

type Reminder = { title: string; body: string; url: string; tag: string };

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
	const data = (event.data?.json() ?? {}) as Partial<Reminder>;
	event.waitUntil(
		(async () => {
			// Skip the system notification if they're already looking at this room.
			const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
			const watching = windows.some(
				(w) => w.visibilityState === 'visible' && data.url && new URL(w.url).pathname === data.url
			);
			if (watching) return;
			await self.registration.showNotification(data.title ?? 'Us, Apart', {
				body: data.body,
				tag: data.tag,
				icon: '/icon-192.png',
				badge: '/icon-192.png',
				data: { url: data.url ?? '/' }
			});
		})()
	);
});

self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const url = (event.notification.data as { url?: string })?.url ?? '/';
	event.waitUntil(
		(async () => {
			const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
			const existing = windows.find((w) => new URL(w.url).pathname === url);
			if (existing) return existing.focus();
			return self.clients.openWindow(url);
		})()
	);
});
