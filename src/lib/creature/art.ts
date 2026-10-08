// All the pixel art for Our Little Creature: the isometric room and its furniture, the two
// players, the cat in every coat, size and pose, and small item icons. See pixels.ts for how
// it's drawn, and convex/creature/world.ts for the floor layout the furniture is drawn to.

import {
	CUP_SPOT,
	FURNITURE,
	ORIGIN,
	ROOM,
	SCENE_H,
	SCENE_W,
	SEATS,
	toFloor,
	toScreen,
	WALL_H,
	type Coat,
	type Evolution,
	type Hair,
	type Shirt,
	type Stage
} from '../../../convex/creature/world';
import { INK, paint, type Img, type Painter, type Pt, sprite } from './pixels';

// ---- Palette ----

const WOOD = '#b07a4f';
const WOOD_L = '#c98f5f';
const WOOD_D = '#8f5d3c';
const WOOD_HL = '#d9a571';
const EYE = '#2b1d24';
const BLUSH = '#ffa3b5';

export const SHIRT_COLOR: Record<Shirt, [string, string]> = {
	pink: ['#ff8fb1', '#d9668e'],
	mint: ['#7fe0b5', '#4fb38a'],
	amber: ['#ffc96b', '#d99a3c'],
	sky: ['#8cc4ff', '#5a93d6'],
	lilac: ['#c6a6ff', '#9575d9']
};

// ---- Item icons (fills only; outlined automatically) ----

type IconDef = { rows: string[]; colors: Record<string, string>; outline?: boolean };

const ICONS: Record<string, IconDef> = {
	kibble: {
		rows: ['...k.k...', '..kKkkk..', 'bbbbbbbbb', 'BbbbbbbbB', '.BBBBBBB.'],
		colors: { k: '#b5763f', K: '#8a5530', b: '#ff8fa3', B: '#d9667f' }
	},
	fish: {
		rows: ['...bbbb...b', '.bbbbbbb.bb', 'bbkbbbbbbbb', 'bbbbbbbbbbb', '.bBBBBBB.bb', '...BBBB...b'],
		colors: { b: '#8cc4ff', B: '#5a93d6', k: EYE }
	},
	chicken: {
		rows: ['...bbbb.', '..bbBbbb', '..bbbbbb', '..bbbbb.', '.wbbbb..', 'ww......', 'w.......'],
		colors: { b: '#d9894a', B: '#f0a866', w: '#fff4e0' }
	},
	treat: {
		rows: ['.tttt..t', 'tttktttt', 'tttttttt', '.tTTt..t'],
		colors: { t: '#d9965a', T: '#b5763f', k: '#5a3320' }
	},
	mouse: {
		rows: ['.pp......', 'pggggg...', 'gkgggggg.', '.gggggg.t', '..f..f.tt'],
		colors: { p: '#ffb3c1', g: '#a8a8b8', k: EYE, t: '#ff8fb1', f: '#7a7a8a' }
	},
	yarn: {
		rows: ['..pppp..', '.pPpppp.', 'ppPPpppp', 'pppPPppp', 'ppppPPpp', '.ppppPp.', '..pppp.t', '.......t'],
		colors: { p: '#ff8fb1', P: '#d9668e', t: '#ff8fb1' }
	},
	feather: {
		rows: ['.....ff.', '....ffff', '...ffFf.', '...fFf..', '..sf....', '.s......', 's.......'],
		colors: { f: '#7fd1ff', F: '#4fa3d9', s: '#b07a4f' }
	},
	laser: {
		rows: ['r.......', '.r......', '..r.....', '...gg...', '...ggg..', '....ggg.', '.....gg.'],
		colors: { r: '#ff3b3b', g: '#5a5a6a' }
	},
	brush: {
		rows: ['w.w.w...', 'wwwww...', 'nnnnnnnn', 'nnnnn...'],
		colors: { w: '#f4f4f4', n: WOOD }
	},
	cup: {
		rows: ['.mmmm..', 'mwwwwm.', 'mmmmmmm', 'mmmmm.m', 'mmmmmmm', '.mmmm..'],
		colors: { m: '#ff8fb1', w: '#8a5530' }
	},
	cupDown: {
		rows: ['.mmmm....', 'mmmmmm...', 'mmmmmmccc', '.mmmm.ccc'],
		colors: { m: '#ff8fb1', c: '#c9a27a' }
	},
	lamp: {
		rows: ['.yyyyy.', 'yyyyyyy', 'yyyyyyy', '...n...', '...n...', '.nnnnn.'],
		colors: { y: '#ffd166', n: '#8a6a5a' }
	},
	box: {
		rows: ['b..bbb..b', 'bbbbbbbbb', 'BBBBBBBBB', 'bbbbtbbbb', 'bbbbtbbbb', 'bbbbbbbbb'],
		colors: { b: '#d9a066', B: '#b5803f', t: '#f2dcb0' }
	},
	ball: {
		rows: ['..rrrr..', '.rwrrrr.', 'rrrrrrrr', 'yyyyyyyy', 'yyyyyyyy', 'rrrrrrrR', '.rrrrRR.', '..RRRR..'],
		colors: { r: '#ff6b6b', R: '#c94a4a', y: '#fff1a8', w: '#ffffff' }
	},
	flower: {
		rows: ['.p.p.p..', '.ppppp..', '.ppwpp..', '..ppp...', '...g.gg.', '.gg.g...', '...g....', '.vvvvv..', '.vVVVv..', '..vvv...'],
		colors: { p: '#ff6b9a', w: '#ffd166', g: '#5fbf5a', v: '#8cc4ff', V: '#5a93d6' }
	},
	star: {
		rows: ['....y....', '...yyy...', 'yyyyyyyyy', '.yyywyyy.', '..yyyyy..', '.yyy.yyy.', '.yy...yy.', '....n....', '....n....', '..nnnnn..'],
		colors: { y: '#ffd166', w: '#fff6c8', n: '#8a6a5a' }
	},
	sprout: {
		rows: ['gg...gg.', 'gGg.gGg.', '.gg.gg..', '...g....', '...g....', '.ttttt..', '.tTTTt..', '..ttt...'],
		colors: { g: '#7ccf6a', G: '#4e9a45', t: '#d9875a', T: '#b5653e' }
	},
	letter: {
		rows: ['wwwwwwwwww', 'wWwwwwwwWw', 'wwWwwwwWww', 'wwwWrrWwww', 'wwwwrrwwww', 'wwwwwwwwww', 'WWWWWWWWWW'],
		colors: { w: '#fff7ea', W: '#d9c4a8', r: '#ff6b9a' }
	},
	heart: {
		rows: ['.pp.pp.', 'pwpppPp', 'ppppppP', '.pppPP.', '..pPP..', '...P...'],
		colors: { p: '#ff6b9a', P: '#c4426f', w: '#ffd1e1' }
	},
	hug: {
		rows: ['.pp.pp.......', 'ppppppp.rr.rr', '.ppppp.rrrrrr', '..ppp...rrrr.', '...p.....rr..'],
		colors: { p: '#ff6b9a', r: '#ffa3c4' }
	},
	gift: {
		rows: ['..r...r..', '...r.r...', 'bbbbrbbbb', 'bbbbrbbbb', 'rrrrrrrrr', 'BbbbrbbbB', 'bbbbrbbbb', 'bbbbrbbbb', 'BBBBrBBBB'],
		colors: { b: '#8cc4ff', B: '#5a93d6', r: '#ff6b9a' }
	},
	moon: {
		rows: ['..yyy...', '.yy.....', 'yy......', 'yy......', 'yy......', 'yyy....y', '.yyyyyy.', '..yyyy..'],
		colors: { y: '#ffd166' }
	},
	magnifier: {
		rows: ['.ggg....', 'gwwbg...', 'gwbbg...', 'gbbbg...', '.ggg....', '....n...', '.....n..', '......nn'],
		colors: { g: '#9aa5b1', w: '#ffffff', b: '#bfe3ff', n: '#8a5a3a' }
	},
	paw: {
		rows: ['.p.pp.p.', '.p.pp.p.', '........', '..pppp..', '.pppppp.', '.pppppp.', '..pppp..'],
		colors: { p: '#c98b5a' }
	},
	sparkle: {
		rows: ['...y...', '...y...', '..yyy..', 'yyywyyy', '..yyy..', '...y...', '...y...'],
		colors: { y: '#ffd166', w: '#ffffff' }
	},
	bubble: {
		rows: ['.bbbb.', 'bw...b', 'b....b', 'b....b', 'b....b', '.bbbb.'],
		colors: { b: '#7cc8ff', w: '#ffffff' },
		outline: false
	},
	drop: {
		rows: ['..bb..', '..bb..', '.bbbb.', '.bwbb.', 'bwbbbb', 'bbbbbb', 'bbbbbB', '.bBBB.'],
		colors: { b: '#7cc8ff', B: '#4f9ad6', w: '#ffffff' }
	},
	bolt: {
		rows: ['..yyy', '.yyy.', '.yy..', 'yyyyy', '..yy.', '.yy..', '.y...', 'y....'],
		colors: { y: '#ffd166' }
	},
	door: {
		rows: ['nnnnnn', 'nNNNNn', 'nNnnNn', 'nNnnNn', 'nNNNyn', 'nNnnNn', 'nNnnNn', 'nNNNNn', 'nnnnnn'],
		colors: { n: WOOD, N: WOOD_D, y: '#ffd166' }
	},
	sofa: {
		rows: ['.pppppppp.', 'ppPPPPPPpp', 'ppPPPPPPpp', 'pppppppppp', 'pppppppppp', 'n........n'],
		colors: { p: '#6fb7b0', P: '#93d3cc', n: '#7a4a2a' }
	},
	note: {
		rows: ['...kkkk', '...kkkk', '...k..k', '...k..k', '...k..k', 'kkk.kkk', 'kkk.kkk'],
		colors: { k: '#9575d9' }
	},
	cloud: {
		rows: ['...www....', '.wwwwww...', 'wwwwwwwww.', 'wwwwwwwwww', '.WWWWWWWW.'],
		colors: { w: '#f4f8ff', W: '#c9d6ea' }
	},
	window: {
		rows: ['nnnnnnnn', 'nbbbnbbn', 'nbwbnbbn', 'nbbbnbbn', 'nnnnnnnn', 'nbbbnbbn', 'nbbbnbbn', 'nnnnnnnn'],
		colors: { n: WOOD, b: '#a8dcff', w: '#ffffff' }
	},
	laugh: {
		rows: ['..yyyy..', '.yyyyyy.', 'ykyyyyky', 'yykyykyy', 'yyyyyyyy', 'yrrrrrry', '.yrrrry.', '..yyyy..'],
		colors: { y: '#ffd166', k: EYE, r: '#c94a4a' }
	},
	cry: {
		rows: ['..yyyy..', '.yyyyyy.', 'ykyyyyky', 'ybyyyyyy', 'ybyyyyyy', 'yyykkyyy', '.yyyyyy.', '..yyyy..'],
		colors: { y: '#ffd166', k: EYE, b: '#7cc4ff' }
	},
	wow: {
		rows: ['..yyyy..', '.yyyyyy.', 'ykyyyyky', 'yyyyyyyy', 'yyykkyyy', 'yyykkyyy', '.yyyyyy.', '..yyyy..'],
		colors: { y: '#ffd166', k: EYE }
	},
	book: {
		rows: ['.rrr.rrr.', 'rwwwrwwwr', 'rwkkrkkwr', 'rwwwrwwwr', 'rwkkrkkwr', 'rwwwrwwwr', '.rrrrrrr.'],
		colors: { r: '#c94a6a', w: '#fff7ea', k: '#c9b8a0' }
	},
	z: {
		rows: ['zzzz', '..z.', '.z..', 'zzzz'],
		colors: { z: '#9575d9' },
		outline: false
	},
	hand: {
		rows: ['.s.s.s.', '.s.s.s.', 'ss.s.s.', 'sssssss', 'sssssss', '.sssss.', '..sss..'],
		colors: { s: '#ffd9b8' }
	},
	dot: {
		rows: ['.r.', 'rRr', '.r.'],
		colors: { r: '#ff3b3b', R: '#ffd0d0' },
		outline: false
	},
	shadow: {
		rows: ['..ssssss..', 'ssssssssss', '..ssssss..'],
		colors: { s: '#3b273038' },
		outline: false
	}
};

