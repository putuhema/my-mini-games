// Burger for Two: the ingredient catalogue, shared by the Convex functions and the client.
// Everything about an ingredient lives in its one entry here: how it's drawn, how each
// customer voice names it, and how it cooks. Which dish uses it lives in dishes.ts.
// Adding an ingredient is a new entry here plus a drawing (Ingredient.svelte for burger
// layers, Item.svelte for plates and bowls).

export type Doneness = 'raw' | 'cooked' | 'burnt';

/** One component of a dish. A burger's layers run bottom to top; plates and bowls don't care
 * about order. `state` is only set on cookable ingredients. */
export type Layer = { ing: string; state?: Doneness };

/** How customers talk. Each ingredient names itself in each voice (falling back to `plain`). */
export type Voice =
	| 'plain'
	| 'kid'
	| 'fancy'
	| 'gym'
	| 'terse'
	| 'grandma'
	| 'tourist'
	| 'chat'
	| 'vague'
	| 'riddle';

/** Burger layer drawings; see src/lib/burger/Ingredient.svelte. */
export type Shape =
	| 'bunTop'
	| 'bunBottom'
	| 'patty'
	| 'slice'
	| 'leaf'
	| 'discs'
	| 'rings'
	| 'strips'
	| 'egg'
	| 'sauce';

export type Ingredient = {
	label: string;
	/** Burger layers only: the layer drawing and its height (the burger is 200 wide). */
	shape?: Shape;
	height?: number;
	/** Main colour, then a darker accent. Cookables use `cook.colors` instead. */
	colors: [string, string];
	/** Buns can't be left off a burger without comment (see scoring.ts). */
	bun?: boolean;
	names: Partial<Record<Voice, string[]>> & { plain: string[] };
	/** Cooked on the grill or in the pot: when it's done, when it's ruined, and how it looks. */
	cook?: {
		cookMs: number;
		burnMs: number;
		colors: Record<Doneness, [string, string]>;
		/** What the chef sees on each stage. */
		labels: Record<Doneness, string>;
		/** "Burnt" for things on the grill, "soggy" for noodles left in the pot. */
		overdone: 'burnt' | 'soft';
	};
};

const GRILL_LABELS = { raw: 'Raw', cooked: 'Ready!', burnt: 'Burnt' };

