<script lang="ts">
	import Dice3D from '#lib/snakes/Dice3D.svelte';
	import { Badge, Button, Card, ChoiceTile, ProgressBar, Stat, ThemeToggle, Toast } from '#lib/ui/index.ts';
	import {
		CATEGORY_ICON,
		ChatCircleDotsIcon,
		FireIcon,
		FlagCheckeredIcon,
		LadderSimpleIcon,
		REACTION_ICON,
		SnakeIcon,
		StarIcon
	} from '#lib/icons/index.ts';
	import { CATEGORY_META, REACTIONS, type Category, type Reaction } from '../../../convex/board';
	import SnakeMascot from '#lib/icons/SnakeMascot.svelte';
	import { sfx } from '#lib/sound.svelte.ts';

	const sounds: { name: string; play: () => void }[] = [
		{ name: 'Dice', play: sfx.dice },
		{ name: 'Hops', play: () => [0, 1, 2, 3].forEach((n) => setTimeout(() => sfx.step(n), n * 300)) },
		{ name: 'Ladder', play: sfx.ladder },
		{ name: 'Snake', play: sfx.snake },
		{ name: 'Bubble', play: sfx.pop },
		{ name: 'Secret', play: sfx.secret },
		{ name: 'Send', play: sfx.send },
		{ name: 'Reaction', play: sfx.reaction },
		{ name: 'Your move', play: sfx.turn },
		{ name: 'Match', play: sfx.match },
		{ name: 'Miss', play: sfx.miss },
		{ name: 'Win', play: sfx.win }
	];

	const families = [
		{ name: 'mint', role: 'Primary · go, success, player 2' },
		{ name: 'pink', role: 'Brand · love, player 1' },
		{ name: 'sky', role: 'Secondary · links, memories' },
		{ name: 'berry', role: 'Danger · errors, snakes' },
		{ name: 'amber', role: 'Rewards · XP, ladders, finish' },
		{ name: 'ember', role: 'Streaks · fun questions' },
		{ name: 'lilac', role: 'Deep talk, secrets' }
	];

	const neutrals = [
		{ name: 'dew', role: 'Headings, primary text' },
		{ name: 'sage', role: 'Body, secondary text' },
		{ name: 'bog', role: 'Disabled, placeholder' },
		{ name: 'vine', role: 'Frame rings, tracks' },
		{ name: 'moss', role: 'Tiles, subtle surfaces' },
		{ name: 'canopy', role: 'Cards' },
		{ name: 'page', role: 'Background' }
	];

	const variants = ['primary', 'secondary', 'super', 'gold', 'danger', 'outline', 'ghost'] as const;

	let progress = $state(32);
	let picked = $state<Reaction>('love');
	let showToast = $state<string | null>(null);
	let diceValue = $state(4);
	let rollKey = $state(0);

	function demoToast(tone: string) {
		showToast = tone;
		setTimeout(() => (showToast = null), 2500);
	}

	const categories = Object.keys(CATEGORY_META) as Category[];
</script>


<header class="topbar">
	<a href="/" class="logo">us, apart</a>
	<nav class="nav">
		<a href="/design/pixel" class="spec-link">Full spec ↗</a>
		<ThemeToggle />
	</nav>
</header>

