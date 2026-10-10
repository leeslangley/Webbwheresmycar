[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W05 New game state

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W05
Needs (already merged into `dev`): W02, W03
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Build the initial game state object exactly as specified, so every other module can rely on its shape.

## Read first
- docs/DESIGN.md section 4.2, 4.3, 9.4 (State shape)
- src/core/rng.js (seedRng)

## Files you may change (and nothing else)
- `src/core/state.js`
- `tests/state.test.mjs`

## Steps
1. Create `src/core/state.js` exporting `newGameState(seed = 1)`. It returns a fresh plain object with EXACTLY these top-level keys and starting values (see DESIGN.md 9.4): `v:1, seed, rng, day:1, cash:20000, reputation:40, buzz:0, garageSlots:3, nextId:1, market:{priceMult:1}, cars:[], shop:{listings:[],refreshedDay:1}, requests:[], auction:{month:1,lots:[],consigned:[],lastResults:[]}, stats:{jobsDone:0,jobsFailed:0,adsRun:0,carsBought:0,carsSold:0,bestAuctionSale:0,faults:0}, plates:{fatcat:false,stable:false,household:false,hammer:false}, headlines:[], pending:[], sit:[], today:{day:1,headline:'',events:[],monthReport:null}, lastMonthReport:null, flags:{gameOver:false,won:false,reason:''}, log:[]`.
2. Call `seedRng(state, seed)` from `./rng.js` so `state.rng` is set; store the seed in `state.seed`.
3. Also export `PLATE_KEYS = ['fatcat','stable','household','hammer']`.
4. Write `tests/state.test.mjs`: (a) `Object.keys(s).length` is exactly 23 and the keys are exactly the 23 listed above; (b) cash 20000, day 1, garageSlots 3, reputation 40; (c) two calls with the same seed are deep-equal (`JSON.stringify`); (d) different seeds give different `rng`; (e) `JSON.parse(JSON.stringify(s))` deep-equals `s`; (f) mutating one state's `cars` array does not change another state's (no shared references); (g) default seed is 1; (h) `PLATE_KEYS` equals `Object.keys(s.plates)`.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.
- `grep -c 'Math.random\|Date' src/core/state.js` prints `0`.

## Out of scope (do not touch)
- No shop, car or auction setup here (that is a later card). Only the empty initial shape.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W05: New game state`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour. Customers can be any gender or a family, so NEVER use he/him/his/she/her for `{customer}` or any named person (use they/their, the, a, or repeat the name).
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
