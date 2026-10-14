[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash WD01 Canvas layout: variable-width canvas, 1280 stage, pointer maps to stage

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: WD01
Needs (already merged into `dev`): W42
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Make the pure layout maths fill a tall phone screen: the logical canvas stays 720 high but is 1280 to 1568 wide (the window's aspect), a 1280x720 stage sits in the middle, and the pointer is converted to STAGE coordinates (negative x or above 1280 means a tap in a strip). 16:9 and 4:3 windows behave exactly as today (letterbox top and bottom). TERMS: the STAGE is the 1280x720 area every scene lays out in (x 0..1280). The CANVAS is `view.fullW` x 720 (fullW 1280..1568). The two STRIPS are the canvas parts left of the stage (stage x < 0) and right of it (stage x > 1280); scenes draw in stage coordinates and the app translates by `view.dx`. ORDER: after W42 (this card rewrites W42's canvas.js and tests/canvas.test.mjs). Cards that import canvas.js (GU20 is dropped, see docs/art/WD.md) keep working because LOGICAL_W, LOGICAL_H, fitLayout, toLogical, isPortrait and applyLayout keep their names.

## Read first
- docs/art/WD.md (the decision: logical canvas of fixed height 720 and variable width 1280..1568, a 1280x720 STAGE in the middle that holds all controls and text, strips either side that only show background art)
- src/ui/canvas.js (read all of it) and tests/canvas.test.mjs
- tests/fakectx.js (recording fake canvas: `ctx.calls` is a list of [method, args]; property sets are recorded as `set:<prop>`; `measureText(s).width` is `s.length * 0.6 * <px size in ctx.font>`; helpers `makeCtx, texts, count, lastSet, anySet, reset`) and tests/harness.js (`test, eq, ok, near, throws, done`; end every test file with `done();`)

## Files you may change (and nothing else)
- `src/ui/canvas.js`
- `tests/canvas.test.mjs`

## Steps
1. In `src/ui/canvas.js` replace the constants, `fitLayout` and `toLogical` (everything above `isPortrait`) by exactly this code, and keep the file header comment updated to say the canvas is 720 high and 1280..1568 wide. Keep `isPortrait` and `applyLayout` exactly as they are (applyLayout already uses fitLayout's scale, offX, offY, viewW, viewH, so the canvas element is now fullW*scale wide and `ctx.setTransform` is unchanged).
```js
export const LOGICAL_W = 1280;   // stage width: every scene LAYOUT is in these units (name kept so old imports still work)
export const LOGICAL_H = 720;
export const STAGE_W = 1280;
export const FULL_W_MAX = 1568;  // widest canvas: 19.5:9 phones; (1568 - 1280) / 2 = 144 px strip each side
export const BLEED_MAX = 144;
const SNAP_PX = 16;              // less than this much extra width is not worth a strip

function checkWin(winW, winH) {
	if (typeof winW !== 'number' || typeof winH !== 'number' || winW <= 0 || winH <= 0) {
		throw new RangeError('winW and winH must both be positive numbers, got ' + winW + 'x' + winH);
	}
}

// Canvas width in logical px: 1280 for 16:9 and narrower windows, else the window aspect at height 720
// rounded UP to a multiple of 4 (so the stage offset is an even number), at most 1568.
export function fullWidthFor(winW, winH) {
	checkWin(winW, winH);
	const raw = LOGICAL_H * winW / winH;
	if (raw < STAGE_W + SNAP_PX) {
		return STAGE_W;
	}
	return Math.min(FULL_W_MAX, 4 * Math.ceil(raw / 4 - 1e-9));
}

// fitLayout(winW, winH) -> {scale, offX, offY, viewW, viewH, fullW, fullH, stageX, stageW}.
// viewW x viewH is the whole canvas in CSS px. offX may be slightly negative (the canvas overhangs the
// window by a pixel or two, only strip art is cropped) or positive (thin bars when the window is wider than 1568:720).
export function fitLayout(winW, winH) {
	const fullW = fullWidthFor(winW, winH);
	const scale = fullW === STAGE_W ? Math.min(winW / STAGE_W, winH / LOGICAL_H) : winH / LOGICAL_H;
	const viewW = fullW * scale;
	const viewH = LOGICAL_H * scale;
	return {
		scale: scale, offX: (winW - viewW) / 2, offY: (winH - viewH) / 2, viewW: viewW, viewH: viewH,
		fullW: fullW, fullH: LOGICAL_H, stageX: (fullW - STAGE_W) / 2, stageW: STAGE_W,
	};
}

// toFull(layout, clientX, clientY) -> {x, y} in CANVAS coordinates (0..fullW), or null outside the canvas.
export function toFull(layout, clientX, clientY) {
	const x = (clientX - layout.offX) / layout.scale;
	const y = (clientY - layout.offY) / layout.scale;
	if (x < 0 || x > layout.fullW || y < 0 || y > LOGICAL_H) {
		return null;
	}
	return { x: x, y: y };
}

// toLogical(layout, clientX, clientY) -> {x, y} in STAGE coordinates (x is negative in the left strip and
// above 1280 in the right strip), or null outside the canvas (bars).
export function toLogical(layout, clientX, clientY) {
	const p = toFull(layout, clientX, clientY);
	return p === null ? null : { x: p.x - layout.stageX, y: p.y };
}
```
2. Why these numbers (write them in a short comment, do not change them): raw = 720 * winW / winH is the canvas width that fills the window at full height; under 1296 the window is 16:9 or narrower so the old fit is used; otherwise scale = winH/720 and fullW is rounded UP to a multiple of 4 (so stageX = (fullW - 1280)/2 is even, i.e. a whole number of 2 px art pixels) and capped at 1568 (iPhone 16 Pro 874x402 needs 1565.4; iPhone 15 Pro 852x393 needs 1560.9). Rounding up means the canvas overhangs the window by under 2 CSS px each side (offX slightly negative); only strip art is cropped.
3. `tests/canvas.test.mjs`: KEEP these existing tests unchanged: 'logical size is 1280x720', 'fitLayout exact fit 1280x720', 'fitLayout 2560x1440', 'fitLayout 1000x1000', 'fitLayout rejects zero and negative sizes', 'toLogical maps the centre of a letterboxed view to 640,360', 'toLogical maps corners of the game rectangle', 'isPortrait only when taller than wide', 'applyLayout 1280x720 dpr 2', 'applyLayout caps devicePixelRatio at 3', 'applyLayout defaults devicePixelRatio to 1', 'applyLayout rejects an invalid window'. REWRITE these four: (a) 'fitLayout 844x390 iPhone landscape': fullW 1560, stageX 140, stageW 1280, fullH 720, scale 390/720 (near 1e-9), viewW 845 (near 1e-6), viewH 390, offX -0.5 (near 1e-6), offY 0. (b) 'toLogical gives null for points in the letterbox bars': keep the 1000x1000 top bar (500,100) and bottom bar (500,900) null checks; replace the side checks by `fitLayout(2560,1080)` (scale 1.5, offX 104): `toLogical(l, 50, 500)` is null and `toLogical(l, 2457, 500)` is null. (c) 'applyLayout 844x390 dpr 3': canvas.width 2535, canvas.height 1170, style.left parseFloat near -0.5 (1e-6), style.top '0px', style.width parseFloat near 845 (1e-6), style.height '390px', one setTransform with args [1.625,0,0,1.625,0,0] (near 1e-9 each), dpr 3. (d) 'toLogical round-trips any in-view point': with fitLayout(844,390) the STAGE point (1024,300) is at client x = offX + (1024 + stageX) * scale and y = offY + 300 * scale (630 and 162.5); `toLogical` returns (1024,300) near 1e-9; also stage point (-100,300) and (1380,300) round-trip (both lie in the strips).
4. ADD these tests: `fullWidthFor` returns 1280 for (1280,720), (667,375), (1366,768), (1024,768), (1000,1000); 1316 for (1316,720); 1560 for (844,390); 1564 for (852,393); 1568 for (874,402), (956,440), (2560,1080), (1600,720); it throws RangeError for (0,100). `fitLayout(852,393)`: fullW 1564, stageX 142, scale 393/720, viewW near 853.6833 (1e-3), offX near -0.84167 (1e-3), offY near 0 (1e-6). `fitLayout(2560,1080)`: scale 1.5, viewW 2352, offX 104, offY 0, stageX 144. `fitLayout(1316,720)`: stageX 18, offX 0. `fitLayout(1024,768)` (4:3): fullW 1280, stageX 0, scale 0.8, offY 96. Property loop: for winH in [393, 402, 440, 720, 1080] and winW from 1300 to 2400 step 7: fullW is between 1280 and 1568, (fullW - 1280) % 4 === 0, offY >= -1e-6, and when 1280 < fullW < 1568 then viewW >= winW - 1e-6 and offX <= 1e-6 (the canvas always covers the window until the 1568 cap). `fitLayout(1560,720)`: toLogical(l,140,360) is {x:0,y:360}; toLogical(l,0,360) has x -140; toLogical(l,1560,720) is {x:1420,y:720}; toLogical(l,1561,10) is null; `toFull(l,140,360)` is {x:140,y:360}. `BLEED_MAX` is 144 and `FULL_W_MAX` is 1568 and `(FULL_W_MAX - STAGE_W) / 2 === BLEED_MAX`.

## Acceptance (all must pass; exact commands)
- `$JSC -m tests/canvas.test.mjs 2>&1 | tail -3` shows no FAIL line.
- `make test 2>&1 | grep 'PASS tests/canvas.test.mjs'` prints one line.
- `grep -c 'FULL_W_MAX = 1568' src/ui/canvas.js` prints 1.
- `make test 2>&1 | grep -c '^FAIL'` prints 0 (boot.test.mjs and every other existing test still pass: at 1280x720 nothing changes).
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- src/boot.js and every scene (WD06 and later cards wire it up).
- `isPortrait` and `applyLayout` bodies.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `WD01: Canvas layout: variable-width canvas, 1280 stage, pointer maps to stage`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
