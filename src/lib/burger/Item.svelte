<svelte:options namespace="svg" />

<script lang="ts">
	// One plate or bowl component (sate, sauces, noodles, toppings…), drawn in a 40×40 box.
	// Used on its own as a tile icon (ItemIcon.svelte) and placed on plates and bowls.
	import { layerColors, type Layer } from '../../../convex/burger/ingredients';

	let {
		layer,
		x = 0,
		y = 0,
		size = 40,
		rotate = 0
	}: { layer: Layer; x?: number; y?: number; size?: number; rotate?: number } = $props();

	const [main, accent] = $derived(layerColors(layer));
	const raw = $derived(layer.state === 'raw');
	const over = $derived(layer.state === 'burnt');
</script>

<g transform="translate({x} {y}) scale({size / 40}) rotate({rotate} 20 20)">
	{#if layer.ing === 'sate'}
		<line x1="2" y1="36" x2="38" y2="4" stroke="#d9b97a" stroke-width="2.2" stroke-linecap="round" />
		{#each [0, 1, 2, 3] as i (i)}
			<rect
				x={8 + i * 6.5}
				y={23 - i * 5.8}
				width="7"
				height="7"
				rx="1.5"
				fill={main}
				stroke={accent}
				stroke-width="1.2"
				transform="rotate(-41 {11.5 + i * 6.5} {26.5 - i * 5.8})"
			/>
		{/each}
		{#if !raw && !over}
			<path d="M10,25 l3,-3 M17,19 l3,-3 M23,13 l3,-3" stroke="#3b1c08" stroke-width="1" />
		{/if}
	{:else if layer.ing === 'peanut_sauce'}
		<path d="M5,24 C5,15 14,13 20,14 C28,12 36,16 35,24 C35,31 26,33 20,32 C12,34 5,31 5,24 Z" fill={main} />
		<path d="M11,21 q4,-3 9,-1" stroke="#d99a5a" stroke-width="2" fill="none" stroke-linecap="round" />
		<circle cx="25" cy="26" r="1.3" fill={accent} /><circle cx="15" cy="27" r="1" fill={accent} />
	{:else if layer.ing === 'kecap'}
		<path d="M4,20 q4,-6 8,0 t8,0 t8,0 t8,0" stroke={main} stroke-width="3.5" fill="none" stroke-linecap="round" />
		<path d="M8,18 q2,-2 4,-1" stroke="#7a5a44" stroke-width="1" fill="none" />
	{:else if layer.ing === 'sambal'}
		<path d="M10,28 C8,20 14,13 20,12 C27,12 32,19 30,27 C28,33 13,34 10,28 Z" fill={main} />
		<path d="M14,20 q3,-4 7,-3" stroke="#ff7a62" stroke-width="2" fill="none" stroke-linecap="round" />
		{#each [[16, 25], [22, 23], [25, 28], [19, 29]] as [cx, cy] (`${cx}${cy}`)}
			<ellipse {cx} {cy} rx="1.4" ry="0.9" fill="#ffd27a" />
		{/each}
	{:else if layer.ing === 'fried_shallot'}
		{#each [[8, 14, 20], [16, 10, -30], [24, 15, 50], [31, 11, 10], [12, 24, -60], [20, 22, 30], [28, 25, -10], [17, 30, 70], [26, 32, 0]] as [cx, cy, r] (`${cx}${cy}`)}
			<path d="M{cx - 3},{cy} q3,-3 6,0" stroke={main} stroke-width="2.4" fill="none" stroke-linecap="round" transform="rotate({r} {cx} {cy})" />
		{/each}
	{:else if layer.ing === 'shallot'}
		{#each [[12, 16], [26, 14], [19, 27]] as [cx, cy] (`${cx}${cy}`)}
			<path d="M{cx - 7},{cy} a7,7 0 0 1 14,0" fill="none" stroke={main} stroke-width="2.5" />
			<path d="M{cx - 4},{cy} a4,4 0 0 1 8,0" fill="none" stroke={accent} stroke-width="1.8" />
		{/each}
	{:else if layer.ing === 'lime'}
		<path d="M5,26 A15,15 0 0 1 35,26 Z" fill={accent} />
		<path d="M8,26 A12,12 0 0 1 32,26 Z" fill={main} />
		<path d="M20,26 L12,17 M20,26 L20,15 M20,26 L28,17" stroke="#e6f7c4" stroke-width="1.4" />
	{:else if layer.ing === 'cucumber'}
		{#each [[12, 15], [27, 17], [19, 28]] as [cx, cy] (`${cx}${cy}`)}
			<circle {cx} {cy} r="8" fill={accent} />
			<circle {cx} {cy} r="6.6" fill={main} />
			<circle cx={cx - 1.5} cy={cy - 1} r="0.9" fill="#f4fbe9" /><circle cx={cx + 2} cy={cy + 1} r="0.9" fill="#f4fbe9" />
		{/each}
	{:else if layer.ing === 'lontong'}
		<!-- One piece: a short cylinder with its cut face showing. -->
		<path d="M12,14 L28,14 L28,30 L12,30 Z" fill={main} />
		<path d="M12,14 L12,30 M28,14 L28,30" stroke={accent} stroke-width="2.5" />
		<ellipse cx="20" cy="30" rx="8" ry="3.5" fill={main} stroke={accent} stroke-width="2" />
		<ellipse cx="20" cy="14" rx="8" ry="3.5" fill="#fbfcf3" stroke={accent} stroke-width="2" />
		<circle cx="18" cy="14" r="0.8" fill="#d9dccb" /><circle cx="22" cy="14.5" r="0.8" fill="#d9dccb" />
	{:else if layer.ing === 'soup'}
		<path d="M4,18 L36,18 C35,30 28,35 20,35 C12,35 5,30 4,18 Z" fill="#f4efe6" stroke="#cfc6b6" stroke-width="1.5" />
		<ellipse cx="20" cy="18" rx="16" ry="4.5" fill={main} stroke="#cfc6b6" stroke-width="1.5" />
		<circle cx="15" cy="18" r="1.5" fill="#6fcf3c" /><circle cx="24" cy="17" r="1.2" fill="#ff9a4d" />
		<path d="M14,12 q-2,-3 0,-6 M20,11 q-2,-3 0,-6 M26,12 q-2,-3 0,-6" stroke="#cfd8d3" stroke-width="1.4" fill="none" stroke-linecap="round" />
	{:else if layer.ing === 'noodles'}
		{#each [12, 17, 22, 27] as yy, i (yy)}
			{#if raw}
				<path d="M5,{yy} L35,{yy - 2}" stroke={i % 2 ? accent : main} stroke-width="2.4" stroke-linecap="round" />
			{:else}
				<path
					d="M4,{yy} q4,{over ? 6 : -4} 8,0 t8,0 t8,0 t8,0"
					stroke={i % 2 ? accent : main}
					stroke-width={over ? 4 : 2.6}
					fill="none"
					stroke-linecap="round"
				/>
			{/if}
		{/each}
	{:else if layer.ing === 'chicken_topping'}
		{#each [[9, 20, 10], [17, 14, -15], [24, 21, 20], [14, 26, -5], [27, 13, 30], [21, 28, 15]] as [cx, cy, r] (`${cx}${cy}`)}
			<rect x={cx - 4} y={cy - 4} width="8" height="8" rx="1.8" fill={main} stroke={accent} stroke-width="1" transform="rotate({r} {cx} {cy})" />
		{/each}
		<path d="M12,17 l2,-1 M22,18 l2,-1" stroke="#d99a5a" stroke-width="1" />
	{:else if layer.ing === 'bok_choy'}
		<path d="M20,36 C10,30 6,18 12,8 C18,10 21,22 20,36 Z" fill={main} />
		<path d="M20,36 C30,30 34,18 28,8 C22,10 19,22 20,36 Z" fill={main} />
		<path d="M20,36 L14,12 M20,36 L26,12" stroke={accent} stroke-width="2.2" stroke-linecap="round" />
	{:else if layer.ing === 'meatball'}
		<circle cx="20" cy="21" r="12" fill={main} stroke={accent} stroke-width="1.5" />
		<ellipse cx="16" cy="16" rx="4" ry="2.5" fill="#fff" fill-opacity="0.35" />
		<circle cx="23" cy="25" r="1.2" fill={accent} /><circle cx="17" cy="26" r="1" fill={accent} />
	{:else if layer.ing === 'wonton'}
		<path d="M6,26 C8,14 14,10 20,10 C26,10 32,14 34,26 C28,30 12,30 6,26 Z" fill={main} stroke={accent} stroke-width="1.5" />
		<path d="M10,24 q2,-3 4,0 t4,0 t4,0 t4,0 t4,0" stroke={accent} stroke-width="1.2" fill="none" />
		<path d="M16,16 q4,-3 8,0" stroke="#fff4d6" stroke-width="1.5" fill="none" />
	{:else if layer.ing === 'green_onion'}
		{#each [[10, 12], [22, 9], [30, 18], [15, 22], [26, 28], [11, 31], [20, 18]] as [cx, cy] (`${cx}${cy}`)}
			<circle {cx} {cy} r="3" fill="none" stroke={main} stroke-width="1.8" />
		{/each}
	{:else if layer.ing === 'broth'}
		<path d="M20,6 C26,15 30,20 30,25 A10,10 0 0 1 10,25 C10,20 14,15 20,6 Z" fill={main} stroke={accent} stroke-width="1.5" />
		<ellipse cx="16" cy="24" rx="2.5" ry="3.5" fill="#fff" fill-opacity="0.4" />
	{:else}
		<circle cx="20" cy="20" r="12" fill={main} stroke={accent} stroke-width="2" />
	{/if}
</g>
