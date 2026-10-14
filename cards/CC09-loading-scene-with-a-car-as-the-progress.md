[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CC09 Loading scene with a car as the progress marker

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CC09
Needs (already merged into `dev`): CC02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
A first scene shown while the car sprites and fonts load: it never blocks for more than a few seconds and works with no sprites at all. Uses only the code-drawn car (sprites are what it is waiting for).

## Read first
- docs/art/CARS_ALIGN.md (THE sprite contract: views, densities, file names, manifest v2, game mask; it wins over any other text) and docs/art/CC.md (API names and background; its 'Sprite contract' section is superseded)
- docs/SCENE_RULES.md (tap rule; do not change hit handling)
- src/ui/scenes/title.js (structure, label and PALETTE use)
- src/art/cardraw.js (drawCar)

## Files you may change (and nothing else)
- `src/ui/scenes/loading.js`
- `tests/scene_loading.test.mjs`

## Steps
1. `src/ui/scenes/loading.js` exports `loadingScene = {id:'loading', enter, draw, pointer(){}, key(){}}`. `app.assets` (set by boot, card CC10) is `{progress() -> {done,total}, ready() -> bool, timedOut() -> bool}`; when `app.assets` is undefined the scene goes straight to the title. `enter(app)`: `this.start = null; this.went = false;`. In `draw(ctx, app, t)`: if `this.start === null` set `this.start = t`. `frac = total > 0 ? done/total : 0` (1 when ready). Leave condition: `(assets.ready() && t - this.start >= 0.6) || t - this.start >= 8`; when true and `!this.went` set `went = true` and call `app.go('title')` once.
2. Look (logical 1280x720): vertical gradient `PALETTE.ink` to `PALETTE.blue`; title `WEBB, WHERE'S MY CAR?` centred at y 220, `font:'title'`, size 40, `PALETTE.cream` with shadow; subtitle `A WEBB'S WHEELS PRODUCTION` y 290 size 26 body font `PALETTE.lightgrey`. Progress track: road rect `x 340, y 520, w 600, h 28` fill `PALETTE.darkgrey` with a yellow dashed centre line (`PALETTE.yellow`, dash 24 gap 16, 4 px high, scrolling left at 90 px/s using t); 20 segment cells (28 px wide, 4 px gap) above the road at y 486 height 16, the first `floor(frac*20)` filled `PALETTE.good`, others `shade(PALETTE.ink, 0.2)`. The car: `drawCar(ctx, 'saloon', 340 + frac*600, 548, 0.45, {body:'#C8102E', cond:10, t})`. Text under the road at y 590: `REVVING UP` plus 0..3 dots chosen by `Math.floor(t*3) % 4`, size 28; when `assets.timedOut()` show `STILL REVVING - GOING ANYWAY` instead.
3. `tests/scene_loading.test.mjs` (makeCtx, makeApp): app with `assets = {progress: () => ({done:2,total:4}), ready: () => false, timedOut: () => false}`: draw at t=0 and t=1 draws a text that starts with `REVVING UP` (check with `texts`), makes no `go` call, and the car `drawCar` marker is at x=640 (find the `translate` call with x 640 +- 1); then `ready: () => true`: at t=1.0 (start was 0) exactly one `['go','title']` call even after two more draws; ready but t=0.3 makes no call; `ready: false` forever: no call at t=7.9, one call at t=8.1; `app.assets` undefined: one `go` at the first draw; `timedOut: true` shows the `GOING ANYWAY` text. LAYOUT numbers: all fillRect calls lie in 0..1280 x 0..720.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep scene_loading` shows PASS.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CC09: Loading scene with a car as the progress marker`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
