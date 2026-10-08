<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '#lib/ui/index.ts';
	import { EVOLUTION_BLURB, EVOLUTION_LABEL, type Coat, type Evolution } from '../../../convex/creature/world';
	import { sfx } from '#lib/sound.svelte.ts';
	import { cat } from './art';
	import Pixel from './Pixel.svelte';

	let {
		evolution,
		coat,
		petName,
		ondone
	}: { evolution: Evolution; coat: Coat; petName: string; ondone: () => void } = $props();

	// Three beats: "something is happening", the flash, then the reveal.
	let beat = $state(0);
	onMount(() => {
		sfx.secret();
		const a = setTimeout(() => (beat = 1), 1800);
		const b = setTimeout(() => {
			beat = 2;
			sfx.win();
		}, 3200);
		return () => {
			clearTimeout(a);
			clearTimeout(b);
		};
	});
</script>

<div class="overlay" role="dialog" aria-modal="true" aria-label="{petName} is growing up">
	{#if beat === 0}
		<p class="line blink">Something is happening...</p>
		<div class="shake"><Pixel img={cat(coat, 'teen', undefined, { pose: 'loaf', eyes: 'closed', mouth: 'none' })} scale={7} trim /></div>
	{:else if beat === 1}
		<p class="line">{petName} is growing up!</p>
		<div class="flash"><Pixel img={cat(coat, 'teen', undefined, { pose: 'sit', eyes: 'closed', mouth: 'open' })} scale={7} trim /></div>
	{:else}
		<p class="line">{petName} grew into a</p>
		<h2>{EVOLUTION_LABEL[evolution]}!</h2>
		<div class="reveal">
			<Pixel img={cat(coat, 'adult', evolution, { pose: 'sit', eyes: 'happy', mouth: 'smile', blush: true })} scale={7} trim />
			<span class="spark s1"><Pixel name="sparkle" scale={3} /></span>
			<span class="spark s2"><Pixel name="sparkle" scale={2} /></span>
			<span class="spark s3"><Pixel name="heart" scale={3} /></span>
		</div>
		<p class="muted">{EVOLUTION_BLURB[evolution]} Everything you did together made {petName} who they are.</p>
		<Button size="lg" variant="super" onclick={ondone}>Hello, {petName}</Button>
	{/if}
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.25rem;
		padding: 1.5rem;
		text-align: center;
		background: radial-gradient(circle at 50% 45%, #fff6d8 0%, var(--canopy) 55%, var(--page) 100%);
	}

	.line {
		margin: 0;
		font-size: 1.8rem;
	}

	h2 {
		font-size: 3.2rem;
		color: var(--pink);
		margin-top: -1rem;
	}

	.shake {
		animation: shake 0.25s steps(2, end) infinite;
	}

	.flash {
		animation: flash 0.18s steps(2, end) infinite;
	}

	.reveal {
		position: relative;
		animation: grow 0.6s var(--ease-spring);
	}

	.spark {
		position: absolute;
		animation: px-blink 1.2s steps(2, end) infinite;
	}

	.s1 {
		left: 0;
		top: 30px;
	}

	.s2 {
		right: 10px;
		top: 20px;
		animation-delay: 0.4s;
	}

	.s3 {
		right: 0;
		bottom: 30px;
		animation-delay: 0.8s;
	}

	.overlay p.muted {
		margin: 0;
		max-width: 24rem;
		font-size: 1.15rem;
	}

	@keyframes shake {
		50% {
			transform: translateX(4px) rotate(3deg);
		}
	}

	@keyframes flash {
		50% {
			filter: brightness(3) saturate(0);
		}
	}

	@keyframes grow {
		from {
			transform: scale(0.2);
		}
	}
</style>
