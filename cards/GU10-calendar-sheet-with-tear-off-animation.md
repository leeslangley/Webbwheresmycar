[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GU10 Calendar sheet with tear-off animation

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GU10
Needs (already merged into `dev`): GU01, GU05, GU07
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The torn-off wall-calendar sheet of the RSAMH HUD (weekday, date, big day number) and the animation where the old sheet is ripped off and flutters away revealing the next day.

## Read first
- docs/art/GU.md (the plan: palette, type scale, spacing grid, motion timings, zones) and docs/art/RSAMH_STYLE.md (the look we echo)
- src/ui/tokens.js (card GU01: `COLOR`, `SPACE`, `ZONES`, `TYPE`, `FLOOR`, `MOTION`, `EASE`, `lerp`, `clamp01`)
- src/ui/theme.js (exports `PALETTE`, `font(kind, px)`, `shade(hex, amount)`, `rgba(hex, alpha)`; do not edit it)
- tests/fakectx.js (recording fake canvas: `ctx.calls` is a list of [method, args]; property sets are recorded as `set:<prop>`; `measureText(s).width` is `s.length * 0.6 * <px size in ctx.font>`; helpers `makeCtx, texts, count, lastSet, anySet, reset`) and tests/harness.js (`test, eq, ok, throws, done`; end every test file with `done();`)
- src/core/clock.js (`dateOf(day)` returns {month, dayOfMonth, monthName})
- src/ui/panels2.js (GU05: chunkyPanel)

## Files you may change (and nothing else)
- `src/ui/calendarsheet.js`
- `tests/calendarsheet.test.mjs`

## Steps
1. `src/ui/calendarsheet.js` imports dateOf from '../core/clock.js', chunkyPanel from './panels2.js', COLOR/EASE/clamp01 from './tokens.js'. Export `dayParts(day)` -> {weekday, dom, month}: weekday = ['MON','TUE','WED','THU','FRI','SAT','SUN'][(day-1) % 7] (day 1 is a Monday), dom = dateOf(day).dayOfMonth, month = dateOf(day).monthName.slice(0,3).toUpperCase(). Export `drawCalendarSheet(ctx, x, y, w, h, day)`: chunkyPanel(ctx, x, y, w, h, {fill: COLOR.paper, shadow: 0}); header band fillStyle COLOR.enamelRed, fillRect(x+3, y+3, w-6, 28); header text `${weekday} ${dom padded to 2 digits} ${month}` (example 'MON 01 JAN') in '16px "Press Start 2P", monospace' white, textAlign center, textBaseline middle at (x+w/2, y+17); big number String(dom) in '48px "Press Start 2P", monospace' COLOR.ink, center/middle at (x+w/2, y+61); caption `DAY ${day}/365` in '24px VT323, monospace', fillStyle '#444444', center/middle at (x+w/2, y+h-16). (Layout is for w >= 180 and h >= 114.)
2. Export `drawCalendarTear(ctx, x, y, w, h, dayFrom, dayTo, p)`: p = clamp01(p). Always draw drawCalendarSheet for dayTo first (the sheet underneath). When p < 1 draw the old sheet on top: e = EASE.outCubic(p); ox = x + w*0.1; oy = y; ctx.save(); ctx.globalAlpha = 1 - e*e; ctx.translate(ox + 60*e, oy - 50*e); ctx.rotate(-0.5*e); ctx.translate(-ox, -oy); drawCalendarSheet(ctx, x, y, w, h, dayFrom); ctx.restore(). When p >= 1 only the underneath sheet is drawn and there is no save/restore at all.
3. `tests/calendarsheet.test.mjs`: dayParts(1) is {weekday:'MON', dom:1, month:'JAN'}; dayParts(8).weekday is 'MON'; dayParts(32) is {weekday:'THU', dom:1, month:'FEB'} (day 32: (31 % 7)=3 -> THU); drawCalendarSheet(ctx,610,598,180,114,1): texts are exactly ['MON 01 JAN','1','DAY 1/365'] in that order; header text drawn at y 615; caption at y 696; the header band is the fillRect [613,601,174,28] with fillStyle '#B3282D'; no text box leaves [610,790] x [598,712] (use tests/uiaudit.js from GU03 if it is merged, otherwise compute with width = chars*0.6*px) and the three texts do not overlap each other. drawCalendarTear at p 1 draws exactly one sheet (3 texts, zero rotate calls); at p 0.5: two sheets (6 texts), one `rotate` with arg -0.4375 (within 1e-9), (call it as drawCalendarTear(ctx,610,598,180,114,1,2,0.5): ox = 628, oy = 598) one translate [680.5, 554.25] (ox+52.5, oy-43.75) followed by translate [-628, -598], globalAlpha set to 0.234375 (1 - 0.875^2) then restored (`restore` called); the first 3 texts belong to dayTo ('TUE 02 JAN', '2', 'DAY 2/365') and the next 3 to dayFrom ('MON 01 JAN', '1', 'DAY 1/365').

## Acceptance (all must pass; exact commands)
- `make test 2>&1 | grep 'PASS tests/calendarsheet.test.mjs'` prints one line.
- No existing file is edited, so every existing test stays green.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- src/art/calendar.js (the big wall calendar prop stays).

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GU10: Calendar sheet with tear-off animation`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
