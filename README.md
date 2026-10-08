# Us, Apart 💞

Mini games for two, built for long-distance couples. SvelteKit (Svelte 5) + [Convex](https://convex.dev) for the realtime database.

## Games

- **Snakes & Ladders** — the host picks **Quick (50 tiles)** or **Classic (100 tiles)**, and every game (and every "Play again") deals a freshly generated board: different snakes, ladders and heart tiles each time, with no crossings and balanced climbs vs. slides. Race to the last tile. Every tile you land on is a question you answer; your partner reacts with an emoji before the turn passes. Ladder tiles ask for sweet words, snake tiles ask for confessions. Every answer goes into the "Our answers" journal.
- **Guess-my-answer tiles** (purple target) — you answer a question about yourself while your partner guesses what you'll say; both stay hidden until locked in. You judge the match: a match moves your partner +3 tiles, a miss gives them a playful forfeit.
- **~290 questions** across Fun, Deep Talk, Memories, Future, ladder/snake/finish tiles and guess tiles, plus 18 forfeits (`convex/questions.ts`).
- **Bomb Defusal** — co-op panic over a voice call (use any call app). One partner is the *defuser* and sees the bomb: a timer, strikes, a serial number, batteries, indicators and 3–6 modules (wires, a big button, a symbol keypad, Simon Says). The other is the *expert* with the manual but no view of the bomb. Every round deals a new bomb **and** a new manual edition, so rules can't be memorised. Three strikes or 0:00 and it explodes. Roles swap each round; a mission log keeps score.
- **Burger for Two** — co-op cooking over a voice call. The *cashier* sees the customer and their order (described in their own voice, or sometimes as a picture); the *chef* sees only the kitchen and cooks blind. Three dishes are on the menu: **burgers** (an ordered stack, patties on the grill), **sate ayam** (skewers on the grill, sauces, with lontong or a side of soup) and **mie ayam** (noodles in the pot — undercooked, ready or soggy — plus toppings). The chef has to ask which dish before picking a station. Ten customer types (kid, food critic, grandma, gym guy, businessman, tourist, indecisive teen, influencer who only describes colours, secret agent who speaks in riddles, ojol driver reading an abbreviated app note) and three difficulties: Chill, Busy (6 customers, "NO onions" requests, mid-order changes of mind) and Rush hour (7 customers, bigger orders, shorter clocks). Orders grow through the shift. Serving scores ingredients, order (burgers only), doneness and time into stars, a tip and a reaction on both screens; a wrong dish is 1 star. The shift ends with Customer Reviews and a rematch with roles swapped.
- **Our Little Creature** — a cozy isometric pixel-art room the two of you share, with one cat you raise together. Pick its coat (orange tabby, tuxedo, calico, siamese, black, gray tabby or cream); on day 1 it's hiding in a box by the door and comes out once you've both said hello. The room fills the screen: tap to walk (characters path around the furniture), drag to look around, tap anything to use it. Feed it (kibble, fish, chicken, treats), play with a ball, laser pointer or feather wand, pet, brush or bathe it, call it over, tuck it in. Shared light switch and radio, a cat tree by the window, a fish tank, a cardboard box, and a cup it will absolutely knock off the table. It lives its own life — zoomies, grooming, kneading, stretching, chattering at birds, stealing gifts, hiding in the box — and its hidden personality grows from what you do. Talk with chat bubbles and emotes (wave, love, hug when you're close). Leave each other letters, flowers and treats; the other gets a "While you were away..." story on their next visit. One small question a day, voted privately and revealed together. A journal shows what's been happening and the memory book; on day 30 it grows into a Chonky Loaf, Fluffball, Sleek Hunter or Forest Cat depending on your habits. Needs drain gently and never bottom out; it never dies.
- **Secret questions** — each partner writes private questions for the other (heart button in the top bar). When your partner lands on a heart tile, one of yours pops up as "Secret question from you"; they stay hidden until then. Heart tiles fall back to normal questions when none are left.
- **Voice answers** — record up to 10 seconds instead of (or as well as) typing; your partner gets a play button. Stored in Convex file storage.
- **Sound effects** — dice rattle, token hops, ladder climb, snake slide, bubble pop, reaction chime, win fanfare (synthesised with Web Audio, no files). Mute from the speaker button in the top bar; preview them all on `/design`.
- **Turn reminders** — tap the bell to get a push notification when it's your move (your partner answered, or they joined). Works with the app closed. On iPhone, add the site to the Home Screen first.

## Develop

```sh
bun install
bun run convex   # terminal 1: Convex dev backend (writes PUBLIC_CONVEX_URL to .env.local)
bun run dev      # terminal 2: SvelteKit app
```

Create a room, then send your partner the 4-letter code or the invite link.

> `convex dev` without logging in runs a **local** backend at 127.0.0.1, which only your own machine can reach. To play with your partner, run `bunx convex login` and `bunx convex dev` to get a cloud dev deployment, or deploy (below).

## Deploy

1. `bunx convex deploy` to create the production Convex deployment.
2. Turn reminders: generate keys with `bunx web-push generate-vapid-keys`, then
   `bunx convex env set VAPID_PUBLIC_KEY …`, `VAPID_PRIVATE_KEY …` and `VAPID_SUBJECT mailto:you@yourdomain` on the production deployment.
3. Host the SvelteKit app (e.g. Vercel) with `PUBLIC_CONVEX_URL` (production Convex URL) and `PUBLIC_VAPID_KEY` (the public key) set. HTTPS is required for the microphone and push.

## Design system

Duolingo-inspired: bright flat colour, chunky rounded shapes, and a 3D "lip" under everything pressable. See it live at `/design`.

- `src/app.css` — tokens: colour families (`--green`, `--green-shade`, `--green-light`, …), neutrals (`--eel` → `--snow`), radius, depth, motion
- `src/lib/ui/` — `Button`, `Card`, `ChoiceTile`, `ProgressBar`, `Stat`, `Badge`, `Toast`
- `src/lib/icons/` — icon registry: [Phosphor](https://phosphoricons.com) icons in the `fill` weight plus custom snake glyphs. No emoji in the UI.

## Layout

- `convex/schema.ts` — `rooms` (game state) and `answers` (journal) tables
- `convex/rooms.ts` — create/join, roll, answer, react, restart (all moves are validated server-side)
- `convex/custom.ts` — secret questions: add, remove, list your own, count the ones waiting for you
- `convex/push.ts`, `convex/pushSubscriptions.ts` — turn reminders (Web Push)
- `src/service-worker.ts` — shows reminders and opens the room when one is tapped
- `convex/board.ts` — board sizes, the random layout generator (`generateLayout`), categories (shared with the client)
- `convex/questions.ts` — the question bank; edit freely
- `src/routes/snakes-ladders/` — lobby and game screen
- `convex/bomb.ts` — Bomb Defusal rules: seeded manual generator, bomb generator and solvers (shared with the client)
- `convex/defuse.ts` — Bomb Defusal rooms and moves; the defuser never receives the manual seed, the expert never receives the bomb, and every move is checked server-side
- `convex/burger/` — Burger for Two data and rules, shared with the client: `ingredients.ts` (names per customer voice, cooking timings), `dishes.ts` (the menu: each dish's ingredients, cooker and recipe, plus difficulty levels), `customers.ts` (voices, tastes, order-text templates, looks, reactions and reviews), `orders.ts` (random orders, refusals, changes of mind), `scoring.ts`. Add an ingredient, dish or customer by adding one entry (and a drawing in `src/lib/burger/Ingredient.svelte` or `Item.svelte`).
- `convex/kitchen.ts` — Burger for Two rooms and moves; the chef never receives the order, the cashier never receives what the chef is making, and the server owns the clock (scheduled jobs reveal a change of mind partway through and serve whatever is on the plate at the deadline)
- `src/lib/burger/` — SVG ingredients, burger stack, customer faces, the cashier counter, the kitchen, reactions and reviews; `src/routes/burger/` — lobby and game screen
- `convex/creature/` — Our Little Creature data shared with the client: `world.ts` (the isometric floor plan, furniture footprints, pathfinding and walking, needs maths, food, toys, gifts, coats, hidden traits, growth), `lines.ts` (what the cat says), `events.ts` (daily questions)
- `convex/pets.ts` — the room, the cat and everything done to it. The server owns the cat's needs, walk, speech and growth, player positions, emotes and chat bubbles, the lights and radio; a scheduled loop gives the cat a life of its own while anyone is in the room and stops when everyone leaves. To test growth: `bunx convex run pets:ageRoom '{"code":"ABCD","days":6}'`
- `src/lib/creature/` — the pixel art (`art.ts`: the isometric room and furniture, characters, the procedural cat in every coat, size and pose; drawn by `pixels.ts` to cached PNGs with tap masks), the room scene with its camera (`Room.svelte`) and the floating panels; `src/routes/creature/` — lobby and room
- `src/lib/bomb/` — the bomb casing, its modules and the manual; `src/routes/bomb-defusal/` — lobby and game screen
