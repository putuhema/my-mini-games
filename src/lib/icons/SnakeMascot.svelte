<script lang="ts">
	let { size = 96 }: { size?: number } = $props();
</script>

<!-- Friendly snake mascot in the board's colours. -->
<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
	<path
		d="M18 104c0-22 42-14 42-40s36-20 34-38"
		fill="none"
		stroke="var(--green)"
		stroke-width="18"
		stroke-linecap="round"
	/>
	<path
		d="M18 104c0-22 42-14 42-40s36-20 34-38"
		fill="none"
		stroke="#89e219"
		stroke-width="6"
		stroke-dasharray="3 9"
		stroke-linecap="round"
	/>
	<path d="M96 46 l4 10 m-4 -10 l-6 9" stroke="var(--red)" stroke-width="3" stroke-linecap="round" />
	<circle cx="92" cy="28" r="20" fill="var(--green-shade)" />
	<circle cx="84" cy="25" r="7" fill="var(--snow)" />
	<circle cx="100" cy="25" r="7" fill="var(--snow)" />
	<circle cx="85.5" cy="26.5" r="3.4" fill="var(--eel)" />
	<circle cx="101.5" cy="26.5" r="3.4" fill="var(--eel)" />
	<ellipse cx="80" cy="36" rx="4" ry="2.4" fill="var(--pink)" opacity="0.6" />
	<ellipse cx="104" cy="36" rx="4" ry="2.4" fill="var(--pink)" opacity="0.6" />
</svg>
