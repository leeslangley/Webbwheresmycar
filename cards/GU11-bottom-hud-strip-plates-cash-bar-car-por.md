[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GU11 Bottom HUD strip: plates, cash bar, car portrait, calendar, chart panel

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GU11
Needs (already merged into `dev`): GU03, GU04, GU05, GU07, GU09, GU10
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The permanent bottom HUD strip (zone y 590..720) assembled from the parts: four plate icons and the CASH bar on the left, the selected-car portrait slot, the calendar sheet, and a small white chart panel with reputation, buzz and year-progress bars.

## Read first
- docs/art/GU.md (the plan: palette, type scale, spacing grid, motion timings, zones) and docs/art/RSAMH_STYLE.md (the look we echo)
- src/ui/tokens.js (card GU01: `COLOR`, `SPACE`, `ZONES`, `TYPE`, `FLOOR`, `MOTION`, `EASE`, `lerp`, `clamp01`)
- src/ui/theme.js (exports `PALETTE`, `font(kind, px)`, `shade(hex, amount)`, `rgba(hex, alpha)`; do not edit it)
- tests/fakectx.js (recording fake canvas: `ctx.calls` is a list of [method, args]; property sets are recorded as `set:<prop>`; `measureText(s).width` is `s.length * 0.6 * <px size in ctx.font>`; helpers `makeCtx, texts, count, lastSet, anySet, reset`) and tests/harness.js (`test, eq, ok, throws, done`; end every test file with `done();`)
- src/ui/hudparts.js (GU09)
- src/ui/calendarsheet.js (GU10)
- src/ui/bars.js (GU07)
- src/art/hud.js (the old top HUD: for the state field names `cash`, `reputation`, `buzz`, `day`, `plates`)

## Files you may change (and nothing else)
- `src/ui/hudstrip.js`
- `tests/hudstrip.test.mjs`

## Steps
1. `src/ui/hudstrip.js`. Export `HUD_RECTS` = {plates: PLATE_SLOTS (from hudparts), cash: CASH_RECT, portrait: {x:320,y:598,w:260,h:114}, calendar: {x:610,y:598,w:180,h:114}, chart: {x:820,y:598,w:440,h:114}}. Export `drawHudStrip(ctx, state, view, t)`; view = {cashShown (number, default state.cash), portrait (function(ctx, rect) or null), nowMs (0), dayChangedAt (undefined), prevDay (undefined)}. Order: (1) background fillStyle COLOR.hudBg fillRect(0, 590, 1280, 130); fillStyle COLOR.brass fillRect(0, 590, 1280, 4); fillStyle COLOR.brassDark fillRect(0, 594, 1280, 2). (2) the four plates: drawPlate(ctx, slot, state.plates && state.plates[slot.key] === true, t). (3) drawCashBar(ctx, CASH_RECT, view.cashShown !== undefined ? view.cashShown : state.cash). (4) portrait: c = chunkyPanel(ctx, p.x, p.y, p.w, p.h, {fill: COLOR.enamelNavy, shadow: 0}); then view.portrait ? view.portrait(ctx, c) : text 'NO CAR' in '28px VT323, monospace', fillStyle '#959595', center/middle at the centre of c. (5) calendar: day = state.day; when view.dayChangedAt is a number: p = clamp01((view.nowMs - view.dayChangedAt)/700), prev = view.prevDay !== undefined ? view.prevDay : Math.max(1, day-1); drawCalendarTear(ctx, cal.x, cal.y, cal.w, cal.h, prev, day, p); otherwise drawCalendarSheet. (6) chart panel: c = chunkyPanel(ctx, ch.x, ch.y, ch.w, ch.h, {fill: COLOR.chartWhite, shadow: 0}); three rows i=0..2 at row y = ch.y + 10 + i*30: icon (star, buzz, calendar) via drawIcon(ctx, name, ch.x+14, rowY-1, 24); drawBar2(ctx, ch.x+48, rowY, 280, 22, value, 100 (365 for the third), colour) with values state.reputation, state.buzz, state.day and colours PALETTE.good, COLOR.warn, COLOR.info; value text in '24px VT323, monospace', fillStyle COLOR.ink, textAlign 'right', baseline 'middle' at (ch.x+ch.w-14, rowY+11): String(Math.round(rep)), String(Math.round(buzz)), `${day}/365`.
2. `tests/hudstrip.test.mjs` with `startGame(3)` from src/sim/newgame.js as the state (cash 20000, reputation 40, buzz 0, day 1): drawHudStrip(ctx,state,{},0) texts include '£20,000', 'DAY 1/365', 'MON 01 JAN', 'NO CAR', '40', '0', '1/365'; the first fillRect is [0,590,1280,130] with fillStyle '#1B1735'; every fillRect, arc and text box lies inside [0,1280] x [590,720] (strokeRect and arc too; use tests/uiaudit.js from GU03 for text boxes: auditCtx(ctx) must give belowFloor.length 0, offCanvas.length 0 and overlaps.length 0); a portrait callback is called exactly once with a rect {x:327,y:605,w:246,h:100} (chunkyPanel content: 320+3+4, 598+3+4, 260-14, 114-14) and 'NO CAR' is then not drawn; with state.plates.fatcat = true the draw uses '#FFE27A' and without any won plate it does not; with state.day set to 2, dayChangedAt 1000 and nowMs 1350 (p 0.5) two calendar sheets are drawn (texts 'DAY 2/365' then 'DAY 1/365'); with dayChangedAt unset exactly one sheet; the HUD_RECTS rects do not overlap each other (cash vs plates: plate bottoms 648 < cash top 660) and all sit inside the hud zone.

## Acceptance (all must pass; exact commands)
- `make test 2>&1 | grep 'PASS tests/hudstrip.test.mjs'` prints one line.
- No existing file is edited, so every existing test stays green.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- src/art/hud.js and src/ui/scenes/office.js (GU24 switches the office over).

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GU11: Bottom HUD strip: plates, cash bar, car portrait, calendar, chart panel`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
