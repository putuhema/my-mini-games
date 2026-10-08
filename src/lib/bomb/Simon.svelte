<script lang="ts">
	import { SIMON_COLORS } from '../../../convex/bomb';
	import { sfx } from '#lib/sound.svelte.ts';

	let {
		sequence,
		solved = false,
		disabled = false,
		onpress
	}: {
		/** The flashes for the current stage. */
		sequence: string[];
		solved?: boolean;
		disabled?: boolean;
		onpress: (color: string) => void;
	} = $props();

	let lit = $state<string | null>(null);
	/** Bumped on every press so the flash loop pauses while the defuser is entering. */
	let lastPress = $state(0);

	const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
	// A string, so unrelated room updates (a new array each time) don't restart the loop.
	const flashKey = $derived(sequence.join(' '));

	// Flash the sequence on repeat; restart when the stage grows or after a press.
	$effect(() => {
		const flashes = flashKey ? flashKey.split(' ') : [];
		const pressedAt = lastPress;
		if (solved || flashes.length === 0) return;
		let cancelled = false;
		(async () => {
			await wait(pressedAt ? 3500 : 900);
			while (!cancelled) {
				for (const color of flashes) {
					if (cancelled) return;
					lit = color;
					await wait(450);
					lit = null;
					await wait(250);
				}
				await wait(2600);
			}
		})();
		return () => {
			cancelled = true;
			lit = null;
		};
	});

	function press(color: string) {
		lastPress = Date.now();
		sfx.simon(color);
		onpress(color);
	}
</script>

<div class="simon" class:solved>
	{#each SIMON_COLORS as color (color)}
		<button
			class="pad {color}"
			class:lit={lit === color}
			{disabled}
			aria-label="{color} pad"
			onclick={() => press(color)}
		></button>
	{/each}
</div>

<style>
	.simon {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.55rem;
		width: 9.5rem;
		margin: 1.4rem auto;
		rotate: 45deg;
	}

	.pad {
		--c: var(--red);
		aspect-ratio: 1;
		border: none;
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--c) 38%, #0f1813);
		box-shadow: inset 0 -4px 0 rgb(0 0 0 / 0.35);
		cursor: pointer;
		touch-action: manipulation;
		transition:
			background 0.08s ease,
			box-shadow 0.08s ease;
	}

	.pad:active:not(:disabled),
	.pad.lit {
		background: var(--c);
		box-shadow:
			inset 0 -4px 0 rgb(0 0 0 / 0.15),
			0 0 22px var(--c);
	}

	.pad:disabled {
		cursor: default;
	}

	.blue {
		--c: var(--blue);
	}

	.green {
		--c: var(--green);
	}

	.yellow {
		--c: var(--gold);
	}

	.solved .pad {
		filter: saturate(0.3);
	}
</style>
