[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CC02 Sprite loader v2: progress, timeout, meta, masks

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CC02
Needs (already merged into `dev`): S01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Extend the merged sprite loader so a loading screen can show progress, a slow or broken asset never blocks the game, and the paint recolour code can reach each sprite's manifest data and mask image. Existing behaviour and tests must keep passing.

## Read first
- docs/art/CC.md (the plan: sheets, sizes, API names; read the 'Sprite contract' and 'API' sections)
- src/art/sprites.js and tests/sprites.test.mjs (S01)

## Files you may change (and nothing else)
- `src/art/sprites.js`
- `tests/sprites.test.mjs`

## Steps
1. The manifest (written by tools/art/render_all.sh, card CC20) is `{ "<key>": {file, w, h, len_mm, paint, paints, mask} }`. Keys are `<carId>` (hero sheet) and `<carId>_s` (thumbnail sheet). `mask` is an optional file name (a second PNG: white opaque pixels where the sprite is body paint). Keep `load()` working with the old shape `{file,w,h}`.
2. `load(opts)`: `opts = {onProgress, timeoutMs}` (both optional; `opts` itself optional). Count `total` = number of image files in the manifest plus mask files; every finished download (success or failure) adds 1 to `done` and calls `opts.onProgress(done, total)`. Masks load through `env.loadImage('assets/art/cars/' + entry.mask)` and a failing mask is skipped (the sprite stays usable without it). If `opts.timeoutMs > 0` and `env.setTimeout` is a function, start `env.setTimeout(fn, timeoutMs)` at the start of `load()`: when it fires before loading finished, set `api.timedOut = true`, `api.ready = true` and resolve the `load()` promise (late images still land in the table afterwards). `load()` still never rejects.
3. New methods: `progress()` returns `{done, total}` (zeros before load starts); `meta(id)` returns a shallow copy of the manifest entry for a loaded id, else null; `image(id)` returns the loaded image or null; `maskImage(id)` returns the loaded mask image or null; `keys()` returns the ids that loaded. New property `timedOut` (false). `draw` stays exactly as it is.
4. Extend `tests/sprites.test.mjs` (keep the old tests): a manifest with two sprites (one with `mask`, `len_mm`, `paint`) and fake `loadImage` that fails for one mask: after `await load({onProgress})` the progress callback values are strictly increasing 1,2,3,4 and the last equals `progress().total` (4), `meta('a').len_mm` equals the manifest value, `maskImage('a')` is null (failed) and `maskImage('b')` is the fake image, `keys()` lists both ids. Timeout test: `loadImage` returns a never-resolving promise for one id, `env.setTimeout = function (fn) { timers.push(fn); }`; call `load({timeoutMs: 100})`, then run `timers[0]()`: the promise resolves, `ready === true`, `timedOut === true`, `has('slow') === false`.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep sprites` shows PASS.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CC02: Sprite loader v2: progress, timeout, meta, masks`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
