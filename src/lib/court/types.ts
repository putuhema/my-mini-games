import type { FunctionReturnType } from 'convex/server';
import type { api } from '../../../convex/_generated/api';
import { topicLabel, type PublicCase } from '../../../convex/court/rules';

export type CourtView = NonNullable<FunctionReturnType<typeof api.court.get>>;
export type CourtEntry = CourtView['entries'][number];
export type EvidenceItem = CourtView['evidence'][number];

/** A short name for a fact key: an evidence id, or a witness's testimony. */
export function factName(key: string, c: PublicCase) {
	if (!key.includes('.')) return key;
	const [w, topic] = key.split('.');
	return `${c.witnesses[w]?.short ?? w}: ${c.suspects[topic]?.short ?? topic}`;
}

/** The longer label, with the evidence title or the question asked. */
export function factTitle(key: string, evidence: EvidenceItem[], c: PublicCase) {
	const ev = evidence.find((e) => e.id === key);
	if (ev) return `${ev.id} · ${ev.title}`;
	const [w, topic] = key.split('.');
	const name = c.witnesses[w]?.name ?? w;
	return `${name} — ${topicLabel(topic, c)}`;
}

/** An item in the cite basket. Sealed items are held back as hidden backing. */
export type Cite = { key: string; sealed: boolean };
