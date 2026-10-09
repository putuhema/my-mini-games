<!-- 12×12 pixel portraits for the bench. -->
<script lang="ts">
	let {
		who,
		size = 72,
		speaking = false
	}: { who: 'judge' | 'defense' | 'prosecution'; size?: number; speaking?: boolean } = $props();

	const JUDGE = [
		'...wwwwww...',
		'..wwwwwwww..',
		'..wwssssww..',
		'..wskssksw..',
		'..wssssssw..',
		'..wwsmmsww..',
		'..ww.ss.ww..',
		'.bbbwwwwbbb.',
		'bbbbbwwbbbbb',
		'bbbbbbbbbbbb',
		'bbbbbbbbbbbb',
		'bbbbbbbbbbbb'
	];
	const COUNSEL = [
		'....hhhh....',
		'...hhhhhh...',
		'..hhsssshh..',
		'..hskssksh..',
		'..hssssssh..',
		'...ssmmss...',
		'....ssss....',
		'..ccwttwcc..',
		'.cccwttwccc.',
		'cccccttccccc',
		'cccccttccccc',
		'cccccccccccc'
	];

	const PALETTE: Record<string, Record<string, string>> = {
		judge: { w: 'var(--ink)', s: 'var(--parchment)', k: 'var(--void)', m: 'var(--bark)', b: 'var(--night-3)' },
		defense: { h: 'var(--stone-dk)', s: 'var(--parchment)', k: 'var(--void)', m: 'var(--bark)', c: 'var(--def-deep)', t: 'var(--def)', w: 'var(--ink)' },
		prosecution: { h: 'var(--bark)', s: 'var(--parchment)', k: 'var(--void)', m: 'var(--bark)', c: 'var(--atk-deep)', t: 'var(--atk)', w: 'var(--ink)' }
	};

	const pixels = $derived(
		(who === 'judge' ? JUDGE : COUNSEL).flatMap((row, y) =>
			[...row].flatMap((ch, x) => (ch === '.' ? [] : [{ x, y, fill: PALETTE[who][ch] }]))
		)
	);
</script>

<svg
	class:speaking
	width={size}
	height={size}
	viewBox="0 0 12 12"
	shape-rendering="crispEdges"
	role="img"
	aria-label={who}
>
	{#each pixels as p (`${p.x},${p.y}`)}
		<rect x={p.x} y={p.y} width="1" height="1" fill={p.fill} />
	{/each}
</svg>

<style>
	svg {
		display: block;
	}
	.speaking {
		animation: talk 600ms steps(2) infinite;
	}
	@keyframes talk {
		50% {
			transform: translateY(-3px);
		}
	}
</style>
