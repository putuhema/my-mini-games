import type { FunctionReturnType } from 'convex/server';
import type { api } from '../../../convex/_generated/api';
import {
	BUBBLE_MS,
	HAIRS,
	motionAt,
	needsAt,
	SAY_MS,
	SEATS,
	seatAt,
	SHIRTS,
	type Hair,
	type Point,
	type Shirt
} from '../../../convex/creature/world';
import { isSidePose, seatDepth, type CatLook, type CatPose, type Eyes, type Facing } from './art';

/** The room this device last played in, for "Back to our room". */
export const LAST_ROOM_KEY = 'ldr.creatureRoom';
const LOOK_KEY = 'ldr.creatureLook';

export function loadLook(): { shirt: Shirt; hair: Hair } {
	try {
		const look = JSON.parse(localStorage.getItem(LOOK_KEY) ?? '{}');
		return {
			shirt: SHIRTS.includes(look.shirt) ? look.shirt : 'pink',
			hair: HAIRS.includes(look.hair) ? look.hair : 'short'
		};
	} catch {
		return { shirt: 'pink', hair: 'short' };
	}
}

export const saveLook = (look: { shirt: Shirt; hair: Hair }) => localStorage.setItem(LOOK_KEY, JSON.stringify(look));

export type View = NonNullable<FunctionReturnType<typeof api.pets.get>>;
export type Couple = View['couple'];
export type PetView = NonNullable<View['pet']>;
export type PresenceRow = FunctionReturnType<typeof api.pets.presence>[number];
export type Motion = PresenceRow['motion'];

/** What the cat is up to. Most come straight from the server's `activity.kind`. */
export type Pose =
	| 'box'
	| 'wiggle'
	| 'idle'
	| 'walk'
	| 'run'
	| 'happy'
	| 'sad'
	| 'eat'
	| 'pounce'
	| 'pet'
	| 'brush'
	| 'bath'
	| 'sleep'
	| 'excited'
	| 'sit'
	| 'hide'
	| 'loaf'
	| 'groom'
	| 'stretch'
	| 'knead'
	| 'spin'
	| 'stare'
	| 'chatter'
	| 'vibe'
	| 'scratch'
	| 'knock'
	| 'bonk';

export const asleep = (pet: PetView, t: number) => !!pet.sleep && t >= pet.sleep.since && t < pet.sleep.until;

export const activityAt = (pet: PetView, t: number) =>
	pet.activity && t >= pet.activity.start && t < pet.activity.until ? pet.activity : null;

/** What the cat is doing at time `t`, from the server's state. */
export function poseAt(pet: PetView, t: number): Pose {
	const act = activityAt(pet, t)?.kind ?? null;
	if (pet.stage === 'box') return act === 'wiggle' ? 'wiggle' : 'box';
	const m = motionAt(pet.motion, t);
	if (m.moving) {
		const speed = Math.hypot(m.dx, m.dy) && pet.motion.dur ? pathLength(pet.motion) / (pet.motion.dur / 1000) : 0;
		return speed > 45 ? 'run' : 'walk';
	}
	if (act) return (act === 'play' ? 'pounce' : act === 'clean' ? 'brush' : act) as Pose;
	if (asleep(pet, t)) return 'sleep';
	const n = needsAt(pet, t);
	if (n.happiness < 30 || n.hunger < 22) return 'sad';
	return 'idle';
}

function pathLength(m: Motion) {
	const pts = [m.fx, m.fy, ...(m.via ?? []), m.tx, m.ty];
	let d = 0;
	for (let i = 2; i + 1 < pts.length; i += 2) d += Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]);
	return d;
}

const frame = (t: number, ms: number, n: number) => Math.floor(t / ms) % n;

