<script lang="ts">
	import MoonIcon from 'phosphor-svelte/lib/MoonIcon';
	import SunIcon from 'phosphor-svelte/lib/SunIcon';
	import { theme, toggleTheme } from '../theme.svelte.ts';

	const day = $derived(theme.current === 'day');
</script>

<!-- Switches between night (default) and day. -->
<button
	type="button"
	class="toggle"
	onclick={toggleTheme}
	aria-label={day ? 'Switch to night theme' : 'Switch to day theme'}
	title={day ? 'Night' : 'Day'}
>
	{#if day}<MoonIcon weight="fill" size="1.2rem" />{:else}<SunIcon weight="fill" size="1.2rem" />{/if}
</button>

<style>
	.toggle {
		--frame: var(--vine);
		display: grid;
		place-items: center;
		width: 40px;
		height: 36px;
		padding: 0;
		border: none;
		background: var(--moss);
		color: var(--sage);
		box-shadow:
			0 0 0 2px var(--gap),
			0 0 0 4px var(--frame),
			0 var(--depth) 0 4px var(--root);
		cursor: pointer;
		transition: transform 0.1s var(--snap);
	}

	@media (hover: hover) {
		.toggle:hover {
			--frame: var(--mint);
			color: var(--amber);
		}
	}

	.toggle:active {
		transform: translateY(3px);
	}
</style>
