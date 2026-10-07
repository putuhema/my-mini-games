import { ConvexError, v } from 'convex/values';
import { internal } from './_generated/api';
import { mutation, query, type MutationCtx } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import {
	REACTIONS,
	categoryForTile,
	fromStoredLayout,
	GUESS_BONUS,
	phraseGuess,
	generateLayout,
	moveBy,
	resolveTile,
	toStoredLayout
} from './board';
import { FORFEITS, QUESTIONS } from './questions';

export const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_NAME = 24;
const MAX_ANSWER = 1000;
const MAX_AUDIO_BYTES = 2_000_000;
const MAX_AUDIO_SECONDS = 10;

export function cleanName(name: string) {
	const trimmed = name.trim().slice(0, MAX_NAME);
	if (!trimmed) throw new ConvexError('Please enter your name');
	return trimmed;
}

async function loadRoom(ctx: MutationCtx, roomId: Id<'rooms'>) {
	const room = await ctx.db.get(roomId);
	if (!room) throw new ConvexError('Room not found');
	return room;
}

/** Reject (and delete) uploads that aren't small audio files. */
async function validateAudio(ctx: MutationCtx, audioId: Id<'_storage'>) {
	const file = await ctx.db.system.get(audioId);
	if (!file || !file.contentType?.startsWith('audio/') || file.size > MAX_AUDIO_BYTES) {
		if (file) await ctx.storage.delete(audioId);
		throw new ConvexError('That voice note could not be used — try recording again');
	}
}

const clampSeconds = (s: number | undefined) =>
	s ? Math.min(MAX_AUDIO_SECONDS, Math.max(0, s)) : undefined;

/** Queue a turn reminder; the push action is a no-op for players without reminders on. */
async function remind(
	ctx: MutationCtx,
	room: Doc<'rooms'>,
	playerId: string,
	title: string,
	body: string
) {
	await ctx.scheduler.runAfter(0, internal.push.notify, {
		playerId,
		title,
		body,
		url: `/snakes-ladders/${room.code}`,
		tag: `room-${room.code}`
	});
}

function requireTurn(room: Doc<'rooms'>, playerId: string, phase: Doc<'rooms'>['phase']) {
	if (room.status !== 'playing') throw new ConvexError('The game is not in progress');
	if (room.phase !== phase) throw new ConvexError('That move is not allowed right now');
	if (room.players[room.turn]?.id !== playerId) throw new ConvexError("It's not your turn");
}

export const get = query({
	args: { code: v.string() },
	handler: async (ctx, { code }) => {
		const room = await ctx.db
			.query('rooms')
			.withIndex('by_code', (q) => q.eq('code', code.toUpperCase()))
			.unique();
		if (!room) return null;
		const audioId = room.pending?.audioId;
		const guess = room.pending?.guess;
		// While both are still answering a guess tile, never send either answer to the browser.
		const hidden = room.phase === 'guess' && room.pending;
		return {
			...room,
			pending: hidden ? { ...room.pending!, guess: undefined } : room.pending,
			guessStatus: guess
				? {
						subjectDone: !!guess.subject || !!guess.subjectAudio,
						guessDone: !!guess.guess || !!guess.guessAudio
					}
				: null,
			guessAudioUrls:
				guess && !hidden
					? {
							subject: guess.subjectAudio ? await ctx.storage.getUrl(guess.subjectAudio) : null,
							guess: guess.guessAudio ? await ctx.storage.getUrl(guess.guessAudio) : null
						}
					: null,
			pendingAudioUrl: audioId ? await ctx.storage.getUrl(audioId) : null
		};
	}
});

export const answers = query({
	args: { roomId: v.id('rooms') },
	handler: async (ctx, { roomId }) => {
		const rows = await ctx.db
			.query('answers')
			.withIndex('by_room', (q) => q.eq('roomId', roomId))
			.order('desc')
			.take(100);
		return await Promise.all(
			rows.map(async (a) => ({
				...a,
				audioUrl: a.audioId ? await ctx.storage.getUrl(a.audioId) : null,
				guessAudioUrl: a.guessAudioId ? await ctx.storage.getUrl(a.guessAudioId) : null
			}))
		);
	}
});

