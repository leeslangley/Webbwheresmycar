[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash W68c Game over goes to the end screen

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W68c
Needs (already merged into `dev`): W68b
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
After the newspaper closes, if the game is over, show the end screen.

## Read first
- src/game.js (from the last card)
- src/ui/scenes.js (how `pop` works)

## Files you may change (and nothing else)
- `src/game.js`
- `tests/game_c.test.mjs`

## Steps
1. In `createGame` wrap `app.pop`: remember the id of the scene being popped; call the original `pop`; if that id was `'news'` and `app.state.flags.gameOver` is true then `saveTo(storage, app.state)` and `app.go('endgame')`. Every other pop behaves as before.
2. Write `tests/game_c.test.mjs`: pop from news returns to the office; with `app.state.flags = {gameOver:true, won:false, reason:'year-end'}` set before the pop, `app.pop()` from news lands on `endgame`; popping any other scene never redirects; the save is stored when the redirect happens.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep game_c` shows PASS.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `W68c: Game over goes to the end screen`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
