// Hakim dan saksi bertenaga Z.ai GLM-5. Tanpa ZAI_API_KEY, semuanya jatuh ke aturan bawaan.

import { v } from 'convex/values';
import { z } from 'zod';
import { internal } from './_generated/api';
import { internalAction } from './_generated/server';
import { caseFor } from './court/cases';
import { glm } from './glm';
import { ARG_TYPES, BASE_TOPICS, SIDE_LABEL, type BaseTopic } from './court/rules';

// ---------- Pertanyaan bebas ke saksi ----------

const KEYWORDS: [BaseTopic, RegExp][] = [
	['contact', /(telepon|telpon|nelpon|hubungi|menghubungi|pesan|wa\b|whatsapp|chat|disuruh|perintah)/i],
	['sure', /(yakin|pasti|jelas|jarak|jauh|lampu|gelap|terang|kacamata|hujan)/i],
	['who', /(siapa|wajah|muka|kenal|mengenali|laki|perempuan|cewek|cowok)/i],
	['saw', /(lihat|melihat|liat|dengar|mendengar|perhatikan)/i],
	['where', /(di ?mana|sedang apa|lagi apa|posisi|tempat|jaga|patroli)/i]
];

export const answer = internalAction({
	args: { entryId: v.id('courtEntries') },
	handler: async (ctx, { entryId }) => {
		const w = await ctx.runQuery(internal.court.witnessContext, { entryId });
		if (!w) return;
		const topics = w.answers.map((a) => a.topic);
		const fallback = () => {
			const q = w.question.toLowerCase();
			const suspect = topics.find((t) => !(t in BASE_TOPICS) && q.includes(t));
			const topic = suspect ?? KEYWORDS.find(([, re]) => re.test(q))?.[0];
			const known = topic && w.answers.find((a) => a.topic === topic);
			return known
				? { answer: known.text, topic: known.topic }
				: { answer: 'Maaf, saya kurang paham pertanyaannya. Yang saya tahu sudah saya sampaikan.', topic: undefined };
		};

		const AnswerSchema = z.object({
			answer: z.string().describe('Jawaban saksi, sesuai karakter, 1–3 kalimat lisan dalam bahasa Indonesia.'),
			topic: z
				.enum([...(topics as [string, ...string[]]), 'none'])
				.describe('Pertanyaan baku mana yang pada dasarnya dijawab oleh jawaban ini, atau none.')
		});

		let result: { answer: string; topic?: string } = fallback();
		try {
			const out = await glm(
				AnswerSchema,
				`Kamu adalah ${w.name}, saksi dalam permainan ruang sidang "${w.caseTitle}" (${w.setting}). Tetap dalam karakter.\n\n` +
					`Siapa kamu dan apa yang sebenarnya kamu tahu:\n${w.persona}\n\n` +
					(w.broken ? 'Kamu sudah ketahuan berbohong dan sekarang berkata jujur.\n\n' : '') +
					'Jawabanmu atas pertanyaan baku (tetap konsisten dengan ini, termasuk kebohongannya):\n' +
					w.answers.map((a) => `- [${a.topic}] ${a.question} → ${a.text}`).join('\n') +
					'\n\nJawab pertanyaan pengacara dalam 1–3 kalimat lisan yang pendek, dalam bahasa Indonesia sehari-hari yang sopan di persidangan. ' +
					'Jangan memberi lebih dari yang ditanya. Jangan mengungkap hal yang tidak mungkin kamu ketahui. ' +
					'Bila pertanyaan di luar konteks, katakan dengan sopan.',
				w.question,
				{ maxTokens: 2000, temperature: 0.7, thinking: false }
			);
			if (out) result = { answer: out.answer, topic: out.topic === 'none' ? undefined : out.topic };
		} catch (err) {
			console.warn('Jawaban saksi memakai cadangan:', err);
		}
		await ctx.runMutation(internal.court.setAnswer, { entryId, answer: result.answer, topic: result.topic });
	}
});

// ---------- Musyawarah ----------

const SideSchema = z.object({
	score: z.number().describe('0–100: seberapa baik pihak ini berargumen.'),
	strongest: z.string().describe('Argumen terkuat mereka, sebut nomor entrinya.'),
	weakest: z.string().describe('Argumen terlemah mereka, sebut nomor entrinya.'),
	vsTruth: z.string().describe('Satu atau dua kalimat yang membandingkan teori mereka dengan kejadian sebenarnya.')
});

