// Daftar perkara. Tambah perkara baru dengan satu berkas di folder ini. HANYA SERVER.

import { tools, type CaseTools } from '../case';
import { bansos } from './bansos';
import { berlian } from './berlian';
import { lahan } from './lahan';

export const CASES = [berlian, bansos, lahan];
export const DEFAULT_CASE = berlian.public.id;

const cache = new Map<string, CaseTools>();

/** Alat untuk sebuah perkara; ruang lama tanpa caseId memakai perkara pertama. */
export function caseFor(id: string | undefined): CaseTools {
	const key = id ?? DEFAULT_CASE;
	let t = cache.get(key);
	if (!t) {
		t = tools(CASES.find((c) => c.public.id === key) ?? berlian);
		cache.set(key, t);
	}
	return t;
}
