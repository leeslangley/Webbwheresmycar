[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash I03 iOS wrapper: copy the game into the app

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: I03
Needs (already merged into `dev`): I01, W51
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
A script that copies the web game into `ios/www/` (the folder the app bundles).

## Read first
- index.html, src/, assets/ (what the browser version loads)
- ios/.gitignore (www/ is ignored)

## Files you may change (and nothing else)
- `tools/ios/sync_www.sh`
- `tests/run_sync_www.sh`

## Steps
1. `tools/ios/sync_www.sh` (sh; `cd` to the repo root first): `rm -rf ios/www && mkdir -p ios/www`; copy `index.html`, `manifest.webmanifest` and `sw.js` when they exist, the whole `src/` folder, and `assets/` EXCEPT `assets/art/preview` and anything under `build/`; never copy `docs`, `tests`, `tools`, `cards`, `.git`. If `index.html` is missing exit 1 with a message. Print `SYNCED <n> files` (n = number of files under ios/www).
2. `tests/run_sync_www.sh`: runs the script, requires exit 0, that `ios/www/index.html` and `ios/www/src/main.js` exist, that `ios/www/docs`, `ios/www/tests`, `ios/www/tools`, `ios/www/cards` and `ios/www/assets/art/preview` do not exist; prints `SYNC WWW OK`. (`ios/www` is git-ignored: do not commit it.)

## Acceptance (all must pass; exact commands)
- `sh tests/run_sync_www.sh` prints `SYNC WWW OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `I03: iOS wrapper: copy the game into the app`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