/** Short-lived URL the client POSTs a recorded voice note to. */
export const generateUploadUrl = mutation({
	args: { roomId: v.id('rooms'), playerId: v.string() },
	handler: async (ctx, { roomId, playerId }) => {
		const room = await loadRoom(ctx, roomId);
		if (!room.players.some((p) => p.id === playerId)) throw new ConvexError('Not in this room');
		return await ctx.storage.generateUploadUrl();
	}
});

export const create = mutation({
	args: {
		playerId: v.string(),
		name: v.string(),
		/** Board size chosen by the host. */
		size: v.optional(v.union(v.literal(50), v.literal(100)))
	},
	handler: async (ctx, { playerId, name, size }) => {
		let code = '';
		for (let attempt = 0; attempt < 10; attempt++) {
			code = Array.from(
				{ length: 4 },
				() => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
			).join('');
			const existing = await ctx.db
				.query('rooms')
				.withIndex('by_code', (q) => q.eq('code', code))
				.unique();
			if (!existing) break;
		}
		await ctx.db.insert('rooms', {
			code,
			game: 'snakes_ladders',
			status: 'waiting',
			players: [{ id: playerId, name: cleanName(name), position: 0 }],
			turn: 0,
			phase: 'roll',
			usedQuestions: [],
			layout: toStoredLayout(generateLayout(size ?? 50))
		});
		return code;
	}
});

export const join = mutation({
	args: { code: v.string(), playerId: v.string(), name: v.string() },
	handler: async (ctx, { code, playerId, name }) => {
		const room = await ctx.db
			.query('rooms')
			.withIndex('by_code', (q) => q.eq('code', code.trim().toUpperCase()))
			.unique();
		if (!room) throw new ConvexError('No room with that code');
		if (room.players.some((p) => p.id === playerId)) return room.code;
		if (room.players.length >= 2) throw new ConvexError('This room already has two players');

		const joinedName = cleanName(name);
		await ctx.db.patch(room._id, {
			players: [...room.players, { id: playerId, name: joinedName, position: 0 }],
			status: 'playing'
		});
		await remind(ctx, room, room.players[0].id, `${joinedName} joined!`, 'Your turn to roll the dice.');
		return room.code;
	}
});

export const roll = mutation({
	args: { roomId: v.id('rooms'), playerId: v.string() },
	handler: async (ctx, { roomId, playerId }) => {
		const room = await loadRoom(ctx, roomId);
		requireTurn(room, playerId, 'roll');

		const layout = fromStoredLayout(room.layout);
		const dice = 1 + Math.floor(Math.random() * 6);
		const from = room.players[room.turn].position;
		const tile = moveBy(from, dice, layout.size);
		const players = room.players.map((p, i) => (i === room.turn ? { ...p, position: tile } : p));
		const base = {
			players,
			lastRoll: dice,
			rollCount: (room.rollCount ?? 0) + 1,
			phase: 'answer' as const
		};

		// Heart tiles ask one of the partner's unasked secret questions, if any are left.
		const partner = room.players.find((p) => p.id !== playerId);
		if (layout.hearts.includes(tile) && partner) {
			const waiting = await ctx.db
				.query('customQuestions')
				.withIndex('by_room_author', (q) => q.eq('roomId', roomId).eq('authorId', partner.id))
				.filter((q) => q.eq(q.field('usedAt'), undefined))
				.collect();
			if (waiting.length > 0) {
				const secret = waiting[Math.floor(Math.random() * waiting.length)];
				await ctx.db.patch(secret._id, { usedAt: Date.now() });
				await ctx.db.patch(roomId, {
					...base,
					pending: {
						questionId: -1,
						category: 'custom',
						text: secret.text,
						from,
						tile,
						destination: resolveTile(tile, layout),
						customId: secret._id,
						author: secret.authorName
					}
				});
				return;
			}
		}

		const category = categoryForTile(tile, layout);
		const deck = QUESTIONS.filter((q) => q.category === category);
		let fresh = deck.filter((q) => !room.usedQuestions.includes(q.id));
		let used = room.usedQuestions;
		if (fresh.length === 0) {
			// Deck exhausted — reshuffle this category.
			fresh = deck;
			used = used.filter((id) => !deck.some((q) => q.id === id));
		}
		const question = fresh[Math.floor(Math.random() * fresh.length)];

		const isGuess = category === 'guess';
		await ctx.db.patch(roomId, {
			...base,
			phase: isGuess ? 'guess' : 'answer',
			usedQuestions: [...used, question.id],
			pending: {
				questionId: question.id,
				category,
				text: question.text,
				from,
				tile,
				destination: resolveTile(tile, layout),
				...(isGuess ? { guess: {} } : {})
			}
		});
		if (isGuess && partner) {
			const roller = room.players[room.turn];
			await remind(
				ctx,
				room,
				partner.id,
				'Guess time!',
				`${roller.name} landed on a guess tile: ${phraseGuess(question.text, roller.name, false)}`
			);
		}
	}
});

