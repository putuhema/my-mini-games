import { ConvexError, v, type Infer } from 'convex/values';
import { internal } from './_generated/api';
import { internalMutation, internalQuery, mutation, query, type MutationCtx, type QueryCtx } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { courtVerdict } from './schema';
import { CODE_CHARS, cleanName } from './rooms';
import {
	ARG_TYPES,
	CLOSING_PARTS,
	isTurnPhase,
	MAX_OPENING,
	MAX_TEXT,
	other,
	paceFor,
	SHOUT_COOLDOWN_MS,
	SHOUTS,
	SIDE_LABEL,
	TURN_SECONDS,
	topicLabel,
	topicsFor,
	TURN_PHASES,
	type ArgType,
	type EvidenceView,
	type Phase,
	type Reaction,
	type Side
} from './court/rules';
import type { CaseTools } from './court/case';
import { CASES, caseFor, DEFAULT_CASE } from './court/cases';
import { BLUFFABLE, CLAIM_TYPES, describe, proves, rule, tally, type Board } from './court/judge';

type Room = Doc<'courtRooms'>;
type Entry = Doc<'courtEntries'>;
type Verdict = Infer<typeof courtVerdict>;

const MAX_HISTORY = 20;
const MAX_QUESTION = 200;

// ---------- Bantuan ----------

const publicIds = (t: CaseTools) => t.case.evidence.filter((e) => e.kind === 'public').map((e) => e.id);

async function loadRoom(ctx: MutationCtx, roomId: Id<'courtRooms'>) {
	const room = await ctx.db.get(roomId);
	if (!room) throw new ConvexError('Ruang sidang tidak ditemukan');
	return room;
}

function seatOf(room: Room, playerId: string): Side | undefined {
	if (!room.players.some((p) => p.id === playerId)) return undefined;
	return room.defenseId === playerId ? 'defense' : 'prosecution';
}

function requireSeat(room: Room, playerId: string) {
	const side = seatOf(room, playerId);
	if (!side) throw new ConvexError('Anda bukan pihak dalam perkara ini');
	return side;
}

function requireTurn(room: Room, side: Side, phases: Phase[]) {
	if (!phases.includes(room.phase)) throw new ConvexError('Tidak diperbolehkan pada tahap ini');
	if (room.turn !== side) throw new ConvexError('Belum giliran Saudara');
	if (room.budgets[side] <= 0) throw new ConvexError('Langkah Saudara di tahap ini sudah habis');
}

function entries(ctx: QueryCtx, room: Room) {
	return ctx.db
		.query('courtEntries')
		.withIndex('by_roomId_and_trial', (q) => q.eq('roomId', room._id).eq('trial', room.trial))
		.collect();
}

function cleanText(text: string | undefined, max = MAX_TEXT) {
	return (text ?? '').trim().slice(0, max);
}

function boardFor(room: Room, side: Side): Board {
	return {
		side,
		onRecord: new Set(room.onRecord),
		discredited: new Set(room.discredited.map((d) => d.fact)),
		contradicted: new Set(room.contradictions.flatMap((c) => [c.a, c.b]))
	};
}

/** Perubahan ruang selama satu langkah, ditulis sekali di akhir. */
class Session {
	patch: Partial<Room> = {};
	/** Id entri terakhir, untuk menjadwalkan pekerjaan atasnya. */
	lastId?: Id<'courtEntries'>;
	t: CaseTools;
	constructor(
		private ctx: MutationCtx,
		public room: Room
	) {
		this.t = caseFor(room.caseId);
	}

