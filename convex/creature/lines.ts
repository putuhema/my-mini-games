// What the cat says. Lines are picked by situation and flavoured by its personality.

import { has, type Food, type Traits } from './world';

export const pick = <T>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];

export const LINES = {
	hello: (name: string) => [`${name} is here!`, `${name}! ${name}! Mrrp!`, `Hi ${name}! *trills*`],
	everyone: ["Everyone's here!", 'Both of you!! Mrrrow!', 'My two favourite humans!'],
	bye: (name: string) => [`Bye ${name}!`, `Come back soon, ${name}!`, '*watches you leave from the window*'],
	forgot: ['Did you forget about me?', 'I waited by the door...', "You're back!! Mew!"],
	boxHello: ['*mew?*', '*the box wiggles*', '*a tiny paw pokes out*'],
	comeOut: ['Mew!', '...hi.', '*peeks out*'],
	hungry: ["I'm hungry...", '*stares at the bowl*', 'Mrrrow? Food?'],
	bored: ['Play with me!', '*bats at nothing*', "I'm bored..."],
	dirty: ['My fur is all messy...', '*licks fur angrily*', 'Brush me?'],
	sleepy: ['*big yawn*', 'So sleepy...', 'Nap time?'],
	content: ['*purrs*', '*slow blink*', 'Mrrp.', '*tail swish*', 'I like it here.'],
	full: ["I'm full!", '*walks away from the bowl*', '*pats tummy*'],
	sleeping: ['zzz...', '*tiny snore*', '*paws twitch, dreaming of fish*'],
	notSleepy: ["I'm not sleepy!", 'But I want to play!'],
	woken: ['Five more minutes...', '*grumpy mrrp*'],
	tooTired: ['Too tired...', '*flops over*'],
	lazyRefuse: ['Maybe later...', "Can't. Loafing.", '*pretends to be asleep*'],
	brush: ['*purrs loudly*', 'Ooh, right there!', 'So fluffy now!'],
	bathHappy: ['...this is fine.', '*surprisingly calm*'],
	bathGrumpy: ['NOT THE BATH!', '*shakes water everywhere*', 'I will remember this.'],
	petHappy: ['*purrrrr*', '*headbutts your hand*', 'More pets!', '*slow blink* I love you!'],
	petSad: ['...thanks.', '*leans in a little*'],
	petDirty: ["I'm all messy, careful!", '*purrs anyway*'],
	catch: ['Got it!', 'Again! Again!', '*wiggles butt* POUNCE!'],
	laser: ['THE RED DOT!', '*pounce* ...where did it go?', 'I almost had it!'],
	feather: ['*leaps at the feather*', 'Bird! BIRD!', '*chirps excitedly*'],
	together: ['Both of you are playing with me!', 'Best day ever!'],
	window: ['*chatters at the birds*', "What's out there?", '*ekekekek*'],
	windowNight: ['*stares at the moon*', 'So many stars.'],
	plant: ['*sniffs the leaves*', 'It smells green.', '*nibbles a leaf*'],
	fish: ['*stares at the fish*', 'Fishy friends...', '*taps the glass*'],
	tree: ['I can see everything from up here!', '*surveys the kingdom*'],
	box: ['If I fits, I sits.', '*fits*'],
	sofa: ['This sofa belongs to me now.', '*claims the sofa*'],
	scratch: ['*scratches the sofa*', '*scritch scritch*'],
	knock: ['*looks at you* *pushes cup*', 'Oops.', '*knocks it off the table*'],
	zoomies: ['ZOOMIES!', '*sprints for no reason*', 'NYOOOM!'],
	groom: ['*licks paw*', '*grooming*'],
	knead: ['*makes biscuits*', '*kneads happily*'],
	stretch: ['*big stretch*', '*streeeetch*'],
	spin: ['*chases own tail*', 'I almost caught it!'],
	hide: ["(you can't see me)", '*hiding*'],
	door: ['I learned how to open doors!', '*rattles the door handle*'],
	steal: (name: string, item: string) => [`Mine now! (sorry ${name})`, `*drags ${item} to bed*`],
	toy: ['*bats the toy around*', 'Toy time!'],
	music: ['*ears wiggle to the music*', '*bobs head*', 'Is this our song?'],
	dark: ['*eyes glow in the dark*', 'Who turned off the lights?'],
	light: ['Ah, light!', '*squints*'],
	called: ['Mrrp?', 'Coming!', '*trots over*'],
	ignore: ['*pretends not to hear*', '*flicks ear*'],
	named: (name: string) => [`Did ${name} say my name?`, 'Mrrp?', '*ears perk up*'],
	hug: ['Group hug!', 'Me too! Me too!', '*squeezes in between you*'],
	bonk: ['*bonks head on your leg*', '*rubs against you*', '*purrs at your feet*'],
	gift: (name: string) => [`${name} left me a present!`, `Thank you ${name}!`]
};

export function foodLine(food: Food, traits: Traits) {
	if (has(traits, 'foodie')) return pick(['MORE!', 'Om nom NOM!', 'Is there seconds?']);
	if (food === 'treat') return pick(['TREAT!!', '*crunch* Yes!', '*happy chirp*']);
	if (food === 'fish') return pick(['Fishy!', 'Mmm!', '*crunch crunch*']);
	if (food === 'chicken') return pick(['Chicken!!', '*happy noms*']);
	return pick(['Om nom.', 'Crunchy!', '*eats politely*']);
}

/** Small idle chatter, nudged by personality. */
export function idleLine(traits: Traits) {
	const lines: string[] = [...LINES.content];
	if (has(traits, 'playful')) lines.push("Tag! You're it!", 'Is that a toy?');
	if (has(traits, 'curious')) lines.push('What is in that box?', 'Hmm... interesting.');
	if (has(traits, 'affectionate')) lines.push('I love you both!', '*wants to be held*');
	if (has(traits, 'foodie')) lines.push('Thinking about fish.', 'Is that... food?');
	if (has(traits, 'adventurous')) lines.push("Let's go on an adventure!", 'I bet I could jump onto the bed.');
	if (has(traits, 'lazy')) lines.push('*loafs dramatically*', 'Comfy...');
	if (has(traits, 'mischievous')) lines.push('*looks innocent*', 'I did nothing.');
	if (has(traits, 'nature')) lines.push('The plant said hi.', '*smells a flower*');
	return pick(lines);
}
