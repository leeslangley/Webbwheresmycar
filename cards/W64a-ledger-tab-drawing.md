[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash W64a Ledger tab drawing

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W64a
Needs (already merged into `dev`): W45, W47, W29, W34, W40
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Draw the finances page (the ledger book) with no tapping yet.

## Read first
- docs/SCENE_RULES.md (tap rule and scene structure)
- docs/DESIGN.md sections 4.2, 4.3, 4.9, 4.11
- src/sim/endgame.js (netWorth, PLATE_INFO), src/sim/carstats.js (runningCost), src/core/format.js

## Files you may change (and nothing else)
- `src/ui/scenes/ledger.js`
- `tests/scene_ledger_draw.test.mjs`

## Steps
1. Create `src/ui/scenes/ledger.js` exporting `ledgerScene` (id `'ledger'`, structure as in SCENE_RULES) and `LAYOUT = {tabLedger:{x:40,y:90,w:260,h:50}, tabWorkshop:{x:310,y:90,w:260,h:50}, buySlot:{x:340,y:520,w:360,h:70}, back:{x:40,y:650,w:200,h:50}}`. `enter(app, params)` sets `this.tab = 'workshop'` if `params && params.tab === 'workshop'`, else `'ledger'`. For now `draw` only draws the ledger tab; `pointer` and `key` do nothing yet.
2. Ledger tab: a cream book panel with rows `Cash <money>`, `Net worth <money>`, `Stable value <money>` (market value of owned cars), `Expected next bills <money>` (= rent of rented cars + running costs of owned cars + 400), `Reputation <n>/100`, `Buzz <n>`, then `Jobs done`, `Jobs failed`, `Adverts run`, `Cars bought`, `Cars sold`, `Best auction sale <money>`, `Faults so far`. Second column `GOLD NUMBER PLATES`: four rows with the plate name, goal text and `WON` (gold) or progress: fatcat `<netWorth>/<money(100000)>`, stable `<owned>/6 cars`, household `<rep>/85`, hammer `best <money>/<money(100000)>`. Draw the tab buttons and BACK with `button`.
3. Write `tests/scene_ledger_draw.test.mjs` with `startGame(1)`: texts include `Reputation 40/100`, `GOLD NUMBER PLATES`, `Fat Cat`, `0/6 cars`, and the starting cash text twice or more; add an owned `t2_serious` (condition 10) to `state.cars` and `Stable value` becomes `£22,000` written as `money(22000)` in the test; expected bills equals `money(460 + 400)` for that state.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep scene_ledger_draw` shows PASS.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `W64a: Ledger tab drawing`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
