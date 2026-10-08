<script lang="ts">
	// End of shift: one review card per customer, plus the totals.
	import { customer } from '../../../convex/burger/customers';
	import { Button } from '#lib/ui/index.ts';
	import { ArrowsLeftRightIcon, CoinsIcon, StarIcon } from '#lib/icons/index.ts';
	import { dishOf } from '../../../convex/burger/dishes';
	import Dish from './Dish.svelte';
	import Customer from './Customer.svelte';
	import Stars from './Stars.svelte';
	import { money, type Result, type RoomView } from './room';

	let {
		results,
		history,
		busy,
		onagain
	}: {
		results: Result[];
		history: RoomView['history'];
		busy: boolean;
		onagain: (swap: boolean) => void;
	} = $props();

	const tips = $derived(results.reduce((sum, r) => sum + r.tip, 0));
	const avg = $derived(results.reduce((sum, r) => sum + r.stars, 0) / Math.max(1, results.length));
	const headline = $derived(
		avg >= 4.5
			? 'Michelin is calling.'
			: avg >= 3.5
				? 'A solid shift!'
				: avg >= 2.5
					? 'Mixed reviews.'
					: avg >= 1.5
						? 'The health inspector would like a word.'
						: 'Maybe try a different career?'
	);
</script>

<section class="reviews">
	<header>
		<h1>Customer Reviews</h1>
		<p class="headline">{headline}</p>
		<div class="totals">
			<span class="total gold"><CoinsIcon weight="fill" size="1.3rem" /> {money(tips)} in tips</span>
			<span class="total"><StarIcon weight="fill" size="1.3rem" /> {avg.toFixed(1)} average</span>
		</div>
	</header>

	<ol class="cards">
		{#each results as r, i (i)}
			<li class="card" style="--delay: {i * 0.1}s">
				<div class="top">
					<span class="face"><Customer type={r.order.customer} mood={r.tier} /></span>
					<div class="meta">
						<strong>{r.order.name}</strong>
						<span class="kind">{customer(r.order.customer).label}</span>
						<Stars stars={r.stars} size="1.1rem" />
					</div>
					<span class="tip">{r.tip > 0 ? `+${money(r.tip)}` : '$0'}</span>
				</div>
				<blockquote>“{r.review}”</blockquote>
				<div class="compare">
					<figure>
						<Dish dish={dishOf(r.order)} layers={r.order.layers} />
						<figcaption>Ordered</figcaption>
					</figure>
					<figure>
						<Dish dish={r.servedDish ?? dishOf(r.order)} layers={r.served} empty="Nothing" />
						<figcaption>Served</figcaption>
					</figure>
				</div>
			</li>
		{/each}
	</ol>

	<div class="again">
		<Button size="lg" full disabled={busy} onclick={() => onagain(true)}>
			<ArrowsLeftRightIcon weight="bold" size="1.2rem" /> Swap roles &amp; play again
		</Button>
		<Button variant="outline" full disabled={busy} onclick={() => onagain(false)}>Same roles, new shift</Button>
	</div>

	{#if history.length > 1}
		<section class="history">
			<h3>Past shifts</h3>
			<ul>
				{#each history as h (h.shift)}
					<li>
						<strong>Shift {h.shift}</strong>
						<span class="h-text">{h.cashierName} at the till · {h.chefName} cooking</span>
						<span class="h-score">{h.stars.toFixed(1)}★ · {money(h.tips)}</span>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</section>

<style>
	.reviews {
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
	}

	header {
		text-align: center;
	}

	h1 {
		font-size: 1.9rem;
		color: var(--orange);
	}

	.headline {
		margin: 0.3rem 0 0.7rem;
		color: var(--wolf);
		font-weight: 800;
	}

	.totals {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.total {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.4rem 0.9rem;
		border-radius: 0;
		background: var(--polar);
		font-weight: 900;
	}

	.total.gold {
		background: var(--gold-light);
		color: var(--gold-shade);
	}

	.cards {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.card {
		padding: 0.9rem 1rem 1rem;
		border: var(--border) solid var(--swan);
		border-bottom-width: calc(var(--border) + var(--depth));
		border-radius: var(--radius-lg);
		animation: in 0.4s var(--delay) var(--ease-out) backwards;
	}

	@keyframes in {
		from {
			transform: translateY(14px);
			opacity: 0;
		}
	}

	.top {
		display: flex;
		align-items: center;
		gap: 0.7rem;
	}

	.face {
		width: 3.6rem;
		flex-shrink: 0;
	}

	.meta {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.meta strong {
		font-size: 1.05rem;
		font-weight: 900;
	}

	.kind {
		font-size: 0.72rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--hare);
	}

	.tip {
		font-weight: 900;
		color: var(--gold-shade);
	}

	blockquote {
		margin: 0.7rem 0;
		font-size: 1.05rem;
		font-weight: 800;
		font-style: italic;
		line-height: 1.4;
	}

	.compare {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.6rem;
		align-items: end;
	}

	figure {
		margin: 0;
		padding: 0.5rem 0.9rem 0.4rem;
		border-radius: var(--radius);
		background: var(--polar);
	}

	figcaption {
		margin-top: 0.3rem;
		text-align: center;
		font-size: 0.7rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--wolf);
	}

	.again {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.history h3 {
		font-size: 1.05rem;
		margin-bottom: 0.5rem;
	}

	.history ul {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.history li {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.55rem 0.8rem;
		border: var(--border) solid var(--swan);
		border-radius: var(--radius-sm);
		font-size: 0.88rem;
	}

	.h-text {
		flex: 1;
		min-width: 0;
		color: var(--wolf);
	}

	.h-score {
		font-weight: 900;
		white-space: nowrap;
	}

	@media (prefers-reduced-motion: reduce) {
		.card {
			animation: none;
		}
	}
</style>