	get onRecord() {
		return this.patch.onRecord ?? this.room.onRecord;
	}
	/** Berkas pribadi pihak ini (yang mengutipnya berarti mengajukannya). */
	ownPrivate(side: Side, key: string) {
		return this.t.byId[key]?.kind === side;
	}
	/** Bisakah pihak ini mengutip `key`? Apa pun di catatan sidang, atau berkasnya sendiri. */
	citable(side: Side, key: string) {
		return this.room.onRecord.includes(key) || this.ownPrivate(side, key);
	}
	record(...keys: string[]) {
		const now = this.onRecord;
		const add = keys.filter((k) => !now.includes(k));
		if (add.length) this.patch.onRecord = [...now, ...add];
	}
	nextSeq() {
		const seq = (this.patch.seq ?? this.room.seq) + 1;
		this.patch.seq = seq;
		return seq;
	}
	async entry(fields: Omit<Entry, '_id' | '_creationTime' | 'roomId' | 'trial' | 'seq' | 'phase' | 'cites'> & { cites?: string[] }) {
		const seq = this.nextSeq();
		this.lastId = await this.ctx.db.insert('courtEntries', {
			roomId: this.room._id,
			trial: this.room.trial,
			seq,
			phase: this.patch.phase ?? this.room.phase,
			cites: [],
			...fields
		});
		return seq;
	}
	discredit(fact: string, side: Side, seq: number) {
		const list = this.patch.discredited ?? this.room.discredited;
		if (!list.some((d) => d.fact === fact)) this.patch.discredited = [...list, { fact, side, seq }];
	}
	contradiction(c: { a: string; b: string; text: string }, side: Side, seq: number) {
		const list = this.patch.contradictions ?? this.room.contradictions;
		if (!list.some((x) => this.t.findContradiction(x.a, x.b) === this.t.findContradiction(c.a, c.b))) {
			this.patch.contradictions = [...list, { ...c, side, seq }];
		}
	}
	/** Pakai satu langkah dan serahkan giliran; pindah tahap bila kedua pihak selesai. */
	async spend(side: Side) {
		const budgets = { ...this.room.budgets, [side]: this.room.budgets[side] - 1 };
		this.patch.budgets = budgets;
		await this.passTurn(side, budgets);
	}
	async passTurn(side: Side, budgets: Room['budgets']) {
		if (budgets[other(side)] > 0) this.patch.turn = other(side);
		else if (budgets[side] > 0) this.patch.turn = side;
		else await this.advance();
	}
	async advance() {
		const order: Phase[] = ['evidence', 'witness', 'cross', 'closing'];
		const next = order[order.indexOf(this.room.phase) + 1];
		if (next === 'closing') {
			const seconds = paceFor(this.t.case.public).closingSeconds;
			const closingDeadline = Date.now() + seconds * 1000;
			Object.assign(this.patch, { phase: 'closing', turn: undefined, closingDeadline });
			await this.entry({
				side: 'court',
				kind: 'note',
				text: `Majelis mempersilakan Jaksa membacakan tuntutan dan Penasihat Hukum membacakan pledoi. Waktu ${Math.round(seconds / 60)} menit.`
			});
			await this.ctx.scheduler.runAt(closingDeadline, internal.court.closingTimeout, { roomId: this.room._id, trial: this.room.trial });
		} else if (next && isTurnPhase(next)) {
			const n = paceFor(this.t.case.public)[next];
			Object.assign(this.patch, { phase: next, turn: TURN_PHASES[next].opens, budgets: { defense: n, prosecution: n } });
			const intro = {
				witness: 'Sidang dilanjutkan dengan pemeriksaan saksi. Para pihak dipersilakan bertanya bergantian.',
				cross: 'Pemeriksaan silang. Hadapkan saksi dengan alat bukti.'
			}[next as 'witness' | 'cross'];
			await this.entry({ side: 'court', kind: 'note', text: intro });
		}
	}
	async save() {
		// Setiap kali giliran berpindah (atau fase berganti), jam giliran mulai lagi.
		const phase = this.patch.phase ?? this.room.phase;
		if (isTurnPhase(phase) && ('turn' in this.patch || 'budgets' in this.patch || 'phase' in this.patch)) {
			const turnDeadline = Date.now() + TURN_SECONDS[phase] * 1000;
			this.patch.turnDeadline = turnDeadline;
			await this.ctx.scheduler.runAt(turnDeadline, internal.court.turnTimeout, { roomId: this.room._id, turnDeadline });
		} else if ('phase' in this.patch && !isTurnPhase(phase)) {
			this.patch.turnDeadline = undefined;
		}
		if (Object.keys(this.patch).length) await this.ctx.db.patch(this.room._id, this.patch);
	}
}

async function open(ctx: MutationCtx, roomId: Id<'courtRooms'>, playerId: string) {
	const room = await loadRoom(ctx, roomId);
	const side = requireSeat(room, playerId);
	return { room, side, s: new Session(ctx, room) };
}

/**
 * Timbangan sementara, -100 (Jaksa unggul) sampai 100 (Penasihat Hukum unggul).
 * Hanya dari tanggapan majelis yang sudah terbuka di berita acara.
 */
function momentum(log: Entry[], discredited: Set<string>) {
	const { score } = tally(log as never, {}, discredited);
	return Math.max(-100, Math.min(100, Math.round((score.defense - score.prosecution) * 6)));
}

