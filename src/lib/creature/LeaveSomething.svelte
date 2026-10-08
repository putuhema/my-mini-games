<script lang="ts">
	import { Button } from '#lib/ui/index.ts';
	import { GIFTS, MAX_MESSAGE, MESSAGE_PRESETS, type Gift } from '../../../convex/creature/world';
	import Dialog from './Dialog.svelte';
	import Pixel from './Pixel.svelte';

	let {
		partnerName,
		petName,
		leaving,
		busy,
		error,
		onsend,
		onskip,
		onclose
	}: {
		partnerName?: string;
		petName: string;
		/** Asked on the way out, rather than from the gift button. */
		leaving: boolean;
		busy: boolean;
		error: string;
		onsend: (item: Gift, message: string) => void;
		onskip: () => void;
		onclose: () => void;
	} = $props();

	const items = $derived(
		(Object.keys(GIFTS) as Gift[]).filter((g) => partnerName || GIFTS[g].for === 'pet')
	);
	let item = $state<Gift>('letter');
	let message = $state('');
	$effect(() => {
		if (!items.includes(item)) item = items[0];
	});

	const label = (g: Gift) =>
		GIFTS[g].for === 'pet' ? GIFTS[g].label.replace('the cat', petName) : GIFTS[g].label;
	const ready = $derived(item !== 'letter' || message.trim().length > 0);
</script>

<Dialog title={leaving ? `Want to leave something${partnerName ? ` for ${partnerName}` : ''}?` : 'Leave a surprise'} {onclose}>
	<p class="muted lead">
		{partnerName
			? `${partnerName} will find it next time they visit.`
			: `${petName} will get it right away.`}
	</p>

	<div class="items" role="radiogroup" aria-label="What to leave">
		{#each items as g (g)}
			<button class="item" role="radio" aria-checked={item === g} onclick={() => (item = g)}>
				<Pixel name={g === 'star' ? 'star' : g} scale={3} />
				<span>{label(g)}</span>
			</button>
		{/each}
	</div>

	{#if partnerName}
		<label class="label" for="note">A note for {partnerName}{item === 'letter' ? '' : ' (optional)'}</label>
		<div class="presets">
			{#each MESSAGE_PRESETS as m (m)}
				<button class="preset" class:on={message === m} onclick={() => (message = m)}>{m}</button>
			{/each}
		</div>
		<textarea id="note" bind:value={message} maxlength={MAX_MESSAGE} rows="3" placeholder="Write something..."></textarea>
	{/if}

	{#if error}<p class="error">{error}</p>{/if}

	<div class="actions">
		<Button full disabled={busy || !ready} variant="super" onclick={() => onsend(item, message)}>
			{leaving ? 'Leave it and go' : 'Leave it'}
		</Button>
		{#if leaving}
			<Button full variant="ghost" disabled={busy} onclick={onskip}>Just go</Button>
		{/if}
	</div>
</Dialog>

<style>
	.lead {
		margin: 0 0 1rem;
	}

	.items {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(5.5rem, 1fr));
		gap: 0.6rem;
		margin-bottom: 1.1rem;
	}

	.item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35rem;
		padding: 0.6rem 0.3rem 0.45rem;
		border: 0;
		background: var(--moss);
		color: var(--dew);
		font-size: 0.95rem;
		line-height: 1;
		text-align: center;
		cursor: pointer;
		box-shadow:
			0 0 0 2px var(--gap),
			0 0 0 4px var(--vine);
	}

	.item[aria-checked='true'] {
		background: var(--pink-light);
		box-shadow:
			0 0 0 2px var(--gap),
			0 0 0 4px var(--pink);
	}

	.presets {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-bottom: 0.6rem;
	}

	.preset {
		padding: 0.15rem 0.55rem;
		border: 0;
		background: var(--soil);
		color: var(--sage);
		font-size: 0.95rem;
		cursor: pointer;
		box-shadow: 0 0 0 1px var(--hairline);
	}

	.preset.on {
		background: var(--pink-light);
		color: var(--pink-shade);
		box-shadow: 0 0 0 2px var(--pink);
	}

	textarea {
		min-height: 4.5rem;
	}

	.error {
		margin-top: 0.75rem;
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		margin-top: 1.1rem;
	}
</style>
