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
	style="--fill: var(--{color}-fill, var(--{color}))"
>
	<div class="fill" style="width: {pct}%"></div>
</div>

<style>
	/* A sunken well with a segmented, bevelled fill that moves in steps. */
	.track {
		height: 18px;
		padding: 3px;
		background: var(--well);
		box-shadow:
			inset 0 2px 0 var(--well-shadow),
			0 0 0 2px var(--gap),
			0 0 0 3px var(--vine);
	}

	.fill {
		position: relative;
		height: 100%;
		min-width: 9px;
		background: linear-gradient(
			180deg,
			color-mix(in srgb, var(--fill) 50%, #fff) 0 3px,
			var(--fill) 3px calc(100% - 3px),
			color-mix(in srgb, var(--fill) 62%, #000) calc(100% - 3px) 100%
		);
		box-shadow: 0 0 8px color-mix(in srgb, var(--fill) var(--glow-amt), transparent);
		transition: width 0.5s steps(5, end);
	}

	/* Cut the fill into blocks. */
	.fill::after {
		content: '';
		position: absolute;
		inset: 0;
		background: repeating-linear-gradient(90deg, transparent 0 9px, var(--well) 9px 12px);
	}
</style>
