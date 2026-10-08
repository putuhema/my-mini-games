<script lang="ts">
	import { Sprite } from '#lib/ui/index.ts';
	import { SPRITES, type SpriteName } from '#lib/ui/sprites.ts';
	/*
	 * "Night Garden" — retro pixel design system.
	 * An old CRT in morning light: pale cyan surfaces, firefly cyan + pink accents,
	 * VT323 type, hard pixel bevels built from stacked box-shadows, scanlines, stepped motion.
	 * Preview only: tokens are scoped to .px and don't touch src/app.css yet.
	 */

	const palette = [
		{ token: 'page', hex: '#050a0b', day: '#d8ecef', role: 'Page background' },
		{ token: 'soil', hex: '#0a1415', day: '#cce6e9', role: 'Inset panels' },
		{ token: 'moss', hex: '#0d1b1d', day: '#eaf7f9', role: 'Pressable tiles, keys' },
		{ token: 'canopy', hex: '#112426', day: '#f3fcfd', role: 'Cards, dialogs, raised surfaces' },
		{ token: 'well', hex: '#050a0b', day: '#c2dfe3', role: 'Sunken: inputs, tracks, meters' },
		{ token: 'gap', hex: '#050a0b', day: '#f3fcfd', role: 'Inner ring around raised things' },
		{ token: 'vine', hex: '#1f4044', day: '#7fadb3', role: 'Frame ring (idle)' },
		{ token: 'root', hex: '#0b1a1c', day: '#4c838a', role: 'Lip under the frame' }
	];

	const ink = [
		{ token: 'dew', hex: '#eafdff', day: '#102224', role: 'Headings, primary text' },
		{ token: 'sage', hex: '#86a4a8', day: '#4a666a', role: 'Body, secondary text, idle icons' },
		{ token: 'bog', hex: '#4d676a', day: '#8aa392', role: 'Disabled, missed, dividers' }
	];

	const glow = [
		{ token: 'mint', day: '#0e8a9a', hex: '#6beeff', shade: '#2398a8', light: '#c9f9ff', role: 'Focus, hover, success, player 2' },
		{ token: 'pink', day: '#d6336c', hex: '#ff6b9a', shade: '#c4426f', light: '#ffd1e1', role: 'Brand, current turn, player 1' },
		{ token: 'amber', day: '#b07400', hex: '#ffc44d', shade: '#c98a1e', light: '#ffe6a3', role: 'Rewards, wins, ladders' },
		{ token: 'lilac', day: '#7a4fd0', hex: '#c9a2ff', shade: '#8466c4', light: '#ecdcff', role: 'Deep talk, secrets' },
		{ token: 'sky', day: '#2a6fd1', hex: '#86bcff', shade: '#4f86d6', light: '#d6e8ff', role: 'Secondary, links, info' },
		{ token: 'ember', day: '#c25a00', hex: '#ff9a4d', shade: '#c9681f', light: '#ffdcbf', role: 'Streaks, timers, fun' },
		{ token: 'berry', day: '#d12f3d', hex: '#ff5468', shade: '#c4303f', light: '#ffcdd3', role: 'Danger, errors, snakes' }
	];

	const typeScale = [
		{ name: 'Display', size: 96, sample: 'US, APART', cls: 'display' },
		{ name: 'H1', size: 48, sample: 'Daily dive', cls: '' },
		{ name: 'H2', size: 34, sample: 'Snakes & ladders', cls: '' },
		{ name: 'H3', size: 26, sample: 'Your move, love', cls: '' },
		{ name: 'Body', size: 20, sample: 'Roll the die and climb together, wherever you are.', cls: '' },
		{ name: 'Small', size: 16, sample: 'Last played 2 hours ago', cls: '' },
		{ name: 'Eyebrow', size: 13, sample: 'ROUND 03 · YOUR TURN', cls: 'eyebrow' }
	];

	const menu: { label: string; sprite: SpriteName; locked?: boolean }[] = [
		{ label: 'Snakes', sprite: 'snake' },
		{ label: 'Defuse', sprite: 'bomb' },
		{ label: 'Questions', sprite: 'chat' },
		{ label: 'Streaks', sprite: 'star' },
		{ label: 'Archive', sprite: 'ladder' },
		{ label: 'Locked', sprite: 'die', locked: true }
	];

	let selected = $state('Snakes');
	let sound = $state(true);
	let crt = $state(false);
	let progress = $state(5);
	let toast = $state<null | { tone: string; text: string }>(null);
	let name = $state('');
	let zap = $state(false);

	function showToast(tone: string, text: string) {
		toast = { tone, text };
		zap = true;
		setTimeout(() => (zap = false), 300);
		setTimeout(() => (toast = null), 2400);
	}
</script>

<svelte:head>
	<title>Night Garden · pixel design system</title>
</svelte:head>


