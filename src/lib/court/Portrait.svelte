<!--
	16×16 pixel portraits with a face that reacts: they breathe, blink, talk, and pull faces
	(happy, smug, shocked, sweating, angry, pointing, thinking). The prosecutor is mirrored
	so both counsel face the judge.
-->
<script lang="ts" module>
	export type Mood = 'idle' | 'happy' | 'smug' | 'shock' | 'sweat' | 'angry' | 'point' | 'think' | 'gavel' | 'nod' | 'stern' | 'sleep';
</script>

<script lang="ts">
	let {
		who,
		size = 72,
		mood = 'idle',
		talking = false,
		speaking = false
	}: {
		who: 'judge' | 'defense' | 'prosecution';
		size?: number;
		mood?: Mood;
		/** Mouth flaps while true. */
		talking?: boolean;
		/** Legacy: a gentle bob for whoever holds the turn. */
		speaking?: boolean;
	} = $props();

	const JUDGE = [
		'....wwwwwwww....',
		'...wwwwwwwwww...',
		'..wwwwwwwwwwww..',
		'..wwwsssssswww..',
		'..wwssssssssww..',
		'..wwssssssssww..',
		'..wwssssssssww..',
		'..wwwsssssswww..',
		'..wwwsssssswww..',
		'..www.ssss.www..',
		'.wwww.ssss.wwww.',
		'bbbbbbwwwwbbbbbb',
		'bbbbbbbwwbbbbbbb',
		'bbbbbbbbbbbbbbbb',
		'bbbbbbbbbbbbbbbb',
		'bbbbbbbbbbbbbbbb'
	];
	const DEFENSE = [
		'......hhhh......',
		'....hhhhhhhh....',
		'...hhhhhhhhhh...',
		'...hhsssssshh...',
		'...hssssssssh...',
		'...hssssssssh...',
		'...hssssssssh...',
		'....ssssssss....',
		'....ssssssss....',
		'.....ssssss.....',
		'......ssss......',
		'...cccwwwwccc...',
		'..ccccwttwcccc..',
		'.cccccwttwccccc.',
		'.ccccccttcccccc.',
		'.cccccccccccccc.'
	];
	// Longer hair framing the face.
	const PROSECUTION = DEFENSE.map((row, y) =>
		y === 7 || y === 8 ? '...hssssssssh...' : y === 9 ? '...hhsssssshh...' : row
	);

	const PALETTE: Record<string, Record<string, string>> = {
		judge: { w: 'var(--ink)', s: 'var(--parchment)', b: 'var(--night-3)', h: 'var(--stone)' },
		defense: { h: 'var(--stone-dk)', s: 'var(--parchment)', c: 'var(--def-deep)', t: 'var(--def)', w: 'var(--ink)' },
		prosecution: { h: 'var(--bark)', s: 'var(--parchment)', c: 'var(--atk-deep)', t: 'var(--atk)', w: 'var(--ink)' }
	};
	// Face colours shared by everyone.
	const FACE: Record<string, string> = {
		k: 'var(--void)',
		e: 'var(--ink)',
		m: 'var(--bark)',
		o: 'var(--hp-deep)',
		d: 'var(--def)',
		p: 'var(--hp)',
		r: 'var(--hp)',
		G: 'var(--stone-dk)',
		g: 'var(--bark)'
	};

	type Px = [x: number, y: number, c: string];

	// Eyes sit at x 5–6 and 9–10 on row 5; brows on row 4 (raised: row 3); mouth on row 8, x 6–9.
	const EYES = {
		open: [[5, 5, 'e'], [6, 5, 'k'], [9, 5, 'k'], [10, 5, 'e']],
		closed: [[5, 5, 'k'], [6, 5, 'k'], [9, 5, 'k'], [10, 5, 'k']],
		wide: [[5, 4, 'e'], [6, 4, 'e'], [5, 5, 'e'], [6, 5, 'k'], [9, 4, 'e'], [10, 4, 'e'], [9, 5, 'k'], [10, 5, 'e']],
		side: [[5, 5, 'k'], [6, 5, 'e'], [9, 5, 'k'], [10, 5, 'e']],
		lidded: [[5, 5, 'k'], [6, 5, 'k'], [9, 5, 'k'], [10, 5, 'k'], [6, 4, 'h'], [9, 4, 'h']]
	} satisfies Record<string, Px[]>;
	const BROWS = {
		flat: [[5, 4, 'h'], [6, 4, 'h'], [9, 4, 'h'], [10, 4, 'h']],
		raised: [[5, 3, 'h'], [6, 3, 'h'], [9, 3, 'h'], [10, 3, 'h']],
		angry: [[5, 3, 'k'], [6, 4, 'k'], [10, 3, 'k'], [9, 4, 'k']],
		worried: [[5, 4, 'h'], [6, 3, 'h'], [10, 4, 'h'], [9, 3, 'h']],
		none: []
	} satisfies Record<string, Px[]>;
	const MOUTHS = {
		neutral: [[7, 8, 'm'], [8, 8, 'm']],
		smile: [[6, 7, 'm'], [7, 8, 'm'], [8, 8, 'm'], [9, 7, 'm']],
		smirk: [[7, 8, 'm'], [8, 8, 'm'], [9, 7, 'm']],
		frown: [[6, 9, 'm'], [7, 8, 'm'], [8, 8, 'm'], [9, 9, 'm']],
		open: [[7, 8, 'o'], [8, 8, 'o'], [7, 9, 'o'], [8, 9, 'o']],
		talk: [[7, 8, 'o'], [8, 8, 'o']],
		grit: [[6, 8, 'e'], [7, 8, 'e'], [8, 8, 'e'], [9, 8, 'e']],
		wobble: [[6, 8, 'm'], [7, 9, 'm'], [8, 8, 'm'], [9, 9, 'm']]
	} satisfies Record<string, Px[]>;
	const EXTRAS = {
		sweat: [[13, 4, 'd'], [13, 5, 'd']],
		blush: [[5, 7, 'p'], [10, 7, 'p']],
		vein: [[11, 2, 'r'], [12, 2, 'r'], [12, 3, 'r']],
		point: [[13, 11, 'c'], [13, 10, 'c'], [14, 10, 'c'], [14, 9, 'c'], [15, 9, 's'], [15, 8, 's']],
		gavel: [[14, 7, 'G'], [15, 7, 'G'], [14, 8, 'G'], [15, 8, 'G'], [13, 9, 'g'], [12, 10, 'g']],
		gavelUp: [[14, 3, 'G'], [15, 3, 'G'], [14, 4, 'G'], [15, 4, 'G'], [13, 5, 'g'], [13, 6, 'g']]
	} satisfies Record<string, Px[]>;

	type Face = { eyes: keyof typeof EYES; brows: keyof typeof BROWS; mouth: keyof typeof MOUTHS; extras?: (keyof typeof EXTRAS)[]; emote?: string };
	const FACES: Record<Mood, Face> = {
		idle: { eyes: 'open', brows: 'flat', mouth: 'neutral' },
		happy: { eyes: 'closed', brows: 'raised', mouth: 'smile', extras: ['blush'], emote: '♪' },
		smug: { eyes: 'lidded', brows: 'flat', mouth: 'smirk' },
		shock: { eyes: 'wide', brows: 'raised', mouth: 'open', extras: ['sweat'], emote: '!' },
		sweat: { eyes: 'open', brows: 'worried', mouth: 'wobble', extras: ['sweat'] },
		angry: { eyes: 'open', brows: 'angry', mouth: 'grit', extras: ['vein'] },
		point: { eyes: 'open', brows: 'angry', mouth: 'open', extras: ['point'], emote: '!' },
		think: { eyes: 'side', brows: 'worried', mouth: 'neutral', emote: '…' },
		gavel: { eyes: 'open', brows: 'angry', mouth: 'grit', extras: ['gavel'] },
		nod: { eyes: 'closed', brows: 'flat', mouth: 'smile' },
		stern: { eyes: 'open', brows: 'angry', mouth: 'frown' },
		sleep: { eyes: 'closed', brows: 'flat', mouth: 'neutral', emote: '…' }
	};

	// ---- Blink and mouth flaps, driven by small timers ----
	let blink = $state(false);
	let flap = $state(false);
	$effect(() => {
		let t: ReturnType<typeof setTimeout>;
		const next = () => {
			t = setTimeout(
				() => {
					blink = true;
					setTimeout(() => (blink = false), 130);
					next();
				},
				2400 + Math.random() * 3200
			);
		};
		next();
		return () => clearTimeout(t);
	});
	$effect(() => {
		if (!talking && mood !== 'gavel') return void (flap = false);
		const id = setInterval(() => (flap = !flap), mood === 'gavel' ? 220 : 130);
		return () => clearInterval(id);
	});

	const base = $derived(who === 'judge' ? JUDGE : who === 'defense' ? DEFENSE : PROSECUTION);
	const face = $derived(FACES[mood]);
	const pixels = $derived.by(() => {
		const pal = { ...PALETTE[who], ...FACE };
		const out = new Map<string, string>();
		base.forEach((row, y) => [...row].forEach((ch, x) => ch !== '.' && out.set(`${x},${y}`, pal[ch])));
		const eyes = blink && face.eyes !== 'closed' && face.eyes !== 'wide' ? EYES.closed : EYES[face.eyes];
		const mouth = talking && flap && face.mouth !== 'open' ? MOUTHS.talk : MOUTHS[face.mouth];
		let extras = (face.extras ?? []).flatMap((x) => EXTRAS[x]);
		if (mood === 'gavel' && flap) extras = (face.extras ?? []).flatMap((x) => (x === 'gavel' ? EXTRAS.gavelUp : EXTRAS[x]));
		for (const [x, y, c] of [...BROWS[face.brows], ...eyes, ...mouth, ...extras] as Px[]) out.set(`${x},${y}`, pal[c] ?? c);
		return [...out].map(([k, fill]) => {
			const [x, y] = k.split(',').map(Number);
			return { x, y, fill };
		});
	});
