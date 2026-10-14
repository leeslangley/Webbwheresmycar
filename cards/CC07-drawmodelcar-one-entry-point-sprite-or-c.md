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
`drawModelCar(ctx, modelId, x, y, scale, opts)`: draws the classic-car sprite for a catalogue model (side view by default, paint and wear, crisp, snapped to device pixels, standing on its ground anchor) and falls back to the code-drawn `drawCar` while sprites are missing, at the SAME on-screen size. Every scene calls only this. Also a test helper so scene tests can fake sprites.

## Read first
- docs/art/CARS_ALIGN.md (THE sprite contract: views, densities, file names, manifest v2, game mask; it wins over any other text) and docs/art/CC.md (API names and background; its 'Sprite contract' section is superseded)
- src/art/cardraw.js (drawCar, carBounds), src/art/pixelscale.js (CC01), src/art/carvariants.js (CC05), src/art/carfx.js (CC06), src/art/sprite_paint.js (wearState), src/data/cars.js (modelOf), src/data/paint.js (paintOf)

## Files you may change (and nothing else)
- `src/art/modelcar.js`
- `tests/modelcar.test.mjs`
- `tests/fakecarart.js`

## Steps
1. `src/art/modelcar.js`. State set by `configureCarArt({sprites, variants})` (`configureCarArt(null)` clears it). Export `LENGTH_M = {micro:3.1, saloon:4.4, beetle:4.0, hatch:3.8, roadster:3.9, coupe:4.4, longnose:4.5, wedge:4.2, gullwing:4.5, tourer:5.0, limo:5.6, boxy:4.1, trike:3.3}` (fallback lengths) and `PX_PER_M_L = 48`. Keys: `opts.view` 's' (default, side view, key = modelId), 'q' (3/4 front, extra, key = modelId + '_q'), 'f' (face, key = modelId + '_f'); the mini key `modelId + '_m'` is the later fall-back of 's', 'q' and 'f' (the only key when `opts.sheet === 'S'`). `measureModelCar(modelId, scale, opts)` returns `{kind:'sprite'|'code', key, w, h, p}` without drawing. `k0 = pixelK(scale)`; candidates: the first key for `k` from `k0` down to `max(1, Math.ceil(k0*0.75))`, later keys for `k` from `k0` down to 1; a candidate needs `sprites.has(key)`, `p = k / getDeviceScale()`, `w = size.w * p`, `h = size.h * p`; with `opts.slot = {w,h}` take the FIRST candidate that fits, else the first available, else the last. No candidate: kind 'code'.
2. `drawModelCar`: `scale` is the wanted SPRITE PIXEL size in logical px (hero 2, thumbnails 1). Opts: `paint` hex, `cond` 0-10 (default 10), `t`, `flip`, `shadow` (default true), `reflect`, `shine`, `bob`, `fault`, `slot`, `view`, `sheet`. Sprite path: `state = wearState(cond)`; `v = variants.get(key, opts.paint, state)`; `m = sprites.meta(key)` (anchor `m.ax`, `m.ay`, sprite pixels); `gx = snapPx(x)`, `gy = snapPx(y)`; `left = gx - m.ax*p`, `top = gy - m.ay*p + (opts.bob ? idleBob(t, p) : 0)`. Order: shadow (`sprites.shadowImage(key)` drawn at `left, top, w, h`, else `drawContactShadow(ctx, gx, gy, w, p)`); `drawReflection` if asked; the car (save; `imageSmoothingEnabled = false`; `drawImage(v.img, left, top, w, h)`, with `flip`: `translate(gx, gy); scale(-1, 1)` and draw at `(-m.ax*p, top - gy, w, h)`; restore); `drawShine` (layer `variants.light(key)`); `drawSteam` when `opts.fault`; `drawExhaust` when `state === 3`. Return `{kind:'sprite', x:gx, y:gy, left, top, w, h, p, key, wear:state}`.
3. Code fallback (no sprite for any key, or `variants` unset): `arch = modelOf(modelId).archetype`; `W = LENGTH_M[arch] * PX_PER_M_L * pixelSize(scale)`, capped at `opts.slot.w`; `s = W / carBounds(arch, 1).w`; `drawCar(ctx, arch, x, y, s, {body: opts.paint || paintOf(modelId), cond, t})`; return `{kind:'code', x, y, w: W, h: carBounds(arch, s).h, p: pixelSize(scale)}`. Unknown modelId: throw `Error('unknown model ' + modelId)`.
4. `tests/fakecarart.js` (NOT a test file): `installFakeCarArt(opts)`, `opts = {L:{w:200,h:70}, S:{w:90,h:30}, F:{w:70,h:56}, missing:[], shadow:false}`: calls `configureCarArt` with a fake `sprites` (`has(key)` false for keys in `missing`; `size(key)` = S for keys ending `_m`, F for `_f`, else L; `meta(key)` = `{paint:'#c8102e', ax: Math.round(w/2), ay: h}`; `shadowImage(key)` = `{id:'shadow|' + key}` when `opts.shadow`, else null) and a fake `variants` (`get(key, paint, wear)` returns `{img: {id: key + '|' + paint + '|' + wear, width: w, height: h}, w, h}`; `light(key)` returns `{id: 'light|' + key}`); `uninstallFakeCarArt()` calls `configureCarArt(null)`. `tests/modelcar.test.mjs` (ds=1): `drawModelCar(ctx, 't1_chimp', 640, 400, 2, {cond: 9})` makes one `drawImage`, image id `t1_chimp|undefined|0`, args `(img, 440, 260, 400, 140)`, and two `ellipse` calls (contact shadow); with `shadow:true` in the fake there are two `drawImage` calls, the first with id `shadow|t1_chimp` and the same rect, and no `ellipse`; cond 3 gives `|2` in the id; `paint:'#1E4D2B'` is in the id; `imageSmoothingEnabled` is set false; `view:'q'` / `view:'f'` give ids starting `t1_chimp_q|` / `t1_chimp_f|`; slot `{w:300,h:200}`: L at k=2 is 400 wide, so the mini sheet is used (id starts `t1_chimp_m|`, width 180); `missing:['t1_chimp_f']` with `view:'f'` gives `t1_chimp_m|`; ds=1.6375: k0=3, width `200 * 3/1.6375` and `left * 1.6375` an integer within 1e-6; all keys missing or art uninstalled: no `drawImage`, kind `code`, `arc` calls, `result.w` within 1 px of `LENGTH_M.micro * 48 * 2` (t1_chimp is a `micro`); `bob:true` moves the car's `drawImage` y by exactly p between t=0 and t=0.5; `flip:true` calls `scale(-1, 1)` and draws at `(img, -100, -140, 400, 140)`; an unknown id throws. Reset ds to 1 at the end.

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