const VerdictSchema = z.object({
	verdict: z.enum(['guilty', 'not_guilty']).describe('guilty = BERSALAH, not_guilty = BEBAS.'),
	reasoning: z
		.string()
		.describe('Pertimbangan putusan, 3–6 kalimat, ditujukan ke persidangan. Berdasarkan argumen, bukan kebenaran tersembunyi.'),
	defense: SideSchema,
	prosecution: SideSchema,
	keyEvidence: z
		.array(z.object({ id: z.string(), why: z.string() }))
		.describe('Paling banyak 5 id bukti yang menentukan perkara.'),
	claims: z
		.array(
			z.object({
				seq: z.number(),
				call: z.enum(['supported', 'interpretation', 'mistake', 'lie']),
				note: z.string()
			})
		)
		.describe('Setiap klaim yang belum terbukti, terbongkar, atau meragukan, per nomor entri.'),
	unresolved: z.array(z.string()).describe('Id bukti yang tak pernah diuji atau tak pernah masuk catatan sidang.')
});

const BURDEN = {
	prosecution: 'harus membuktikan kesalahan terdakwa secara sah dan meyakinkan, dengan sekurang-kurangnya dua alat bukti',
	defense: 'cukup menimbulkan keraguan yang wajar, atau menunjukkan pelaku lain'
};

