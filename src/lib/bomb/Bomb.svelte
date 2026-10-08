<script lang="ts" module>
	export type BombActions = {
		cutWire: (module: number, wire: number) => void;
		pressButton: (module: number) => void;
		releaseButton: (module: number) => void;
		pressKey: (module: number, key: number) => void;
		pressSimon: (module: number, color: string) => void;
	};
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { formatTimer, MAX_STRIKES, type VisibleModule } from '../../../convex/bomb';
	import { sfx } from '#lib/sound.svelte.ts';
	import { CheckIcon, XIcon } from '#lib/icons/index.ts';
	import BigButton from './BigButton.svelte';
	import Keypad from './Keypad.svelte';
	import Simon from './Simon.svelte';
	import Wires from './Wires.svelte';

	let {
		bomb,
		msLeft,
		strikes,
		lastStrike,
		disabled = false,
		actions
	}: {
		bomb: {
			serial: string;
			batteries: number;
			indicators: { label: string; lit: boolean }[];
			modules: VisibleModule[];
		};
		msLeft: number;
		strikes: number;
		lastStrike?: { module: number; at: number };
		disabled?: boolean;
		actions: BombActions;
	} = $props();

	const timer = $derived(formatTimer(msLeft));
	const urgent = $derived(msLeft <= 30_000);

	// Tick every time the display changes; beep instead in the last ten seconds.
	let lastTimer = '';
	$effect(() => {
		if (disabled || timer === lastTimer) return;
		if (lastTimer) sfx.tick(msLeft <= 10_000);
		lastTimer = timer;
	});

	// A strike buzzes, shakes the casing and flashes the module that caused it.
	let shaking = $state(false);
	let seenStrike = untrack(() => lastStrike?.at);
	$effect(() => {
		if (!lastStrike || lastStrike.at === seenStrike) return;
		seenStrike = lastStrike.at;
		sfx.strike();
		navigator.vibrate?.(300);
		// Off then on again next frame, so back-to-back strikes replay the animation.
		shaking = false;
		requestAnimationFrame(() => (shaking = true));
	});

	let solvedCount = untrack(() => bomb.modules.filter((m) => m.solved).length);
	$effect(() => {
		const count = bomb.modules.filter((m) => m.solved).length;
		if (count > solvedCount) sfx.disarm();
		solvedCount = count;
	});

	const NAMES = { wires: 'Wires', button: 'Button', keypad: 'Keypad', simon: 'Simon' };
</script>

<div
	class="casing"
	class:shake={shaking}
	onanimationend={(e) => {
		if (e.target === e.currentTarget) shaking = false;
	}}
