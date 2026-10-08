<script lang="ts">
	import { goto } from '$app/navigation';
	import { useMutation } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import { errorMessage, me, saveName } from '#lib/player.svelte.ts';
	import { LAST_ROOM_KEY } from '#lib/burger/room.ts';
	import Burger from '#lib/burger/Burger.svelte';
	import { Button, Card } from '#lib/ui/index.ts';
	import { XIcon } from '#lib/icons/index.ts';

	const createRoom = useMutation(api.kitchen.create);
	const joinRoom = useMutation(api.kitchen.join);

	let name = $state(me.name);
	let code = $state('');
	let busy = $state(false);
	let error = $state('');
	const lastRoom = localStorage.getItem(LAST_ROOM_KEY);

	async function run(action: () => Promise<string>) {
		error = '';
		busy = true;
		try {
			saveName(name);
			const roomCode = await action();
			await goto(`/burger/${roomCode}`);
		} catch (err) {
			error = errorMessage(err);
		} finally {
			busy = false;
		}
	}

	const mascot = [
		{ ing: 'bun_bottom' },
		{ ing: 'ketchup' },
		{ ing: 'beef', state: 'cooked' as const },
		{ ing: 'cheese' },
		{ ing: 'tomato' },
		{ ing: 'lettuce' },
		{ ing: 'bun_top' }
	];
</script>

<main>
	<a class="close" href="/" aria-label="Back to all games"><XIcon weight="bold" size="1.5rem" /></a>

	<div class="intro">
		<span class="mascot"><Burger layers={mascot} plate={false} /></span>
		<div class="speech">
			<h1>Burger for Two</h1>
			<p>
				One of you is the <strong>cashier</strong> and hears the order. The other is the
				<strong>chef</strong> and can't see it. Burgers, sate ayam or mie ayam — get on a call and
				talk it into existence.
			</p>
		</div>
	</div>

	<Card class="form">
		{#if lastRoom}
			<Button variant="gold" full href="/burger/{lastRoom}">Back to room {lastRoom}</Button>
			<div class="divider"><span>or start fresh</span></div>
		{/if}

		<label class="label" for="name">Your name</label>
		<input id="name" bind:value={name} maxlength="24" placeholder="e.g. Sayang" autocomplete="nickname" />

		<Button
			full
			size="lg"
			variant="primary"
			disabled={busy || !name.trim()}
			onclick={() => run(() => createRoom({ playerId: me.id, name }))}
		>
			Open the restaurant
		</Button>

		<div class="divider"><span>or join your partner</span></div>

		<form
			class="join"
			onsubmit={(e) => {
				e.preventDefault();
				run(() => joinRoom({ code, playerId: me.id, name }));
			}}
		>
			<input
				bind:value={code}
				maxlength="4"
				placeholder="CODE"
				aria-label="Room code"
				autocapitalize="characters"
				autocomplete="off"
			/>
			<Button type="submit" variant="secondary" disabled={busy || !name.trim() || code.trim().length < 4}>
				Join
			</Button>
		</form>

		{#if error}<p class="error">{error}</p>{/if}
	</Card>
</main>

<style>
	main {
		max-width: 480px;
		margin: 0 auto;
		padding: 1.5rem 1.25rem 3rem;
	}

	.close {
		display: inline-grid;
		place-items: center;
		width: 2.4rem;
		height: 2.4rem;
		color: var(--hare);
		text-decoration: none;
	}

	.intro {
		display: flex;
		align-items: flex-end;
		gap: 0.9rem;
		margin: 1.5rem 0 1.75rem;
	}

	.mascot {
		display: flex;
		flex-shrink: 0;
		width: 5.5rem;
		animation: wobble 1.6s ease-in-out infinite;
	}

	@keyframes wobble {
		25% {
			transform: rotate(-6deg);
		}
		75% {
			transform: rotate(6deg);
		}
	}

	.speech {
		position: relative;
		flex: 1;
		padding: 1rem 1.1rem;
		border: var(--border) solid var(--swan);
		border-radius: var(--radius);
	}

	.speech::before {
		content: '';
		position: absolute;
		left: -9px;
		bottom: 1.4rem;
		width: 14px;
		height: 14px;
		background: var(--snow);
		border-left: var(--border) solid var(--swan);
		border-bottom: var(--border) solid var(--swan);
		transform: rotate(45deg);
	}

	h1 {
		font-size: 1.5rem;
		color: var(--orange);
	}

	.speech p {
		margin: 0.4rem 0 0;
		line-height: 1.5;
		font-size: 0.95rem;
	}

	:global(.card.form) {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}

	.divider {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		color: var(--hare);
		font-size: 0.8rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin: 0.25rem 0;
	}

	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		height: var(--border);
		background: var(--swan);
	}

	.join {
		display: flex;
		gap: 0.6rem;
	}

	.join input {
		text-transform: uppercase;
		letter-spacing: 0.3em;
		font-weight: 900;
		text-align: center;
	}
</style>
