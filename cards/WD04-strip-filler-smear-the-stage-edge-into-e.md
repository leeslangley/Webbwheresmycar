[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash WD04 Strip filler: smear the stage edge into empty strips, then ink underlay

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: WD04
Needs (already merged into `dev`): WD02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The cheap default that makes EVERY scene fill the wide screen without touching its code: after a frame is drawn, the still-empty strips beside the stage are filled by stretching the stage's outermost pixel column outwards (bands, gradients, HUD strip and floor/wall bars just continue), then anything still empty gets the ink colour. 'destination-over' compositing never overwrites pixels a scene or a wide room plate already painted. TERMS: the STAGE is the 1280x720 area every scene lays out in (x 0..1280). The CANVAS is `view.fullW` x 720 (fullW 1280..1568). The two STRIPS are the canvas parts left of the stage (stage x < 0) and right of it (stage x > 1280); scenes draw in stage coordinates and the app translates by `view.dx`. ORDER: after WD02; WD05 calls it.

## Read first
- docs/art/WD.md (the decision: logical canvas of fixed height 720 and variable width 1280..1568, a 1280x720 STAGE in the middle that holds all controls and text, strips either side that only show background art)
- src/ui/view.js (WD02: `makeView`, `defaultView`; fields dx, ds, wide, fullW, fullH, stageW)
- tests/fakectx.js (recording fake canvas: `ctx.calls` is a list of [method, args]; property sets are recorded as `set:<prop>`; `measureText(s).width` is `s.length * 0.6 * <px size in ctx.font>`; helpers `makeCtx, texts, count, lastSet, anySet, reset`) and tests/harness.js (`test, eq, ok, near, throws, done`; end every test file with `done();`)

## Files you may change (and nothing else)
- `src/ui/smear.js`
- `tests/smear.test.mjs`

## Steps
1. Create `src/ui/smear.js` with exactly this code (it touches only the ctx and the canvas object passed in):
```js
// smearStrips(ctx, view, canvas): fills ONLY the still-empty (transparent) pixels of the two strips by stretching
// the stage's outermost pixel column outwards ('destination-over' never overwrites anything already drawn, so a
// scene that painted real art into the strips keeps it). Does nothing (returns false) on a 1280 canvas or when
// `canvas` has no numeric width and height (tests pass a plain object {width, height}).
export function smearStrips(ctx, view, canvas) {
	const cv = canvas || null;
	if (!view.wide || !cv || typeof cv.width !== 'number' || typeof cv.height !== 'number') {
		return false;
	}
	const ds = view.ds;
	const leftDev = Math.round(view.dx * ds);
	const rightDev = Math.round((view.dx + view.stageW) * ds);
	const colW = Math.max(1, Math.round(ds));
	ctx.save();
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.globalCompositeOperation = 'destination-over';
	ctx.imageSmoothingEnabled = false;
	if (leftDev > 0) {
		ctx.drawImage(cv, leftDev, 0, colW, cv.height, 0, 0, leftDev, cv.height);
	}
	if (cv.width - rightDev > 0) {
		ctx.drawImage(cv, rightDev - colW, 0, colW, cv.height, rightDev, 0, cv.width - rightDev, cv.height);
	}
	ctx.restore();
	return true;
}

// underlay(ctx, view, color): paints `color` behind everything, over the whole canvas, in logical coordinates.
export function underlay(ctx, view, color) {
	ctx.save();
	ctx.setTransform(view.ds, 0, 0, view.ds, 0, 0);
	ctx.globalCompositeOperation = 'destination-over';
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, view.fullW, view.fullH);
	ctx.restore();
}

// finishStrips(ctx, view, color, canvas): smear then underlay; call it at base transform after the scenes are drawn.
export function finishStrips(ctx, view, color, canvas) {
	if (!view.wide) {
		return false;
	}
	smearStrips(ctx, view, canvas);
	underlay(ctx, view, color);
	return true;
}
```
2. `tests/smear.test.mjs` (imports makeView from '../src/ui/view.js', fitLayout from '../src/ui/canvas.js', defaultView; fakectx). Default 16:9 view: `smearStrips(ctx, defaultView(), {width:1280,height:720})` is false and `ctx.calls.length` is 0; `finishStrips(...)` is false with 0 calls. Wide view without a usable canvas: `smearStrips(ctx, v, undefined)` and `smearStrips(ctx, v, {})` are false and make no calls.
3. THREE ASPECTS. (1) 19.5:9 desktop-sized: v = makeView(fitLayout(1560,720),1,null), canvas {width:1560,height:720}: smearStrips is true and its calls are exactly, in order: save; setTransform [1,0,0,1,0,0]; set:globalCompositeOperation 'destination-over'; set:imageSmoothingEnabled false; drawImage [canvas,140,0,1,720,0,0,140,720]; drawImage [canvas,1419,0,1,720,1420,0,140,720]; restore. (2) Phone: v = makeView(fitLayout(852,393),3,null), canvas {width:2561,height:1179}: the two drawImage calls are [canvas,233,0,2,1179,0,0,233,1179] and [canvas,2327,0,2,1179,2329,0,232,1179]. (3) 4:3: makeView(fitLayout(1024,768),2,null) is not wide: false, no calls.
4. `finishStrips(ctx, v, '#14102A', canvas)` for case (1): returns true; after the restore of the smear there is a second save, `setTransform [1,0,0,1,0,0]` (ds is 1; assert all six args with near 1e-9), `set:globalCompositeOperation` 'destination-over', `set:fillStyle` '#14102A', `fillRect [0,0,1560,720]`, restore; total save count equals restore count (2 each). For the phone view the underlay `fillRect` is [0,0,1564,720] and its setTransform args are ds (near 1.6375) on the diagonal. A canvas whose width equals the stage's right edge (e.g. {width:1420,height:720} with the 1560 view) gets only the left drawImage.

## Acceptance (all must pass; exact commands)
- `make test 2>&1 | grep 'PASS tests/smear.test.mjs'` prints one line.
- `grep -c destination-over src/ui/smear.js` prints 3 (one comment, two settings).
- `make test 2>&1 | grep -c '^FAIL'` prints 0.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Every existing file; no scene or app wiring (WD05).

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `WD04: Strip filler: smear the stage edge into empty strips, then ink underlay`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
