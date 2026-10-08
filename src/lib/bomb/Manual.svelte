<script lang="ts">
	import {
		describeButtonCond,
		describeWireAction,
		describeWireCond,
		MAX_STRIKES,
		ordinal,
		SIMON_COLORS,
		STRIKE_PENALTY_MS,
		STRIP_COLORS,
		type KeypadSymbol,
		type Manual
	} from '../../../convex/bomb';
	import { SYMBOL_ICON } from './symbols.ts';

	let { manual }: { manual: Manual } = $props();

	const TABS = [
		{ id: 'basics', label: 'Basics' },
		{ id: 'wires', label: 'Wires' },
		{ id: 'button', label: 'Button' },
		{ id: 'keypad', label: 'Keypad' },
		{ id: 'simon', label: 'Simon' }
	] as const;
	let tab = $state<(typeof TABS)[number]['id']>('basics');

	const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
	const ACTION = { tap: 'press and immediately release it', hold: 'hold it down (see below)' };
</script>

<div class="manual">
	<div class="tabs" role="tablist" aria-label="Manual sections">
		{#each TABS as t (t.id)}
			<button role="tab" aria-selected={tab === t.id} class:active={tab === t.id} onclick={() => (tab = t.id)}>
				{t.label}
			</button>
		{/each}
	</div>

	<article class="page">
		{#if tab === 'basics'}
			<h2>Bomb Defusal Manual</h2>
			<p class="edition">Edition {manual.edition} · this edition is only valid for this bomb</p>
			<p>You can't see the bomb. Your partner can. Get them to describe it, then tell them exactly what to do.</p>
			<h3>Ask about the casing first</h3>
			<ul>
				<li><strong>Serial number</strong> — does it contain a vowel? Is the last digit odd?</li>
				<li><strong>Batteries</strong> — how many?</li>
				<li><strong>Indicators</strong> — small labels like <code>FRK</code>. Which ones are lit?</li>
			</ul>
			<h3>Strikes</h3>
			<p>
				Every mistake is a strike and costs {STRIKE_PENALTY_MS / 1000} seconds. {MAX_STRIKES} strikes and it's
				over. Disarm every module before the timer hits 0:00.
			</p>
			<h3>Modules</h3>
			<p>
				The bomb carries a mix of <button class="link" onclick={() => (tab = 'wires')}>wires</button>,
				<button class="link" onclick={() => (tab = 'button')}>a big button</button>,
				<button class="link" onclick={() => (tab = 'keypad')}>a symbol keypad</button> and
				<button class="link" onclick={() => (tab = 'simon')}>Simon Says</button>, sometimes more than one of
				each. A module is done when its light turns green.
			</p>
		{:else if tab === 'wires'}
			<h2>Wires</h2>
			<p>A module has 3–6 wires, counted from the top. Cut exactly one. Find the table for the wire count and use the first rule that applies.</p>
			{#each manual.wires as table (table.count)}
				<section class="rule-block">
					<h3>{table.count} wires</h3>
					<ol>
						{#each table.rules as rule, i (i)}
							<li>
								{i === 0 ? 'If' : 'Otherwise, if'}
								<strong>{describeWireCond(rule.cond)}</strong>, {describeWireAction(rule.action)}.
							</li>
						{/each}
						<li>Otherwise, cut the {ordinal(table.fallback)} wire.</li>
					</ol>
				</section>
			{/each}
		{:else if tab === 'button'}
			<h2>The Button</h2>
			<p>One big coloured button with a word on it. Use the first rule that applies.</p>
			<ol class="rule-block">
				{#each manual.button.rules as rule, i (i)}
					<li>
						{i === 0 ? 'If' : 'Otherwise, if'} <strong>{describeButtonCond(rule.cond)}</strong>,
						{ACTION[rule.action]}.
					</li>
				{/each}
				<li>Otherwise, {ACTION[manual.button.fallback]}.</li>
			</ol>
			<h3>Holding the button</h3>
			<p>While it's held, a strip beside it lights up. Release when the countdown timer has this digit in <em>any</em> position:</p>
			<div class="strip-table">
				{#each STRIP_COLORS as color (color)}
					<div class="strip-row">
						<span class="swatch" style="--s: var(--sw-{color})"></span>
						<span>{cap(color)} strip</span>
						<strong>{manual.button.strip[color]}</strong>
					</div>
				{/each}
			</div>
		{:else if tab === 'keypad'}
			<h2>Keypad</h2>
			<p>
				Four keys, each with a symbol. Only one column below has all four. Press the keys in the order
				they appear in that column, top to bottom.
			</p>
			<div class="columns">
				{#each manual.keypad as column, c (c)}
					<div class="column">
						<span class="col-label">{c + 1}</span>
						{#each column as symbol (symbol)}
							{@const Icon = SYMBOL_ICON[symbol as KeypadSymbol]}
							<span class="glyph"><Icon weight="bold" size="1.7rem" /></span>
						{/each}
					</div>
				{/each}
			</div>
		{:else if tab === 'simon'}
			<h2>Simon Says</h2>
			<p>
				Four coloured pads flash a sequence. For each flash, press the pad from the table instead.
				After every round the sequence grows by one. The table changes with the serial number and
				the number of strikes, so keep track.
			</p>
			{#each [{ title: 'Serial number contains a vowel', rows: manual.simon.vowel }, { title: 'No vowel in the serial number', rows: manual.simon.noVowel }] as table (table.title)}
				<section class="rule-block">
					<h3>{table.title}</h3>
					<table>
						<thead>
							<tr>
								<th>Flash</th>
								<th>0 strikes</th>
								<th>1 strike</th>
								<th>2 strikes</th>
							</tr>
						</thead>
						<tbody>
							{#each SIMON_COLORS as flash (flash)}
								<tr>
									<th><span class="chip" style="--s: var(--sw-{flash})">{flash}</span></th>
									{#each table.rows as row, i (i)}
										<td><span class="chip" style="--s: var(--sw-{row[flash]})">{row[flash]}</span></td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</section>
			{/each}
		{/if}
	</article>
</div>

<style>
	.manual {
		--sw-red: var(--red);
		--sw-blue: var(--blue);
		--sw-yellow: var(--gold);
		--sw-green: var(--green);
		--sw-white: #ffffff;

		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}

	.tabs {
		display: flex;
		gap: 0.4rem;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.tabs button {
		flex: 1 0 auto;
		padding: 0.55rem 0.9rem;
		border: var(--border) solid var(--swan);
		border-bottom-width: calc(var(--border) + var(--depth));
		border-radius: var(--radius-sm);
		background: var(--snow);
		font-weight: 900;
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--wolf);
		cursor: pointer;
		touch-action: manipulation;
	}

	.tabs button.active {
		border-color: var(--orange);
		border-bottom-color: var(--orange-shade);
		background: var(--orange-light);
		color: var(--orange-shade);
	}

	/* Printed-manual look: warm paper, typewriter-ish headings. */
	.page {
		padding: 1.3rem 1.3rem 1.6rem;
		border: var(--border) solid #e6dcc0;
		border-bottom-width: calc(var(--border) + var(--depth));
		border-radius: var(--radius-lg);
		background: #fffaf0;
		line-height: 1.55;
		font-size: 1.02rem;
	}

	h2 {
		font-size: 1.45rem;
		margin-bottom: 0.4rem;
	}

	h3 {
		font-size: 1.05rem;
		margin: 1.1rem 0 0.4rem;
	}

	p {
		margin: 0.4rem 0;
	}

	.edition {
		font-size: 0.8rem;
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--orange-shade);
	}

	ul,
	ol {
		margin: 0.3rem 0;
		padding-left: 1.3rem;
	}

	li {
		margin: 0.3rem 0;
	}

	code {
		padding: 0.05rem 0.35rem;
		border-radius: 0;
		background: #0f1718;
		color: var(--snow);
		font-size: 0.85em;
	}

	.link {
		padding: 0;
		border: none;
		background: none;
		color: var(--blue);
		font-weight: 900;
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.rule-block {
		margin-top: 0.8rem;
		padding-top: 0.2rem;
	}

	section.rule-block + section.rule-block {
		border-top: 2px dashed #e6dcc0;
	}

	.strip-table {
		display: grid;
		gap: 0.35rem;
		margin-top: 0.5rem;
	}

	.strip-row {
		display: grid;
		grid-template-columns: 1.4rem 1fr auto;
		align-items: center;
		gap: 0.6rem;
		padding: 0.4rem 0.8rem;
		border-radius: var(--radius-sm);
		background: var(--snow);
		border: var(--border) solid #efe6cc;
	}

	.strip-row strong {
		font-size: 1.4rem;
		font-family: var(--font);
	}

	.swatch {
		width: 1.1rem;
		height: 1.6rem;
		border-radius: 0;
		background: var(--s);
		box-shadow: inset 0 0 0 2px rgb(0 0 0 / 0.2);
	}

	.columns {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 0.4rem;
		margin-top: 0.8rem;
	}

	.column {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35rem;
		padding: 0.5rem 0;
		border-radius: var(--radius-sm);
		background: #f6f0dc;
		color: #3a3326;
	}

	.col-label {
		font-size: 0.75rem;
		font-weight: 900;
		color: var(--wolf);
	}

	.glyph {
		display: flex;
	}

	table {
		width: 100%;
		border-collapse: separate;
		border-spacing: 0.25rem;
		font-size: 0.85rem;
	}

	th {
		font-weight: 900;
		color: var(--wolf);
		text-align: left;
	}

	thead th {
		text-transform: uppercase;
		font-size: 0.7rem;
		letter-spacing: 0.05em;
		text-align: center;
	}

	td {
		text-align: center;
	}

	.chip {
		display: inline-block;
		min-width: 4.2rem;
		padding: 0.2rem 0.4rem;
		border-radius: 0;
		background: color-mix(in srgb, var(--s) 22%, white);
		border: 2px solid var(--s);
		color: var(--eel);
		font-weight: 900;
		text-transform: capitalize;
	}
</style>
