[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W40 Start a game and bot playthrough test

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W40
Needs (already merged into `dev`): W34, W35, W36, W37, W38, W39
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Wire the whole simulation together: one function that starts a new game, and a test where a simple scripted bot plays whole years on many seeds, checking invariants so we know nothing crashes or goes out of range.

## Read first
- docs/DESIGN.md section 4 (all), 9.3, 9.4
- All files in src/sim, src/core, src/data

## Files you may change (and nothing else)
- `src/sim/newgame.js`
- `tests/playthrough.test.mjs`

## Steps
1. Create `src/sim/newgame.js` exporting `startGame(seed = 1)`: `state = newGameState(seed)`; `initShop(state)`; `prepareAuction(state)`; set `state.today = {day: 1, headline: chooseHeadline(state, [], {}), events: ['Welcome to Webb\'s Wheels, Mark!'], monthReport: null}`; `generateRequests(state)`; return state.
2. In `tests/playthrough.test.mjs` write a `bot(state)` function that returns one action per call by this policy, in this order: (1) if gameOver stop; (2) if `isAuctionDay(state.day)` call `attendAuction`; (3) if there are no cars: buy the cheapest sale listing the player can afford (`buyCar`), or if none is affordable `waitDay`; (4) if any car has a fault and cash >= its cost: `fixFault`; (5) if there is an open request and an available car that meets its thresholds: `acceptJob` with the highest fee request; (6) if cash > 6000 and buzz < 20: `advertise(state,'magazine')`; (7) if any car has condition < 4 and cash > 400: `serviceCar(...,'full')`; (8) else `waitDay`. Each call must perform exactly one action; if an action returns `ok:false` fall back to `waitDay`.
3. Test body: for seeds 1..25, `startGame(seed)`, then loop calling the bot until `flags.gameOver` or 400 actions. After EVERY action assert invariants: `Number.isInteger(cash)`; `cars.length <= garageSlots`; for every car `0 <= condition <= 10` and a finite number; `0 <= buzz <= 100`; `0 <= reputation <= 100`; `requests.length <= 6`; `shop.listings.length <= 8`; `state.day` is at most 366; no NaN or Infinity anywhere in the state: write a recursive `walk(value)` helper that visits every object/array member and asserts `Number.isFinite(x)` for every number (note `JSON.stringify` turns NaN into null, so do not rely on it). Also assert that each game ended (`gameOver` true) within 400 actions, and `reason` is one of 'won', 'year-end', 'bankrupt'. Print one line per seed with `print('seed ' + seed + ' ' + reason + ' day ' + day + ' cash ' + cash)`.
4. Finally assert that determinism holds: running seed 4 twice gives the identical final `JSON.stringify(state)`.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.
- `/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc -m tests/playthrough.test.mjs | grep -c '^seed '` prints `25`.

## Out of scope (do not touch)
- If the invariants fail because of a bug in an EARLIER card's file, do NOT fix that file: report STATUS: BLOCKED naming the file, the failing seed and the failing invariant.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W40: Start a game and bot playthrough test`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