/** Guess tile: each player submits their answer; both stay hidden until both are in. */
export const submitGuess = mutation({
	args: {
		roomId: v.id('rooms'),
		playerId: v.string(),
		text: v.string(),
		audioId: v.optional(v.id('_storage')),
		audioSeconds: v.optional(v.number())
	},
	handler: async (ctx, { roomId, playerId, text, audioId, audioSeconds }) => {
		const room = await loadRoom(ctx, roomId);
		if (room.status !== 'playing' || room.phase !== 'guess' || !room.pending?.guess) {
			throw new ConvexError('That move is not allowed right now');
		}
		if (!room.players.some((p) => p.id === playerId)) throw new ConvexError('Not in this room');
		const trimmed = text.trim().slice(0, MAX_ANSWER);
		if (audioId) await validateAudio(ctx, audioId);
		if (!trimmed && !audioId) throw new ConvexError('Write or record an answer first');

		const subject = room.players[room.turn];
		const guess = { ...room.pending.guess };
		if (playerId === subject.id) {
			guess.subject = trimmed;
			guess.subjectAudio = audioId;
			guess.subjectSeconds = clampSeconds(audioSeconds);
		} else {
			guess.guess = trimmed;
			guess.guessAudio = audioId;
			guess.guessSeconds = clampSeconds(audioSeconds);
		}

		const bothIn = (!!guess.subject || !!guess.subjectAudio) && (!!guess.guess || !!guess.guessAudio);
		await ctx.db.patch(roomId, {
			phase: bothIn ? 'judge' : 'guess',
			pending: { ...room.pending, guess }
		});
		if (bothIn) {
			await remind(ctx, room, subject.id, 'Both answers are in!', 'See their guess and judge the match.');
		}
	}
});

/** Guess tile: the roller judges whether the guess matched. Match → bonus move; miss → forfeit. */
export const judgeGuess = mutation({
	args: { roomId: v.id('rooms'), playerId: v.string(), match: v.boolean() },
	handler: async (ctx, { roomId, playerId, match }) => {
		const room = await loadRoom(ctx, roomId);
		requireTurn(room, playerId, 'judge');
		const pending = room.pending!;
		const guess = pending.guess!;
		const subject = room.players[room.turn];
		const guesser = room.players.find((p) => p.id !== subject.id)!;
		const layout = fromStoredLayout(room.layout);

		let players = room.players;
		let bonusFrom: number | undefined;
		let bonusTo: number | undefined;
		let forfeit: string | undefined;
		if (match) {
			bonusFrom = guesser.position;
			bonusTo = resolveTile(moveBy(guesser.position, GUESS_BONUS, layout.size), layout);
			players = room.players.map((p) => (p.id === guesser.id ? { ...p, position: bonusTo! } : p));
		} else {
			forfeit = FORFEITS[Math.floor(Math.random() * FORFEITS.length)];
		}

		const answerId = await ctx.db.insert('answers', {
			roomId,
			playerId: subject.id,
			playerName: subject.name,
			category: 'guess',
			question: phraseGuess(pending.text, subject.name, false),
			answer: guess.subject ?? '',
			tile: pending.tile,
			audioId: guess.subjectAudio,
			audioSeconds: guess.subjectSeconds,
			guesserName: guesser.name,
			guess: guess.guess,
			guessAudioId: guess.guessAudio,
			guessAudioSeconds: guess.guessSeconds,
			match,
			forfeit
		});
		await ctx.db.patch(roomId, {
			players,
			phase: 'react',
			pending: {
				...pending,
				answer: guess.subject,
				answerId,
				guess: { ...guess, match, forfeit, bonusFrom, bonusTo }
			}
		});
		await remind(
			ctx,
			room,
			guesser.id,
			match ? `You know ${subject.name}!` : 'Forfeit time!',
			match ? `Your guess matched — bonus +${GUESS_BONUS} tiles.` : forfeit!
		);
	}
});

