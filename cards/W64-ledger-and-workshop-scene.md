[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W64 Ledger and workshop scene

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W64
Needs (already merged into `dev`): W45, W47, W29, W34, W40
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The filing cabinet: finances, stats and Gold Number Plate progress; plus a workshop tab to buy extra garage slots.

## Read first
- docs/DESIGN.md section 4.2, 4.3, 4.9, 4.11, 9.5, 9.7
- src/sim/endgame.js (netWorth, PLATE_INFO, finalScore), actions.js (buySlot), carstats.js (runningCost), src/core/format.js
- A scene is an object `{id, enter(app,params), draw(ctx,app,t), pointer(app,type,x,y), key(app,key)}` exported as `<name>Scene` (DESIGN.md 9.5 and 9.7). Sim actions are called ONLY through `app.act(() => fn(app.state, ...))`; in tests `app.act` is `fn => fn()`. Rebuild the scene's hit list (`makeHits()`) at the start of every `draw` so it always matches what is on screen. `pointer` handles `'down'` (select/press) and `'up'` (tap = same hit on down and up; scrolling lists use ScrollList beginDrag/dragTo/endDrag on down/move/up).

## Files you may change (and nothing else)
- `src/ui/scenes/ledger.js`
- `tests/scene_ledger.test.mjs`

## Steps
1. Create `src/ui/scenes/ledger.js` exporting `ledgerScene` (id `'ledger'`) and `LAYOUT = {tabLedger:{x:40,y:90,w:260,h:50}, tabWorkshop:{x:310,y:90,w:260,h:50}, buySlot:{x:340,y:520,w:360,h:70}, back:{x:40,y:650,w:200,h:50}}`. `enter(app, params)` selects the tab `'workshop'` when `params && params.tab === 'workshop'`, else `'ledger'`.
2. Ledger tab: a cream ledger-book panel. Rows: `Cash <money>`, `Net worth <money>`, `Stable value <money>` (market value of owned cars), `Expected next bills <money>` = rent of rented cars + running costs of owned cars + 400, `Reputation <n>/100`, `Buzz <n>`, and a stats block `Jobs done`, `Jobs failed`, `Adverts run`, `Cars bought`, `Cars sold`, `Best auction sale <money>`, `Faults so far`. A second column `GOLD NUMBER PLATES`: four rows with the plate's name, its goal text and `WON` (gold) or the current progress (`fatcat`: `<netWorth>/£100,000`, `stable`: `<owned>/6 cars`, `household`: `<rep>/85`, `hammer`: `best <money>/£100,000`).
3. Workshop tab: text `WORKSHOP BOARD`, `Garage slots <slots>/8`, a picture of garage bays (slots as rectangles, filled for slots in use) and button `BUY EXTRA SLOT <£3,000>` calling `app.act(() => buySlot(app.state))`; disabled with a toast when cash < 3000 (`Not enough money`) or at 8 slots (`Garage is full-size already`).
4. Write `tests/scene_ledger.test.mjs` using `startGame(1)`: ledger texts include `£20,000` twice or more (cash and net worth), `Reputation 40/100`, `GOLD NUMBER PLATES`, `Fat Cat`, `0/6 cars`; adding an owned `t2_serious` condition 10 raises `Stable value` text to `£22,000`; expected bills text equals running cost 460 + 400 = `£860`; workshop tab (via `enter(app,{tab:'workshop'})`) shows `Garage slots 3/8`; tapping BUY EXTRA SLOT makes slots 4, cash 17000 and day 2; with cash 100 it toasts `Not enough money`; at 8 slots it toasts `Garage is full-size already`; tab buttons switch tabs; Escape pops.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No sim changes.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W64: Ledger and workshop scene`.
- Content rule for ALL text you write (jokes, names, headlines): no real brands, car marques, shops, newspapers, TV shows, real people or royals (write a changed-spelling parody instead, or leave the name out), no swearing, plain ASCII punctuation only (straight quotes ' and ", no curly quotes, no accents), affectionate British humour.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
