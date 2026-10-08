<script lang="ts">
	import { StarIcon } from '#lib/icons/index.ts';

	let { stars, size = '1.4rem', pop = false }: { stars: number; size?: string; pop?: boolean } = $props();
</script>

<span class="stars" class:pop role="img" aria-label="{stars} out of 5 stars">
	{#each [1, 2, 3, 4, 5] as n (n)}
		<span class="star" class:on={n <= stars} style="--i: {n}">
			<StarIcon weight="fill" {size} />
		</span>
	{/each}
</span>

<style>
	.stars {
		display: inline-flex;
		gap: 0.1rem;
	}

	.star {
		display: flex;
		color: var(--swan);
	}

	.star.on {
		color: var(--gold);
	}

	.pop .star.on {
		animation: pop 0.45s var(--ease-spring) backwards;
		animation-delay: calc(var(--i) * 0.12s + 0.2s);
	}

	@keyframes pop {
		from {
			transform: scale(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.pop .star.on {
			animation: none;
		}
	}
</style>
