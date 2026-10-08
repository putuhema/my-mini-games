<script lang="ts">
	import { SPRITES, type SpriteName } from './sprites.ts';

	let {
		name,
		scale = 4
	}: {
		name: SpriteName;
		/** Pixels per sprite pixel. Keep it a whole number. */
		scale?: number;
	} = $props();

	const sprite = $derived(SPRITES[name]);
	const width = $derived(Math.max(...sprite.rows.map((r) => r.length)));
</script>

<svg
	class="sprite"
	width={width * scale}
	height={sprite.rows.length * scale}
	viewBox="0 0 {width} {sprite.rows.length}"
	shape-rendering="crispEdges"
	aria-hidden="true"
>
	{#each sprite.rows as row, y (y)}
		{#each row.split('') as c, x (x)}
			{#if c !== '.'}
				<rect {x} {y} width="1" height="1" fill={sprite.colors[c as keyof typeof sprite.colors]} />
			{/if}
		{/each}
	{/each}
</svg>

<style>
	.sprite {
		display: block;
		flex-shrink: 0;
	}

	/* Day: light sprites need a dark pixel outline to read on pale ground. */
	:global([data-theme='day']) .sprite {
		filter: drop-shadow(1px 0 0 var(--night)) drop-shadow(-1px 0 0 var(--night))
			drop-shadow(0 1px 0 var(--night)) drop-shadow(0 -1px 0 var(--night));
	}
</style>
