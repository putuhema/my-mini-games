// Burger for Two: customer types. Each one is a single data entry: what they like to order,
// how they say it (voice + speak), how long they wait, how they look and what they say back.
// Add a customer by adding an entry to CUSTOMERS; the generator and UI pick it up.

import type { DishId, Taste } from './dishes';
import type { Voice } from './ingredients';

export type Tier = 'perfect' | 'close' | 'confused' | 'angry';
export type Rand = () => number;
/** Which way the customer lists a burger's layers. */
export type Direction = 'up' | 'down';

export const pick = <T>(r: Rand, arr: readonly T[]): T => arr[Math.floor(r() * arr.length)];

export function stripArticle(name: string) {
	return name.replace(/^(a|an|the|some) /, '');
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

const INDO_NUMBERS = ['nol', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh'];
const WORD_NUMBERS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'];

/** Voice rules: repeats ("DOUBLE beef"), overdone cooking, "no onions", and changes of mind. */
export const VOICES: Record<
	Voice,
	{
		repeat: (name: string, n: number) => string;
		overdone: (name: string, style: 'burnt' | 'soft') => string;
		refuse: (name: string) => string;
		add: (name: string) => string;
		remove: (name: string) => string;
		swap: (from: string, to: string) => string;
	}
> = {
	plain: {
		repeat: (name, n) => `${WORD_NUMBERS[n] ?? n} of ${stripArticle(name)}`,
		overdone: (name, s) => (s === 'burnt' ? `${name}, burnt to a crisp` : `${name}, cooked extra soft`),
		refuse: (name) => `And NO ${stripArticle(name)}, please.`,
		add: (name) => `can you add ${name} too?`,
		remove: (name) => `actually, no ${stripArticle(name)}.`,
		swap: (a, b) => `swap the ${stripArticle(a)} for ${b}?`
	},
	kid: {
		repeat: (name, n) => `${name} x${n}!!`,
		overdone: (name, s) => (s === 'burnt' ? `${name} but the BLACK crunchy kind` : `${name} but the floppy kind`),
		refuse: (name) => `NO ${stripArticle(name)}!!! 🙅`,
		add: (name) => `i want ${name} TOO!!`,
		remove: (name) => `NO ${stripArticle(name)} i changed my mind 😤`,
		swap: (a, b) => `no ${stripArticle(a)}, ${b} instead!!`
	},
	fancy: {
		repeat: (name, n) => `${name}, ${n === 2 ? 'twice over' : `${WORD_NUMBERS[n] ?? n} times over`}`,
		overdone: (name, s) =>
			s === 'burnt' ? `${name}, carbonised — deliberately` : `${name}, cooked to a gentle surrender`,
		refuse: (name) => `I shall not tolerate ${stripArticle(name)}.`,
		add: (name) => `on reflection, the composition demands ${name}.`,
		remove: (name) => `strike the ${stripArticle(name)}. It offends me.`,
		swap: (a, b) => `replace the ${stripArticle(a)} with ${b}. Trust me.`
	},
	gym: {
		repeat: (name, n) => `${['', '', 'DOUBLE', 'TRIPLE', 'QUADRUPLE', 'FIVE'][n] ?? `${n}x`} ${stripArticle(name)}`,
		overdone: (name, s) => (s === 'burnt' ? `${name}, charred` : `${name}, soft (easy digestion)`),
		refuse: (name) => `ZERO ${stripArticle(name)}. Off the plan.`,
		add: (name) => `add ${name}, I'm bulking.`,
		remove: (name) => `cut the ${stripArticle(name)}. I'm cutting.`,
		swap: (a, b) => `swap ${stripArticle(a)} for ${b}. Macros.`
	},
	terse: {
		repeat: (name, n) => `${name} x${n}`,
		overdone: (name, s) => `${name}, ${s === 'burnt' ? 'burnt' : 'soft'}`,
		refuse: (name) => `No ${stripArticle(name)}.`,
		add: (name) => `Add ${name}.`,
		remove: (name) => `Drop the ${stripArticle(name)}.`,
		swap: (a, b) => `${cap(stripArticle(a))} out, ${b} in.`
	},
	grandma: {
		repeat: (name, n) => (n === 2 ? `${name}, and then another one just like it` : `${name} — ${n} of them, dear`),
		overdone: (name, s) =>
			s === 'burnt'
				? `${name}, well done — burnt, really, the way Harold liked it`
				: `${name}, nice and soft for my teeth`,
		refuse: (name) => `Oh, and no ${stripArticle(name)}, dear, it doesn't agree with me.`,
		add: (name) => `I forgot — could I have ${name} as well?`,
		remove: (name) => `no ${stripArticle(name)} after all, my doctor says.`,
		swap: (a, b) => `could you swap the ${stripArticle(a)} for ${b}? Harold always did.`
	},
	tourist: {
		repeat: (name, n) => `${name}... ${INDO_NUMBERS[n] ?? n}? ${n}! ${n} of them`,
		overdone: (name, s) =>
			s === 'burnt' ? `${name}, very black... burned? yes, burned` : `${name}, very soft, like for baby`,
		refuse: (name) => `But no ${stripArticle(name)}. Tidak! I think I am allergic.`,
		add: (name) => `also... ${name}? I see it on Instagram.`,
		remove: (name) => `no ${stripArticle(name)}, sorry, my phrasebook says it is spicy.`,
		swap: (a, b) => `not ${stripArticle(a)}... ${b}! Yes.`
	},
	chat: {
		repeat: (name, n) => `${name} ${n}`,
		overdone: (name, s) => `${name} ${s === 'burnt' ? 'gosong' : 'lembek'}`,
		refuse: (name) => `gk pake ${stripArticle(name)}`,
		add: (name) => `tambah ${name} kak`,
		remove: (name) => `${stripArticle(name)} gk jd kak`,
		swap: (a, b) => `${stripArticle(a)} ganti ${b}`
	},
	vague: {
		repeat: (name, n) => `${name} ×${n}`,
		overdone: (name, s) => `${name}, but the ${s === 'burnt' ? 'black crispy' : 'floppy pale'} version`,
		refuse: (name) => `And nothing that looks like ${stripArticle(name)}. Off-brand.`,
		add: (name) => `it needs ${name}. For the colour story.`,
		remove: (name) => `lose ${name}. It's clashing.`,
		swap: (a, b) => `swap ${a} for ${b}. Trust the vibe.`
	},
	riddle: {
		repeat: (name, n) => `${name}, times ${n}`,
		overdone: (name, s) => `${name}, ${s === 'burnt' ? 'kissed by fire far too long' : 'left to surrender in the pot'}`,
		refuse: (name) => `Under no circumstances: ${stripArticle(name)}.`,
		add: (name) => `new intel: include ${name}.`,
		remove: (name) => `abort ${stripArticle(name)}. Compromised.`,
		swap: (a, b) => `replace ${a} with ${b}. Repeat: replace.`
	}
};

export type Look = {
	skin: string;
	hair: string;
	shirt: string;
	hairStyle: 'cap' | 'bun' | 'slick' | 'buzz' | 'beret' | 'sunhat' | 'long' | 'helmet' | 'messy';
	accessory?: 'monocle' | 'glasses' | 'headband' | 'tie' | 'freckles' | 'sunglasses' | 'earpiece' | 'phone';
	/** Kids are drawn smaller. */
	small?: boolean;
};

export type SpeakContext = {
	/** The dish, named in the customer's voice. */
	dish: string;
	/** Already-named components, grouped ("DOUBLE beef patty"). */
	parts: string[];
	/** Burgers: the customer lists layers bottom-up or top-down. */
	ordered: boolean;
	dir: Direction;
	r: Rand;
};

export type CustomerType = {
	label: string;
	names: readonly string[];
	voice: Voice;
	seconds: number;
	tipMultiplier: number;
	/** How often they order each dish. */
	dishes: Partial<Record<DishId, number>>;
	taste: Taste;
	/** Chance the order comes as a picture instead of a description. */
	pictureChance: number;
	pictureStyle: 'drawing' | 'photo';
	/** Said with a picture order; {dish} is the dish's name. */
	pictureLines: readonly string[];
	/** Chance they change their mind partway through (scaled by difficulty), and how it starts. */
	change: { chance: number; intro: readonly string[] };
	look: Look;
	speak: (c: SpeakContext) => string;
	/** Said the moment the food is served. {dish} = "burger", {a dish} = "a burger". */
	reactions: Record<Tier, readonly string[]>;
	/** The one-liner on the end-of-shift review card. */
	reviews: Record<Tier, readonly string[]>;
};

function listWith(parts: string[], sep: string, last: string) {
	if (parts.length <= 1) return parts.join('');
	return `${parts.slice(0, -1).join(sep)}${last}${parts.at(-1)}`;
}

export const CUSTOMERS = {
	kid: {
		label: 'Kid',
		names: ['Timmy, 7', 'Mia, 6', 'Leo, 8', 'Zoe, 5', 'Max, 7'],
		voice: 'kid',
		seconds: 75,
		tipMultiplier: 0.6,
		dishes: { burger: 3, noodle: 2, sate: 1 },
		taste: { likes: ['cheese', 'ketchup', 'meatball', 'wonton'], dislikes: ['onion', 'sambal', 'shallot'], size: -1 },
		pictureChance: 0.45,
		pictureStyle: 'drawing',
		pictureLines: ['I DREW IT!! make this one 🖍️👇', 'my {dish} picture!!! 🎨 this one pls', 'look look look 👀 i want THIS'],
		change: { chance: 0.25, intro: ['WAIT WAIT WAIT', 'umm actually', 'MOMMY SAYS'] },
		look: { skin: '#ffd7b5', hair: '#e8a33d', shirt: '#1cb0f6', hairStyle: 'cap', accessory: 'freckles', small: true },
		speak: ({ dish, parts, ordered, dir, r }) => {
			const open = pick(r, ['hiiii!! 👋', 'um um um 🤔', 'HI!!! 😄', 'ok so 👉']);
			const close = pick(r, ['ok thank u!! ✨', "that's it!! 😋", 'and hurry pls 🏃💨', 'pleeeease 🙏']);
			if (!ordered) return `${open} can i have ${dish} with ${parts.join(' and ')}. ${close}`;
			const how = dir === 'up' ? pick(r, ['first at the bottom', 'start at the bottom']) : 'START AT THE TOP ⬆️';
			return `${open} i want ${dish}!! ${how}: ${parts.join(' then ')}. ${close}`;
		},
		reactions: {
			perfect: ['YAAAAY!! 🎉', 'BEST. {dish}. EVER!!', "I'm gonna tell everyone at school!!"],
			close: ['ok this is pretty good 👍', 'yummy... mostly', 'not bad!! 😊'],
			confused: ['...that is not what i said 🤨', 'um. why is it like that', 'i asked nicely though'],
			angry: ["I'M TELLING MY MOM.", 'WAAAAAH 😭', 'this is the worst day of my LIFE']
		},
		reviews: {
			perfect: ['10/10 would eat again. Then I threw up from happiness.', 'I gave the chef my best sticker.'],
			close: ['Pretty good {dish}. I only cried a little.', 'My dog liked the part I dropped.'],
			confused: ['They made a different {dish} than I said. Rude.', 'I asked for {a dish} and got a science project.'],
			angry: ['I asked for {a dish}. I received a crime.', 'My mom is writing a letter.']
		}
	},
	critic: {
		label: 'Food critic',
		names: ['Monsieur Fromage', 'Dame Penelope Crust', 'Julian Saltworth', 'Celeste Umami'],
		voice: 'fancy',
		seconds: 70,
		tipMultiplier: 1.6,
		dishes: { burger: 1, sate: 1, noodle: 1 },
		taste: { size: 1 },
		pictureChance: 0.2,
		pictureStyle: 'photo',
		pictureLines: [
			'Surely you recognise this — the photograph from my award-winning review. Reproduce it. Faithfully.',
			'I have brought a reference image of the {dish}. Consider it scripture.'
		],
		change: { chance: 0.2, intro: ['One moment.', 'I have reconsidered.'] },
		look: { skin: '#f1c7a3', hair: '#3b2a24', shirt: '#7b3fa0', hairStyle: 'beret', accessory: 'monocle' },
		speak: ({ dish, parts, ordered, dir, r }) => {
			const open = pick(r, [
				'Good evening. I shall have the following, and do pay attention.',
				'Ah. Yes. I have composed my order.',
				'Listen closely; I will not repeat myself.'
			]);
			const close = pick(r, ['Plate it with dignity.', 'Do not disappoint me. My readers are watching.', 'I will know if you improvise.']);
			if (!ordered) return `${open} I shall have ${dish}, composed thus: ${listWith(parts, '; ', '; and ')}. ${close}`;
			const how =
				dir === 'up'
					? 'From the foundation upward:'
					: pick(r, ['Allow me to describe it from the crown downward:', 'Beginning at the summit and descending:']);
			return `${open} ${cap(dish)}. ${how} ${listWith(parts, '; upon which, ', '; and finally, ')}. ${close}`;
		},
		reactions: {
			perfect: ['Magnifique. I am... moved.', 'A triumph. I may weep.', 'Finally, someone who listens.'],
			close: ['Competent. Almost charming.', 'Hm. Not without merit.', 'A respectable effort.'],
			confused: ['Is this... deconstructed?', 'I ordered a sonnet; you served a limerick.', 'Curious. And not in a good way.'],
			angry: ['An abomination.', 'I am revoking a star from a restaurant you do not even own.', 'Remove it from my sight.']
		},
		reviews: {
			perfect: ['A symphony on a plate. Five stars, and I never give five stars.', 'The chef and cashier communicate like old lovers.'],
			close: ['Nearly faithful to my order. Nearly is a word I use sparingly.', 'Ambitious, flawed, oddly delicious.'],
			confused: ['The {dish} had ideas. None of them were mine.', 'I described a cathedral. They built a shed.'],
			angry: ['I asked for {a dish}. I received a crime.', 'Culinary vandalism. I have alerted the authorities of taste.']
		}
	},
	grandma: {
		label: 'Grandma',
		names: ['Grandma Rose', 'Nana Bea', 'Oma Hilde', 'Eyang Sri'],
		voice: 'grandma',
		seconds: 85,
		tipMultiplier: 1.3,
		dishes: { burger: 1, sate: 2, noodle: 2 },
		taste: { likes: ['lontong', 'soup', 'broth', 'bok_choy'], dislikes: ['sambal'], overdone: 0.4 },
		pictureChance: 0.2,
		pictureStyle: 'photo',
		pictureLines: [
			"My grandson showed me this on his phone. I'd like this one please, dear.",
			'I cut this {dish} out of a magazine in 1987. Can you still make it?'
		],
		change: { chance: 0.3, intro: ['Oh, silly me!', 'Oh dear, wait—', "Now, don't be cross, but"] },
		look: { skin: '#f6d3b8', hair: '#d9d9e3', shirt: '#ff6fae', hairStyle: 'bun', accessory: 'glasses' },
		speak: ({ dish, parts, ordered, dir, r }) => {
			const fillers = [
				'Oh, where was I?',
				'My cat Mittens would love this place.',
				"Did I tell you my grandson's getting married? Lovely girl.",
				'Back in my day this cost a nickel.',
				'Harold — rest his soul — always said the order matters.',
				'Is it chilly in here or is it just me?',
				'Anyway.'
			];
			const open = pick(r, [
				`Oh hello, dear! Now, I'd like ${dish}, the way my Harold used to make it every Sunday, God rest him.`,
				`Hello sweetheart. I'd like ${dish}. Let me tell you about the one I had on my honeymoon in 1962.`,
				`Oh, isn't this place cute! My grandson told me to order ${dish}, exactly how I like it, so here goes.`
			]);
			const how = !ordered
				? 'I like it with'
				: dir === 'up'
					? 'He always started at the bottom with'
					: 'Now I always describe it from the top, dear, so:';
			const sentences: string[] = [];
			parts.forEach((part, i) => {
				sentences.push(i === 0 ? part : `${pick(r, ['then', 'after that', 'and then', 'and', 'also'])} ${part}`);
				if (i < parts.length - 1 && r() < 0.5) sentences.push(pick(r, fillers));
			});
			const close = pick(r, ['Thank you, dear.', 'Take your time, sweetie — well, not too much time.', 'Bless you.']);
			const body = sentences.map((s, i) => (i === 0 ? s : cap(s)));
			return [open, `${how} ${body[0]}`, ...body.slice(1), close]
				.map((s) => (/[.?!:]$/.test(s) ? s : `${s}.`))
				.join(' ');
		},
		reactions: {
			perfect: ['Oh, just like Harold used to make!', 'You are an ANGEL.', "I'm putting you in my will, dear."],
			close: ["Oh, that's lovely, dear.", 'Close enough for me, sweetheart.', 'Very nice, very nice.'],
			confused: ["Oh. Well. I'm sure it's... modern.", 'Is this what the young people eat?', "I'll just pick around it."],
			angry: ['Harold is rolling in his grave.', "I'm not angry, dear. Just disappointed.", "I'll be calling your mother."]
		},
		reviews: {
			perfect: ['Reminded me of my wedding day. Wonderful young people.', 'I knitted the chef a scarf in my head.'],
			close: ['A lovely meal. A little forgetful, like me.', 'Sweet young things. Mostly right.'],
			confused: ['I told them a story and they made a different story.', 'Charming staff. Strange {dish}.'],
			angry: ['I asked for {a dish}. I received a crime.', "I've had better at the church bake sale, and that was a cake."]
		}
	},
	gym: {
		label: 'Gym guy',
		names: ['Chad', 'Brock', 'Tank', 'Jasmine "Swole" Lee', 'Dwayne-ish'],
		voice: 'gym',
		seconds: 60,
		tipMultiplier: 1.1,
		dishes: { burger: 2, sate: 2, noodle: 1 },
		taste: {
			likes: ['beef', 'chicken', 'egg', 'bacon', 'sate', 'chicken_topping', 'meatball'],
			dislikes: ['kecap', 'wonton'],
			size: 0.5
		},
		pictureChance: 0.25,
		pictureStyle: 'photo',
		pictureLines: ['Meal prep pic from my story. THIS. Macros are locked in, bro.', "Bro. This one. It's my lock screen."],
		change: { chance: 0.15, intro: ['Yo, hold up.', 'Bro. Wait.'] },
		look: { skin: '#d8a27a', hair: '#2b1d14', shirt: '#ff4b4b', hairStyle: 'buzz', accessory: 'headband' },
		speak: ({ dish, parts, ordered, dir, r }) => {
			const open = pick(r, ["YO! Leg day's done, let's EAT.", 'Sup bro. Need PROTEIN.', "Gains o'clock, my guy."]);
			const close = pick(r, ['NO CARBS. ...Except the carbs. Carbs are fine.', "Let's GOOO. 💪", 'Protein is a lifestyle.']);
			const how = !ordered ? 'With:' : dir === 'up' ? 'Bottom to top:' : 'Top to bottom, bro:';
			return `${open} ${cap(dish)}. ${how} ${parts.map(cap).join('. ')}. ${close}`;
		},
		reactions: {
			perfect: ['ABSOLUTE GAINS! 💪', 'Bro. BRO. Perfect.', "That's the PR of {dish}."],
			close: ['Solid macros, bro.', 'Decent pump.', "I'd lift that."],
			confused: ['Bro... where are my gains?', 'This is a cheat meal I did not consent to.', 'Huh. Not on the plan.'],
			angry: ["You've ruined my bulk.", 'That is NOT anabolic.', 'I need to lie down. Not from the gym.']
		},
		reviews: {
			perfect: ['Hit my protein goal in one bite. Chef is my new spotter.', 'Flexed so hard after eating this.'],
			close: ['Pretty good macros. Would bulk here again.', 'Almost perfect. Like my deadlift form.'],
			confused: ['Wanted protein. Got plot twists.', 'This {dish} skipped leg day.'],
			angry: ['I asked for {a dish}. I received a crime.', 'Lost 2kg of muscle just looking at it.']
		}
	},
	businessman: {
		label: 'Businessman',
		names: ['Mr. Grant', 'Ms. Sterling', 'Mr. Vance', 'Ms. Okafor'],
		voice: 'terse',
		seconds: 35,
		tipMultiplier: 1.5,
		dishes: { burger: 2, sate: 1, noodle: 1 },
		taste: { size: -0.5 },
		pictureChance: 0.15,
		pictureStyle: 'photo',
		pictureLines: ['This. Screenshot. Go.', 'Image attached. Execute.'],
		change: { chance: 0.1, intro: ['Correction.', 'Update.'] },
		look: { skin: '#e8b996', hair: '#5a4a42', shirt: '#3c4a5c', hairStyle: 'slick', accessory: 'tie' },
		speak: ({ dish, parts, ordered, dir, r }) => {
			const how = !ordered ? '' : dir === 'up' ? pick(r, ['Bottom up.', '']) : 'Top down.';
			const close = pick(r, ['Go.', 'Clock is ticking.', "I'm on a call.", 'Now.']);
			return `${cap(dish)}. ${how} ${parts.join(', ')}. ${close}`.replace(/\s+/g, ' ').trim();
		},
		reactions: {
			perfect: ['Efficient. Good.', 'Acceptable. Excellent, even.', 'Noted. Well done.'],
			close: ['Fine.', "It'll do.", 'Adequate.'],
			confused: ['This was not in the brief.', "Let's circle back on this.", 'Unclear deliverable.'],
			angry: ["I'm escalating this.", 'I want to speak to the manager. Wait — you are the manager.', 'This meeting is over.']
		},
		reviews: {
			perfect: ['Fast. Correct. Would synergise again.', 'Delivered ahead of deadline. Promoting the chef.'],
			close: ['Mostly on spec. Minor scope creep.', 'Decent ROI on my lunch break.'],
			confused: ['Misaligned on deliverables. Lunch was a pivot.', '{dish} did not meet KPIs.'],
			angry: ['I asked for {a dish}. I received a crime.', 'Two words: unacceptable. One more: lawyers.']
		}
	},
	tourist: {
		label: 'Tourist',
		names: ['Hans', 'Brigitte', 'Kevin from Ohio', 'Yuki', 'Pierre'],
		voice: 'tourist',
		seconds: 70,
		tipMultiplier: 1.4,
		dishes: { sate: 3, noodle: 3, burger: 1 },
		taste: { likes: ['peanut_sauce', 'lontong', 'meatball'], size: 0.5 },
		pictureChance: 0.3,
		pictureStyle: 'photo',
		pictureLines: ['I saw this on a food vlog! This {dish}! *points at phone*', 'Ehm... *shows photo* ...this, please? Terima kasih!'],
		change: { chance: 0.25, intro: ['Ah, sorry, sorry!', 'Ehm... wait, maaf—'] },
		look: { skin: '#f7c9a9', hair: '#e6c15c', shirt: '#ffc800', hairStyle: 'sunhat', accessory: 'sunglasses' },
		speak: ({ dish, parts, ordered, dir, r }) => {
			const open = pick(r, ['Hello! Ehm... selamat... siang?', 'Halo halo! I practise my Bahasa, ok?', 'Hi! Sorry, my Indonesian is... sedikit.']);
			const how = !ordered ? 'With...' : dir === 'up' ? 'The bottom... first, then up:' : 'From the top... going down:';
			const close = pick(r, ['Terima kasih banyak!', 'Enak, enak! I hope.', 'Mantap! ...did I say it right?']);
			return `${open} I would like ${dish}, please. ${how} ${parts.join('... and ')}. ${close}`;
		},
		reactions: {
			perfect: ['ENAK SEKALI! 😍', 'This is better than my whole holiday!', 'I am never going home.'],
			close: ['Enak! Mostly!', 'Very good, terima kasih!', 'Ah, almost like the vlog!'],
			confused: ['Is this... the local style?', 'Ehm. Interesting. Very... local?', 'My phrasebook did not prepare me.'],
			angry: ['This is not what the vlog showed!', 'I will write a very polite angry review.', 'I want my holiday money back.']
		},
		reviews: {
			perfect: ['Came for the beaches, stayed for the {dish}. ★★★★★', 'Best meal of my trip. Booking a flight back.'],
			close: ['Very authentic. I think. Lovely staff!', 'Almost exactly what I pointed at. Bagus!'],
			confused: ['Ordered with hand gestures. Received interpretive {dish}.', 'Lost in translation, found something edible.'],
			angry: ['I asked for {a dish}. I received a crime.', 'Worse than the airport food. And that was a sandwich in a bag.']
		}
	},
	teen: {
		label: 'Indecisive teen',
		names: ['Kayla', 'Jaden', 'Brianna', 'Tyler', 'Nadia'],
		voice: 'plain',
		seconds: 65,
		tipMultiplier: 0.8,
		dishes: { burger: 1, sate: 1, noodle: 1 },
		taste: { size: 0.5 },
		pictureChance: 0.1,
		pictureStyle: 'photo',
		pictureLines: ['ok idk what its called but like THIS one 👉📱'],
		change: { chance: 0.85, intro: ['omg wait.', 'ok no wait, sorry—', 'hmm actually...', 'lol wait'] },
		look: { skin: '#e9b48f', hair: '#7a3fbf', shirt: '#ce82ff', hairStyle: 'messy', accessory: 'phone' },
		speak: ({ dish, parts, ordered, dir, r }) => {
			const open = pick(r, ['ok so like...', 'umm hiii', "ok ok i know what i want. i think. ok"]);
			const how = !ordered ? 'with like' : dir === 'up' ? 'from the bottom it goes' : 'ok from the top it goes';
			const close = pick(r, ['...yeah. i think. lol', "that's it. probably.", '...wait. no. yeah. ok go']);
			return `${open} can i get ${dish}? ${how} ${listWith(parts, ', ', ', and ')}. ${close}`;
		},
		reactions: {
			perfect: ['ok this slaps', 'no bc this is actually perfect', 'POSTING THIS'],
			close: ['its fine i guess', 'ok mid but cute', 'lowkey good'],
			confused: ['wait is this mine??', 'hm. ok. sure', "this isn't giving what i asked"],
			angry: ['literally so embarrassing', "i'm telling my group chat", 'ew. no. bye']
		},
		reviews: {
			perfect: ['they kept up with ALL my changes. iconic. 💅', 'best {dish} of my life (so far, im 16)'],
			close: ['it was ok. i changed my mind like 3 times tho', '7/10 would confuse again'],
			confused: ['they made my first order not my third. rude?', 'idk what i asked for and neither did they'],
			angry: ['I asked for {a dish}. I received a crime.', 'unfollowed the restaurant']
		}
	},
	influencer: {
		label: 'Influencer',
		names: ['@foodiequeen', '@chef.kiss.daily', '@brunchboi', '@aesthetic.eats'],
		voice: 'vague',
		seconds: 60,
		tipMultiplier: 1.2,
		dishes: { burger: 2, sate: 1, noodle: 2 },
		taste: { size: 1 },
		pictureChance: 0.55,
		pictureStyle: 'photo',
		pictureLines: ['Recreate my viral post 📸 EXACTLY. 2 million people are watching.', 'Moodboard attached ✨ make the {dish} match the vibe.'],
		change: { chance: 0.35, intro: ['Wait, my followers voted—', 'Poll results are in:'] },
		look: { skin: '#f0c4a8', hair: '#2b1d14', shirt: '#ff6fae', hairStyle: 'long', accessory: 'sunglasses' },
		speak: ({ dish, parts, ordered, dir, r }) => {
			const open = pick(r, ['Hiii besties, we are LIVE 📸', 'Okay so this is for content ✨', "Don't mind the ring light 💡"]);
			const how = !ordered ? 'It needs' : dir === 'up' ? 'From the bottom, aesthetically:' : 'Top to bottom, for the flat-lay:';
			const close = pick(r, ['Make it pop! ✨', 'It has to be grammable.', "Don't ask me what they're called, just vibes."]);
			return `${open} I need ${dish}. ${how} ${listWith(parts, ', ', ', and ')}. ${close}`;
		},
		reactions: {
			perfect: ['OMG it’s giving PERFECTION ✨', 'Instant viral. You’re welcome.', 'The lighting! The layers! I’m crying!'],
			close: ['Cute! Filter will fix the rest.', 'Mm, content-able.', 'Not bad for B-roll.'],
			confused: ['This is not the vibe.', "I can't post this.", 'My followers will have questions.'],
			angry: ['Unboxing this as a FAIL video.', "You've been cancelled.", 'Deleting my story.']
		},
		reviews: {
			perfect: ['2.4M views. The {dish} was a co-star. Link in bio.', 'Aesthetic AND edible. Rare.'],
			close: ['Pretty enough for the grid, not for the story.', 'Cute {dish}. Needed more ✨.'],
			confused: ["The vibe was off. Couldn't post.", 'I described a mood. They served a different mood.'],
			angry: ['I asked for {a dish}. I received a crime.', 'Posted it with the caption "never again". 1.2M likes.']
		}
	},
	agent: {
		label: 'Secret agent',
		names: ['Agent K', 'Agent Nightingale', 'Mr. Smith (not his real name)', 'Double-O Sate'],
		voice: 'riddle',
		seconds: 65,
		tipMultiplier: 1.7,
		dishes: { burger: 1, sate: 1, noodle: 1 },
		taste: {},
		pictureChance: 0.1,
		pictureStyle: 'photo',
		pictureLines: ['Surveillance photo. Replicate the target. Exactly.'],
		change: { chance: 0.3, intro: ['Intel update.', 'Change of plans.'] },
		look: { skin: '#d9b08c', hair: '#1a1a1a', shirt: '#1f2a33', hairStyle: 'slick', accessory: 'earpiece' },
		speak: ({ dish, parts, ordered, dir, r }) => {
			const open = pick(r, ['*leans in* The eagle has landed.', '*whispers* Nobody followed me.', 'Code word: hungry.']);
			const how = !ordered ? '' : dir === 'up' ? 'Assemble from the ground up.' : 'Brief from the top down.';
			const items = parts.map((p, i) => `Item ${i + 1}: ${p}.`).join(' ');
			const close = pick(r, ['This message will self-destruct.', 'You never saw me.', 'Burn this ticket.']);
			return `${open} The package is ${dish}. ${how} ${items} ${close}`.replace(/\s+/g, ' ');
		},
		reactions: {
			perfect: ['Mission accomplished.', 'You would make a fine operative.', 'Flawless execution.'],
			close: ['Acceptable losses.', 'The mission was... mostly a success.', 'Adequate tradecraft.'],
			confused: ['Was this... sabotage?', 'Someone leaked the wrong recipe.', 'This is not the package.'],
			angry: ['Compromised. All of it.', 'You are now on a list.', 'This never happened. Especially this food.']
		},
		reviews: {
			perfect: ['Cracked every code. Recruiting the cashier.', '[REDACTED] — five stars.'],
			close: ['Minor intelligence failure. Still ate it.', 'Decoded most of it. The chef has potential.'],
			confused: ['They misread item 3. I suspect a double agent.', 'Message received. Wrong message.'],
			angry: ['I asked for {a dish}. I received a crime.', 'Mission failed. Food failed. Everyone failed.']
		}
	},
	driver: {
		label: 'Ojol driver',
		names: ['Pak Budi', 'Mas Joko', 'Bang Ucok', 'Mbak Rina'],
		voice: 'chat',
		seconds: 55,
		tipMultiplier: 1.2,
		dishes: { sate: 3, noodle: 3, burger: 1 },
		taste: { likes: ['sambal', 'kecap', 'fried_shallot'], size: 0.5 },
		pictureChance: 0.15,
		pictureStyle: 'photo',
		pictureLines: ['Kak, customernya kirim foto ini 📱 yg kyk gini ya'],
		change: { chance: 0.4, intro: ['Kak, customernya chat lagi:', 'Eh kak, ada revisi:'] },
		look: { skin: '#c68e63', hair: '#1a1a1a', shirt: '#00aa13', hairStyle: 'helmet', accessory: 'phone' },
		speak: ({ dish, parts, ordered, dir, r }) => {
			const open = pick(r, ['Kak, pesanan online ya 🙏', 'Permisi kak, ambil orderan.', 'Kak, saya bacain catatannya ya:']);
			const how = !ordered ? 'catatan:' : dir === 'up' ? 'urutan dr bawah:' : 'urutan dr atas:';
			const close = pick(r, ['Makasih kak 🙏', 'Cepet ya kak, udh ditungguin 🙏', 'Bintang 5 nanti kak.']);
			return `${open} "${dish}, ${how} ${parts.join(', ')}" ${close}`;
		},
		reactions: {
			perfect: ['Mantap kak! Bintang 5! ⭐', 'Wah, pas banget!', 'Siap, langsung meluncur!'],
			close: ['Oke kak, aman lah.', 'Hampir pas, gpp kak.', 'Lumayan kak, jalan ya.'],
			confused: ['Kak, ini bener pesanannya?', 'Waduh, kok beda ya...', 'Nanti customer komplain nih...'],
			angry: ['Waduh kak, ini salah semua!', 'Bisa kena bintang 1 saya...', 'Kak... saya yang dimarahin nanti.']
		},
		reviews: {
			perfect: ['Customer kasih tip gede. Makasih kak! 🙏', 'Pesanan sesuai, cepet. Langganan!'],
			close: ['Hampir sesuai catatan. Customer gk komplain, aman.', 'Oke lah, cuma beda dikit.'],
			confused: ['Catatan gk dibaca kayaknya kak 😅', 'Customer nanya "ini {dish} siapa?"'],
			angry: ['I asked for {a dish}. I received a crime.', 'Customer kasih bintang 1. Saya juga.']
		}
	}
} as const satisfies Record<string, CustomerType>;

export type CustomerId = keyof typeof CUSTOMERS;
export const CUSTOMER_IDS = Object.keys(CUSTOMERS) as CustomerId[];

export function customer(id: string): CustomerType {
	const found = (CUSTOMERS as Record<string, CustomerType>)[id];
	if (!found) throw new Error(`Unknown customer: ${id}`);
	return found;
}
