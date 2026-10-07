<script lang="ts">
	import { goto } from '$app/navigation';
	import { useMutation } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import { errorMessage, me, saveName } from '#lib/player.svelte.ts';
	import { Button, Card, ChoiceTile } from '#lib/ui/index.ts';
	import { LightningIcon, MountainsIcon, XIcon } from '#lib/icons/index.ts';
	import type { BoardSize } from '../../../convex/board';
	import SnakeMascot from '#lib/icons/SnakeMascot.svelte';

	const createRoom = useMutation(api.rooms.create);
	const joinRoom = useMutation(api.rooms.join);

	const SIZES = [
		{ size: 50, label: 'Quick', detail: '50 tiles · about 15 min', icon: LightningIcon, tone: 'gold' },
		{ size: 100, label: 'Classic', detail: '100 tiles · about 30 min', icon: MountainsIcon, tone: 'blue' }
	] as const;

	let name = $state(me.name);
	let size = $state<BoardSize>(localStorage.getItem('ldr.boardSize') === '100' ? 100 : 50);
	let code = $state('');
	let busy = $state(false);
	let error = $state('');

	async function run(action: () => Promise<string>) {
		error = '';
		busy = true;
		try {
			saveName(name);
			const roomCode = await action();
			await goto(`/snakes-ladders/${roomCode}`);
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
		<span class="mascot"><SnakeMascot size={88} /></span>
		<div class="speech">
			<h1>Snakes &amp; Ladders</h1>
			<p>
				Take turns rolling. Land on a square, answer its question, and your partner reacts.
				Ladders bring sweet words — snakes bring confessions!
			</p>
		</div>
	</div>

	<Card class="form">
		<label class="label" for="name">Your name</label>
		<input id="name" bind:value={name} maxlength="24" placeholder="e.g. Sayang" autocomplete="nickname" />

		<span class="label">Board</span>
		<div class="sizes" role="radiogroup" aria-label="Board size">
			{#each SIZES as option (option.size)}
				<ChoiceTile
					class="size-option"
					selected={size === option.size}
					role="radio"
					aria-checked={size === option.size}
					onclick={() => (size = option.size)}
				>
					<span class="size-icon" style="color: var(--{option.tone})">
						<option.icon weight="fill" size="1.6rem" />
					</span>
					<strong>{option.label}</strong>
					<small>{option.detail}</small>
				</ChoiceTile>
			{/each}
		</div>

		<Button
			full
			size="lg"
			disabled={busy || !name.trim()}
			onclick={() => {
				localStorage.setItem('ldr.boardSize', String(size));
				run(() => createRoom({ playerId: me.id, name, size }));
			}}
		>
			Create a room
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
		animation: bob 3s ease-in-out infinite;
	}

	@keyframes bob {
		50% {
			transform: translateY(-6px);
		}
	}

	/* Duolingo-style speech bubble from the mascot. */
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
		color: var(--green);
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

	.sizes {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.6rem;
		margin-bottom: 0.25rem;
	}

	:global(.tile.size-option) {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.15rem;
		padding: 0.8rem 0.9rem;
		text-align: left;
	}

	:global(.tile.size-option) strong {
		font-size: 1.05rem;
		font-weight: 900;
	}

	:global(.tile.size-option) small {
		color: var(--wolf);
		font-weight: 800;
	}

	.size-icon {
		display: flex;
		margin-bottom: 0.2rem;
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
