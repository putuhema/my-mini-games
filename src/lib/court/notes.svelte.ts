// Each player's private scratchpad for a trial: notes, evidence and suspect marks, their own
// timeline. Kept in localStorage only — the opponent never sees it.

export type Mark = 'key' | 'doubt' | 'lie';
export type SuspectMark = 'suspect' | 'cleared' | 'unsure';

type Notes = {
	text: string;
	marks: Record<string, Mark>;
	suspects: Record<string, SuspectMark>;
	timeline: { time: string; text: string }[];
};

export class CourtNotes {
	data = $state<Notes>({ text: '', marks: {}, suspects: {}, timeline: [] });
	#key: string;

	constructor(code: string, trial: string) {
		this.#key = `court.notes.${code}.${trial}`;
		try {
			const saved = localStorage.getItem(this.#key);
			if (saved) this.data = { ...this.data, ...JSON.parse(saved) };
		} catch {
			// A corrupt entry just means a fresh notebook.
		}
	}

	save() {
		localStorage.setItem(this.#key, JSON.stringify(this.data));
	}

	mark(id: string, mark: Mark) {
		if (this.data.marks[id] === mark) delete this.data.marks[id];
		else this.data.marks[id] = mark;
		this.save();
	}

	suspect(id: string, mark: SuspectMark) {
		if (this.data.suspects[id] === mark) delete this.data.suspects[id];
		else this.data.suspects[id] = mark;
		this.save();
	}

	addEvent(time: string, text: string) {
		this.data.timeline = [...this.data.timeline, { time, text }];
		this.save();
	}

	removeEvent(i: number) {
		this.data.timeline = this.data.timeline.filter((_, j) => j !== i);
		this.save();
	}
}