/** Kalimat baku bila pemain tidak menulis apa pun. */
function autoLine(argType: ArgType, suspect: string | undefined, cites: string[], t: CaseTools) {
	const short = (k: string) => (k.includes('.') ? `keterangan ${t.case.public.witnesses[k.split('.')[0]]?.short ?? k}` : k);
	const list = [...new Set(cites.map(short))];
	const and = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} dan ${xs.at(-1)}`);
	const who = t.name(suspect ?? t.case.public.accused);
	switch (argType) {
		case 'accuse':
			return list.length ? `Yang Mulia, ${and(list)} menunjukkan ${who} pelakunya.` : `Yang Mulia, ${who} pelakunya.`;
		case 'challenge':
			return list.length > 1
				? `Yang Mulia, ${list[0]} tidak dapat dipegang, mengingat ${and(list.slice(1))}.`
				: `Yang Mulia, ${list[0] ?? 'bukti itu'} tidak dapat dipegang.`;
		case 'contradiction':
			return `Yang Mulia, ${list[0] ?? '…'} dan ${list[1] ?? '…'} tidak mungkin sama-sama benar.`;
		case 'doubt':
			return list.length ? `Yang Mulia, cerita lawan berlubang: ${and(list)}.` : 'Yang Mulia, cerita lawan penuh keraguan.';
	}
}

// ---------- Query ----------

/** Daftar perkara untuk lobi: hanya judul dan ringkasan. */
export const cases = query({
	args: {},
	handler: async () =>
		CASES.map((c) => ({
			id: c.public.id,
			title: c.public.title,
			tagline: c.public.tagline,
			setting: c.public.setting,
			docket: c.public.docket,
			tutorial: !!c.public.tutorial
		}))
});

export const get = query({
	args: { code: v.string(), playerId: v.string() },
	handler: async (ctx, { code, playerId }) => {
		const room = await ctx.db
			.query('courtRooms')
			.withIndex('by_code', (q) => q.eq('code', code.toUpperCase()))
			.unique();
		if (!room) return null;
		const t = caseFor(room.caseId);
		const side = seatOf(room, playerId);
		const ended = room.phase === 'verdict';
		const log = await entries(ctx, room);
		const discredited = new Set(room.discredited.map((d) => d.fact));

		// Tiap pemain melihat bukti publik, berkasnya sendiri, dan apa pun yang sudah masuk catatan sidang.
		// Berkas lawan yang belum diajukan dan catatan tersembunyi tak pernah meninggalkan server.
		const evidence: (EvidenceView & { truth?: string; role?: string })[] = t.case.evidence
			.filter((e) => ended || e.kind === 'public' || e.kind === side || room.onRecord.includes(e.id))
			.map((e) => ({
				id: e.id,
				kind: e.kind,
				title: e.title,
				text: e.text,
				flag: e.flag,
				onRecord: e.kind === 'public' || room.onRecord.includes(e.id),
				discredited: discredited.has(e.id),
				...(ended ? { truth: e.truth, role: e.role } : {})
			}));

		const bothOpened = !!room.openings.defense && !!room.openings.prosecution;
		const bothClosed = !!room.closings.defense && !!room.closings.prosecution;
		const closingsOpen = bothClosed || room.phase === 'deliberating' || ended;
		const sealed = <T>(mine: Side, value: T, open: boolean) => (open || mine === side ? value : undefined);

		return {
			_id: room._id,
			code: room.code,
			case: t.case.public,
			phase: room.phase,
			players: room.players,
			defenseId: room.defenseId,
			trial: room.trial,
			turn: room.turn,
			budgets: room.budgets,
			clarifications: room.clarifications,
			closingDeadline: room.closingDeadline,
			turnDeadline: room.turnDeadline,
			shout: room.shout,
			momentum: momentum(log, discredited),
			onRecord: room.onRecord,
			discredited: room.discredited,
			contradictions: room.contradictions,
			history: room.history,
			you: side,
			openings: {
				defense: sealed('defense', room.openings.defense, bothOpened),
				prosecution: sealed('prosecution', room.openings.prosecution, bothOpened),
				defenseIn: !!room.openings.defense,
				prosecutionIn: !!room.openings.prosecution
			},
			closings: {
				defense: sealed('defense', room.closings.defense, closingsOpen),
				prosecution: sealed('prosecution', room.closings.prosecution, closingsOpen),
				defenseIn: !!room.closings.defense,
				prosecutionIn: !!room.closings.prosecution
			},
			evidence,
			entries: log
				.sort((a, b) => a.seq - b.seq)
				.map(({ backing, ...e }) => ({
					...e,
					// Cadangan tersegel hanya ditunjukkan ke pemiliknya, atau setelah putusan.
					backing: ended || e.side === side ? backing : undefined
				})),
			verdict: ended ? room.verdict : undefined,
			truth: ended ? t.case.truth : undefined,
			stats: ended ? stats(room, log, t) : undefined
		};
	}
});

function stats(room: Room, log: Entry[], t: CaseTools) {
	const per = (side: Side) => {
		const mine = log.filter((e) => e.side === side);
		const evidenceUsed = new Set(mine.flatMap((e) => [...e.cites, ...(e.backing ?? [])]).filter((k) => t.byId[k]));
		const witnesses = new Set(
			mine
				.filter((e) => e.kind === 'confront' || e.argType === 'credibility')
				.map((e) => e.witness ?? e.cites[0]?.split('.')[0])
				.filter(Boolean)
		);
		return {
			evidenceUsed: evidenceUsed.size,
			contradictionsFound: room.contradictions.filter((c) => c.side === side).length,
			argumentsAccepted: mine.filter((e) => ['strong', 'accepted', 'sustained', 'contradiction'].includes(e.reaction ?? '')).length,
			unsupportedClaims: mine.filter((e) => e.status === 'unverified' || e.status === 'exposed').length,
			bluffsExposed: mine.filter((e) => e.status === 'exposed').length,
			witnessesChallenged: witnesses.size
		};
	};
	const cited = new Set(log.flatMap((e) => e.cites));
	const key = t.case.evidence.filter((e) => e.role === 'key').map((e) => e.id);
	return {
		defense: per('defense'),
		prosecution: per('prosecution'),
		mattered: key.filter((id) => cited.has(id)),
		missed: key.filter((id) => !cited.has(id)),
		misleading: t.case.evidence.filter((e) => e.role === 'misleading').map((e) => e.id)
	};
}

/** Waktu server, supaya hitung mundur pledoi sama di kedua layar. */
export const now = mutation({ args: {}, handler: async () => Date.now() });

// ---------- Ruang ----------

export const create = mutation({
	args: { playerId: v.string(), name: v.string(), caseId: v.optional(v.string()) },
	handler: async (ctx, { playerId, name, caseId }) => {
		let code = '';
		for (let attempt = 0; attempt < 10; attempt++) {
			code = Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
			const existing = await ctx.db
				.query('courtRooms')
				.withIndex('by_code', (q) => q.eq('code', code))
				.unique();
			if (!existing) break;
		}
		const t = caseFor(caseId);
		await ctx.db.insert('courtRooms', {
			code,
			caseId: t.case.public.id,
			phase: 'waiting',
			players: [{ id: playerId, name: cleanName(name) }],
			// Pemain 1 membela; pemain 2 menuntut. Sidang baru menukar peran.
			defenseId: playerId,
			trial: 1,
			budgets: { defense: 0, prosecution: 0 },
			clarifications: { defense: paceFor(t.case.public).clarifications, prosecution: paceFor(t.case.public).clarifications },
			openings: {},
			closings: {},
			onRecord: publicIds(t),
			discredited: [],
			contradictions: [],
			seq: 0,
			history: []
		});
		return code;
	}
});

export const join = mutation({
	args: { code: v.string(), playerId: v.string(), name: v.string() },
	handler: async (ctx, { code, playerId, name }) => {
		const room = await ctx.db
			.query('courtRooms')
			.withIndex('by_code', (q) => q.eq('code', code.trim().toUpperCase()))
			.unique();
		if (!room) throw new ConvexError('Tidak ada ruang sidang dengan kode itu');
		if (room.players.some((p) => p.id === playerId)) return room.code;
		if (room.players.length >= 2) throw new ConvexError('Kedua pihak sudah duduk di ruang sidang');
		await ctx.db.patch(room._id, { players: [...room.players, { id: playerId, name: cleanName(name) }], phase: 'briefing' });
		return room.code;
	}
});

/** Selama persiapan, sebelum ada pernyataan pembuka: ganti perkara. */
export const chooseCase = mutation({
	args: { roomId: v.id('courtRooms'), playerId: v.string(), caseId: v.string() },
	handler: async (ctx, { roomId, playerId, caseId }) => {
		const room = await loadRoom(ctx, roomId);
		requireSeat(room, playerId);
		if (room.phase !== 'waiting' && room.phase !== 'briefing') throw new ConvexError('Sidang sudah berjalan');
		if (room.openings.defense || room.openings.prosecution) throw new ConvexError('Pernyataan pembuka sudah masuk');
		const t = caseFor(caseId);
		const n = paceFor(t.case.public).clarifications;
		await ctx.db.patch(roomId, { caseId: t.case.public.id, onRecord: publicIds(t), clarifications: { defense: n, prosecution: n } });
	}
});

// ---------- Persiapan ----------

export const opening = mutation({
	args: { roomId: v.id('courtRooms'), playerId: v.string(), text: v.string() },
	handler: async (ctx, { roomId, playerId, text }) => {
		const { room, side, s } = await open(ctx, roomId, playerId);
		if (room.phase !== 'briefing') throw new ConvexError('Tahap pernyataan pembuka sudah lewat');
		// Boleh kosong: majelis mencatat pembuka singkat, supaya tak ada yang menunggu ketikan.
		const statement =
			cleanText(text, MAX_OPENING) ||
			(side === 'defense'
				? 'Yang Mulia, klien kami tidak bersalah. Kami akan menunjukkan keraguan yang wajar.'
				: 'Yang Mulia, bukti akan menunjukkan terdakwa bersalah secara sah dan meyakinkan.');
		const openings = { ...room.openings, [side]: statement };
		s.patch.openings = openings;
		if (openings.defense && openings.prosecution) {
			for (const who of ['prosecution', 'defense'] as Side[]) await s.entry({ side: who, kind: 'opening', text: openings[who] });
			const n = paceFor(s.t.case.public).evidence;
			Object.assign(s.patch, { phase: 'evidence', turn: TURN_PHASES.evidence.opens, budgets: { defense: n, prosecution: n } });
			await s.entry({ side: 'court', kind: 'note', text: 'Sidang dilanjutkan dengan pembuktian. Jaksa Penuntut dipersilakan.' });
		}
		await s.save();
	}
});

// ---------- Langkah ----------

export const present = mutation({
	args: { roomId: v.id('courtRooms'), playerId: v.string(), evidence: v.string(), text: v.optional(v.string()) },
	handler: async (ctx, { roomId, playerId, evidence, text }) => {
		const { room, side, s } = await open(ctx, roomId, playerId);
		requireTurn(room, side, ['evidence', 'cross']);
		if (!s.ownPrivate(side, evidence)) throw new ConvexError('Hanya bisa mengajukan bukti dari berkas sendiri');
		if (room.onRecord.includes(evidence)) throw new ConvexError('Bukti itu sudah ada di catatan sidang');
		s.record(evidence);
		await s.entry({
			side,
			kind: 'present',
			text: cleanText(text) || undefined,
			cites: [evidence],
			reaction: 'noted' satisfies Reaction,
			ruling: `${s.t.factLabel(evidence)} diterima sebagai alat bukti.`
		});
		await s.spend(side);
		await s.save();
	}
});

export const argue = mutation({
	args: {
		roomId: v.id('courtRooms'),
		playerId: v.string(),
		argType: v.string(),
		suspect: v.optional(v.string()),
		text: v.string(),
		cites: v.array(v.string()),
		/** Berkas sendiri yang belum diajukan, ditahan sebagai cadangan tersegel. */
		backing: v.optional(v.array(v.string())),
		targetSeq: v.optional(v.number())
	},
	handler: async (ctx, args) => {
		const { room, side, s } = await open(ctx, args.roomId, args.playerId);
		requireTurn(room, side, ['evidence', 'cross']);
		if (!(args.argType in ARG_TYPES)) throw new ConvexError('Jenis argumen tidak dikenal');
		const argType = args.argType as ArgType;
		if (args.suspect && !(args.suspect in s.t.case.public.suspects)) throw new ConvexError('Tokoh tidak dikenal');
		const cites = [...new Set(args.cites)].slice(0, 5);
		// Kalimat boleh kosong: majelis mencatat kalimat baku dari langkah dan kutipannya.
		const text = cleanText(args.text) || autoLine(argType, args.suspect, cites, s.t);
		for (const key of cites) if (!s.citable(side, key)) throw new ConvexError(`Tidak bisa mengutip ${key}`);
		const backing = [...new Set(args.backing ?? [])].filter((k) => !cites.includes(k)).slice(0, 3);
		for (const key of backing) {
			if (!s.ownPrivate(side, key) || room.onRecord.includes(key)) {
				throw new ConvexError('Hanya berkas sendiri yang belum diajukan yang bisa ditahan');
			}
		}
		if (ARG_TYPES[argType].pair && cites.length !== 2) throw new ConvexError('Kutip tepat dua hal untuk mengungkap kontradiksi');
		if (ARG_TYPES[argType].target && !cites.length) throw new ConvexError('Kutip dulu bukti yang Saudara serang');

		// Mengutip berkas sendiri berarti mengajukannya.
		s.record(...cites);
		let ruling = rule({ argType, suspect: args.suspect, cites }, { ...boardFor(room, side), onRecord: new Set(s.onRecord) }, s.t);
		// Dengan cadangan tersegel, klaim yang kalah di atas kertas menunggu diuji lawan.
		const claim = CLAIM_TYPES.includes(argType);
		if (claim && backing.length && BLUFFABLE.includes(ruling.reaction)) {
			ruling = { reaction: 'unverified', text: 'Belum terbukti dari yang dikutip. Pihak lawan dapat menuntut buktinya.' };
		}

		const seq = await s.entry({
			side,
			kind: 'argue',
			argType,
			suspect: args.suspect,
			text,
			cites,
			backing: backing.length ? backing : undefined,
			targetSeq: args.targetSeq,
			reaction: ruling.reaction,
			ruling: ruling.text,
			status: ruling.reaction === 'unverified' && claim ? 'unverified' : undefined
		});
		if (ruling.discredit) s.discredit(ruling.discredit, side, seq);
		if (ruling.contradiction) s.contradiction(ruling.contradiction, side, seq);
		await s.spend(side);
		await s.save();
	}
});

export const clarify = mutation({
	args: { roomId: v.id('courtRooms'), playerId: v.string(), fact: v.string(), text: v.optional(v.string()) },
	handler: async (ctx, { roomId, playerId, fact, text }) => {
		const { room, side, s } = await open(ctx, roomId, playerId);
		requireTurn(room, side, ['evidence', 'witness', 'cross']);
		if (room.clarifications[side] <= 0) throw new ConvexError('Jatah permintaan ke majelis sudah habis');
		if (!s.citable(side, fact) || !s.t.byId[fact]) throw new ConvexError('Tanyakan bukti yang bisa Saudara lihat');
		s.patch.clarifications = { ...room.clarifications, [side]: room.clarifications[side] - 1 };
		const lead = s.t.case.clarify[fact];
		const question = cleanText(text) || `Mohon klarifikasi atas ${s.t.factLabel(fact)}.`;
		if (lead && !s.onRecord.includes(lead.reveals)) {
			s.record(lead.reveals);
			await s.entry({
				side,
				kind: 'clarify',
				text: question,
				cites: [fact, lead.reveals],
				reaction: 'revealed' satisfies Reaction,
				ruling: `${lead.text} Catatan baru: ${s.t.factLabel(lead.reveals)}.`
			});
		} else {
			await s.entry({
				side,
				kind: 'clarify',
				text: question,
				cites: [fact],
				reaction: 'nothing' satisfies Reaction,
				ruling: 'Majelis tidak memiliki keterangan lebih lanjut soal itu.'
			});
		}
		await s.spend(side);
		await s.save();
	}
});

export const ask = mutation({
	args: {
		roomId: v.id('courtRooms'),
		playerId: v.string(),
		witness: v.string(),
		topic: v.optional(v.string()),
		question: v.optional(v.string())
	},
	handler: async (ctx, { roomId, playerId, witness, topic, question }) => {
		const { room, side, s } = await open(ctx, roomId, playerId);
		requireTurn(room, side, ['witness']);
		const w = s.t.case.witnesses[witness];
		if (!w) throw new ConvexError('Saksi tidak dikenal');
		if (topic) {
			if (!topicsFor(s.t.case.public).includes(topic) || !w.answers[topic]) throw new ConvexError('Pertanyaan tidak dikenal');
			const key = `${witness}.${topic}`;
			if (room.onRecord.includes(key)) throw new ConvexError('Saksi sudah menjawab pertanyaan itu');
			const a = w.answers[topic];
			const broken = w.broken && room.onRecord.includes(w.broken.key) && a.honesty === 'lie';
			if (!broken) s.record(key);
			await s.entry({
				side,
				kind: 'ask',
				witness,
				topic,
				text: topicLabel(topic, s.t.case.public),
				answer: broken ? w.broken!.text : a.text,
				cites: broken ? [] : [key],
				reaction: 'answered' satisfies Reaction
			});
		} else {
			const q = cleanText(question, MAX_QUESTION);
			if (q.length < 5) throw new ConvexError('Ajukan pertanyaan kepada saksi');
			await s.entry({ side, kind: 'ask', witness, text: q, pending: true, reaction: 'answered' satisfies Reaction });
			await ctx.scheduler.runAfter(0, internal.courtJudge.answer, { entryId: s.lastId! });
		}
		await s.spend(side);
		await s.save();
	}
});

export const confront = mutation({
	args: { roomId: v.id('courtRooms'), playerId: v.string(), witness: v.string(), fact: v.string(), text: v.optional(v.string()) },
	handler: async (ctx, { roomId, playerId, witness, fact, text }) => {
		const { room, side, s } = await open(ctx, roomId, playerId);
		requireTurn(room, side, ['cross']);
		const w = s.t.case.witnesses[witness];
		if (!w) throw new ConvexError('Saksi tidak dikenal');
		if (!s.citable(side, fact)) throw new ConvexError(`Tidak bisa menghadapkan ${fact} kepada saksi`);
		s.record(fact);
		const hit = w.confront[fact];
		const said = room.onRecord.filter((k) => k.startsWith(`${witness}.`));
		let found: { a: string; b: string; text: string } | undefined;
		if (hit) {
			s.record(hit.key);
			const known = new Set(room.contradictions.map((c) => s.t.findContradiction(c.a, c.b)));
			// Bukti itu terhadap keterangan saksi sebelumnya, lalu jawaban baru terhadap seluruh catatan.
			const pairs = [...said.map((k) => [fact, k]), ...said.map((k) => [hit.key, k]), ...room.onRecord.map((k) => [hit.key, k])];
			found = pairs.map(([a, b]) => s.t.findContradiction(a, b)).find((c) => c && !known.has(c));
		}
		const seq = await s.entry({
			side,
			kind: 'confront',
			witness,
			text: cleanText(text) || `Saksi ditunjukkan ${s.t.factLabel(fact)}.`,
			cites: hit ? [fact, hit.key] : [fact],
			answer: hit?.text ?? 'Saya tidak mengerti apa hubungannya dengan saya.',
			reaction: (found ? 'contradiction' : hit ? 'answered' : 'nothing') satisfies Reaction,
			ruling: found?.text
		});
		if (found) s.contradiction(found, side, seq);
		await s.spend(side);
		await s.save();
	}
});

/** "Minta bukti": gratis, kapan saja selama persidangan, atas klaim lawan yang belum terbukti. */
export const demandProof = mutation({
	args: { roomId: v.id('courtRooms'), playerId: v.string(), targetSeq: v.number() },
	handler: async (ctx, { roomId, playerId, targetSeq }) => {
		const { room, side, s } = await open(ctx, roomId, playerId);
		if (!isTurnPhase(room.phase)) throw new ConvexError('Keberatan hanya didengar selama persidangan');
		const target = (await entries(ctx, room)).find((e) => e.seq === targetSeq);
		if (!target || target.side !== other(side)) throw new ConvexError('Ajukan keberatan atas klaim pihak lawan');
		if (target.status !== 'unverified') throw new ConvexError('Klaim itu sudah diuji');
		const backing = target.backing ?? [];
		const ok = proves(
			{ argType: target.argType as ArgType, suspect: target.suspect, cites: target.cites },
			backing,
			boardFor(room, other(side)),
			s.t
		);
		if (ok) {
			s.record(...backing);
			await ctx.db.patch(target._id, { status: 'proven', cites: [...target.cites, ...backing], reaction: ok.reaction, ruling: ok.text });
			if (ok.discredit) s.discredit(ok.discredit, other(side), targetSeq);
			await s.entry({
				side,
				kind: 'objection',
				targetSeq,
				cites: backing,
				reaction: 'proven' satisfies Reaction,
				ruling: `Pihak lawan menunjukkan ${backing.map(s.t.factLabel).join(', ')}. Klaim #${targetSeq} berdiri. Keberatan ditolak.`
			});
		} else {
			await ctx.db.patch(target._id, { status: 'exposed' });
			await s.entry({
				side,
				kind: 'objection',
				targetSeq,
				reaction: 'exposed' satisfies Reaction,
				ruling: backing.length
					? `Bukti yang ditahan tidak mendukung klaim #${targetSeq}. Klaim dicoret.`
					: `Tidak ada apa pun di balik klaim #${targetSeq}. Klaim dicoret sebagai gertakan.`
			});
		}
		await s.save();
	}
});

