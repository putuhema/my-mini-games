<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { api } from '../../../convex/_generated/api';
	import type { Id } from '../../../convex/_generated/dataModel';
	import Dialog from './Dialog.svelte';
	import Pixel from './Pixel.svelte';

	let {
		coupleId,
		petName,
		recent,
		now,
		onclose
	}: {
		coupleId: Id<'creatureCouples'>;
		petName: string;
		/** The latest things that happened in the room. */
		recent: { _id: string; _creationTime: number; icon: string; text: string }[];
		now: number;
		onclose: () => void;
	} = $props();

	let tab = $state<'lately' | 'story'>('lately');
	const memories = useQuery(api.pets.memories, () => ({ coupleId }));

	// Group by day so the book reads like a diary.
	const days = $derived.by(() => {
		const groups: { day: number; items: { _id: string; icon: string; text: string }[] }[] = [];
		for (const m of memories.data ?? []) {
			const last = groups.at(-1);
			if (last?.day === m.day) last.items.push(m);
			else groups.push({ day: m.day, items: [m] });
		}
		return groups.reverse();
	});

	const ago = (t: number) => {
		const m = Math.max(0, Math.round((now - t) / 60_000));
		if (m < 1) return 'just now';
		if (m < 60) return `${m}m ago`;
		const h = Math.round(m / 60);
		return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
	};
</script>

<Dialog title="Our journal" {onclose} wide>
	<div class="tabs" role="tablist">
		<button role="tab" aria-selected={tab === 'lately'} onclick={() => (tab = 'lately')}>Lately</button>
		<button role="tab" aria-selected={tab === 'story'} onclick={() => (tab = 'story')}>Our story</button>
	</div>

	{#if tab === 'lately'}
		{#if recent.length}
			<ul class="feed">
				{#each recent as e (e._id)}
					<li>
						<Pixel name={e.icon} scale={2} />
						<span>{e.text}</span>
						<time>{ago(e._creationTime)}</time>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="muted">Nothing yet. Go say hi to {petName}!</p>
		{/if}
	{:else if memories.isLoading}
		<p class="muted">Opening the book...</p>
	{:else}
		<p class="muted intro">Everything {petName} remembers, newest first.</p>
		<ol class="book">
			{#each days as d (d.day)}
				<li>
					<h3>Day {d.day}</h3>
					<ul>
						{#each d.items as m (m._id)}
							<li><Pixel name={m.icon} scale={2} /> <span>{m.text}</span></li>
						{/each}
					</ul>
				</li>
			{/each}
		</ol>
	{/if}
</Dialog>

<style>
	.tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.tabs button {
		flex: 1;
		padding: 0.35rem 0.5rem 0.25rem;
		border: 0;
		background: var(--moss);
		color: var(--sage);
		font-size: 1.1rem;
		cursor: pointer;
		box-shadow: 0 0 0 2px var(--vine);
	}

	.tabs button[aria-selected='true'] {
		background: var(--pink-light);
		color: var(--pink-shade);
		box-shadow: 0 0 0 2px var(--pink);
	}

	.intro {
		margin: 0 0 1rem;
	}

	.feed {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.feed li {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		font-size: 1.1rem;
		line-height: 1.1;
	}

	.feed span {
		flex: 1;
	}

	.feed time {
		color: var(--bog);
		font-size: 0.9rem;
		white-space: nowrap;
	}

	.book {
		list-style: none;
		margin: 0;
		padding: 0 0 0 0.9rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		border-left: 2px dashed var(--vine);
	}

	h3 {
		position: relative;
		font-size: 1.3rem;
		color: var(--pink);
		margin-bottom: 0.35rem;
	}

	h3::before {
		content: '';
		position: absolute;
		left: calc(-0.9rem - 5px);
		top: 0.35rem;
		width: 8px;
		height: 8px;
		background: var(--pink);
		box-shadow: 0 0 0 2px var(--canopy);
	}

	.book ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}

	.book ul li {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font-size: 1.15rem;
		line-height: 1.1;
	}
</style>