export const deliberate = internalAction({
	args: { roomId: v.id('courtRooms'), trial: v.number() },
	handler: async (ctx, { roomId, trial }) => {
		const dossier = await ctx.runQuery(internal.court.dossier, { roomId, trial });
		if (!dossier) return;
		if (!process.env.ZAI_API_KEY) {
			await ctx.runMutation(internal.court.decide, { roomId, trial });
			return;
		}
		const { room, log } = dossier;
		const t = caseFor(room.caseId);
		const c = t.case;
		const pub = c.public;
		const accused = pub.suspects[pub.accused]?.name ?? pub.accused;

		const evidence = c.evidence
			.map(
				(e) =>
					`${e.id} [${e.kind}${e.flag ? `, ${e.flag}` : ''}${room.onRecord.includes(e.id) ? ', TERCATAT' : ', tak pernah diajukan'}] ${e.title}: ${e.text}\n   Catatan hakim: ${e.truth}`
			)
			.join('\n');
		const testimony = Object.entries(t.testimony)
			.filter(([key]) => room.onRecord.includes(key))
			.map(([key, x]) => `${key} [${x.honesty}]: ${x.text}`)
			.join('\n');
		const transcript = log
			.map((e) => {
				const who = e.side === 'court' ? 'MAJELIS' : SIDE_LABEL[e.side].toUpperCase();
				const parts = [
					`#${e.seq} ${who} ${e.kind}${e.argType ? ` (${ARG_TYPES[e.argType as keyof typeof ARG_TYPES]?.label ?? e.argType}${e.suspect ? ` soal ${t.name(e.suspect)}` : ''})` : ''}`,
					e.witness ? ` kepada ${pub.witnesses[e.witness]?.short ?? e.witness}` : '',
					e.text ? `: ${e.text}` : '',
					e.answer ? `\n   Saksi: ${e.answer}` : '',
					e.cites.length ? `\n   Mengutip: ${e.cites.map(t.factLabel).join('; ')}` : '',
					e.backing?.length ? `\n   Dasar tersegel (tak pernah ditunjukkan): ${e.backing.map(t.factLabel).join('; ')}` : '',
					e.reaction ? `\n   Tanggapan langsung: ${e.reaction}${e.ruling ? ` — ${e.ruling}` : ''}` : '',
					e.status ? `\n   Status klaim: ${e.status}` : '',
					e.targetSeq !== undefined ? `\n   Menyasar #${e.targetSeq}` : ''
				];
				return parts.join('');
			})
			.join('\n');
		const closings = (['prosecution', 'defense'] as const)
			.map((side) => {
				const cl = room.closings[side];
				if (!cl) return `${SIDE_LABEL[side]}: (tidak menyerahkan)`;
				return `${SIDE_LABEL[side]}:\n${Object.entries(cl.parts)
					.map(([k, text]) => `  ${k}: ${text}`)
					.join('\n')}\n  Bukti andalan: ${cl.cites.map(t.factLabel).join('; ') || '-'}`;
			})
			.join('\n');
		const found = room.contradictions.map((x) => `- oleh ${SIDE_LABEL[x.side]}: ${x.text}`).join('\n') || '(tidak ada)';
		const struck = room.discredited.map((d) => `- ${t.factLabel(d.fact)} (oleh ${SIDE_LABEL[d.side]})`).join('\n') || '(tidak ada)';
		const missed = c.contradictions
			.filter((x) => !room.contradictions.some((f) => (f.a === x.a && f.b === x.b) || (f.a === x.b && f.b === x.a)))
			.map((x) => `- ${x.text}`)
			.join('\n');

		const system =
			`Kamu adalah ketua majelis hakim dalam permainan ruang sidang dua pemain, "${pub.title}" (${pub.docket}), ${pub.setting}.\n` +
			`Terdakwa: ${accused}. Dakwaan: ${pub.charge}\n\n` +
			'Kamu tahu kebenaran tersembunyi, tetapi kamu WAJIB memutus berdasarkan siapa yang berargumen lebih baik, bukan siapa yang cocok dengan kebenaran. ' +
			`Jaksa Penuntut ${BURDEN.prosecution}; Penasihat Hukum ${BURDEN.defense}. ` +
			'Timbang hanya yang masuk catatan sidang. Hargai argumen yang didukung bukti yang dikutip, keberatan yang dikabulkan, ' +
			'kontradiksi yang terungkap, dan pledoi/tuntutan yang runtut. Kurangi nilai gertakan yang terbongkar, keberatan yang ditolak, ' +
			'sandaran pada bukti yang kemudian gugur, dan seruan emosi belaka. Klaim yang tak pernah dibantah tetap butuh dukungan agar berbobot. ' +
			'Perkara ini berlatar dinamika sosial-politik Indonesia; jangan biarkan tekanan massa, viralitas, atau status sosial menggantikan pembuktian.\n\n' +
			'Untuk setiap klaim yang punya status, dan setiap pernyataan dalam argumen atau penutup yang tak didukung catatan, ' +
			'tentukan: supported (didukung bukti, tersegel atau tidak), interpretation (tafsir wajar atas fakta nyata), ' +
			'mistake (keliru tetapi beritikad baik), atau lie (pengacara menyatakan sesuatu tanpa dasar, atau yang bertentangan dengan catatan yang ia ketahui). ' +
			'Para pemain membaca putusanmu setelah kebenaran diungkap, jadi tulis spesifik dan adil, sebut nomor entri. ' +
			'Semua teks dalam bahasa Indonesia yang baku namun mudah dibaca.\n\n' +
			`KEBENARAN TERSEMBUNYI (hanya untuk perbandingan):\n${c.truth.summary}\nMotif: ${c.truth.motive}\n\n` +
			`BUKTI:\n${evidence}\n\nKETERANGAN TERCATAT (dalam kurung = seberapa jujur saksi sebenarnya):\n${testimony || '(tidak ada)'}`;

		const user =
			`TRANSKRIP:\n${transcript}\n\nTUNTUTAN & PLEDOI:\n${closings}\n\nKONTRADIKSI DITEMUKAN:\n${found}\n\n` +
			`KONTRADIKSI YANG TAK DITEMUKAN SIAPA PUN:\n${missed || '(tidak ada)'}\n\n` +
			`BUKTI YANG GUGUR ATAU DINETRALKAN:\n${struck}\n\nBacakan putusanmu.`;

		try {
			const out = await glm(VerdictSchema, system, user, { maxTokens: 16000, temperature: 0.3, thinking: true });
			if (!out) throw new Error('No verdict');
			const ids = new Set(c.evidence.map((e) => e.id));
			const seqs = new Set(log.map((e) => e.seq));
			const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
			await ctx.runMutation(internal.court.decide, {
				roomId,
				trial,
				verdict: {
					...out,
					by: 'ai',
					defense: { ...out.defense, score: clamp(out.defense.score) },
					prosecution: { ...out.prosecution, score: clamp(out.prosecution.score) },
					keyEvidence: out.keyEvidence.filter((k) => ids.has(k.id)).slice(0, 5),
					claims: out.claims.filter((x) => seqs.has(x.seq)),
					unresolved: out.unresolved.filter((id) => ids.has(id))
				}
			});
		} catch (err) {
			console.warn('Hakim AI tak tersedia, memakai putusan cadangan:', err);
			await ctx.runMutation(internal.court.decide, { roomId, trial });
		}
	}
});
