[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash W68b Actions that cost a day: save and newspaper

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W68b
Needs (already merged into `dev`): W68a
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
`app.act`: after a successful action save the game, remember the time and show the newspaper; failed actions just toast.

## Read first
- src/game.js (from the last card)
- src/sim/actions.js (waitDay, buyCar)

## Files you may change (and nothing else)
- `src/game.js`
- `tests/game_b.test.mjs`

## Steps
1. In `createGame` define `app.act = function (fn) {...}`: call `fn()`; if the result `r` has `r.ok === true`: `saveTo(storage, app.state); app.dayChangedAt = app.now(); app.audio.play('cash'); app.push('news');` (if `app.audio` does not exist yet, create a no-op `{play(){}}` object); if `r.ok === false && r.msg` toast `r.msg`. Return `r`. Results without an `ok` field are returned untouched.
2. Write `tests/game_b.test.mjs`: after `newGame()`, `app.act(() => waitDay(app.state))` returns ok, day 2, current scene `news`, and the stored save has day 2; a failing action (`buyCar(app.state, 'nope')`) leaves the day, pushes no news and adds a toast; a plain object result without `ok` is returned untouched.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep game_b` shows PASS.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `W68b: Actions that cost a day: save and newspaper`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
