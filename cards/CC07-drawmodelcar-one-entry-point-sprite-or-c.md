[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CC07 drawModelCar: one entry point, sprite or code-drawn

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CC07
Needs (already merged into `dev`): CC01, CC05, CC06
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
`drawModelCar(ctx, modelId, x, y, scale, opts)`: draws the classic-car sprite for a catalogue model (right paint, right wear, crisp, snapped to device pixels) and falls back to the existing code-drawn `drawCar` while sprites are missing or failed, at the SAME on-screen size. Every scene will call only this. Also a test helper so scene tests can fake sprites.

## Read first
- docs/art/CC.md (the plan: sheets, sizes, API names; read the 'Sprite contract' and 'API' sections)
- src/art/cardraw.js (drawCar, carBounds), src/art/pixelscale.js (CC01), src/art/carvariants.js (CC05), src/art/carfx.js (CC06), src/art/sprite_paint.js (wearState), src/data/cars.js (modelOf: id, archetype), src/data/paint.js (paintOf)

## Files you may change (and nothing else)
- `src/art/modelcar.js`
- `tests/modelcar.test.mjs`
- `tests/fakecarart.js`

## Steps
1. `src/art/modelcar.js`. Module state set by `configureCarArt({sprites, variants})` (`configureCarArt(null)` clears it). Export `LENGTH_M = {micro:3.1, saloon:4.4, beetle:4.0, hatch:3.8, roadster:3.9, coupe:4.4, longnose:4.5, wedge:4.2, gullwing:4.5, tourer:5.0, limo:5.6, boxy:4.1, trike:3.3}` (fallback real-world lengths by archetype) and constants `PX_PER_M_L = 52`, `PX_PER_M_S = 24`. `measureModelCar(modelId, scale, opts)` returns `{kind:'sprite'|'code', key, w, h, p}` without drawing. Sheet choice: `k0 = pixelK(scale)`; candidates in order: sheet L (key = modelId) for `k = k0` down to `max(1, Math.ceil(k0*0.75))`, then sheet S (key = modelId + '_s') for `k = k0` down to 1; a candidate needs `sprites.has(key)`, `p = k / getDeviceScale()`, drawn `w = size.w * p`, `h = size.h * p`; with `opts.slot = {w,h}` pick the FIRST candidate whose w and h fit the slot, with no slot the first available; `opts.sheet` 'L' or 'S' restricts the list. When nothing fits, use the last available candidate. No candidate: kind 'code'.
2. `drawModelCar(ctx, modelId, x, y, scale, opts = {})`: `scale` is the wanted SPRITE PIXEL size in logical px (hero 2, thumbnails 1). Other opts: `paint` hex, `cond` 0-10 (default 10), `t` (default 0), `flip`, `shadow` (default true), `reflect`, `shine`, `bob`, `fault`, `slot`, `sheet`. Sprite path: `state = wearState(cond)`; `v = variants.get(key, opts.paint, state)`; `gx = snapPx(x)`, `gy = snapPx(y) + (opts.bob ? idleBob(t, p) : 0)`; call `drawContactShadow(ctx, gx, snapPx(y), w, p)` first; save; `imageSmoothingEnabled = false`; when flip: `translate(gx, gy); scale(-1, 1); drawImage(v.img, -w/2, -h, w, h)` else `drawImage(v.img, gx - w/2, gy - h, w, h)`; restore. Then optional `drawReflection` (drawn BEFORE the car so the car overlaps it), `drawShine` (layer = `variants.light(key)`), `drawSteam` when `opts.fault` at `(gx + (flip?-1:1)*w*0.3, gy - h*0.55)`, `drawExhaust` when `state === 3` at the tail. Returns `{kind:'sprite', x:gx, y:gy, w, h, p, key, wear:state}`.
3. Code fallback (no sprite for either sheet, or `variants` unset): `arch = modelOf(modelId).archetype`; wanted width `W = LENGTH_M[arch] * PX_PER_M_L * pixelSize(scale)`; if `opts.slot` and `W > slot.w` then `W = slot.w`; `s = W / carBounds(arch, 1).w`; `drawCar(ctx, arch, x, y, s, {body: opts.paint || paintOf(modelId), cond, t})`; return `{kind:'code', x, y, w: W, h: carBounds(arch, s).h, p: pixelSize(scale)}`. Unknown modelId: throw `Error('unknown model ' + modelId)` (modelOf throws).
4. `tests/fakecarart.js` (NOT a test file): `installFakeCarArt(opts)` with `opts = {L:{w:200,h:70}, S:{w:90,h:30}, missing:[]}` calls `configureCarArt` with a fake `sprites` (`has(key)` true unless the key is in `opts.missing`; `size(key)`; `meta(key)` returns `{paint:'#c8102e'}`) and a fake `variants` (`get(key, paint, wear)` returns `{img: {id: key + '|' + paint + '|' + wear, width: w, height: h}, w, h}`; `light(key)` returns `{id: 'light|' + key}`); returns `{calls}`. `uninstallFakeCarArt()` calls `configureCarArt(null)`. `tests/modelcar.test.mjs`: ds=1, fake art, `drawModelCar(ctx, 't1_chimp', 640, 400, 2, {cond: 9})` makes exactly one `drawImage` whose image id is `t1_chimp|undefined|0` with args `(img, 440, 260, 400, 140)`; cond 3 gives wear 2 in the id; `paint:'#1E4D2B'` appears in the id; `imageSmoothingEnabled` false was set; save and restore counts equal; slot `{w:300,h:200}`: L at k=2 is 400 wide and does not fit, so expect the S sheet at k=2 (image id starts `t1_chimp_s|`, drawn width 180); ds=1.6375: k0=3, drawn width `200 * 3/1.6375` and `x - w/2` times 1.6375 is an integer within 1e-6; `missing:['t1_chimp']` and `['t1_chimp_s']` -> no `drawImage` and the result kind is `code` with `arc` calls present and `result.w` within 1 px of `LENGTH_M.micro * 52 * 2` (t1_chimp is a `micro`); `uninstallFakeCarArt()` -> code path; `bob:true` moves the `drawImage` y by exactly p between t=0 and t=0.5; unknown id throws; `flip:true` calls `scale(-1, 1)`. Reset ds to 1 at the end.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep modelcar` shows PASS.
- `grep -c drawModelCar src/art/modelcar.js` prints at least 3 and `grep -n 'Math.random\|Date' src/art/modelcar.js` prints nothing.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CC07: drawModelCar: one entry point, sprite or code-drawn`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
