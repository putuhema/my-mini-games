<script lang="ts" module>
	export type KitchenActions = {
		pickDish: (dish: string) => void;
		add: (ing: string) => void;
		grill: (ing: string) => void;
		takeOff: (slot: number) => void;
		bin: (slot: number) => void;
		undo: () => void;
		clear: () => void;
		serve: () => void;
	};
</script>

<script lang="ts">
	// The chef's view: pick the dish, then the plate, the cooker and the ingredient rail.
	// No order in sight — the chef has to ask what the customer wants, starting with the dish.
	import { dish as dishInfo, DISH_IDS } from '../../../convex/burger/dishes';
	import { donenessAfter, ingredient, MAX_STACK, type Layer } from '../../../convex/burger/ingredients';
	import { customer } from '../../../convex/burger/customers';
	import {
		ArrowUUpLeftIcon,
		BellSimpleRingingIcon,
		CashRegisterIcon,
		CookingPotIcon,
		FireIcon,
		TrashIcon,
		XIcon
	} from '#lib/icons/index.ts';
	import Customer from './Customer.svelte';
	import Dish from './Dish.svelte';
	import ItemIcon from './ItemIcon.svelte';

	let {
		dish,
		stack,
		grill,
		serverNow,
		disabled,
		urgent,
		guest,
		cashierName,
		actions
	}: {
		/** What the chef is making; unset until they pick. */
		dish: string | undefined;
		stack: Layer[];
		grill: ({ ing: string; placedAt: number } | null)[];
		serverNow: number;
		/** The customer is still walking in. */
		disabled: boolean;
		urgent: boolean;
		guest: { customer: string; name: string };
		cashierName: string;
		actions: KitchenActions;
	} = $props();

	const d = $derived(dish ? dishInfo(dish) : undefined);
	const cookables = $derived(d ? d.ingredients.filter((id) => ingredient(id).cook) : []);
	const rail = $derived(d ? d.ingredients.filter((id) => !ingredient(id).cook) : []);
	const full = $derived(stack.length >= MAX_STACK);
	const cookerFull = $derived(grill.length > 0 && grill.every(Boolean));
	const pot = $derived(d?.cooker.kind === 'pot');

	/** A picture for each dish on the picker. */
	const DISH_ICON: Record<string, Layer> = {
		burger: { ing: 'bun_top' },
		sate: { ing: 'sate', state: 'cooked' },
		noodle: { ing: 'noodles', state: 'cooked' }
	};

	function slotInfo(item: { ing: string; placedAt: number }) {
		const elapsed = Math.max(0, serverNow - item.placedAt);
		const cook = ingredient(item.ing).cook!;
		const state = donenessAfter(item.ing, elapsed);
		return { state, label: cook.labels[state], progress: Math.min(1, elapsed / cook.burnMs), cookAt: cook.cookMs / cook.burnMs };
	}

	function pick(id: string) {
		if (id === dish) return;
		if (stack.length && !confirm(`Start over with ${dishInfo(id).label}? The plate gets cleared.`)) return;
		actions.pickDish(id);
	}
</script>

