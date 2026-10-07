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
		padding: 0.35rem 0.6rem;
		border-radius: var(--radius-sm);
		font-weight: 900;
		font-size: 1rem;
		color: var(--c);
	}

	.icon {
		display: inline-flex;
	}
</style>
