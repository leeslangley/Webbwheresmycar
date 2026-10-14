[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash WD03 Safe areas: CSS insets to stage-relative insets (replaces GU20)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: WD03
Needs (already merged into `dev`): WD01, W71b
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Replace the idea of card GU20 for the new canvas: read the iPhone notch and home-indicator insets from CSS `env(safe-area-inset-*)` and turn them into STAGE-relative logical insets. On a 19.5:9 phone the notch side lies inside the strip, so the stage gets inset 0 on left and right and only the home-indicator inset at the bottom. Also the physical-size helpers the text-size audit needs. ORDER: after WD01 and W71b (both edit index.html). Card GU20 was dropped (its maths assumed the old letterbox and its offX 76.67 test fails with the new fitLayout); GU23 now needs WD03 (see docs/art/WD.md).

## Read first
- docs/art/WD.md (the decision: logical canvas of fixed height 720 and variable width 1280..1568, a 1280x720 STAGE in the middle that holds all controls and text, strips either side that only show background art)
- src/ui/canvas.js (as changed by WD01: `fitLayout` -> {scale, offX, offY, viewW, viewH, fullW, fullH, stageX, stageW})
- index.html (already has viewport-fit=cover in the viewport meta)
- tests/fakectx.js (recording fake canvas: `ctx.calls` is a list of [method, args]; property sets are recorded as `set:<prop>`; `measureText(s).width` is `s.length * 0.6 * <px size in ctx.font>`; helpers `makeCtx, texts, count, lastSet, anySet, reset`) and tests/harness.js (`test, eq, ok, near, throws, done`; end every test file with `done();`)

## Files you may change (and nothing else)
- `src/ui/safearea.js`
- `index.html`
- `tests/safearea.test.mjs`

## Steps
1. Create `src/ui/safearea.js` with exactly this code:
```js
import { LOGICAL_H } from './canvas.js';

// viewInsets(layout, css): css = {top, right, bottom, left} in CSS px (missing, negative or NaN -> 0).
// Result is in STAGE logical px (how far inside the stage rectangle the unsafe zone reaches), so a notch that
// lies in the strips costs the stage nothing.
export function viewInsets(layout, css) {
	const c = css || {};
	const side = function (v) { return typeof v === 'number' && v > 0 ? v : 0; };
	const s = layout.scale;
	const fullL = Math.max(0, (side(c.left) - layout.offX) / s);
	const fullR = Math.max(0, (side(c.right) - layout.offX) / s); // the right bar equals the left bar
	return {
		top: Math.max(0, (side(c.top) - layout.offY) / s),
		bottom: Math.max(0, (side(c.bottom) - layout.offY) / s),
		left: Math.max(0, fullL - layout.stageX),
		right: Math.max(0, fullR - layout.stageX),
	};
}

export function safeRect(i) {
	return { x: i.left, y: i.top, w: 1280 - i.left - i.right, h: LOGICAL_H - i.top - i.bottom };
}

export function physicalPx(px, scale) {
	return px * scale;
}

export function minLogicalPx(cssMin, scale) {
	return Math.ceil(cssMin / scale);
}

// parseInset('59px') -> 59; '' , 'abc', negative -> 0.
export function parseInset(s) {
	const v = parseFloat(s);
	return v > 0 ? v : 0;
}

// readCssInsets(win, doc) -> {top, right, bottom, left} CSS px from the --sai-* custom properties (index.html).
// All zeros when getComputedStyle or documentElement is missing (tests, old browsers).
export function readCssInsets(win, doc) {
	const zero = { top: 0, right: 0, bottom: 0, left: 0 };
	if (!win || typeof win.getComputedStyle !== 'function' || !doc || !doc.documentElement) {
		return zero;
	}
	const cs = win.getComputedStyle(doc.documentElement);
	if (!cs || typeof cs.getPropertyValue !== 'function') {
		return zero;
	}
	return {
		top: parseInset(cs.getPropertyValue('--sai-t')), right: parseInset(cs.getPropertyValue('--sai-r')),
		bottom: parseInset(cs.getPropertyValue('--sai-b')), left: parseInset(cs.getPropertyValue('--sai-l')),
	};
}
```
2. `index.html`: inside the existing `<style>` add `:root { --sai-t: env(safe-area-inset-top, 0px); --sai-r: env(safe-area-inset-right, 0px); --sai-b: env(safe-area-inset-bottom, 0px); --sai-l: env(safe-area-inset-left, 0px); }` as the first rule. Change nothing else in the file.
3. `tests/safearea.test.mjs` (import fitLayout from '../src/ui/canvas.js'). `viewInsets`: phone 852x393 with css {top:0,right:59,bottom:21,left:59}: top 0, left 0, right 0 (the notch lies in the strip: 59 css px is 109.6 logical px from the canvas edge, the stage starts at 142) and bottom near 38.4733 (1e-3). Same window with css {left:200}: left near 225.954 (1e-3), right 0. 16:9 1280x720 with css {top:20,left:50}: top 20, left 50 (no strips, same as the old behaviour). 2560x1080 with css {left:50}: left 0 (the 104 css px bar covers it). 1024x768 with all css 0: all 0. Missing keys, negative numbers and NaN count as 0; `viewInsets(l, null)` is all 0. `safeRect({top:0,right:0,bottom:38.4733,left:0})` is {x:0,y:0,w:1280,h:681.5267} (near 1e-3). `physicalPx(22, 0.5458333)` near 12.0083 (1e-3); `minLogicalPx(12, 0.5458333)` is 22; `minLogicalPx(9, 0.5458333)` is 17.
4. `parseInset('59px')` is 59, `parseInset('')`, `parseInset('abc')`, `parseInset('-4px')` and `parseInset(undefined)` are 0. `readCssInsets`: with a fake `win = {getComputedStyle: () => ({getPropertyValue: (n) => ({'--sai-b':'21px','--sai-l':'59px','--sai-r':'59px'})[n] || ''})}` and `doc = {documentElement: {}}` it returns {top:0,right:59,bottom:21,left:59}; a win without getComputedStyle, a doc without documentElement, and a getComputedStyle that returns null each give all zeros.

## Acceptance (all must pass; exact commands)
- `make test 2>&1 | grep 'PASS tests/safearea.test.mjs'` prints one line.
- `grep -c 'safe-area-inset' index.html` prints 4.
- `make test 2>&1 | grep -c '^FAIL'` prints 0.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- src/boot.js (WD06 calls these functions).
- Any scene (they read `app.view.safe` in later cards).

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `WD03: Safe areas: CSS insets to stage-relative insets (replaces GU20)`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