export const INGREDIENTS = {
	// ---- Burger ----
	bun_bottom: {
		label: 'Bottom bun',
		shape: 'bunBottom',
		colors: ['#f4a950', '#d9822b'],
		height: 30,
		bun: true,
		names: {
			plain: ['a bottom bun'],
			kid: ['🍞 bottom bread'],
			fancy: ['a toasted brioche foundation', 'the lower brioche'],
			gym: ['the bottom bun (carbs, ugh)', 'a bottom bun'],
			terse: ['bun'],
			grandma: ['the bottom half of the bun'],
			tourist: ['the bread... bottom one'],
			chat: ['roti bwh', 'bun bawah'],
			vague: ['the flat golden base'],
			riddle: ['the foundation everything rests on (bread, south side)']
		}
	},
	bun_top: {
		label: 'Top bun',
		shape: 'bunTop',
		colors: ['#f4a950', '#d9822b'],
		height: 46,
		bun: true,
		names: {
			plain: ['a top bun'],
			kid: ['🍞 top bread with the dots'],
			fancy: ['a sesame-crowned brioche dome', 'the brioche crown'],
			gym: ['the top bun (cheat day)', 'a top bun'],
			terse: ['bun'],
			grandma: ['the top of the bun, the one with the little seeds'],
			tourist: ['the bread hat... with seeds?'],
			chat: ['roti ats', 'bun atas'],
			vague: ['the dotty golden dome'],
			riddle: ['the bread hat with freckles']
		}
	},
	beef: {
		label: 'Beef patty',
		shape: 'patty',
		colors: ['#8a4b2c', '#5e2f18'],
		height: 26,
		names: {
			plain: ['a beef patty'],
			kid: ['🥩 meat circle'],
			fancy: ['a hand-pressed wagyu-adjacent beef medallion', 'a beef medallion'],
			gym: ['a beef patty (30g protein)', 'a BEEF patty'],
			terse: ['beef'],
			grandma: ['a nice beef patty'],
			tourist: ['the cow meat, round', 'daging sapi... yes?'],
			chat: ['patty sapi', 'dging sapi'],
			vague: ['the dark brown disc'],
			riddle: ['what the cow left behind, pressed flat']
		},
		cook: {
			cookMs: 4_000,
			burnMs: 11_000,
			colors: { raw: ['#ef8f8f', '#d46a6a'], cooked: ['#8a4b2c', '#5e2f18'], burnt: ['#2e211b', '#16100c'] },
			labels: GRILL_LABELS,
			overdone: 'burnt'
		}
	},
	chicken: {
		label: 'Chicken patty',
		shape: 'patty',
		colors: ['#e2a453', '#b97a2e'],
		height: 26,
		names: {
			plain: ['a chicken patty'],
			kid: ['🐔 chicken circle'],
			fancy: ['a free-range poultry cutlet', 'a golden chicken cutlet'],
			gym: ['a chicken patty (lean gains)', 'a CHICKEN patty'],
			terse: ['chicken'],
			grandma: ['a piece of chicken'],
			tourist: ['the chicken... round, not stick'],
			chat: ['patty ayam', 'ptty ayam'],
			vague: ['the golden-crispy disc'],
			riddle: ['the bird that crossed the road, flattened']
		},
		cook: {
			cookMs: 6_000,
			burnMs: 13_000,
			colors: { raw: ['#f6d1c2', '#e3ad98'], cooked: ['#e2a453', '#b97a2e'], burnt: ['#3a2a1c', '#1d140c'] },
			labels: GRILL_LABELS,
			overdone: 'burnt'
		}
	},
	cheese: {
		label: 'Cheese',
		shape: 'slice',
		colors: ['#ffd23f', '#f0a800'],
		height: 12,
		names: {
			plain: ['a slice of cheese'],
			kid: ['🧀'],
			fancy: ['a molten cheddar coverlet', 'a veil of aged cheddar'],
			gym: ['cheese (healthy fats)'],
			terse: ['cheese'],
			grandma: ['a slice of cheese, the orange kind'],
			tourist: ['cheese... fromage... keju!'],
			chat: ['keju', 'kju'],
			vague: ['the melty yellow sheet'],
			riddle: ['what the mouse dreams of']
		}
	},
	lettuce: {
		label: 'Lettuce',
		shape: 'leaf',
		colors: ['#6fcf3c', '#3f9a1c'],
		height: 16,
		names: {
			plain: ['lettuce'],
			kid: ['🥬 (yuck but ok)', '🥬'],
			fancy: ['a crisp leaf of butter lettuce', 'a ruffle of garden greens'],
			gym: ['lettuce (fibre, whatever)'],
			terse: ['lettuce'],
			grandma: ['some lettuce, for your health'],
			tourist: ['the salad leaf'],
			chat: ['selada', 'slada'],
			vague: ['the frilly green layer'],
			riddle: ["the rabbit's favourite, flat and frilly"]
		}
	},
	tomato: {
		label: 'Tomato',
		shape: 'discs',
		colors: ['#ff5a4e', '#c9302a'],
		height: 14,
		names: {
			plain: ['tomato'],
			kid: ['🍅'],
			fancy: ['heirloom tomato, sliced thin', 'a blush of heirloom tomato'],
			gym: ['tomato (lycopene, bro)'],
			terse: ['tomato'],
			grandma: ['a tomato slice, like the ones from my garden'],
			tourist: ['to-MAH-to'],
			chat: ['tomat', 'tmt'],
			vague: ['the juicy red slices'],
			riddle: ['a fruit pretending to be a vegetable']
		}
	},
	onion: {
		label: 'Onion',
		shape: 'rings',
		colors: ['#e9d7f2', '#b48ccb'],
		height: 11,
		names: {
			plain: ['onion'],
			kid: ['🧅 (the crying vegetable)'],
			fancy: ['shaved red onion', 'a whisper of red onion'],
			gym: ['onion'],
			terse: ['onion'],
			grandma: ['a bit of onion, not too much'],
			tourist: ['onion rings, not fried'],
			chat: ['bawang bombay', 'bombay'],
			vague: ['the pale purple rings'],
			riddle: ['the one that makes grown men cry, in rings']
		}
	},
	pickles: {
		label: 'Pickles',
		shape: 'discs',
		colors: ['#8fbf3a', '#5c8a1e'],
		height: 11,
		names: {
			plain: ['pickles'],
			kid: ['🥒 pickles'],
			fancy: ['house-cured cornichons', 'a constellation of pickles'],
			gym: ['pickles (zero calories)'],
			terse: ['pickles'],
			grandma: ['pickles, I do love a pickle'],
			tourist: ['the sour cucumber coins'],
			chat: ['acar', 'pickle'],
			vague: ['the little olive-green coins'],
			riddle: ['a cucumber with a sour past']
		}
	},
	bacon: {
		label: 'Bacon',
		shape: 'strips',
		colors: ['#d9534f', '#f7c6a3'],
		height: 13,
		names: {
			plain: ['bacon'],
			kid: ['🥓'],
			fancy: ['applewood-smoked pork belly', 'a lattice of smoked bacon'],
			gym: ['bacon (protein AND fats)'],
			terse: ['bacon'],
			grandma: ['a couple of rashers of bacon'],
			tourist: ['bacon, very crispy'],
			chat: ['bacon', 'bcn'],
			vague: ['the wavy pink-red strips'],
			riddle: ["breakfast's crown jewel, courtesy of the pig"]
		}
	},
	egg: {
		label: 'Fried egg',
		shape: 'egg',
		colors: ['#fffaf0', '#ffb703'],
		height: 16,
		names: {
			plain: ['a fried egg'],
			kid: ['🍳'],
			fancy: ['a sunny-side-up farm egg', 'an egg, fried with intention'],
			gym: ['an egg (6g protein, perfect amino profile)'],
			terse: ['egg'],
			grandma: ['a fried egg, sunny side up'],
			tourist: ['telur... the egg, fried'],
			chat: ['telor ceplok', 'tlr ceplok'],
			vague: ['the white puddle with a sun in it'],
			riddle: ['what came first, fried']
		}
	},
	ketchup: {
		label: 'Ketchup',
		shape: 'sauce',
		colors: ['#e0262b', '#a8151a'],
		height: 9,
		names: {
			plain: ['ketchup'],
			kid: ['🟥 red sauce', 'ketchup 🟥'],
			fancy: ['a tomato reduction', 'a ribbon of tomato coulis'],
			gym: ['ketchup (sugar, but fine)'],
			terse: ['ketchup'],
			grandma: ['a squirt of ketchup'],
			tourist: ['ketchup... the red, not spicy'],
			chat: ['saos tomat', 'saus tmt'],
			vague: ['the bright red swirl'],
			riddle: ['condiment codename K']
		}
	},
	mustard: {
		label: 'Mustard',
		shape: 'sauce',
		colors: ['#ffcc1a', '#d9a400'],
		height: 9,
		names: {
			plain: ['mustard'],
			kid: ['🟨 yellow sauce', 'mustard 🟨'],
			fancy: ['a Dijon emulsion', 'a stroke of mustard'],
			gym: ['mustard (zero cal, love it)'],
			terse: ['mustard'],
			grandma: ['a little mustard'],
			tourist: ['the yellow sauce, moutarde'],
			chat: ['mustard', 'mstrd'],
			vague: ['the sunny yellow swirl'],
			riddle: ['condiment codename M']
		}
	},

	// ---- Sate ayam ----
	sate: {
		label: 'Chicken skewer',
		colors: ['#b8662e', '#7a3d17'],
		names: {
			plain: ['a chicken skewer'],
			kid: ['🍢 meat stick'],
			fancy: ['a skewer of charcoal-kissed chicken'],
			gym: ['a chicken skewer (protein on a stick)'],
			terse: ['skewer'],
			grandma: ['a little stick of chicken'],
			tourist: ['one sah-tay stick'],
			chat: ['tusuk', 'tsk sate'],
			vague: ['a stick of glossy brown chunks'],
			riddle: ['meat on a tiny sword']
		},
		cook: {
			cookMs: 4_000,
			burnMs: 10_000,
			colors: { raw: ['#f2b8a6', '#d98f7a'], cooked: ['#b8662e', '#7a3d17'], burnt: ['#2f1d12', '#140b06'] },
			labels: GRILL_LABELS,
			overdone: 'burnt'
		}
	},
	peanut_sauce: {
		label: 'Peanut sauce',
		colors: ['#a8642a', '#7a4417'],
		names: {
			plain: ['peanut sauce'],
			kid: ['🥜 peanut sauce'],
			fancy: ['a velvety satay peanut jus'],
			gym: ['peanut sauce (good fats)'],
			terse: ['peanut sauce'],
			grandma: ['that lovely peanut sauce'],
			tourist: ['bum-bu ka-chang... peanut sauce'],
			chat: ['bumbu kacang', 'bmbu kcg'],
			vague: ['the thick brown gravy'],
			riddle: ['liquid peanut']
		}
	},
	kecap: {
		label: 'Kecap manis',
		colors: ['#2a1608', '#120802'],
		names: {
			plain: ['sweet soy sauce (kecap manis)'],
			kid: ['the black sweet sauce'],
			fancy: ['a glaze of kecap manis'],
			gym: ['kecap (sugar... fine, cheat day)'],
			terse: ['kecap'],
			grandma: ['the sweet black soy sauce'],
			tourist: ['ke-chap... no, not ketchup! the black one'],
			chat: ['kecap', 'kcp'],
			vague: ['the glossy black drizzle'],
			riddle: ['sweet black ink']
		}
	},
	sambal: {
		label: 'Sambal',
		colors: ['#e3261b', '#9e1208'],
		names: {
			plain: ['sambal (chilli sauce)'],
			kid: ['🌶️ spicy sauce (just a tiny bit)'],
			fancy: ['a fiery sambal'],
			gym: ['sambal (boosts metabolism)'],
			terse: ['sambal'],
			grandma: ['a little chilli, not too hot'],
			tourist: ['sam-bal, the hot one, I am brave'],
			chat: ['sambel', 'smbl'],
			vague: ['the angry red blob'],
			riddle: ['red fire in a spoon']
		}
	},
	fried_shallot: {
		label: 'Fried shallots',
		colors: ['#c98a3a', '#8a5719'],
		names: {
			plain: ['fried shallots (bawang goreng)'],
			kid: ['the crunchy bits'],
			fancy: ['a scattering of crisp fried shallots'],
			gym: ['fried shallots'],
			terse: ['fried shallots'],
			grandma: ['those crispy fried onions'],
			tourist: ['ba-wang go-reng, the crunchy'],
			chat: ['bawang goreng', 'bwg grg'],
			vague: ['the crunchy brown confetti'],
			riddle: ['onions that went to the fryer and came back brave']
		}
	},
	shallot: {
		label: 'Raw shallots',
		colors: ['#b86a9e', '#7d3f6a'],
		names: {
			plain: ['raw shallots'],
			kid: ['purple onion bits'],
			fancy: ['raw shallots, sliced paper-thin'],
			gym: ['raw shallots'],
			terse: ['shallots'],
			grandma: ['some raw shallots'],
			tourist: ['the small purple onion, raw'],
			chat: ['bawang merah', 'bwg mrh'],
			vague: ['the little purple moons'],
			riddle: ["the onion's smaller cousin, uncooked"]
		}
	},
	lime: {
		label: 'Lime',
		colors: ['#8bd13f', '#4d8f12'],
		names: {
			plain: ['a lime wedge'],
			kid: ['🟢 sour lime'],
			fancy: ['a wedge of calamansi-adjacent lime'],
			gym: ['a lime wedge (vitamin C)'],
			terse: ['lime'],
			grandma: ['a bit of lime to squeeze'],
			tourist: ['the small green lemon'],
			chat: ['jeruk nipis', 'jrk nps'],
			vague: ['the green moon wedge'],
			riddle: ['a small, sour, green bomb']
		}
	},
	cucumber: {
		label: 'Cucumber',
		colors: ['#c8eaa4', '#4f9a2e'],
		names: {
			plain: ['cucumber slices'],
			kid: ['🥒 cucumber'],
			fancy: ['cool cucumber coins'],
			gym: ['cucumber (hydration)'],
			terse: ['cucumber'],
			grandma: ['some cucumber, nice and cool'],
			tourist: ['the cucumber, fresh, not pickled'],
			chat: ['timun', 'tmn'],
			vague: ['the pale green coins with seeds'],
			riddle: ['the coolest thing in the room, sliced']
		}
	},
	lontong: {
		label: 'Lontong',
		colors: ['#f3f5e6', '#8fb85a'],
		names: {
			plain: ['lontong (rice cake)'],
			kid: ['🍙 rice cake'],
			fancy: ['pressed rice cakes, banana-leaf wrapped'],
			gym: ['lontong (carbs for the pump)'],
			terse: ['lontong'],
			grandma: ['some of those rice cakes'],
			tourist: ['lon-tong, the rice... cylinder?'],
			chat: ['lontong', 'lntg'],
			vague: ['the white cylinders with green edges'],
			riddle: ['rice in disguise, wrapped in a leaf']
		}
	},
	soup: {
		label: 'Side soup',
		colors: ['#f2c14e', '#c98a1e'],
		names: {
			plain: ['a side of soup'],
			kid: ['🥣 soup on the side'],
			fancy: ['a small consommé on the side'],
			gym: ['a side of soup'],
			terse: ['soup'],
			grandma: ['a little bowl of soup, for my throat'],
			tourist: ['soup, small bowl, side'],
			chat: ['sup', 'kuah sup'],
			vague: ['the little golden pond on the side'],
			riddle: ['liquid comfort in a tiny bowl']
		}
	},

	// ---- Mie ayam ----
	noodles: {
		label: 'Noodles',
		colors: ['#f3cf5e', '#c99a2a'],
		names: {
			plain: ['noodles'],
			kid: ['🍜 noodles'],
			fancy: ['hand-pulled egg noodles'],
			gym: ['noodles (carb load)'],
			terse: ['noodles'],
			grandma: ['the noodles'],
			tourist: ['the mee, yellow noodles'],
			chat: ['mie', 'mi'],
			vague: ['the curly yellow strings'],
			riddle: ['edible strings']
		},
		cook: {
			cookMs: 5_000,
			burnMs: 13_000,
			colors: { raw: ['#f7e7a8', '#d9c06a'], cooked: ['#f3cf5e', '#c99a2a'], burnt: ['#f6ead0', '#d8c49a'] },
			labels: { raw: 'Hard', cooked: 'Ready!', burnt: 'Soggy' },
			overdone: 'soft'
		}
	},
	chicken_topping: {
		label: 'Soy chicken',
		colors: ['#9a5a2a', '#5c3012'],
		names: {
			plain: ['soy-braised chicken'],
			kid: ['🍗 chicken bits'],
			fancy: ['chicken braised in sweet soy'],
			gym: ['the chicken (MORE protein)'],
			terse: ['chicken'],
			grandma: ['the little pieces of chicken'],
			tourist: ['ah-yam, the chicken pieces'],
			chat: ['ayam', 'ayam kcp'],
			vague: ['the glossy brown cubes'],
			riddle: ['bird, diced, sweet-soy undercover']
		}
	},
	bok_choy: {
		label: 'Bok choy',
		colors: ['#3fa83a', '#cdeec0'],
		names: {
			plain: ['bok choy (sawi)'],
			kid: ['🥬 green leaf (yuck)'],
			fancy: ['blanched baby bok choy'],
			gym: ['greens (micronutrients)'],
			terse: ['greens'],
			grandma: ['some greens, you need your greens'],
			tourist: ['the green leaf vegetable'],
			chat: ['sawi', 'swi'],
			vague: ['the dark green leaves with white stems'],
			riddle: ['the leafy green agent']
		}
	},
	meatball: {
		label: 'Meatball',
		colors: ['#b59a86', '#7e6553'],
		names: {
			plain: ['a meatball (bakso)'],
			kid: ['⚽ meatball'],
			fancy: ['a hand-rolled beef bakso'],
			gym: ['a meatball (protein sphere)'],
			terse: ['bakso'],
			grandma: ['a meatball'],
			tourist: ['bak-so, the bouncy ball'],
			chat: ['bakso', 'bks'],
			vague: ['a grey bouncy ball'],
			riddle: ['the sphere that bounces back']
		}
	},
	wonton: {
		label: 'Wonton',
		colors: ['#f2d08a', '#c99a46'],
		names: {
			plain: ['a fried wonton (pangsit)'],
			kid: ['🥟 crunchy dumpling'],
			fancy: ['a crisp golden wonton'],
			gym: ['a wonton (cheat meal)'],
			terse: ['wonton'],
			grandma: ['one of those crunchy dumplings'],
			tourist: ['pang-sit, the crispy pillow'],
			chat: ['pangsit', 'pngst'],
			vague: ['the crinkly golden pillow'],
			riddle: ['a crispy envelope with a secret inside']
		}
	},
	green_onion: {
		label: 'Spring onion',
		colors: ['#5fcf4f', '#2e8a24'],
		names: {
			plain: ['spring onion'],
			kid: ['tiny green circles'],
			fancy: ['a sprinkle of scallion'],
			gym: ['spring onion'],
			terse: ['spring onion'],
			grandma: ['a pinch of spring onion'],
			tourist: ['the green onion, small rings'],
			chat: ['daun bawang', 'dn bwg'],
			vague: ['the tiny green rings'],
			riddle: ["the onion's green hair, chopped"]
		}
	},
	broth: {
		label: 'Broth',
		colors: ['#e8b452', '#b47a1e'],
		names: {
			plain: ['broth in the bowl'],
			kid: ['🥣 soup water'],
			fancy: ['a golden chicken broth'],
			gym: ['broth (collagen)'],
			terse: ['broth'],
			grandma: ['plenty of broth, dear'],
			tourist: ['kuah, the soup inside'],
			chat: ['kuah', 'pk kuah'],
			vague: ['the golden lake'],
			riddle: ['the hot pool the strings swim in']
		}
	}
} as const satisfies Record<string, Ingredient>;

export type IngredientId = keyof typeof INGREDIENTS;

export const INGREDIENT_IDS = Object.keys(INGREDIENTS) as IngredientId[];

export function ingredient(id: string): Ingredient {
	const found = (INGREDIENTS as Record<string, Ingredient>)[id];
	if (!found) throw new Error(`Unknown ingredient: ${id}`);
	return found;
}

export const isIngredient = (id: string): id is IngredientId => id in INGREDIENTS;

/** How done a cookable ingredient is after this long on the grill or in the pot. */
export function donenessAfter(id: string, ms: number): Doneness {
	const cook = ingredient(id).cook;
	if (!cook) return 'cooked';
	if (ms >= cook.burnMs) return 'burnt';
	if (ms >= cook.cookMs) return 'cooked';
	return 'raw';
}

/** The colours to draw a layer with, taking doneness into account. */
export function layerColors(layer: Layer): [string, string] {
	const ing = ingredient(layer.ing);
	if (ing.cook && layer.state) return ing.cook.colors[layer.state];
	return ing.colors;
}

export const MAX_STACK = 16;
