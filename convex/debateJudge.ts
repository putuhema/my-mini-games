// The Debate Room judge, powered by Z.ai GLM-5. Without ZAI_API_KEY it falls back to rule-of-thumb scores.

import { v } from 'convex/values';
import { z } from 'zod';
import { internal } from './_generated/api';
import { internalAction } from './_generated/server';
import { glm } from './glm';
import { CRITERIA, CRITERION_KEYS, CRITERION_MAX, ROUND_INFO, ROUNDS, SIDE_LABEL, type Side } from './debate/rules';

const SideSchema = z.object({
	scores: z.object(
		Object.fromEntries(
			CRITERION_KEYS.map((k) => [k, z.number().describe(`0–${CRITERION_MAX}. ${CRITERIA[k].hint}`)])
		) as Record<(typeof CRITERION_KEYS)[number], z.ZodNumber>
	),
	best: z.string().describe('Their single best moment: quote a short phrase and say in one sentence why it worked.'),
	missed: z.string().describe('The biggest thing they got wrong, left unanswered or failed to support. One or two sentences.'),
	tip: z.string().describe('One concrete, friendly tip for their next debate. One sentence.')
});

export const VerdictSchema = z.object({
	winner: z.enum(['pro', 'con', 'tie']).describe('Who argued better. tie only if they are genuinely level.'),
	summary: z.string().describe('The decision explained to both debaters, 3–5 sentences, specific to what they wrote.'),
	turningPoint: z.string().describe('The exchange or argument that decided the debate, in one or two sentences.'),
	pro: SideSchema,
	con: SideSchema
});

type Transcript = {
	topic: string;
	names: Record<Side, string>;
	speeches: { round: string; side: Side; text: string }[];
};

/** The judge's system and user prompts for one debate. */
export function prompts(t: Transcript) {
	const transcript = ROUNDS.map((round) => {
		const lines = (['pro', 'con'] as const).map((side) => {
			const s = t.speeches.find((x) => x.round === round && x.side === side);
			const text = s?.text.trim() ? s.text.trim() : '(said nothing; the clock ran out)';
			return `${SIDE_LABEL[side].toUpperCase()} (${t.names[side]}):\n${text}`;
		});
		return `== ${ROUND_INFO[round].label.toUpperCase()} ==\n${lines.join('\n\n')}`;
	}).join('\n\n');

	const system =
		'You are the judge of a friendly two-player debate game. The players were assigned their sides, so judge ' +
		'how well each one argued, never which side you agree with. ' +
		`Score each side on ${CRITERION_KEYS.map((k) => `${CRITERIA[k].label.toLowerCase()} (${CRITERIA[k].hint})`).join(', ')}, ` +
		`each 0–${CRITERION_MAX}. Use the whole range: 5 is an ordinary effort, 8+ is genuinely strong, below 3 is very thin or missing. ` +
		'Reward reasons that hold together, concrete examples, and direct answers to the opponent. ' +
		'Penalise unsupported assertions, ignoring the opponent, contradicting yourself, and empty rounds. ' +
		'Both speeches in a round were written at the same time, so in the opening nobody could answer the other; ' +
		'judge rebuttal mainly on the rebuttal and closing rounds. ' +
		'Be warm but honest, and specific: refer to what they actually wrote. Address the players by name. ' +
		'Write every text field in the language the debaters mostly used (for example Indonesian if they wrote in Indonesian).';

	const user = `MOTION: "${t.topic}"\nFOR: ${t.names.pro}\nAGAINST: ${t.names.con}\n\n${transcript}\n\nGive your verdict.`;
	return { system, user };
}

export const judge = internalAction({
	args: { roomId: v.id('debateRooms'), debate: v.number() },
	handler: async (ctx, { roomId, debate }) => {
		const t = await ctx.runQuery(internal.debate.transcript, { roomId, debate });
		if (!t) return;

		const { system, user } = prompts(t);

		try {
			const out = await glm(VerdictSchema, system, user, {
				maxTokens: 8000,
				temperature: 0.3,
				thinking: true,
				jsonInstruction: 'Reply with ONLY one JSON object matching this JSON Schema, no other text:'
			});
			if (!out) throw new Error('No verdict');
			const clamp = (n: number) => Math.max(0, Math.min(CRITERION_MAX, Math.round(n)));
			const side = (s: z.infer<typeof SideSchema>) => ({
				...s,
				scores: {
					logic: clamp(s.scores.logic),
					evidence: clamp(s.scores.evidence),
					rebuttal: clamp(s.scores.rebuttal),
					delivery: clamp(s.scores.delivery)
				}
			});
			await ctx.runMutation(internal.debate.decide, {
				roomId,
				debate,
				verdict: { ...out, by: 'ai', pro: side(out.pro), con: side(out.con) }
			});
		} catch (err) {
			console.warn('AI judge unavailable, using fallback verdict:', err);
			await ctx.runMutation(internal.debate.decide, { roomId, debate });
		}
	}
});
