<script lang="ts">
	// The cashier's view: the customer at the counter and their order.
	import { customer } from '../../../convex/burger/customers';
	import { dish } from '../../../convex/burger/dishes';
	import type { Layer } from '../../../convex/burger/ingredients';
	import { ChatCircleDotsIcon, ChefHatIcon } from '#lib/icons/index.ts';
	import Customer from './Customer.svelte';
	import Dish from './Dish.svelte';

	let {
		order,
		urgent,
		chefName
	}: {
		order: {
			customer: string;
			name: string;
			dish: string;
			text: string;
			picture: boolean;
			layers: Layer[];
			/** Their change of mind, once they've had it. */
			followUp?: { text: string };
		};
		/** Running out of time: the customer gets fidgety. */
		urgent: boolean;
		chefName: string;
	} = $props();

	const type = $derived(customer(order.customer));
</script>

<section class="counter">
	<div class="who">
		<div class="face"><Customer type={order.customer} mood={urgent ? 'impatient' : 'waiting'} /></div>
		<div class="tag">
			<strong>{order.name}</strong>
			<span>{type.label}</span>
		</div>
	</div>

	<div class="bubble" aria-live="polite">
		<p>{order.text}</p>
		{#if order.picture}
			<figure class="picture" class:drawing={type.pictureStyle === 'drawing'}>
				<Dish dish={order.dish} layers={order.layers} sketch={type.pictureStyle === 'drawing'} />
				<figcaption>{type.pictureStyle === 'drawing' ? 'crayon on napkin' : 'reference photo'}</figcaption>
			</figure>
		{/if}
	</div>

	{#if order.followUp}
		<div class="bubble change" role="alert">
			<span class="change-tag"><ChatCircleDotsIcon weight="fill" size="1.1rem" /> Change of plan!</span>
			<p>{order.followUp.text}</p>
		</div>
	{/if}

	<p class="hint">
		<ChefHatIcon weight="fill" size="1.3rem" />
		{dish(order.dish).ordered
			? `Tell ${chefName} what to build, layer by layer.`
			: `Tell ${chefName} the dish first, then what goes on it.`} You can't see the kitchen.
	</p>
</section>

<style>
	.counter {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.who {
		display: flex;
		align-items: flex-end;
		gap: 0.75rem;
	}

	.face {
		width: 7.5rem;
		flex-shrink: 0;
	}

	.tag {
		display: flex;
		flex-direction: column;
		padding-bottom: 0.6rem;
	}

	.tag strong {
		font-size: 1.3rem;
		font-weight: 900;
	}

	.tag span {
		color: var(--wolf);
		font-size: 0.85rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.bubble {
		position: relative;
		padding: 1rem 1.15rem;
		border: var(--border) solid var(--swan);
		border-bottom-width: calc(var(--border) + var(--depth));
		border-radius: var(--radius-lg);
		background: var(--snow);
		animation: in 0.35s var(--ease-spring);
	}

	.bubble::before {
		content: '';
		position: absolute;
		top: -9px;
		left: 3rem;
		width: 14px;
		height: 14px;
		background: var(--snow);
		border-left: var(--border) solid var(--swan);
		border-top: var(--border) solid var(--swan);
		transform: rotate(45deg);
	}

	@keyframes in {
		from {
			transform: scale(0.85) translateY(8px);
			opacity: 0;
		}
	}

	.bubble p {
		margin: 0;
		font-size: 1.12rem;
		line-height: 1.55;
		font-weight: 700;
		overflow-wrap: anywhere;
	}

	.picture {
		margin: 0.85rem auto 0;
		max-width: 15rem;
		padding: 1rem 1rem 0.5rem;
		border-radius: var(--radius);
		background: var(--polar);
		transform: rotate(-1.5deg);
	}

	.picture.drawing {
		background: #fffdf2;
		box-shadow: inset 0 0 0 2px #f1e8c8;
		transform: rotate(2deg);
	}

	figcaption {
		margin-top: 0.4rem;
		text-align: center;
		font-size: 0.75rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--hare);
	}

	.bubble.change {
		border-color: var(--purple);
		background: var(--purple-light);
		animation: shake 0.5s var(--ease-spring);
	}

	.bubble.change::before {
		display: none;
	}

	.change-tag {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		margin-bottom: 0.3rem;
		color: var(--purple);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-size: 0.8rem;
	}

	@keyframes shake {
		0% {
			transform: scale(0.85);
			opacity: 0;
		}
		40% {
			transform: rotate(-2deg) scale(1.03);
		}
		70% {
			transform: rotate(1.5deg);
		}
	}

	.hint {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0;
		padding: 0.7rem 0.95rem;
		border-radius: var(--radius);
		background: var(--orange-light);
		color: var(--orange-shade);
		font-weight: 800;
		font-size: 0.9rem;
		line-height: 1.35;
	}
</style>
