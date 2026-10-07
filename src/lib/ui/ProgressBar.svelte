<script lang="ts">
	let {
		value,
		max = 100,
		color = 'green',
		label
	}: {
		value: number;
		max?: number;
		/** Colour family name, e.g. 'green', 'gold', 'p1'. */
		color?: string;
		/** Accessible label. */
		label?: string;
	} = $props();

	const pct = $derived(Math.max(0, Math.min(100, (value / max) * 100)));
</script>

<div
	class="track"
	role="progressbar"
	aria-label={label}
	aria-valuemin={0}
	aria-valuemax={max}
	aria-valuenow={value}
	style="--fill: var(--{color})"
>
	<div class="fill" style="width: {pct}%"></div>
</div>

<style>
	.track {
		height: 16px;
		border-radius: 999px;
		background: var(--swan);
		overflow: hidden;
	}

	.fill {
		position: relative;
		height: 100%;
		min-width: 16px;
		border-radius: inherit;
		background: var(--fill);
		transition: width 0.6s var(--ease-spring);
	}

	/* The glossy highlight strip Duolingo bars have. */
	.fill::after {
		content: '';
		position: absolute;
		top: 4px;
		left: 8px;
		right: 8px;
		height: 4px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.35);
	}
</style>
