<script lang="ts">
	import { Badge, Button, Card, Sprite } from '#lib/ui/index.ts';
	import {
		BombIcon,
		HamburgerIcon,
		PaintBrushIcon,
		QuestionIcon,
		SnakeIcon,
		TargetIcon
	} from '#lib/icons/index.ts';

	const games = [
		{
			href: '/snakes-ladders',
			icon: SnakeIcon,
			color: 'green',
			title: 'Snakes & Ladders',
			blurb: 'Race to tile 50. Every square is a question for you to answer together.',
			ready: true
		},
		{
			href: '/bomb-defusal',
			icon: BombIcon,
			color: 'red',
			title: 'Bomb Defusal',
			blurb: 'One sees the bomb, one has the manual. Talk fast or explode.',
			ready: true
		},
		{
			href: '/burger',
			icon: HamburgerIcon,
			color: 'orange',
			title: 'Burger for Two',
			blurb: 'Burgers, sate ayam, mie ayam. One takes the orders, one cooks blind. Talk fast.',
			ready: true
		},
	];
</script>

<header class="topbar">
	<a href="/" class="logo">us, apart</a>
	<nav class="nav">
		<a href="/design" class="design-link">Design system</a>
	</nav>
</header>

<main>
	<section class="hero">
		<div class="mascot" aria-hidden="true">
			<span class="glow one"></span>
			<span class="glow two"></span>
			<span class="sprite one"><Sprite name="heart" scale={14} /></span>
			<span class="sprite two"><Sprite name="heartMint" scale={11} /></span>
			<span class="spark s1"></span>
			<span class="spark s2"></span>
			<span class="spark s3"></span>
			<span class="spark s4"></span>
		</div>
		<div class="pitch">
			<p class="eyebrow blink">▸ Mini games for two</p>
			<h1>The fun, cosy way to stay close — wherever you are.</h1>
			<div class="ctas">
				<Button href="/snakes-ladders" size="lg" full>Start playing</Button>
				<Button href="/snakes-ladders" variant="outline" size="lg" full>I have a room code</Button>
			</div>
		</div>
	</section>

	<section>
		<h2 class="section-title">Games for two</h2>
		<ul class="games">
			{#each games as game (game.title)}
				<li>
					{#if game.ready}
						<Card href={game.href} class="game">
							<span class="icon" style="--c: var(--{game.color}); --c-light: var(--{game.color}-light)">
								<game.icon weight="fill" size="2rem" />
							</span>
							<h3>{game.title}</h3>
							<p class="muted">{game.blurb}</p>
							<Badge color="green" solid>Play now</Badge>
						</Card>
					{:else}
						<Card class="game soon">
							<span class="icon" style="--c: var(--{game.color}); --c-light: var(--{game.color}-light)">
								<game.icon weight="fill" size="2rem" />
							</span>
							<h3>{game.title}</h3>
							<p class="muted">{game.blurb}</p>
							<Badge color="neutral">Coming soon</Badge>
						</Card>
					{/if}
				</li>
			{/each}
		</ul>
	</section>
</main>

<style>
	.topbar {
		max-width: 1080px;
		margin: 0 auto;
		padding: 1.25rem 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.logo {
		font-size: 2.4rem;
		line-height: 1;
		color: var(--dew);
		text-decoration: none;
		letter-spacing: 0.04em;
		text-shadow:
			-2px 2px var(--pink),
			2px -2px var(--mint);
	}

	.nav {
		display: flex;
		align-items: center;
		gap: 1.25rem;
	}

	.design-link {
		font-size: 1rem;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		color: var(--sage);
		text-decoration: none;
	}

	.design-link:hover {
		color: var(--mint);
	}

	main {
		max-width: 1080px;
		margin: 0 auto;
		padding: 0 1.5rem 4rem;
	}

	.hero {
		display: grid;
		grid-template-columns: 1fr 1fr;
		align-items: center;
		gap: 3rem;
		padding: 2.5rem 0 3.5rem;
		border-bottom: 2px dashed color-mix(in srgb, var(--sage) 36%, transparent);
		margin-bottom: 3rem;
	}

	/* Two fireflies: pink for one of you, mint for the other. */
	.mascot {
		position: relative;
		justify-self: center;
		width: min(340px, 70vw);
		aspect-ratio: 1;
	}

	.glow {
		position: absolute;
		width: 60%;
		aspect-ratio: 1;
		background: radial-gradient(circle, var(--c) 0%, transparent 65%);
		opacity: 0.35;
	}

	.glow.one {
		--c: var(--glow-pink);
		left: 4%;
		top: 22%;
	}

	.glow.two {
		--c: var(--glow-mint);
		right: 2%;
		top: 6%;
	}

	.sprite {
		position: absolute;
		animation: bob 3s steps(4, end) infinite;
	}

	.sprite.one {
		left: 14%;
		top: 36%;
	}

	.sprite.two {
		right: 12%;
		top: 18%;
		animation-delay: 0.5s;
	}

	.spark {
		position: absolute;
		width: 6px;
		height: 6px;
		background: var(--amber);
		box-shadow: 0 0 10px var(--glow-amber);
		animation: px-blink 1.6s steps(2, end) infinite;
	}

	.s1 {
		left: 10%;
		top: 18%;
	}

	.s2 {
		right: 18%;
		bottom: 22%;
		animation-delay: 0.4s;
	}

	.s3 {
		left: 46%;
		top: 8%;
		animation-delay: 0.8s;
	}

	.s4 {
		left: 30%;
		bottom: 10%;
		animation-delay: 1.2s;
	}

	@keyframes bob {
		50% {
			transform: translateY(-12px);
		}
	}

	.eyebrow {
		margin: 0 0 1rem;
		text-align: center;
		color: var(--mint);
		font-size: 1rem;
		letter-spacing: 0.24em;
		text-transform: uppercase;
		text-shadow: 0 0 8px var(--glow-mint);
	}

	.pitch h1 {
		font-size: clamp(2.2rem, 5vw, 3.2rem);
		line-height: 1;
		text-align: center;
		margin-bottom: 2.25rem;
	}

	.ctas {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		max-width: 340px;
		margin: 0 auto;
	}

	.section-title {
		font-size: 2rem;
		text-transform: uppercase;
		margin-bottom: 1.5rem;
	}

	.games {
		list-style: none;
		padding: 4px;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1.5rem;
	}

	.games li {
		display: flex;
	}

	:global(.card.game) {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.6rem;
	}

	:global(.card.soon) {
		opacity: 0.55;
	}

	.icon {
		width: 3.4rem;
		height: 3.4rem;
		display: grid;
		place-items: center;
		margin-bottom: 0.25rem;
		background: var(--c-light);
		color: var(--c);
		box-shadow: 0 0 0 2px var(--c);
		filter: drop-shadow(0 0 8px color-mix(in srgb, var(--c) var(--glow-amt), transparent));
	}

	.games h3 {
		font-size: 1.6rem;
	}

	.games p {
		margin: 0;
		flex: 1;
		font-size: 1.1rem;
		line-height: 1.25;
	}

	@media (max-width: 760px) {
		.hero {
			grid-template-columns: 1fr;
			gap: 1.5rem;
			padding-top: 1rem;
		}

		.mascot {
			width: min(240px, 60vw);
		}
	}
</style>
