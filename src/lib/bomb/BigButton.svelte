<script lang="ts">
	import { sfx } from '#lib/sound.svelte.ts';

	let {
		color,
		label,
		strip,
		disabled = false,
		onpress,
		onrelease
	}: {
		color: string;
		label: string;
		/** Lit colour of the strip; only known while the button is held. */
		strip?: string;
		disabled?: boolean;
		onpress: () => void;
		onrelease: () => void;
	} = $props();

	let down = $state(false);

	function press() {
		if (disabled || down) return;
		down = true;
		sfx.blip();
		onpress();
	}

	function release() {
		if (!down) return;
		down = false;
		onrelease();
	}
</script>

<div class="button-module" aria-label="Modul tombol besar">
	<button
		class="big {color}"
		class:down
		{disabled}
		onpointerdown={(e) => {
			e.currentTarget.setPointerCapture(e.pointerId);
			press();
		}}
		onpointerup={release}
		onpointercancel={release}
		onkeydown={(e) => {
			if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
				e.preventDefault();
				press();
			}
		}}
		onkeyup={(e) => {
			if (e.key === ' ' || e.key === 'Enter') release();
		}}
		oncontextmenu={(e) => e.preventDefault()}
	>
		{label}
	</button>
	<div class="strip" class:lit={!!strip} style={strip ? `--s: var(--strip-${strip})` : ''} aria-live="polite">
		<span class="sr">{strip ? `Garis menyala: ${strip}` : 'Garis tidak menyala'}</span>
	</div>
</div>

<style>
	.button-module {
		--strip-blue: var(--blue);
		--strip-white: #ffffff;
		--strip-yellow: var(--gold);
		--strip-red: var(--red);

		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1.1rem;
		padding: 0.4rem 0;
	}

	.big {
		--bg: var(--red);
		--shade: var(--red-shade);
		--fg: var(--snow);

		width: 7.5rem;
		aspect-ratio: 1;
		border: none;
		border-radius: 0;
		background: radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--bg) 70%, white), var(--bg) 60%);
		color: var(--fg);
		box-shadow:
			0 7px 0 var(--shade),
			0 0 0 6px #3a4d50;
		font-family: var(--font);
		font-weight: 900;
		font-size: 0.95rem;
		letter-spacing: 0.06em;
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
		-webkit-touch-callout: none;
		touch-action: none;
		transition:
			transform 0.06s ease,
			box-shadow 0.06s ease;
	}

	.big.down {
		transform: translateY(7px);
		box-shadow:
			0 0 0 var(--shade),
			0 0 0 6px #3a4d50;
	}

	.blue {
		--bg: var(--blue);
		--shade: var(--blue-shade);
	}

	.yellow {
		--bg: var(--gold);
		--shade: var(--gold-shade);
		--fg: var(--eel);
	}

	.white {
		--bg: #fafafa;
		--shade: #c9c9c9;
		--fg: var(--eel);
	}

	.big:disabled {
		cursor: default;
		filter: saturate(0.4) brightness(0.9);
	}

	.strip {
		width: 1.1rem;
		height: 7.5rem;
		border-radius: 0;
		background: #0f1718;
		box-shadow: inset 0 0 0 3px #3a4d50;
		transition:
			background 0.15s ease,
			box-shadow 0.15s ease;
	}

	.strip.lit {
		background: var(--s);
		box-shadow:
			inset 0 0 0 3px #3a4d50,
			0 0 18px var(--s);
	}

	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
	}
</style>
