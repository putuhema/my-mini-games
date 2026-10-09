// Ruang Sidang: aturan permainan dan bentuk data publik. Aman diimpor dari klien.
// Isi perkara (bukti rahasia, kebenaran, naskah saksi) ada di ./cases/ dan hanya di server.

export type Side = 'defense' | 'prosecution';
export const SIDES: Side[] = ['prosecution', 'defense'];
export const other = (side: Side): Side => (side === 'defense' ? 'prosecution' : 'defense');

export const SIDE_LABEL: Record<Side, string> = { defense: 'Penasihat Hukum', prosecution: 'Jaksa Penuntut' };
export const SIDE_SHORT: Record<Side, string> = { defense: 'PH', prosecution: 'JPU' };

export type Phase =
	| 'waiting'
	| 'briefing'
	| 'evidence'
	| 'witness'
	| 'cross'
	| 'closing'
	| 'deliberating'
	| 'verdict';

/** Fase bergiliran: siapa yang mulai, dan berapa langkah tiap pihak. */
export const TURN_PHASES = {
	evidence: { opens: 'prosecution', actions: 5, n: 2 },
	witness: { opens: 'defense', actions: 6, n: 3 },
	cross: { opens: 'prosecution', actions: 4, n: 4 }
} as const satisfies Record<string, { opens: Side; actions: number; n: number }>;
export type TurnPhase = keyof typeof TURN_PHASES;
export const isTurnPhase = (phase: string): phase is TurnPhase => phase in TURN_PHASES;

export const PHASE_TITLE: Record<Phase, string> = {
	waiting: 'Menunggu lawan',
	briefing: 'Persiapan',
	evidence: 'Pembuktian',
	witness: 'Pemeriksaan Saksi',
	cross: 'Pemeriksaan Silang',
	closing: 'Tuntutan & Pledoi',
	deliberating: 'Musyawarah Hakim',
	verdict: 'Putusan'
};

/** Permintaan ke majelis untuk membuka catatan tersembunyi, per pihak, sepanjang sidang. */
export const CLARIFICATIONS = 2;
export const CLOSING_SECONDS = 120;

/** Jam giliran per fase, dalam detik. Habis = satu langkah hangus. */
export const TURN_SECONDS: Record<TurnPhase, number> = { evidence: 60, witness: 40, cross: 60 };

/** Teriakan yang bisa dilempar kapan saja selama sidang. */
export const SHOUTS = {
	keberatan: 'KEBERATAN!',
	tunggu: 'TUNGGU DULU!',
	kena: 'KENA KAU!',
	hmm: 'HMMM…'
} as const;
export type ShoutKind = keyof typeof SHOUTS;
export const SHOUT_COOLDOWN_MS = 2500;
export const MAX_TEXT = 600;
export const MAX_OPENING = 900;

/**
 * Empat langkah argumen. Majelis sendiri yang menilai sisi mana yang terbukti:
 * kesempatan, motif, identitas atau kronologi untuk Tuduh; keaslian, keandalan,
 * kredibilitas saksi atau tafsir lain untuk Bantah.
 */
export type ArgType = 'accuse' | 'challenge' | 'contradiction' | 'doubt';

/** `suspect`: argumen tentang seseorang. `target`: kutipan pertama yang diserang. `pair`: tepat dua kutipan. */
export const ARG_TYPES: Record<
	ArgType,
	{ label: string; key: string; hint: Record<Side, string>; example: string; suspect?: boolean; target?: boolean; pair?: boolean }
> = {
	accuse: {
		label: 'Tuduh',
		key: '1',
		hint: {
			prosecution: 'Tunjukkan terdakwa pelakunya. Kutip bukti kesempatan, motif, identitas, atau kronologinya — dua bukti lebih kuat dari satu.',
			defense: 'Tunjuk pelaku lain. Kutip bukti kesempatan, motif, identitas, atau kronologinya — dua bukti lebih kuat dari satu.'
		},
		example: 'kutip dua bukti yang menempatkan orang itu di lokasi → “Hanya dia yang punya akses malam itu.”',
		suspect: true
	},
	challenge: {
		label: 'Bantah',
		key: '2',
		hint: {
			prosecution: 'Jatuhkan satu bukti atau keterangan lawan (kutipan pertama). Lalu kutip yang melemahkannya: bukti tandingan, keterangan saksi, catatan pengadilan.',
			defense: 'Jatuhkan satu bukti atau keterangan yang memberatkan (kutipan pertama). Lalu kutip yang melemahkannya: bukti tandingan, keterangan saksi, catatan pengadilan.'
		},
		example: 'kutip video viral (sasaran) + rekaman utuhnya → “Video ini dipotong; versi utuhnya berkata lain.”',
		target: true
	},
	contradiction: {
		label: 'Ungkap Kontradiksi',
		key: '3',
		hint: {
			prosecution: 'Kutip tepat dua hal yang tak mungkin sama-sama benar — biasanya soal waktu, tempat, atau orang yang sama.',
			defense: 'Kutip tepat dua hal yang tak mungkin sama-sama benar — biasanya soal waktu, tempat, atau orang yang sama.'
		},
		example: 'kutip keterangan saksi + bukti yang membantahnya → “Saksi bilang tak ada yang masuk, padahal kuncinya dipinjam.”',
		pair: true
	},
	doubt: {
		label: 'Ragukan',
		key: '4',
		hint: {
			prosecution: 'Tunjukkan lubang dalam cerita pembela. Kutip bukti yang sudah gugur atau kontradiksi yang sudah ditemukan.',
			defense: 'Tunjukkan lubang dalam dakwaan. Kutip bukti yang sudah gugur atau kontradiksi yang sudah ditemukan.'
		},
		example: 'kutip bukti yang sudah dicoret → “Tanpa video itu, dakwaan runtuh.”'
	}
};