/** The cat's sprite for a pose at time `t`: which drawing, which face, how high it hops. */
export function catLookFor(pose: Pose, t: number, dirty: boolean): CatLook & { hop: number; spin?: boolean } {
	const blink = t % 3800 < 160;
	const eyes: Eyes = blink ? 'closed' : 'open';
	const sit = (look: Partial<CatLook>, hop = 0) => ({ pose: 'sit' as CatPose, eyes, mouth: 'none' as const, dirty, hop, ...look });
	switch (pose) {
		case 'walk':
			return { pose: frame(t, 170, 2) ? 'walk1' : 'walk2', eyes, mouth: 'none', dirty, hop: 0 };
		case 'run':
			return { pose: frame(t, 90, 2) ? 'run1' : 'run2', eyes: 'open', mouth: 'none', dirty, hop: frame(t, 90, 2) ? -1 : 0 };
		case 'happy':
		case 'bonk':
			return sit({ eyes: 'happy', mouth: 'smile', blush: true }, [0, -1, -2, -1][frame(t, 120, 4)]);
		case 'excited':
			return sit({ eyes: 'wide', mouth: 'open' }, [0, -2, -4, -2][frame(t, 90, 4)]);
		case 'sad':
			return sit({ eyes: 'sad', mouth: 'frown' });
		case 'eat':
			return { pose: 'eat', eyes: frame(t, 220, 2) ? 'closed' : 'happy', mouth: 'none', dirty, hop: frame(t, 220, 2) };
		case 'pounce':
		case 'scratch': {
			const f = frame(t, pose === 'scratch' ? 150 : 200, 4);
			return f < 2
				? { pose: 'stretch', eyes: 'wide', mouth: 'none', dirty, hop: 0 }
				: { pose: 'pounce', eyes: 'wide', mouth: 'open', dirty, hop: f === 2 ? -4 : -2 };
		}
		case 'knock':
			return { pose: frame(t, 300, 2) ? 'pounce' : 'walk1', eyes: 'open', mouth: 'none', dirty, hop: 0 };
		case 'pet':
		case 'brush':
			return sit({ eyes: 'closed', mouth: 'smile', blush: true }, frame(t, 300, 2));
		case 'bath':
			return sit({ eyes: frame(t, 600, 2) ? 'sad' : 'closed', mouth: 'frown', dirty: false });
		case 'sleep':
			return { pose: 'curl', eyes: 'closed', mouth: 'none', dirty, hop: frame(t, 1100, 2) };
		case 'loaf':
			return { pose: 'loaf', eyes: t % 5200 < 2600 ? 'closed' : 'open', mouth: 'none', dirty, hop: 0 };
		case 'groom':
			return frame(t, 320, 3) === 2 ? sit({ eyes: 'closed' }) : { ...sit({ eyes: 'closed' }), pose: 'groom' };
		case 'stretch':
			return { pose: 'stretch', eyes: 'closed', mouth: 'open', dirty, hop: 0 };
		case 'knead':
			return sit({ pose: frame(t, 260, 2) ? 'knead1' : 'knead2', eyes: 'closed', mouth: 'smile' });
		case 'spin':
			return { pose: frame(t, 110, 2) ? 'run1' : 'run2', eyes: 'wide', mouth: 'open', dirty, hop: 0, spin: true };
		case 'stare':
		case 'hide':
			return sit({ eyes: 'wide' });
		case 'chatter':
			return sit({ eyes: 'wide', mouth: frame(t, 130, 2) ? 'open' : 'none' });
		case 'vibe':
			return sit({ eyes: 'happy', mouth: 'smile' }, [0, -1][frame(t, 260, 2)]);
		case 'sit':
			return sit({ mouth: 'smile' });
		default:
			return sit({});
	}
}

/** Which way the cat faces on screen: true means flipped (looking left). */
export function catFlip(m: Motion, t: number, spin: boolean) {
	if (spin) return Math.floor(t / 220) % 2 === 0;
	const p = motionAt(m, t);
	const screenDx = p.dx - p.dy;
	return screenDx < 0;
}

/** Where a walker is facing on screen, from their latest walk. */
export function facingOf(m: Motion, t: number): Facing {
	const p = motionAt(m, t);
	if (Math.abs(p.dx) < 1 && Math.abs(p.dy) < 1) return 'down';
	const sx = p.dx - p.dy;
	const sy = (p.dx + p.dy) / 2;
	if (Math.abs(sx) >= Math.abs(sy) * 1.2) return sx < 0 ? 'left' : 'right';
	return sy < 0 ? 'up' : 'down';
}

/** How high off the floor the cat is (on furniture), with a little arc as it hops up or down. */
export function liftAt(m: Motion, t: number): { z: number; depth?: number } {
	const p = motionAt(m, t);
	const here = seatAt(p);
	if (here && !p.moving) return { z: SEATS[here].z, depth: seatDepth(SEATS[here].on) };
	if (!p.moving) return { z: 0 };
	const to = seatAt({ x: m.tx, y: m.ty });
	const from = seatAt({ x: m.fx, y: m.fy });
	const hop = (seat: keyof typeof SEATS, d: number) => {
		const k = Math.max(0, 1 - d / 12);
		return { z: SEATS[seat].z * k + Math.sin(k * Math.PI) * 4, depth: k > 0.3 ? seatDepth(SEATS[seat].on) : undefined };
	};
	if (to) {
		const d = Math.hypot(p.x - m.tx, p.y - m.ty);
		if (d < 12) return hop(to, d);
	}
	if (from) {
		const d = Math.hypot(p.x - m.fx, p.y - m.fy);
		if (d < 12) return hop(from, d);
	}
	return { z: 0 };
}

export const speaking = (pet: PetView, t: number) => (pet.say && t >= pet.say.at && t < pet.say.at + SAY_MS ? pet.say.text : null);

export const bubbleUp = (b: { at: number } | undefined, t: number) => !!b && t >= b.at - 500 && t < b.at + BUBBLE_MS;

export const still = (p: Point): Motion => ({ fx: p.x, fy: p.y, tx: p.x, ty: p.y, at: 0, dur: 0 });

export { isSidePose };
