import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export const player = v.object({
	id: v.string(),
	name: v.string(),
	position: v.number()
});

export const pending = v.object({
	questionId: v.number(),
	category: v.string(),
	text: v.string(),
	from: v.number(),
	tile: v.number(),
	destination: v.number(),
	answer: v.optional(v.string()),
	answerId: v.optional(v.id('answers')),
	/** Set when the question is a partner-written secret question. */
	customId: v.optional(v.id('customQuestions')),
	author: v.optional(v.string()),
	/** Optional voice note recorded with the answer. */
	audioId: v.optional(v.id('_storage')),
	audioSeconds: v.optional(v.number()),
	/** Guess tiles: the roller answers about themselves, the partner guesses. */
	guess: v.optional(
		v.object({
			subject: v.optional(v.string()),
			guess: v.optional(v.string()),
			/** Optional voice notes with each side's answer. */
			subjectAudio: v.optional(v.id('_storage')),
			subjectSeconds: v.optional(v.number()),
			guessAudio: v.optional(v.id('_storage')),
			guessSeconds: v.optional(v.number()),
			match: v.optional(v.boolean()),
			forfeit: v.optional(v.string()),
			/** The guesser's bonus move on a match. */
			bonusFrom: v.optional(v.number()),
			bonusTo: v.optional(v.number())
		})
	)
});

const bombModule = v.union(
	v.object({
		type: v.literal('wires'),
		wires: v.array(v.string()),
		cut: v.array(v.number()),
		solved: v.boolean()
	}),
	v.object({
		type: v.literal('button'),
		color: v.string(),
		label: v.string(),
		strip: v.string(),
		holdingSince: v.optional(v.number()),
		solved: v.boolean()
	}),
	v.object({
		type: v.literal('keypad'),
		symbols: v.array(v.string()),
		pressed: v.array(v.number()),
		solved: v.boolean()
	}),
	v.object({
		type: v.literal('simon'),
		sequence: v.array(v.string()),
		stage: v.number(),
		input: v.number(),
		solved: v.boolean()
	})
);

const doneness = v.union(v.literal('raw'), v.literal('cooked'), v.literal('burnt'));

/** Burger for Two: one component of a dish (a burger layer, a skewer, a meatball…).
 * See convex/burger/ingredients.ts. */
export const burgerLayer = v.object({ ing: v.string(), state: v.optional(doneness) });

export const burgerOrder = v.object({
	customer: v.string(),
	name: v.string(),
	/** burger | sate | noodle (convex/burger/dishes.ts); absent on orders from before the menu. */
	dish: v.optional(v.string()),
	/** Burgers run bottom to top. */
	layers: v.array(burgerLayer),
	text: v.string(),
	picture: v.boolean(),
	seconds: v.number(),
	/** A change of mind, shown to the cashier partway through the clock. */
	followUp: v.optional(v.object({ at: v.number(), text: v.string(), layers: v.array(burgerLayer) }))
});

export const burgerDifficulty = v.union(v.literal('chill'), v.literal('busy'), v.literal('rush'));

export const burgerResult = v.object({
	/** The order as it stood when served (after any change of mind). */
	order: burgerOrder,
	served: v.array(burgerLayer),
	servedDish: v.optional(v.string()),
	wrongDish: v.optional(v.boolean()),
	score: v.number(),
	percent: v.number(),
	stars: v.number(),
	tier: v.union(v.literal('perfect'), v.literal('close'), v.literal('confused'), v.literal('angry')),
	tip: v.number(),
	correct: v.number(),
	missing: v.number(),
	extra: v.number(),
	wrongDoneness: v.number(),
	reaction: v.string(),
	review: v.string(),
	msLeft: v.number(),
	timedOut: v.boolean()
});

export const difficulty = v.union(v.literal('easy'), v.literal('normal'), v.literal('hard'));