/** Jam giliran habis: satu langkah hangus dan giliran berpindah. */
export const turnTimeout = internalMutation({
	args: { roomId: v.id('courtRooms'), turnDeadline: v.number() },
	handler: async (ctx, { roomId, turnDeadline }) => {
		const room = await ctx.db.get(roomId);
		if (!room || room.turnDeadline !== turnDeadline || !isTurnPhase(room.phase) || !room.turn) return;
		const side = room.turn;
		if (room.budgets[side] <= 0) return;
		const s = new Session(ctx, room);
		await s.entry({ side: 'court', kind: 'note', text: `Waktu habis. ${SIDE_LABEL[side]} kehilangan satu langkah.` });
		await s.spend(side);
		await s.save();
	}
});

/** "KEBERATAN!" dan kawan-kawan: hanya untuk suasana, tak mengubah apa pun di persidangan. */
export const shout = mutation({
	args: { roomId: v.id('courtRooms'), playerId: v.string(), kind: v.string() },
	handler: async (ctx, { roomId, playerId, kind }) => {
		const room = await loadRoom(ctx, roomId);
		const side = requireSeat(room, playerId);
		if (!(kind in SHOUTS)) throw new ConvexError('Teriakan tidak dikenal');
		if (room.phase === 'waiting' || room.phase === 'verdict') return;
		const now = Date.now();
		if (room.shout && room.shout.side === side && now - room.shout.at < SHOUT_COOLDOWN_MS) return;
		await ctx.db.patch(roomId, { shout: { side, kind, at: now } });
	}
});

