<script lang="ts">
	import { icon } from './art';
	import type { Img } from './pixels';

	let {
		img,
		name,
		scale = 3,
		trim = false,
		label
	}: {
		img?: Img;
		/** An item icon from art.ts, instead of `img`. */
		name?: string;
		/** Screen pixels per art pixel. Keep it whole. */
		scale?: number;
		/** Crop away the empty space around the drawing (cat sprites have plenty). */
		trim?: boolean;
		label?: string;
	} = $props();

	const src = $derived(img ?? icon(name ?? 'sparkle'));

	const box = $derived.by(() => {
		if (!trim) return { x: 0, y: 0, w: src.w, h: src.h };
		let x0 = src.w;
		let y0 = src.h;
		let x1 = -1;
		let y1 = -1;
		for (let y = 0; y < src.h; y++)
			for (let x = 0; x < src.w; x++)
				if (src.mask[y * src.w + x]) {
					x0 = Math.min(x0, x);
					y0 = Math.min(y0, y);
					x1 = Math.max(x1, x);
					y1 = Math.max(y1, y);
				}
		return x1 < 0 ? { x: 0, y: 0, w: src.w, h: src.h } : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
	});
</script>

<span
	class="pixel"
	style="width: {box.w * scale}px; height: {box.h * scale}px"
	role={label ? 'img' : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : 'true'}
>
	<img
		src={src.url}
		width={src.w * scale}
		height={src.h * scale}
		alt=""
		style="margin: {-box.y * scale}px 0 0 {-box.x * scale}px"
		draggable="false"
	/>
</span>

<style>
	.pixel {
		display: block;
		flex-shrink: 0;
		overflow: hidden;
	}

	img {
		display: block;
		max-width: none;
		image-rendering: pixelated;
	}
</style>
