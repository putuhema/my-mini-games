import type { FunctionReturnType } from 'convex/server';
import type { api } from '../../../convex/_generated/api';

/** The room this device last played in, for "Back to room" after a refresh or a closed tab. */
export const LAST_ROOM_KEY = 'ldr.burgerRoom';

export type RoomView = NonNullable<FunctionReturnType<typeof api.kitchen.get>>;
export type Result = RoomView['results'][number];

export const money = (n: number) => `$${n.toFixed(2)}`;

export function formatSeconds(ms: number) {
	const s = Math.ceil(ms / 1000);
	return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Partners count as gone after this long without a heartbeat. Generous, because background
 * tabs may only fire timers once a minute. */
export const OFFLINE_AFTER_MS = 70_000;
export const HEARTBEAT_MS = 8_000;