const ALIAS: Record<string, string> = { wave: 'hand', sleepy: 'z', lamp: 'lamp', apple: 'kibble', cookie: 'treat', cake: 'treat' };

export function icon(name: string): Img {
	const def = ICONS[name] ?? ICONS[ALIAS[name]] ?? ICONS.sparkle;
	return sprite(def.rows, def.colors, { outline: def.outline ?? true });
}

// ---- Players ----

export type Facing = 'down' | 'up' | 'left' | 'right';

const HEAD: Record<Hair, string[]> = {
	short: ['...oooooo...', '..ohhhhhho..', '.ohhhhhhhho.', '.ohlhhhhhho.', '.ohssssssho.'],
	long: ['...oooooo...', '..ohhhhhho..', '.ohhhhhhhho.', 'ohhlhhhhhhho', 'ohhsssssshho'],
	bun: ['....oooo....', '...ohhlho...', '...oohhoo...', '..ohhhhhho..', '.ohhhhhhhho.', '.ohlhhhhhho.', '.ohssssssho.']
};

function face(hair: Hair, facing: Facing): string[] {
	const side = hair === 'long' ? ['oh', 'ho'] : ['.o', 'o.'];
	if (facing === 'up') {
		const h = 'h'.repeat(8);
		return hair === 'long'
			? ['oh' + h + 'ho', 'oh' + h + 'ho', 'oh' + h + 'ho', 'ohhhhhhhhhho', 'ohhoSSSSohho']
			: ['.oh' + 'h'.repeat(6) + 'ho.', '.oh' + 'h'.repeat(6) + 'ho.', '.ohhhhhhhho.', '..ohhhhhho..', '...oSSSSo...'];
	}
	// Eyes and cheeks shift toward where you're looking.
	const shift = facing === 'left' ? -1 : facing === 'right' ? 1 : 0;
	const eyes = [...'ssssssss'];
	const cheeks = [...'ssssssss'];
	eyes[2 + shift] = 'e';
	eyes[5 + shift] = 'e';
	cheeks[1 + shift] = 'b';
	cheeks[6 + shift] = 'b';
	const rows = [side[0] + eyes.join('') + side[1], side[0] + cheeks.join('') + side[1]];
	return hair === 'long' ? [...rows, 'ohossssssoho', 'ohhoSSSSohho'] : [...rows, '..o' + 's'.repeat(6) + 'o..', '...oSSSSo...'];
}

const LEGS = [
	['..oppooppo..', '..oppooppo..', '..fff..fff..'],
	['..oppooppo..', '..fff.oppo..', '.......fff..'],
	['..oppooppo..', '..oppo.fff..', '..fff.......']
];

/** A player. `frame` 0 stands, 1 and 2 are walking steps. */
export function character(look: { shirt: string; hair: string }, facing: Facing, frame = 0): Img {
	const hair = (look.hair in HEAD ? look.hair : 'short') as Hair;
	const [c, C] = SHIRT_COLOR[look.shirt as Shirt] ?? SHIRT_COLOR.pink;
	const head = HEAD[hair];
	const top = hair === 'long' && facing !== 'up' ? '.oh' + 'c'.repeat(6) + 'ho.' : '..occcccco..';
	const rows = [
		...head,
		...face(hair, facing),
		top,
		'.occcccccco.',
		'ocCccccccCco',
		facing === 'up' ? 'occcccccccco' : 'osccccccccso',
		'.oCCCCCCCCo.',
		...LEGS[frame]
	];
	return sprite(rows, {
		o: INK,
		h: '#5a3a2e',
		l: '#7d5443',
		s: '#ffd9b8',
		S: '#e8b48e',
		e: EYE,
		b: BLUSH,
		c,
		C,
		p: '#4b5d8a',
		f: INK
	});
}

// ---- The cat ----

type Pal = {
	/** Base fur, its shade, and the light fur on chest, muzzle and paws. */
	B: string;
	S: string;
	L: string;
	/** Inner ear, nose, eyes (and the right eye, for odd eyes). */
	P: string;
	N: string;
	E: string;
	E2?: string;
	/** Tabby stripes. */
	T?: string;
	/** Siamese points. */
	D?: string;
	/** Calico patches. */
	patches?: [string, string];
	muzzle: boolean;
	chest: boolean;
	paws: boolean;
	dark?: boolean;
};

const COAT_PAL: Record<Coat, Pal> = {
	orange: { B: '#f6a25a', S: '#d97f3c', L: '#ffe2c0', T: '#cf6f30', P: '#ff9fb0', N: '#e8707f', E: '#7ccf5a', muzzle: true, chest: true, paws: false },
	tuxedo: { B: '#4b4553', S: '#36303d', L: '#fbf6ee', P: '#ff9fb0', N: '#f2a0ad', E: '#f2c94c', muzzle: true, chest: true, paws: true, dark: true },
	calico: { B: '#fbf6ee', S: '#ddd3c6', L: '#ffffff', P: '#ff9fb0', N: '#f29aa7', E: '#e0a43a', patches: ['#f2a14e', '#4b4553'], muzzle: false, chest: false, paws: false },
	siamese: { B: '#f3e5cc', S: '#d9c6a6', L: '#fbf3e4', D: '#6e4c3d', P: '#c98f84', N: '#5a3a30', E: '#69b4ff', muzzle: false, chest: false, paws: false },
	black: { B: '#433d4c', S: '#2f2a37', L: '#433d4c', P: '#e891a5', N: '#8a4a5e', E: '#ffd34d', muzzle: false, chest: false, paws: false, dark: true },
	gray: { B: '#a8b0c2', S: '#858da1', L: '#e7ebf2', T: '#7b8397', P: '#ff9fb0', N: '#e3889a', E: '#f5a83c', muzzle: true, chest: true, paws: true },
	cream: { B: '#fff2df', S: '#ead6ba', L: '#fffaf2', P: '#ffb3c1', N: '#f5a3b0', E: '#6fb8ff', E2: '#f2c94c', muzzle: false, chest: false, paws: false }
};

