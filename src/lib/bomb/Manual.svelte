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
		{ id: 'basics', label: 'Dasar' },
		{ id: 'wires', label: 'Kabel' },
		{ id: 'button', label: 'Tombol' },
		{ id: 'keypad', label: 'Papan tombol' },
		{ id: 'simon', label: 'Simon' }
	] as const;
	let tab = $state<(typeof TABS)[number]['id']>('basics');

	const ACTION = { tap: 'tekan lalu segera lepaskan', hold: 'tekan dan tahan (lihat petunjuk di bawah)' };
	const colorName: Record<string, string> = { red: 'Merah', blue: 'Biru', yellow: 'Kuning', white: 'Putih', black: 'Hitam', green: 'Hijau' };
</script>

<div class="manual">
	<div class="tabs" role="tablist" aria-label="Bagian panduan">
		{#each TABS as t (t.id)}
			<button role="tab" aria-selected={tab === t.id} class:active={tab === t.id} onclick={() => (tab = t.id)}>
				{t.label}
			</button>
		{/each}
	</div>

	<article class="page">
		{#if tab === 'basics'}
			<h2>Panduan Menjinakkan Bom</h2>
			<p class="edition">Edisi {manual.edition} · hanya berlaku untuk bom ini</p>
			<p>Kamu tidak bisa melihat bom, tetapi pasanganmu bisa. Minta dia menjelaskan bomnya, lalu beri tahu tindakan yang tepat.</p>
			<h3>Tanyakan informasi pada badan bom</h3>
			<ul>
				<li><strong>Nomor seri</strong> — apakah ada huruf vokal? Apakah angka terakhirnya ganjil?</li>
				<li><strong>Baterai</strong> — ada berapa?</li>
				<li><strong>Indikator</strong> — label kecil seperti <code>FRK</code>. Mana yang menyala?</li>
			</ul>
			<h3>Kesalahan</h3>
			<p>
				Setiap kesalahan mengurangi waktu {STRIKE_PENALTY_MS / 1000} detik. Jika membuat {MAX_STRIKES} kesalahan, permainan berakhir.
				Selesaikan semua modul sebelum waktu habis.
			</p>
			<h3>Modul</h3>
			<p>
				Bom memiliki beberapa modul: <button class="link" onclick={() => (tab = 'wires')}>kabel</button>,
				<button class="link" onclick={() => (tab = 'button')}>tombol besar</button>,
				<button class="link" onclick={() => (tab = 'keypad')}>papan tombol simbol</button> dan
				<button class="link" onclick={() => (tab = 'simon')}>Simon Says</button>. Beberapa modul bisa muncul lebih dari sekali.
				Modul selesai saat lampunya berubah hijau.
			</p>
		{:else if tab === 'wires'}
			<h2>Kabel</h2>
			<p>Setiap modul memiliki 3–6 kabel, dihitung dari atas. Potong tepat satu kabel. Cari tabel sesuai jumlah kabel, lalu ikuti aturan pertama yang cocok.</p>
			{#each manual.wires as table (table.count)}
				<section class="rule-block">
					<h3>{table.count} kabel</h3>
					<ol>
						{#each table.rules as rule, i (i)}
							<li>
								{i === 0 ? 'Jika' : 'Jika tidak,'}
								<strong>{describeWireCond(rule.cond)}</strong>, {describeWireAction(rule.action)}.
							</li>
						{/each}
						<li>Jika tidak ada yang cocok, potong kabel ke-{ordinal(table.fallback)}.</li>
					</ol>
				</section>
			{/each}
		{:else if tab === 'button'}
			<h2>Tombol Besar</h2>
			<p>Satu tombol besar berwarna dengan tulisan di atasnya. Ikuti aturan pertama yang cocok.</p>
			<ol class="rule-block">
				{#each manual.button.rules as rule, i (i)}
					<li>
						{i === 0 ? 'Jika' : 'Jika tidak,'} <strong>{describeButtonCond(rule.cond)}</strong>,
						{ACTION[rule.action]}.
					</li>
				{/each}
			<li>Jika tidak ada yang cocok, {ACTION[manual.button.fallback]}.</li>
			</ol>
			<h3>Menahan tombol</h3>
			<p>Saat tombol ditahan, sebuah garis di sebelahnya akan menyala. Lepaskan ketika angka ini muncul di <em>posisi mana pun</em> pada penghitung waktu:</p>
			<div class="strip-table">
				{#each STRIP_COLORS as color (color)}
					<div class="strip-row">
						<span class="swatch" style="--s: var(--sw-{color})"></span>
						<span>Garis {colorName[color] ?? color}</span>
						<strong>{manual.button.strip[color]}</strong>
					</div>
				{/each}
			</div>
		{:else if tab === 'keypad'}
			<h2>Papan Tombol</h2>
			<p>
				Ada empat tombol, masing-masing dengan simbol. Hanya satu kolom di bawah yang memuat keempatnya.
				Tekan tombol sesuai urutan simbol pada kolom tersebut, dari atas ke bawah.
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
				Empat tombol berwarna akan berkedip membentuk urutan. Untuk setiap kedipan, tekan warna pengganti
				sesuai tabel. Urutannya bertambah satu setiap ronde. Tabel bergantung pada nomor seri dan jumlah
				kesalahan, jadi perhatikan keduanya.
			</p>
			{#each [{ title: 'Nomor seri mengandung huruf vokal', rows: manual.simon.vowel }, { title: 'Nomor seri tidak mengandung huruf vokal', rows: manual.simon.noVowel }] as table (table.title)}
				<section class="rule-block">
					<h3>{table.title}</h3>
					<table>
						<thead>
							<tr>
								<th>Kedipan</th>
								<th>0 kesalahan</th>
								<th>1 kesalahan</th>
								<th>2 kesalahan</th>
							</tr>
						</thead>
						<tbody>
							{#each SIMON_COLORS as flash (flash)}
								<tr>
							<th><span class="chip" style="--s: var(--sw-{flash})">{colorName[flash] ?? flash}</span></th>
									{#each table.rows as row, i (i)}
						<td><span class="chip" style="--s: var(--sw-{row[flash]})">{colorName[row[flash]] ?? row[flash]}</span></td>
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
