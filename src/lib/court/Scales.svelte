<!-- The court's running balance: who the rulings so far favour. Defense on the left, as on the bench. -->
<script lang="ts">
	import { untrack } from 'svelte';
	import type { CourtView } from './types';

	let { room }: { room: CourtView } = $props();

	const m = $derived(room.momentum);
	// A little "+12" pops up on the side that just gained.
	let pop = $state<{ side: 'defense' | 'prosecution'; n: number; key: number }>();
	let last: number | undefined;
	$effect(() => {
		const now = m;
		untrack(() => {
			if (last !== undefined && now !== last) {
				const diff = now - last;
				pop = { side: diff > 0 ? 'defense' : 'prosecution', n: Math.abs(diff), key: Date.now() };
				const key = pop.key;
				setTimeout(() => pop?.key === key && (pop = undefined), 1400);
			}
			last = now;
		});
	});

	const lean = $derived(m > 8 ? 'condong ke Penasihat Hukum' : m < -8 ? 'condong ke Jaksa' : 'seimbang');
</script>

<div class="scales" title="Timbangan sementara ({lean}), dari tanggapan majelis di berita acara. Putusan akhir tetap di tangan hakim.">
	<span class="end side-defense">PH</span>
	<div class="beam" role="meter" aria-valuemin={-100} aria-valuemax={100} aria-valuenow={m} aria-label="Timbangan majelis">
		<span class="mid"></span>
		{#if m > 0}
			<span class="fill def" style:width="{m / 2}%" style:right="50%"></span>
		{:else if m < 0}
			<span class="fill pros" style:width="{-m / 2}%" style:left="50%"></span>
		{/if}
		{#if pop}
			{#key pop.key}
				<span class="pop {pop.side}">+{pop.n}</span>
			{/key}
		{/if}
	</div>
	<span class="end side-prosecution">JPU</span>
</div>

<style>
	.scales {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 8px;
	}
	.end {
		font-family: var(--font-ui);
		font-size: 9px;
		letter-spacing: 0.1em;
	}
	.beam {
		position: relative;
		height: 6px;
		background: var(--void);
		border: 2px solid var(--rule-hi);
	}
	.mid {
		position: absolute;
		left: 50%;
		top: -3px;
		bottom: -3px;
		width: 2px;
		background: var(--luck);
	}
	.fill {
		position: absolute;
		top: 0;
		bottom: 0;
		transition: width 500ms cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	.def {
		background: var(--def);
	}
	.pros {
		background: var(--atk);
	}
	.pop {
		position: absolute;
		top: -18px;
		font-family: var(--font-ui);
		font-size: 12px;
		pointer-events: none;
		animation: rise 1300ms ease-out forwards;
	}
	.pop.defense {
		left: 18%;
		color: var(--def);
	}
	.pop.prosecution {
		right: 18%;
		color: var(--atk);
	}
	@keyframes rise {
		from {
			opacity: 0;
			translate: 0 8px;
		}
		20% {
			opacity: 1;
			translate: 0 0;
		}
		to {
			opacity: 0;
			translate: 0 -10px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.fill {
			transition: none;
		}
		.pop {
			animation-duration: 1ms;
		}
	}
</style>