export const coatSwatch = (coat: Coat) => COAT_PAL[coat].B;

type Dims = { hw: number; hh: number; bw: number; bh: number; ear: number; tail: number; leg: number; fluff: boolean; crown: boolean };

function dims(stage: Stage, evolution?: Evolution): Dims {
	const base = {
		box: { hw: 10, hh: 8, bw: 8, bh: 6, ear: 2, tail: 5, leg: 2 },
		kitten: { hw: 10, hh: 8, bw: 8, bh: 6, ear: 2, tail: 5, leg: 2 },
		young: { hw: 10, hh: 8, bw: 10, bh: 7, ear: 3, tail: 6, leg: 2 },
		teen: { hw: 12, hh: 9, bw: 12, bh: 8, ear: 3, tail: 7, leg: 3 },
		adult: { hw: 12, hh: 9, bw: 14, bh: 9, ear: 3, tail: 8, leg: 3 }
	}[stage];
	const d: Dims = { ...base, fluff: false, crown: false };
	if (stage !== 'adult') return d;
	if (evolution === 'chonk') return { ...d, hw: 14, hh: 10, bw: 20, bh: 12, leg: 2 };
	if (evolution === 'floof') return { ...d, hw: 14, hh: 10, bw: 16, bh: 10, fluff: true };
	if (evolution === 'sleek') return { ...d, hw: 12, hh: 9, bw: 12, bh: 8, ear: 4, tail: 11, leg: 4 };
	if (evolution === 'forest') return { ...d, crown: true };
	return d;
}

export type CatPose =
	| 'sit'
	| 'walk1'
	| 'walk2'
	| 'run1'
	| 'run2'
	| 'loaf'
	| 'curl'
	| 'groom'
	| 'knead1'
	| 'knead2'
	| 'pounce'
	| 'stretch'
	| 'eat';
export type Eyes = 'open' | 'closed' | 'happy' | 'sad' | 'wide';
export type Mouth = 'none' | 'smile' | 'open' | 'frown';
export type CatLook = { pose: CatPose; eyes: Eyes; mouth: Mouth; blush?: boolean; dirty?: boolean };

/** Every cat sprite shares this canvas, with its feet at the bottom middle. */
export const CAT_W = 40;
export const CAT_H = 34;
const AX = CAT_W / 2;
const AY = CAT_H - 1;

const SIDE: CatPose[] = ['walk1', 'walk2', 'run1', 'run2', 'pounce', 'stretch', 'eat'];
export const isSidePose = (pose: CatPose) => SIDE.includes(pose);

/** Recolours only fur pixels inside a shape: markings never spill outside the cat. */
function mark(p: Painter, pal: Pal, color: string, inShape: (x: number, y: number) => boolean) {
	for (let y = 0; y < p.h; y++)
		for (let x = 0; x < p.w; x++) {
			const c = p.grid[y][x];
			if ((c === pal.B || c === pal.S) && inShape(x, y)) p.grid[y][x] = color;
		}
}

const inEllipse = (x0: number, y0: number, w: number, h: number) => (x: number, y: number) => {
	const dx = (x + 0.5 - (x0 + w / 2)) / (w / 2);
	const dy = (y + 0.5 - (y0 + h / 2)) / (h / 2);
	return dx * dx + dy * dy <= 1;
};

function tailPath(p: Painter, pts: Pt[], pal: Pal, thick: number) {
	pts.forEach((pt, i) => {
		const tip = i >= pts.length - 2;
		let c = pal.B;
		if (pal.T && i % 2 === 1) c = pal.T;
		if (pal.D && i >= pts.length - 4) c = pal.D;
		if (pal.patches && i >= pts.length - 3) c = pal.patches[1];
		if (tip && pal.paws && pal.dark) c = pal.L;
		p.rect(pt.x, pt.y, thick, thick, c);
	});
}

function eyesAt(p: Painter, pal: Pal, eyes: Eyes, lx: number, rx: number, y: number) {
	const K = EYE;
	const W = '#ffffff';
	[lx, rx].forEach((x, i) => {
		const E = i === 1 && pal.E2 ? pal.E2 : pal.E;
		if (eyes === 'closed') {
			p.px(x, y + 1, K).px(x + 1, y + 1, K);
		} else if (eyes === 'happy') {
			if (i === 0) p.px(x, y + 1, K).px(x + 1, y, K);
			else p.px(x, y, K).px(x + 1, y + 1, K);
		} else if (eyes === 'wide') {
			p.px(x, y, K).px(x + 1, y, W).px(x, y + 1, K).px(x + 1, y + 1, K);
		} else {
			p.px(x, y, pal.dark ? E : K).px(x + 1, y, K).px(x, y + 1, E).px(x + 1, y + 1, pal.dark ? E : K);
			if (eyes === 'sad' && i === 0) p.px(x, y + 2, '#7cc4ff');
		}
	});
}

function ears(p: Painter, pal: Pal, d: Dims, leftX: number, rightX: number, top: number) {
	for (let r = 0; r < d.ear; r++) {
		for (let i = 0; i <= r; i++) {
			const inner = r >= 1 && i >= 1 && i < r + (d.ear > 3 ? 0 : 1) && r < d.ear;
			const c = pal.D ?? (inner ? pal.P : pal.B);
			p.px(leftX + i, top + r, inner && pal.D ? pal.D : c);
			p.px(rightX - i, top + r, inner && pal.D ? pal.D : c);
		}
		if (r >= 1 && !pal.D) {
			p.px(leftX + 1, top + r, pal.P);
			p.px(rightX - 1, top + r, pal.P);
		}
	}
}

