[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GU25 TV shop fixes: quip off the car, CONDITION label, tag text size, button gaps

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GU25
Needs (already merged into `dev`): GU02, GU03, GU21, W59b
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Fix what Lee saw: the salesman's quip is painted over the car, `CONDITION 3.3/10` is clipped by its own bar, FOR SALE / TO RENT tag text is only 12px, and BUY / RENT touch the detail panel. Prove it with numbers (text boxes, rectangles), and show the pattern the other scenes will copy in wave 2.

## Read first
- docs/art/GU.md (the plan: palette, type scale, spacing grid, motion timings, zones) and docs/art/RSAMH_STYLE.md (the look we echo)
- src/ui/scenes/tvshop.js (read all) and tests/scene_tvshop_draw.test.mjs + tests/scene_tvshop_input.test.mjs (they stay green: the title 'WEBB TV SHOPPING', car names, money(price), the blinking '>' cursor exactly once at t=0, STYLE/UPKEEP/GRIT and a text containing 'CONDITION', taps on LAYOUT.buy/rent/back and rows)
- src/ui/textfit.js (GU02: fitBlock, fitOne, fitInRect), tests/uiaudit.js (GU03: auditCtx, rectsOverlap)
- src/art/profiles.js (`profileOf(arch)`: lengthPx and the part points: car height in px = max y over body points * lengthPx / 100 * scale)

## Files you may change (and nothing else)
- `src/ui/scenes/tvshop.js`
- `tests/scene_tvshop_layout.test.mjs`

## Steps
1. In `tvshop.js` change `LAYOUT`: buy {x:640, y:608, w:290, h:60}, rent {x:950, y:608, w:290, h:60}; add `quip: {x:640, y:168, w:580, h:64}` and `stage: {x:640, y:236, w:580, h:154}` (rows of stat bars now start at y 396). Row tag (drawRow): panel w 140 at tagX = L.x + 236, label size 16 title font, centred; car name `maxW` 190; price maxW 160. Detail: the name stays at D.y+16; the quip is drawn with `drawFitted`/fitBlock into LAYOUT.quip (kind body, maxPx 28, minPx 22, maxLines 2, color ink) instead of `paragraph`; the car is drawn inside LAYOUT.stage: profile = profileOf(model.archetype); srcW = profile.lengthPx, srcH = (max y of the body part points) * profile.lengthPx/100 (scale 1); f = fitInRect(srcW, srcH, LAYOUT.stage, {maxScale: 1.15, pad: 6}); drawCar(ctx, model.archetype, f.x, f.y, f.scale, {...same options as before}).
2. Stat rows: first row y 396, step 40. Label column: `label(ctx, text, D.x+20, y, {size:26, maxW:150})`; bar at (D.x+180, y+4, 330, 22) via the kit `bar`; the value text right-aligned at x = D.x + D.w - 20: `oneDp(v) + '/10'` for all four rows, size 26, maxW 70. The fourth row's label is exactly 'CONDITION' (the number moved to the right column; the existing test only needs a text containing 'CONDITION'). The 'Owner:' row follows at y + 40 as before.
3. `tests/scene_tvshop_layout.test.mjs` (setup copied from scene_tvshop_draw.test.mjs: `startGame(5)`, `tvshopScene.enter(app)`; loop `selected` over every listing, sale and rent): using `auditCtx` from tests/uiaudit.js on a fresh makeCtx per draw: `belowFloor.length === 0`, `offCanvas.length === 0`, `overlaps.length === 0` (list the offenders with describe() in the failure message; the list rows are clipped by ctx.clip to LAYOUT.list, so before auditing drop any entry whose y0 >= LAYOUT.list.y + LAYOUT.list.h or whose y1 <= LAYOUT.list.y); LAYOUT.quip bottom (y + h) <= LAYOUT.stage.y and LAYOUT.stage bottom <= 396; every quip text line fillText y is >= quip.y and < quip.y + quip.h; the drawCar ground point (the first `translate` after a save whose args are the car position: check via ctx.calls: translate x within the stage and y <= stage.y + stage.h - 6 + 0.001) and the car's scaled height f.h <= stage.h - 12; buy and rent rects: buy.y >= detail.y + detail.h + 6 (LAYOUT.detail.y + LAYOUT.detail.h is 600, so buy.y 608 gives an 8px gap) and rent.x - (buy.x + buy.w) is 20; the 'FOR SALE' tag text is drawn at 16px title (parse px from the font set before it) and fits in its 140px tag: 8*16 = 128 <= 140; the existing scene_tvshop tests pass unchanged.

## Acceptance (all must pass; exact commands)
- `make test 2>&1 | grep 'PASS tests/scene_tvshop_layout.test.mjs'` prints one line.
- `make test 2>&1 | grep -E 'PASS tests/scene_tvshop_(draw|input).test.mjs'` prints 2 lines.
- `make test 2>&1 | grep -c '^FAIL'` prints 0.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Other scenes (wave 2 applies the same pattern: auction lot title vs car, advert RISK lines, garage empty state, endgame confetti via particles).

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GU25: TV shop fixes: quip off the car, CONDITION label, tag text size, button gaps`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
