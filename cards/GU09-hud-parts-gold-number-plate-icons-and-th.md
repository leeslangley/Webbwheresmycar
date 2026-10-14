[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GU09 HUD parts: Gold Number Plate icons and the green CASH bar

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GU09
Needs (already merged into `dev`): GU01, GU04, GU07
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The two goal pieces of the bottom HUD strip: four gold-disc plate icons (grey until won, with a glint when won) and the green CASH bar with the money figure over it.

## Read first
- docs/art/GU.md (the plan: palette, type scale, spacing grid, motion timings, zones) and docs/art/RSAMH_STYLE.md (the look we echo)
- src/ui/tokens.js (card GU01: `COLOR`, `SPACE`, `ZONES`, `TYPE`, `FLOOR`, `MOTION`, `EASE`, `lerp`, `clamp01`)
- src/ui/theme.js (exports `PALETTE`, `font(kind, px)`, `shade(hex, amount)`, `rgba(hex, alpha)`; do not edit it)
- tests/fakectx.js (recording fake canvas: `ctx.calls` is a list of [method, args]; property sets are recorded as `set:<prop>`; `measureText(s).width` is `s.length * 0.6 * <px size in ctx.font>`; helpers `makeCtx, texts, count, lastSet, anySet, reset`) and tests/harness.js (`test, eq, ok, throws, done`; end every test file with `done();`)
- src/core/state.js (PLATE_KEYS = ['fatcat','stable','household','hammer'])
- src/core/format.js (`money`)
- src/ui/icons.js (GU04: drawIcon, plate_* names)
- src/ui/bars.js (GU07: drawBar2)

## Files you may change (and nothing else)
- `src/ui/hudparts.js`
- `tests/hudparts.test.mjs`

## Steps
1. `src/ui/hudparts.js` imports PLATE_KEYS from '../core/state.js', money from '../core/format.js', drawIcon from './icons.js', drawBar2 from './bars.js', COLOR from './tokens.js', PALETTE from './theme.js'. Export `PLATE_SLOTS` = for i in 0..3: {key: PLATE_KEYS[i], x: 24 + i*64, y: 600, w: 48, h: 48} and `CASH_RECT` = {x:24, y:660, w:260, h:36}. Export `drawPlate(ctx, slot, won, t)`: drawIcon(ctx, 'plate_' + slot.key, slot.x, slot.y, 48, {grey: !won}); when won also draw a glint: gx = slot.x + 8 + Math.floor(((t * 0.5) % 1) * 28); fillStyle '#FFFFFF'; fillRect(gx, slot.y + 10, 2, 8); fillRect(gx - 3, slot.y + 13, 8, 2) (always exactly these two fillRects after the icon, so tests can count them).
2. Export `drawCashBar(ctx, rect, cash, goal = 100000)`: colour = cash >= 0 ? COLOR.cashGreen : PALETTE.bad; value = cash >= 0 ? cash : Math.min(-cash, 20000); max = cash >= 0 ? goal : 20000; drawBar2(ctx, rect.x, rect.y, rect.w, rect.h, value, max, colour); drawIcon(ctx, 'coin', rect.x + 6, rect.y + 6, 24); then the figure: text = money(cash); font '32px VT323, monospace' (kind body, 32px), textAlign 'center', textBaseline 'middle', cx = rect.x + rect.w/2 + 12, cy = rect.y + rect.h/2 + 1; first draw the text in COLOR.ink at the four offsets (cx-2,cy), (cx+2,cy), (cx,cy-2), (cx,cy+2) (an outline so it is readable on green or dark), then fillStyle '#FFFFFF' at (cx, cy). Return nothing.
3. `tests/hudparts.test.mjs`: PLATE_SLOTS has 4 entries with keys in PLATE_KEYS order, x 24,88,152,216, y 600, w 48, h 48; drawPlate(ctx, slot, false, 0) uses fillStyle '#B8B8B8' and never '#FFE27A', and makes no '#FFFFFF' fillRect; drawPlate(.., true, 0) uses '#FFE27A' and has exactly two '#FFFFFF' fillRects, the first [32,610,2,8] for slot 0 (gx = 24+8+0); gx moves with t: gx = 24+8+Math.floor(((t*0.5)%1)*28), so t=1 gives 46, t=0.5 gives 39 and t=2 gives 32 again (assert the first glint fillRect x for those t); all fillRects stay inside the 48x48 slot (glint included). drawCashBar(ctx, CASH_RECT, 20000): texts include '£20,000' (exactly 5 fillText calls: four outline + one white), the bar inner fill is [26,662,51.2,32] (256*0.2 = 51.2: assert via the fillRect whose y is 662 and h 32), fillStyle COLOR.cashGreen is used; cash -500 draws money '-£500', uses PALETTE.bad and the inner fill width 256*(500/20000) = 6.4; cash 250000 clamps the fill to the full width 256; a coin icon is drawn (some fillRect with fillStyle '#FFE27A' inside [30,54] x [666,690]).

## Acceptance (all must pass; exact commands)
- `make test 2>&1 | grep 'PASS tests/hudparts.test.mjs'` prints one line.
- No existing file is edited, so every existing test stays green.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- src/art/hud.js (the old top HUD stays until GU24 stops calling it).

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GU09: HUD parts: Gold Number Plate icons and the green CASH bar`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
