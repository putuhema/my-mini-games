// Putusan sela seketika dan putusan cadangan. Deterministik, hanya server.
// Hakim AI (convex/courtJudge.ts) yang memutus akhir bila tersedia.

import { ARG_TYPES, type ArgType, type Reaction, type Side } from './rules';
import type { CaseTools } from './case';

export type Board = {
	side: Side;
	onRecord: Set<string>;
	/** Fakta yang dicoret atau dinetralkan. */
	discredited: Set<string>;
	/** Fakta yang sudah menjadi bagian kontradiksi yang ditemukan. */
	contradicted: Set<string>;
};

export type Ruling = {
	reaction: Reaction;
	text: string;
	discredit?: string;
	contradiction?: { a: string; b: string; text: string };
};

/** Klaim yang butuh bukti: bisa dijawab dengan "Tuntut bukti". */
export const CLAIM_TYPES: ArgType[] = ['accuse', 'challenge', 'doubt'];

const ASPECTS = ['kesempatan', 'motif', 'identitas', 'kronologi'] as const;
const ASPECT_OF: Record<string, (typeof ASPECTS)[number]> = {
	opportunity: 'kesempatan',
	motive: 'motif',
	identity: 'identitas',
	timeline: 'kronologi'
};

const joinAnd = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} dan ${xs.at(-1)}`);

export function rule(arg: { argType: ArgType; suspect?: string; cites: string[] }, board: Board, t: CaseTools): Ruling {
	const { cites } = arg;
	const label = (k: string) => t.factLabel(k);
	// Ringkas: E1 untuk bukti, "keterangan Mang Udin" untuk saksi.
	const short = (k: string) => (k.includes('.') ? `keterangan ${t.case.public.witnesses[k.split('.')[0]]?.short ?? k}` : k);
	const list = (keys: string[]) => [...new Set(keys.map(short))].join(', ');

	switch (arg.argType) {
		case 'accuse': {
			const accused = t.case.public.accused;
			const suspect = arg.suspect && arg.suspect in t.case.public.suspects ? arg.suspect : accused;
			const who = t.name(suspect);
			const how = `Kutip bukti yang menunjukkan kesempatan, motif, identitas, atau kronologi ${who}.`;
			if (board.side === 'prosecution' && suspect !== accused) {
				return { reaction: 'weak', text: `Saudara Jaksa, menunjuk ${who} justru membantu pembela. Tuduhan Jaksa harus mengarah ke terdakwa.` };
			}
			if (board.side === 'defense' && suspect === accused) {
				return { reaction: 'weak', text: `Saudara Penasihat Hukum, itu justru memberatkan klien Saudara. Pilih tokoh lain untuk dituduh.` };
			}
			if (!cites.length) return { reaction: 'unverified', text: `Dicatat: Saudara menunjuk ${who}, tanpa bukti. ${how}` };

			// Untuk tiap kutipan: aspek apa yang ditopangnya tentang orang ini.
			const aspects = new Set<string>();
			const ok: string[] = [];
			const notes: string[] = [];
			for (const key of cites) {
				const supports = t.fact(key)?.supports ?? [];
				const mine = supports.filter((x) => x.endsWith(`:${suspect}`));
				if (board.discredited.has(key)) {
					notes.push(`${short(key)} sudah dikesampingkan`);
				} else if (mine.length) {
					ok.push(key);
					for (const x of mine) aspects.add(ASPECT_OF[x.split(':')[0]]);
				} else {
					const elsewhere = supports.map((x) => x.split(':')[1]).find((id) => id !== suspect);
					notes.push(elsewhere ? `${short(key)} justru mengarah ke ${t.name(elsewhere)}` : `${short(key)} tidak berkaitan dengan ${who}`);
				}
			}
			const what = joinAnd(ASPECTS.filter((a) => aspects.has(a)));
			const aside = notes.length ? ` (${notes.join('; ')}.)` : '';
			if (ok.length >= 2) return { reaction: 'strong', text: `Majelis menilai ${what} ${who} didukung kuat oleh ${list(ok)}.${aside}` };
			if (ok.length === 1) {
				return { reaction: 'accepted', text: `Diterima: ${short(ok[0])} menunjukkan ${what} ${who}.${aside} Satu bukti lagi akan membuatnya kuat.` };
			}
			return { reaction: 'weak', text: `Belum meyakinkan: ${notes.join('; ')}. ${how}` };
		}

		case 'challenge': {
			const target = cites[0];
			const f = target ? t.fact(target) : undefined;
			if (!target || !f) return { reaction: 'overruled', text: 'Ditolak. Kutip dulu bukti atau keterangan yang Saudara bantah.' };
			if (board.discredited.has(target)) return { reaction: 'noted', text: `${label(target)} sudah dikesampingkan sebelumnya.` };
			const rest = cites.slice(1).filter((c) => !board.discredited.has(c));

			if (f.authentic === false) {
				return { reaction: 'sustained', text: `Dikabulkan. Keaslian ${label(target)} tidak dapat dipastikan; dikesampingkan.`, discredit: target };
			}
			const by = rest.find((c) => f.underminedBy?.includes(c));
			if (by) return { reaction: 'sustained', text: `Dikabulkan. Mengingat ${label(by)}, ${label(target)} tidak dapat diandalkan.`, discredit: target };
			const reframe = rest.find((c) => f.reframedBy?.includes(c));
			if (reframe) {
				return { reaction: 'accepted', text: `Diterima. Dibaca bersama ${label(reframe)}, ${label(target)} kehilangan bobotnya.`, discredit: target };
			}
			// Saksi yang sudah tertangkap bertentangan kehilangan kredibilitasnya.
			const witness = target.includes('.') ? target.split('.')[0] : undefined;
			const caught = witness && [...board.contradicted].find((k) => k.startsWith(`${witness}.`));
			if (caught) return { reaction: 'sustained', text: `Dikabulkan. Saksi sudah terbukti bertentangan (${label(caught)}); keterangannya diragukan.`, discredit: target };
			if (f.reliability === 'unreliable') return { reaction: 'sustained', text: `Dikabulkan. ${label(target)} terlalu lemah untuk dipegang.`, discredit: target };

			if (f.reliability === 'contradictory') {
				return { reaction: 'weak', text: `${label(target)} memang diragukan, tapi Saudara belum menunjukkan sebabnya. Kutip hal yang bertentangan dengannya.` };
			}
			if (!rest.length) {
				return { reaction: 'unverified', text: `Bantahan atas ${label(target)} dicatat, tanpa dasar. Bantahan butuh bukti tandingan, keterangan saksi, atau catatan pengadilan.` };
			}
			return {
				reaction: 'overruled',
				text: `Ditolak. ${list(rest)} tidak melemahkan ${label(target)}. Cari bukti yang membantah isinya langsung, atau tanyakan saksi lebih dulu.`
			};
		}

		case 'contradiction': {
			const [a, b] = cites;
			if (!a || !b) return { reaction: 'overruled', text: 'Ditolak. Kontradiksi butuh tepat dua hal.' };
			const found = t.findContradiction(a, b);
			if (!found) {
				return {
					reaction: 'overruled',
					text: `Ditolak. ${label(a)} dan ${label(b)} bisa sama-sama benar. Kontradiksi biasanya soal waktu, tempat, atau orang yang sama.`
				};
			}
			if (board.contradicted.has(a) && board.contradicted.has(b)) return { reaction: 'noted', text: 'Majelis sudah mencatat kontradiksi itu.' };
			return { reaction: 'contradiction', text: found.text, contradiction: found };
		}

		case 'doubt': {
			const how = 'Keraguan butuh lubang nyata: kutip bukti yang sudah dikesampingkan atau bagian dari kontradiksi yang ditemukan.';
			if (!cites.length) return { reaction: 'unverified', text: `Keraguan diajukan tanpa dasar. ${how}` };
			const holes = cites.filter((c) => board.discredited.has(c) || board.contradicted.has(c));
			if (holes.length >= 2) return { reaction: 'strong', text: `Majelis mencatat lubang nyata: ${list(holes)}.` };
			if (holes.length === 1) return { reaction: 'accepted', text: `Dicatat: ${label(holes[0])} melemahkan cerita lawan.` };
			return { reaction: 'weak', text: `${list(cites)} belum tergoyahkan. ${how}` };
		}

		default:
			return { reaction: 'noted', text: 'Dicatat.' };
	}
}

/** Menilai ulang klaim tersegel dengan cadangannya, untuk "Minta bukti". */
export function proves(arg: { argType: ArgType; suspect?: string; cites: string[] }, backing: string[], board: Board, t: CaseTools) {
	if (!backing.length) return undefined;
	const r = rule({ ...arg, cites: [...arg.cites, ...backing] }, board, t);
	return r.reaction === 'strong' || r.reaction === 'accepted' || r.reaction === 'sustained' ? r : undefined;
}

/** Kalah di atas kertas, tapi ada cadangan tersegel: klaim menunggu diuji, tanpa membocorkan apa pun. */
export const BLUFFABLE: Reaction[] = ['weak', 'overruled', 'unverified'];

// ---------- Putusan cadangan ----------

export type ScoredEntry = {
	seq: number;
	side: Side | 'court';
	kind: string;
	argType?: string;
	reaction?: Reaction;
	cites: string[];
	text?: string;
	status?: string;
	targetSeq?: number;
};

const POINTS: Partial<Record<Reaction, number>> = {
	strong: 3,
	accepted: 2,
	sustained: 2,
	contradiction: 3,
	revealed: 1,
	noted: 0.5,
	overruled: -1
};

export function tally(
	entries: ScoredEntry[],
	closings: Partial<Record<Side, { parts: Record<string, string>; cites: string[] }>>,
	discredited: Set<string>
) {
	const score: Record<Side, number> = { defense: 0, prosecution: 0 };
	const best: Record<Side, { pts: number; e?: ScoredEntry }> = { defense: { pts: -99 }, prosecution: { pts: -99 } };
	const worst: Record<Side, { pts: number; e?: ScoredEntry }> = { defense: { pts: 99 }, prosecution: { pts: 99 } };
	const bySeq = new Map(entries.map((e) => [e.seq, e]));

	for (const e of entries) {
		if (e.side === 'court' || !e.reaction) continue;
		let pts = POINTS[e.reaction] ?? 0;
		// Argumen yang hanya bersandar pada fakta yang kemudian dicoret kehilangan bobot.
		if ((e.reaction === 'strong' || e.reaction === 'accepted') && e.cites.length && e.cites.every((c) => discredited.has(c))) pts = 0;
		if (e.kind === 'objection') {
			const target = e.targetSeq !== undefined ? bySeq.get(e.targetSeq) : undefined;
			const them = target && target.side !== 'court' ? target.side : undefined;
			if (e.reaction === 'exposed') {
				pts = 2;
				if (them) score[them] -= 3;
			} else if (e.reaction === 'proven') {
				pts = -1;
				if (them) score[them] += 2;
			}
		}
		score[e.side] += pts;
		if (e.kind !== 'ask' && pts > best[e.side].pts) best[e.side] = { pts, e };
		if (e.kind !== 'ask' && pts < worst[e.side].pts) worst[e.side] = { pts, e };
	}

	for (const side of ['defense', 'prosecution'] as Side[]) {
		const c = closings[side];
		if (!c) continue;
		score[side] += Object.values(c.parts).filter((x) => x.trim().length >= 40).length * 0.5;
		score[side] += Math.min(2, c.cites.filter((id) => !discredited.has(id)).length * 0.5);
	}
	return { score, best, worst };
}

const KIND_LABEL: Record<string, string> = {
	present: 'mengajukan bukti',
	clarify: 'meminta klarifikasi',
	confront: 'mengonfrontasi saksi',
	objection: 'meminta bukti',
	rest: 'cukup',
	closing: 'tuntutan/pledoi'
};

export function describe(e: ScoredEntry | undefined, t: CaseTools) {
	if (!e) return 'Tidak ada yang menonjol.';
	const label = e.argType ? (ARG_TYPES[e.argType as ArgType]?.label ?? e.argType) : (KIND_LABEL[e.kind] ?? e.kind);
	const cites = e.cites.length ? ` mengutip ${e.cites.map(t.factLabel).join(', ')}` : '';
	return `#${e.seq} ${label}${cites}${e.text ? `: “${e.text.slice(0, 120)}”` : ''}`;
}