</script>

<span class="portrait mood-{mood}" class:speaking class:flip={who === 'prosecution'} style:--px="{size / 16}px">
	<svg width={size} height={size} viewBox="0 0 16 16" shape-rendering="crispEdges" role="img" aria-label={who}>
		<g transform={who === 'prosecution' ? 'translate(16 0) scale(-1 1)' : undefined}>
			{#each pixels as p (`${p.x},${p.y}`)}
				<rect x={p.x} y={p.y} width="1" height="1" fill={p.fill} />
			{/each}
		</g>
	</svg>
	{#if face.emote}
		{#key mood}
			<span class="emote">{face.emote}</span>
		{/key}
	{/if}
</span>

<style>
	.portrait {
		position: relative;
		display: inline-block;
		line-height: 0;
		--dir: 1;
	}
	.portrait.flip {
		--dir: -1;
	}
	svg {
		display: block;
		/* Breathing: a one-pixel rise every couple of seconds. */
		animation: breathe 2400ms steps(1) infinite;
	}
	@keyframes breathe {
		50% {
			translate: 0 calc(var(--px) * -1);
		}
	}
	.speaking svg {
		animation: talk 600ms steps(2) infinite;
	}
	@keyframes talk {
		50% {
			translate: 0 calc(var(--px) * -1);
		}
	}

	.mood-shock svg {
		animation: shake 90ms steps(2) 6;
	}
	.mood-sweat svg {
		animation: tremble 160ms steps(2) infinite;
	}
	.mood-point svg,
	.mood-angry svg {
		animation: lunge 900ms cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	.mood-happy svg,
	.mood-nod svg {
		animation: hop 420ms steps(2) 2;
	}
	.mood-gavel svg {
		animation: thud 220ms steps(1) infinite;
	}
	@keyframes shake {
		50% {
			translate: calc(var(--px) * 2) 0;
		}
	}
	@keyframes tremble {
		50% {
			translate: calc(var(--px) * 0.5) 0;
		}
	}
	@keyframes lunge {
		0% {
			translate: 0 0;
		}
		18% {
			translate: calc(var(--px) * 3 * var(--dir)) 0;
		}
		100% {
			translate: calc(var(--px) * 1 * var(--dir)) 0;
		}
	}
	@keyframes hop {
		50% {
			translate: 0 calc(var(--px) * -2);
		}
	}
	@keyframes thud {
		50% {
			translate: 0 calc(var(--px) * 1);
		}
	}

	.emote {
		position: absolute;
		top: -6px;
		right: -6px;
		min-width: 16px;
		padding: 1px 4px;
		font-family: var(--font-ui);
		font-size: 10px;
		line-height: 1.2;
		text-align: center;
		color: var(--void);
		background: var(--cursor);
		border: 2px solid var(--void);
		animation: emote-pop 260ms cubic-bezier(0.2, 0.8, 0.2, 1.4);
	}
	.flip .emote {
		right: auto;
		left: -6px;
	}
	.mood-shock .emote,
	.mood-point .emote {
		background: var(--hp);
		color: var(--ink);
	}
	@keyframes emote-pop {
		from {
			scale: 0.2;
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		svg,
		.speaking svg,
		.mood-shock svg,
		.mood-sweat svg,
		.mood-point svg,
		.mood-angry svg,
		.mood-happy svg,
		.mood-nod svg,
		.mood-gavel svg,
		.emote {
			animation: none;
		}
	}
</style>