/** A cat facing you: sitting, loafing, curled up asleep, grooming or kneading. */
function drawFront(p: Painter, d: Dims, pal: Pal, look: CatLook) {
	const loaf = look.pose === 'loaf' || look.pose === 'curl';
	const bw = loaf ? d.bw + 4 : d.bw;
	const bh = loaf ? Math.max(5, d.bh - 2) : d.bh;
	const bodyTop = AY - bh + 1;
	const bx = AX - bw / 2;
	const tilt = look.pose === 'curl' ? 2 : 0;
	const hx = AX - d.hw / 2 + tilt;
	const headTop = bodyTop - d.hh + (loaf ? 4 : 3) + tilt;
	const earTop = headTop - d.ear + 1;

	// Tail: curling up the right side, or wrapped around the front when loafing.
	const thick = d.fluff ? 3 : 2;
	if (!loaf) {
		const pts: Pt[] = [];
		const startX = bx + bw - 2;
		for (let i = 0; i < 3; i++) pts.push({ x: startX + i, y: AY - 1 });
		for (let i = 1; i <= d.tail - 2; i++) pts.push({ x: startX + 3, y: AY - 1 - i });
		pts.push({ x: startX + 2, y: AY - d.tail + 1 });
		tailPath(p, pts, pal, thick);
	}

	p.ellipse(bx, bodyTop, bw, bh, pal.S).ellipse(bx, bodyTop, bw - 1, bh - 1, pal.B);
	if (pal.chest && !loaf) p.ellipse(AX - bw / 4, bodyTop, bw / 2, bh - 1, pal.L);
	if (pal.T) {
		p.vline(bx + 1, bodyTop + 2, 2, pal.T).vline(bx + bw - 3, bodyTop + 2, 2, pal.T);
		if (bw >= 12) p.vline(bx + 3, bodyTop + 1, 2, pal.T).vline(bx + bw - 5, bodyTop + 1, 2, pal.T);
	}
	if (d.fluff) {
		for (let x = AX - bw / 2 + 2; x < AX + bw / 2 - 2; x += 2) p.px(x, bodyTop - 1, pal.L);
		p.ellipse(AX - 3, bodyTop, 6, 4, pal.L);
	}

	if (loaf) {
		// The tail wraps around the front.
		const pts: Pt[] = [];
		for (let x = bx + bw - 3; x >= AX - bw / 2 + 3; x--) pts.push({ x, y: AY - 1 });
		tailPath(p, pts, pal, 2);
	} else {
		const paw = pal.paws ? pal.L : pal.D ?? (pal.chest ? pal.L : pal.B);
		const lift = (side: 0 | 1) =>
			(look.pose === 'knead1' && side === 0) || (look.pose === 'knead2' && side === 1) ? 1 : 0;
		p.rect(AX - 3, AY - 1 - lift(0), 2, 2, paw).rect(AX + 1, AY - 1 - lift(1), 2, 2, paw);
		p.px(AX - 1, AY, pal.S).px(AX, AY, pal.S);
	}

	// Head.
	p.ellipse(hx, headTop, d.hw, d.hh, pal.S).ellipse(hx, headTop, d.hw - 1, d.hh - 1, pal.B);
	if (d.fluff) {
		const y = headTop + d.hh - 3;
		p.px(hx - 1, y, pal.B).px(hx - 1, y + 1, pal.B).px(hx, y + 2, pal.B);
		p.px(hx + d.hw, y, pal.S).px(hx + d.hw, y + 1, pal.S).px(hx + d.hw - 1, y + 2, pal.S);
	}
	ears(p, pal, d, hx + 1, hx + d.hw - 2, earTop);

	const cx = AX + tilt;
	const eyeY = headTop + Math.floor(d.hh * 0.42);
	const g = Math.max(1, Math.floor(d.hw / 4) - 1);
	const lx = cx - 2 - g;
	const rx = cx + g;

	// Markings.
	if (pal.muzzle) p.ellipse(cx - 3, eyeY + 1, 6, d.hh - (eyeY - headTop) - 1, pal.L);
	if (pal.T) {
		p.vline(cx - 1, headTop + 1, 2, pal.T).px(cx, headTop + 1, pal.T);
		if (d.hw >= 12) p.px(cx - 3, headTop + 1, pal.T).px(cx + 2, headTop + 1, pal.T);
		p.px(hx, eyeY + 1, pal.T).px(hx + d.hw - 2, eyeY + 1, pal.T);
	}
	if (pal.D) mark(p, pal, pal.D, inEllipse(cx - 4, eyeY - 1, 8, d.hh - (eyeY - headTop) + 1));
	if (pal.patches) {
		mark(p, pal, pal.patches[0], (x, y) => y < headTop + 3 && x < cx - 1);
		mark(p, pal, pal.patches[1], inEllipse(AX, bodyTop - 1, bw / 2 + 2, bh / 2 + 1));
		mark(p, pal, pal.patches[1], (x, y) => y < eyeY && x > cx + 2);
	}

	// Paw up to the mouth while grooming.
	if (look.pose === 'groom') {
		const paw = pal.paws ? pal.L : pal.D ?? pal.B;
		p.rect(cx + 1, eyeY + 3, 2, AY - eyeY - 4, pal.S).rect(cx + 1, eyeY + 2, 2, 2, paw);
	}

	eyesAt(p, pal, look.pose === 'curl' ? 'closed' : look.eyes, lx, rx, eyeY);
	if (look.blush) p.px(lx - 1, eyeY + 2, BLUSH).px(rx + 2, eyeY + 2, BLUSH);
	const ny = eyeY + 2;
	p.px(cx - 1, ny, pal.N).px(cx, ny, pal.N);
	const my = ny + 1;
	const M = pal.dark ? '#1f1a24' : '#7a4a52';
	if (look.pose === 'groom') {
		p.px(cx - 1, my, '#ff7a90');
	} else if (look.mouth === 'open') {
		p.px(cx - 2, my, M).px(cx + 1, my, M).px(cx - 1, my, '#ff7a90').px(cx, my, '#ff7a90');
	} else if (look.mouth === 'frown') {
		p.px(cx - 1, my, M).px(cx, my, M);
	} else if (look.mouth === 'smile') {
		p.px(cx - 2, my, M).px(cx + 1, my, M);
	}

	if (d.crown) crown(p, cx, earTop);
}

function crown(p: Painter, cx: number, top: number) {
	const G = '#6fbf5a';
	const g = '#4e9a45';
	[-4, -2, 0, 2].forEach((dx, i) => p.px(cx + dx, top + 1, i % 2 ? g : G).px(cx + dx + 1, top, G));
	p.px(cx + 3, top - 1, '#ff8fb1').px(cx + 4, top, '#ff8fb1').px(cx + 3, top, '#ffd166').px(cx + 2, top, '#ff8fb1');
}

/** A cat side-on, facing right: walking, running, pouncing, stretching or eating. */
function drawSide(p: Painter, d: Dims, pal: Pal, look: CatLook) {
	const pose = look.pose;
	const legH = d.leg + 1;
	const len = d.bw + 4;
	const bodyH = Math.max(5, d.bh - 2);
	const bodyBottom = AY - legH + 1;
	const bodyTop = bodyBottom - bodyH + 1;
	const bx = AX - len / 2;
	const hw = d.hw - 1;
	const hh = d.hh - 1;
	const low = pose === 'eat' || pose === 'stretch';
	const hx = bx + len - Math.floor(hw / 2) - 1 + (low ? 2 : 0);
	const hy = low ? bodyTop + 1 : bodyTop - hh + 3 - (pose === 'pounce' ? 2 : 0);
	const legC = pal.D ?? (pal.paws ? pal.L : pal.B);
	const farC = pal.D ?? pal.S;

	// Legs: back pair at the rear, front pair under the chest. Frames swing them.
	const swing = { walk1: [1, -1], walk2: [-1, 1], run1: [2, -2], run2: [-1, 1] }[pose as 'walk1'] ?? [0, 0];
	const backX = bx + 2;
	const frontX = bx + len - 5;
	const leg = (x: number, c: string, h = legH) => p.rect(x, bodyBottom, 2, h, c);
	if (pose === 'pounce') {
		leg(backX - 1, farC);
		p.rect(frontX + 2, bodyTop + 1, 3, 2, farC);
	} else if (pose === 'stretch') {
		leg(backX, farC);
		p.rect(frontX + 1, AY - 1, 5, 2, farC);
	} else {
		leg(backX - swing[1], farC);
		leg(frontX - swing[0], farC);
	}

	// Tail: up and curling back, or straight out behind when pouncing.
	const pts: Pt[] = [];
	if (pose === 'pounce' || pose === 'run1' || pose === 'run2') {
		for (let i = 1; i <= d.tail; i++) pts.push({ x: bx - i, y: bodyTop + 1 - Math.floor(i / 3) });
	} else {
		for (let i = 1; i <= d.tail; i++) pts.push({ x: bx - 1 - Math.min(i, 2), y: bodyTop + 1 - i });
		pts.push({ x: bx - 2, y: bodyTop - d.tail });
	}
	tailPath(p, pts, pal, d.fluff ? 3 : 2);

	p.ellipse(bx, bodyTop, len, bodyH, pal.S).ellipse(bx, bodyTop, len, bodyH - 1, pal.B);
	if (pal.chest) p.ellipse(bx + 3, bodyBottom - 2, len - 5, 3, pal.L);
	if (pal.T) for (let x = bx + 3; x < bx + len - 4; x += 3) p.vline(x, bodyTop, 2, pal.T);
	if (pal.patches) {
		mark(p, pal, pal.patches[1], inEllipse(bx, bodyTop - 1, len / 2, bodyH));
		mark(p, pal, pal.patches[0], inEllipse(bx + len / 2, bodyTop - 1, len / 2 - 1, bodyH / 2 + 1));
	}

	if (pose === 'pounce') {
		leg(backX + 2, legC);
		p.rect(frontX + 3, bodyTop + 2, 4, 2, legC);
	} else if (pose === 'stretch') {
		leg(backX + 2, legC);
		p.rect(frontX + 2, AY - 1, 6, 2, legC);
	} else {
		leg(backX + 2 + swing[0], legC);
		leg(frontX + 2 + swing[1], legC);
	}

	// Head.
	p.ellipse(hx, hy, hw, hh, pal.S).ellipse(hx, hy, hw - 1, hh - 1, pal.B);
	const earTop = hy - d.ear + 1;
	for (let r = 0; r < d.ear; r++)
		for (let i = 0; i <= r; i++) {
			p.px(hx + 1 + i, earTop + r, pal.D ?? pal.S);
			p.px(hx + hw - 4 + i, earTop + r, r >= 1 && i === 1 && !pal.D ? pal.P : (pal.D ?? pal.B));
		}
	const eyeY = hy + Math.floor(hh * 0.4);
	const ex = hx + hw - 4;
	if (pal.muzzle) p.ellipse(hx + hw - 5, eyeY + 1, 5, hh - (eyeY - hy) - 1, pal.L);
	if (pal.D) mark(p, pal, pal.D, inEllipse(hx + hw - 6, eyeY - 1, 7, hh - (eyeY - hy) + 1));
	if (pal.T) p.vline(hx + 3, hy + 1, 2, pal.T).vline(hx + 5, hy, 2, pal.T);
	if (pal.patches) mark(p, pal, pal.patches[0], (x, y) => y < eyeY && x < hx + hw - 3 && y >= hy - d.ear);
	const K = EYE;
	if (look.eyes === 'closed' || look.eyes === 'happy') p.px(ex, eyeY + 1, K).px(ex + 1, eyeY + 1, K);
	else p.px(ex, eyeY, pal.dark ? pal.E : K).px(ex, eyeY + 1, pal.E).px(ex + 1, eyeY, K).px(ex + 1, eyeY + 1, K);
	p.px(hx + hw - 1, eyeY + 2, pal.N);
	if (look.mouth === 'open') p.px(hx + hw - 2, eyeY + 3, '#ff7a90');
	if (look.blush) p.px(ex - 1, eyeY + 2, BLUSH);
	if (d.crown) crown(p, hx + hw / 2 - 1, earTop);
}

