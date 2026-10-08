// Daily events: one small question a day. Both partners vote privately, then the answers are
// revealed together. They're meant to start a conversation, not to be won.

import type { Decor, Needs, Trait } from './world';

export type Choice = {
	id: string;
	label: string;
	/** Pixel icon (see src/lib/creature/art.ts). */
	icon: string;
	/** What happens. `{pet}` is the pet's name. */
	outcome: string;
	traits?: Partial<Record<Trait, number>>;
	needs?: Partial<Needs>;
	/** Adds something to the room. */
	decor?: Decor;
};

export type DailyEvent = { id: string; icon: string; prompt: string; choices: Choice[] };

export const EVENTS: DailyEvent[] = [
	{
		id: 'under_bed',
		icon: 'magnifier',
		prompt: '{pet} found something under the bed.',
		choices: [
			{
				id: 'investigate',
				label: 'Investigate',
				icon: 'magnifier',
				outcome: "It was a sock. {pet} is very proud of the sock.",
				traits: { curious: 2 }
			},
			{
				id: 'ignore',
				label: 'Leave it be',
				icon: 'moon',
				outcome: "Whatever it is, it's still under there. Probably fine.",
				traits: { lazy: 1 }
			},
			{
				id: 'keep',
				label: 'Let {pet} keep it',
				icon: 'gift',
				outcome: '{pet} has started a secret treasure pile.',
				traits: { mischievous: 2 }
			}
		]
	},
	{
		id: 'new_toy',
		icon: 'gift',
		prompt: '{pet} wants a new toy.',
		choices: [
			{ id: 'ball', label: 'Jingly ball', icon: 'ball', outcome: 'A jingly new ball! Nobody will sleep tonight.', traits: { playful: 2 }, decor: 'ball' },
			{ id: 'mouse', label: 'Toy mouse', icon: 'mouse', outcome: 'A toy mouse to carry around proudly.', traits: { affectionate: 1, mischievous: 1 }, decor: 'mouse' },
			{ id: 'yarn', label: 'Ball of yarn', icon: 'yarn', outcome: 'The yarn is now all over the room.', traits: { adventurous: 1, playful: 1 }, decor: 'yarn' }
		]
	},
	{
		id: 'rain',
		icon: 'cloud',
		prompt: "It's raining outside. What should we do today?",
		choices: [
			{
				id: 'watch',
				label: 'Watch the rain',
				icon: 'window',
				outcome: '{pet} watched the raindrops race for an hour.',
				traits: { curious: 1, nature: 1 }
			},
			{
				id: 'fort',
				label: 'Blanket fort',
				icon: 'heart',
				outcome: 'The fort collapsed. Everyone was inside it. Perfect.',
				traits: { affectionate: 2 },
				needs: { happiness: 10 }
			},
			{
				id: 'puddles',
				label: 'Open the window',
				icon: 'paw',
				outcome: '{pet} stuck a paw out, got wet, and was VERY offended.',
				traits: { adventurous: 2 },
				needs: { happiness: 12, cleanliness: -25 }
			}
		]
	},
	{
		id: 'snack',
		icon: 'fish',
		prompt: '{pet} is sniffing around the kitchen.',
		choices: [
			{ id: 'tuna', label: 'Share some tuna', icon: 'fish', outcome: '{pet} now believes tuna is a breakfast food.', traits: { foodie: 2 }, needs: { hunger: 10, happiness: 6 } },
			{ id: 'kibble', label: 'Just kibble', icon: 'kibble', outcome: '{pet} ate the kibble. Then stared at you for tuna.', traits: { foodie: 1 }, needs: { hunger: 12 } },
			{ id: 'hide', label: 'Hide the snacks', icon: 'magnifier', outcome: '{pet} found them in four minutes.', traits: { mischievous: 2, curious: 1 } }
		]
	},
	{
		id: 'song',
		icon: 'note',
		prompt: '{pet} keeps meowing in tune. Teach it a song?',
		choices: [
			{ id: 'lullaby', label: 'A lullaby', icon: 'moon', outcome: '{pet} fell asleep halfway through. Success.', traits: { lazy: 1, affectionate: 1 } },
			{ id: 'silly', label: 'A silly song', icon: 'note', outcome: '{pet} meows it at full volume. At 3am.', traits: { playful: 2, mischievous: 1 } },
			{ id: 'love', label: 'Our song', icon: 'heart', outcome: "{pet} purrs to your song when it misses you.", traits: { affectionate: 2 }, needs: { happiness: 8 } }
		]
	},
	{
		id: 'door',
		icon: 'door',
		prompt: '{pet} is staring at the door.',
		choices: [
			{ id: 'walk', label: 'Go for a walk', icon: 'paw', outcome: '{pet} wore a tiny harness and met a pigeon. They are rivals now.', traits: { adventurous: 3 }, needs: { energy: -10, happiness: 8 } },
			{ id: 'cuddle', label: 'Stay in and cuddle', icon: 'heart', outcome: 'Cuddles were had.', traits: { affectionate: 2, lazy: 1 }, needs: { happiness: 6 } },
			{ id: 'garden', label: 'Show it the garden', icon: 'flower', outcome: '{pet} rolled in the grass and smelled every flower.', traits: { nature: 3 }, needs: { cleanliness: -10 } }
		]
	},
	{
		id: 'dream',
		icon: 'moon',
		prompt: '{pet} twitched in its sleep last night. What was it dreaming about?',
		choices: [
			{ id: 'birds', label: 'Catching birds', icon: 'feather', outcome: '{pet} keeps chattering at the window today.', traits: { adventurous: 2 } },
			{ id: 'fish', label: 'A giant fish', icon: 'fish', outcome: '{pet} woke up licking its lips.', traits: { foodie: 2 } },
			{ id: 'you', label: 'The two of you', icon: 'heart', outcome: '{pet} woke up and headbutted the first person it saw.', traits: { affectionate: 2 } }
		]
	},
	{
		id: 'seed',
		icon: 'sprout',
		prompt: 'A tiny seed blew in through the window.',
		choices: [
			{ id: 'plant', label: 'Plant it', icon: 'sprout', outcome: 'A little sprout now lives in the room.', traits: { nature: 3 }, decor: 'sprout' },
			{ id: 'eat', label: 'Let {pet} bat it around', icon: 'paw', outcome: '{pet} batted it under the sofa. Gone forever.', traits: { playful: 1, mischievous: 1 } },
			{ id: 'treasure', label: 'Keep it as treasure', icon: 'star', outcome: "It's in {pet}'s treasure pile now.", traits: { curious: 2 } }
		]
	},
	{
		id: 'trick',
		icon: 'star',
		prompt: '{pet} wants to learn a trick.',
		choices: [
			{ id: 'spin', label: 'Spin around', icon: 'star', outcome: '{pet} spun until it fell over. Then did it again.', traits: { playful: 2 } },
			{ id: 'highfive', label: 'High five', icon: 'paw', outcome: '{pet} now high-fives everything, including the plant.', traits: { affectionate: 1, nature: 1 } },
			{ id: 'dead', label: 'Play dead', icon: 'moon', outcome: '{pet} is very, very good at this one.', traits: { mischievous: 1, lazy: 2 } }
		]
	},
	{
		id: 'sky',
		icon: 'star',
		prompt: 'The stars are out. {pet} wants to make a wish.',
		choices: [
			{ id: 'together', label: 'To be together soon', icon: 'heart', outcome: '{pet} wished it extra hard. With both paws.', traits: { affectionate: 2 }, needs: { happiness: 8 } },
			{ id: 'snacks', label: 'Infinite treats', icon: 'treat', outcome: '{pet} is now waiting by the bowl.', traits: { foodie: 2 } },
			{ id: 'wings', label: 'A bigger cat tree', icon: 'star', outcome: '{pet} checks the cat tree for growth every morning.', traits: { adventurous: 2 } }
		]
	}
];

export const event = (id: string) => EVENTS.find((e) => e.id === id);

export const fill = (text: string, pet: string) => text.replaceAll('{pet}', pet);

/** Today's date as the couple's event key (UTC). */
export const dayKey = (t: number) => new Date(t).toISOString().slice(0, 10);