export default defineSchema({
	rooms: defineTable({
		code: v.string(),
		game: v.literal('snakes_ladders'),
		status: v.union(v.literal('waiting'), v.literal('playing'), v.literal('finished')),
		players: v.array(player),
		turn: v.number(),
		phase: v.union(
			v.literal('roll'),
			v.literal('answer'),
			v.literal('react'),
			/** Guess tile: both players submit answers, hidden from each other. */
			v.literal('guess'),
			/** Guess tile: both answers revealed; the roller judges the match. */
			v.literal('judge')
		),
		lastRoll: v.optional(v.number()),
		/** Increments every roll so clients can trigger the dice animation. */
		rollCount: v.optional(v.number()),
		pending: v.optional(pending),
		usedQuestions: v.array(v.number()),
		winnerId: v.optional(v.string()),
		/** This game's snakes, ladders and heart tiles; absent on rooms from before layouts were random. */
		layout: v.optional(
			v.object({
				size: v.optional(v.number()),
				ladders: v.array(v.object({ from: v.number(), to: v.number() })),
				snakes: v.array(v.object({ from: v.number(), to: v.number() })),
				hearts: v.array(v.number()),
				guess: v.optional(v.array(v.number()))
			})
		)
	}).index('by_code', ['code']),

	answers: defineTable({
		roomId: v.id('rooms'),
		playerId: v.string(),
		playerName: v.string(),
		category: v.string(),
		question: v.string(),
		answer: v.string(),
		tile: v.number(),
		reaction: v.optional(v.string()),
		audioId: v.optional(v.id('_storage')),
		audioSeconds: v.optional(v.number()),
		/** Guess tiles: what the partner guessed, whether it matched, and any forfeit. */
		guesserName: v.optional(v.string()),
		guess: v.optional(v.string()),
		guessAudioId: v.optional(v.id('_storage')),
		guessAudioSeconds: v.optional(v.number()),
		match: v.optional(v.boolean()),
		forfeit: v.optional(v.string())
	}).index('by_room', ['roomId']),

	/** Secret questions one partner writes for the other, asked on heart tiles. */
	customQuestions: defineTable({
		roomId: v.id('rooms'),
		authorId: v.string(),
		authorName: v.string(),
		text: v.string(),
		usedAt: v.optional(v.number())
	}).index('by_room_author', ['roomId', 'authorId']),

	/** Bomb Defusal: one player defuses, the other reads the manual. See convex/bomb.ts. */
	bombRooms: defineTable({
		code: v.string(),
		status: v.union(
			v.literal('waiting'),
			/** Between rounds: pick difficulty and roles. */
			v.literal('briefing'),
			v.literal('live'),
			v.literal('defused'),
			v.literal('exploded')
		),
		players: v.array(v.object({ id: v.string(), name: v.string() })),
		defuserId: v.string(),
		difficulty,
		round: v.number(),
		bomb: v.optional(
			v.object({
				seed: v.number(),
				serial: v.string(),
				batteries: v.number(),
				indicators: v.array(v.object({ label: v.string(), lit: v.boolean() })),
				modules: v.array(bombModule)
			})
		),
		/** The clock starts here (after the 3-2-1 countdown). */
		startedAt: v.optional(v.number()),
		deadline: v.optional(v.number()),
		endedAt: v.optional(v.number()),
		strikes: v.number(),
		cause: v.optional(v.union(v.literal('time'), v.literal('strikes'))),
		/** The module and time of the latest strike, for the buzz/shake on the defuser's screen. */
		lastStrike: v.optional(v.object({ module: v.number(), at: v.number() })),
		history: v.array(
			v.object({
				round: v.number(),
				difficulty,
				defuserName: v.string(),
				expertName: v.string(),
				defused: v.boolean(),
				msLeft: v.number(),
				strikes: v.number()
			})
		)
	}).index('by_code', ['code']),

	/** Burger for Two: a cashier hears the order, a chef builds it. See convex/kitchen.ts. */
	burgerRooms: defineTable({
		code: v.string(),
		status: v.union(
			/** One player so far. */
			v.literal('waiting'),
			/** Both here: pick roles. */
			v.literal('lobby'),
			v.literal('cooking'),
			/** The burger was served; both screens show the reaction. */
			v.literal('served'),
			/** End of the shift: customer reviews. */
			v.literal('reviews')
		),
		players: v.array(v.object({ id: v.string(), name: v.string() })),
		cashierId: v.string(),
		shift: v.number(),
		customerIndex: v.number(),
		/** The whole shift's orders. Never sent to the chef while cooking. */
		orders: v.array(burgerOrder),
		difficulty: v.optional(burgerDifficulty),
		/** What the chef is making for this customer: picked by the chef, who has to ask. */
		dish: v.optional(v.string()),
		/** The chef's dish in progress (a burger runs bottom to top). */
		stack: v.array(burgerLayer),
		/** Set once the current customer's change of mind has been shown to the cashier. */
		followUpShown: v.optional(v.boolean()),
		/** Each cooker slot (grill or pot) holds an ingredient and when it went in; doneness
		 * follows from the time. */
		grill: v.array(v.union(v.null(), v.object({ ing: v.string(), placedAt: v.number() }))),
		/** The customer walks in; the clock starts here. */
		startedAt: v.optional(v.number()),
		deadline: v.optional(v.number()),
		results: v.array(burgerResult),
		history: v.array(
			v.object({
				shift: v.number(),
				cashierName: v.string(),
				chefName: v.string(),
				stars: v.number(),
				tips: v.number()
			})
		)
	}).index('by_code', ['code']),

	/** Burger for Two heartbeats, kept apart from the room so they don't rewrite it. */
	burgerPresence: defineTable({
		roomId: v.id('burgerRooms'),
		playerId: v.string(),
		lastSeen: v.number()
	}).index('by_roomId_and_playerId', ['roomId', 'playerId']),

	/** Web Push subscriptions, one per device, for turn reminders. */
	pushSubscriptions: defineTable({
		playerId: v.string(),
		endpoint: v.string(),
		p256dh: v.string(),
		auth: v.string()
	})
		.index('by_player', ['playerId'])
		.index('by_endpoint', ['endpoint'])
});
