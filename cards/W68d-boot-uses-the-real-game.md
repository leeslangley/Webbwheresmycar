[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash W68d Boot uses the real game

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W68d
Needs (already merged into `dev`): W68c
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Make the browser entry use `createGame` instead of the placeholder title.

## Read first
- src/boot.js
- tests/boot.test.mjs
- src/game.js

## Files you may change (and nothing else)
- `src/boot.js`
- `tests/boot.test.mjs`

## Steps
1. Edit `src/boot.js` so `bootGame` builds the app with `createGame({storage: env.storage, now})` (keep every export and all the event wiring working). Remove the placeholder scene code.
2. Update `tests/boot.test.mjs` so it still passes: the first scene is `title` and the drawn text includes `WEBB,`. Do not weaken any other check in that file.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep boot` shows PASS.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `W68d: Boot uses the real game`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
