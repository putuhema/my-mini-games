<script lang="ts">
	// One burger layer, drawn flat in SVG from its shape and colours (see convex/burger/ingredients.ts).
	import { ingredient, layerColors, type Layer } from '../../../convex/burger/ingredients';

	let {
		layer,
		crop = false,
		class: className = ''
	}: {
		layer: Layer;
		/** Show just the middle of the layer, larger: for small thumbnails. */
		crop?: boolean;
		class?: string;
	} = $props();

	const ing = $derived(ingredient(layer.ing));
	const [main, accent] = $derived(layerColors(layer));
	const h = $derived(ing.height ?? 20);
	const seeds = [
		[52, 16, -20],
		[78, 10, 10],
		[104, 14, -5],
		[130, 9, 25],
		[150, 18, -15],
		[66, 26, 30],
		[118, 25, 0],
		[92, 22, 15]
	];
	/** Wavy edge along the bottom of lettuce and sauces. */
	function wave(y: number, amp: number, n: number, x0 = 4, x1 = 196) {
		const step = (x1 - x0) / n;
		let d = `M${x0},${y}`;
		for (let i = 0; i < n; i++) d += ` q${step / 2},${i % 2 ? -amp : amp} ${step},0`;
		return d;
	}
</script>

<svg
	viewBox="{crop ? 50 : 0} 0 {crop ? 100 : 200} {h}"
	class="ingredient {className}"
	style="aspect-ratio: {crop ? 100 : 200} / {h}"
	role="img"
	aria-label={layer.state ? `${ing.label} (${layer.state})` : ing.label}
>
	{#if ing.shape === 'bunTop'}
		<path d="M6,{h - 4} C6,6 194,6 194,{h - 4} Q194,{h} 186,{h} L14,{h} Q6,{h} 6,{h - 4} Z" fill={main} />
		<path d="M6,{h - 6} Q100,{h - 2} 194,{h - 6} L194,{h - 4} Q194,{h} 186,{h} L14,{h} Q6,{h} 6,{h - 4} Z" fill={accent} />
		<path d="M40,18 Q70,8 100,9" stroke="#fff" stroke-opacity="0.35" stroke-width="5" fill="none" stroke-linecap="round" />
		{#each seeds as [x, y, rot] (x)}
			<ellipse cx={x} cy={y} rx="4" ry="2" fill="#fff4d6" transform="rotate({rot} {x} {y})" />
		{/each}
	{:else if ing.shape === 'bunBottom'}
		<path d="M6,2 L194,2 L194,{h - 12} Q194,{h - 2} 180,{h - 2} L20,{h - 2} Q6,{h - 2} 6,{h - 12} Z" fill={main} />
		<rect x="6" y="2" width="188" height="7" rx="3" fill="#ffe2a8" />
		<path d="M10,{h - 8} Q100,{h} 190,{h - 8}" stroke={accent} stroke-width="5" fill="none" stroke-linecap="round" />
	{:else if ing.shape === 'patty'}
		<rect x="10" y="2" width="180" height={h - 4} rx="11" fill={main} />
		<rect x="10" y={h - 11} width="180" height="7" rx="4" fill={accent} />
		{#if layer.state === 'cooked'}
			{#each [40, 75, 110, 145] as x (x)}
				<path d="M{x},6 l18,10" stroke={accent} stroke-width="3.5" stroke-linecap="round" />
			{/each}
		{:else if layer.state === 'raw'}
			{#each [[40, 9], [70, 15], [104, 8], [130, 14], [160, 9]] as [x, y] (x)}
				<circle cx={x} cy={y} r="2.5" fill="#fff" fill-opacity="0.55" />
			{/each}
		{:else if layer.state === 'burnt'}
			{#each [[50, 9], [96, 13], [148, 8]] as [x, y] (x)}
				<circle cx={x} cy={y} r="4" fill="#000" fill-opacity="0.5" />
			{/each}
		{/if}
	{:else if ing.shape === 'slice'}
		<path
			d="M2,1 L198,1 L198,6 L178,6 L170,{h} L162,6 L120,6 L110,{h - 1} L100,6 L48,6 L40,{h} L32,6 L2,6 Z"
			fill={main}
			stroke={accent}
			stroke-width="1.5"
			stroke-linejoin="round"
		/>
	{:else if ing.shape === 'leaf'}
		<path d="{wave(h - 4, 5, 10, 0, 200)} L200,3 Q100,-1 0,3 Z" fill={main} />
		<path d={wave(h - 6, 4, 10, 6, 194)} stroke={accent} stroke-width="2.5" fill="none" />
	{:else if ing.shape === 'discs'}
		{#each [30, 70, 110, 150, 175] as x, i (x)}
			{#if i < 4 || layer.ing === 'pickles'}
				<ellipse cx={x} cy={h / 2} rx={layer.ing === 'pickles' ? 20 : 26} ry={h / 2 - 0.5} fill={accent} />
				<ellipse cx={x} cy={h / 2 - 1} rx={layer.ing === 'pickles' ? 16 : 22} ry={h / 2 - 2.5} fill={main} />
				{#if layer.ing === 'tomato'}
					<circle cx={x - 8} cy={h / 2 - 1} r="2" fill="#ffd0c4" />
					<circle cx={x + 8} cy={h / 2 - 1} r="2" fill="#ffd0c4" />
				{/if}
			{/if}
		{/each}
	{:else if ing.shape === 'rings'}
		{#each [34, 76, 120, 162] as x (x)}
			<ellipse cx={x} cy={h / 2} rx="24" ry={h / 2 - 1.5} fill="none" stroke={accent} stroke-width="3" />
			<ellipse cx={x} cy={h / 2} rx="17" ry={h / 2 - 3.5} fill="none" stroke={main} stroke-width="2" />
		{/each}
	{:else if ing.shape === 'strips'}
		<path d={wave(4, 3, 8, 8, 192)} stroke={main} stroke-width="5" fill="none" stroke-linecap="round" />
		<path d={wave(h / 2, 3, 8, 8, 192)} stroke={accent} stroke-width="3" fill="none" stroke-linecap="round" />
		<path d={wave(h - 4, 3, 8, 8, 192)} stroke={main} stroke-width="5" fill="none" stroke-linecap="round" />
	{:else if ing.shape === 'egg'}
		<path d="M14,{h - 2} C4,{h - 8} 20,1 60,3 C90,0 120,4 150,2 C186,1 198,{h - 6} 186,{h - 2} Z" fill={main} stroke="#efe6d2" stroke-width="1.5" />
		<ellipse cx="100" cy={h / 2} rx="20" ry={h / 2 - 2} fill={accent} />
		<ellipse cx="94" cy={h / 2 - 2} rx="6" ry="2.5" fill="#fff" fill-opacity="0.6" />
	{:else if ing.shape === 'sauce'}
		<path d={wave(h / 2, h / 2 - 2, 9, 12, 188)} stroke={main} stroke-width="5" fill="none" stroke-linecap="round" />
		<circle cx="60" cy={h - 2} r="2" fill={accent} />
		<circle cx="140" cy={h - 1.5} r="1.6" fill={accent} />
	{/if}
</svg>

<style>
	.ingredient {
		display: block;
		width: 100%;
		height: auto;
		overflow: visible;
	}
</style>
