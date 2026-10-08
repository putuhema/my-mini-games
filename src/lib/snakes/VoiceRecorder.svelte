<script lang="ts" module>
	export type VoiceClip = { blob: Blob; url: string; seconds: number };

	const SAMPLE_RATE = 22050;

	/** 16-bit mono PCM WAV — the one audio format every browser and phone can play back. */
	function encodeWav(samples: Float32Array, sampleRate: number) {
		const buffer = new ArrayBuffer(44 + samples.length * 2);
		const view = new DataView(buffer);
		const text = (offset: number, s: string) => {
			for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
		};
		text(0, 'RIFF');
		view.setUint32(4, 36 + samples.length * 2, true);
		text(8, 'WAVE');
		text(12, 'fmt ');
		view.setUint32(16, 16, true); // PCM chunk size
		view.setUint16(20, 1, true); // PCM
		view.setUint16(22, 1, true); // mono
		view.setUint32(24, sampleRate, true);
		view.setUint32(28, sampleRate * 2, true); // byte rate
		view.setUint16(32, 2, true); // block align
		view.setUint16(34, 16, true); // bits per sample
		text(36, 'data');
		view.setUint32(40, samples.length * 2, true);
		for (let i = 0; i < samples.length; i++) {
			const s = Math.max(-1, Math.min(1, samples[i]));
			view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
		}
		return new Blob([buffer], { type: 'audio/wav' });
	}

	/** Average-and-decimate down to the target rate (cheap anti-aliasing, fine for speech). */
	function downsample(input: Float32Array, fromRate: number, toRate: number) {
		if (fromRate <= toRate) return input;
		const ratio = fromRate / toRate;
		const out = new Float32Array(Math.floor(input.length / ratio));
		for (let i = 0; i < out.length; i++) {
			const start = Math.floor(i * ratio);
			const end = Math.min(input.length, Math.floor((i + 1) * ratio));
			let sum = 0;
			for (let j = start; j < end; j++) sum += input[j];
			out[i] = sum / Math.max(1, end - start);
		}
		return out;
	}
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { ArrowCounterClockwiseIcon, MicrophoneIcon, StopIcon } from '../icons/index.ts';
	import VoiceNote from './VoiceNote.svelte';

	const MAX_SECONDS = 10;

	let {
		clip = $bindable(null),
		recording = $bindable(false),
		disabled = false
	}: { clip?: VoiceClip | null; recording?: boolean; disabled?: boolean } = $props();

	let elapsed = $state(0);
	let level = $state(0);
	let error = $state('');

	let ctx: AudioContext | undefined;
	let stream: MediaStream | undefined;
	let processor: ScriptProcessorNode | undefined;
	let chunks: Float32Array[] = [];
	let raf = 0;
	let startedAt = 0;
	let finishWaiters: ((clip: VoiceClip | null) => void)[] = [];

	const supported =
		typeof window !== 'undefined' &&
		!!navigator.mediaDevices?.getUserMedia &&
		(typeof AudioContext !== 'undefined' || 'webkitAudioContext' in window);

	async function start() {
		error = '';
		// Create and resume the audio context synchronously inside the tap: iPhone Safari records
		// silence if this happens after an await.
		const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
		ctx = new Ctor();
		void ctx.resume();
		try {
			stream = await navigator.mediaDevices.getUserMedia({
				audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
			});
		} catch {
			error = 'Allow microphone access to record a voice note.';
			void ctx.close();
			ctx = undefined;
			return;
		}
		await ctx.resume();

		const source = ctx.createMediaStreamSource(stream);
		const analyser = ctx.createAnalyser();
		analyser.fftSize = 256;
		source.connect(analyser);

		// ScriptProcessor is deprecated but is the one capture path that works everywhere, Safari included.
		processor = ctx.createScriptProcessor(4096, 1, 1);
		chunks = [];
		processor.onaudioprocess = (e) => chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
		source.connect(processor);
		processor.connect(ctx.destination); // required for it to run; the output is silent

		const samples = new Uint8Array(analyser.frequencyBinCount);
		startedAt = performance.now();
		recording = true;
		const tick = () => {
			elapsed = (performance.now() - startedAt) / 1000;
			analyser.getByteTimeDomainData(samples);
			let peak = 0;
			for (const s of samples) peak = Math.max(peak, Math.abs(s - 128));
			level = Math.min(1, peak / 64);
			if (elapsed >= MAX_SECONDS) stop();
			else raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
	}

	function stop() {
		if (!recording || !ctx) return;
		cancelAnimationFrame(raf);
		const rate = ctx.sampleRate;
		const length = chunks.reduce((n, c) => n + c.length, 0);
		const merged = new Float32Array(length);
		let offset = 0;
		for (const c of chunks) {
			merged.set(c, offset);
			offset += c.length;
		}
		cleanup();

		const seconds = Math.min(MAX_SECONDS, merged.length / rate);
		let result: VoiceClip | null = null;
		if (seconds < 0.5) {
			error = 'That was too short — hold on a little longer.';
		} else {
			let peak = 0;
			for (let i = 0; i < merged.length; i += 64) peak = Math.max(peak, Math.abs(merged[i]));
			if (peak < 0.003) {
				error = "We didn't hear anything — check your microphone and try again.";
			} else {
				const blob = encodeWav(downsample(merged, rate, SAMPLE_RATE), SAMPLE_RATE);
				if (clip) URL.revokeObjectURL(clip.url);
				result = { blob, url: URL.createObjectURL(blob), seconds };
				clip = result;
			}
		}
		finishWaiters.forEach((resolve) => resolve(result));
		finishWaiters = [];
	}

	/** Stop an in-progress recording (if any) and resolve with the final clip — used by Send. */
	export function finish(): Promise<VoiceClip | null> {
		if (!recording) return Promise.resolve(clip);
		return new Promise((resolve) => {
			finishWaiters.push(resolve);
			stop();
		});
	}

	function cleanup() {
		cancelAnimationFrame(raf);
		processor?.disconnect();
		if (processor) processor.onaudioprocess = null;
		stream?.getTracks().forEach((t) => t.stop());
		void ctx?.close();
		processor = undefined;
		stream = undefined;
		ctx = undefined;
		chunks = [];
		recording = false;
		elapsed = 0;
		level = 0;
	}

	function discard() {
		if (clip) URL.revokeObjectURL(clip.url);
		clip = null;
	}

	onDestroy(cleanup);
</script>

{#if supported}
	<div class="recorder">
		{#if recording}
			<button type="button" class="rec stop" onclick={stop} aria-label="Stop recording">
				<StopIcon weight="fill" size="1.2rem" />
			</button>
			<div class="meter" aria-hidden="true">
				{#each [0.6, 0.85, 1, 0.85, 0.6, 0.75, 0.95] as weight, i (i)}
					<span style="height: {16 + level * weight * 84}%"></span>
				{/each}
			</div>
			<span class="countdown" aria-live="polite">{Math.ceil(MAX_SECONDS - elapsed)}s</span>
		{:else if clip}
			<div class="preview"><VoiceNote src={clip.url} seconds={clip.seconds} tone="pink" /></div>
			<button type="button" class="rec ghost" onclick={discard} {disabled} aria-label="Delete and record again">
				<ArrowCounterClockwiseIcon weight="bold" size="1.2rem" />
			</button>
		{:else}
			<button type="button" class="rec start" onclick={start} {disabled}>
				<MicrophoneIcon weight="fill" size="1.2rem" />
				<span>Record a voice note</span>
				<small>up to {MAX_SECONDS}s</small>
			</button>
		{/if}
	</div>
	{#if error}<p class="error">{error}</p>{/if}
{/if}

<style>
	.recorder {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		min-height: 3.2rem;
	}

	.rec {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.45rem;
		border: none;
		font-weight: 900;
		cursor: pointer;
		touch-action: manipulation;
	}

	.rec:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.start {
		flex: 1;
		padding: 0.7rem 1rem;
		border: var(--border) dashed var(--pink);
		border-radius: var(--radius);
		background: var(--pink-light);
		color: var(--pink-shade);
	}

	.start small {
		margin-left: auto;
		font-weight: 800;
		opacity: 0.75;
	}

	.stop {
		width: 3rem;
		height: 3rem;
		flex-shrink: 0;
		border-radius: 0;
		background: var(--red);
		color: var(--snow);
		box-shadow: 0 0 0 0 color-mix(in srgb, var(--red) 50%, transparent);
		animation: ring 1.2s ease-out infinite;
	}

	@keyframes ring {
		to {
			box-shadow: 0 0 0 12px transparent;
		}
	}

	.meter {
		flex: 1;
		height: 2.2rem;
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.meter span {
		flex: 1;
		border-radius: 0;
		background: var(--red);
		transition: height 0.08s linear;
	}

	.countdown {
		min-width: 2.2rem;
		text-align: right;
		font-weight: 900;
		color: var(--red-shade);
		font-variant-numeric: tabular-nums;
	}

	.preview {
		flex: 1;
	}

	.ghost {
		width: 2.6rem;
		height: 2.6rem;
		flex-shrink: 0;
		border-radius: 0;
		background: var(--polar);
		color: var(--wolf);
	}
</style>
