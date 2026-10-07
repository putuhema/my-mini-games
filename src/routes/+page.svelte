<script lang="ts">
	import { Badge, Button, Card } from '#lib/ui/index.ts';
	import {
		BombIcon,
		HeartIcon,
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
			icon: QuestionIcon,
			color: 'purple',
			title: 'Would You Rather',
			blurb: 'Pick at the same time, then compare.',
			ready: false
		},
		{
			icon: TargetIcon,
			color: 'orange',
			title: 'Guess My Answer',
			blurb: 'How well do you really know each other?',
			ready: false
		},
		{
			icon: PaintBrushIcon,
			color: 'blue',
			title: 'Draw Together',
			blurb: 'One shared canvas, two cities.',
			ready: false
		}
	];
</script>

<header class="topbar">
	<a href="/" class="logo">us, apart</a>
	<a href="/design" class="design-link">Design system</a>
</header>

<main>
	<section class="hero">
		<div class="mascot" aria-hidden="true">
			<span class="blob"></span>
			<span class="heart one"><HeartIcon weight="fill" size="100%" /></span>
			<span class="heart two"><HeartIcon weight="fill" size="100%" /></span>
		</div>
		<div class="pitch">
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
		font-size: 2rem;
		font-weight: 900;
		color: var(--green);
		text-decoration: none;
		letter-spacing: -0.03em;
	}

	.design-link {
		font-weight: 800;
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--hare);
		text-decoration: none;
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
		padding: 3rem 0 4rem;
		border-bottom: var(--border) solid var(--swan);
		margin-bottom: 3rem;
	}

	.mascot {
		position: relative;
		justify-self: center;
		width: min(340px, 70vw);
		aspect-ratio: 1;
		display: grid;
		place-items: center;
	}

	.blob {
		position: absolute;
		inset: 0;
		border-radius: 46% 54% 52% 48% / 50% 44% 56% 50%;
		background: var(--green-light);
		animation: morph 8s ease-in-out infinite;
	}

	.heart {
		position: absolute;
		display: flex;
		filter: drop-shadow(0 6px 0 rgba(0, 0, 0, 0.12));
	}

	.heart.one {
		width: 46%;
		left: 18%;
		top: 30%;
		color: var(--pink);
		rotate: -12deg;
		animation: bob 3s ease-in-out infinite;
	}

	.heart.two {
		width: 36%;
		right: 16%;
		top: 22%;
		color: var(--blue);
		rotate: 14deg;
		animation: bob 3s 0.4s ease-in-out infinite;
	}

	@keyframes morph {
		50% {
			border-radius: 54% 46% 44% 56% / 46% 56% 44% 54%;
		}
	}

	@keyframes bob {
		50% {
			transform: translateY(-10px) rotate(-4deg);
		}
	}

	.pitch h1 {
		font-size: clamp(1.8rem, 4vw, 2.5rem);
		line-height: 1.25;
		text-align: center;
		margin-bottom: 2rem;
	}

	.ctas {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
		max-width: 340px;
		margin: 0 auto;
	}

	.section-title {
		font-size: 1.6rem;
		margin-bottom: 1.25rem;
	}

	.games {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1rem;
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
		opacity: 0.65;
	}

	.icon {
		width: 3.4rem;
		height: 3.4rem;
		display: grid;
		place-items: center;
		border-radius: var(--radius);
		background: var(--c-light);
		color: var(--c);
		box-shadow: inset 0 calc(var(--depth) * -1) 0 color-mix(in srgb, var(--c) 30%, transparent);
	}

	.games h3 {
		font-size: 1.2rem;
	}

	.games p {
		margin: 0;
		flex: 1;
		line-height: 1.5;
	}

	@media (max-width: 760px) {
		.hero {
			grid-template-columns: 1fr;
			gap: 1.5rem;
			padding-top: 1rem;
		}
	}
</style>
