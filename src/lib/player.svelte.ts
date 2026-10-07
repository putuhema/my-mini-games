import { ConvexError } from 'convex/values';

const ID_KEY = 'ldr.playerId';
const NAME_KEY = 'ldr.name';

function loadId() {
	let id = localStorage.getItem(ID_KEY);
	if (!id) {
		// crypto.randomUUID is unavailable on insecure origins (e.g. LAN IPs over http).
		id = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
			b.toString(16).padStart(2, '0')
		).join('');
		localStorage.setItem(ID_KEY, id);
	}
	return id;
}

/** This device's player identity, persisted in localStorage. */
export const me = $state({
	id: loadId(),
	name: localStorage.getItem(NAME_KEY) ?? ''
});

export function saveName(name: string) {
	me.name = name.trim();
	localStorage.setItem(NAME_KEY, me.name);
}

export function errorMessage(err: unknown) {
	if (err instanceof ConvexError) return String(err.data);
	return 'Something went wrong — please try again.';
}
