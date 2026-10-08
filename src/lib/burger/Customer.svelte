<script lang="ts" module>
	import type { Tier } from '../../../convex/burger/customers';
	export type Mood = 'waiting' | 'impatient' | Tier;
</script>

<script lang="ts">
	// A customer's face, built from their look (convex/burger/customers.ts) and current mood.
	import { customer } from '../../../convex/burger/customers';

	let { type, mood = 'waiting' }: { type: string; mood?: Mood } = $props();

	const look = $derived(customer(type).look);
	const r = $derived(look.small ? 44 : 50);
	const cy = $derived(look.small ? 108 : 98);
	const eyeY = $derived(cy - 2);
	const browY = $derived(eyeY - 16);
	const mouthY = $derived(cy + r * 0.45);
	const top = $derived(cy - r);
</script>

<div class="customer {mood}">
	<svg viewBox="0 0 200 200" role="img" aria-label="{customer(type).label}, {mood}">
		<!-- Body -->
		<path d="M38,200 Q40,{cy + r + 8} 100,{cy + r + 6} Q160,{cy + r + 8} 162,200 Z" fill={look.shirt} />
		{#if look.accessory === 'tie'}
			<path d="M92,{cy + r + 4} L108,{cy + r + 4} L104,{cy + r + 12} L110,196 L100,200 L90,196 L96,{cy + r + 12} Z" fill="#ff4b4b" />
			<path d="M84,{cy + r + 4} L100,{cy + r + 18} L116,{cy + r + 4}" fill="none" stroke="#fff" stroke-width="5" />
		{/if}

		<!-- Hair behind the head -->
		{#if look.hairStyle === 'bun'}
			<circle cx="100" cy={top - 4} r="20" fill={look.hair} />
		{:else if look.hairStyle === 'long'}
			<path d="M{100 - r - 8},{cy} Q{100 - r - 10},{top - 12} 100,{top - 10} Q{100 + r + 10},{top - 12} {100 + r + 8},{cy} L{100 + r + 6},{cy + r + 12} L{100 - r - 6},{cy + r + 12} Z" fill={look.hair} />
		{/if}

		<!-- Head -->
		<circle cx={100 - r} cy={cy + 4} r="11" fill={look.skin} />
		<circle cx={100 + r} cy={cy + 4} r="11" fill={look.skin} />
		<circle cx="100" {cy} {r} fill={look.skin} />
		{#if mood === 'angry'}
			<circle cx="100" {cy} {r} fill="#ff4b4b" class="flush" />
		{/if}

		<!-- Hair -->
		{#if look.hairStyle === 'cap'}
			<path d="M{100 - r - 2},{cy - 8} Q100,{top - 26} {100 + r + 2},{cy - 8} Z" fill="#ff9600" />
			<path d="M{100 - 10},{cy - 10} Q{100 + r + 28},{cy - 20} {100 + r + 34},{cy - 4} L{100 + 8},{cy - 6} Z" fill="#cd7900" />
			<circle cx="100" cy={top - 4} r="5" fill="#cd7900" />
			<path d="M{100 - r + 2},{cy - 8} q-6,14 2,22" stroke={look.hair} stroke-width="7" fill="none" stroke-linecap="round" />
		{:else if look.hairStyle === 'bun'}
			<path d="M{100 - r},{cy - 2} Q{100 - r},{top - 6} 100,{top - 6} Q{100 + r},{top - 6} {100 + r},{cy - 2} Q{100 + r - 10},{top + 16} 100,{top + 14} Q{100 - r + 10},{top + 16} {100 - r},{cy - 2} Z" fill={look.hair} />
		{:else if look.hairStyle === 'slick'}
			<path d="M{100 - r - 1},{cy - 4} Q{100 - r},{top - 8} 100,{top - 6} Q{100 + r + 6},{top - 4} {100 + r + 1},{cy - 6} Q{100 + 20},{top + 4} {100 - 14},{top + 14} Q{100 - r + 6},{top + 18} {100 - r - 1},{cy - 4} Z" fill={look.hair} />
			<path d="M{100 - 14},{top + 2} Q100,{top - 2} {100 + 24},{top + 2}" stroke="#fff" stroke-opacity="0.3" stroke-width="3" fill="none" />
		{:else if look.hairStyle === 'buzz'}
			<path d="M{100 - r + 2},{cy - 12} Q100,{top - 10} {100 + r - 2},{cy - 12} Q100,{top + 6} {100 - r + 2},{cy - 12} Z" fill={look.hair} />
		{:else if look.hairStyle === 'long'}
			<path d="M{100 - r},{cy - 4} Q{100 - r},{top - 6} 100,{top - 6} Q{100 + r},{top - 6} {100 + r},{cy - 4} Q{100 + 24},{top + 8} {100 - 6},{top + 20} Q{100 - r + 6},{top + 14} {100 - r},{cy - 4} Z" fill={look.hair} />
		{:else if look.hairStyle === 'messy'}
			<path d="M{100 - r - 2},{cy - 2} L{100 - r + 2},{top - 2} L{100 - 28},{top - 16} L{100 - 14},{top - 4} L{100 - 2},{top - 20} L{100 + 10},{top - 4} L{100 + 26},{top - 16} L{100 + r - 4},{top} L{100 + r + 2},{cy - 4} Q100,{top + 10} {100 - r - 2},{cy - 2} Z" fill={look.hair} />
		{:else if look.hairStyle === 'sunhat'}
			<path d="M{100 - r + 4},{cy - 10} Q{100 - r + 4},{top - 20} 100,{top - 20} Q{100 + r - 4},{top - 20} {100 + r - 4},{cy - 10} Z" fill="#f2d48a" />
			<ellipse cx="100" cy={cy - 10} rx={r + 30} ry="10" fill="#e8c26a" />
			<rect x={100 - r + 4} y={cy - 22} width={r * 2 - 8} height="7" fill="#ff6fae" />
		{:else if look.hairStyle === 'helmet'}
			<path d="M{100 - r - 4},{cy - 2} Q{100 - r - 4},{top - 14} 100,{top - 14} Q{100 + r + 4},{top - 14} {100 + r + 4},{cy - 2} Z" fill="#00aa13" />
			<path d="M{100 - r - 4},{cy - 2} L{100 + r + 4},{cy - 2}" stroke="#007a0e" stroke-width="5" />
			<path d="M{100 - 24},{top - 6} Q100,{top - 14} {100 + 24},{top - 6}" stroke="#fff" stroke-opacity="0.5" stroke-width="4" fill="none" />
			<path d="M{100 - r + 2},{cy} q4,{r * 0.6} 18,{r * 0.8}" stroke="#2b2b2b" stroke-width="3" fill="none" />
		{:else if look.hairStyle === 'beret'}
			<path d="M{100 - r},{cy - 6} Q{100 - r - 4},{top - 22} {100 + 12},{top - 18} Q{100 + r + 18},{top - 14} {100 + r + 6},{cy - 12} Q100,{top + 8} {100 - r},{cy - 6} Z" fill="#7b3fa0" />
			<path d="M{100 + 8},{top - 18} l4,-10" stroke="#7b3fa0" stroke-width="5" stroke-linecap="round" />
			<path d="M{100 - r + 1},{cy - 6} q2,12 6,18" stroke={look.hair} stroke-width="6" fill="none" stroke-linecap="round" />
		{/if}
		{#if look.accessory === 'headband'}
			<rect x={100 - r + 1} y={top + 16} width={r * 2 - 2} height="10" rx="4" fill="#fff" />
			<rect x={100 - r + 1} y={top + 19} width={r * 2 - 2} height="4" fill="#ff4b4b" />
		{/if}

		<!-- Brows -->
		<g stroke="#4b3a30" stroke-width="4" stroke-linecap="round" fill="none">
			{#if mood === 'angry'}
				<path d="M68,{browY - 4} L90,{browY + 4}" /><path d="M132,{browY - 4} L110,{browY + 4}" />
			{:else if mood === 'confused'}
				<path d="M68,{browY + 2} Q78,{browY - 4} 90,{browY}" /><path d="M110,{browY - 8} Q122,{browY - 14} 132,{browY - 8}" />
			{:else if mood === 'impatient'}
				<path d="M68,{browY + 2} L90,{browY + 2}" /><path d="M110,{browY + 2} L132,{browY + 2}" />
			{:else if mood !== 'perfect'}
				<path d="M68,{browY} Q79,{browY - 5} 90,{browY}" /><path d="M110,{browY} Q121,{browY - 5} 132,{browY}" />
			{/if}
		</g>

		<!-- Eyes -->
		<g fill="#3a2a22" stroke="#3a2a22" stroke-linecap="round">
			{#if mood === 'perfect'}
				<path d="M70,{eyeY + 2} Q79,{eyeY - 8} 88,{eyeY + 2}" fill="none" stroke-width="4.5" />
				<path d="M112,{eyeY + 2} Q121,{eyeY - 8} 130,{eyeY + 2}" fill="none" stroke-width="4.5" />
			{:else if mood === 'impatient'}
				<path d="M70,{eyeY} L88,{eyeY}" stroke-width="4.5" /><path d="M112,{eyeY} L130,{eyeY}" stroke-width="4.5" />
				<circle cx="84" cy={eyeY + 3} r="3" stroke="none" /><circle cx="126" cy={eyeY + 3} r="3" stroke="none" />
			{:else if mood === 'confused'}
				<circle cx="79" cy={eyeY} r="5" stroke="none" />
				<circle cx="121" cy={eyeY} r="8" fill="#fff" stroke-width="2.5" /><circle cx="121" cy={eyeY} r="3.5" stroke="none" />
			{:else}
				<circle cx="79" cy={eyeY} r="5.5" stroke="none" class="blink" />
				<circle cx="121" cy={eyeY} r="5.5" stroke="none" class="blink" />
			{/if}
		</g>

		{#if look.accessory === 'glasses'}
			<g fill="none" stroke="#8a6d5a" stroke-width="3">
				<circle cx="79" cy={eyeY} r="13" /><circle cx="121" cy={eyeY} r="13" /><path d="M92,{eyeY} L108,{eyeY}" />
			</g>
		{:else if look.accessory === 'monocle'}
			<circle cx="121" cy={eyeY} r="13" fill="#fff" fill-opacity="0.25" stroke="#c99a2e" stroke-width="3" />
			<path d="M133,{eyeY + 5} Q140,{cy + 30} 128,{cy + r}" fill="none" stroke="#c99a2e" stroke-width="1.5" />
		{:else if look.accessory === 'sunglasses'}
			<g fill="#1d1d24">
				<rect x="64" y={eyeY - 9} width="30" height="16" rx="5" /><rect x="106" y={eyeY - 9} width="30" height="16" rx="5" />
				<path d="M94,{eyeY - 4} L106,{eyeY - 4}" stroke="#1d1d24" stroke-width="3" />
				<path d="M70,{eyeY - 5} l8,0" stroke="#fff" stroke-opacity="0.5" stroke-width="2" />
			</g>
		{:else if look.accessory === 'earpiece'}
			<circle cx={100 + r + 2} cy={cy + 4} r="4" fill="#1d1d24" />
			<path d="M{100 + r + 2},{cy + 8} q8,14 -4,26 q-8,8 -2,18" stroke="#c9d1d9" stroke-width="1.6" fill="none" />
		{:else if look.accessory === 'freckles'}
			<g fill="#d98b5f">
				{#each [[64, 8], [70, 13], [60, 14], [136, 8], [130, 13], [140, 14]] as [x, dy] (`${x}${dy}`)}
					<circle cx={x} cy={eyeY + dy + 4} r="1.8" />
				{/each}
			</g>
		{/if}

		<!-- Cheeks -->
		{#if mood === 'perfect' || mood === 'close' || look.small}
			<ellipse cx="64" cy={eyeY + 18} rx="9" ry="5" fill="#ff8fa3" opacity="0.5" />
			<ellipse cx="136" cy={eyeY + 18} rx="9" ry="5" fill="#ff8fa3" opacity="0.5" />
		{/if}

		<!-- Mouth -->
		<g stroke="#3a2a22" stroke-width="4.5" stroke-linecap="round" fill="none">
			{#if mood === 'perfect'}
				<path d="M78,{mouthY - 4} Q100,{mouthY - 4} 122,{mouthY - 4} Q120,{mouthY + 18} 100,{mouthY + 18} Q80,{mouthY + 18} 78,{mouthY - 4} Z" fill="#8a2a2a" />
				<path d="M88,{mouthY + 12} Q100,{mouthY + 6} 112,{mouthY + 12}" stroke="#ff7b8a" stroke-width="5" />
			{:else if mood === 'close'}
				<path d="M82,{mouthY} Q100,{mouthY + 14} 118,{mouthY}" />
			{:else if mood === 'confused'}
				<path d="M82,{mouthY + 4} q6,-6 12,0 t12,0 t12,0" />
			{:else if mood === 'angry'}
				<path d="M80,{mouthY + 10} Q100,{mouthY - 6} 120,{mouthY + 10}" />
			{:else if mood === 'impatient'}
				<path d="M86,{mouthY + 4} L114,{mouthY + 2}" />
			{:else}
				<path d="M86,{mouthY} Q100,{mouthY + 9} 114,{mouthY}" />
			{/if}
		</g>

		{#if look.accessory === 'phone'}
			<rect x="134" y={cy + r - 6} width="20" height="32" rx="3" fill="#1d1d24" transform="rotate(12 144 {cy + r + 10})" />
			<rect x="137" y={cy + r - 2} width="14" height="22" rx="1" fill="#86bcff" transform="rotate(12 144 {cy + r + 10})" />
			<circle cx="140" cy={cy + r + 22} r="7" fill={look.skin} />
		{/if}

		<!-- Mood extras -->
		{#if mood === 'impatient'}
			<path d="M{100 + r - 6},{top + 12} q6,10 0,14 q-6,-4 0,-14 Z" fill="#7fd3ff" class="sweat" />
		{/if}
	</svg>

	{#if mood === 'perfect'}
		<span class="float heart one" aria-hidden="true">♥</span>
		<span class="float heart two" aria-hidden="true">♥</span>
		<span class="float heart three" aria-hidden="true">♥</span>
	{:else if mood === 'confused'}
		<span class="float mark" aria-hidden="true">?</span>
	{:else if mood === 'angry'}
		<span class="float steam one" aria-hidden="true"></span>
		<span class="float steam two" aria-hidden="true"></span>
	{/if}
</div>

<style>
	.customer {
		position: relative;
		width: 100%;
		aspect-ratio: 1;
	}

	svg {
		display: block;
		width: 100%;
		height: 100%;
		overflow: visible;
		transform-origin: 50% 90%;
	}

	.waiting svg {
		animation: bob 2.4s ease-in-out infinite;
	}

	.impatient svg {
		animation: tap 0.5s ease-in-out infinite;
	}

	.perfect svg {
		animation: hop 0.6s var(--ease-spring) 2;
	}

	.close svg {
		animation: nod 0.8s ease-in-out 2;
	}

	.confused svg {
		animation: tilt 0.9s var(--ease-out) forwards;
	}

	.angry svg {
		animation: shake 0.5s ease-in-out 2;
	}

	.flush {
		opacity: 0.25;
	}

	.blink {
		transform-box: fill-box;
		transform-origin: center;
		animation: blink 4s infinite;
	}

	.sweat {
		animation: drip 1.2s ease-in infinite;
	}

	@keyframes bob {
		50% {
			transform: translateY(-3%);
		}
	}

	@keyframes tap {
		50% {
			transform: rotate(-2deg);
		}
	}

	@keyframes hop {
		40% {
			transform: translateY(-10%) scale(1.04);
		}
	}

	@keyframes nod {
		50% {
			transform: rotate(4deg);
		}
	}

	@keyframes tilt {
		to {
			transform: rotate(-9deg);
		}
	}

	@keyframes shake {
		20%,
		60% {
			transform: translateX(-4%) rotate(-3deg);
		}
		40%,
		80% {
			transform: translateX(4%) rotate(3deg);
		}
	}

	@keyframes blink {
		0%,
		94%,
		100% {
			transform: scaleY(1);
		}
		97% {
			transform: scaleY(0.1);
		}
	}

	@keyframes drip {
		to {
			transform: translateY(14px);
			opacity: 0;
		}
	}

	.float {
		position: absolute;
		pointer-events: none;
		font-weight: 900;
	}

	.heart {
		color: var(--red);
		font-size: 1.6rem;
		animation: rise 1.6s var(--ease-out) infinite;
	}

	.heart.one {
		left: 8%;
		top: 20%;
	}

	.heart.two {
		right: 6%;
		top: 10%;
		animation-delay: 0.4s;
		font-size: 1.2rem;
	}

	.heart.three {
		right: 18%;
		top: 30%;
		animation-delay: 0.8s;
	}

	.mark {
		right: 6%;
		top: 0;
		font-size: 2.6rem;
		color: var(--purple);
		animation: pop 0.5s var(--ease-spring);
	}

	.steam {
		top: 4%;
		width: 18%;
		aspect-ratio: 1;
		border-radius: 0;
		background: var(--swan);
		animation: puff 0.9s ease-out infinite;
	}

	.steam.one {
		left: 10%;
	}

	.steam.two {
		right: 10%;
		animation-delay: 0.45s;
	}

	@keyframes rise {
		from {
			transform: translateY(20px) scale(0.6);
			opacity: 0;
		}
		30% {
			opacity: 1;
		}
		to {
			transform: translateY(-30px) scale(1);
			opacity: 0;
		}
	}

	@keyframes pop {
		from {
			transform: scale(0.2);
		}
	}

	@keyframes puff {
		from {
			transform: translateY(10px) scale(0.4);
			opacity: 0.9;
		}
		to {
			transform: translateY(-24px) scale(1.2);
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		svg,
		.float,
		.blink,
		.sweat {
			animation: none !important;
		}
	}
</style>