export const rest = mutation({
	args: { roomId: v.id('courtRooms'), playerId: v.string() },
	handler: async (ctx, { roomId, playerId }) => {
		const { room, side, s } = await open(ctx, roomId, playerId);
		requireTurn(room, side, ['evidence', 'witness', 'cross']);
		const budgets = { ...room.budgets, [side]: 0 };
		s.patch.budgets = budgets;
		await s.entry({ side, kind: 'rest', text: `${SIDE_LABEL[side]} mencukupkan tahap ini.` });
		await s.passTurn(side, budgets);
		await s.save();
	}
});

// ---------- Tuntutan, pledoi dan putusan ----------

export const closing = mutation({
	args: { roomId: v.id('courtRooms'), playerId: v.string(), parts: v.record(v.string(), v.string()), cites: v.array(v.string()) },
	handler: async (ctx, { roomId, playerId, parts, cites }) => {
		const { room, side, s } = await open(ctx, roomId, playerId);
		if (room.phase !== 'closing') throw new ConvexError('Tahap tuntutan dan pledoi sudah lewat');
		if (room.closings[side]) throw new ConvexError('Saudara sudah membacakannya');
		if (room.closingDeadline && Date.now() > room.closingDeadline + 5000) throw new ConvexError('Waktu habis, Saudara');
		const clean: Record<string, string> = {};
		for (const { key } of CLOSING_PARTS) clean[key] = cleanText(parts[key]);
		const keep = [...new Set(cites)].filter((k) => room.onRecord.includes(k)).slice(0, 5);
		const closings = { ...room.closings, [side]: { parts: clean, cites: keep, at: Date.now() } };
		s.patch.closings = closings;
		if (closings.defense && closings.prosecution) await deliberate(ctx, s);
		await s.save();
	}
});

