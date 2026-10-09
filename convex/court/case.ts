// Bentuk berkas perkara lengkap, termasuk yang hanya diketahui hakim. HANYA SERVER.

import type { ArgType, EvidenceKind, PublicCase } from './rules';

/** Klaim yang didukung sebuah fakta, mis. 'motive:bambang'. */
export type Support = `${Extract<ArgType, 'timeline' | 'opportunity' | 'motive' | 'identity'>}:${string}`;

export type Fact = {
	supports?: Support[];
	/** 'unreliable': gugatan keandalan berhasil dengan sendirinya. */
	reliability?: 'solid' | 'unreliable' | 'contradictory';
	/** false bila bukti tidak seperti yang diklaim (dipotong, palsu, tanpa sumber). */
	authentic?: boolean;
	/** Fakta yang, bila dikutip dalam gugatan keandalan, menjatuhkan fakta ini. */
	underminedBy?: string[];
	/** Fakta yang memberi bacaan lain atas fakta ini. */
	reframedBy?: string[];
};

export type Evidence = Fact & {
	id: string;
	kind: EvidenceKind;
	title: string;
	text: string;
	flag?: 'unreliable' | 'contradictory';
	/** Catatan hakim tentang arti sebenarnya. */
	truth: string;
	/** Mengarah ke kebenaran, atau menyesatkan? */
	role: 'key' | 'misleading' | 'context';
};

export type Testimony = Fact & {
	text: string;
	/** Cara saksi (salah) menceritakannya. Hanya hakim yang tahu. */
	honesty: 'truth' | 'lie' | 'mistake' | 'omits';
};

export type Witness = {
	/** Latar untuk AI saat menjawab pertanyaan bebas sesuai karakter. */
	persona: string;
	/** Jawaban per topik: lima topik baku plus satu per tokoh perkara. */
	answers: Record<string, Testimony>;
	/** Begitu kunci ini tercatat, saksi berhenti berbohong dan mengatakan ini. */
	broken?: { key: string; text: string };
	/** Dikonfrontasi dengan sebuah bukti: jawabannya dan keterangan yang tercatat. */
	confront: Record<string, Testimony & { key: string }>;
};

export type CaseFile = {
	public: PublicCase;
	evidence: Evidence[];
	/** Meminta klarifikasi atas bukti tertentu bisa membuka catatan tersembunyi. */
	clarify: Record<string, { reveals: string; text: string }>;
	witnesses: Record<string, Witness>;
	/** Pasangan fakta yang tak mungkin sama-sama benar. */
	contradictions: { a: string; b: string; text: string }[];
	truth: {
		culprit: string;
		summary: string;
		motive: string;
		timeline: { time: string; text: string }[];
	};
};

/** Alat bantu yang terikat pada satu perkara. */
export function tools(c: CaseFile) {
	const byId: Record<string, Evidence> = Object.fromEntries(c.evidence.map((e) => [e.id, e]));
	const testimony: Record<string, Testimony> = {};
	for (const [id, w] of Object.entries(c.witnesses)) {
		for (const [topic, t] of Object.entries(w.answers)) testimony[`${id}.${topic}`] = t;
		for (const t of Object.values(w.confront)) testimony[t.key] ??= t;
	}
	const fact = (key: string): Fact | undefined => byId[key] ?? testimony[key];
	const factLabel = (key: string) => {
		const ev = byId[key];
		if (ev) return `${ev.id} ${ev.title}`;
		const [w, topic] = key.split('.');
		return `keterangan ${c.public.witnesses[w]?.short ?? w} (${topic})`;
	};
	const findContradiction = (a: string, b: string) =>
		c.contradictions.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a));
	const name = (suspect: string) => c.public.suspects[suspect]?.short ?? suspect;
	return { case: c, byId, testimony, fact, factLabel, findContradiction, name };
}

export type CaseTools = ReturnType<typeof tools>;
