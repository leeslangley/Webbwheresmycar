[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W36 Advertising gamble

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W36
Needs (already merged into `dev`): W33, W12
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Advertise in one of the seven media: pay the money, roll the gamble, gain buzz (and sometimes lose reputation), get a funny result message.

## Read first
- docs/DESIGN.md section 4.8 and 8.1
- src/data/adverts.js, src/sim/advance.js, src/core/rng.js

## Files you may change (and nothing else)
- `src/sim/adsim.js`
- `tests/adsim.test.mjs`

## Steps
1. Create `src/sim/adsim.js` exporting `advertise(state, mediaId)`. Unknown media -> `{ok:false, msg:'No such advert'}`. `cash < cost` -> `{ok:false, msg:'Not enough money'}` (nothing changes, no day).
2. Success: `cash -= cost`; `outcome = weighted(state, medium.outcomes)`; `state.buzz = clamp(state.buzz + outcome.buzz, 0, 100)`; `state.reputation = clamp(state.reputation + outcome.rep, 0, 100)`; `state.stats.adsRun++`; text = `pick(state, outcome.texts)` with `{medium}` replaced by the medium name; push to `state.pending`; if `outcome.buzz >= 80` push `'viral'` to `state.sit`; call `advanceDay(state)`; return `{ok:true, msg:text, outcome:{id:outcome.id, buzz:outcome.buzz, rep:outcome.rep, mediaId}}`.
3. Write `tests/adsim.test.mjs` with `fresh(seed)` (newGameState + initShop + prepareAuction), cash set high: (a) `paper` costs exactly 150 and advances exactly one day; (b) unknown media and short cash refuse with the day, cash and buzz unchanged; (c) over 2000 seeds the mean immediate buzz GAIN of `tv` (measure from the returned `outcome.buzz`) is within 3 of 54.5; (d) `youtube` viral (buzz 80) frequency over 2000 seeds is between 7.5% and 12.5%, and the cringe outcome (rep -3) never takes reputation below 0 when reputation starts at 1 (it becomes 0); (e) buzz never exceeds 100 even when starting at 90 and winning 90; (f) a viral outcome puts `'viral'` in the sit list BEFORE advanceDay consumes it: assert instead that the headline pipeline still works (day advanced, `today.headline` non-empty); (g) `stats.adsRun` increments; (h) message has no `{medium}` left in it; (i) deterministic for the same seed.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No UI. No targeting a specific car (not in this version).

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W36: Advertising gamble`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
