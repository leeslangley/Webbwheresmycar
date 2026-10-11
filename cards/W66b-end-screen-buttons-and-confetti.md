[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash W66b End screen buttons and confetti

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W66b
Needs (already merged into `dev`): W66a
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Make PLAY AGAIN and TITLE work, and animate confetti (won) and a drifting cloud (bankrupt).

## Read first
- docs/SCENE_RULES.md (tap rule and scene structure)
- src/ui/scenes/endgame.js (from the last card)

## Files you may change (and nothing else)
- `src/ui/scenes/endgame.js`
- `tests/scene_endgame_input.test.mjs`

## Steps
1. Add the hit list, `pointer` and `key` per SCENE_RULES. PLAY AGAIN calls `app.newGame()`; TITLE calls `app.go('title')`. Enter does the same as PLAY AGAIN.
2. When won draw deterministic falling confetti rectangles (positions computed from `t`, no random); when bankrupt draw a drifting grey cloud.
3. Write `tests/scene_endgame_input.test.mjs`: PLAY AGAIN (down, redraw at other `t`, up) records `['newGame']`; TITLE records `['go','title',undefined]`; drawing a won state at two different `t` gives different logs (confetti moves).

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep scene_endgame_input` shows PASS.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `W66b: End screen buttons and confetti`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