/** The cat, in a coat, at a size, in a pose. Facing right for side poses; mirror for left. */
export function cat(coat: Coat, stage: Stage, evolution: Evolution | undefined, look: CatLook): Img {
	const pal = COAT_PAL[coat] ?? COAT_PAL.orange;
	const d = dims(stage, evolution);
	const key = `cat|${coat}|${stage}|${evolution ?? ''}|${look.pose}|${look.eyes}|${look.mouth}|${look.blush ? 1 : 0}|${look.dirty ? 1 : 0}`;
	return paint(
		key,
		CAT_W,
		CAT_H,
		(p) => {
			if (isSidePose(look.pose)) drawSide(p, d, pal, look);
			else drawFront(p, d, pal, look);
			if (look.dirty)
				mark(p, pal, '#a07a55', (x, y) => (x * 7 + y * 13) % 11 === 0);
		},
		{ outline: true }
	);
}

// ---- Isometric drawing ----

type P3 = [number, number, number];

/** Draws in floor coordinates onto a painter whose top-left sits at scene pixel (left, top). */
class Iso {
	constructor(
		public p: Painter,
		public left: number,
		public top: number
	) {}
	at(x: number, y: number, z = 0): Pt {
		const s = toScreen(x, y, z);
		return { x: s.x - this.left, y: s.y - this.top };
	}
	poly(pts: P3[], c: string) {
		this.p.poly(
			pts.map(([x, y, z]) => this.at(x, y, z)),
			c
		);
		return this;
	}
	line(a: P3, b: P3, c: string) {
		this.p.line(this.at(...a), this.at(...b), c);
		return this;
	}
	px(x: number, y: number, z: number, c: string) {
		const s = this.at(x, y, z);
		this.p.px(Math.floor(s.x), Math.floor(s.y), c);
		return this;
	}
	/** A box: top colour, then the two faces you can see (y = y1 on the left, x = x1 on the right). */
	box(x0: number, y0: number, x1: number, y1: number, z0: number, z1: number, [top, left, right]: [string, string, string]) {
		this.poly(
			[
				[x1, y0, z0],
				[x1, y1, z0],
				[x1, y1, z1],
				[x1, y0, z1]
			],
			right
		);
		this.poly(
			[
				[x0, y1, z0],
				[x1, y1, z0],
				[x1, y1, z1],
				[x0, y1, z1]
			],
			left
		);
		this.poly(
			[
				[x0, y0, z1],
				[x1, y0, z1],
				[x1, y1, z1],
				[x0, y1, z1]
			],
			top
		);
		return this;
	}
	/** A flat ellipse on the floor (or at height z). */
	disc(cx: number, cy: number, rx: number, ry: number, z: number, c: string) {
		for (let y = 0; y < this.p.h; y++)
			for (let x = 0; x < this.p.w; x++) {
				const f = toFloor(this.left + x + 0.5, this.top + y + 0.5 + z);
				const dx = (f.x - cx) / rx;
				const dy = (f.y - cy) / ry;
				if (dx * dx + dy * dy <= 1) this.p.grid[y][x] = c;
			}
		return this;
	}
}

type Box = { x0: number; y0: number; x1: number; y1: number };

export type Placed = {
	key: string;
	img: Img;
	/** Scene pixel of the image's top-left. */
	x: number;
	y: number;
	/** Draw order: bigger is nearer. Floor-level things use -Infinity-ish values. */
	depth: number;
	/** What tapping it does (an object key from world.ts), if anything. */
	hit?: string;
};

/** Paints something standing on `box`, up to `height`, and places it in the scene. */
function isoThing(
	key: string,
	box: Box,
	height: number,
	draw: (g: Iso) => void,
	opts: { pad?: number; hit?: string; depth?: number; outline?: boolean } = {}
): Placed {
	const pad = opts.pad ?? 3;
	const left = Math.floor(ORIGIN.x + box.x0 - box.y1) - pad;
	const right = Math.ceil(ORIGIN.x + box.x1 - box.y0) + pad;
	const top = Math.floor(ORIGIN.y + (box.x0 + box.y0) / 2 - height) - pad;
	const bottom = Math.ceil(ORIGIN.y + (box.x1 + box.y1) / 2) + pad;
	const img = paint(key, right - left + 1, bottom - top + 1, (p) => draw(new Iso(p, left, top)), {
		outline: opts.outline ?? true
	});
	return {
		key,
		img,
		x: left - img.off,
		y: top - img.off,
		depth: opts.depth ?? (box.x0 + box.x1) / 2 + (box.y0 + box.y1) / 2,
		hit: opts.hit
	};
}

const depthOf = (b: Box) => (b.x0 + b.x1) / 2 + (b.y0 + b.y1) / 2;

// ---- The room ----

export type Sky = 'day' | 'dusk' | 'night';

export function skyNow(date = new Date()): Sky {
	const h = date.getHours();
	if (h >= 6 && h < 17) return 'day';
	if (h >= 17 && h < 19) return 'dusk';
	return 'night';
}

const hash = (x: number, y: number) => {
	let n = Math.floor(x) * 374761393 + Math.floor(y) * 668265263;
	n = (n ^ (n >> 13)) * 1274126177;
	return ((n ^ (n >> 16)) >>> 0) % 1000;
};

/** Which wall a scene pixel is on, and where on it: `u` along the wall, `z` up it. */
function wallAt(sx: number, sy: number): { side: 'left' | 'right'; u: number; z: number } | null {
	const a = sx - ORIGIN.x;
	if (a <= 0) {
		const u = -a;
		const z = ORIGIN.y + u / 2 - sy;
		if (u <= ROOM + 3 && z >= 0 && z <= WALL_H + 3) return { side: 'left', u, z };
	} else {
		const u = a;
		const z = ORIGIN.y + u / 2 - sy;
		if (u <= ROOM + 3 && z >= 0 && z <= WALL_H + 3) return { side: 'right', u, z };
	}
	return null;
}

const BOOKS = ['#c94a6a', '#5a93d6', '#ffd166', '#6fbf5a', '#9575d9', '#ff8fb1'];

function wallColor(side: 'left' | 'right', u: number, z: number): string {
	// The cap along the top, and the wall's cut edge at the front.
	if (z > WALL_H || u > ROOM) return z > WALL_H + 2 || u > ROOM + 2 ? '#a87a52' : '#d9b48a';
	if (z < 3) return z < 1 ? '#7a5038' : WOOD_D;
	if (z < 24) {
		if (z >= 22) return '#f2d6b2';
		if (u % 16 < 1) return '#d4ab80';
		return side === 'left' ? '#e2bf97' : '#ebcca5';
	}
	// Left wall: a picture of the two of you over the sofa, and a bookshelf over the radio.
	if (side === 'left') {
		if (u >= 64 && u <= 88 && z >= 40 && z <= 60) {
			if (u < 66 || u > 86 || z < 42 || z > 58) return WOOD_D;
			const i = Math.floor(88 - u - 2);
			const j = Math.floor(58 - z);
			const art = ['....................', '...hh........hh.....', '..hssh......hssh....', '..hssh......hssh....', '...ss...pp..ss......', '..cccc.pppp.dddd....', '..cccc..pp..dddd....', '..cccc......dddd....', '....................', '....................', '....................', '....................', '....................', '....................', '....................', '....................'];
			const ch = art[j]?.[i];
			const map: Record<string, string> = { h: '#5a3a2e', s: '#ffd9b8', p: '#ff6b9a', c: '#ff8fb1', d: '#8cc4ff' };
			return (ch && map[ch]) || (z < 46 ? '#cfe8c4' : '#fff4e4');
		}
		if (u >= 20 && u <= 46 && z >= 44 && z < 46) return WOOD;
		if (u >= 22 && u <= 44 && z >= 46 && z < 46 + 6 + (Math.floor(u) % 3)) {
			const b = Math.floor((u - 22) / 3);
			return Math.floor(u - 22) % 3 === 0 ? '#3b2730' : BOOKS[b % BOOKS.length];
		}
	}
	// Right wall: a little clock between the fish tank and the bed.
	if (side === 'right' && u >= 88 && u <= 100 && z >= 50 && z <= 62) {
		const dx = u - 94;
		const dz = z - 56;
		const r = Math.hypot(dx, dz);
		if (r <= 6) {
			if (r > 4.8) return WOOD_D;
			if ((Math.abs(dx) < 0.6 && dz > 0 && dz < 4) || (Math.abs(dz) < 0.6 && dx > 0 && dx < 3)) return INK;
			return '#fffaf0';
		}
	}
	const stripe = u % 12 < 2;
	const dot = Math.floor(u) % 12 === 7 && Math.floor(z) % 10 === 5;
	if (side === 'left') return dot ? '#f7e1cc' : stripe ? '#e6c6a8' : '#eccfb3';
	return dot ? '#fff0e0' : stripe ? '#f1d6bb' : '#f6dfc8';
}

