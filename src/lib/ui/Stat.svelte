<script lang="ts">
	import type { Icon as IconType } from '../icons/index.ts';

	let {
		icon: Icon,
		value,
		color = 'eel',
		label
	}: {
		icon: IconType;
		value: string | number;
		/** Colour token for the number, e.g. 'orange' for streaks. */
		color?: string;
		label: string;
	} = $props();
</script>

<span class="stat" style="--c: var(--{color})" title={label} aria-label="{label}: {value}">
	<span class="icon" aria-hidden="true"><Icon weight="fill" size="1.5rem" /></span>
	<span class="value">{value}</span>
</span>

<style>
	.stat {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.3rem 0.5rem;
		font-size: 1.35rem;
		line-height: 1;
		color: var(--c);
		text-shadow: 0 0 10px color-mix(in srgb, var(--c) var(--glow-amt), transparent);
		font-variant-numeric: tabular-nums;
	}

	.icon {
		display: inline-flex;
		filter: drop-shadow(0 0 6px color-mix(in srgb, var(--c) var(--glow-amt), transparent));
	}
</style>