export type Reaction =
	| 'strong'
	| 'accepted'
	| 'noted'
	| 'weak'
	| 'unverified'
	| 'sustained'
	| 'overruled'
	| 'contradiction'
	| 'proven'
	| 'exposed'
	| 'revealed'
	| 'nothing'
	| 'answered';

/** Cara tiap reaksi dibaca dan warnanya: hijau baik, merah buruk, emas keberuntungan. */
export const REACTION_META: Record<Reaction, { label: string; tone: 'good' | 'bad' | 'gold' | 'dim' | 'weak' }> = {
	strong: { label: 'KUAT', tone: 'good' },
	accepted: { label: 'DITERIMA', tone: 'good' },
	proven: { label: 'TERBUKTI', tone: 'good' },
	sustained: { label: 'DIKABULKAN', tone: 'good' },
	contradiction: { label: '⚠️ KONTRADIKSI DITEMUKAN', tone: 'bad' },
	overruled: { label: 'DITOLAK', tone: 'bad' },
	exposed: { label: 'GERTAKAN TERBONGKAR', tone: 'bad' },
	weak: { label: 'LEMAH', tone: 'weak' },
	noted: { label: 'DICATAT', tone: 'dim' },
	unverified: { label: 'BELUM TERBUKTI', tone: 'dim' },
	answered: { label: 'DIJAWAB', tone: 'dim' },
	revealed: { label: 'CATATAN BARU', tone: 'gold' },
	nothing: { label: 'TIDAK ADA LAGI', tone: 'dim' }
};

export type EvidenceKind = 'public' | 'defense' | 'prosecution' | 'hidden';

/** Yang dilihat pemain dari sebuah bukti. */
export type EvidenceView = {
	id: string;
	kind: EvidenceKind;
	title: string;
	text: string;
	flag?: 'unreliable' | 'contradictory';
	onRecord: boolean;
	discredited: boolean;
};

export const FLAG_LABEL = { unreliable: 'TAK ANDAL', contradictory: 'BERTENTANGAN' } as const;

/** Pertanyaan baku untuk saksi. Ditambah satu pertanyaan per tokoh perkara (lihat topicLabel). */
export const BASE_TOPICS = {
	where: 'Di mana Anda saat kejadian?',
	saw: 'Apa yang Anda lihat atau dengar?',
	who: 'Siapa persisnya yang Anda lihat?',
	sure: 'Seberapa yakin Anda?',
	contact: 'Apakah ada yang menghubungi Anda soal ini?'
} as const;
export type BaseTopic = keyof typeof BASE_TOPICS;

/** Bagian publik sebuah perkara: yang diketahui kedua pihak sejak awal. */
export type PublicCase = {
	id: string;
	title: string;
	docket: string;
	/** Satu baris untuk daftar perkara di lobi. */
	tagline: string;
	setting: string;
	charge: string;
	brief: string;
	accused: string;
	/** Tokoh perkara, urutannya dipakai untuk pertanyaan saksi. */
	suspects: Record<string, { name: string; short: string; role: string; bio: string }>;
	witnesses: Record<string, { name: string; short: string; role: string; bio: string }>;
	timeline: { time: string; text: string }[];
	/** Arahan singkat per pihak saat persiapan. */
	goals: Record<Side, string>;
	/** Perkara pendek bisa memakai langkah yang lebih sedikit. */
	pace?: Partial<Pace>;
	/** Ditandai sebagai perkara latihan di lobi. */
	tutorial?: boolean;
};

export type Pace = { evidence: number; witness: number; cross: number; clarifications: number; closingSeconds: number };

export function paceFor(c: Pick<PublicCase, 'pace'>): Pace {
	return {
		evidence: TURN_PHASES.evidence.actions,
		witness: TURN_PHASES.witness.actions,
		cross: TURN_PHASES.cross.actions,
		clarifications: CLARIFICATIONS,
		closingSeconds: CLOSING_SECONDS,
		...c.pace
	};
}

export function topicsFor(c: PublicCase): string[] {
	return [...Object.keys(BASE_TOPICS), ...Object.keys(c.suspects)];
}

export function topicLabel(topic: string, c: PublicCase) {
	if (topic in BASE_TOPICS) return BASE_TOPICS[topic as BaseTopic];
	const s = c.suspects[topic];
	return s ? `Apa yang Anda ketahui tentang ${s.name}?` : topic;
}

export const CLOSING_PARTS = [
	{ key: 'theory', label: 'Teori perkara Anda' },
	{ key: 'opponent', label: 'Kelemahan pihak lawan' },
	{ key: 'uncertain', label: 'Yang masih belum pasti' },
	{ key: 'why', label: 'Mengapa majelis harus memihak Anda' }
] as const;
export type ClosingKey = (typeof CLOSING_PARTS)[number]['key'];

/** Fakta di catatan sidang: id bukti (E1, P3…) atau kunci keterangan saksi (wulan.contact). */
export const testimonyKey = (witness: string, topic: string) => `${witness}.${topic}`;
export const isTestimony = (key: string) => key.includes('.');
