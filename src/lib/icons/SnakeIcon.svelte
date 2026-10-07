<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import type HeartIcon from 'phosphor-svelte/lib/HeartIcon';

	// Same props as Phosphor icons so it can sit in the same registry; weight is ignored.
	let {
		color = 'currentColor',
		size = '1em',
		weight: _weight,
		mirrored: _mirrored,
		children: _children,
		...rest
	}: ComponentProps<typeof HeartIcon> = $props();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width={size}
	height={size}
	viewBox="0 0 256 256"
	fill="none"
	role="img"
	{...rest}
>
	<mask id="snake-eye">
		<rect width="256" height="256" fill="white" />
		<circle cx="196" cy="58" r="11" fill="black" />
	</mask>
	<g mask="url(#snake-eye)">
		<path
			d="M44 212c0-44 84-28 84-80s76-40 68-74"
			stroke={color}
			stroke-width="34"
			stroke-linecap="round"
		/>
		<circle cx="190" cy="62" r="36" fill={color} />
	</g>
</svg>