<div class="px" class:crt-on={crt}>
	<div class="crt" class:zap aria-hidden="true"></div>
	<div class="vignette" aria-hidden="true"></div>

	<header class="topbar">
		<a href="/design" class="back frame">&lt; Current system</a>
		<div class="topbar-end">
			<span class="chip" style="--cc: var(--mint)">v0 · Preview</span>
		</div>
	</header>

	<main>
		<!-- Hero -->
		<section class="hero">
			<p class="eyebrow blink">▸ Design system</p>
			<h1 class="title">
				{#each 'NIGHT GARDEN'.split('') as ch, i}
					<span style="animation-delay: {i * 0.12}s">{ch === ' ' ? ' ' : ch}</span>
				{/each}
			</h1>
			<p class="tagline">two lights, one garden.</p>
			<p class="lede">
				A retro pixel system for <b>Us, Apart</b>. Picture an old CRT in morning light: pale cyan
				surfaces, two fireflies (cyan and pink), hard pixel bevels, and motion that snaps between frames.
			</p>
			<div class="hero-sprites">
				<Sprite name={'firefly'} scale={8} />
				<Sprite name={'heart'} scale={8} />
				<Sprite name={'snake'} scale={8} />
			</div>
		</section>

		<!-- Principles -->
		<section>
			<h2><span class="num">01</span> Principles</h2>
			<div class="grid-3">
				<div class="panel">
					<h3>Hard edges</h3>
					<p>No border-radius anywhere. Pixel corners come from stepped clip-paths, never curves.</p>
				</div>
				<div class="panel">
					<h3>Lit by fireflies</h3>
					<p>
						The garden stays dark. Only interactive or important things glow, in mint or pink.
					</p>
				</div>
				<div class="panel">
					<h3>Stepped motion</h3>
					<p>
						Transitions use <code>steps()</code> so they snap like sprites. Springs are only for things
						arriving on screen.
					</p>
				</div>
			</div>
		</section>

		<!-- Colour -->
		<section>
			<h2><span class="num">02</span> Colour</h2>
			<p class="muted lede">
				<b>Surface</b> colours run from page to raised card. <b>Ink</b> is for text.
				<b>Glow</b> colours are the firefly accents. Each has a <i>shade</i> for the bevel
				bottom and a <i>light</i> for the bevel top. Fills stay the same in both themes; text
				colours deepen in day mode so they stay readable.
			</p>

			<h3 class="sub">Surfaces</h3>
			<div class="swatches">
				{#each palette as c (c.token)}
					<div class="swatch">
						<div class="chipcolor" style="background: var(--{c.token})"></div>
						<strong>--{c.token}</strong>
						<code>{c.day}</code>
						<small>{c.role}</small>
					</div>
				{/each}
			</div>

			<h3 class="sub">Ink</h3>
			<div class="swatches">
				{#each ink as c (c.token)}
					<div class="swatch">
						<div class="chipcolor ink" style="color: var(--{c.token})">Aa</div>
						<strong>--{c.token}</strong>
						<code>{c.day}</code>
						<small>{c.role}</small>
					</div>
				{/each}
			</div>

			<h3 class="sub">Glow</h3>
			<div class="glows">
				{#each glow as c (c.token)}
					<div class="glow">
						<div
							class="bevel-fill"
							style="--bg: {c.hex}; --hi: {c.light}; --lo: {c.shade}; box-shadow: 0 0 0 2px var(--gap), 0 0 18px color-mix(in srgb, {c.hex} var(--glow-amt), transparent)"
						>
							{c.token}
						</div>
						<div class="trio">
							<span style="background: {c.light}" title="light"></span>
							<span style="background: {c.hex}" title="base"></span>
							<span style="background: {c.shade}" title="shade"></span>
						</div>
						<code>fill {c.hex}</code>
						<code style="color: var(--{c.token})">text {c.day}</code>
						<small>{c.role}</small>
					</div>
				{/each}
			</div>
		</section>

		<!-- Type -->
		<section>
			<h2><span class="num">03</span> Type</h2>
			<p class="muted lede">
				Everything is set in <b>VT323</b>, a CRT terminal face. It runs small, so the scale starts
				at 20px for body text. Uppercase plus wide tracking means "label"; mixed case means "read
				me".
			</p>
			<div class="type-list">
				{#each typeScale as t (t.name)}
					<div class="type-row">
						<div class="type-meta">
							<strong>{t.name}</strong>
							<small>{t.size}px</small>
						</div>
						<div class="type-sample {t.cls}" style="font-size: {t.size}px">{t.sample}</div>
					</div>
				{/each}
			</div>
			<div class="grid-3 effects">
				<div class="panel center">
					<span class="fx-chroma">GLITCH</span>
					<small>Chromatic split: hero titles only</small>
				</div>
				<div class="panel center">
					<span class="fx-glow">GLOW</span>
					<small>Firefly glow: status and live values</small>
				</div>
				<div class="panel center">
					<span class="fx-drop">DROP</span>
					<small>Hard drop: text on busy art</small>
				</div>
			</div>
		</section>

		<!-- The frame -->
		<section>
			<h2><span class="num">04</span> The pixel frame</h2>
			<p class="muted lede">
				This is the signature of the system. Every raised surface gets three stacked shadows: a
				<b>gap</b>, a <b>frame ring</b>, and a <b>lip</b> offset downward. On hover the ring
				lights up mint. On press the surface drops into the lip.
			</p>
			<div class="frame-demo">
				<div class="anatomy">
					<div class="frame big">
						<span>surface</span>
					</div>
					<ul>
						<li><i style="background: var(--gap); outline: 1px solid var(--bog)"></i> 2px gap · <code>--gap</code></li>
						<li><i style="background: var(--vine)"></i> 4px ring · <code>--vine</code></li>
						<li><i style="background: var(--root)"></i> 4px lip · <code>--root</code></li>
					</ul>
				</div>
				<pre><code>box-shadow:
  0 0 0 2px var(--gap),
  0 0 0 4px var(--frame, var(--vine)),
  0 4px 0 4px var(--root);
transition: transform .1s steps(2, end);

:hover  → --frame: var(--mint) + 18px glow
:active → translateY(3px)</code></pre>
			</div>
			<div class="frame-states">
				<div class="frame state"><span>Idle</span></div>
				<div class="frame state hover"><span>Hover</span></div>
				<div class="frame state current"><span>Current</span></div>
				<div class="frame state pressed"><span>Pressed</span></div>
				<div class="frame state disabled"><span>Disabled</span></div>
			</div>
		</section>

		<!-- Buttons -->
		<section>
			<h2><span class="num">05</span> Buttons</h2>
			<p class="muted lede">
				Filled buttons use a <b>bevel fill</b>: a 4px light strip on top, the base colour, and a 5px
				shade strip on the bottom. Frame buttons are quieter and are the default for secondary
				actions.
			</p>
			<div class="row">
				<button class="btn" style="--bg: var(--mint-fill); --hi: #c9f9ff; --lo: #2398a8">Roll die</button>
				<button class="btn" style="--bg: var(--pink-fill); --hi: #ffd1e1; --lo: #c4426f">Start game</button>
				<button class="btn" style="--bg: var(--amber-fill); --hi: #ffe6a3; --lo: #c98a1e">Claim star</button>
				<button class="btn" style="--bg: var(--lilac-fill); --hi: #ecdcff; --lo: #8466c4">Ask secret</button>
				<button class="btn" disabled>Waiting…</button>
			</div>
			<div class="row">
				<button class="frame fbtn">Invite partner</button>
				<button class="frame fbtn">▸ Continue</button>
				<button class="frame fbtn icon" aria-label="Close">×</button>
				<button class="frame fbtn icon" aria-label="Settings">⚙</button>
				<button class="frame fbtn" disabled>Disabled</button>
			</div>
			<div class="row">
				<button class="btn lg full" style="--bg: var(--pink-fill); --hi: #ffd1e1; --lo: #c4426f">▸ Step in</button>
			</div>
			<div class="row">
				<a class="link-row" href="#buttons" style="--lc: var(--mint)">
					<Sprite name={'chat'} scale={3} />
					<span><b>Questions</b><small>36 prompts to fall closer</small></span>
					<span class="arrow">↗</span>
				</a>
				<a class="link-row" href="#buttons" style="--lc: var(--pink)">
					<Sprite name={'heart'} scale={3} />
					<span><b>Our streak</b><small>12 days in a row</small></span>
					<span class="arrow">↗</span>
				</a>
			</div>
		</section>

		<!-- Tiles / menu -->
		<section>
			<h2><span class="num">06</span> Tiles</h2>
			<p class="muted lede">
				Grid tiles are for menus and choices. The selected tile keeps its mint ring and glow. A
				pink ring with a slow "breathe" marks the current or live item.
			</p>
			<div class="tiles">
				{#each menu as m (m.label)}
					<button
						class="frame tile"
						class:selected={selected === m.label}
						class:locked={m.locked}
						aria-pressed={selected === m.label}
						disabled={m.locked}
						onclick={() => (selected = m.label)}
					>
						<Sprite name={m.sprite} scale={4} />
						<span>{m.label}</span>
						{#if m.locked}<small>Lvl 5</small>{/if}
					</button>
				{/each}
			</div>
			<h3 class="sub">Day grid</h3>
			<div class="days">
				{#each Array(14) as _, i}
					<button
						class="frame day"
						class:done={i < 9 && i !== 4}
						class:missed={i === 4}
						class:current={i === 9}
						disabled={i > 9}
					>
						<span class="dnum">{i + 1}</span>
						<small>{i < 9 ? (i === 4 ? 'miss' : '★') : i === 9 ? 'today' : '·'}</small>
					</button>
				{/each}
			</div>
		</section>

		<!-- Controls -->
		<section>
			<h2><span class="num">07</span> Controls</h2>
			<div class="grid-2">
				<div class="panel">
					<h3>Toggles</h3>
					<label class="pref">
						<span>
							<b>Sound</b>
							<small>Bleeps on rolls, hops and wins</small>
						</span>
						<input type="checkbox" bind:checked={sound} />
						<span class="track"><span class="thumb">{sound ? 'ON' : 'OFF'}</span></span>
					</label>
					<label class="pref">
						<span>
							<b>Scanlines</b>
							<small>CRT overlay on the whole page</small>
						</span>
						<input type="checkbox" bind:checked={crt} />
						<span class="track"><span class="thumb">{crt ? 'ON' : 'OFF'}</span></span>
					</label>
				</div>
				<div class="panel">
					<h3>Input</h3>
					<label class="field">
						<span class="eyebrow">Room code</span>
						<input bind:value={name} placeholder="MOSS-42" maxlength="10" />
					</label>
					<label class="field">
						<span class="eyebrow">Error state</span>
						<input class="invalid" value="NOPE" readonly />
						<small class="err">▲ That room has gone dark. Check the code.</small>
					</label>
				</div>
			</div>
		</section>

		<!-- Feedback -->
		<section>
			<h2><span class="num">08</span> Feedback</h2>
			<div class="grid-2">
				<div class="panel">
					<h3>Progress</h3>
					<p class="muted">Segmented, never smooth. Each block is one step.</p>
					<div class="meter" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={12}>
						{#each Array(12) as _, i}
							<span class:on={i < progress} class:tip={i === progress - 1}></span>
						{/each}
					</div>
					<div class="row tight">
						<button class="frame fbtn sm" onclick={() => (progress = Math.max(0, progress - 1))}>−</button>
						<button class="frame fbtn sm" onclick={() => (progress = Math.min(12, progress + 1))}>+</button>
						<span class="readout">{String(progress).padStart(2, '0')}/12</span>
					</div>
					<h3 class="sub">Health</h3>
					<div class="hearts">
						{#each Array(5) as _, i}
							<span class:empty={i >= 3}><Sprite name={'heart'} scale={4} /></span>
						{/each}
					</div>
				</div>
				<div class="panel">
					<h3>Chips & toasts</h3>
					<div class="row tight wrap">
						<span class="chip" style="--cc: var(--mint)">Your turn</span>
						<span class="chip" style="--cc: var(--pink)">P1 · Ayu</span>
						<span class="chip" style="--cc: var(--amber)">+50 XP</span>
						<span class="chip" style="--cc: var(--lilac)">Secret</span>
						<span class="chip" style="--cc: var(--sage)">Offline</span>
					</div>
					<div class="row tight wrap">
						<button class="frame fbtn sm" onclick={() => showToast('mint', 'Partner joined the room')}>Info</button>
						<button class="frame fbtn sm" onclick={() => showToast('amber', 'Ladder! +3 squares')}>Reward</button>
						<button class="frame fbtn sm" onclick={() => showToast('pink', 'Snake! Slid down to 12')}>Danger</button>
					</div>
				</div>
			</div>
		</section>

		<!-- Stats + dialog -->
		<section>
			<h2><span class="num">09</span> Data & dialogs</h2>
			<dl class="stats">
				<div><dt>Games</dt><dd>48</dd></div>
				<div><dt>Streak</dt><dd style="--v: var(--ember)">12</dd></div>
				<div><dt>Wins · you</dt><dd style="--v: var(--pink)">26</dd></div>
				<div><dt>Wins · them</dt><dd>22</dd></div>
			</dl>

			<div class="dialog px-corners" role="dialog" aria-label="Example dialog">
				<button class="frame fbtn icon close" aria-label="Close">×</button>
				<p class="eyebrow blink">▸ Incoming</p>
				<h3 class="dialog-title">SNAKE BITE!</h3>
				<p>Your partner slid from square <b class="hl-pink">47</b> down to <b class="hl-mint">12</b>. Send them something nice?</p>
				<div class="row tight">
					<button class="btn" style="--bg: var(--pink-fill); --hi: #ffd1e1; --lo: #c4426f">Send a heart</button>
					<button class="frame fbtn">Later</button>
				</div>
			</div>
		</section>

		<!-- Sprites -->
		<section>
			<h2><span class="num">10</span> Sprites</h2>
			<p class="muted lede">
				Icons are pixel sprites on a 7–8px grid, drawn as SVG rects with <code>crispEdges</code>.
				Render them at whole-number scales only (×3, ×4, ×8). Images use
				<code>image-rendering: pixelated</code>.
			</p>
			<div class="sprites">
				{#each Object.keys(SPRITES) as SpriteName[] as s (s)}
					<div class="frame sprite-cell">
						<Sprite name={s} scale={5} />
						<small>{s}</small>
					</div>
				{/each}
			</div>
		</section>

		<!-- Tokens -->
		<section>
			<h2><span class="num">11</span> Tokens</h2>
			<div class="grid-2">
				<pre class="panel"><code>/* Space: 4px grid */
--s1: 4px   --s2: 8px   --s3: 12px
--s4: 16px  --s5: 24px  --s6: 32px

/* Shape */
--radius: 0;
--ring: 2px;      /* gap */
--frame: 4px;     /* ring width */
--drop: 4px;      /* lip under frame */
--hairline: #86a4a838;</code></pre>
				<pre class="panel"><code>/* Motion */
--snap: steps(2, end);       /* hovers, presses */
--blink: steps(2, end) 2.2s; /* eyebrows, cursors */
--ease-out: cubic-bezier(.22,1,.36,1);
--ease-pop: cubic-bezier(.2,1.5,.4,1);
--t-press: 100ms;
--t-enter: 700ms;

/* Overlays */
--scanline: repeating-linear-gradient(
  0deg, #0000002e 0 1px, #0000 1px 3px);</code></pre>
			</div>
		</section>

		<footer>
			<span>growing…</span>
			<span>Night Garden · preview for Us, Apart</span>
		</footer>
	</main>

	{#if toast}
		<div class="toast" style="--cc: var(--{toast.tone})" role="status">
			<span class="blink">▸</span>
			{toast.text}
		</div>
	{/if}
</div>

<style>
	.px {
		/* Page-local tokens; everything else comes from src/app.css. */
		--lip-pink: #3a1226;
		--vignette: #020606d9;
		--knob-hi: #b8d1d4;
		--knob: #86a4a8;
		--knob-lo: #4a676b;
		--off-bg: #2b464a;
		--off-hi: #3e575a;
		--off-lo: #1c3033;
		--ease-pop: cubic-bezier(0.2, 1.5, 0.4, 1);

		position: relative;
		min-height: 100dvh;
		background:
			radial-gradient(120% 60% at 50% 0%, var(--page-glow) 0%, transparent 60%),
			var(--page);
		color: var(--sage);
		font-family: var(--font);
		font-size: 20px;
		font-weight: 400;
		line-height: 1.3;
		letter-spacing: 0.02em;
		overflow-x: hidden;
	}

	.px {
		--lip-pink: #a8204f;
		--vignette: #7fadb340;
		--knob-hi: #ffffff;
		--knob: #b8d3d6;
		--knob-lo: #83a6ab;
		--off-bg: #bdd6d9;
		--off-hi: #d2e6e9;
		--off-lo: #9cbbbf;
	}

	.px :global(*) {
		border-radius: 0;
	}

	.px h1,
	.px h2,
	.px h3 {
		font-family: var(--font);
		font-weight: 400;
		color: var(--dew);
		letter-spacing: 0.03em;
	}

	.px b {
		color: var(--dew);
		font-weight: 400;
	}

	.px code,
	.px pre {
		font-family: var(--font);
		color: var(--mint);
	}

	pre {
		margin: 0;
		font-size: 18px;
		line-height: 1.35;
		white-space: pre-wrap;
	}

	/* Overlays */
	.crt {
		position: fixed;
		inset: 0;
		z-index: 50;
		pointer-events: none;
		background: repeating-linear-gradient(0deg, var(--scan) 0 1px, #0000 1px 3px);
		opacity: 0;
		transition: opacity 0.2s var(--snap);
	}
	.crt-on .crt {
		opacity: 0.6;
	}
	.crt.zap {
		animation: zap 0.28s steps(3, end);
	}
	.vignette {
		position: fixed;
		inset: 0;
		z-index: 49;
		pointer-events: none;
		background: radial-gradient(at 50% 45%, #0000 55%, var(--vignette) 100%);
		opacity: 0.5;
	}

	/* Layout */
	.topbar {
		position: sticky;
		top: 0;
		z-index: 20;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 14px 20px;
		background: color-mix(in srgb, var(--page) 90%, transparent);
		border-bottom: 1px solid var(--hairline);
	}
	.topbar-end {
		display: flex;
		align-items: center;
		gap: 16px;
	}
	main {
		width: min(100%, 980px);
		margin: 0 auto;
		padding: 0 20px 60px;
	}
	section {
		padding: 48px 0 8px;
	}
	section > h2 {
		display: flex;
		align-items: baseline;
		gap: 14px;
		margin: 0 0 12px;
		font-size: 34px;
		text-transform: uppercase;
		border-bottom: 2px dashed color-mix(in srgb, var(--sage) 36%, transparent);
		padding-bottom: 8px;
	}
	.num {
		color: var(--pink);
		font-size: 20px;
		letter-spacing: 0.2em;
		text-shadow: 0 0 10px var(--glow-pink);
	}
	.sub {
		margin: 28px 0 12px;
		font-size: 22px;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--sage) !important;
	}
	.lede {
		max-width: 62ch;
		margin: 0 0 20px;
	}
	.muted {
		color: var(--sage);
	}
	small {
		font-size: 15px;
		color: var(--sage);
		letter-spacing: 0.04em;
	}
	.grid-2,
	.grid-3 {
		display: grid;
		gap: 22px;
	}
	.grid-2 {
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	}
	.grid-3 {
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 18px;
		margin: 0 0 22px;
		align-items: center;
	}
	.row.tight {
		gap: 12px;
		margin: 14px 0 0;
	}

	/* Hero */
	.hero {
		text-align: center;
		padding: 72px 0 24px;
	}
	.eyebrow {
		margin: 0;
		color: var(--mint);
		font-size: 13px;
		letter-spacing: 0.24em;
		text-transform: uppercase;
		text-shadow: 0 0 8px var(--glow-mint);
	}
	.blink {
		animation: blink 2.2s steps(2, end) infinite;
	}
	.title {
		margin: 12px 0 0;
		font-size: clamp(64px, 17vw, 136px) !important;
		line-height: 0.9;
		letter-spacing: 0.04em;
		text-shadow:
			-4px 3px var(--pink),
			4px -3px var(--mint),
			0 0 30px var(--glow-mint);
		animation: flicker 5s step-end infinite;
	}
	.title span {
		display: inline-block;
		white-space: pre;
		animation: bob 3.2s ease-in-out infinite;
	}
	.tagline {
		margin: 10px 0 0;
		color: var(--mint);
		font-size: clamp(20px, 5vw, 30px);
		letter-spacing: 0.3em;
		text-shadow: 0 0 12px var(--glow-mint);
	}
	.hero .lede {
		margin: 22px auto 0;
		font-size: 21px;
	}
	.hero-sprites {
		display: flex;
		justify-content: center;
		gap: 36px;
		margin-top: 36px;
	}
	.hero-sprites :global(svg) {
		animation: bob 2.6s ease-in-out infinite;
		filter: drop-shadow(0 0 14px var(--glow-pink));
	}
	.hero-sprites :global(svg:nth-child(2)) {
		animation-delay: 0.4s;
	}
	.hero-sprites :global(svg:nth-child(3)) {
		animation-delay: 0.8s;
		filter: drop-shadow(0 0 14px var(--glow-mint));
	}

	/* Panel: flat inset surface with hairline */
	.panel {
		position: relative;
		padding: 20px;
		background: var(--soil);
		border: 1px solid var(--hairline);
	}
	.panel h3 {
		margin: 0 0 8px;
		font-size: 26px;
	}
	.panel p {
		margin: 0;
	}
	.panel.center {
		display: grid;
		justify-items: center;
		gap: 10px;
		text-align: center;
	}

	/* The frame: signature raised surface */
	.frame {
		--frame: var(--vine);
		background: var(--moss);
		color: var(--sage);
		border: 0;
		font-family: var(--font);
		box-shadow:
			0 0 0 2px var(--gap),
			0 0 0 4px var(--frame),
			0 4px 0 4px var(--root);
		transition: transform 0.1s var(--snap);
	}
	button.frame,
	a.frame {
		cursor: pointer;
	}
	button.frame:hover:not(:disabled),
	button.frame:focus-visible,
	a.frame:hover,
	a.frame:focus-visible,
	.frame.hover {
		--frame: var(--mint);
		color: var(--dew);
		outline: none;
		box-shadow:
			0 0 0 2px var(--gap),
			0 0 0 4px var(--frame),
			0 4px 0 4px var(--lip-hot),
			0 0 18px var(--glow-mint);
	}
	button.frame:active:not(:disabled),
	.frame.pressed {
		transform: translateY(3px);
		box-shadow:
			0 0 0 2px var(--gap),
			0 0 0 4px var(--frame),
			0 1px 0 4px var(--root);
	}
	.frame.current {
		--frame: var(--pink);
		color: var(--dew);
		box-shadow:
			0 0 0 2px var(--gap),
			0 0 0 4px var(--frame),
			0 4px 0 4px var(--lip-pink),
			0 0 18px var(--glow-pink);
		animation: breathe 1.9s ease-in-out infinite;
	}
	.frame:disabled,
	.frame.disabled {
		cursor: default;
		opacity: 0.35;
		box-shadow:
			0 0 0 2px var(--gap),
			0 0 0 4px var(--ring-off);
	}

	.back {
		padding: 6px 12px 4px;
		font-size: 18px;
		text-decoration: none;
	}

	/* Colour */
	.swatches {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 18px;
	}
	.swatch {
		display: grid;
		gap: 2px;
	}
	.swatch strong {
		color: var(--dew);
		font-weight: 400;
		margin-top: 8px;
	}
	.swatch code {
		font-size: 16px;
	}
	.chipcolor {
		height: 72px;
		box-shadow:
			0 0 0 2px var(--gap),
			0 0 0 3px var(--hairline);
	}
	.chipcolor.ink {
		display: grid;
		place-items: center;
		background: var(--canopy);
		font-size: 44px;
	}
	.glows {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: 22px;
	}
	.glow {
		display: grid;
		gap: 6px;
	}
	.trio {
		display: flex;
		height: 14px;
		margin-top: 6px;
	}
	.trio span {
		flex: 1;
	}

	/* Bevel fill: light strip / base / shade strip */
	.bevel-fill,
	.btn {
		--bg: var(--mint);
		--hi: #c9f9ff;
		--lo: #2398a8;
		background: linear-gradient(
			180deg,
			var(--hi) 0 4px,
			var(--bg) 4px calc(100% - 5px),
			var(--lo) calc(100% - 5px) 100%
		);
		color: var(--on-fill);
		font-family: var(--font);
		text-transform: uppercase;
		letter-spacing: 0.12em;
	}
	.bevel-fill {
		display: grid;
		place-items: center;
		height: 72px;
		font-size: 22px;
	}

	/* Type */
	.type-list {
		border: 1px solid var(--hairline);
	}
	.type-row {
		display: grid;
		grid-template-columns: 110px 1fr;
		align-items: center;
		gap: 18px;
		padding: 14px 18px;
		border-bottom: 1px solid var(--hairline);
	}
	.type-row:last-child {
		border-bottom: 0;
	}
	.type-meta {
		display: grid;
	}
	.type-meta strong {
		color: var(--dew);
		font-weight: 400;
	}
	.type-sample {
		color: var(--dew);
		line-height: 1;
		overflow-wrap: anywhere;
	}
	.type-sample.display {
		text-shadow:
			-3px 2px var(--pink),
			3px -2px var(--mint);
	}
	.type-sample.eyebrow {
		color: var(--mint);
	}
	.effects {
		margin-top: 22px;
	}
	.fx-chroma,
	.fx-glow,
	.fx-drop {
		font-size: 52px;
		line-height: 1;
		color: var(--dew);
	}
	.fx-chroma {
		text-shadow:
			-3px 2px var(--pink),
			3px -2px var(--mint);
	}
	.fx-glow {
		color: var(--mint);
		text-shadow: 0 0 12px var(--glow-mint);
	}
	.fx-drop {
		color: var(--amber);
		text-shadow: 3px 3px 0 var(--night);
	}

	/* Frame demo */
	.frame-demo {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 28px;
		align-items: center;
	}
	.anatomy {
		display: flex;
		gap: 30px;
		align-items: center;
		padding: 12px;
	}
	.anatomy ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 10px;
	}
	.anatomy li {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.anatomy i {
		width: 16px;
		height: 16px;
	}
	.frame.big {
		display: grid;
		place-items: center;
		width: 140px;
		height: 110px;
		flex-shrink: 0;
	}
	.frame-demo pre {
		padding: 18px;
		background: var(--soil);
		border: 1px solid var(--hairline);
	}
	.frame-states {
		display: flex;
		flex-wrap: wrap;
		gap: 26px;
		margin-top: 32px;
	}
	.frame.state {
		display: grid;
		place-items: center;
		width: 120px;
		height: 64px;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		font-size: 17px;
	}

	/* Buttons */
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		min-height: 48px;
		padding: 2px 22px 0;
		border: 0;
		font-size: 22px;
		cursor: pointer;
		box-shadow:
			0 0 0 2px var(--night),
			0 4px 0 2px var(--night);
		transition:
			transform 0.1s var(--snap),
			filter 0.1s var(--snap);
	}
	.btn:hover:not(:disabled) {
		filter: brightness(1.12) drop-shadow(0 0 10px var(--bg));
	}
	.btn:active:not(:disabled) {
		transform: translateY(3px);
		box-shadow:
			0 0 0 2px var(--night),
			0 1px 0 2px var(--night);
	}
	.btn:focus-visible {
		outline: 2px solid var(--dew);
		outline-offset: 5px;
	}
	.btn:disabled {
		--bg: var(--off-bg);
		--hi: var(--off-hi);
		--lo: var(--off-lo);
		color: var(--sage);
		cursor: default;
	}
	.btn.lg {
		min-height: 60px;
		font-size: 28px;
		letter-spacing: 0.2em;
	}
	.full {
		width: 100%;
	}
	.fbtn {
		min-height: 44px;
		padding: 2px 18px 0;
		font-size: 20px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.fbtn.sm {
		min-height: 34px;
		padding: 2px 12px 0;
		font-size: 17px;
	}
	.fbtn.icon {
		width: 40px;
		min-height: 36px;
		padding: 0 0 3px;
		font-size: 26px;
		line-height: 1;
	}

	/* Link row */
	.link-row {
		flex: 1 1 280px;
		display: flex;
		align-items: center;
		gap: 14px;
		min-height: 60px;
		padding: 12px 16px;
		background: color-mix(in srgb, var(--moss) 65%, transparent);
		border: 1px solid var(--hairline);
		color: var(--lc);
		text-decoration: none;
	}
	.link-row:hover,
	.link-row:focus-visible {
		border-color: var(--lc);
		background: var(--canopy);
		outline: none;
	}
	.link-row > span:nth-child(2) {
		display: grid;
		flex: 1;
	}
	.link-row b {
		color: var(--lc);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}
	.arrow {
		font-size: 22px;
	}

	/* Tiles */
	.tiles {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
		gap: 22px;
	}
	.tile {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		min-height: 96px;
		padding: 14px 6px 10px;
		font-size: 17px;
		letter-spacing: 0.09em;
		text-transform: uppercase;
	}
	.tile.selected {
		--frame: var(--mint);
		color: var(--dew);
		box-shadow:
			0 0 0 2px var(--gap),
			0 0 0 4px var(--frame),
			0 4px 0 4px var(--lip-hot),
			0 0 14px var(--glow-mint);
	}
	.tile.locked :global(svg) {
		filter: grayscale(1) brightness(0.5);
	}
	.tile small {
		font-size: 11px;
		letter-spacing: 0.12em;
		margin-top: -6px;
	}
	.days {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 16px;
		max-width: 620px;
	}
	.day {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 58px;
		padding: 6px 2px 4px;
	}
	.dnum {
		color: var(--dew);
		font-size: 24px;
		line-height: 1;
	}
	.day small {
		font-size: 12px;
		letter-spacing: 0.08em;
	}
	.day.done small {
		color: var(--amber);
		text-shadow: 0 0 8px var(--glow-amber);
	}
	.day.missed small,
	.day.missed .dnum {
		color: var(--bog);
	}
	.day.current small {
		color: var(--pink);
		text-shadow: 0 0 8px var(--glow-pink);
	}

	/* Toggle */
	.pref {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 12px 0;
		border-bottom: 1px solid var(--hairline);
		cursor: pointer;
	}
	.pref:last-child {
		border-bottom: 0;
	}
	.pref > span:first-child {
		display: grid;
	}
	.pref b {
		text-transform: uppercase;
		letter-spacing: 0.09em;
	}
	.pref:hover b {
		color: var(--mint);
	}
	.pref input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}
	.track {
		position: relative;
		flex-shrink: 0;
		width: 70px;
		height: 30px;
		background: var(--well);
		box-shadow:
			inset 0 3px 5px var(--well-shadow),
			0 0 0 2px var(--gap),
			0 0 0 3px var(--vine);
	}
	.thumb {
		position: absolute;
		top: 3px;
		left: 3px;
		display: grid;
		place-items: center;
		width: 34px;
		height: 24px;
		padding-top: 1px;
		color: var(--on-fill);
		font-size: 12px;
		letter-spacing: 0.1em;
		background: linear-gradient(180deg, var(--knob-hi) 0 4px, var(--knob) 4px calc(100% - 5px), var(--knob-lo) calc(100% - 5px) 100%);
		box-shadow: 0 2px var(--hard);
		transition:
			transform 0.12s var(--snap),
			background 0.12s var(--snap);
	}
	.pref input:checked + .track {
		box-shadow:
			inset 0 3px 5px var(--well-shadow),
			0 0 0 2px var(--gap),
			0 0 0 3px var(--mint),
			0 0 12px var(--glow-mint);
	}
	.pref input:checked + .track .thumb {
		transform: translateX(30px);
		background: linear-gradient(180deg, #c9f9ff 0 4px, var(--mint-fill) 4px calc(100% - 5px), #2398a8 calc(100% - 5px) 100%);
		box-shadow:
			0 2px var(--hard),
			0 0 12px var(--glow-mint);
	}
	.pref input:focus-visible + .track {
		outline: 2px solid var(--dew);
		outline-offset: 5px;
	}

	/* Input */
	.field {
		display: grid;
		gap: 6px;
		margin-top: 12px;
	}
	.field input {
		width: 100%;
		min-height: 48px;
		padding: 10px 12px 8px;
		background: var(--well);
		color: var(--dew);
		border: 1px solid var(--hairline);
		font-family: var(--font);
		font-size: 22px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		caret-color: var(--pink);
	}
	.field input::placeholder {
		color: var(--bog);
	}
	.field input:focus {
		outline: 2px solid var(--mint);
		outline-offset: 4px;
		border-color: var(--mint);
	}
	.field input.invalid {
		border-color: var(--pink);
		box-shadow: 0 0 12px var(--glow-pink);
	}
	.err {
		color: var(--pink);
	}

	/* Meter */
	.meter {
		display: grid;
		grid-template-columns: repeat(12, 1fr);
		gap: 3px;
		margin-top: 14px;
		padding: 4px;
		background: var(--well);
		box-shadow:
			0 0 0 2px var(--gap),
			0 0 0 3px var(--vine);
	}
	.meter span {
		height: 18px;
		background: var(--ring-off);
	}
	.meter span.on {
		background: linear-gradient(180deg, #c9f9ff 0 3px, var(--mint-fill) 3px calc(100% - 4px), #2398a8 calc(100% - 4px) 100%);
		box-shadow: 0 0 8px var(--glow-mint);
	}
	.meter span.tip {
		animation: blink 1s steps(2, end) infinite;
	}
	.readout {
		color: var(--mint);
		font-size: 24px;
		letter-spacing: 0.1em;
		text-shadow: 0 0 10px var(--glow-mint);
		font-variant-numeric: tabular-nums;
	}
	.hearts {
		display: flex;
		gap: 6px;
	}
	.hearts .empty :global(svg) {
		filter: grayscale(1) brightness(0.35);
	}

	/* Chip */
	.chip {
		--cc: var(--mint);
		display: inline-flex;
		align-items: center;
		padding: 4px 12px 2px;
		background: var(--canopy);
		color: var(--cc);
		font-size: 17px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		text-shadow: 0 0 10px color-mix(in srgb, var(--cc) var(--glow-amt), transparent);
		box-shadow:
			0 0 0 2px var(--cc),
			0 0 14px color-mix(in srgb, var(--cc) var(--glow-amt), transparent);
	}
	.wrap {
		flex-wrap: wrap;
	}

	/* Stats */
	.stats {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		margin: 0 0 40px;
		border: 1px solid var(--hairline);
	}
	.stats div {
		padding: 18px 14px;
		border-right: 1px solid var(--hairline);
	}
	.stats div:last-child {
		border-right: 0;
	}
	.stats dt {
		font-size: 14px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}
	.stats dd {
		--v: var(--mint);
		margin: 0;
		color: var(--v);
		font-size: 48px;
		line-height: 1.1;
		text-shadow: 0 0 14px color-mix(in srgb, var(--v) var(--glow-amt), transparent);
	}
	@media (max-width: 620px) {
		.stats {
			grid-template-columns: repeat(2, 1fr);
		}
		.stats div:nth-child(-n + 2) {
			border-bottom: 1px solid var(--hairline);
		}
		.stats div:nth-child(2) {
			border-right: 0;
		}
	}

	/* Dialog */
	.dialog {
		position: relative;
		display: grid;
		gap: 14px;
		width: min(100%, 460px);
		margin: 0 auto;
		padding: 30px 28px 26px;
		color: var(--sage);
		background:
			repeating-linear-gradient(0deg, var(--scan) 0 1px, transparent 1px 3px),
			var(--canopy);
		box-shadow:
			0 0 0 3px var(--gap),
			0 0 0 5px var(--vine),
			10px 10px 0 var(--hard),
			0 0 34px var(--glow-mint);
	}
	.dialog p {
		margin: 0;
	}
	.dialog-title {
		margin: 0;
		font-size: 42px;
		line-height: 0.95;
		text-shadow:
			-3px 2px var(--pink),
			3px -2px var(--mint),
			0 0 16px var(--glow-mint);
	}
	.close {
		position: absolute;
		top: 16px;
		right: 18px;
	}
	.hl-pink {
		color: var(--pink) !important;
	}
	.hl-mint {
		color: var(--mint) !important;
	}
	/* Stepped pixel corners */
	.px-corners {
		clip-path: polygon(
			0 10px, 5px 10px, 5px 5px, 10px 5px, 10px 0,
			calc(100% - 10px) 0, calc(100% - 10px) 5px, calc(100% - 5px) 5px, calc(100% - 5px) 10px, 100% 10px,
			100% calc(100% - 10px), calc(100% - 5px) calc(100% - 10px), calc(100% - 5px) calc(100% - 5px),
			calc(100% - 10px) calc(100% - 5px), calc(100% - 10px) 100%,
			10px 100%, 10px calc(100% - 5px), 5px calc(100% - 5px), 5px calc(100% - 10px), 0 calc(100% - 10px)
		);
	}

	/* Sprites */
	.sprite {
		display: block;
		image-rendering: pixelated;
	}
	.tile.locked :global(svg),
	.hearts .empty :global(svg) {
		filter: grayscale(1) opacity(0.4);
	}
	.sprites {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
		gap: 22px;
	}
	.sprite-cell {
		display: grid;
		justify-items: center;
		align-content: center;
		gap: 10px;
		min-height: 110px;
		text-transform: uppercase;
	}
	.sprite-cell small {
		letter-spacing: 0.14em;
	}

	/* Toast */
	.toast {
		position: fixed;
		left: 50%;
		bottom: 28px;
		z-index: 60;
		display: flex;
		gap: 10px;
		padding: 10px 18px 8px;
		background: var(--canopy);
		color: var(--cc);
		font-size: 22px;
		letter-spacing: 0.06em;
		text-shadow: 0 0 10px color-mix(in srgb, var(--cc) var(--glow-amt), transparent);
		box-shadow:
			0 0 0 2px var(--gap),
			0 0 0 4px var(--cc),
			0 0 26px color-mix(in srgb, var(--cc) var(--glow-amt), transparent),
			8px 8px 0 4px var(--hard);
		transform: translateX(-50%);
		animation: toast-in 0.5s var(--ease-pop) backwards;
	}

	footer {
		display: flex;
		justify-content: space-between;
		margin-top: 60px;
		padding-top: 20px;
		border-top: 1px solid var(--hairline);
		opacity: 0.75;
	}
	footer span:first-child {
		color: var(--mint);
		letter-spacing: 0.2em;
	}

	/* Keyframes */
	@keyframes blink {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.25;
		}
	}
	@keyframes flicker {
		0%,
		93%,
		95.5%,
		100% {
			opacity: 1;
		}
		94%,
		96% {
			opacity: 0.6;
		}
	}
	@keyframes bob {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-4px);
		}
	}
	@keyframes breathe {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-2px);
		}
	}
	@keyframes zap {
		0% {
			opacity: 0.9;
			transform: translateY(0);
		}
		50% {
			opacity: 1;
			transform: translateY(2px);
		}
		100% {
			transform: translateY(0);
		}
	}
	@keyframes toast-in {
		from {
			opacity: 0;
			transform: translate(-50%, 24px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.px :global(*) {
			animation: none !important;
			transition: none !important;
		}
	}
</style>
