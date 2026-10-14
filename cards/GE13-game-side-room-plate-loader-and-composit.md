[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GE13 Game side: room plate loader and compositor

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GE13
Needs (already merged into `dev`): S01, GE01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Load the room plates listed in `assets/art/rooms/manifest.json` and draw them crisp (no smoothing, x2 pixel scale), with an optional front layer that shifts a few pixels against the pointer so the room has depth. Same style as src/art/sprites.js.

## Read first
- src/art/sprites.js (copy its structure: createX(env), env = {loadJson, loadImage}, load never rejects)
- tests/sprites.test.mjs (how the fake loaders and the fake ctx are used)
- src/art/stage.js (GE01)

## Files you may change (and nothing else)
- `src/art/rooms.js`
- `tests/rooms.test.mjs`

## Steps
1. `src/art/rooms.js` (pure, no DOM): `export const PARALLAX = { front: { x: 6, y: 3 } };` and `export function createRooms(env)` returning `{ready, load, has, info, draw, drawFront}`. `load()`: `env.loadJson('assets/art/rooms/manifest.json')`, then for every id load `assets/art/rooms/<file>` and, when `front` is set, that file too (a failing image is skipped, a failing manifest leaves nothing; load never rejects; ready becomes true at the end). `has(id)`: the plate image loaded. `info(id)`: `{w, h, scale, hasFront}` or null.
2. `draw(ctx, id, opts)`: opts `{look: {x, y}}` (each -1..1, default 0, clamped). Unknown id: draws nothing, returns false. Otherwise `ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(img, 0, 0, w*scale, h*scale); ctx.restore();` return true (the plate itself never moves).
3. `drawFront(ctx, id, opts)`: same for the front image (if the id has none or it did not load: nothing, return false) but drawn at `x = Math.round(-look.x * PARALLAX.front.x)`, `y = Math.round(-look.y * PARALLAX.front.y)`.
4. `tests/rooms.test.mjs` with fake loaders (images are `{width:640,height:360}`): after `await load()` `has('office')` true and `has('zzz')` false; a failing image is skipped; `draw(ctx,'office')` makes exactly one `drawImage` call with args `(img,0,0,1280,720)` and balanced save/restore and sets `imageSmoothingEnabled` to false; unknown id returns false and records no drawImage; `drawFront` with `look {x:1,y:-1}` draws at (-6, 3); `drawFront` for a room without front returns false; `info('office')` deep-equals `{w:640,h:360,scale:2,hasFront:true}`; a manifest loader that rejects still resolves load().

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep rooms` shows PASS.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GE13: Game side: room plate loader and compositor`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
