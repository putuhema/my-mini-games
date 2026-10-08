// Sound effects, synthesised with the Web Audio API — no audio files to load.
// Browsers only allow audio after the user has interacted with the page, so the
// context is created lazily and resumed on the first tap or key press (see unlockAudio).

const MUTE_KEY = 'ldr.muted';

export const sound = $state({ muted: localStorage.getItem(MUTE_KEY) === '1' });

export function toggleMute() {
	sound.muted = !sound.muted;
	localStorage.setItem(MUTE_KEY, sound.muted ? '1' : '0');
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function audio() {
	if (!ctx) {
		ctx = new AudioContext();
		const compressor = ctx.createDynamicsCompressor();
		master = ctx.createGain();
		master.gain.value = 0.55;
		master.connect(compressor).connect(ctx.destination);
	}
	if (ctx.state === 'suspended') void ctx.resume();
	return { ctx, out: master! };
}

/** Call once from the layout: creates/resumes the audio context on the first user gesture. */
export function unlockAudio() {
	const unlock = () => {
		audio();
		window.removeEventListener('pointerdown', unlock);
		window.removeEventListener('keydown', unlock);
	};
	window.addEventListener('pointerdown', unlock);
	window.addEventListener('keydown', unlock);
}

type ToneOptions = {
	freq: number;
	/** Glide to this frequency over the note. */
	to?: number;
	type?: OscillatorType;
	/** Seconds from now. */
	at?: number;
	dur?: number;
	gain?: number;
	attack?: number;
	vibrato?: { rate: number; depth: number };
};

function tone({ freq, to, type = 'sine', at = 0, dur = 0.15, gain = 0.2, attack = 0.005, vibrato }: ToneOptions) {
	const { ctx, out } = audio();
	const t = ctx.currentTime + at;
	const osc = ctx.createOscillator();
	const env = ctx.createGain();
	osc.type = type;
	osc.frequency.setValueAtTime(freq, t);
	if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
	if (vibrato) {
		const lfo = ctx.createOscillator();
		const depth = ctx.createGain();
		lfo.frequency.value = vibrato.rate;
		depth.gain.value = vibrato.depth;
		lfo.connect(depth).connect(osc.frequency);
		lfo.start(t);
		lfo.stop(t + dur);
	}
	env.gain.setValueAtTime(0, t);
	env.gain.linearRampToValueAtTime(gain, t + attack);
	env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
	osc.connect(env).connect(out);
	osc.start(t);
	osc.stop(t + dur + 0.02);
}

let noiseBuffer: AudioBuffer | null = null;

function noise({ at = 0, dur = 0.04, gain = 0.15, freq = 2500, q = 1.2, type = 'bandpass' as BiquadFilterType }) {
	const { ctx, out } = audio();
	if (!noiseBuffer) {
		noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
		const data = noiseBuffer.getChannelData(0);
		for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
	}
	const t = ctx.currentTime + at;
	const src = ctx.createBufferSource();
	const filter = ctx.createBiquadFilter();
	const env = ctx.createGain();
	src.buffer = noiseBuffer;
	src.loop = true; // long rumbles outlast the one-second buffer
	filter.type = type;
	filter.frequency.value = freq;
	filter.Q.value = q;
	env.gain.setValueAtTime(gain, t);
	env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
	src.connect(filter).connect(env).connect(out);
	src.start(t, Math.random() * 0.5);
	src.stop(t + dur + 0.02);
}

const play = (fn: () => void) => () => {
	if (sound.muted || typeof AudioContext === 'undefined') return;
	try {
		fn();
	} catch {
		// Audio is a nice-to-have; never let it break the game.
	}
};

// Note frequencies (Hz)
const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5, E6 = 1318.5, G6 = 1568, C7 = 2093;

export const sfx = {
	/** Dice tumbling (clicks that slow down) and landing with a thunk. Matches the 1.1s landing. */
	dice: play(() => {
		let t = 0;
		let gap = 0.045;
		while (t < 0.85) {
			noise({ at: t, dur: 0.035, gain: 0.22 * (1 - t), freq: 2200 + Math.random() * 1600, q: 2 });
			t += gap;
			gap *= 1.16;
		}
		tone({ freq: 160, to: 70, at: 0.9, dur: 0.18, gain: 0.35 });
		noise({ at: 0.9, dur: 0.08, gain: 0.18, freq: 400, type: 'lowpass' });
	}),

	/** One hop of a token; pass the step number so each hop climbs in pitch. */
	step: (n = 0) =>
		play(() => {
			const freq = 440 * 2 ** (((n * 2) % 14) / 12);
			tone({ freq, to: freq * 1.25, type: 'triangle', dur: 0.09, gain: 0.16 });
		})(),

	/** Climbing a ladder: quick rising arpeggio. */
	ladder: play(() => {
		[C5, E5, G5, C6, E6].forEach((freq, i) =>
			tone({ freq, type: 'triangle', at: i * 0.075, dur: 0.18, gain: 0.16 })
		);
	}),

	/** Sliding down a snake: wobbly slide-whistle drop. */
	snake: play(() => {
		tone({ freq: 900, to: 180, dur: 1.0, gain: 0.16, vibrato: { rate: 9, depth: 25 } });
		tone({ freq: 450, to: 90, type: 'triangle', dur: 1.0, gain: 0.08 });
	}),

	/** The question bubble popping up. */
	pop: play(() => {
		tone({ freq: 520, to: 980, dur: 0.09, gain: 0.22 });
		tone({ freq: 1040, type: 'triangle', at: 0.04, dur: 0.08, gain: 0.08 });
	}),

	/** A secret question appearing: sparkle. */
	secret: play(() => {
		[G6, C7, E6 * 2, G6 * 2].forEach((freq, i) =>
			tone({ freq, at: i * 0.06, dur: 0.25, gain: 0.08 })
		);
		tone({ freq: C6, at: 0, dur: 0.4, gain: 0.1, type: 'triangle' });
	}),

	/** Answer sent: whoosh + blip. */
	send: play(() => {
		noise({ dur: 0.25, gain: 0.12, freq: 1200, q: 0.7 });
		tone({ freq: 700, to: 1400, at: 0.05, dur: 0.12, gain: 0.14 });
	}),

	/** A reaction arriving: bright two-note chime. */
	reaction: play(() => {
		tone({ freq: C6, type: 'triangle', dur: 0.3, gain: 0.18 });
		tone({ freq: C6 * 2, dur: 0.2, gain: 0.05 });
		tone({ freq: E6, type: 'triangle', at: 0.1, dur: 0.45, gain: 0.18 });
		tone({ freq: E6 * 2, at: 0.1, dur: 0.3, gain: 0.05 });
	}),

	/** Gentle "your move" ding (used when the tab is in the background). */
	turn: play(() => {
		tone({ freq: E5, dur: 0.35, gain: 0.16 });
		tone({ freq: C6, at: 0.14, dur: 0.5, gain: 0.16 });
	}),

	/** Guess matched: bouncy ta-da. */
	match: play(() => {
		[G5, C6, E6, G6].forEach((freq, i) =>
			tone({ freq, type: 'triangle', at: i * 0.07, dur: i === 3 ? 0.5 : 0.15, gain: 0.16 })
		);
		tone({ freq: G6 * 2, at: 0.21, dur: 0.4, gain: 0.04 });
	}),

	/** Guess missed: playful "womp womp". */
	miss: play(() => {
		tone({ freq: 392, to: 370, type: 'square', dur: 0.28, gain: 0.06 });
		tone({ freq: 330, to: 220, type: 'square', at: 0.32, dur: 0.6, gain: 0.06, vibrato: { rate: 6, depth: 8 } });
	}),

	/** Bomb clock: a dry tick each second, a sharper beep in the last ten. */
	tick: (urgent = false) =>
		play(() => {
			if (urgent) tone({ freq: 1760, type: 'square', dur: 0.07, gain: 0.07 });
			else noise({ dur: 0.02, gain: 0.12, freq: 3500, q: 4 });
		})(),

	/** Wire cut: a quick metallic snip. */
	snip: play(() => {
		noise({ dur: 0.05, gain: 0.3, freq: 5000, q: 3 });
		noise({ at: 0.03, dur: 0.06, gain: 0.15, freq: 2500, q: 2 });
	}),

	/** Keypad or button press: a short electronic blip. */
	blip: play(() => {
		tone({ freq: 880, type: 'square', dur: 0.06, gain: 0.06 });
	}),

	/** Simon pad: each colour has its own note. */
	simon: (color: string) =>
		play(() => {
			const freq = { red: 330, blue: 415, green: 494, yellow: 554 }[color] ?? 440;
			tone({ freq, type: 'triangle', dur: 0.35, gain: 0.2 });
		})(),

	/** Module disarmed: two bright beeps. */
	disarm: play(() => {
		tone({ freq: E6, type: 'square', dur: 0.08, gain: 0.06 });
		tone({ freq: G6, type: 'square', at: 0.1, dur: 0.14, gain: 0.06 });
	}),

	/** Strike: harsh buzzer. */
	strike: play(() => {
		tone({ freq: 110, type: 'sawtooth', dur: 0.45, gain: 0.16 });
		tone({ freq: 116, type: 'square', dur: 0.45, gain: 0.08 });
	}),

	/** Explosion: low thump plus a long rumble of filtered noise. */
	boom: play(() => {
		tone({ freq: 120, to: 30, dur: 0.9, gain: 0.5 });
		noise({ dur: 1.8, gain: 0.6, freq: 600, type: 'lowpass' });
		noise({ at: 0.05, dur: 1.2, gain: 0.25, freq: 1800, q: 0.5 });
	}),

	/** An ingredient landing on the burger: soft plop. */
	plop: play(() => {
		tone({ freq: 260, to: 120, dur: 0.12, gain: 0.25 });
		noise({ dur: 0.05, gain: 0.08, freq: 900, type: 'lowpass' });
	}),

	/** A patty hitting the grill: hiss of noise. */
	sizzle: play(() => {
		noise({ dur: 0.7, gain: 0.14, freq: 6000, q: 0.6 });
		noise({ at: 0.05, dur: 0.5, gain: 0.08, freq: 3000, q: 1 });
	}),

	/** The serve bell on the counter. */
	bell: play(() => {
		tone({ freq: 1760, dur: 0.9, gain: 0.14 });
		tone({ freq: 2637, dur: 0.6, gain: 0.05 });
		tone({ freq: 1765, type: 'triangle', dur: 0.9, gain: 0.06 });
	}),

	/** Tips: a cash register "ka-ching". */
	cash: play(() => {
		noise({ dur: 0.06, gain: 0.2, freq: 3000, q: 2 });
		tone({ freq: E6, type: 'square', at: 0.08, dur: 0.12, gain: 0.06 });
		tone({ freq: G6 * 1.335, type: 'square', at: 0.16, dur: 0.35, gain: 0.06 });
	}),

	/** Winning fanfare. */
	win: play(() => {
		const notes: [number, number, number][] = [
			[C5, 0, 0.14],
			[E5, 0.13, 0.14],
			[G5, 0.26, 0.14],
			[C6, 0.39, 0.6]
		];
		for (const [freq, at, dur] of notes) {
			tone({ freq, type: 'square', at, dur, gain: 0.07 });
			tone({ freq: freq * 1.005, type: 'triangle', at, dur, gain: 0.12 });
		}
		tone({ freq: G5, type: 'triangle', at: 0.39, dur: 0.6, gain: 0.08 });
		tone({ freq: E5, type: 'triangle', at: 0.39, dur: 0.6, gain: 0.08 });
	})
};
