<!-- MEK.TXT theme for the courtroom: night palette, Silkscreen + VT323, CRT overlay.
     Scoped to .mek so the rest of the app keeps its own look. -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&family=VT323&display=swap" rel="stylesheet" />
</svelte:head>

<div class="mek">
	{@render children()}
	<div class="crt" aria-hidden="true"></div>
</div>

<style>
	.mek {
		/* Surface — the night */
		--void: #070f1c;
		--night: #0a1528;
		--night-2: #0e182b;
		--night-3: #131f36;
		--rule: #1d2a44;
		--rule-hi: #2d3f5d;
		/* Ink */
		--ink: #f0f1fe;
		--ink-2: #b9c0dc;
		--ink-dim: #56668a;
		--ink-ghost: #2d3a56;
		/* Signal */
		--signal: #8a96ff;
		--signal-deep: #5b63d6;
		--cursor: #ffff6e;
		--exp: #5fc46a;
		/* Stats: red hurts, blue protects, gold is fortune, green is growth */
		--hp: #e26b72;
		--hp-deep: #6d2e3a;
		--atk: #d4505a;
		--atk-deep: #5e2430;
		--def: #7eaaf9;
		--def-deep: #2d3466;
		--luck: #d9b263;
		--luck-deep: #5f4f27;
		--spd: #8aaf48;
		--spd-deep: #2f4022;
		/* World */
		--foliage: #8fbf3a;
		--olive: #8a7a38;
		--bark: #a4583a;
		--stone: #89858e;
		--stone-dk: #4c4349;
		--parchment: #f9ddb4;
		--ember: #ef8a44;
		--crimson: #c4423e;
		--xp-fill: #4a4a86;
		--xp-track: #1a1a2e;
		--px: 4px;
		--tile: 32px;
		--font-ui: 'Silkscreen', ui-monospace, monospace;
		--font-log: 'VT323', ui-monospace, monospace;
		--ease-step: steps(4, end);
		--dur-blink: 900ms;

		position: relative;
		min-height: 100dvh;
		background: var(--night);
		color: var(--ink-2);
		font-family: var(--font-log);
		font-size: 22px;
		line-height: 1.25;
		isolation: isolate;
	}

	.crt {
		position: fixed;
		inset: 0;
		pointer-events: none;
		z-index: 100;
		background:
			repeating-linear-gradient(to bottom, rgba(0, 0, 0, 0.18) 0 1px, transparent 1px 3px),
			radial-gradient(ellipse at center, transparent 55%, rgba(0, 0, 0, 0.55) 100%);
		mix-blend-mode: multiply;
	}

	.mek :global(::selection) {
		background: var(--cursor);
		color: var(--void);
	}
	.mek :global(svg) {
		image-rendering: pixelated;
	}

	.mek :global(h1),
	.mek :global(h2),
	.mek :global(h3) {
		font-family: var(--font-ui);
		font-weight: 400;
		color: var(--ink);
		letter-spacing: 0.04em;
		line-height: 1.1;
		margin: 0;
	}
	.mek :global(p) {
		margin: 0;
	}

	.mek :global(.eyebrow) {
		font-family: var(--font-ui);
		font-size: 12px;
		color: var(--ink-dim);
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}
	.mek :global(.eyebrow b) {
		color: var(--signal);
		font-weight: 400;
	}
	.mek :global(.micro) {
		font-family: var(--font-ui);
		font-size: 10px;
		letter-spacing: 0.12em;
		color: var(--ink-dim);
	}

	.mek :global(.panel) {
		border: 2px solid var(--rule);
		background: var(--night-2);
		padding: 16px;
		position: relative;
	}
	.mek :global(.panel.dark) {
		background: var(--void);
	}
	.mek :global(.tag) {
		position: absolute;
		top: -2px;
		right: -2px;
		font-family: var(--font-ui);
		font-size: 10px;
		background: var(--rule);
		color: var(--ink-dim);
		padding: 3px 8px;
	}

	.mek :global(kbd) {
		font-family: var(--font-ui);
		font-size: 10px;
		color: var(--ink-dim);
		border: 2px solid var(--rule-hi);
		padding: 1px 5px;
		line-height: 1.2;
	}

	.mek :global(.btn) {
		font-family: var(--font-ui);
		font-size: 13px;
		letter-spacing: 0.1em;
		padding: 10px 16px;
		background: var(--void);
		color: var(--ink-2);
		border: 2px solid var(--rule-hi);
		border-radius: 0;
		cursor: pointer;
		display: inline-flex;
		gap: 10px;
		align-items: center;
		justify-content: center;
		text-decoration: none;
		text-transform: uppercase;
	}
	.mek :global(.btn:hover:not(:disabled)) {
		color: var(--ink);
		border-color: var(--ink-dim);
	}
	.mek :global(.btn:active:not(:disabled)) {
		transform: translate(2px, 2px);
	}
	.mek :global(.btn:focus-visible) {
		outline: 2px solid var(--cursor);
		outline-offset: 2px;
	}
	.mek :global(.btn:disabled) {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.mek :global(.btn.primary) {
		background: var(--signal);
		color: var(--void);
		border-color: var(--signal);
	}
	.mek :global(.btn.primary kbd) {
		color: var(--void);
		border-color: var(--void);
	}
	.mek :global(.btn.danger) {
		color: var(--hp);
		border-color: var(--hp-deep);
	}
	.mek :global(.btn.gold) {
		color: var(--luck);
		border-color: var(--luck-deep);
	}
	.mek :global(.btn.small) {
		font-size: 11px;
		padding: 5px 9px;
		gap: 6px;
	}
	.mek :global(.btn.full) {
		width: 100%;
	}

	.mek :global(input),
	.mek :global(textarea),
	.mek :global(select) {
		width: 100%;
		border: 2px solid var(--rule-hi);
		border-radius: 0;
		background: var(--void);
		color: var(--ink);
		font-family: var(--font-log);
		font-size: 22px;
		letter-spacing: 0.06em;
		padding: 6px 10px;
		box-shadow: none;
		caret-color: var(--cursor);
	}
	.mek :global(textarea) {
		min-height: 5rem;
		line-height: 1.1;
	}
	.mek :global(input::placeholder),
	.mek :global(textarea::placeholder) {
		color: var(--ink-ghost);
	}
	.mek :global(input:focus),
	.mek :global(textarea:focus),
	.mek :global(select:focus),
	.mek :global(:focus-visible) {
		outline: 2px solid var(--cursor);
		outline-offset: 2px;
		border-color: var(--rule-hi);
	}

	.mek :global(.marker) {
		display: inline-block;
		width: 20px;
		height: 10px;
		background: var(--cursor);
		clip-path: polygon(0 0, 100% 0, 100% 40%, 70% 40%, 50% 100%, 30% 40%, 0 40%);
		animation: mek-bob 1s steps(2) infinite;
	}
	@keyframes -global-mek-bob {
		50% {
			transform: translateY(3px);
		}
	}
	.mek :global(.blink) {
		animation: mek-blink var(--dur-blink) steps(1) infinite;
	}
	@keyframes -global-mek-blink {
		50% {
			opacity: 0;
		}
	}

	.mek :global(.slot) {
		background: repeating-linear-gradient(135deg, transparent 0 5px, var(--rule) 5px 7px);
	}

	/* Reaction tones: green good, red bad, gold fortune, dim neutral. */
	.mek :global(.tone-good) {
		color: var(--exp);
	}
	.mek :global(.tone-bad) {
		color: var(--hp);
	}
	.mek :global(.tone-gold) {
		color: var(--luck);
	}
	.mek :global(.tone-dim) {
		color: var(--ink-dim);
	}
	.mek :global(.tone-weak) {
		color: var(--olive);
	}
	.mek :global(.side-defense) {
		color: var(--def);
	}
	.mek :global(.side-prosecution) {
		color: var(--atk);
	}
	.mek :global(.side-court) {
		color: var(--luck);
	}

	.mek :global(.toast) {
		position: fixed;
		bottom: 24px;
		left: 50%;
		transform: translateX(-50%);
		background: var(--void);
		border: 2px solid var(--cursor);
		color: var(--ink);
		font-family: var(--font-ui);
		font-size: 12px;
		letter-spacing: 0.08em;
		padding: 10px 16px;
		z-index: 200;
		animation: mek-toast 200ms var(--ease-step);
	}
	@keyframes -global-mek-toast {
		from {
			transform: translateX(-50%) translateY(80px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.mek :global(*),
		.mek :global(*::before),
		.mek :global(*::after) {
			animation: none !important;
			transition: none !important;
		}
	}
</style>
