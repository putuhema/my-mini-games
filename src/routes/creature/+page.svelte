<script lang="ts">
	import { goto } from '$app/navigation';
	import { useMutation } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import type { Coat, Hair, Shirt } from '../../../convex/creature/world';
	import { errorMessage, me, saveName } from '#lib/player.svelte.ts';
	import { cat } from '#lib/creature/art.ts';
	import CoatPicker from '#lib/creature/CoatPicker.svelte';
	import LookPicker from '#lib/creature/LookPicker.svelte';
	import Pixel from '#lib/creature/Pixel.svelte';
	import { LAST_ROOM_KEY, loadLook, saveLook } from '#lib/creature/room.ts';
	import { Button, Card } from '#lib/ui/index.ts';
	import { XIcon } from '#lib/icons/index.ts';

	const createRoom = useMutation(api.pets.create);
	const joinRoom = useMutation(api.pets.join);

	const saved = loadLook();
	let name = $state(me.name);
	let shirt = $state<Shirt>(saved.shirt);
	let hair = $state<Hair>(saved.hair);
	let petName = $state('');
	let coat = $state<Coat | 'random'>('random');
	let code = $state('');
	let busy = $state(false);
	let error = $state('');
	const lastRoom = localStorage.getItem(LAST_ROOM_KEY);

	async function run(action: () => Promise<string>) {
		error = '';
		busy = true;
		try {
			saveName(name);
			saveLook({ shirt, hair });
			const roomCode = await action();
			await goto(`/creature/${roomCode}`);
		} catch (err) {
			error = errorMessage(err);
		} finally {
			busy = false;
		}
	}
</script>

<main>
	<a class="close" href="/" aria-label="Back to all games"><XIcon weight="bold" size="1.5rem" /></a>

	<div class="intro">
		<span class="mascot"><Pixel img={cat('orange', 'kitten', undefined, { pose: 'sit', eyes: 'happy', mouth: 'smile', blush: true })} scale={5} trim /></span>
		<div class="speech">
			<h1>Our Little Creature</h1>
			<p>
				A box turned up at your door. It mewed. Raise one small cat together from wherever you are — feed it,
				play with it, leave each other surprises, and see what kind of cat it grows up to be.
			</p>
		</div>
	</div>

	<Card class="form">
		{#if lastRoom}
			<Button variant="gold" full href="/creature/{lastRoom}">Back to our room</Button>
			<div class="divider"><span>or start fresh</span></div>
		{/if}

		<label class="label" for="name">Your name</label>
		<input id="name" bind:value={name} maxlength="24" placeholder="e.g. Putu" autocomplete="nickname" />

		<LookPicker bind:shirt bind:hair />

		<CoatPicker bind:coat />

		<label class="label" for="pet">Name the kitten</label>
		<input id="pet" bind:value={petName} maxlength="16" placeholder="e.g. Mochi" autocomplete="off" />

		<Button
			full
			size="lg"
			variant="super"
			disabled={busy || !name.trim()}
			onclick={() => run(() => createRoom({ playerId: me.id, name, petName, coat, shirt, hair }))}
		>
			Open the door
		</Button>

		<div class="divider"><span>or join your partner</span></div>

		<form
			class="join"
			onsubmit={(e) => {
				e.preventDefault();
				run(() => joinRoom({ code, playerId: me.id, name, shirt, hair }));
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
		gap: 1rem;
		margin: 1.5rem 0 1.75rem;
	}

	.mascot {
		display: flex;
		flex-shrink: 0;
		animation: wobble 1.6s steps(4, end) infinite;
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
		background: var(--canopy);
		box-shadow:
			0 0 0 2px var(--gap),
			0 0 0 4px var(--vine);
	}

	h1 {
		font-size: 1.8rem;
		color: var(--pink);
	}

	.speech p {
		margin: 0.4rem 0 0;
		line-height: 1.2;
		font-size: 1.1rem;
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
		font-size: 0.9rem;
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
		text-align: center;
	}
</style>
