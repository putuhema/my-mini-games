<script lang="ts">
	import { goto } from '$app/navigation';
	import { useMutation } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import { errorMessage, me, saveName } from '#lib/player.svelte.ts';
	import { Button, Card } from '#lib/ui/index.ts';
	import { BombIcon, XIcon } from '#lib/icons/index.ts';

	const createRoom = useMutation(api.defuse.create);
	const joinRoom = useMutation(api.defuse.join);

	let name = $state(me.name);
	let code = $state('');
	let busy = $state(false);
	let error = $state('');

	async function run(action: () => Promise<string>) {
		error = '';
		busy = true;
		try {
			saveName(name);
			const roomCode = await action();
			await goto(`/bomb-defusal/${roomCode}`);
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
		<span class="mascot"><BombIcon weight="fill" size="5.5rem" /></span>
		<div class="speech">
			<h1>Bomb Defusal</h1>
			<p>
				One of you sees the bomb. The other has the manual. Get on a call, talk fast, and don't
				explode. Every bomb — and every manual — is new.
			</p>
		</div>
	</div>

	<Card class="form">
		<label class="label" for="name">Your name</label>
		<input id="name" bind:value={name} maxlength="24" placeholder="e.g. Sayang" autocomplete="nickname" />

		<Button
			full
			size="lg"
			variant="danger"
			disabled={busy || !name.trim()}
			onclick={() => run(() => createRoom({ playerId: me.id, name }))}
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
		color: #3b4248;
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
		color: var(--red);
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