const PLANKS = ['#d9a066', '#d19758', '#dca86f', '#cf9454'];

function floorColor(x: number, y: number): string {
	if (x < 2.5 || y < 2.5) return '#a8713e';
	const plank = Math.floor(y / 10);
	const run = Math.floor((x + plank * 23) / 52);
	if (y % 10 < 0.9) return '#b98247';
	if ((x + plank * 23) % 52 < 1) return '#b98247';
	if (hash(x, y) < 25) return '#c98d50';
	return PLANKS[(plank * 3 + run) % 4];
}

/** Walls and the wooden floor. */
export function roomBackground(): Img {
	return paint('room-iso', SCENE_W, SCENE_H, (p) => {
		for (let y = 0; y < SCENE_H; y++)
			for (let x = 0; x < SCENE_W; x++) {
				const sx = x + 0.5;
				const sy = y + 0.5;
				const f = toFloor(sx, sy);
				if (f.x >= 0 && f.y >= 0 && f.x <= ROOM && f.y <= ROOM) {
					p.px(x, y, floorColor(f.x, f.y));
					continue;
				}
				const w = wallAt(sx, sy);
				if (w && (f.x < 0 || f.y < 0)) p.px(x, y, wallColor(w.side, w.u, w.z));
			}
		// The floor's front edges, and the corner where the walls meet.
		p.line(toScreen(0, ROOM), toScreen(ROOM, ROOM), '#8f5d3c').line(toScreen(ROOM, 0), toScreen(ROOM, ROOM), '#8f5d3c');
		p.vline(ORIGIN.x - 1, ORIGIN.y - WALL_H, WALL_H, '#e0c2a2');
	});
}

/** Paints something flat on one of the walls: `u` runs along it, `z` up it. */
function wallThing(
	key: string,
	side: 'left' | 'right',
	u0: number,
	u1: number,
	z0: number,
	z1: number,
	color: (u: number, z: number) => string | null,
	hit?: string,
	outline = true
): Placed {
	const corners = [u0, u1].flatMap((u) =>
		[z0, z1].map((z) => (side === 'left' ? toScreen(0, u, z) : toScreen(u, 0, z)))
	);
	const left = Math.floor(Math.min(...corners.map((c) => c.x)));
	const right = Math.ceil(Math.max(...corners.map((c) => c.x)));
	const top = Math.floor(Math.min(...corners.map((c) => c.y)));
	const bottom = Math.ceil(Math.max(...corners.map((c) => c.y)));
	const img = paint(
		key,
		right - left,
		bottom - top,
		(p) => {
			for (let y = 0; y < p.h; y++)
				for (let x = 0; x < p.w; x++) {
					const sx = left + x + 0.5;
					const sy = top + y + 0.5;
					const u = side === 'left' ? ORIGIN.x - sx : sx - ORIGIN.x;
					const z = ORIGIN.y + u / 2 - sy;
					if (u < u0 || u > u1 || z < z0 || z > z1) continue;
					const c = color(u, z);
					if (c) p.px(x, y, c);
				}
		},
		{ outline }
	);
	return { key, img, x: left - img.off, y: top - img.off, depth: -1000, hit };
}

function windowArt(sky: Sky): Placed {
	const glass = { day: ['#a8dcff', '#c9ecff'], dusk: ['#ff9e7a', '#ffd08a'], night: ['#1f2a55', '#2f3d75'] }[sky];
	return wallThing(`window-${sky}`, 'right', 26, 70, 26, 66, (u, z) => {
		// Curtains on both sides.
		if (u < 31 || u > 65) return Math.floor(u) % 2 ? '#f4a3b8' : '#e88aa3';
		if (z < 29) return z < 27.5 ? WOOD_D : WOOD_HL;
		if (u < 33 || u > 63 || z > 63) return WOOD;
		if (Math.abs(u - 48) < 1 || Math.abs(z - 46) < 1) return WOOD_L;
		const k = (z - 29) / 34;
		let c = k > 0.5 ? glass[0] : glass[1];
		if (sky === 'day') {
			if ((u - 54) ** 2 + (z - 56) ** 2 < 9) c = '#fff1a8';
			if (u > 36 && u < 44 && z > 50 && z < 53) c = '#ffffff';
			if (u > 38 && u < 42 && z >= 53 && z < 54.5) c = '#ffffff';
			if (z < 33) c = '#9be08a';
		} else if (sky === 'dusk') {
			if ((u - 40) ** 2 + (z - 36) ** 2 < 12) c = '#fff1a8';
			if (z < 33) c = '#6b4a6e';
		} else {
			if ((u - 56) ** 2 + (z - 57) ** 2 < 9 && (u - 57.5) ** 2 + (z - 58) ** 2 >= 7) c = '#fff6c8';
			if (hash(u * 3, z * 3) < 12) c = '#fff6c8';
			if (z < 33) c = '#16203f';
		}
		return c;
	});
}

function doorArt(): Placed {
	return wallThing(
		'door-iso',
		'left',
		110,
		138,
		0,
		50,
		(u, z) => {
			if (u < 112 || u > 136 || z > 48) return WOOD_D;
			const panel = (u > 115 && u < 133 && ((z > 6 && z < 22) || (z > 26 && z < 44))) ? '#956242' : '#a8714a';
			if (u > 132 && u < 134.5 && z > 22 && z < 25) return '#ffd166';
			return panel;
		},
		'door'
	);
}

const LIGHT_COLORS = ['#ff8fb1', '#ffd166', '#7fe0b5', '#8cc4ff', '#c6a6ff'];

/** A string of fairy lights along both walls. Glows at night. */
export function fairyLights(): Placed[] {
	const along = (side: 'left' | 'right') =>
		wallThing(
			`lights-${side}`,
			side,
			2,
			ROOM - 2,
			WALL_H - 16,
			WALL_H - 2,
			(u, z) => {
				const sag = WALL_H - 5 - 5 * Math.sin(((u % 32) / 32) * Math.PI);
				const bulb = Math.floor(u) % 8 === 4;
				if (bulb && z <= sag && z > sag - 2.2) return LIGHT_COLORS[Math.floor(u / 8) % LIGHT_COLORS.length];
				if (Math.abs(z - sag) < 0.6) return '#6b5a4f';
				return null;
			},
			undefined,
			false
		);
	return [along('left'), along('right')];
}

