<script lang="ts">
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import { PUBLIC_CONVEX_URL } from '$app/env/public';
	import { setupConvex } from 'convex-svelte';
	import { unlockAudio } from '#lib/sound.svelte.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	setupConvex(PUBLIC_CONVEX_URL);
	unlockAudio();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Us, Apart · mini games for two</title>
</svelte:head>

{@render children()}
