[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash W71b Manifest, service worker and index links

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W71b
Needs (already merged into `dev`): W71a
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
So the game installs to the iPhone home screen and works offline.

## Read first
- index.html
- assets/icons/ (from the last card)

## Files you may change (and nothing else)
- `manifest.webmanifest`
- `sw.js`
- `index.html`
- `tests/pwa.test.mjs`

## Steps
1. Create `manifest.webmanifest` (JSON): `name` `Webb, where's my car?`, `short_name` `Webb Wheels`, `start_url` `./index.html`, `scope` `./`, `display` `fullscreen`, `orientation` `landscape`, `background_color` and `theme_color` `#14102a`, `icons` the 192 and 512 PNGs with `type` and `sizes`.
2. Create `sw.js`: `const CACHE = 'webb-v1'`, `const ASSETS = [...]` with `./`, `./index.html`, `./manifest.webmanifest`, the fonts under assets, the three icons and EVERY `.js` file under `src/` (use `find src -name '*.js' | sort`). `install` caches all and calls `skipWaiting`; `activate` deletes other caches and claims clients; `fetch` answers from cache first then network.
3. Edit `index.html`: add the manifest link, the apple-touch-icon link and, at the end of body, an inline script that registers `sw.js` inside a feature test and try/catch, skipped on localhost.
4. Write `tests/pwa.test.mjs` (jsc has a global `read(path)` for text and `read(path,'binary')`): manifest fields; every file listed in `sw.js` exists; the three PNGs start with the PNG signature bytes 137,80,78,71,13,10,26,10; at least 20 `./src/` entries; `index.html` contains `rel="manifest"` and `serviceWorker.register`.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep pwa` shows PASS.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `W71b: Manifest, service worker and index links`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