/** Everything standing in the room. Depths are floor x + y, so things sort by nearness. */
export function furniture(state: { sky: Sky; lightsOff: boolean; radioOn: boolean; frame: number }): Placed[] {
	const F = FURNITURE;
	const list: Placed[] = [windowArt(state.sky), doorArt()];

	list.push(
		isoThing(
			'rug',
			F.rug,
			0,
			(g) => {
				const c = { x: (F.rug.x0 + F.rug.x1) / 2, y: (F.rug.y0 + F.rug.y1) / 2 };
				g.disc(c.x, c.y, 28, 26, 0, '#c97f7f')
					.disc(c.x, c.y, 26.5, 24.5, 0, '#e9a6a6')
					.disc(c.x, c.y, 23, 21, 0, '#f6d0c4')
					.disc(c.x, c.y, 15, 13, 0, '#e9a6a6')
					.disc(c.x, c.y, 13, 11, 0, '#fbe3da');
				for (let a = 0; a < 12; a++) {
					const t = (a / 12) * Math.PI * 2;
					g.px(c.x + Math.cos(t) * 19, c.y + Math.sin(t) * 17, 0, '#e08f8f');
				}
			},
			{ depth: -500, outline: false, hit: 'rug' }
		)
	);

	list.push(
		isoThing(
			'petBed',
			F.petBed,
			5,
			(g) => {
				const c = { x: 140, y: 135 };
				g.disc(c.x, c.y, 12, 11, 0, '#5a87c0').disc(c.x, c.y, 12, 11, 3, '#7fb0e8').disc(c.x, c.y, 11, 10, 4, '#9cc4f0');
				g.disc(c.x, c.y, 8.5, 7.5, 3, '#6a96d0').disc(c.x, c.y, 8, 7, 2, '#cfe2ff').disc(c.x - 1, c.y - 1, 5, 4, 2, '#e6f0ff');
			},
			{ depth: -400, hit: 'petBed' }
		)
	);

	list.push(
		isoThing(
			'plant',
			F.plant,
			36,
			(g) => {
				g.box(5, 5, 15, 15, 0, 9, ['#e89c6e', '#d9875a', '#b5653e']).disc(10, 10, 4.5, 4.5, 9, '#6b4a2e');
				const c = g.at(10, 10, 20);
				const p = g.p;
				p.ellipse(c.x - 10, c.y - 4, 10, 12, '#4e9a45').ellipse(c.x + 1, c.y - 5, 10, 11, '#4e9a45');
				p.ellipse(c.x - 7, c.y - 12, 9, 12, '#6fbf5a').ellipse(c.x - 1, c.y - 15, 9, 12, '#5fae4f');
				p.ellipse(c.x - 4, c.y - 6, 9, 10, '#6fbf5a').ellipse(c.x - 3, c.y - 19, 6, 8, '#7ccf6a');
				p.px(c.x - 5, c.y - 14, '#9be08a').px(c.x + 2, c.y - 10, '#9be08a').px(c.x - 8, c.y - 6, '#9be08a');
				g.line([10, 10, 9], [10, 10, 14], '#4e9a45');
			},
			{ hit: 'plant', pad: 6 }
		)
	);

	list.push(
		isoThing(
			`radio-${state.radioOn ? 'on' : 'off'}`,
			F.radio,
			36,
			(g) => {
				g.box(2, 24, 16, 42, 0, 14, [WOOD_HL, WOOD_L, WOOD_D]);
				g.line([2, 42, 7], [16, 42, 7], WOOD_D).px(9, 42, 10, '#ffd166').px(9, 42, 4, '#ffd166');
				g.line([12, 30, 22], [13, 26, 34], '#5a5a6a');
				g.box(4, 27, 13, 39, 14, 23, ['#93d3cc', '#6fb7b0', '#4f8f89']);
				for (let y = 29; y < 36; y += 2) for (let z = 16; z < 22; z += 2) g.px(13 - 0.01, y, z, '#3f6f6a');
				for (let y = 29; y < 36; y += 2) for (let z = 16; z < 22; z += 2) g.px(y - 25, 39, z, '#3f6f6a');
				g.px(4.5, 39, 21, state.radioOn ? '#7fe0b5' : '#5a5a6a').px(7, 39, 21, '#ffd166');
			},
			{ hit: 'radio', pad: 4 }
		)
	);

	list.push(
		isoThing(
			'sofa',
			F.sofa,
			24,
			(g) => {
				const T = ['#a3e0d9', '#7cc8c0', '#5fa39c'] as [string, string, string];
				const D = ['#93d3cc', '#6fb7b0', '#4f8f89'] as [string, string, string];
				g.box(2, 52, 8, 98, 0, 22, D);
				g.box(8, 52, 28, 58, 0, 14, D);
				g.box(8, 58, 28, 92, 3, 9, T).box(8, 58, 28, 92, 0, 3, ['#5fa39c', '#4f8f89', '#3f7a74']);
				g.line([8, 75, 9], [28, 75, 9], '#7cc8c0');
				g.box(9, 61, 13, 71, 9, 17, ['#ffc6d4', '#ffb3c6', '#e8899f']);
				g.box(8, 92, 28, 98, 0, 14, D);
				g.box(27, 54, 28, 56, -2, 0, ['#7a4a2a', '#7a4a2a', '#7a4a2a']);
			},
			{ hit: 'sofa', pad: 4 }
		)
	);

	list.push(
		isoThing(
			'catTree',
			F.catTree,
			46,
			(g) => {
				g.box(34, 2, 52, 20, 0, 4, ['#e8d3b0', '#d4bc94', '#bba37c']);
				g.box(41, 9, 45, 13, 4, 36, ['#d9c08a', '#c9ad72', '#a88f58']);
				for (let z = 6; z < 36; z += 3) g.line([41, 13, z], [45, 13, z], '#b89c66').line([45, 9, z], [45, 13, z], '#957b48');
				g.box(35, 3, 51, 19, 36, 40, ['#c6a6ff', '#a98ae6', '#8f72cc']);
				g.line([51, 19, 36], [51, 19, 29], '#6b5a4f');
				const b = g.at(51, 19, 28);
				g.p.rect(b.x - 1, b.y - 1, 3, 3, '#ff6b6b').px(b.x - 1, b.y - 1, '#ffd0d0');
			},
			{ hit: 'catTree', pad: 4 }
		)
	);

	list.push(
		isoThing(
			`fishTank-${state.frame % 2}`,
			F.fishTank,
			38,
			(g) => {
				g.box(72, 2, 96, 14, 0, 16, [WOOD_HL, WOOD_L, WOOD_D]);
				g.box(73, 3, 95, 13, 16, 34, ['#d8f4fb', '#a8dcef', '#8fcbe0']);
				// Water, gravel and weed seen through the front glass.
				g.poly([[73, 13, 17], [95, 13, 17], [95, 13, 31], [73, 13, 31]], '#7cc8e8');
				g.poly([[95, 3, 17], [95, 13, 17], [95, 13, 31], [95, 3, 31]], '#68b4d6');
				g.poly([[73, 13, 16], [95, 13, 16], [95, 13, 19], [73, 13, 19]], '#e0c9a0');
				g.line([77, 13, 19], [77, 13, 27], '#4e9a45').line([78, 13, 19], [79, 13, 24], '#6fbf5a');
				g.line([91, 13, 19], [91, 13, 25], '#4e9a45');
				const fx = state.frame % 2 ? 82 : 86;
				g.px(fx, 13, 26, '#ff9a4d').px(fx + 1, 13, 26, '#ff9a4d').px(fx + 2, 13, 25, '#ff9a4d').px(fx + 2, 13, 27, '#ff9a4d');
				g.px(fx - 4, 13, 22, '#ffd166').px(fx - 3, 13, 22, '#ffd166');
				g.px(88, 13, 29 + (state.frame % 2), '#ffffff').px(87, 13, 31 - (state.frame % 2), '#ffffff');
				g.box(73, 3, 95, 13, 34, 35, ['#5a6a7a', '#4a5a6a', '#3a4a5a']);
			},
			{ hit: 'fishTank', pad: 3 }
		)
	);

	list.push(
		isoThing(
			`lamp-${state.lightsOff ? 'off' : 'on'}`,
			F.lamp,
			38,
			(g) => {
				g.box(100, 2, 112, 14, 0, 14, [WOOD_HL, WOOD_L, WOOD_D]);
				g.line([100, 14, 9], [112, 14, 9], WOOD_D).px(106, 14, 11, '#ffd166');
				g.box(104, 6, 108, 10, 14, 16, ['#8a6a5a', '#7a5a4a', '#6a4a3a']);
				g.line([106, 8, 16], [106, 8, 27], '#7a5a4a');
				const shade: [string, string, string] = state.lightsOff
					? ['#e9dcc4', '#dccbb0', '#c4b090']
					: ['#fff4c4', '#ffe08a', '#f2c25a'];
				g.box(102, 4, 110, 12, 26, 33, shade);
			},
			{ hit: 'lamp', pad: 3 }
		)
	);

	list.push(
		isoThing(
			'bed',
			F.bed,
			30,
			(g) => {
				g.box(116, 2, 158, 6, 0, 28, [WOOD_HL, WOOD_L, WOOD_D]);
				g.poly([[120, 6, 6], [154, 6, 6], [154, 6, 24], [120, 6, 24]], '#d9a571');
				g.box(116, 6, 158, 56, 0, 8, [WOOD_HL, WOOD_L, WOOD_D]);
				g.box(117, 6, 157, 55, 8, 12, ['#fffaf2', '#f1e6d6', '#e0d2bd']);
				g.box(120, 8, 136, 18, 12, 16, ['#ffffff', '#f4ede2', '#e6dccd']);
				g.box(139, 8, 155, 18, 12, 16, ['#ffffff', '#f4ede2', '#e6dccd']);
				g.box(116, 24, 158, 55, 8, 14, ['#f4a3b8', '#e88aa3', '#d9789a']);
				g.line([116, 25, 14], [158, 25, 14], '#ffd0dc');
				for (let x = 122; x < 156; x += 8)
					for (let y = 32; y < 54; y += 8) g.px(x, y, 14, '#ffd0dc').px(x + 1, y, 14, '#ffd0dc');
				g.box(116, 53, 158, 56, 0, 13, [WOOD_HL, WOOD_L, WOOD_D]);
			},
			{ hit: 'bed', pad: 3 }
		)
	);

	list.push(
		isoThing(
			'table',
			F.table,
			14,
			(g) => {
				const leg: [string, string, string] = [WOOD, WOOD_L, WOOD_D];
				g.box(49, 69, 51, 71, 0, 9, leg).box(65, 69, 67, 71, 0, 9, leg).box(49, 83, 51, 85, 0, 9, leg).box(65, 83, 67, 85, 0, 9, leg);
				g.box(48, 68, 68, 86, 9, 12, [WOOD_HL, WOOD_L, WOOD_D]);
				g.px(52, 80, 12, '#fff4e4').px(53, 80, 12, '#fff4e4').px(54, 81, 12, '#fff4e4');
			},
			{ hit: 'table', pad: 3 }
		)
	);

	list.push(
		isoThing(
			'bowl',
			F.bowl,
			6,
			(g) => {
				g.box(118, 84, 132, 94, 0, 1, ['#ffb3c1', '#e8899f', '#d9708a']);
				g.disc(122, 89, 3.6, 3.6, 1, '#d9667f').disc(122, 89, 3.6, 3.6, 3, '#ff8fa3').disc(122, 89, 2.4, 2.4, 3, '#b5763f');
				g.px(121, 88, 3, '#8a5530').px(123, 90, 3, '#8a5530');
				g.disc(128.5, 89, 3.4, 3.4, 1, '#5a87c0').disc(128.5, 89, 3.4, 3.4, 3, '#8cc4ff').disc(128.5, 89, 2.2, 2.2, 3, '#cfeaff');
			},
			{ hit: 'bowl', pad: 3 }
		)
	);

	list.push(
		isoThing(
			'toybox',
			F.toybox,
			24,
			(g) => {
				g.box(142, 98, 156, 112, 0, 10, ['#e8c27a', '#d9ac5a', '#b98d3e']);
				for (let z = 2; z < 10; z += 3) g.line([142, 112, z], [156, 112, z], '#c9963e').line([156, 98, z], [156, 112, z], '#a87a30');
				g.poly([[143, 99, 10], [155, 99, 10], [155, 111, 10], [143, 111, 10]], '#8a6a3a');
				const b = g.at(146, 103, 13);
				g.p.ellipse(b.x - 3, b.y - 3, 6, 6, '#ff6b6b').px(b.x - 2, b.y - 2, '#ffd0d0');
				g.line([152, 106, 10], [150, 104, 22], '#b07a4f');
				const f = g.at(150, 104, 22);
				g.p.ellipse(f.x - 2, f.y - 5, 4, 7, '#7fd1ff').px(f.x - 1, f.y - 3, '#4fa3d9');
				const m = g.at(149, 109, 11);
				g.p.ellipse(m.x - 3, m.y - 2, 6, 3, '#a8a8b8').px(m.x - 3, m.y - 2, '#ffb3c1');
			},
			{ hit: 'toybox', pad: 3 }
		)
	);

	list.push(
		isoThing(
			'tub-back',
			F.tub,
			13,
			(g) => {
				g.box(96, 136, 120, 154, 1, 12, ['#ffffff', '#e6eef5', '#c9d6e2']);
				g.poly([[98, 138, 12], [118, 138, 12], [118, 152, 12], [98, 152, 12]], '#9ed8ff');
				g.px(104, 142, 12, '#ffffff').px(110, 146, 12, '#ffffff').px(113, 141, 12, '#e6f6ff');
			},
			{ depth: depthOf(F.tub) - 1, hit: 'tub', pad: 3 }
		),
		isoThing(
			'tub-front',
			F.tub,
			13,
			(g) => {
				g.poly([[120, 136, 1], [120, 154, 1], [120, 154, 12], [120, 136, 12]], '#c9d6e2');
				g.poly([[96, 154, 1], [120, 154, 1], [120, 154, 12], [96, 154, 12]], '#e6eef5');
				g.line([96, 154, 11], [120, 154, 11], '#ffffff');
				const foot: [string, string, string] = ['#ffd166', '#e8b85a', '#c99a3c'];
				g.box(97, 152, 99, 154, 0, 1, foot).box(117, 152, 119, 154, 0, 1, foot).box(117, 136, 119, 138, 0, 1, foot);
			},
			{ depth: depthOf(F.tub) + 1, hit: 'tub', pad: 3 }
		)
	);

	return list;
}

