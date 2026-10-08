<script lang="ts">
	import { onDestroy } from 'svelte';
	import { page } from '$app/state';
	import { useMutation, useQuery } from 'convex-svelte';
	import { api } from '../../../../convex/_generated/api';
	import type { Id } from '../../../../convex/_generated/dataModel';
	import {
		CATEGORY_META,
		COLUMNS,
		fromStoredLayout,
		GUESS_BONUS,
		phraseGuess,
		REACTIONS,
		type Category
	} from '../../../../convex/board';
	import Board, { PLAYER_TONES } from '#lib/snakes/Board.svelte';
	import Dice3D from '#lib/snakes/Dice3D.svelte';
	import SecretQuestions from '#lib/snakes/SecretQuestions.svelte';
	import VoiceNote from '#lib/snakes/VoiceNote.svelte';
	import VoiceRecorder, { type VoiceClip } from '#lib/snakes/VoiceRecorder.svelte';
	import {
		disableReminders,
		enableReminders,
		reminderState,
		type ReminderState
	} from '#lib/push.ts';
	import { errorMessage, me, saveName } from '#lib/player.svelte.ts';
	import { streakDays, XP_PER_ANSWER } from '#lib/stats.ts';
	import { sfx, sound, toggleMute } from '#lib/sound.svelte.ts';
	import type { Icon } from '#lib/icons/index.ts';
	import {
		Badge,
		Button,
		Card,
		ChoiceTile,
		ProgressBar,
		Stat,
		Toast
	} from '#lib/ui/index.ts';
	import {
		ArrowBendUpLeftIcon,
		BellIcon,
		BellRingingIcon,
		BellSlashIcon,
		CaretDownIcon,
		ChatCircleDotsIcon,
		ChatTeardropDotsIcon,
		CATEGORY_ICON,
		DoorOpenIcon,
		EnvelopeSimpleOpenIcon,
		FireIcon,
		HeartIcon,
		LadderSimpleIcon,
		MagnifyingGlassIcon,
		PencilSimpleLineIcon,
		REACTION_ICON,
		reactionIcon,
		SnakeIcon,
		SpeakerHighIcon,
		SpeakerSlashIcon,
		StarIcon,
		TargetIcon,
		TrophyIcon,
		CheckIcon,
		XIcon
	} from '#lib/icons/index.ts';

	const code = $derived((page.params.code ?? '').toUpperCase());

	const roomQuery = useQuery(api.rooms.get, () => ({ code }));
	const room = $derived(roomQuery.data);
	const incomingQuery = useQuery(api.custom.incomingCount, () =>
		room ? { roomId: room._id, playerId: me.id } : 'skip'
	);
	const incoming = $derived(incomingQuery.data ?? 0);
	const answersQuery = useQuery(api.rooms.answers, () =>
		room ? { roomId: room._id } : 'skip'
	);

	const joinRoom = useMutation(api.rooms.join);
	const rollDice = useMutation(api.rooms.roll);
	const submitAnswer = useMutation(api.rooms.answer);
	const generateUploadUrl = useMutation(api.rooms.generateUploadUrl);
	const submitGuess = useMutation(api.rooms.submitGuess);
	const judgeGuess = useMutation(api.rooms.judgeGuess);
	const sendReaction = useMutation(api.rooms.react);
	const restartGame = useMutation(api.rooms.restart);

	const isMember = $derived(room?.players.some((p) => p.id === me.id) ?? false);
	const current = $derived(room ? room.players[room.turn] : undefined);
	const myTurn = $derived(current?.id === me.id);
	const partner = $derived(room?.players.find((p) => p.id !== me.id));
	const pending = $derived(room?.pending);
	const layout = $derived(fromStoredLayout(room?.layout));

	// ---- Guess tiles ----
	const isGuess = $derived(pending?.category === 'guess');
	const guesser = $derived(room?.players.find((p) => p.id !== current?.id));
	/** The question phrased for whoever is looking: "your …" for the roller, "Putu's …" for the guesser. */
	const questionText = $derived(
		pending && isGuess && current ? phraseGuess(pending.text, current.name, myTurn) : (pending?.text ?? '')
	);
	const iSubmittedGuess = $derived(
		!!room?.guessStatus && (myTurn ? room.guessStatus.subjectDone : room.guessStatus.guessDone)
	);
	let guessDraft = $state('');
	const meta = $derived(pending ? CATEGORY_META[pending.category as Category] : undefined);
	const winner = $derived(room?.players.find((p) => p.id === room.winnerId));

	let name = $state(me.name);
	let draft = $state('');
	let busy = $state(false);
	let error = $state('');
	let copied = $state(false);
	let journalOpen = $state(false);
	let secretsOpen = $state(false);
	let voiceClip = $state<VoiceClip | null>(null);
	let guessClip = $state<VoiceClip | null>(null);
	let answerRecording = $state(false);
	let guessRecording = $state(false);
	let answerRecorder: ReturnType<typeof VoiceRecorder> | undefined = $state();
	let guessRecorder: ReturnType<typeof VoiceRecorder> | undefined = $state();

	/** Upload a recorded clip to Convex storage and return its id. */
	async function uploadClip(roomId: NonNullable<typeof room>['_id'], clip: VoiceClip) {
		const uploadUrl = await generateUploadUrl({ roomId, playerId: me.id });
		const res = await fetch(uploadUrl, {
			method: 'POST',
			headers: { 'Content-Type': clip.blob.type },
			body: clip.blob
		});
		if (!res.ok) throw new Error('Upload failed');
		return (await res.json()).storageId as Id<'_storage'>;
	}

	async function sendGuess(roomId: NonNullable<typeof room>['_id']) {
		// If they hit send mid-recording, finish the recording and include it.
		const clip = (await guessRecorder?.finish()) ?? guessClip;
		if (!guessDraft.trim() && !clip) return;
		const audioId = clip ? await uploadClip(roomId, clip) : undefined;
		await submitGuess({ roomId, playerId: me.id, text: guessDraft, audioId, audioSeconds: clip?.seconds });
		sfx.send();
		guessDraft = '';
		if (clip) URL.revokeObjectURL(clip.url);
		guessClip = null;
	}
	let reminders = $state<ReminderState>('unsupported');

	$effect(() => {
		reminderState().then((s) => (reminders = s));
	});

	async function sendAnswer(roomId: NonNullable<typeof room>['_id']) {
		// If they hit send mid-recording, finish the recording and include it.
		const clip = (await answerRecorder?.finish()) ?? voiceClip;
		if (!draft.trim() && !clip) return;
		const audioId = clip ? await uploadClip(roomId, clip) : undefined;
		await submitAnswer({
			roomId,
			playerId: me.id,
			text: draft,
			audioId,
			audioSeconds: clip?.seconds
		});
		sfx.send();
		draft = '';
		if (clip) URL.revokeObjectURL(clip.url);
		voiceClip = null;
	}

	async function toggleReminders() {
		if (reminders === 'needs-install') {
			showToast({
				icon: BellIcon,
				tone: 'blue',
				title: 'Add to Home Screen first',
				body: 'On iPhone, tap Share → Add to Home Screen, then open the app from there.'
			});
			return;
		}
		if (reminders === 'blocked') {
			showToast({
				icon: BellSlashIcon,
				tone: 'red',
				title: 'Notifications are blocked',
				body: 'Allow notifications for this site in your browser settings.'
			});
			return;
		}
		try {
			reminders = reminders === 'on' ? await disableReminders() : await enableReminders();
			showToast(
				reminders === 'on'
					? { icon: BellRingingIcon, tone: 'green', title: 'Turn reminders on', body: "We'll ping you when it's your move." }
					: { icon: BellSlashIcon, tone: 'neutral', title: 'Turn reminders off', body: 'You can turn them back on any time.' }
			);
		} catch (err) {
			const noPushService = err instanceof DOMException && err.name === 'AbortError';
			showToast({
				icon: BellSlashIcon,
				tone: 'red',
				title: 'Could not turn on reminders',
				body: noPushService
					? "This browser can't receive push notifications. Try Chrome, Safari or Firefox."
					: 'Try again in a moment.'
			});
		}
	}
	let bubbleCollapsed = $state(false);
	let innerWidth = $state(1280);
	let fitWidth = $state(0);
	let fitHeight = $state(0);

	// Fill the available space: a tall 5-wide board on portrait screens, 10-wide otherwise.
	const CHIPS_HEIGHT = 72; // chip row + gap under the board
	// 100-tile boards are already square, so they always use the 10×10 grid.
	const columns = $derived(
		layout.size === 50 && fitHeight - CHIPS_HEIGHT > fitWidth * 1.1 ? 5 : COLUMNS
	);
	const boardWidth = $derived.by(() => {
		const rows = layout.size / columns;
		const ring = 16; // room for the board's frame
		const height = fitHeight - CHIPS_HEIGHT - ring;
		return Math.max(0, Math.min(fitWidth - ring, (height * columns) / rows));
	});
	const compact = $derived(innerWidth < 760);

	// Re-open the bubble whenever a new question or phase comes in.
	$effect(() => {
		void room?.rollCount;
		void room?.phase;
		bubbleCollapsed = false;
	});

	// Roll sequence: the dice tumbles, then the token walks, then the question is revealed.
	const DICE_SETTLE_MS = 1200;
	const rollKey = $derived(room?.rollCount ?? 0);
	const hasRoom = $derived(!!room);
	let rolling = $state(false);
	let diceSettled = $state(true);
	// Brief pause after the dice lands so the board can report the walk has started;
	// without it the bubble flashes up for a frame before the token moves.
	let settleGrace = $state(false);
	let boardMoving = $state(false);
	let seenRollKey: number | undefined;

	$effect(() => {
		const key = rollKey;
		if (!hasRoom) return;
		if (seenRollKey === undefined || key === seenRollKey) {
			seenRollKey = key;
			return;
		}
		seenRollKey = key;
		diceSettled = false;
		let graceTimer: ReturnType<typeof setTimeout> | undefined;
		const timer = setTimeout(() => {
			diceSettled = true;
			settleGrace = true;
			graceTimer = setTimeout(() => (settleGrace = false), 120);
		}, DICE_SETTLE_MS);
		return () => {
			clearTimeout(timer);
			clearTimeout(graceTimer);
			diceSettled = true;
			settleGrace = false;
		};
	});

	// Hold the mover on their starting tile until the dice has landed.
	const boardPlayers = $derived(
		room && pending && !diceSettled
			? room.players.map((p, i) => (i === room.turn ? { ...p, position: pending.from } : p))
			: (room?.players ?? [])
	);
	const revealed = $derived(diceSettled && !settleGrace && !boardMoving);

	async function roll(roomId: NonNullable<typeof room>['_id']) {
		rolling = true;
		await run(() => rollDice({ roomId, playerId: me.id }));
		rolling = false;
	}

	async function run(action: () => Promise<unknown>) {
		error = '';
		busy = true;
		try {
			await action();
		} catch (err) {
			error = errorMessage(err);
		} finally {
			busy = false;
		}
	}

	async function copyInvite() {
		const link = `${location.origin}/snakes-ladders/${code}`;
		try {
			await navigator.clipboard.writeText(link);
		} catch {
			prompt('Copy this link for your partner:', link);
		}
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	function moveNote(p: NonNullable<typeof pending>) {
		if (layout.ladders[p.tile]) {
			return { icon: LadderSimpleIcon, tone: 'gold', text: `Ladder! Climbs up to ${p.destination} after answering.` };
		}
		if (layout.snakes[p.tile]) {
			return { icon: SnakeIcon, tone: 'red', text: `Snake! Slides down to ${p.destination} after answering.` };
		}
		if (p.from + (room?.lastRoll ?? 0) > layout.size) {
			return { icon: ArrowBendUpLeftIcon, tone: 'blue', text: `Overshot ${layout.size} and bounced back.` };
		}
		return undefined;
	}

	const showBubble = $derived(
		room?.status === 'playing' && room.phase !== 'roll' && revealed && !!pending && !!meta
	);

	const status = $derived.by(() => {
		if (!room || room.status !== 'playing') return { title: '', sub: '' };
		const them = current?.name ?? '';
		if (room.phase === 'roll') {
			return myTurn
				? { title: 'Your turn', sub: 'Roll to see which question you land on.' }
				: { title: `${them}'s turn`, sub: 'Waiting for them to roll…' };
		}
		if (!diceSettled) return { title: `${myTurn ? 'You' : them} rolled…`, sub: 'The dice is tumbling' };
		if (!revealed) return { title: `${myTurn ? 'You' : them} rolled a ${room.lastRoll}!`, sub: 'Moving…' };
		if (room.phase === 'guess') {
			if (iSubmittedGuess) {
				return { title: 'Locked in!', sub: `Waiting for ${myTurn ? partner?.name : them} to answer…` };
			}
			return myTurn
				? { title: 'Guess tile!', sub: `Answer about yourself — ${partner?.name} is guessing.` }
				: { title: 'Guess tile!', sub: `Guess what ${them} will say.` };
		}
		if (room.phase === 'judge') {
			return myTurn
				? { title: 'Judge the guess', sub: `Did ${partner?.name} get it right?` }
				: { title: 'Answers revealed', sub: `${them} is judging your guess…` };
		}
		if (room.phase === 'answer') {
			return myTurn
				? { title: 'Your question', sub: 'Answer it in the bubble.' }
				: { title: `${them} is answering`, sub: 'Their question is in the bubble.' };
		}
		return myTurn
			? { title: 'Answer sent', sub: `Waiting for ${partner?.name} to react…` }
			: { title: 'Your reaction', sub: `React to ${them}'s answer to continue.` };
	});

	// ---- Progress stats (derived from the answer journal) ----
	const answers = $derived(answersQuery.data ?? []);
	const streak = $derived(streakDays(answers.map((a) => a._creationTime)));
	const xp = $derived(
		answers.length * XP_PER_ANSWER + answers.filter((a) => a.match).length * XP_PER_ANSWER
	);

	// ---- Toast from the top when a reaction lands ----
	type ToastState = { icon?: Icon; iconTone?: string; tone: string; title: string; body: string };
	let toast = $state<ToastState | null>(null);
	let seenReaction: string | undefined;
	let toastTimer: ReturnType<typeof setTimeout> | undefined;

	function showToast(next: ToastState) {
		clearTimeout(toastTimer);
		toast = next;
		// Not tied to the effect below: new answers re-run it and must not cancel the dismissal.
		toastTimer = setTimeout(() => (toast = null), 2800);
	}

	onDestroy(() => clearTimeout(toastTimer));

	$effect(() => {
		const latest = answersQuery.data?.[0];
		if (!latest) return;
		const key = `${latest._id}:${latest.reaction ?? ''}`;
		if (seenReaction === undefined || key === seenReaction) {
			seenReaction = key;
			return;
		}
		seenReaction = key;
		if (!latest.reaction) return;

		const mine = latest.playerId === me.id;
		const who = mine ? 'You' : latest.playerName;
		const ladderTo = layout.ladders[latest.tile];
		const snakeTo = layout.snakes[latest.tile];
		const reaction = reactionIcon(latest.reaction);
		sfx.reaction();
		showToast({
			icon: reaction?.icon,
			iconTone: reaction?.tone,
			tone: ladderTo ? 'gold' : snakeTo ? 'red' : 'green',
			// e.g. "Putu sent a hug to your answer" / "You sent love to Ayu's answer"
			title: mine
				? `${partner?.name ?? 'Your partner'} sent ${reaction?.phrase ?? 'a reaction'} to your answer`
				: `You sent ${reaction?.phrase ?? 'a reaction'} to ${latest.playerName}'s answer`,
			body: ladderTo
				? `${who} climb${mine ? '' : 's'} the ladder up to ${ladderTo}!`
				: snakeTo
					? `${who} slide${mine ? '' : 's'} down the snake to ${snakeTo}.`
					: `+${XP_PER_ANSWER} XP for ${mine ? 'your' : `${latest.playerName}'s`} answer.`
		});
	});

	// Let the author know when their partner lands on one of their secret questions.
	let seenSecretRoll: number | undefined;
	$effect(() => {
		if (!revealed || pending?.category !== 'custom' || seenSecretRoll === rollKey) return;
		seenSecretRoll = rollKey;
		if (myTurn) return; // the roller already sees it in the bubble
		showToast({
			icon: HeartIcon,
			iconTone: 'pink',
			tone: 'pink',
			title: `${current?.name} found your secret question!`,
			body: 'Watch the bubble for their answer.'
		});
	});

	// Whose move is it? Reacting is the partner's move; rolling and answering are the current player's.
	const myMove = $derived(
		room?.status === 'playing' &&
			isMember &&
			(room.phase === 'guess'
				? !iSubmittedGuess
				: room.phase === 'react'
					? !myTurn
					: myTurn)
	);

	// Announce the fresh board dealt on "Play again".
	let seenLayout: string | undefined;
	$effect(() => {
		const signature = JSON.stringify(room?.layout ?? null);
		if (!room) return;
		if (seenLayout !== undefined && signature !== seenLayout) {
			const ladders = Object.keys(layout.ladders).length;
			const snakes = Object.keys(layout.snakes).length;
			showToast({
				icon: LadderSimpleIcon,
				iconTone: 'gold',
				tone: 'blue',
				title: 'New board!',
				body: `${ladders} ladders, ${snakes} snakes and ${layout.hearts.length} heart tiles this time.`
			});
		}
		seenLayout = signature;
	});

	// ---- Sound cues for moments that aren't tied to a single action ----

	// Question bubble appears (a sparkle for secret questions).
	let soundedBubble: number | undefined;
	$effect(() => {
		if (!showBubble || soundedBubble === rollKey) return;
		soundedBubble = rollKey;
		if (pending?.category === 'custom') sfx.secret();
		else sfx.pop();
	});

	// Fanfare when the game ends (skipped if the page loads on an already-finished game).
	let lastStatus: string | undefined;
	$effect(() => {
		const status = room?.status;
		if (lastStatus === 'playing' && status === 'finished') sfx.win();
		lastStatus = status;
	});

	// A soft ding when it becomes your move while this tab is in the background.
	let wasMyMove = false;
	$effect(() => {
		const now = myMove;
		if (now && !wasMyMove && document.hidden) sfx.turn();
		wasMyMove = now;
	});

	// Guess result: chime/womp and a toast for both players once the roller judges.
	// The first value seen on page load is recorded silently so reopening a room doesn't replay it.
	let seenJudgement: number | null = null;
	$effect(() => {
		if (!room) return;
		const result = pending?.guess;
		const judged = room.phase === 'react' && result?.match !== undefined;
		const key = judged ? rollKey : -1;
		if (seenJudgement === null) {
			seenJudgement = key;
			return;
		}
		if (!judged || !result || key === seenJudgement) return;
		seenJudgement = key;
		const mine = guesser?.id === me.id;
		const who = mine ? 'You' : (guesser?.name ?? 'Your partner');
		if (result.match) {
			sfx.match();
			showToast({
				icon: TargetIcon,
				iconTone: 'purple',
				tone: 'green',
				title: `${who} guessed right!`,
				body: `+${GUESS_BONUS} tiles for ${mine ? 'you' : who}.`
			});
		} else {
			sfx.miss();
			showToast({
				icon: TargetIcon,
				iconTone: 'purple',
				tone: 'red',
				title: 'Not quite!',
				body: `Forfeit for ${mine ? 'you' : who}: ${result.forfeit}`
			});
		}
	});
</script>

<svelte:head>
	<title>{myMove ? '● Your turn · Us, Apart' : 'Us, Apart · Snakes & Ladders'}</title>
</svelte:head>

<svelte:window
	bind:innerWidth
	onkeydown={(e) => {
		if (e.key === 'Escape') {
			journalOpen = false;
			secretsOpen = false;
		}
	}}
/>

<main class:game={room && isMember}>
	<nav class="topbar">
		<a class="close" href="/snakes-ladders" aria-label="Leave game"><XIcon weight="bold" size="1.5rem" /></a>
		<div class="stats">
			{#if room && isMember}
				<button
					class="bell"
					onclick={toggleMute}
					aria-label={sound.muted ? 'Turn sound on' : 'Mute sound'}
					title={sound.muted ? 'Sound off' : 'Sound on'}
				>
					{#if sound.muted}
						<SpeakerSlashIcon weight="fill" size="1.5rem" />
					{:else}
						<SpeakerHighIcon weight="fill" size="1.5rem" />
					{/if}
				</button>
			{/if}
			{#if room && isMember && reminders !== 'unsupported'}
				<button
					class="bell"
					class:on={reminders === 'on'}
					onclick={toggleReminders}
					aria-label={reminders === 'on' ? 'Turn reminders on — tap to turn off' : 'Turn on turn reminders'}
					title={reminders === 'on' ? 'Turn reminders on' : 'Turn on turn reminders'}
				>
					{#if reminders === 'on'}
						<BellRingingIcon weight="fill" size="1.5rem" />
					{:else if reminders === 'blocked'}
						<BellSlashIcon weight="fill" size="1.5rem" />
					{:else}
						<BellIcon weight="bold" size="1.5rem" />
					{/if}
				</button>
			{/if}
			{#if room && isMember}
				<button class="stat-btn" onclick={() => (secretsOpen = true)} aria-label="Secret questions">
					<Stat icon={HeartIcon} value={incoming} color="pink" label="Secret questions waiting for you" />
				</button>
				<Stat icon={FireIcon} value={streak} color="orange" label="Day streak" />
				<Stat icon={StarIcon} value={xp} color="gold" label="Couple XP" />
				<button class="stat-btn" onclick={() => (journalOpen = true)} aria-label="Open our answers">
					<Stat icon={ChatCircleDotsIcon} value={answers.length} color="blue" label="Answers" />
				</button>
			{/if}
			{#if room}
				<button class="code" onclick={copyInvite} title="Copy invite link">
					{copied ? 'COPIED' : room.code}
				</button>
			{/if}
		</div>
	</nav>

	{#if roomQuery.isLoading}
		<p class="center muted">Loading room…</p>
	{:else if !room}
		<Card class="narrow">
			<div class="stack center">
				<span class="big" style="--c: var(--blue)"><MagnifyingGlassIcon weight="fill" /></span>
				<h2>Room not found</h2>
				<p class="muted">Double-check the code <strong>{code}</strong> with your partner.</p>
				<Button href="/snakes-ladders" full>Back</Button>
			</div>
		</Card>
	{:else if !isMember}
		{#if room.players.length >= 2}
			<Card class="narrow">
				<div class="stack center">
					<span class="big" style="--c: var(--orange)"><DoorOpenIcon weight="fill" /></span>
					<h2>This room is full</h2>
					<p class="muted">Two players are already in room {room.code}.</p>
					<Button href="/snakes-ladders" full>Start your own</Button>
				</div>
			</Card>
		{:else}
			<Card class="narrow">
				<form
					class="stack"
					onsubmit={(e) => {
						e.preventDefault();
						saveName(name);
						run(() => joinRoom({ code, playerId: me.id, name }));
					}}
				>
					<span class="big" style="--c: var(--pink)"><EnvelopeSimpleOpenIcon weight="fill" /></span>
					<h2>{room.players[0]?.name} is waiting for you</h2>
					<label class="label" for="name">Your name</label>
					<input id="name" bind:value={name} maxlength="24" autocomplete="nickname" />
					<Button type="submit" size="lg" full disabled={busy || !name.trim()}>Join the game</Button>
					{#if error}<p class="error">{error}</p>{/if}
				</form>
			</Card>
		{/if}
	{:else}
		<div class="stage">
			<section class="board-area" bind:clientWidth={fitWidth} bind:clientHeight={fitHeight}>
				<div class="board-col" style="width: {boardWidth}px">
					{#if boardWidth > 0}
						<Board
							players={boardPlayers}
							{layout}
							{columns}
							highlight={revealed ? pending?.tile : undefined}
							bind:moving={boardMoving}
						/>
					{/if}

					<div class="players">
						{#each [0, 1] as i (i)}
							{@const p = room.players[i]}
							{@const tone = PLAYER_TONES[i]}
							<div
								class="player"
								class:active={room.status === 'playing' && room.turn === i}
								class:empty={!p}
								style="--c: var(--{tone}); --c-shade: var(--{tone}-shade); --c-light: var(--{tone}-light)"
							>
								<span class="avatar">{p ? p.name.slice(0, 1).toUpperCase() : '?'}</span>
								<div class="who">
									<div class="name-row">
										<strong>{p ? p.name : 'Waiting…'}</strong>
										<small>{!p ? 'Share the code' : p.id === me.id ? 'You' : `${p.position}/${layout.size}`}</small>
									</div>
									<ProgressBar
										value={p?.position ?? 0}
										max={layout.size}
										color={tone}
										label="{p?.name ?? 'Player'} progress"
									/>
								</div>
							</div>
						{/each}
					</div>

					{#if showBubble && pending && meta}
						{#key rollKey}
							<div class="bubble" class:right={room.turn === 1} class:collapsed={bubbleCollapsed}>
								{#if bubbleCollapsed}
									<button class="bubble-pill" onclick={() => (bubbleCollapsed = false)}>
										<ChatTeardropDotsIcon weight="fill" size="1.2rem" />
										Question for {myTurn ? 'you' : current?.name} · tap to open
									</button>
								{:else}
									{@const cat = CATEGORY_ICON[pending.category as Category]}
									<header>
										<Badge color={cat.tone}>
											<cat.icon weight="fill" size="1.1em" />
											{pending.category === 'custom' && pending.author
												? `Secret question from ${pending.author}`
												: meta.label}
										</Badge>
										<button class="collapse" aria-label="Minimise question" onclick={() => (bubbleCollapsed = true)}
											><CaretDownIcon weight="bold" /></button
										>
									</header>

									{#if isGuess}
										<p class="guess-intro">
											<TargetIcon weight="fill" size="1.1rem" />
											{myTurn
												? `Answer about yourself — ${guesser?.name} is guessing what you'll say.`
												: `Guess what ${current?.name} will say!`}
										</p>
									{/if}
									<p class="q-text">{questionText}</p>
									{@const note = moveNote(pending)}
									{#if note}
										<p class="note" style="--c: var(--{note.tone}-shade)">
											<note.icon weight="fill" size="1.2rem" />
											{note.text}
										</p>
									{/if}

									{#if room.phase === 'guess'}
										{#if !iSubmittedGuess}
											<form
												class="stack"
												onsubmit={(e) => {
													e.preventDefault();
													run(() => sendGuess(room._id));
												}}
											>
												<textarea
													bind:value={guessDraft}
													maxlength="300"
													placeholder={myTurn ? 'Your honest answer…' : `Your guess for ${current?.name}…`}
													enterkeyhint="send"
													onkeydown={(e) => {
														if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
															e.preventDefault();
															if ((guessDraft.trim() || guessClip || guessRecording) && !busy) e.currentTarget.form?.requestSubmit();
														}
													}}
												></textarea>
												<VoiceRecorder
													bind:this={guessRecorder}
													bind:clip={guessClip}
													bind:recording={guessRecording}
													disabled={busy}
												/>
												<Button
													type="submit"
													variant="super"
													full
													disabled={busy || (!guessDraft.trim() && !guessClip && !guessRecording)}
												>
													{busy ? 'Locking in…' : myTurn ? 'Lock in my answer' : 'Lock in my guess'}
												</Button>
											</form>
										{/if}
										<div class="guess-progress">
											{#each [current, guesser] as person, i (i)}
												{@const done = i === 0 ? room.guessStatus?.subjectDone : room.guessStatus?.guessDone}
												<span class="guess-chip" class:done>
													{#if done}<CheckIcon weight="bold" />{:else}<PencilSimpleLineIcon weight="fill" />{/if}
													{person?.id === me.id ? 'You' : person?.name}
													{done ? 'locked in' : i === 0 ? 'answering…' : 'guessing…'}
												</span>
											{/each}
										</div>
									{:else if room.phase === 'judge' && pending.guess}
										<div class="guess-reveal">
											<div class="answer" style="--c: var(--{PLAYER_TONES[room.turn]}); --c-light: var(--{PLAYER_TONES[room.turn]}-light)">
												<span class="label">{myTurn ? 'You said' : `${current?.name} said`}</span>
												{#if room.guessAudioUrls?.subject}
													<VoiceNote src={room.guessAudioUrls.subject} seconds={pending.guess.subjectSeconds} tone={PLAYER_TONES[room.turn]} compact />
												{/if}
												{#if pending.guess.subject}<p>{pending.guess.subject}</p>{/if}
											</div>
											<div class="answer" style="--c: var(--{PLAYER_TONES[1 - room.turn]}); --c-light: var(--{PLAYER_TONES[1 - room.turn]}-light)">
												<span class="label">{myTurn ? `${guesser?.name} guessed` : 'You guessed'}</span>
												{#if room.guessAudioUrls?.guess}
													<VoiceNote src={room.guessAudioUrls.guess} seconds={pending.guess.guessSeconds} tone={PLAYER_TONES[1 - room.turn]} compact />
												{/if}
												{#if pending.guess.guess}<p>{pending.guess.guess}</p>{/if}
											</div>
										</div>
										{#if myTurn}
											<div class="judge">
												<Button variant="primary" disabled={busy} onclick={() => run(() => judgeGuess({ roomId: room._id, playerId: me.id, match: true }))}>
													<CheckIcon weight="bold" /> Match!
												</Button>
												<Button variant="danger" disabled={busy} onclick={() => run(() => judgeGuess({ roomId: room._id, playerId: me.id, match: false }))}>
													<XIcon weight="bold" /> Not quite
												</Button>
											</div>
										{:else}
											<p class="waiting-line">
												<TargetIcon weight="fill" size="1.2rem" />
												{current?.name} is judging your guess…
											</p>
										{/if}
									{:else if room.phase === 'answer'}
										{#if myTurn}
											<form
												class="stack"
												onsubmit={(e) => {
													e.preventDefault();
													run(() => sendAnswer(room._id));
												}}
											>
												<textarea
													bind:value={draft}
													maxlength="1000"
													placeholder="Type your answer… or record one below"
													enterkeyhint="send"
													onkeydown={(e) => {
														// Enter sends; Shift+Enter adds a line. Skip while an IME is composing.
														if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
															e.preventDefault();
															if ((draft.trim() || voiceClip || answerRecording) && !busy) e.currentTarget.form?.requestSubmit();
														}
													}}
												></textarea>
												<small class="hint">Enter to send · Shift+Enter for a new line</small>
												<VoiceRecorder
													bind:this={answerRecorder}
													bind:clip={voiceClip}
													bind:recording={answerRecording}
													disabled={busy}
												/>
												<Button
													type="submit"
													full
													disabled={busy || (!draft.trim() && !voiceClip && !answerRecording)}
												>
													{busy && (voiceClip || answerRecording) ? 'Sending…' : 'Send answer'}
												</Button>
											</form>
										{:else}
											<p class="waiting-line">
												<PencilSimpleLineIcon weight="fill" size="1.2rem" />
												{current?.name} is writing their answer…
											</p>
										{/if}
									{:else if room.phase === 'react'}
										{#if pending.guess}
											{#if pending.guess.match}
												<p class="guess-result win">
													<CheckIcon weight="bold" size="1.2rem" />
													{guesser?.id === me.id ? 'You' : guesser?.name} guessed right — +{GUESS_BONUS} tiles!
												</p>
											{:else}
												<div class="guess-result miss">
													<strong>
														<XIcon weight="bold" size="1.1rem" />
														Not quite! Forfeit for {guesser?.id === me.id ? 'you' : guesser?.name}:
													</strong>
													<p>{pending.guess.forfeit}</p>
												</div>
											{/if}
											<div class="guess-reveal compact">
												<div class="answer" style="--c: var(--{PLAYER_TONES[room.turn]}); --c-light: var(--{PLAYER_TONES[room.turn]}-light)">
													<span class="label">{myTurn ? 'You said' : `${current?.name} said`}</span>
													{#if room.guessAudioUrls?.subject}
													<VoiceNote src={room.guessAudioUrls.subject} seconds={pending.guess.subjectSeconds} tone={PLAYER_TONES[room.turn]} compact />
												{/if}
												{#if pending.guess.subject}<p>{pending.guess.subject}</p>{/if}
												</div>
												<div class="answer" style="--c: var(--{PLAYER_TONES[1 - room.turn]}); --c-light: var(--{PLAYER_TONES[1 - room.turn]}-light)">
													<span class="label">{myTurn ? `${guesser?.name} guessed` : 'You guessed'}</span>
													{#if room.guessAudioUrls?.guess}
													<VoiceNote src={room.guessAudioUrls.guess} seconds={pending.guess.guessSeconds} tone={PLAYER_TONES[1 - room.turn]} compact />
												{/if}
												{#if pending.guess.guess}<p>{pending.guess.guess}</p>{/if}
												</div>
											</div>
										{:else}
										<div
											class="answer"
											style="--c: var(--{PLAYER_TONES[room.turn]}); --c-light: var(--{PLAYER_TONES[room.turn]}-light)"
										>
											<span class="label">{current?.name} answered</span>
											{#if room.pendingAudioUrl}
												<VoiceNote
													src={room.pendingAudioUrl}
													seconds={pending.audioSeconds}
													tone={PLAYER_TONES[room.turn]}
												/>
											{/if}
											{#if pending.answer}<p>{pending.answer}</p>{/if}
										</div>
										{/if}
										{#if myTurn}
											<p class="waiting-line">
												<ChatTeardropDotsIcon weight="fill" size="1.2rem" />
												Waiting for {partner?.name} to react…
											</p>
										{:else}
											<div class="reactions">
												{#each REACTIONS as r (r)}
													{@const reaction = REACTION_ICON[r]}
													<ChoiceTile
														class="reaction"
														disabled={busy}
														aria-label={reaction.label}
														title={reaction.label}
														style="color: var(--{reaction.tone})"
														onclick={() =>
															run(() => sendReaction({ roomId: room._id, playerId: me.id, reaction: r }))}
													>
														<reaction.icon weight="fill" size="100%" />
													</ChoiceTile>
												{/each}
											</div>
										{/if}
									{/if}
								{/if}
							</div>
						{/key}
					{/if}
				</div>
			</section>

			<aside class="sidebar">
				{#if room.status === 'waiting'}
					<div class="side-status">
						<span class="big" style="--c: var(--pink)"><EnvelopeSimpleOpenIcon weight="fill" /></span>
						<h2>Invite your partner</h2>
						<p class="muted">
							Send them the code <strong class="mono">{room.code}</strong>. The game starts when they
							join.
						</p>
					</div>
					<Button variant="secondary" size="lg" full onclick={copyInvite}>
						{copied ? 'Link copied' : 'Copy invite link'}
					</Button>
					<Button variant="super" full onclick={() => (secretsOpen = true)}>
						<HeartIcon weight="fill" /> Write secret questions
					</Button>
				{:else if room.status === 'finished'}
					<div class="side-status">
						<span class="big trophy" style="--c: var(--gold)"><TrophyIcon weight="fill" /></span>
						<h2>{winner?.id === me.id ? 'You made it first!' : `${winner?.name} wins!`}</h2>
						<p class="muted">+{xp} couple XP so far. Win or lose, you know each other a little better.</p>
					</div>
					<Button
						size="lg"
						full
						disabled={busy}
						onclick={() => run(() => restartGame({ roomId: room._id, playerId: me.id }))}
					>
						Play again
					</Button>
				{:else}
					<div class="dice-wrap">
						<Dice3D value={room.lastRoll ?? 1} {rollKey} {rolling} size={compact ? 72 : 170} />
					</div>
					<div class="side-status">
						<h2>{status.title}</h2>
						<p class="muted">{status.sub}</p>
					</div>
					<Button
						size="lg"
						full={!compact}
						disabled={busy || boardMoving || !diceSettled || !myTurn || room.phase !== 'roll'}
						onclick={() => roll(room._id)}
					>
						Roll
					</Button>
				{/if}
				{#if error}<p class="error">{error}</p>{/if}
			</aside>
		</div>

		{#if secretsOpen}
			<SecretQuestions
				roomId={room._id}
				partnerName={partner?.name}
				{incoming}
				heartCount={layout.hearts.length}
				onclose={() => (secretsOpen = false)}
			/>
		{/if}

		{#if journalOpen}
			<button class="backdrop" aria-label="Close answers" onclick={() => (journalOpen = false)}></button>
			<aside class="drawer" aria-label="Our answers">
				<header>
					<h2>Our answers</h2>
					<Button variant="ghost" size="sm" onclick={() => (journalOpen = false)}>Close</Button>
				</header>
				<div class="drawer-stats">
					<Card tone="orange"><Stat icon={FireIcon} value={streak} color="orange-shade" label="Day streak" /><small>day streak</small></Card>
					<Card tone="gold"><Stat icon={StarIcon} value={xp} color="gold-shade" label="Couple XP" /><small>couple XP</small></Card>
				</div>
				{#if answers.length}
					<ul>
						{#each answers as a (a._id)}
							<li>
								<Card class="entry">
									{@const cat = CATEGORY_ICON[a.category as Category]}
									<div class="entry-head">
										<Badge color={cat?.tone ?? 'blue'}>
											{#if cat}<cat.icon weight="fill" size="1.1em" />{/if}
											{a.playerName}
										</Badge>
										<small class="muted">tile {a.tile}</small>
									</div>
									<p class="jq">{a.question}</p>
									{#if a.audioUrl}
										<div class="ja-voice">
											<VoiceNote src={a.audioUrl} seconds={a.audioSeconds} compact />
										</div>
									{/if}
									{#if a.category === 'guess'}
										<p class="jg">
											{a.guesserName} guessed: <em>{a.guess || 'a voice note'}</em>
											<Badge color={a.match ? 'green' : 'red'}>{a.match ? 'Match' : 'Miss'}</Badge>
										</p>
										{#if a.guessAudioUrl}
											<div class="ja-voice">
												<VoiceNote src={a.guessAudioUrl} seconds={a.guessAudioSeconds} tone="purple" compact />
											</div>
										{/if}
										{#if a.forfeit}<p class="jf">Forfeit: {a.forfeit}</p>{/if}
									{/if}
									<p class="ja">
										{a.answer}
										{#if a.reaction}
											{@const reaction = reactionIcon(a.reaction)}
											{#if reaction}
												<span class="jr" style="color: var(--{reaction.tone})" title={reaction.label}>
													<reaction.icon weight="fill" size="1.2rem" />
												</span>
											{:else}
												<span class="jr">{a.reaction}</span>
											{/if}
										{/if}
									</p>
								</Card>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="muted">Your answers will be collected here as you play.</p>
				{/if}
			</aside>
		{/if}

		{#if toast}
			<Toast tone={toast.tone} icon={toast.icon} iconTone={toast.iconTone} title={toast.title}>
				{toast.body}
			</Toast>
		{/if}
	{/if}
</main>

<style>
	main {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0.75rem 1.25rem 2rem;
	}

	main.game {
		height: 100dvh;
		display: flex;
		flex-direction: column;
		padding-bottom: 1rem;
		overflow: hidden;
	}

	/* ---- Top bar: close + stats, like Duolingo's lesson header ---- */

	.topbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
		flex-shrink: 0;
	}

	.close {
		display: grid;
		place-items: center;
		width: 2.4rem;
		height: 2.4rem;
		color: var(--hare);
		text-decoration: none;
	}

	.stats {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.bell {
		display: grid;
		place-items: center;
		width: 2.4rem;
		height: 2.4rem;
		border: none;
		border-radius: var(--radius-sm);
		background: none;
		color: var(--hare);
		cursor: pointer;
	}

	.bell.on {
		color: var(--gold);
	}

	@media (hover: hover) {
		.bell:hover {
			background: var(--polar);
		}
	}

	.ja-voice {
		margin-top: 0.4rem;
	}

	.stat-btn {
		border: none;
		background: none;
		padding: 0;
		border-radius: var(--radius-sm);
		cursor: pointer;
	}

	@media (hover: hover) {
		.stat-btn:hover {
			background: var(--polar);
		}
	}

	.code {
		margin-left: 0.5rem;
		padding: 0.45rem 0.9rem;
		border: var(--border) solid var(--swan);
		border-bottom-width: calc(var(--border) + var(--depth) - 1px);
		border-radius: var(--radius-sm);
		background: var(--snow);
		color: var(--wolf);
		font-weight: 900;
		letter-spacing: 0.2em;
		cursor: pointer;
	}

	.code:active {
		transform: translateY(2px);
		border-bottom-width: var(--border);
	}

	.center {
		text-align: center;
		align-items: center;
	}

	:global(.card.narrow) {
		max-width: 420px;
		width: 100%;
		margin: 3rem auto;
	}

	.stack {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}

	.stack p {
		margin: 0;
		line-height: 1.55;
	}

	.big {
		display: inline-flex;
		align-self: center;
		font-size: 3.2rem;
		color: var(--c, var(--eel));
	}

	.mono {
		letter-spacing: 0.2em;
	}

	/* ---- Game layout ---- */

	.stage {
		flex: 1;
		min-height: 0;
		display: grid;
		grid-template-columns: minmax(0, 1fr) 260px;
		gap: 1.5rem;
	}

	.board-area {
		/* Size comes from the grid, never from the board, so measuring it can't feed back. */
		contain: size;
		min-width: 0;
		min-height: 0;
		display: grid;
		place-items: center;
	}

	.board-col {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	/* ---- Player cards ---- */

	.players {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
	}

	.player {
		width: min(280px, 48%);
		display: flex;
		align-items: center;
		gap: 0.7rem;
		padding: 0.5rem 0.8rem;
		border: var(--border) solid var(--swan);
		border-bottom-width: calc(var(--border) + var(--depth));
		border-radius: var(--radius);
		background: var(--snow);
		transition:
			border-color 0.2s ease,
			background 0.2s ease;
	}

	.player.active {
		border-color: var(--c);
		border-bottom-color: var(--c-shade);
		background: var(--c-light);
	}

	.player.empty {
		border-style: dashed;
		opacity: 0.7;
	}

	.avatar {
		width: 2.2rem;
		height: 2.2rem;
		flex-shrink: 0;
		display: grid;
		place-items: center;
		border-radius: 0;
		background: var(--c);
		box-shadow: 0 3px 0 var(--c-shade);
		color: var(--snow);
		font-weight: 900;
	}

	.player.empty .avatar {
		background: var(--swan);
		box-shadow: 0 3px 0 var(--hare);
	}

	.who {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.name-row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 0.5rem;
	}

	.name-row strong {
		font-weight: 900;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.name-row small {
		color: var(--wolf);
		font-weight: 800;
		white-space: nowrap;
	}

	/* ---- Question bubble, rising from the active player's card ---- */

	.bubble {
		--tail: 2.2rem;
		position: absolute;
		left: 0;
		bottom: calc(3.6rem + 16px);
		z-index: 5;
		width: min(460px, 100%);
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem 1.1rem 1.1rem;
		background: var(--snow);
		border: var(--border) solid var(--swan);
		border-radius: var(--radius-lg);
		box-shadow: 0 var(--depth) 0 var(--swan);
		transform-origin: var(--tail) 100%;
		animation: pop 0.4s var(--ease-spring);
	}

	.bubble.right {
		left: auto;
		right: 0;
		transform-origin: calc(100% - var(--tail)) 100%;
	}

	.bubble::after {
		content: '';
		position: absolute;
		bottom: calc(-10px - var(--depth) / 2);
		left: var(--tail);
		width: 16px;
		height: 16px;
		background: var(--snow);
		border-right: var(--border) solid var(--swan);
		border-bottom: var(--border) solid var(--swan);
		border-bottom-right-radius: 4px;
		transform: rotate(45deg);
	}

	.bubble.right::after {
		left: auto;
		right: var(--tail);
	}

	.bubble.collapsed {
		padding: 0;
		width: auto;
		border-radius: 0;
	}

	@keyframes pop {
		from {
			opacity: 0;
			transform: translateY(12px) scale(0.85);
		}
	}

	.bubble-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		border: none;
		background: none;
		padding: 0.65rem 1.1rem;
		font-weight: 900;
		color: var(--blue);
		cursor: pointer;
	}

	.bubble header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.collapse {
		display: grid;
		place-items: center;
		border: none;
		background: var(--polar);
		border-radius: 0;
		width: 1.9rem;
		height: 1.9rem;
		cursor: pointer;
		color: var(--hare);
	}

	.q-text {
		margin: 0;
		font-size: 1.3rem;
		font-weight: 900;
		line-height: 1.35;
	}

	.note {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		margin: 0;
		font-size: 0.85rem;
		font-weight: 800;
		color: var(--c, var(--wolf));
		background: var(--polar);
		border-radius: var(--radius-sm);
		padding: 0.5rem 0.75rem;
	}

	.bubble textarea {
		min-height: 5rem;
	}

	.hint {
		margin-top: -0.4rem;
		color: var(--hare);
		font-size: 0.75rem;
		font-weight: 800;
	}

	/* No physical keyboard on touch screens, so skip the shortcut hint. */
	@media (pointer: coarse) {
		.hint {
			display: none;
		}
	}

	.waiting-line {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		margin: 0;
		font-weight: 800;
		color: var(--wolf);
		animation: breathe 2s ease-in-out infinite;
	}

	@keyframes breathe {
		50% {
			opacity: 0.45;
		}
	}

	.answer {
		padding: 0.75rem 0.9rem;
		border-radius: var(--radius);
		background: var(--c-light);
	}

	.answer .label {
		color: var(--c);
		filter: brightness(0.85);
		margin-bottom: 0.25rem;
	}

	.answer :global(.voice) {
		margin: 0.25rem 0 0.4rem;
		background: var(--snow);
	}

	.answer p {
		margin: 0;
		white-space: pre-wrap;
		line-height: 1.5;
		max-height: 28vh;
		overflow-y: auto;
	}

	.guess-intro {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin: 0;
		font-size: 0.85rem;
		font-weight: 800;
		color: var(--purple-shade);
	}

	.guess-progress {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.guess-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.3rem 0.65rem;
		border-radius: 0;
		background: var(--polar);
		color: var(--wolf);
		font-size: 0.8rem;
		font-weight: 800;
	}

	.guess-chip.done {
		background: var(--green-light);
		color: var(--green-shade);
	}

	.guess-reveal {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}

	.guess-reveal .answer :global(.voice) {
		margin: 0.2rem 0 0.35rem;
		background: var(--snow);
	}

	.guess-reveal.compact .answer p {
		font-size: 0.9rem;
	}

	.judge {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.6rem;
	}

	.guess-result {
		margin: 0;
		padding: 0.6rem 0.8rem;
		border-radius: var(--radius);
		font-weight: 900;
		animation: pop 0.4s var(--ease-spring);
	}

	.guess-result.win {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		background: var(--green-light);
		color: var(--green-shade);
	}

	.guess-result.miss {
		background: var(--red-light);
		color: var(--red-shade);
	}

	.guess-result.miss strong {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	.guess-result.miss p {
		margin: 0.25rem 0 0;
		color: var(--eel);
		font-weight: 800;
		line-height: 1.4;
	}

	.jg {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.4rem;
		font-size: 0.88rem;
		color: var(--purple-shade);
	}

	.jf {
		font-size: 0.82rem;
		color: var(--red-shade);
	}

	.reactions {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 0.45rem;
	}

	:global(.tile.reaction) {
		aspect-ratio: 1;
		min-width: 0;
		padding: 22%;
	}

	:global(.tile.reaction svg) {
		max-width: 2rem;
	}

	/* ---- Sidebar: dice + roll ---- */

	.sidebar {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.1rem;
		padding: 1.25rem;
		text-align: center;
		border: var(--border) solid var(--swan);
		border-bottom-width: calc(var(--border) + var(--depth));
		border-radius: var(--radius-lg);
		min-height: 0;
	}

	.side-status {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.side-status h2 {
		font-size: 1.35rem;
	}

	.side-status p {
		margin: 0;
		line-height: 1.45;
		font-size: 0.92rem;
	}

	.trophy {
		animation: bounce 1.2s var(--ease-spring) infinite alternate;
	}

	@keyframes bounce {
		to {
			transform: translateY(-8px) scale(1.06);
		}
	}

	/* ---- Answers drawer ---- */

	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 20;
		border: none;
		background: color-mix(in srgb, var(--page) 75%, transparent);
		animation: fade 0.2s ease;
	}

	.drawer {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		z-index: 21;
		width: min(440px, 100vw);
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
		padding: 1.25rem;
		background: var(--snow);
		border-left: var(--border) solid var(--swan);
		animation: slide-in 0.3s var(--ease-out);
	}

	@keyframes fade {
		from {
			opacity: 0;
		}
	}

	@keyframes slide-in {
		from {
			transform: translateX(100%);
		}
	}

	.drawer header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.drawer-stats {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	.drawer-stats :global(.card) {
		padding: 0.6rem 0.8rem;
		display: flex;
		flex-direction: column;
	}

	.drawer-stats small {
		padding-left: 0.6rem;
		font-weight: 800;
		color: var(--wolf);
	}

	.drawer ul {
		list-style: none;
		margin: 0;
		padding: 0 0 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		overflow-y: auto;
	}

	.drawer :global(.card.entry) {
		padding: 0.9rem 1rem;
	}

	.entry-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.drawer p {
		margin: 0.4rem 0 0;
		line-height: 1.45;
	}

	.jq {
		font-weight: 900;
		font-size: 0.92rem;
	}

	.ja {
		white-space: pre-wrap;
		color: var(--wolf);
	}

	.jr {
		display: inline-flex;
		vertical-align: -0.2em;
		margin-left: 0.25rem;
	}

	/* ---- Phones: sidebar becomes a bottom bar ---- */

	@media (max-width: 760px) {
		main.game {
			padding: 0.5rem 0.75rem 0.75rem;
		}

		.stage {
			grid-template-columns: minmax(0, 1fr);
			grid-template-rows: minmax(0, 1fr) auto;
			gap: 0.75rem;
		}

		.player {
			padding: 0.4rem 0.55rem;
			gap: 0.5rem;
		}

		.avatar {
			width: 1.8rem;
			height: 1.8rem;
		}

		.name-row small {
			display: none;
		}

		.bubble {
			width: 100%;
			bottom: calc(3.3rem + 14px);
		}

		.q-text {
			font-size: 1.1rem;
		}

		.sidebar {
			flex-direction: row;
			padding: 0.6rem 0.9rem;
			gap: 0.75rem;
			text-align: left;
		}

		.side-status {
			flex: 1;
			gap: 0.1rem;
		}

		.side-status h2 {
			font-size: 1.05rem;
		}

		.side-status p {
			font-size: 0.8rem;
		}

		.big {
			font-size: 2rem;
		}
	}
</style>
