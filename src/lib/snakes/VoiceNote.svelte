<script lang="ts">
	import { onDestroy } from 'svelte';
	import { PauseIcon, PlayIcon } from '../icons/index.ts';

	let {
		src,
		seconds,
		tone = 'blue',
		compact = false
	}: {
		src: string;
		/** Recorded length; MediaRecorder WebM files often report no duration of their own. */
		seconds?: number;
		/** Colour family for the play button. */
		tone?: string;
		compact?: boolean;
	} = $props();

	let audio: HTMLAudioElement | undefined = $state();
	let playing = $state(false);
	let current = $state(0);
	let mediaDuration = $state(0);
	/** Set when this device can't decode the file (e.g. an older Opus note on an iPhone). */
	let unplayable = $state(false);

	const total = $derived(
		Number.isFinite(mediaDuration) && mediaDuration > 0 ? mediaDuration : (seconds ?? 0)
	);
	const progress = $derived(total ? Math.min(1, current / total) : 0);
	const format = (s: number) => `0:${String(Math.max(0, Math.round(s))).padStart(2, '0')}`;

	function toggle() {
		if (!audio || unplayable) return;
		if (playing) audio.pause();
		else audio.play().catch(() => (unplayable = true));
	}

	onDestroy(() => audio?.pause());
</script>

<div class="voice" class:compact style="--c: var(--{tone}); --c-shade: var(--{tone}-shade); --c-light: var(--{tone}-light)">
	<button type="button" class="play" onclick={toggle} aria-label={playing ? 'Pause voice note' : 'Play voice note'}>
		{#if playing}
			<PauseIcon weight="fill" size="1.3rem" />
		{:else}
			<PlayIcon weight="fill" size="1.3rem" />
		{/if}
	</button>
	<div class="track" aria-hidden="true">
		<div class="fill" style="width: {progress * 100}%"></div>
	</div>
	<span class="time">{format(playing || current > 0 ? current : total)}</span>
	<audio
		bind:this={audio}
		{src}
		preload="metadata"
		onplay={() => (playing = true)}
		onpause={() => (playing = false)}
		onended={() => {
			playing = false;
			current = 0;
		}}
		ontimeupdate={() => (current = audio?.currentTime ?? 0)}
		onloadedmetadata={() => (mediaDuration = audio?.duration ?? 0)}
		onerror={() => (unplayable = true)}
	></audio>
</div>
{#if unplayable}
	<p class="unplayable">This voice note can't play on this device — it was recorded in an older format.</p>
{/if}

<style>
	.voice {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		padding: 0.5rem 0.8rem 0.5rem 0.5rem;
		border-radius: 0;
		background: var(--c-light);
	}

	.play {
		width: 2.6rem;
		height: 2.6rem;
		flex-shrink: 0;
		display: grid;
		place-items: center;
		border: none;
		border-radius: 0;
		background: var(--c);
		color: var(--snow);
		box-shadow: 0 3px 0 var(--c-shade);
		cursor: pointer;
		transition:
			transform 0.08s ease,
			box-shadow 0.08s ease;
	}

	.play:active {
		transform: translateY(3px);
		box-shadow: 0 0 0 var(--c-shade);
	}

	.track {
		flex: 1;
		height: 8px;
		border-radius: 0;
		background: color-mix(in srgb, var(--c) 25%, transparent);
		overflow: hidden;
	}

	.fill {
		height: 100%;
		border-radius: inherit;
		background: var(--c);
		transition: width 0.15s linear;
	}

	.time {
		font-size: 0.85rem;
		font-weight: 900;
		color: var(--c-shade);
		font-variant-numeric: tabular-nums;
	}

	.unplayable {
		margin: 0.3rem 0 0;
		font-size: 0.78rem;
		font-weight: 800;
		color: var(--red-shade);
	}

	.compact {
		padding: 0.3rem 0.7rem 0.3rem 0.3rem;
	}

	.compact .play {
		width: 2rem;
		height: 2rem;
	}
</style>