export const answer = mutation({
	args: {
		roomId: v.id('rooms'),
		playerId: v.string(),
		text: v.string(),
		audioId: v.optional(v.id('_storage')),
		audioSeconds: v.optional(v.number())
	},
	handler: async (ctx, { roomId, playerId, text, audioId, audioSeconds }) => {
		const room = await loadRoom(ctx, roomId);
		requireTurn(room, playerId, 'answer');
		const trimmed = text.trim().slice(0, MAX_ANSWER);

		if (audioId) await validateAudio(ctx, audioId);
		if (!trimmed && !audioId) throw new ConvexError('Write or record an answer first');

		const pending = room.pending!;
		const player = room.players[room.turn];
		const seconds =
			audioId && audioSeconds ? Math.min(MAX_AUDIO_SECONDS, Math.max(0, audioSeconds)) : undefined;

		const answerId = await ctx.db.insert('answers', {
			roomId,
			playerId,
			playerName: player.name,
			category: pending.category,
			question: pending.text,
			answer: trimmed,
			tile: pending.tile,
			audioId,
			audioSeconds: seconds
		});
		await ctx.db.patch(roomId, {
			phase: 'react',
			pending: { ...pending, answer: trimmed, answerId, audioId, audioSeconds: seconds }
		});

		const partner = room.players.find((p) => p.id !== playerId);
		if (partner) {
			await remind(
				ctx,
				room,
				partner.id,
				`${player.name} answered${audioId ? ' with a voice note' : ''}`,
				`"${pending.text}" — react to take your turn.`
			);
		}
	}
});

/** The partner reacts to the answer, which applies any snake/ladder and passes the turn. */
export const react = mutation({
	args: { roomId: v.id('rooms'), playerId: v.string(), reaction: v.optional(v.string()) },
	handler: async (ctx, { roomId, playerId, reaction }) => {
		const room = await loadRoom(ctx, roomId);
		if (room.status !== 'playing' || room.phase !== 'react') {
			throw new ConvexError('That move is not allowed right now');
		}
		const current = room.players[room.turn];
		if (current.id === playerId || !room.players.some((p) => p.id === playerId)) {
			throw new ConvexError('Only your partner can react to this answer');
		}
		if (reaction && !(REACTIONS as readonly string[]).includes(reaction)) {
			throw new ConvexError('Unknown reaction');
		}

		const pending = room.pending!;
		if (pending.answerId && reaction) await ctx.db.patch(pending.answerId, { reaction });

		const players = room.players.map((p, i) =>
			i === room.turn ? { ...p, position: pending.destination } : p
		);
		const size = fromStoredLayout(room.layout).size;
		const won = pending.destination === size;
		// A matched guess can carry the guesser onto the last tile.
		const guesserWon = !won && players.some((p) => p.id !== current.id && p.position === size);
		const winner = won ? current : guesserWon ? players.find((p) => p.id !== current.id)! : undefined;
		await ctx.db.patch(roomId, {
			players,
			pending: undefined,
			phase: 'roll',
			turn: winner ? room.turn : (room.turn + 1) % room.players.length,
			status: winner ? 'finished' : 'playing',
			winnerId: winner?.id
		});
		if (won) {
			await remind(ctx, room, current.id, 'You reached the finish!', 'Your partner reacted to your last answer. Play again?');
		}
	}
});

export const restart = mutation({
	args: { roomId: v.id('rooms'), playerId: v.string() },
	handler: async (ctx, { roomId, playerId }) => {
		const room = await loadRoom(ctx, roomId);
		if (!room.players.some((p) => p.id === playerId)) throw new ConvexError('Not in this room');
		if (room.status !== 'finished') throw new ConvexError('The game is still going');
		await ctx.db.patch(roomId, {
			players: room.players.map((p) => ({ ...p, position: 0 })),
			status: 'playing',
			// The loser of the last round starts.
			turn: room.players.findIndex((p) => p.id !== room.winnerId),
			phase: 'roll',
			pending: undefined,
			lastRoll: undefined,
			winnerId: undefined,
			// Every new round gets a fresh board of the same size.
			layout: toStoredLayout(generateLayout(fromStoredLayout(room.layout).size))
		});
	}
});