const CARD: [string, string, string] = ['#e8b77a', '#d9a066', '#b5803f'];

/** The cardboard box, open, in two halves so the cat can sit inside it. */
export function openBox(): Placed[] {
	const F = FURNITURE.box;
	const d = depthOf(F);
	return [
		isoThing(
			'box-back',
			F,
			16,
			(g) => {
				g.poly([[52, 128, 12], [52, 146, 12], [47, 146, 15], [47, 128, 15]], '#e8b77a');
				g.poly([[52, 128, 12], [70, 128, 12], [70, 123, 15], [52, 123, 15]], '#d9a066');
				g.poly([[53, 129, 1], [53, 145, 1], [53, 145, 12], [53, 129, 12]], '#a87444');
				g.poly([[53, 129, 1], [69, 129, 1], [69, 129, 12], [53, 129, 12]], '#b5803f');
				g.poly([[53, 129, 1], [69, 129, 1], [69, 145, 1], [53, 145, 1]], '#946338');
			},
			{ depth: d - 1, hit: 'box', pad: 7 }
		),
		isoThing(
			'box-front',
			F,
			16,
			(g) => {
				g.poly([[70, 128, 0], [70, 146, 0], [70, 146, 12], [70, 128, 12]], CARD[2]);
				g.poly([[52, 146, 0], [70, 146, 0], [70, 146, 12], [52, 146, 12]], CARD[1]);
				g.line([61, 146, 0], [61, 146, 12], '#f2dcb0').line([70, 137, 0], [70, 137, 12], '#e8c79a');
				g.poly([[70, 128, 12], [70, 146, 12], [75, 146, 10], [75, 128, 10]], '#c9925a');
				g.poly([[52, 146, 12], [70, 146, 12], [70, 151, 10], [52, 151, 10]], '#e8b77a');
			},
			{ depth: d + 1, hit: 'box', pad: 7 }
		)
	];
}

/** Day 1: the box, closed, with someone inside. `peek` grows as each of you says hello. */
export function closedBox(coat: Coat, peek: number, wiggle: number): Placed {
	const F = FURNITURE.box;
	const pal = COAT_PAL[coat] ?? COAT_PAL.orange;
	const placed = isoThing(
		`box-closed-${coat}-${peek}`,
		F,
		22,
		(g) => {
			g.box(52, 128, 70, 146, 0, 12, CARD);
			g.line([61, 128, 12], [61, 146, 12], '#b5803f');
			g.poly([[59, 128, 12], [63, 128, 12], [63, 146, 12], [59, 146, 12]], '#f2dcb0');
			g.line([61, 146, 0], [61, 146, 12], '#f2dcb0');
			g.px(64, 146, 8, '#ff8fb1').px(65, 146, 8, '#ff8fb1').px(64, 146, 7, '#ff8fb1');
			if (peek >= 1) {
				// Two ears poking out between the flaps.
				const a = g.at(61, 133, 12);
				const b = g.at(61, 141, 12);
				for (const e of [a, b]) {
					g.p.px(e.x, e.y - 1, pal.B).px(e.x, e.y - 2, pal.B).px(e.x + 1, e.y - 1, pal.B).px(e.x, e.y - 3, pal.B);
					g.p.px(e.x + 1, e.y - 2, pal.D ?? pal.P);
				}
			}
			if (peek >= 2) {
				const e = g.at(61, 137, 12);
				g.p.rect(e.x - 4, e.y - 1, 9, 2, '#2b1d24').px(e.x - 3, e.y - 1, pal.E).px(e.x + 2, e.y - 1, pal.E2 ?? pal.E);
			}
		},
		{ hit: 'pet', pad: 7 }
	);
	return { ...placed, x: placed.x + wiggle };
}

/** Where the cup is: on the table, or knocked onto the floor. */
export function cupPlaced(down: boolean): Placed {
	const img = icon(down ? 'cupDown' : 'cup');
	const at = down ? toScreen(CUP_SPOT.x, CUP_SPOT.y) : toScreen(62, 74, 12);
	return {
		key: 'cup',
		img,
		x: Math.round(at.x - img.w / 2),
		y: Math.round(at.y - img.h + 1),
		depth: down ? CUP_SPOT.x + CUP_SPOT.y : depthOf(FURNITURE.table) + 0.4,
		hit: down ? 'cup' : 'table'
	};
}

/** Seat heights, for lifting the cat onto furniture. */
export const seatDepth = (on: keyof typeof FURNITURE) => depthOf(FURNITURE[on]) + 0.5;
export { SEATS };
