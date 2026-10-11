[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash W64b Ledger tabs, workshop and buying a slot

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W64b
Needs (already merged into `dev`): W64a
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Add the workshop tab, the tab switching and buying a garage slot.

## Read first
- docs/SCENE_RULES.md (tap rule and scene structure)
- src/ui/scenes/ledger.js (from the last card)
- src/sim/actions.js (buySlot)

## Files you may change (and nothing else)
- `src/ui/scenes/ledger.js`
- `tests/scene_ledger_input.test.mjs`

## Steps
1. In `draw`, when `this.tab === 'workshop'` draw: `WORKSHOP BOARD`, `Garage slots <slots>/8`, bays as rectangles (filled for slots in use) and button `BUY EXTRA SLOT <money(3000)>` at `LAYOUT.buySlot`. Add the hit list, `pointer` and `key` per SCENE_RULES. Tapping a tab button sets `this.tab`; BACK and Escape call `app.pop()`.
2. BUY EXTRA SLOT calls `app.act(() => buySlot(app.state))`; when cash is under 3000 toast `Not enough money`, at 8 slots toast `Garage is full-size already` (do not call the action in those cases).
3. Write `tests/scene_ledger_input.test.mjs` with `startGame(1)`: workshop via `enter(app,{tab:'workshop'})` shows `Garage slots 3/8`; a tap on BUY (down, redraw at another `t`, up) gives slots 4, cash 17000, day 2; with cash 100 it toasts `Not enough money`; at 8 slots it toasts `Garage is full-size already`; tab buttons switch tabs; Escape pops.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep scene_ledger_input` shows PASS.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `W64b: Ledger tabs, workshop and buying a slot`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
