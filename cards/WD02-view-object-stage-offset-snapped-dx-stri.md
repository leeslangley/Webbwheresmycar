[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash WD02 View object: stage offset, snapped dx, strip bounds, safe insets holder

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: WD02
Needs (already merged into `dev`): WD01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
One tiny pure module that builds the `app.view` object scenes and the GU, GE and CC components read: where the stage sits in the canvas (stageX), the device-pixel-snapped translate to apply (dx), the strip bounds in stage coordinates (left, right), whether the canvas is wider than the stage (wide) and the stage-relative safe insets. ORDER: after WD01; before WD04, WD05, WD06 which import it.

## Read first
- docs/art/WD.md (the decision: logical canvas of fixed height 720 and variable width 1280..1568, a 1280x720 STAGE in the middle that holds all controls and text, strips either side that only show background art)
- src/ui/canvas.js (as changed by WD01: `fitLayout`, `STAGE_W`, `LOGICAL_H`)
- tests/fakectx.js (recording fake canvas: `ctx.calls` is a list of [method, args]; property sets are recorded as `set:<prop>`; `measureText(s).width` is `s.length * 0.6 * <px size in ctx.font>`; helpers `makeCtx, texts, count, lastSet, anySet, reset`) and tests/harness.js (`test, eq, ok, near, throws, done`; end every test file with `done();`)

## Files you may change (and nothing else)
- `src/ui/view.js`
- `tests/view.test.mjs`

## Steps
1. Create `src/ui/view.js` with exactly this code (pure, no DOM, no Date):
```js
import { STAGE_W, LOGICAL_H } from './canvas.js';

export function defaultView() {
	return {
		fullW: STAGE_W, fullH: LOGICAL_H, stageX: 0, stageW: STAGE_W, dx: 0, left: 0, right: STAGE_W,
		scale: 1, dpr: 1, ds: 1, wide: false, safe: { top: 0, right: 0, bottom: 0, left: 0 },
	};
}

// makeView(layout, dpr, insets): layout from fitLayout; insets = stage-relative safe insets or null.
// dx is stageX snapped to a whole number of DEVICE pixels, so snapped sprites stay crisp on the stage.
export function makeView(layout, dpr, insets) {
	const d = typeof dpr === 'number' && dpr > 0 ? dpr : 1;
	const ds = layout.scale * d;
	const ins = insets || {};
	return {
		fullW: layout.fullW, fullH: layout.fullH, stageX: layout.stageX, stageW: layout.stageW,
		dx: Math.round(layout.stageX * ds) / ds, left: 0 - layout.stageX, right: layout.stageW + layout.stageX,
		scale: layout.scale, dpr: d, ds: ds, wide: layout.stageX > 0,
		safe: { top: ins.top || 0, right: ins.right || 0, bottom: ins.bottom || 0, left: ins.left || 0 },
	};
}

// setView(target, v): copy v into target IN PLACE (target.safe too) so every holder of the object sees it.
export function setView(target, v) {
	const safe = target.safe || (target.safe = { top: 0, right: 0, bottom: 0, left: 0 });
	for (const k in v) {
		if (k !== 'safe') {
			target[k] = v[k];
		}
	}
	safe.top = v.safe.top;
	safe.right = v.safe.right;
	safe.bottom = v.safe.bottom;
	safe.left = v.safe.left;
	return target;
}

// The whole canvas as a rect in stage coordinates.
export function fullRect(view) {
	return { x: view.left, y: 0, w: view.fullW, h: view.fullH };
}

export function inStage(x) {
	return x >= 0 && x <= STAGE_W;
}
```
2. Say in a comment above `makeView` why `dx` is snapped: sprites are snapped to whole device pixels (src/art/pixelscale.js, `snapPx`); translating the stage by a fractional device pixel would blur every sprite. `ds` is device pixels per logical pixel (scale * dpr, the same product boot gives `setDeviceScale`).
3. `tests/view.test.mjs` (import `fitLayout` from '../src/ui/canvas.js'): `defaultView()` is {fullW 1280, fullH 720, stageX 0, stageW 1280, dx 0, left 0, right 1280, scale 1, dpr 1, ds 1, wide false, safe all 0}; two calls return different objects (and different `safe` objects). THREE ASPECTS: 16:9 `makeView(fitLayout(1280,720), 1, null)` deep-equals `defaultView()`; 4:3 `makeView(fitLayout(1024,768), 2, null)`: fullW 1280, wide false, dx 0, left 0, right 1280, ds 1.6 (near 1e-9); 19.5:9 `makeView(fitLayout(1560,720), 1, null)`: fullW 1560, stageX 140, dx 140, left -140, right 1420, wide true. Phone `makeView(fitLayout(852,393), 3, null)`: fullW 1564, stageX 142, left -142, right 1422, wide true, ds near 1.6375 (1e-9), dx near 142.2900763 (1e-6) and `Math.abs(dx * ds - 233) < 1e-9` (a whole number of device pixels). A missing, zero or NaN dpr counts as 1 (`makeView(fitLayout(1280,720), 0, null).dpr === 1`). insets {top:1,right:2,bottom:38.5,left:3} are copied (the result's `safe` is a new object with those numbers; later changes to the input do not leak in); missing keys are 0.
4. `setView` tests: `const app = {view: defaultView()}; const s = app.view.safe; const r = setView(app.view, makeView(fitLayout(1560,720), 1, {bottom: 38.4, left: 3}));` then `r === app.view`, `app.view.safe === s`, `s.bottom === 38.4`, `s.left === 3`, `s.top === 0`, `app.view.fullW === 1560`, `app.view.wide === true`; then `setView(app.view, makeView(fitLayout(1280,720), 1, null))` gives `wide === false`, `fullW === 1280`, `s.bottom === 0` and still `app.view.safe === s`. `fullRect(makeView(fitLayout(1560,720),1,null))` deep-equals {x:-140,y:0,w:1560,h:720}. `inStage(0)` and `inStage(1280)` are true; `inStage(-1)` and `inStage(1281)` are false. Pointer link: with `l = fitLayout(1560,720)` and `v = makeView(l,1,null)`, `toLogical(l, 0, 360).x === v.left` and `toLogical(l, 1560, 360).x === v.right` (import toLogical).

## Acceptance (all must pass; exact commands)
- `make test 2>&1 | grep 'PASS tests/view.test.mjs'` prints one line.
- `grep -c 'dx: Math.round' src/ui/view.js` prints 1.
- `make test 2>&1 | grep -c '^FAIL'` prints 0.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Every existing file; do not wire the view into createApp or boot (WD05, WD06).

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `WD02: View object: stage offset, snapped dx, strip bounds, safe insets holder`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
