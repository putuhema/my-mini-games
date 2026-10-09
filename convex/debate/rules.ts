export type Side = "pro" | "con";
export type Round = "opening" | "rebuttal" | "closing";
export type TopicKind = "light" | "spicy" | "deep";

export const ROUNDS: Round[] = ["opening", "rebuttal", "closing"];

export const ROUND_INFO: Record<
  Round,
  { label: string; seconds: number; max: number; prompt: string }
> = {
  opening: {
    label: "Opening",
    seconds: 240,
    max: 1200,
    prompt: "Make your case. Give your strongest reasons and back them up.",
  },
  rebuttal: {
    label: "Rebuttal",
    seconds: 180,
    max: 1000,
    prompt:
      "Your opponent's opening is on the table. Take it apart, then shore up your own case.",
  },
  closing: {
    label: "Closing",
    seconds: 120,
    max: 600,
    prompt: "Last word. Sum up why your side won the debate.",
  },
};

export const SIDE_LABEL: Record<Side, string> = { pro: "For", con: "Against" };

export const other = (side: Side): Side => (side === "pro" ? "con" : "pro");

export const MAX_TOPIC = 160;

export const TOPIC_KINDS: Record<TopicKind, string> = {
  light: "Light",
  spicy: "Spicy",
  deep: "Deep",
};

export const TOPICS: { text: string; kind: TopicKind }[] = [
  { kind: "light", text: "Pineapple belongs on pizza." },
  { kind: "light", text: "Bubur ayam should be stirred before eating." },
  { kind: "light", text: "Cats make better pets than dogs." },
  { kind: "light", text: "Breakfast is the most important meal of the day." },
  { kind: "light", text: "The beach is a better holiday than the mountains." },
  { kind: "light", text: "Mornings are better than late nights." },
  {
    kind: "light",
    text: "Movies are better watched at home than in the cinema.",
  },
  { kind: "light", text: "Martabak manis beats martabak telur." },
  { kind: "light", text: "A hot dog is a sandwich." },
  { kind: "light", text: "Rice should be eaten with every meal." },
  { kind: "spicy", text: "Couples should share their phone passwords." },
  { kind: "spicy", text: "Long-distance relationships make couples stronger." },
  { kind: "spicy", text: "You should split the bill on a first date." },
  { kind: "spicy", text: "It is fine to stay friends with your ex." },
  { kind: "spicy", text: "Couples should have a joint bank account." },
  { kind: "spicy", text: 'Replying "ok" to a long message is rude.' },
  {
    kind: "spicy",
    text: "Leaving someone on read is worse than not opening the message.",
  },
  {
    kind: "spicy",
    text: "Watching ahead in a show you share with your partner is a betrayal.",
  },
  {
    kind: "spicy",
    text: "Social media does more harm than good to relationships.",
  },
  { kind: "spicy", text: "Living together before marriage is a good idea." },
  { kind: "deep", text: "Working from home should be a right, not a perk." },
  { kind: "deep", text: "AI will create more jobs than it destroys." },
  { kind: "deep", text: "University should be free for everyone." },
  { kind: "deep", text: "Every city should ban cars from its centre." },
  { kind: "deep", text: "A four-day work week should be the norm." },
  { kind: "deep", text: "Children under 13 should not have smartphones." },
  { kind: "deep", text: "Tipping should be abolished." },
  { kind: "deep", text: "Voting should be compulsory." },
  { kind: "deep", text: "Space exploration is worth the money." },
  { kind: "deep", text: "Online anonymity does more good than harm." },
];

export function randomTopic(kind?: TopicKind, not?: string) {
  const pool = TOPICS.filter(
    (t) => (!kind || t.kind === kind) && t.text !== not,
  );
  return pool[Math.floor(Math.random() * pool.length)];
}

// ---- Scoring ----

export const CRITERIA = {
  logic: {
    label: "Logic",
    hint: "Do the reasons actually lead to the conclusion?",
  },
  evidence: {
    label: "Evidence",
    hint: "Examples, facts and specifics, not just assertions.",
  },
  rebuttal: {
    label: "Rebuttal",
    hint: "How well they answered the other side's points.",
  },
  delivery: { label: "Delivery", hint: "Clear, organised and persuasive." },
} as const;

export type Criterion = keyof typeof CRITERIA;
export const CRITERION_KEYS = Object.keys(CRITERIA) as Criterion[];
/** Each criterion is scored out of this. */
export const CRITERION_MAX = 10;

type Speech = { round: string; side: Side; text: string };

const MARKERS =
  /\b(because|since|therefore|so that|for example|for instance|such as|studies|research|data|evidence|percent|karena|sebab|maka|misalnya|contohnya|seperti|data|penelitian|bukti|persen)\b|\d/gi;
const STOP = new Set(
  "the a an and or but is are was were be to of in on for with that this it as at by from not no you your i we they he she my our their yang dan atau di ke dari ini itu tidak untuk dengan pada kita saya kamu aku dia mereka juga".split(
    " ",
  ),
);

const words = (text: string) =>
  text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length > 3 && !STOP.has(w));

const clamp10 = (n: number) =>
  Math.max(0, Math.min(CRITERION_MAX, Math.round(n)));

/** Rule-of-thumb scores, used when the AI judge is unavailable. */
export function fallbackScores(
  speeches: Speech[],
  side: Side,
): Record<Criterion, number> {
  const mine = speeches.filter((s) => s.side === side);
  const theirs = speeches.filter((s) => s.side !== side);
  const all = mine.map((s) => s.text).join(" ");
  const wordCount = all.split(/\s+/).filter(Boolean).length;
  const markers = all.match(MARKERS)?.length ?? 0;
  const sentences = all
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 10).length;
  const theirWords = new Set(theirs.flatMap((s) => words(s.text)));
  const later = mine
    .filter((s) => s.round !== "opening")
    .flatMap((s) => words(s.text));
  const engaged = new Set(later.filter((w) => theirWords.has(w))).size;
  const spoke = mine.filter((s) => s.text.trim()).length;
  return {
    logic: clamp10(
      spoke * 1.5 + Math.min(4, markers / 2) + Math.min(2, sentences / 4),
    ),
    evidence: clamp10(1 + markers * 1.2),
    rebuttal: clamp10(engaged * 0.8),
    delivery: clamp10(spoke * 1.5 + Math.min(5, wordCount / 40)),
  };
}

export const total = (scores: Record<Criterion, number>) =>
  CRITERION_KEYS.reduce((sum, k) => sum + scores[k], 0);

export function formatClock(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
