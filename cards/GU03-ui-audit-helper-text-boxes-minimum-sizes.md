[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GU03 UI audit helper: text boxes, minimum sizes, overlaps

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GU03
Needs (already merged into `dev`): GU01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
A TEST helper (not game code) that replays a fakectx call log and reports every text box with its size, so tests can assert numerically: no text below the phone-safe minimum, no text off the canvas, no two texts overlapping. This is how Lee's complaints (overlapping and clipped text) become failing tests.

## Read first
- src/ui/tokens.js (card GU01: `COLOR`, `SPACE`, `ZONES`, `TYPE`, `FLOOR`, `MOTION`, `EASE`, `lerp`, `clamp01`)
- tests/fakectx.js (recording fake canvas: `ctx.calls` is a list of [method, args]; property sets are recorded as `set:<prop>`; `measureText(s).width` is `s.length * 0.6 * <px size in ctx.font>`; helpers `makeCtx, texts, count, lastSet, anySet, reset`) and tests/harness.js (`test, eq, ok, throws, done`; end every test file with `done();`)
- tests/scene_tvshop_draw.test.mjs (how a scene is drawn against a fake ctx)

## Files you may change (and nothing else)
- `tests/uiaudit.js`
- `tests/uiaudit.test.mjs`

## Steps
1. `tests/uiaudit.js` (plain ES module; imports `FLOOR` from '../src/ui/tokens.js'). Export `replayTexts(ctx)` -> array of entries {text, x0, y0, x1, y1, px, kind, align, baseline, transformed}. Walk `ctx.calls` in order keeping the current font, textAlign, textBaseline (defaults '10px sans-serif', 'left', 'alphabetic'), a translate offset (tx,ty) and a save/restore stack of all of those. `set:font` etc update state; `save` pushes, `restore` pops; `translate(dx,dy)` adds to the offset; `scale`, `rotate`, `transform`, `setTransform` set a flag `transformed` true until the matching restore. On `fillText`/`strokeText` (text, x, y): px = first number before 'px' in the font string; kind = 'title' when the font contains 'Press Start 2P', 'body' when it contains 'VT323', else 'other'; w = text.length*0.6*px (the fakectx rule); h = px; x0 by align (left: x; center: x - w/2; right: x - w); y0 by baseline (top: y; middle: y - h/2; bottom: y - h; alphabetic or anything else: y - 0.8*h); add the translate offset; x1 = x0+w, y1 = y0+h.
2. Export `auditCtx(ctx, opts)` with opts {w:1280, h:720, ignoreShadowOffset:4}: entries = replayTexts(ctx) without the `transformed` ones; return {entries, belowFloor, offCanvas, overlaps}. belowFloor = entries whose kind is 'title' or 'body' and px < FLOOR[kind]. offCanvas = entries with x0 < 0 or y0 < 0 or x1 > w or y1 > h. overlaps = array of [a, b] entry pairs (a before b in call order) whose boxes intersect with intersection area > 4 px^2, EXCEPT pairs with the identical text string whose x0 and y0 each differ by <= ignoreShadowOffset (a drop shadow or a 4-way outline, not an overlap). Also export `rectsOverlap(a, b)` for {x,y,w,h} rectangles (true when the intersection area > 0) and `describe(entry)` -> 'text@x0,y0 px' for readable failure messages.
3. `tests/uiaudit.test.mjs`: build ctx with makeCtx; set `ctx.font = '16px "Press Start 2P", monospace'`, `ctx.textBaseline = 'top'`, `ctx.fillText('ABCD', 10, 20)` and assert one entry with px 16, kind 'title', w 38.4 (4*0.6*16), x0 10, y0 20, x1 48.4, y1 36; center align at x 100 gives x0 = 100 - w/2; baseline 'middle' at y 50 gives y0 = 50 - px/2; font '14px VT323, monospace' is below the body floor (22) and appears in belowFloor, '22px VT323, monospace' does not; a text at x 1270 with w > 10 is in offCanvas; two different strings 8px apart vertically at the same x overlap (overlaps.length 1) while the same string drawn twice with a (+2,+2) offset does not, and the same string drawn at (x-2,y) and (x+2,y) (a 4px outline spread) does not either; a translate(100,0) before a text at x 10 gives x0 110; text drawn between `scale` and the matching `restore` is excluded from entries; rectsOverlap({x:0,y:0,w:10,h:10},{x:10,y:0,w:5,h:5}) is false and with x:9 is true.

## Acceptance (all must pass; exact commands)
- `make test 2>&1 | grep 'PASS tests/uiaudit.test.mjs'` prints one line.
- `grep -c 'export function' tests/uiaudit.js` prints 4 or more.
- No existing file is edited, so every existing test stays green.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Game code under src/. This card adds only test files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GU03: UI audit helper: text boxes, minimum sizes, overlaps`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
