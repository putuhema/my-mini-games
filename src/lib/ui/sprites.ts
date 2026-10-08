// Pixel sprites: one string per row, '.' is empty, letters map to palette keys.
// Drawn by Sprite.svelte as SVG rects; render at whole-number scales only.

export type SpriteData = { rows: string[]; colors: Record<string, string> };

export const SPRITES = {
	heart: {
		rows: ['.pp.pp.', 'pwpppPp', 'ppppppP', '.pppPP.', '..pPP..', '...P...'],
		colors: { p: '#ff6b9a', P: '#c4426f', w: '#ffd1e1' }
	},
	heartMint: {
		rows: ['.pp.pp.', 'pwpppPp', 'ppppppP', '.pppPP.', '..pPP..', '...P...'],
		colors: { p: '#6bff9e', P: '#23a85a', w: '#c9ffdc' }
	},
	star: {
		rows: ['...g...', '...g...', '..gwg..', 'ggggggG', '.gggGG.', '.gG.GG.', 'gG...GG'],
		colors: { g: '#ffc44d', G: '#c98a1e', w: '#fff2c4' }
	},
	bomb: {
		rows: ['.....o.', '....o..', '...cc..', '.cccccc', 'cwccccC', 'ccccccC', 'cccccCC', '.cCCCC.'],
		colors: { c: '#2b4a3c', C: '#16301f', w: '#86a896', o: '#ffb347' }
	},
	die: {
		rows: ['ffffff.', 'fkfffkF', 'ffffffF', 'fffkffF', 'ffffffF', 'fkfffkF', '.FFFFFF'],
		colors: { f: '#eafff2', F: '#86a896', k: '#050b08' }
	},
	firefly: {
		rows: ['.a....a.', '..a..a..', '..bbbb..', '.wbbbbw.', 'wwbbbbww', '.wggggw.', '..gGGg..', '...gg...'],
		colors: { a: '#86a896', b: '#3e5a4b', w: '#c9ffdc', g: '#d4f55c', G: '#fffbd0' }
	},
	snake: {
		rows: [
			'.......ccc..',
			'......ckcck.',
			'......cccccr',
			'.cc...cc....',
			'cccc..cc....',
			'cC.cccCc....',
			'.....CC.....'
		],
		colors: { c: '#6bff9e', C: '#23a85a', k: '#050b08', r: '#ff6b9a' }
	},
	ladder: {
		rows: ['g.....g', 'ggggggg', 'g.....g', 'ggggggg', 'g.....g', 'ggggggg', 'g.....g'],
		colors: { g: '#ffc44d' }
	},
	chat: {
		rows: ['.ccccc.', 'cccccccC', 'cwcwcwcC', 'cccccccC', '.cccccC.', '..cC....', '.c......'],
		colors: { c: '#c9a2ff', C: '#8466c4', w: '#050b08' }
	},
	burger: {
		rows: ['..bbbb..', '.bwbbbb.', 'bbbbbbbb', 'gggggggg', 'mmmmmmmm', 'cccccccc', 'bbbbbbbb', '.BBBBBB.'],
		colors: { b: '#ffb347', B: '#c26a1a', w: '#fff2c4', g: '#6bff9e', m: '#8a4b2a', c: '#ffc44d' }
	}
} satisfies Record<string, SpriteData>;

export type SpriteName = keyof typeof SPRITES;
