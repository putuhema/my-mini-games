import { tools, type CaseTools } from "../case";
import { amal } from "./amal";
import { bansos } from "./bansos";
import { berlian } from "./berlian";
import { lahan } from "./lahan";
import { ijazahWagub } from "./ijazah";
import { nasiGorengJam2 } from "./selingkuh";

export const CASES = [
  amal,
  berlian,
  bansos,
  lahan,
  ijazahWagub,
  nasiGorengJam2,
];
export const DEFAULT_CASE = berlian.public.id;

const cache = new Map<string, CaseTools>();

export function caseFor(id: string | undefined): CaseTools {
  const key = id ?? DEFAULT_CASE;
  let t = cache.get(key);
  if (!t) {
    t = tools(CASES.find((c) => c.public.id === key) ?? berlian);
    cache.set(key, t);
  }
  return t;
}
