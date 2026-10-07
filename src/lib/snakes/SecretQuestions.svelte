<script lang="ts">
	import { useMutation, useQuery } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import type { Id } from '../../../convex/_generated/dataModel';
	import { errorMessage, me } from '../player.svelte.ts';
	import { Badge, Button } from '../ui/index.ts';
	import { CheckIcon, HeartIcon, LockSimpleIcon, PlusIcon, TrashIcon } from '../icons/index.ts';

	let {
		roomId,
		partnerName,
		incoming,
		heartCount,
		onclose
	}: {
		/** Heart tiles on this game's board. */
		heartCount: number;
		roomId: Id<'rooms'>;
		/** Undefined until the partner joins. */
		partnerName?: string;
		/** Unasked secret questions the partner has written for me. */
		incoming: number;
		onclose: () => void;
	} = $props();

	const mineQuery = useQuery(api.custom.mine, () => ({ roomId, playerId: me.id }));
	const addQuestion = useMutation(api.custom.add);
	const removeQuestion = useMutation(api.custom.remove);

	const SUGGESTIONS = [
		'What is one thing you never told me about the day we met?',
		'If you could relive one day with me, which would it be?',
		'What do you want to do on our first night living together?',
		'What is a song you secretly think of as "ours"?'
	];

	const them = $derived(partnerName ?? 'your partner');
	const waiting = $derived((mineQuery.data ?? []).filter((q) => !q.usedAt));
	const asked = $derived((mineQuery.data ?? []).filter((q) => q.usedAt));

	let draft = $state('');
	let busy = $state(false);
	let error = $state('');

	async function add() {
		if (!draft.trim() || busy) return;
		error = '';
		busy = true;
		try {
			await addQuestion({ roomId, playerId: me.id, text: draft });
			draft = '';
		} catch (err) {
			error = errorMessage(err);
		} finally {
			busy = false;
		}
	}

	async function remove(id: Id<'customQuestions'>) {
		error = '';
		try {
			await removeQuestion({ id, playerId: me.id });
		} catch (err) {
			error = errorMessage(err);
		}
	}
</script>

<button class="backdrop" aria-label="Close secret questions" onclick={onclose}></button>
<aside class="drawer" aria-label="Secret questions">
	<header>
		<h2>Secret questions</h2>
		<Button variant="ghost" size="sm" onclick={onclose}>Close</Button>
	</header>

	<p class="intro">
		<span class="lock"><LockSimpleIcon weight="fill" size="1.1rem" /></span>
		Write questions for {them}. They pop up when {them} lands on a
		<span class="heart-chip"><HeartIcon weight="fill" size="0.9rem" /> heart tile</span>
		({heartCount} on this board) — and stay hidden until then.
	</p>

	{#if partnerName && incoming > 0}
		<div class="incoming">
			<HeartIcon weight="fill" size="1.4rem" />
			<span><b>{partnerName}</b> wrote you {incoming} secret question{incoming === 1 ? '' : 's'}. Find the hearts!</span>
		</div>
	{/if}

	<form
		class="compose"
		onsubmit={(e) => {
			e.preventDefault();
			add();
		}}
	>
		<textarea
			bind:value={draft}
			maxlength="300"
			placeholder="Ask {them} anything…"
			enterkeyhint="done"
			onkeydown={(e) => {
				if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
					e.preventDefault();
					add();
				}
			}}
		></textarea>
		<Button type="submit" variant="super" full disabled={busy || !draft.trim()}>
			<PlusIcon weight="bold" /> Add question
		</Button>
	</form>

	{#if error}<p class="error">{error}</p>{/if}

	<div class="lists">
		{#if !mineQuery.data?.length}
			<span class="label">Need ideas? Tap one</span>
			<div class="suggestions">
				{#each SUGGESTIONS as idea (idea)}
					<button type="button" class="suggestion" onclick={() => (draft = idea)}>{idea}</button>
				{/each}
			</div>
		{/if}

		{#if waiting.length}
			<span class="label">Waiting for {them} · {waiting.length}</span>
			<ul>
				{#each waiting as q (q._id)}
					<li>
						<span class="text">{q.text}</span>
						<button type="button" class="icon-btn" aria-label="Delete question" onclick={() => remove(q._id)}>
							<TrashIcon weight="fill" size="1.1rem" />
						</button>
					</li>
				{/each}
			</ul>
		{/if}

		{#if asked.length}
			<span class="label">Already asked · {asked.length}</span>
			<ul>
				{#each asked as q (q._id)}
					<li class="done">
						<span class="text">{q.text}</span>
						<Badge color="green"><CheckIcon weight="bold" /> Asked</Badge>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</aside>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 20;
		border: none;
		background: rgba(0, 0, 0, 0.35);
		animation: fade 0.2s ease;
	}

	.drawer {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		z-index: 21;
		width: min(440px, 100vw);
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
		padding: 1.25rem;
		background: var(--snow);
		border-left: var(--border) solid var(--swan);
		overflow-y: auto;
		animation: slide-in 0.3s var(--ease-out);
	}

	@keyframes fade {
		from {
			opacity: 0;
		}
	}

	@keyframes slide-in {
		from {
			transform: translateX(100%);
		}
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.intro {
		margin: 0;
		line-height: 1.55;
		color: var(--wolf);
	}

	.lock {
		display: inline-flex;
		vertical-align: -0.15em;
		color: var(--pink);
	}

	.heart-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		padding: 0 0.45rem;
		border-radius: 999px;
		background: var(--pink-light);
		color: var(--pink-shade);
		font-weight: 900;
	}

	.incoming {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.75rem 0.9rem;
		border: var(--border) solid var(--pink);
		border-bottom-width: calc(var(--border) + var(--depth));
		border-bottom-color: var(--pink-shade);
		border-radius: var(--radius);
		background: var(--pink-light);
		color: var(--pink-shade);
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		50% {
			transform: scale(1.015);
		}
	}

	.compose {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.compose textarea {
		min-height: 5rem;
	}

	.lists {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.label {
		margin: 0.4rem 0 0;
	}

	.suggestions {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.suggestion {
		text-align: left;
		padding: 0.7rem 0.9rem;
		border: var(--border) dashed var(--swan);
		border-radius: var(--radius);
		background: var(--polar);
		color: var(--wolf);
		font-weight: 800;
		line-height: 1.4;
		cursor: pointer;
	}

	@media (hover: hover) {
		.suggestion:hover {
			border-color: var(--pink);
			color: var(--pink-shade);
		}
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	li {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.7rem 0.6rem 0.7rem 0.9rem;
		border: var(--border) solid var(--swan);
		border-bottom-width: calc(var(--border) + var(--depth));
		border-radius: var(--radius);
	}

	li.done {
		background: var(--polar);
		color: var(--wolf);
	}

	.text {
		flex: 1;
		line-height: 1.4;
		font-weight: 800;
	}

	.icon-btn {
		display: grid;
		place-items: center;
		width: 2.2rem;
		height: 2.2rem;
		flex-shrink: 0;
		border: none;
		border-radius: var(--radius-sm);
		background: none;
		color: var(--hare);
		cursor: pointer;
	}

	@media (hover: hover) {
		.icon-btn:hover {
			background: var(--red-light);
			color: var(--red);
		}
	}
</style>