export const closingTimeout = internalMutation({
	args: { roomId: v.id('courtRooms'), trial: v.number() },
	handler: async (ctx, { roomId, trial }) => {
		const room = await ctx.db.get(roomId);
		if (!room || room.phase !== 'closing' || room.trial !== trial) return;
		if (room.closingDeadline && Date.now() < room.closingDeadline) return;
		const s = new Session(ctx, room);
		const empty = { parts: {}, cites: [], at: Date.now() };
		s.patch.closings = { defense: room.closings.defense ?? empty, prosecution: room.closings.prosecution ?? empty };
		await deliberate(ctx, s);
		await s.save();
	}
});

async function deliberate(ctx: MutationCtx, s: Session) {
	const closings = s.patch.closings ?? s.room.closings;
	for (const side of ['prosecution', 'defense'] as Side[]) {
		const c = closings[side];
		const text =
			c && Object.values(c.parts).some((x) => x)
				? CLOSING_PARTS.map((p) => c.parts[p.key]).filter(Boolean).join('\n\n')
				: '(Tidak membacakan apa pun.)';
		await s.entry({ side, kind: 'closing', text, cites: c?.cites ?? [] });
	}
	s.patch.phase = 'deliberating';
	s.patch.turn = undefined;
	await s.entry({ side: 'court', kind: 'note', text: 'Majelis hakim bermusyawarah untuk menjatuhkan putusan.' });
	await ctx.scheduler.runAfter(0, internal.courtJudge.deliberate, { roomId: s.room._id, trial: s.room.trial });
}

