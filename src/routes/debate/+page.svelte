<script lang="ts">
	import { goto } from '$app/navigation';
	import { useMutation } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import { ROUND_INFO, ROUNDS } from '../../../convex/debate/rules';
	import { errorMessage, me, saveName } from '#lib/player.svelte.ts';
	import Mek from '#lib/court/Mek.svelte';
	import Portrait from '#lib/court/Portrait.svelte';

	const createRoom = useMutation(api.debate.create);
	const joinRoom = useMutation(api.debate.join);

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
			await goto(`/debate/${roomCode}`);
		} catch (err) {
			error = errorMessage(err);
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head><title>Debate Room · Us, Apart</title></svelte:head>

<Mek>
	<main>
		<nav class="top">
			<a class="btn small" href="/"><kbd>ESC</kbd> All games</a>
			<span class="micro">THE MOTION IS ON THE FLOOR</span>
		</nav>

		<section class="hero">
			<div>
				<p class="eyebrow">▸ A debate for two</p>
				<h1>DEBATE<br /><span>ROOM</span><i class="caret"></i></h1>
				<p class="lede">
					One topic. One of you argues <b class="side-defense">For</b>, the other <b class="side-prosecution">Against</b>.
					Write your arguments in secret, reveal them together, and let the <b>AI judge</b> decide who argued better.
				</p>
				<p class="lede">You don't have to believe your side. You just have to win it.</p>
			</div>
			<div class="bench">
				<div class="seat"><Portrait who="defense" size={64} /><span class="eyebrow side-defense">For</span><span class="micro">Player 1</span></div>
				<div class="seat judge"><Portrait who="judge" size={84} /><span class="eyebrow side-court">Judge</span><span class="micro">GLM-5</span></div>
				<div class="seat"><Portrait who="prosecution" size={64} /><span class="eyebrow side-prosecution">Against</span><span class="micro">Player 2</span></div>
			</div>
		</section>

		<section class="form panel">
			<span class="tag">SIGN IN</span>
			<label class="eyebrow" for="name">Your name</label>
			<div class="chat">
				<span class="p">&gt;</span>
				<input id="name" bind:value={name} maxlength="24" placeholder="e.g. Sayang" autocomplete="nickname" />
			</div>

			<button class="btn primary full" disabled={busy || !name.trim()} onclick={() => run(() => createRoom({ playerId: me.id, name }))}>
				Open a debate <kbd>↵</kbd>
			</button>

			<div class="divider"><span class="micro">or join one</span></div>

			<form
				class="join"
				onsubmit={(e) => {
					e.preventDefault();
					run(() => joinRoom({ code, playerId: me.id, name }));
				}}
			>
				<input class="code" bind:value={code} maxlength="4" placeholder="CODE" aria-label="Room code" autocapitalize="characters" autocomplete="off" />
				<button class="btn" disabled={busy || !name.trim() || code.trim().length < 4}>Join</button>
			</form>

			{#if error}<p class="err">! {error}</p>{/if}
		</section>

		<section class="phases">
			{#each ['Pick a topic', ...ROUNDS.map((r) => ROUND_INFO[r].label), 'Verdict'] as p, i (p)}
				<div class="phase"><span class="n">{String(i + 1).padStart(2, '0')}</span><span>{p}</span></div>
			{/each}
		</section>
	</main>
</Mek>

<svelte:window onkeydown={(e) => e.key === 'Escape' && goto('/')} />

<style>
	main {
		max-width: 1100px;
		margin: 0 auto;
		padding: 0 24px 80px;
	}
	.top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 0;
		border-bottom: 2px solid var(--rule);
	}
	.hero {
		display: grid;
		grid-template-columns: 1.2fr 0.8fr;
		gap: 40px;
		align-items: end;
		padding: 56px 0 32px;
	}
	@media (max-width: 860px) {
		.hero {
			grid-template-columns: 1fr;
		}
	}
	h1 {
		font-size: clamp(40px, 7vw, 84px);
		line-height: 0.9;
		margin: 14px 0 20px;
	}
	h1 span {
		color: var(--signal);
	}
	.caret {
		display: inline-block;
		width: 0.5em;
		height: 0.12em;
		background: var(--cursor);
		margin-left: 6px;
		animation: mek-blink var(--dur-blink) steps(1) infinite;
	}
	.lede {
		max-width: 62ch;
		color: var(--ink-dim);
		font-size: 23px;
		margin-bottom: 10px;
	}
	.lede b {
		font-weight: 400;
	}
	.lede b:not([class]) {
		color: var(--ink-2);
	}
	.bench {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		gap: 12px;
	}
	.seat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		padding: 12px;
		border: 2px solid var(--rule);
		background: var(--night-2);
	}
	.seat.judge {
		border-color: var(--luck-deep);
		background: var(--void);
		padding-bottom: 28px;
	}
	.form {
		display: flex;
		flex-direction: column;
		gap: 12px;
		max-width: 520px;
		padding: 24px;
	}
	.chat {
		display: flex;
		align-items: center;
		gap: 8px;
		border: 2px solid var(--rule-hi);
		background: var(--void);
		padding: 2px 12px;
	}
	.chat .p {
		color: var(--signal);
		font-size: 24px;
	}
	.chat input {
		border: none;
		padding: 6px 0;
		background: transparent;
	}
	.chat input:focus {
		outline: none;
	}
	.chat:focus-within {
		outline: 2px solid var(--cursor);
		outline-offset: 2px;
	}
	.divider {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		height: 2px;
		background: var(--rule);
	}
	.join {
		display: flex;
		gap: 8px;
	}
	.code {
		text-transform: uppercase;
		letter-spacing: 0.4em;
		text-align: center;
		font-family: var(--font-ui);
		font-size: 18px;
	}
	.err {
		color: var(--hp);
	}
	.phases {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		margin-top: 40px;
		border-top: 2px solid var(--rule-hi);
	}
	.phase {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 16px 12px 0 0;
		font-family: var(--font-ui);
		font-size: 13px;
		color: var(--ink);
	}
	.phase .n {
		color: var(--signal);
		font-size: 12px;
	}
</style>
