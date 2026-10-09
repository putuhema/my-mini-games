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
	/** Berapa kali pihak ini sudah memakai seruan emosional. */
	appeals: number;
};

export type Ruling = {
	reaction: Reaction;
	text: string;
	discredit?: string;
	contradiction?: { a: string; b: string; text: string };
};

/** Klaim yang butuh bukti: bisa dijawab dengan "Minta bukti". */
export const CLAIM_TYPES: ArgType[] = ['timeline', 'opportunity', 'motive', 'identity', 'alternative', 'connect', 'doubt', 'reframe'];

const WHAT: Record<string, string> = { timeline: 'kronologi', opportunity: 'kesempatan', motive: 'motif', identity: 'identitas' };

export function rule(arg: { argType: ArgType; suspect?: string; cites: string[] }, board: Board, t: CaseTools): Ruling {
	const { argType, cites } = arg;
	const accused = t.case.public.accused;
	const suspect = arg.suspect && arg.suspect in t.case.public.suspects ? arg.suspect : accused;
	const who = t.name(suspect);
	const label = (k: string) => t.factLabel(k);
	const list = (keys: string[]) => keys.join(', ');

	// Jaksa berargumen terhadap terdakwa; pembela tentang siapa pun selain terdakwa.
	const aligned = board.side === 'prosecution' ? suspect === accused : suspect !== accused;
	const supporting = (type?: string) =>
		cites.filter((key) => {
			if (board.discredited.has(key)) return false;
			const supports = t.fact(key)?.supports ?? [];
			return supports.some((s) => (type ? s === `${type}:${suspect}` : s.endsWith(`:${suspect}`)));
		});

	switch (argType) {
		case 'timeline':
		case 'opportunity':
		case 'motive':
		case 'identity': {
			if (!cites.length) return { reaction: 'unverified', text: 'Dicatat — klaim ini belum terbukti.' };
			if (!aligned) return { reaction: 'weak', text: `Saudara, argumen tentang ${who} itu justru menguntungkan pihak lawan.` };
			const ok = supporting(argType);
			const what = WHAT[argType];
			if (ok.length >= 2) return { reaction: 'strong', text: `Majelis menilai ${what} ${who} didukung kuat (${list(ok)}).` };
			if (ok.length === 1) return { reaction: 'accepted', text: `Diterima: ${ok[0]} mendukung ${what} ${who}.` };
			return { reaction: 'weak', text: `Bukti yang dikutip tidak menunjukkan ${what} ${who}.` };
		}

		case 'authenticity': {
			const target = cites[0];
			if (!target) return { reaction: 'overruled', text: 'Ditolak. Apa yang digugat, Saudara?' };
			if (t.fact(target)?.authentic === false) {
				return { reaction: 'sustained', text: `Dikabulkan. Keaslian ${label(target)} tidak dapat dipastikan; dikesampingkan.`, discredit: target };
			}
			return { reaction: 'overruled', text: `Ditolak. ${label(target)} asli.` };
		}

		case 'reliability': {
			const target = cites[0];
			const f = target ? t.fact(target) : undefined;
			if (!target || !f) return { reaction: 'overruled', text: 'Ditolak. Apa yang digugat, Saudara?' };
			if (board.discredited.has(target)) return { reaction: 'noted', text: `${label(target)} sudah dikesampingkan.` };
			const by = cites.slice(1).find((c) => f.underminedBy?.includes(c) && !board.discredited.has(c));
			if (by) return { reaction: 'sustained', text: `Dikabulkan. Mengingat ${label(by)}, ${label(target)} tidak dapat diandalkan.`, discredit: target };
			if (f.reliability === 'unreliable') return { reaction: 'sustained', text: `Dikabulkan. ${label(target)} terlalu lemah untuk dipegang.`, discredit: target };
			if (f.reliability === 'contradictory') return { reaction: 'weak', text: `${label(target)} memang diragukan, tapi Saudara belum menunjukkan sebabnya.` };
			return { reaction: 'overruled', text: `Ditolak. Tak ada di catatan sidang yang melemahkan ${label(target)}.` };
		}

		case 'contradiction': {
			const [a, b] = cites;
			if (!a || !b) return { reaction: 'overruled', text: 'Ditolak. Kontradiksi butuh dua hal.' };
			const found = t.findContradiction(a, b);
			if (!found) return { reaction: 'overruled', text: `Ditolak. ${label(a)} dan ${label(b)} bisa sama-sama benar.` };
			if (board.contradicted.has(a) && board.contradicted.has(b)) return { reaction: 'noted', text: 'Majelis sudah mencatat kontradiksi itu.' };
			return { reaction: 'contradiction', text: found.text, contradiction: found };
		}

		case 'doubt': {
			if (!cites.length) return { reaction: 'unverified', text: 'Keraguan diajukan. Atas dasar apa, Saudara?' };
			const holes = cites.filter((c) => board.discredited.has(c) || board.contradicted.has(c));
			if (holes.length >= 2) return { reaction: 'strong', text: `Majelis mencatat lubang nyata dalam dakwaan: ${list(holes)}.` };
			if (holes.length === 1) return { reaction: 'accepted', text: `Dicatat: ${label(holes[0])} melemahkan dakwaan.` };
			return { reaction: 'weak', text: 'Bukti yang dikutip belum tergoyahkan. Keraguan butuh alasan.' };
		}

		case 'emotional':
			return board.appeals
				? { reaction: 'weak', text: 'Saudara diminta tetap pada pembuktian.' }
				: { reaction: 'noted', text: 'Majelis tersentuh. Namun perasaan bukanlah alat bukti.' };

		case 'reframe': {
			const target = cites[0];
			const f = target ? t.fact(target) : undefined;
			if (!target || !f) return { reaction: 'unverified', text: 'Tafsir ulang atas apa, Saudara?' };
			const by = cites.slice(1).find((c) => f.reframedBy?.includes(c) && !board.discredited.has(c));
			if (by) return { reaction: 'accepted', text: `Diterima. Dibaca bersama ${label(by)}, ${label(target)} kehilangan bobotnya.`, discredit: target };
			if (cites.length === 1) return { reaction: 'unverified', text: `Tafsir baru atas ${label(target)}, belum ada pendukungnya.` };
			return { reaction: 'weak', text: `Bukti yang dikutip tidak mendukung tafsir itu atas ${label(target)}.` };
		}

		case 'credibility': {
			const target = cites[0];
			const witness = target?.includes('.') ? target.split('.')[0] : undefined;
			if (!witness) return { reaction: 'overruled', text: 'Ditolak. Kutip keterangan saksinya, Saudara.' };
			const keys = [...board.onRecord, ...board.contradicted].filter((k) => k.startsWith(`${witness}.`));
			const caught = keys.find((k) => board.contradicted.has(k));
			const undermined = keys.find((k) => t.testimony[k]?.underminedBy?.some((u) => board.onRecord.has(u) && cites.includes(u)));
			const k = caught ?? undermined;
			if (k) return { reaction: 'sustained', text: `Dikabulkan. Keterangan saksi (${label(k)}) diragukan.`, discredit: k };
			return { reaction: 'overruled', text: 'Ditolak. Tak ada di catatan sidang yang meruntuhkan saksi ini.' };
		}

		case 'alternative': {
			if (suspect === accused) return { reaction: 'weak', text: 'Pelaku lain harus orang selain terdakwa.' };
			if (!cites.length) return { reaction: 'unverified', text: `Majelis mencatat Saudara menunjuk ${who}. Atas dasar apa?` };
			if (board.side === 'prosecution') return { reaction: 'weak', text: `Saudara Jaksa, menunjuk ${who} justru membantu pembela.` };
			const ok = supporting();
			if (ok.length >= 2) return { reaction: 'strong', text: `Pelaku lain yang meyakinkan: ${list(ok)} mengarah ke ${who}.` };
			if (ok.length === 1) return { reaction: 'accepted', text: `Dicatat: ${label(ok[0])} mengarah ke ${who}.` };
			return { reaction: 'weak', text: `Tak ada yang dikutip mengaitkan ${who} dengan perkara ini.` };
		}

		case 'connect': {
			if (cites.length < 2) return { reaction: cites.length ? 'weak' : 'unverified', text: 'Menghubungkan bukti butuh paling sedikit dua hal.' };
			if (!aligned) return { reaction: 'weak', text: `Saudara, menghubungkan bukti ke ${who} justru menguntungkan pihak lawan.` };
			const ok = supporting();
			if (ok.length >= 3) return { reaction: 'strong', text: `Rangkaian yang kuat: ${list(ok)} semuanya mengarah ke ${who}.` };
			if (ok.length === 2) return { reaction: 'accepted', text: `Diterima: ${list(ok)} mengarah ke arah yang sama.` };
			return { reaction: 'weak', text: 'Majelis tidak melihat hubungannya.' };
		}
	}
}

/** Menilai ulang klaim tersegel dengan cadangannya, untuk "Minta bukti". */
export function proves(arg: { argType: ArgType; suspect?: string; cites: string[] }, backing: string[], board: Board, t: CaseTools) {
	if (!backing.length) return false;
	const r = rule({ ...arg, cites: [...arg.cites, ...backing] }, board, t);
	return r.reaction === 'strong' || r.reaction === 'accepted' || r.reaction === 'sustained';
}

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