<main>
	<section class="intro">
		<h1>Design system</h1>
		<p class="muted">
			<b>Night Garden</b>: a retro pixel CRT look with green-black surfaces, firefly glows (pink and
			mint for the two of you), hard pixel frames and stepped motion. Every component on this page is
			the real one. Tokens live in <code>src/app.css</code>, components in <code>src/lib/ui</code>, and
			the full spec is at <a href="/design/pixel">/design/pixel</a>.
		</p>
	</section>

	<!-- Colour -->
	<section>
		<h2>Colour</h2>
		<p class="muted lede">
			Every glow comes as a family: <b>base</b> for text and fills, <b>shade</b> for the lip and
			text on tints, <b>light</b> for tinted surfaces. The older names (green, blue, red, gold, orange,
			purple) still work as aliases.
		</p>
		<div class="families">
			{#each families as f (f.name)}
				<div class="family">
					<div class="swatch base" style="background: var(--{f.name}); box-shadow: 0 var(--depth) 0 var(--{f.name}-shade)">
						<span>{f.name}</span>
					</div>
					<div class="chips">
						<span style="background: var(--{f.name}-shade)">shade</span>
						<span style="background: var(--{f.name}-light); color: var(--{f.name}-shade)">light</span>
					</div>
					<small class="muted">{f.role}</small>
				</div>
			{/each}
		</div>

		<h3>Neutrals</h3>
		<div class="neutrals">
			{#each neutrals as n (n.name)}
				<div class="neutral">
					<span class="dot" style="background: var(--{n.name})"></span>
					<div>
						<strong>{n.name}</strong>
						<small class="muted">{n.role}</small>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- Type -->
	<section>
		<h2>Typography</h2>
		<p class="muted lede">VT323 throughout, a CRT terminal face with a single weight. Size, case and colour do the work.</p>
		<Card>
			<div class="type-scale">
				<div><span class="spec">Display · 40</span><p class="t-display">Stay close, play together</p></div>
				<div><span class="spec">Heading · 24</span><p class="t-h2">Your turn to roll</p></div>
				<div><span class="spec">Question · 20</span><p class="t-q">What song reminds you of me, and why?</p></div>
				<div><span class="spec">Body · 16</span><p>Answer honestly — your partner reacts before the turn passes.</p></div>
				<div><span class="spec">Label · 13 · caps</span><p class="label">Your name</p></div>
				<div><span class="spec">Button · 15 · caps</span><p class="t-button">Send answer</p></div>
			</div>
		</Card>
	</section>

	<!-- Shape -->
	<section>
		<h2>Shape &amp; depth</h2>
		<div class="shapes">
			<Card><strong>radius · 0</strong><p class="muted">No rounded corners anywhere. Edges are pixels.</p></Card>
			<Card><strong>gap · 2</strong><p class="muted">The inner ring that separates a surface from its frame.</p></Card>
			<Card><strong>frame · 4</strong><p class="muted">The ring itself. It lights up mint on hover.</p></Card>
			<Card><strong>depth · 4</strong><p class="muted">The lip under anything pressable. Pressing drops into it.</p></Card>
		</div>
	</section>

	<!-- Buttons -->
	<section>
		<h2>Buttons</h2>
		<p class="muted lede">Bevelled fills with dark text, plus a quiet framed outline. Press to see them drop.</p>
		<div class="row wrap">
			{#each variants as v (v)}
				<Button variant={v}>{v}</Button>
			{/each}
			<Button disabled>disabled</Button>
		</div>
		<div class="row wrap">
			<Button size="sm">Small</Button>
			<Button>Medium</Button>
			<Button size="lg">Large</Button>
		</div>
	</section>

	<!-- Cards -->
	<section>
		<h2>Cards</h2>
		<div class="shapes">
			<Card><strong>Default</strong><p class="muted">Content containers.</p></Card>
			<Card interactive><strong>Interactive</strong><p class="muted">Hover lights the frame; press drops it.</p></Card>
			<Card tone="green"><strong>Tinted · green</strong><p class="muted">Good news, highlights.</p></Card>
			<Card tone="gold"><strong>Tinted · gold</strong><p class="muted">Rewards and stats.</p></Card>
		</div>
	</section>

	<!-- Inputs & choices -->
	<section>
		<h2>Inputs &amp; choices</h2>
		<div class="two">
			<Card>
				<label class="label" for="demo-name">Your name</label>
				<input id="demo-name" placeholder="e.g. Sayang" />
				<label class="label spaced" for="demo-answer">Answer</label>
				<textarea id="demo-answer" placeholder="Type your answer…"></textarea>
			</Card>
			<Card>
				<span class="label">Choice tiles</span>
				<div class="choices">
					{#each REACTIONS as r (r)}
						{@const reaction = REACTION_ICON[r]}
						<ChoiceTile
							class="reaction"
							selected={picked === r}
							aria-label={reaction.label}
							style="color: var(--{reaction.tone})"
							onclick={() => (picked = r)}
						>
							<reaction.icon weight="fill" size="1.9rem" />
						</ChoiceTile>
					{/each}
				</div>
			</Card>
		</div>
	</section>

	<!-- Progress & stats -->
	<section>
		<h2>Progress, stats &amp; badges</h2>
		<div class="two">
			<Card>
				<span class="label">Progress bar</span>
				<div class="stack">
					<ProgressBar value={progress} max={50} color="green" label="Demo" />
					<ProgressBar value={progress} max={50} color="p1" label="Player 1" />
					<ProgressBar value={progress} max={50} color="p2" label="Player 2" />
					<div class="row">
						<Button size="sm" variant="outline" onclick={() => (progress = Math.max(0, progress - 8))}>−8</Button>
						<Button size="sm" variant="outline" onclick={() => (progress = Math.min(50, progress + 8))}>+8</Button>
					</div>
				</div>
			</Card>
			<Card>
				<span class="label">Stats</span>
				<div class="row">
					<Stat icon={FireIcon} value={12} color="orange" label="Day streak" />
					<Stat icon={StarIcon} value={340} color="gold" label="Couple XP" />
					<Stat icon={ChatCircleDotsIcon} value={34} color="blue" label="Answers" />
				</div>
				<span class="label spaced">Badges</span>
				<div class="row wrap">
					{#each categories as c (c)}
						{@const cat = CATEGORY_ICON[c]}
						<Badge color={cat.tone}><cat.icon weight="fill" size="1.1em" /> {CATEGORY_META[c].label}</Badge>
					{/each}
					<Badge color="green" solid>Play now</Badge>
				</div>
			</Card>
		</div>
	</section>

	<!-- Feedback -->
	<section>
		<h2>Feedback</h2>
		<p class="muted lede">
			A small toast drops in from the top when something happens, so it never covers the game
			controls.
		</p>
		<div class="row wrap">
			<Button onclick={() => demoToast('green')}>Show success</Button>
			<Button variant="gold" onclick={() => demoToast('gold')}>Show ladder</Button>
			<Button variant="danger" onclick={() => demoToast('red')}>Show snake</Button>
		</div>
	</section>

	<!-- Sound -->
	<section>
		<h2>Sound</h2>
		<p class="muted lede">
			Short synthesised cues (Web Audio, no files) for each game moment. Players can mute them from
			the speaker button in the game's top bar. Defined in <code>src/lib/sound.svelte.ts</code>.
		</p>
		<div class="row wrap">
			{#each sounds as s (s.name)}
				<Button variant="outline" size="sm" onclick={s.play}>{s.name}</Button>
			{/each}
		</div>
	</section>

	<!-- Icons -->
	<section>
		<h2>Icons</h2>
		<p class="muted lede">
			Phosphor icons in the <b>fill</b> weight, plus custom snake glyphs. Registry in
			<code>src/lib/icons</code>. No emoji in the UI.
		</p>
		<div class="icon-grid">
			{#each categories as c (c)}
				{@const cat = CATEGORY_ICON[c]}
				<div class="icon-cell" style="color: var(--{cat.tone})">
					<cat.icon weight="fill" size="2rem" />
					<small class="muted">{c}</small>
				</div>
			{/each}
			{#each REACTIONS as r (r)}
				{@const reaction = REACTION_ICON[r]}
				<div class="icon-cell" style="color: var(--{reaction.tone})">
					<reaction.icon weight="fill" size="2rem" />
					<small class="muted">{r}</small>
				</div>
			{/each}
			<div class="icon-cell"><SnakeMascot size={48} /><small class="muted">mascot</small></div>
		</div>
	</section>

	<!-- Game pieces -->
	<section>
		<h2>Game pieces</h2>
		<div class="two">
			<Card>
				<span class="label">3D dice</span>
				<div class="dice-demo">
					<Dice3D value={diceValue} {rollKey} size={150} />
					<Button
						variant="secondary"
						onclick={() => {
							diceValue = 1 + Math.floor(Math.random() * 6);
							rollKey++;
						}}>Roll</Button
					>
				</div>
			</Card>
			<Card>
				<span class="label">Player tokens</span>
				<div class="row tokens">
					<span class="token" style="--c: var(--p1); --s: var(--p1-shade)">P</span>
					<span class="token" style="--c: var(--p2); --s: var(--p2-shade)">A</span>
				</div>
				<span class="label spaced">Board tiles</span>
				<div class="row tiles">
					<span class="tile-demo" style="background: var(--snow)">12</span>
					<span class="tile-demo" style="background: var(--polar)">13</span>
					<span class="tile-demo" style="background: var(--gold-light); color: var(--gold-shade)"
						><LadderSimpleIcon weight="fill" size="1.2rem" />4</span
					>
					<span class="tile-demo" style="background: var(--green-light); color: var(--green-shade)"
						><SnakeIcon size="1.2rem" />26</span
					>
					<span class="tile-demo" style="background: var(--gold); color: var(--eel)"
						><FlagCheckeredIcon weight="fill" size="1.5rem" /></span
					>
				</div>
			</Card>
		</div>
	</section>
</main>

{#if showToast === 'green'}
	<Toast tone="green" icon={REACTION_ICON.love.icon} iconTone="red" title="Ayu sent love to your answer">+10 XP for your answer.</Toast>
{:else if showToast === 'gold'}
	<Toast tone="gold" icon={REACTION_ICON.aww.icon} iconTone="purple" title="You sent an aww to Putu's answer">
		Putu climbs the ladder up to 23!
	</Toast>
{:else if showToast === 'red'}
	<Toast tone="red" icon={REACTION_ICON.laugh.icon} iconTone="gold" title="Ayu sent a laugh to your answer">
		You slide down the snake to 6.
	</Toast>
{/if}

<style>
	.topbar {
		max-width: 1080px;
		margin: 0 auto;
		padding: 1.25rem 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 2px dashed color-mix(in srgb, var(--sage) 36%, transparent);
	}

	.logo {
		font-size: 2.2rem;
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

	.spec-link {
		color: var(--sage);
		text-decoration: none;
		text-transform: uppercase;
		letter-spacing: 0.14em;
	}

	.spec-link:hover {
		color: var(--mint);
	}

	main {
		max-width: 1080px;
		margin: 0 auto;
		padding: 2rem 1.5rem 4rem;
	}

	section {
		margin-bottom: 3rem;
	}

	h1 {
		font-size: 2.4rem;
	}

	h2 {
		font-size: 1.6rem;
		margin-bottom: 0.4rem;
	}

	h3 {
		font-size: 1.1rem;
		margin: 1.75rem 0 0.75rem;
	}

	.intro p,
	.lede {
		max-width: 46rem;
		line-height: 1.6;
		margin: 0.5rem 0 1.25rem;
	}

	code {
		padding: 0.1rem 0.4rem;
		border-radius: 0;
		background: var(--polar);
		font-size: 0.9em;
	}

	.families {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 1.25rem;
	}

	.family {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.swatch {
		height: 84px;
		border-radius: var(--radius);
		display: flex;
		align-items: flex-end;
		padding: 0.6rem 0.75rem;
		color: var(--snow);
		font-weight: 900;
		margin-bottom: var(--depth);
	}

	.chips {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.35rem;
	}

	.chips span {
		padding: 0.35rem;
		border-radius: 0;
		color: var(--snow);
		font-size: 0.7rem;
		font-weight: 900;
		text-transform: uppercase;
		text-align: center;
	}

	.neutrals {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 0.75rem;
	}

	.neutral {
		display: flex;
		align-items: center;
		gap: 0.7rem;
	}

	.neutral div {
		display: flex;
		flex-direction: column;
	}

	.dot {
		width: 2.6rem;
		height: 2.6rem;
		border-radius: var(--radius-sm);
		border: var(--border) solid var(--swan);
	}

	.type-scale {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.type-scale p {
		margin: 0.15rem 0 0;
	}

	.spec {
		font-size: 0.72rem;
		font-weight: 800;
		color: var(--hare);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.t-display {
		font-size: 2.5rem;
		font-weight: 900;
		line-height: 1.15;
	}

	.t-h2 {
		font-size: 1.5rem;
		font-weight: 900;
	}

	.t-q {
		font-size: 1.25rem;
		font-weight: 900;
	}

	.t-button {
		font-size: 0.95rem;
		font-weight: 800;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--green);
	}

	.shapes {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
	}

	.shapes p {
		margin: 0.35rem 0 0;
		line-height: 1.45;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.wrap {
		flex-wrap: wrap;
	}

	.two {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1rem;
	}

	.stack {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}

	.spaced {
		margin-top: 1.1rem;
	}

	.choices {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 0.45rem;
	}

	:global(.tile.reaction) {
		aspect-ratio: 1;
	}

	.dice-demo {
		display: flex;
		align-items: center;
		justify-content: space-around;
	}

	.token {
		width: 3rem;
		height: 3rem;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--c);
		border: 2px solid var(--snow);
		box-shadow: 0 3px 0 var(--s);
		color: var(--snow);
		font-weight: 900;
		font-size: 1.2rem;
	}

	.icon-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
		gap: 0.75rem;
	}

	.icon-cell {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35rem;
		padding: 0.9rem 0.5rem;
		border: var(--border) solid var(--swan);
		border-radius: var(--radius);
	}

	.tile-demo {
		width: 3.4rem;
		height: 3.4rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.1rem;
		border-radius: var(--radius-sm);
		border: var(--border) solid var(--swan);
		font-size: 0.8rem;
		font-weight: 900;
		color: var(--hare);
	}

	.tiles {
		flex-wrap: wrap;
	}
</style>