>
	<header class="edge">
		<div class="clock" class:urgent>
			<span class="digits" aria-label="Time left {timer}">{timer}</span>
			<span class="strikes" aria-label="{strikes} of {MAX_STRIKES} strikes">
				{#each { length: MAX_STRIKES - 1 } as _, i (i)}
					<span class="strike" class:on={i < strikes}><XIcon weight="bold" size="0.9rem" /></span>
				{/each}
			</span>
		</div>

		<div class="plates">
			<div class="plate serial">
				<small>Serial</small>
				<strong>{bomb.serial}</strong>
			</div>
			<div class="plate">
				<small>Batteries</small>
				<span class="batteries">
					{#each { length: bomb.batteries } as _, i (i)}<span class="battery"></span>{/each}
					{#if bomb.batteries === 0}<strong>none</strong>{/if}
				</span>
			</div>
			{#each bomb.indicators as ind (ind.label)}
				<div class="plate indicator">
					<span class="lamp" class:lit={ind.lit}></span>
					<strong>{ind.label}</strong>
				</div>
			{/each}
		</div>
	</header>

	<div class="modules">
		{#each bomb.modules as m, i (i)}
			{@const flash = shaking && lastStrike?.module === i}
			<section class="module" class:solved={m.solved} class:flash aria-label="{NAMES[m.type]} module">
				<span class="status" aria-label={m.solved ? 'Disarmed' : 'Armed'}>
					{#if m.solved}<CheckIcon weight="bold" size="0.8rem" />{/if}
				</span>
				{#if m.type === 'wires'}
					<Wires
						wires={m.wires}
						cut={m.cut}
						disabled={disabled || m.solved}
						oncut={(w) => actions.cutWire(i, w)}
					/>
				{:else if m.type === 'button'}
					<BigButton
						color={m.color}
						label={m.label}
						strip={m.strip}
						disabled={disabled || m.solved}
						onpress={() => actions.pressButton(i)}
						onrelease={() => actions.releaseButton(i)}
					/>
				{:else if m.type === 'keypad'}
					<Keypad
						symbols={m.symbols}
						pressed={m.pressed}
						disabled={disabled || m.solved}
						onpress={(k) => actions.pressKey(i, k)}
					/>
				{:else if m.type === 'simon'}
					<Simon
						sequence={m.sequence}
						solved={m.solved}
						disabled={disabled || m.solved}
						onpress={(c) => actions.pressSimon(i, c)}
					/>
				{/if}
			</section>
		{/each}
	</div>
</div>

<style>
	.casing {
		padding: 0.9rem;
		border-radius: var(--radius-lg);
		background: #223133;
		box-shadow:
			inset 0 0 0 3px #344749,
			0 0 0 2px var(--gap),
			0 0 0 4px var(--vine),
			0 8px 0 4px #121b1c;
	}

	.shake {
		animation: shake 0.45s ease;
	}

	@keyframes shake {
		20% {
			transform: translateX(-10px) rotate(-1deg);
		}
		40% {
			transform: translateX(9px) rotate(1deg);
		}
		60% {
			transform: translateX(-6px);
		}
		80% {
			transform: translateX(3px);
		}
	}

	.edge {
		display: flex;
		flex-wrap: wrap;
		gap: 0.7rem;
		align-items: stretch;
		margin-bottom: 0.9rem;
	}

	.clock {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		padding: 0.35rem 0.9rem;
		border-radius: var(--radius-sm);
		background: #050808;
		box-shadow: inset 0 0 0 3px #1a2526;
	}

	.digits {
		font-family: var(--font);
		font-size: 2.6rem;
		line-height: 1;
		letter-spacing: 0.04em;
		color: var(--red);
		text-shadow: 0 0 12px color-mix(in srgb, var(--red) 60%, transparent);
		font-variant-numeric: tabular-nums;
	}

	.urgent .digits {
		animation: blink 1s steps(2) infinite;
	}

	@keyframes blink {
		50% {
			opacity: 0.55;
		}
	}

	.strikes {
		display: flex;
		gap: 0.3rem;
	}

	.strike {
		width: 1.45rem;
		height: 1.45rem;
		display: grid;
		place-items: center;
		border-radius: 0;
		background: #1a2526;
		color: #3a4d50;
	}

	.strike.on {
		background: var(--red);
		color: var(--snow);
		box-shadow: 0 0 10px var(--red);
	}

	.plates {
		flex: 1;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: stretch;
	}

	.plate {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.1rem;
		padding: 0.3rem 0.7rem;
		border-radius: var(--radius-sm);
		background: #e9e4d4;
		color: #3a3326;
		box-shadow: inset 0 -3px 0 #c9c2ab;
	}

	.plate small {
		font-size: 0.62rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		opacity: 0.6;
	}

	.plate strong {
		font-weight: 900;
		font-size: 1rem;
	}

	.serial strong {
		font-family: var(--font);
		letter-spacing: 0.12em;
		font-size: 1.1rem;
	}

	.batteries {
		display: flex;
		gap: 0.25rem;
		min-height: 1.2rem;
		align-items: center;
	}

	.battery {
		width: 0.7rem;
		height: 1.2rem;
		border-radius: 0;
		background: linear-gradient(var(--gold) 0 22%, #3a3326 22% 100%);
		position: relative;
	}

	.indicator {
		flex-direction: row;
		align-items: center;
		gap: 0.45rem;
		background: #0f1718;
		color: var(--snow);
		box-shadow: inset 0 -3px 0 #000;
	}

	.lamp {
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 0;
		background: #3a4d50;
	}

	.lamp.lit {
		background: var(--gold);
		box-shadow: 0 0 10px var(--gold);
	}

	.modules {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
		gap: 0.7rem;
	}

	.module {
		position: relative;
		display: grid;
		align-content: center;
		min-height: 13rem;
		padding: 1.3rem 1rem 1rem;
		border-radius: var(--radius);
		background: #3a4d50;
		box-shadow:
			inset 0 0 0 3px #4b6164,
			inset 0 -5px 0 #3a4d50;
	}

	.module.flash {
		animation: flash 0.6s ease;
	}

	@keyframes flash {
		30% {
			background: var(--red-shade);
		}
	}

	.status {
		position: absolute;
		top: 0.6rem;
		right: 0.6rem;
		width: 1.1rem;
		height: 1.1rem;
		display: grid;
		place-items: center;
		border-radius: 0;
		background: #121b1c;
		color: var(--snow);
	}

	.solved .status {
		background: var(--green);
		box-shadow: 0 0 12px var(--green);
	}

	.solved {
		background: #2f555a;
	}
</style>