<section class="kitchen" class:disabled>
	<div class="ticket">
		<span class="mini-face"><Customer type={guest.customer} mood={urgent ? 'impatient' : 'waiting'} /></span>
		<p>
			<strong>{guest.name}</strong> ({customer(guest.customer).label.toLowerCase()}) is at the counter.
			<span class="ask"><CashRegisterIcon weight="fill" size="1rem" /> Ask {cashierName}!</span>
		</p>
	</div>

	<div class="menu" class:choosing={!d} role="radiogroup" aria-label="What are you making?">
		{#each DISH_IDS as id (id)}
			<button
				class="dish-tab"
				class:on={dish === id}
				role="radio"
				aria-checked={dish === id}
				onclick={() => pick(id)}
				{disabled}
			>
				<span class="dish-pic"><ItemIcon layer={DISH_ICON[id]} /></span>
				<span>{dishInfo(id).label}</span>
			</button>
		{/each}
	</div>

	{#if !d}
		<p class="pick-hint">What did they order? Ask {cashierName}, then pick a station.</p>
	{:else}
		<div class="pass">
			<div class="plate" class:wide={dish !== 'burger'}>
				<Dish {dish} layers={stack} animate empty={dish === 'burger' ? 'Tap ingredients to build' : ''} />
			</div>
			<span class="count">{stack.length}/{MAX_STACK}</span>
		</div>

		<div class="grill-row">
			<div class="grill" class:pot class:four={grill.length > 2} aria-label={pot ? 'Pot' : 'Grill'}>
				{#each grill as item, slot (slot)}
					{#if item}
						{@const info = slotInfo(item)}
						<div class="slot {info.state}">
							<button
								class="patty"
								onclick={() => actions.takeOff(slot)}
								aria-label="Add the {ingredient(item.ing).label.toLowerCase()} ({info.label})"
								{disabled}
							>
								<span class="sizzle" aria-hidden="true"></span>
								<span class="cooking"><ItemIcon layer={{ ing: item.ing, state: info.state }} /></span>
								<span class="state">{info.label}</span>
							</button>
							<div class="meter" aria-hidden="true">
								<span class="fill" style="width: {info.progress * 100}%"></span>
								<span class="mark" style="left: {info.cookAt * 100}%"></span>
							</div>
							<button class="bin" onclick={() => actions.bin(slot)} aria-label="Throw it away" {disabled}>
								<XIcon weight="bold" size="0.9rem" />
							</button>
						</div>
					{:else}
						<div class="slot empty">
							{#if pot}<CookingPotIcon weight="fill" size="1.4rem" />{:else}<FireIcon weight="fill" size="1.4rem" />{/if}
						</div>
					{/if}
				{/each}
			</div>
			<div class="trays">
				{#each cookables as id (id)}
					<button class="tile tray" onclick={() => actions.grill(id)} disabled={disabled || cookerFull}>
						<span class="pic"><ItemIcon layer={{ ing: id, state: 'raw' }} /></span>
						<span class="name">{ingredient(id).label.replace(' patty', '')}</span>
					</button>
				{/each}
			</div>
		</div>
		<p class="grill-hint">
			{pot
				? 'Noodles go in the pot. Tap them when ready — too long and they go soggy!'
				: `${cookables.length > 1 ? 'Patties' : 'Skewers'} go on the grill. Tap one to add it — don't let it burn!`}
		</p>

		<div class="rail">
			{#each rail as id (id)}
				<button class="tile" onclick={() => actions.add(id)} disabled={disabled || full}>
					<span class="pic"><ItemIcon layer={{ ing: id }} /></span>
					<span class="name">{ingredient(id).label}</span>
				</button>
			{/each}
		</div>
	{/if}

	<div class="actions">
		<button class="act" onclick={actions.undo} disabled={disabled || !stack.length} aria-label="Remove the last thing added">
			<ArrowUUpLeftIcon weight="bold" size="1.3rem" /><span>Undo</span>
		</button>
		<button class="act" onclick={actions.clear} disabled={disabled || !stack.length} aria-label="Clear the plate">
			<TrashIcon weight="fill" size="1.3rem" /><span>Clear</span>
		</button>
		<button class="serve" onclick={actions.serve} disabled={disabled || !stack.length}>
			<BellSimpleRingingIcon weight="fill" size="1.4rem" /> Serve
		</button>
	</div>
</section>

<style>
	.kitchen {
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
		padding-bottom: 5.5rem; /* room for the action bar */
	}

	.ticket {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.4rem 0.8rem 0.4rem 0.4rem;
		border-radius: var(--radius);
		background: var(--polar);
	}

	.mini-face {
		width: 3rem;
		flex-shrink: 0;
	}

	.ticket p {
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.35;
		color: var(--wolf);
	}

	.ticket strong {
		color: var(--eel);
	}

	.ask {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		color: var(--gold-shade);
		font-weight: 900;
	}

	.pass {
		position: relative;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		min-height: clamp(170px, 28dvh, 260px);
		padding: 0.5rem 0 0.25rem;
		border-radius: var(--radius-lg);
		background:
			repeating-linear-gradient(90deg, transparent 0 38px, rgb(0 0 0 / 0.025) 38px 40px),
			var(--blue-light);
	}

	.plate {
		width: min(15rem, 70%);
	}

	.count {
		position: absolute;
		top: 0.5rem;
		right: 0.7rem;
		font-size: 0.75rem;
		font-weight: 900;
		color: var(--blue-shade);
		opacity: 0.6;
	}

	.grill-row {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.5rem;
	}

	.grill {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.4rem;
		padding: 0.4rem;
		border-radius: var(--radius);
		background: repeating-linear-gradient(90deg, #223133 0 10px, #162123 10px 13px);
	}

	.slot {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		min-height: 5.2rem;
		padding: 0.3rem;
		border-radius: var(--radius-sm);
		background: rgb(255 255 255 / 0.06);
	}

	.slot.empty {
		align-items: center;
		justify-content: center;
		color: rgb(255 150 0 / 0.35);
	}

	.patty {
		position: relative;
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.2rem;
		padding: 0.2rem 0.3rem;
		border: none;
		border-radius: var(--radius-sm);
		background: none;
		cursor: pointer;
		touch-action: manipulation;
	}

	.patty :global(svg) {
		width: 85%;
		animation: jiggle 0.35s ease-in-out infinite alternate;
	}

	@keyframes jiggle {
		to {
			transform: translateY(-1.5px);
		}
	}

	.sizzle {
		position: absolute;
		inset: 0;
		background: radial-gradient(circle at 50% 70%, rgb(255 150 0 / 0.35), transparent 60%);
		animation: glow 0.8s ease-in-out infinite alternate;
	}

	@keyframes glow {
		to {
			opacity: 0.4;
		}
	}

	.state {
		position: relative;
		font-size: 0.75rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--snow);
	}

	.cooked .state {
		color: var(--green-light);
	}

	.cooked .patty {
		box-shadow: inset 0 0 0 3px var(--green);
		animation: ready 0.9s ease-in-out infinite;
	}

	@keyframes ready {
		50% {
			box-shadow: inset 0 0 0 3px var(--green-light);
		}
	}

	.burnt .state {
		color: var(--red);
	}

	.burnt .sizzle {
		background: radial-gradient(circle at 50% 30%, rgb(200 200 200 / 0.5), transparent 60%);
	}

	.meter {
		position: relative;
		height: 6px;
		border-radius: 0;
		background: rgb(255 255 255 / 0.15);
	}

	.fill {
		position: absolute;
		inset: 0 auto 0 0;
		border-radius: 0;
		background: var(--orange);
	}

	.cooked .fill {
		background: var(--green);
	}

	.burnt .fill {
		background: var(--red);
	}

	.mark {
		position: absolute;
		top: -2px;
		bottom: -2px;
		width: 2px;
		background: var(--snow);
	}

	.bin {
		position: absolute;
		top: 0.15rem;
		right: 0.15rem;
		display: grid;
		place-items: center;
		width: 1.6rem;
		height: 1.6rem;
		border: none;
		border-radius: 0;
		background: rgb(255 255 255 / 0.15);
		color: var(--snow);
		cursor: pointer;
	}

	.trays {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.grill-hint {
		margin: -0.3rem 0 0;
		font-size: 0.78rem;
		color: var(--hare);
		font-weight: 800;
	}

	.rail {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(4.6rem, 1fr));
		gap: 0.45rem;
	}

	.tile {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.3rem;
		min-height: 4.6rem;
		padding: 0.5rem 0.3rem 0.45rem;
		border: var(--border) solid var(--swan);
		border-bottom-width: calc(var(--border) + var(--depth));
		border-radius: var(--radius);
		background: var(--snow);
		cursor: pointer;
		user-select: none;
		touch-action: manipulation;
		-webkit-user-select: none;
	}

	.tile:active:not(:disabled) {
		transform: translateY(var(--depth));
		border-bottom-width: var(--border);
		background: var(--polar);
	}

	.tile:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.tray {
		flex: 1;
		min-height: 0;
		width: 4.8rem;
		padding: 0.35rem 0.3rem;
	}

	.pic {
		display: flex;
		align-items: center;
		width: 2.6rem;
		min-height: 1.6rem;
	}

	.name {
		font-size: 0.72rem;
		font-weight: 900;
		line-height: 1.1;
		text-align: center;
		color: var(--wolf);
	}

	.actions {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 20;
		display: grid;
		grid-template-columns: auto auto 1fr;
		gap: 0.5rem;
		max-width: 560px;
		margin: 0 auto;
		padding: 0.65rem 1rem calc(0.65rem + env(safe-area-inset-bottom));
		background: rgb(255 255 255 / 0.94);
		backdrop-filter: blur(8px);
		border-top: var(--border) solid var(--swan);
	}

	.act {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.1rem;
		min-width: 4.2rem;
		min-height: 56px;
		border: var(--border) solid var(--swan);
		border-bottom-width: calc(var(--border) + var(--depth));
		border-radius: var(--radius);
		background: var(--snow);
		color: var(--wolf);
		font-size: 0.7rem;
		font-weight: 900;
		text-transform: uppercase;
		cursor: pointer;
		touch-action: manipulation;
	}

	.act:active:not(:disabled) {
		transform: translateY(var(--depth));
		border-bottom-width: var(--border);
	}

	.act:disabled {
		color: var(--swan);
		cursor: not-allowed;
	}

	.serve {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		min-height: 56px;
		border: none;
		border-radius: var(--radius);
		background: var(--green);
		box-shadow: 0 var(--depth) 0 var(--green-shade);
		color: var(--snow);
		font-size: 1.1rem;
		font-weight: 900;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		cursor: pointer;
		touch-action: manipulation;
	}

	.serve:active:not(:disabled) {
		transform: translateY(var(--depth));
		box-shadow: none;
	}

	.serve:disabled {
		background: var(--swan);
		box-shadow: none;
		color: var(--hare);
		cursor: not-allowed;
	}

	@media (prefers-reduced-motion: reduce) {
		.patty :global(svg),
		.sizzle,
		.cooked .patty {
			animation: none;
		}
	}

	/* ---- Dish picker ---- */

	.menu {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.4rem;
	}

	.dish-tab {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		min-height: 48px;
		padding: 0.35rem 0.4rem;
		border: var(--border) solid var(--swan);
		border-bottom-width: calc(var(--border) + var(--depth));
		border-radius: var(--radius);
		background: var(--snow);
		color: var(--wolf);
		font-size: 0.85rem;
		cursor: pointer;
		touch-action: manipulation;
	}

	.menu.choosing .dish-tab {
		flex-direction: column;
		min-height: 6.5rem;
		font-size: 1rem;
	}

	.menu.choosing .dish-pic {
		width: 3rem;
	}

	.dish-tab.on {
		border-color: var(--orange);
		background: var(--orange-light);
		color: var(--eel);
	}

	.dish-tab:active:not(:disabled) {
		transform: translateY(var(--depth));
		border-bottom-width: var(--border);
	}

	.dish-pic {
		display: flex;
		width: 1.8rem;
		flex-shrink: 0;
	}

	.pick-hint {
		margin: 0.5rem 0;
		text-align: center;
		color: var(--wolf);
	}

	.plate.wide {
		width: min(19rem, 92%);
	}

	.cooking {
		display: flex;
		width: 2.6rem;
	}

	.grill.four {
		grid-template-columns: repeat(4, 1fr);
	}

	.grill.pot {
		background:
			radial-gradient(circle at 30% 40%, rgb(255 255 255 / 0.12) 0 4px, transparent 5px),
			radial-gradient(circle at 70% 70%, rgb(255 255 255 / 0.1) 0 3px, transparent 4px),
			#2f4a5a;
	}
</style>
