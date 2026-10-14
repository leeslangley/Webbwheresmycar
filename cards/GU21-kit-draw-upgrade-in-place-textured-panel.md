[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GU21 kit_draw upgrade in place: textured panel, chunky button, animated-look bar, label outline

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GU21
Needs (already merged into `dev`): GU02, GU05, GU06, GU07
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Every scene gets the new look at once: `panel`, `button` and `bar` keep their names, arguments and the exact call patterns the old tests pin, but gain grain, highlights, the chunky pressed/hover button and the segmented bar. Also add an optional text outline and re-export the new helpers so scenes import from one place.

## Read first
- docs/art/GU.md (the plan: palette, type scale, spacing grid, motion timings, zones) and docs/art/RSAMH_STYLE.md (the look we echo)
- src/ui/kit_draw.js and tests/kit_draw.test.mjs (READ EVERY TEST: they pin behaviour that must stay)
- src/ui/panels2.js (GU05: grain, COLOR), src/ui/button2.js (GU06: drawButton2), src/ui/bars.js (GU07: drawBar2)
- tests/fakectx.js (recording fake canvas: `ctx.calls` is a list of [method, args]; property sets are recorded as `set:<prop>`; `measureText(s).width` is `s.length * 0.6 * <px size in ctx.font>`; helpers `makeCtx, texts, count, lastSet, anySet, reset`) and tests/harness.js (`test, eq, ok, throws, done`; end every test file with `done();`)

## Files you may change (and nothing else)
- `src/ui/kit_draw.js`
- `tests/kit_draw_v2.test.mjs`

## Steps
1. Edit `src/ui/kit_draw.js` only by ADDING and by these three exact changes. (a) `panel(ctx,x,y,w,h,opts)`: keep the existing rounded path, shadow, fill and border strokes exactly as they are (same fill/stroke counts, strokeStyle PALETTE.ink last); AFTER the stroke add, only when opts.grain !== false and bw > 0: fillStyle 'rgba(255,255,255,0.30)', fillRect(x + bw, y + bw, w - 2*bw, 2) (top highlight) and `grain(ctx, x+bw, y+bw, w-2*bw, h-2*bw, 'rgba(20,16,42,0.05)', 1/900, (x*31 + y*17) & 0xffff)` (import grain from './panels2.js'); these are fillRects, so `fill` counts do not change. (b) `button(ctx,b)`: replace the body by `drawButton2(ctx, b, {hover: b.hover === true, pressed: b.pressed === true})` (import from './button2.js'); keep the doc comment accurate. (c) `bar(...)`: replace the body by `drawBar2(ctx, x, y, w, h, value, max, color)` (import from './bars.js'); the call fillRect(x+2, y+2, (w-4)*frac, h-4) must still be produced.
2. ADD to `label`: opts.outline (default false): when true, before the normal draw, fillStyle PALETTE.ink and fillText at the four offsets (x-2,y), (x+2,y), (x,y-2), (x,y+2) (drawn after the shadow, before the fill). Do not change the label's other behaviour or return value. At the bottom of the file add re-exports (no new imports of kit_draw into those modules, to avoid cycles): `export { drawIcon, ICON_NAMES } from './icons.js'; export { chunkyPanel, paperPanel, woodPanel, enamelSign } from './panels2.js'; export { fitOne, fitBlock, drawFitted, ellipsize, fitInRect } from './textfit.js'; export { drawButton2 } from './button2.js'; export { drawBar2, drawStatBar } from './bars.js';`.
3. Run `make test` BEFORE writing new tests: every existing test must still pass; if a scene test fails because it counts `fillRect` calls exactly, fix the SCENE TEST's expectation only when the count is a pure count of calls (not a position) and say so in your summary, otherwise change the card's code so the old test passes. `tests/kit_draw_v2.test.mjs`: panel default makes the same `fill` count as before (1 shadow + 1 body = 2) and `stroke` count 1, plus at least 1 fillRect with fillStyle 'rgba(255,255,255,0.30)' of height 2 at [x+4, y+4, w-8, 2]; with {grain:false} no fillRect at all; the grain fillRect count equals Math.floor((w-8)*(h-8)/900) for panel(ctx,0,0,100,50); button 'GO' pressed:true draws its label 3px lower than the same button unpressed; button hot still sets strokeStyle PALETTE.lamp; disabled still uses PALETTE.midgrey and PALETTE.darkgrey; bar(ctx,10,10,100,20,5,10,'#f00') still contains fillRect [12,12,48,16]; label with outline:true draws 4 extra fillText calls in PALETTE.ink before the main one (count fillText 5 vs 1); the re-exports exist (typeof drawIcon, chunkyPanel, fitOne, drawButton2, drawBar2 are 'function').

## Acceptance (all must pass; exact commands)
- `make test` shows EVERY existing test file still PASS (list them if any needed a count fix) and `make test 2>&1 | grep 'PASS tests/kit_draw_v2.test.mjs'` prints one line.
- `make test 2>&1 | grep -c '^FAIL'` prints 0.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Any scene file; theme.js; tests other than counts noted above. Existing tests that stay green by design: kit_draw, theme, scenes, scene_* and the title/office/tvshop draw tests.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GU21: kit_draw upgrade in place: textured panel, chunky button, animated-look bar, label outline`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
