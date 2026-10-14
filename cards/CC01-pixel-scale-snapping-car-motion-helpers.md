[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CC01 Pixel scale, snapping, car motion helpers

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CC01
Needs (already merged into `dev`): none
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
One tiny pure module that makes pixel art stay crisp on any screen (1280x720 desktop, retina iPhone) and gives scenes the drive-in/drive-out and idle-bob maths. Boot sets the device scale; everything else asks this module.

## Read first
- docs/art/CC.md (the plan: sheets, sizes, API names; read the 'Sprite contract' and 'API' sections)
- src/ui/canvas.js (applyLayout: logical 1280x720 is scaled by layout.scale * dpr; that product is the DEVICE SCALE: device pixels per logical pixel)

## Files you may change (and nothing else)
- `src/art/pixelscale.js`
- `tests/pixelscale.test.mjs`

## Steps
1. `src/art/pixelscale.js` (pure, no DOM). Module state `let ds = 1`. Export `setDeviceScale(v)` (store v when it is a finite number > 0, else 1) and `getDeviceScale()`. Export `pixelK(want)` = `Math.max(1, Math.round(want * ds))` (whole DEVICE pixels per sprite pixel), `pixelSize(want)` = `pixelK(want) / ds` (the logical size of one sprite pixel, so p * ds is always a whole number), `snapPx(v)` = `Math.round(v * ds) / ds`.
2. Motion helpers (times are SECONDS). `easeOutCubic(u)` = 1-(1-u)^3 and `easeInCubic(u)` = u^3, both with u clamped to 0..1. `driveIn(elapsed, dur, dist)` returns `snapPx(-dist * (1 - easeOutCubic(elapsed / dur)))` (starts at -dist, ends at exactly 0 when elapsed >= dur). `driveOut(elapsed, dur, dist)` returns `snapPx(dist * easeInCubic(elapsed / dur))`. `idleBob(t, p)` returns `0` when `Math.floor(t * 2.2) % 2 === 0` else `-p` (the car idles one sprite pixel up every 0.45 s; p is the pixel size).
3. `makeTracker()` returns `{update(key, t)}`: remembers the last key and the time it first appeared; `update` returns `t - start` (seconds since the key changed; 0 on the first call and whenever key differs from the last key). Scenes use it so a car drives in whenever the selection changes.
4. `tests/pixelscale.test.mjs` (jsc -m, tests/harness.js `test, eq, ok, near, done`): with ds=1 `pixelSize(2)===2`, `snapPx(10.4)===10`; ds=2: `pixelSize(2)===2`, `snapPx(10.3)===10.5`; ds=1.6375 (an iPhone 15 Pro: 0.5458 * 3): `pixelK(2)===3`, `near(pixelSize(2), 3/1.6375, 1e-9)`, and `pixelSize(2)*1.6375` is within 1e-9 of an integer; ds=0.4: `pixelK(2)===1` (never below 1). `setDeviceScale(0)` and `setDeviceScale(NaN)` fall back to 1. driveIn: `driveIn(0,0.7,600)===-600`, `driveIn(0.7,0.7,600)===0`, `driveIn(5,0.7,600)===0`, and the values at elapsed 0.1, 0.3, 0.5 strictly increase. driveOut(0,..)===0, driveOut(0.7,0.7,600)===600. idleBob(0,2)===0, idleBob(0.5,2)===-2, idleBob(0.95,2)===0. Tracker: update('a',5)===0, update('a',5.5)===0.5, update('b',6)===0, update('b',6.25)===0.25. Reset ds to 1 at the end of the test file.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep pixelscale` shows PASS.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CC01: Pixel scale, snapping, car motion helpers`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
