[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash W66a End screen drawing

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W66a
Needs (already merged into `dev`): W45, W47, W29, W40
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The end-of-game screen: heading, subline and the score block.

## Read first
- docs/SCENE_RULES.md (tap rule and scene structure)
- src/sim/endgame.js (finalScore, rankOf, evaluatePlates, PLATE_INFO)
- docs/DESIGN.md section 4.11

## Files you may change (and nothing else)
- `src/ui/scenes/endgame.js`
- `tests/scene_endgame_draw.test.mjs`

## Steps
1. Create `src/ui/scenes/endgame.js` exporting `endgameScene` (id `'endgame'`) and `LAYOUT = {again:{x:340,y:610,w:280,h:60}, title:{x:660,y:610,w:280,h:60}}`. Heading by `state.flags.reason`: `'won'` -> `GOLD! MARK'S A LEGEND`, `'year-end'` -> `THE YEAR IS UP`, `'bankrupt'` -> `BANKRUPT! THE BAILIFFS ARRIVE`. Subline (body font): won `All four Gold Number Plates in one year. Mark buys a round.`, year-end `The bank manager is smiling politely.`, bankrupt `Dave takes the kettle. Mark takes the bus.`
2. Below: `Final score <n>`, `Rank: <rankOf(score)>` (prefix `GOLD ` when won), `Net worth <money>`, `Reputation <n>`, `Jobs done <n>`, the four plates (name, `WON` in gold or `missed` in grey) and `Best auction sale <money>`. Draw the buttons PLAY AGAIN and TITLE with `button` (no tapping yet).
3. Write `tests/scene_endgame_draw.test.mjs`: with `flags = {gameOver:true, won:true, reason:'won'}` the text has `GOLD! MARK'S A LEGEND` and a rank starting `GOLD`; 'year-end' shows `THE YEAR IS UP`; 'bankrupt' shows `BANKRUPT! THE BAILIFFS ARRIVE`; score and rank texts equal `finalScore(state)` / `rankOf(...)` computed in the test for a fresh state with cash 50000.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep scene_endgame_draw` shows PASS.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `W66a: End screen drawing`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
