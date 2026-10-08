<script lang="ts">
	// Shown on both screens once a burger is served: the verdict, the tip, ordered vs served.
	import { customer } from '../../../convex/burger/customers';
	import { Button } from '#lib/ui/index.ts';
	import { CoinsIcon, HourglassIcon } from '#lib/icons/index.ts';
	import { dishOf } from '../../../convex/burger/dishes';
	import Dish from './Dish.svelte';
	import Customer from './Customer.svelte';
	import Stars from './Stars.svelte';
	import { money, type Result } from './room';

	let {
		result,
		index,
		total,
		busy,
		onnext
	}: { result: Result; index: number; total: number; busy: boolean; onnext: () => void } = $props();

	const TITLE = {
		perfect: 'Perfect order!',
		close: 'Close enough',
		confused: 'Hmm…',
		angry: 'Uh oh.'
	} as const;
	const TONE = { perfect: 'green', close: 'blue', confused: 'purple', angry: 'red' } as const;

	const notes = $derived(
		[
			result.timedOut && 'Time ran out',
			result.wrongDish && 'Wrong dish!',
			!result.wrongDish && result.missing && `${result.missing} missing`,
			!result.wrongDish && result.extra && `${result.extra} extra`,
			result.wrongDoneness && `${result.wrongDoneness} cooked wrong`,
			!result.wrongDish && !result.missing && !result.extra && !result.wrongDoneness && result.stars < 5 && 'Wrong order'
		].filter(Boolean) as string[]
	);
</script>

<section class="reaction" style="--tone: var(--{TONE[result.tier]}); --tone-light: var(--{TONE[result.tier]}-light)">
	<p class="progress">Customer {index + 1} of {total}</p>

	<div class="hero">
		<div class="face"><Customer type={result.order.customer} mood={result.tier} /></div>
		<div class="quote">
			<span class="who">{result.order.name}</span>
			<p>“{result.reaction}”</p>
		</div>
	</div>

	<div class="verdict">
		<h2>{TITLE[result.tier]}</h2>
		<Stars stars={result.stars} size="2rem" pop />
		<span class="tip"><CoinsIcon weight="fill" size="1.2rem" /> {result.tip > 0 ? `+${money(result.tip)} tip` : 'No tip'}</span>
		{#if notes.length}
			<ul class="notes">
				{#each notes as note (note)}
					<li>
						{#if note === 'Time ran out'}<HourglassIcon weight="fill" size="0.9rem" />{/if}{note}
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<div class="compare">
		<figure>
			<figcaption>Ordered</figcaption>
			<Dish dish={dishOf(result.order)} layers={result.order.layers} sketch={customer(result.order.customer).pictureStyle === 'drawing' && result.order.picture} />
		</figure>
		<figure>
			<figcaption>Served</figcaption>
			<Dish dish={result.servedDish ?? dishOf(result.order)} layers={result.served} empty="Nothing!" />
		</figure>
	</div>

	<Button size="lg" full disabled={busy} onclick={onnext}>
		{index + 1 < total ? 'Next customer' : 'See the reviews'}
	</Button>
</section>

<style>
	.reaction {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
		animation: rise 0.4s var(--ease-out);
	}

	@keyframes rise {
		from {
			transform: translateY(16px);
			opacity: 0;
		}
	}

	.progress {
		margin: 0;
		font-size: 0.8rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--hare);
	}

	.hero {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.face {
		width: 8rem;
		flex-shrink: 0;
	}

	.quote {
		flex: 1;
		padding: 0.85rem 1rem;
		border-radius: var(--radius-lg);
		background: var(--tone-light);
		animation: pop 0.4s 0.15s var(--ease-spring) backwards;
	}

	@keyframes pop {
		from {
			transform: scale(0.6);
			opacity: 0;
		}
	}

	.who {
		font-size: 0.75rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--tone);
		filter: brightness(0.8);
	}

	.quote p {
		margin: 0.2rem 0 0;
		font-size: 1.2rem;
		font-weight: 900;
		line-height: 1.3;
	}

	.verdict {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		text-align: center;
	}

	.verdict h2 {
		font-size: 1.7rem;
		color: var(--tone);
	}

	.tip {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.3rem 0.8rem;
		border-radius: 0;
		background: var(--gold-light);
		color: var(--gold-shade);
		font-weight: 900;
	}

	.notes {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.35rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.notes li {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.2rem 0.6rem;
		border-radius: 0;
		background: var(--polar);
		color: var(--wolf);
		font-size: 0.8rem;
		font-weight: 800;
	}

	.compare {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
		align-items: end;
	}

	figure {
		margin: 0;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		gap: 0.5rem;
		height: 100%;
		padding: 0.75rem;
		border: var(--border) solid var(--swan);
		border-radius: var(--radius);
	}

	figcaption {
		order: 1;
		text-align: center;
		font-size: 0.75rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--wolf);
	}

	@media (prefers-reduced-motion: reduce) {
		.reaction,
		.quote {
			animation: none;
		}
	}
</style>