/** Semua yang dibutuhkan hakim, termasuk kebenaran. Tak pernah dikirim ke klien. */
export const dossier = internalQuery({
	args: { roomId: v.id('courtRooms'), trial: v.number() },
	handler: async (ctx, { roomId, trial }) => {
		const room = await ctx.db.get(roomId);
		if (!room || room.trial !== trial || room.phase !== 'deliberating') return null;
		const log = (await entries(ctx, room)).sort((a, b) => a.seq - b.seq);
		return { room, log };
	}
});

export const decide = internalMutation({
	args: { roomId: v.id('courtRooms'), trial: v.number(), verdict: v.optional(courtVerdict) },
	handler: async (ctx, { roomId, trial, verdict }) => {
		const room = await ctx.db.get(roomId);
		if (!room || room.trial !== trial || room.phase !== 'deliberating') return;
		const log = await entries(ctx, room);
		const final = verdict ?? fallbackVerdict(room, log);
		const defense = room.players.find((p) => p.id === room.defenseId);
		const prosecution = room.players.find((p) => p.id !== room.defenseId);
		await ctx.db.patch(roomId, {
			phase: 'verdict',
			verdict: final,
			history: [
				{
					trial,
					caseTitle: caseFor(room.caseId).case.public.title,
					defenseName: defense?.name ?? '?',
					prosecutionName: prosecution?.name ?? '?',
					verdict: final.verdict
				},
				...room.history
			].slice(0, MAX_HISTORY)
		});
	}
});

