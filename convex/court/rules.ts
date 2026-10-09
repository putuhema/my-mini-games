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
export const CLOSING_SECONDS = 180;
export const MAX_TEXT = 600;
export const MAX_OPENING = 900;

export type ArgType =
	| 'timeline'
	| 'opportunity'
	| 'motive'
	| 'identity'
	| 'authenticity'
	| 'reliability'
	| 'contradiction'
	| 'doubt'
	| 'emotional'
	| 'reframe'
	| 'credibility'
	| 'alternative'
	| 'connect';

/** `suspect`: argumen tentang seseorang. `target`: kutipan pertama yang diserang. `pair`: tepat dua kutipan. */
export const ARG_TYPES: Record<
	ArgType,
	{ label: string; group: 'evidence' | 'rhetoric'; hint: string; suspect?: boolean; target?: boolean; pair?: boolean }
> = {
	timeline: { label: 'Tetapkan Kronologi', group: 'evidence', hint: 'Tempatkan seseorang pada suatu waktu.', suspect: true },
	opportunity: { label: 'Tetapkan Kesempatan', group: 'evidence', hint: 'Tunjukkan seseorang bisa melakukannya.', suspect: true },
	motive: { label: 'Tetapkan Motif', group: 'evidence', hint: 'Tunjukkan mengapa seseorang melakukannya.', suspect: true },
	identity: { label: 'Tetapkan Identitas', group: 'evidence', hint: 'Tunjukkan siapa yang ada di sana.', suspect: true },
	authenticity: { label: 'Gugat Keaslian', group: 'evidence', hint: 'Bukti ini tidak seperti yang diklaim (palsu, dipotong, tanpa sumber).', target: true },
	reliability: { label: 'Gugat Keandalan', group: 'evidence', hint: 'Bukti ini tak bisa dipegang. Kutip apa yang melemahkannya.', target: true },
	contradiction: { label: 'Ungkap Kontradiksi', group: 'evidence', hint: 'Kutip dua hal yang tak mungkin sama-sama benar.', pair: true },
	doubt: { label: 'Keraguan yang Wajar', group: 'rhetoric', hint: 'Tunjukkan lubang dalam dakwaan.' },
	emotional: { label: 'Seruan Emosional', group: 'rhetoric', hint: 'Sentuh sisi kemanusiaan. Minim bukti.' },
	reframe: { label: 'Tafsir Ulang', group: 'rhetoric', hint: 'Beri bacaan lain atas suatu bukti. Kutip buktinya, lalu pendukung tafsir Anda.', target: true },
	credibility: { label: 'Serang Kredibilitas', group: 'rhetoric', hint: 'Lemahkan saksi. Kutip keterangannya.', target: true },
	alternative: { label: 'Pelaku Lain', group: 'rhetoric', hint: 'Orang lain yang melakukannya.', suspect: true },
	connect: { label: 'Hubungkan Bukti', group: 'rhetoric', hint: 'Tunjukkan dua bukti atau lebih mengarah ke orang yang sama.', suspect: true }
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
};

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
