/** XP awarded per answered question. */
export const XP_PER_ANSWER = 10;

/**
 * Consecutive days (ending today or yesterday) on which the couple answered
 * at least one question, from answer creation timestamps.
 */
export function streakDays(timestamps: number[], now = Date.now()): number {
	const dayKey = (t: number) => {
		const d = new Date(t);
		return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
	};
	const days = new Set(timestamps.map(dayKey));
	const cursor = new Date(now);
	// A streak survives until the end of the day after the last play.
	if (!days.has(dayKey(cursor.getTime()))) cursor.setDate(cursor.getDate() - 1);

	let streak = 0;
	while (days.has(dayKey(cursor.getTime()))) {
		streak++;
		cursor.setDate(cursor.getDate() - 1);
	}
	return streak;
}