export function fallbackVerdict(room: Room, log: Entry[]): Verdict {
	const t = caseFor(room.caseId);
	const pub = t.case.public;
	const discredited = new Set(room.discredited.map((d) => d.fact));
	const { score, best, worst } = tally(log as never, room.closings, discredited);
	// Secara sah dan meyakinkan: jaksa harus unggul jelas.
	const guilty = score.prosecution >= score.defense + 3;
	const found = room.contradictions.length;
	const struck = room.discredited.length;
	const reasoning = guilty
		? `Penuntut umum membangun dakwaan yang lebih kuat. Pembela tidak menimbulkan keraguan yang dinilai wajar oleh majelis` +
			`${found ? `, meski ada ${found} kontradiksi di catatan sidang` : ''}.`
		: `Penuntut umum tidak berhasil membuktikan dakwaan secara sah dan meyakinkan` +
			`${score.prosecution > score.defense ? ': unggul, tetapi tidak cukup jauh untuk menghapus keraguan' : ''}. ` +
			`${struck ? `${struck} alat bukti dicoret atau dinetralkan` : 'Bukti kunci tidak teruji'}${found ? ` dan ${found} kontradiksi ditemukan` : ''}.`;
	// Poin mentah ke skala 0–100 yang sama dengan hakim AI.
	const scale = (n: number) => Math.max(0, Math.min(100, Math.round(30 + n * 5)));

	const closing = Object.values(room.closings.defense?.parts ?? {}).join(' ').toLowerCase();
	const pointed = (suspect: string) => {
		const s = pub.suspects[suspect];
		const names = [s.name, s.short, s.name.split(' ')[0]].map((x) => x.toLowerCase().replace(/^(pak|bu|h\.|haji)\s+/, ''));
		return (
			names.some((n) => n.length > 2 && closing.includes(n)) ||
			log.some((e) => e.side === 'defense' && e.suspect === suspect && ['strong', 'accepted'].includes(e.reaction ?? ''))
		);
	};
	const culprit = pub.suspects[t.case.truth.culprit];
	const decoy = Object.keys(pub.suspects).find((id) => id !== pub.accused && id !== t.case.truth.culprit);
	const defenseVsTruth = pointed(t.case.truth.culprit)
		? `Pembela menunjuk ${culprit.name} — pelaku sebenarnya.`
		: decoy && pointed(decoy)
			? `Pembela menunjuk ${pub.suspects[decoy].name}, yang ternyata tidak bersalah.`
			: `Pembela tak pernah menyebut pelaku sebenarnya, ${culprit.name}.`;
	const prosecutionVsTruth = `Penuntut umum mendakwa ${pub.suspects[pub.accused].name}. Kenyataannya pelakunya ${culprit.name}.`;

	const cited = new Set(log.flatMap((e) => e.cites));
	const keyEvidence = t.case.evidence
		.filter((e) => e.role === 'key' && cited.has(e.id))
		.slice(0, 5)
		.map((e) => ({ id: e.id, why: e.truth }));

	const claims = log
		.filter((e) => e.status)
		.map((e) => {
			const ok = e.status === 'proven';
			const fair = e.side === 'defense' && (e.suspect === t.case.truth.culprit || e.argType === 'doubt');
			return {
				seq: e.seq,
				call: (ok ? 'supported' : fair ? 'interpretation' : e.status === 'exposed' ? 'lie' : 'mistake') as Verdict['claims'][number]['call'],
				note: ok ? 'Didukung bukti yang ditahan.' : fair ? 'Belum terbukti, tapi tafsir yang wajar atas fakta.' : 'Tak ada di berkas yang mendukungnya.'
			};
		});

	return {
		verdict: guilty ? 'guilty' : 'not_guilty',
		reasoning,
		by: 'fallback',
		defense: {
			score: scale(score.defense),
			strongest: describe(best.defense.e, t),
			weakest: describe(worst.defense.e, t),
			vsTruth: defenseVsTruth
		},
		prosecution: {
			score: scale(score.prosecution),
			strongest: describe(best.prosecution.e, t),
			weakest: describe(worst.prosecution.e, t),
			vsTruth: prosecutionVsTruth
		},
		keyEvidence,
		claims,
		unresolved: t.case.evidence.filter((e) => e.kind !== 'public' && !room.onRecord.includes(e.id)).map((e) => e.id)
	};
}

// ---------- Jawaban saksi dari AI ----------

export const witnessContext = internalQuery({
	args: { entryId: v.id('courtEntries') },
	handler: async (ctx, { entryId }) => {
		const entry = await ctx.db.get(entryId);
		if (!entry || !entry.pending || !entry.witness) return null;
		const room = await ctx.db.get(entry.roomId);
		if (!room) return null;
		const t = caseFor(room.caseId);
		const w = t.case.witnesses[entry.witness];
		if (!w) return null;
		const broken = !!w.broken && room.onRecord.includes(w.broken.key);
		return {
			name: t.case.public.witnesses[entry.witness].name,
			caseTitle: t.case.public.title,
			setting: t.case.public.setting,
			persona: w.persona,
			broken,
			question: entry.text ?? '',
			answers: Object.entries(w.answers).map(([topic, a]) => ({
				topic,
				question: topicLabel(topic, t.case.public),
				text: broken && a.honesty === 'lie' ? w.broken!.text : a.text
			}))
		};
	}
});

export const setAnswer = internalMutation({
	args: { entryId: v.id('courtEntries'), answer: v.string(), topic: v.optional(v.string()) },
	handler: async (ctx, { entryId, answer, topic }) => {
		const entry = await ctx.db.get(entryId);
		if (!entry || !entry.pending || !entry.witness) return;
		const room = await ctx.db.get(entry.roomId);
		if (!room) return;
		const t = caseFor(room.caseId);
		const w = t.case.witnesses[entry.witness];
		const key = topic && w?.answers[topic] ? `${entry.witness}.${topic}` : undefined;
		const broken = key && w.broken && room.onRecord.includes(w.broken.key) && t.testimony[key]?.honesty === 'lie';
		const recorded = key && !broken ? key : undefined;
		await ctx.db.patch(entryId, { pending: false, answer: answer.slice(0, MAX_TEXT), cites: recorded ? [recorded] : [] });
		if (recorded && !room.onRecord.includes(recorded) && room.trial === entry.trial) {
			await ctx.db.patch(room._id, { onRecord: [...room.onRecord, recorded] });
		}
	}
});

// ---------- Sidang baru ----------

/** Setelah putusan: sidang baru dengan peran ditukar, boleh dengan perkara lain. */
export const again = mutation({
	args: { roomId: v.id('courtRooms'), playerId: v.string(), caseId: v.optional(v.string()) },
	handler: async (ctx, { roomId, playerId, caseId }) => {
		const room = await loadRoom(ctx, roomId);
		requireSeat(room, playerId);
		if (room.phase !== 'verdict') return;
		const t = caseFor(caseId ?? room.caseId ?? DEFAULT_CASE);
		const prosecutor = room.players.find((p) => p.id !== room.defenseId);
		await ctx.db.patch(roomId, {
			caseId: t.case.public.id,
			phase: 'briefing',
			defenseId: prosecutor?.id ?? room.defenseId,
			trial: room.trial + 1,
			turn: undefined,
			budgets: { defense: 0, prosecution: 0 },
			clarifications: { defense: paceFor(t.case.public).clarifications, prosecution: paceFor(t.case.public).clarifications },
			openings: {},
			closings: {},
			closingDeadline: undefined,
			turnDeadline: undefined,
			shout: undefined,
			onRecord: publicIds(t),
			discredited: [],
			contradictions: [],
			verdict: undefined
		});
	}
});
