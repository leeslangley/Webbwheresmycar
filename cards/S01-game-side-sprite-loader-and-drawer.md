[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash S01 Game side: sprite loader and drawer

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: S01
Needs (already merged into `dev`): W51
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The game code that loads the pixel-art car sprites listed in `assets/art/cars/manifest.json` and draws them crisp (no smoothing).

## Read first
- src/art/cardraw.js (the signature of drawCar)
- src/boot.js (how the browser env is passed in)
- docs/ART_BIBLE.md (pixel stage)

## Files you may change (and nothing else)
- `src/art/sprites.js`
- `tests/sprites.test.mjs`

## Steps
1. Create `src/art/sprites.js` (pure; no DOM access except through the injected `env`). Export `createSprites(env)` with `env = {loadJson(url) -> Promise, loadImage(url) -> Promise}` returning `{ready: false, load(): Promise, has(id), size(id), draw(ctx, id, x, y, scale, opts)}`. `load()` fetches `assets/art/cars/manifest.json`, then every listed image via `env.loadImage('assets/art/cars/' + file)`, stores them, sets `ready = true`; a failing image is skipped, not fatal. `has(id)` is true when that sprite loaded. `draw` draws the sprite with its bottom centre at `(x, y)`: `ctx.save(); ctx.imageSmoothingEnabled = false; const k = Math.max(1, Math.round(scale * <sprite width px> / w))`... simpler: pixel size `p = Math.max(1, Math.round(scale))` and `ctx.drawImage(img, x - w*p/2, y - h*p, w*p, h*p)`; `ctx.restore()`. `opts.flip` mirrors horizontally via `ctx.scale(-1,1)`. Unknown id: draws nothing and returns false; else true.
2. Write `tests/sprites.test.mjs` with fake `loadJson`/`loadImage` (images are objects `{width,height}`): after `await load()` (jsc supports promises and async/await in modules: use `await` at top level or `.then`) `has('a')` is true and `has('zzz')` false; a failing image is skipped; `draw` calls `drawImage` once with the expected rectangle for scale 2 and sets `imageSmoothingEnabled` to false inside a balanced `save`/`restore`; unknown id draws nothing and returns false.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep sprites` shows PASS.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `S01: Game side: sprite loader and drawer`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
