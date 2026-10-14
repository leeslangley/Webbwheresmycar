[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GU24 Office in the RSAMH frame: speech banner on top, HUD strip at the bottom

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GU24
Needs (already merged into `dev`): GU03, GU07, GU08, GU11, GU21
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
First scene wearing the new chrome: Dave's one line a day moves from the small bubble into the top speech banner (tail pointing at Dave), the old top HUD is replaced by the bottom HUD strip with an animated cash counter and the torn-off calendar day, and the four plate taps move to the new plate icons. The room art is NOT moved yet (it keeps its own layout; the banner and strip simply cover its top 8-112 px and bottom 590-720 px until the art team's 1280x470 tableau lands).

## Read first
- docs/art/GU.md (the plan: palette, type scale, spacing grid, motion timings, zones) and docs/art/RSAMH_STYLE.md (the look we echo)
- src/ui/scenes/office.js (read all) and tests/scene_office.test.mjs (every test must stay green; note it taps `LAYOUT.hits.fatcat/stable/household/hammer` and expects the toasts, expects text '£20,000' and a text starting 'DAY 1', and counts `stroke` calls relative to each other)
- src/ui/banner.js (GU08), src/ui/hudstrip.js (GU11), src/ui/hudparts.js (GU09: PLATE_SLOTS), src/ui/anim.js (GU07: makeCounter, counterSet, counterValue)
- src/art/officelayout.js (OFFICE.dave etc.)

## Files you may change (and nothing else)
- `src/ui/scenes/office.js`
- `tests/scene_office_rsamh.test.mjs`

## Steps
1. In `src/ui/scenes/office.js`: stop importing `drawHud`, `PLATE_RECTS` and `speechBubble`; import `drawBanner` from '../banner.js', `drawHudStrip` from '../hudstrip.js', `PLATE_SLOTS` from '../hudparts.js', `makeCounter, counterSet, counterValue` from '../anim.js'. The four plate hits now use PLATE_SLOTS (same keys, same toast text via PLATE_INFO), and in the exported `LAYOUT.hits` the entries fatcat, stable, household, hammer point at PLATE_SLOTS[0..3] (so the existing test taps the new rects). Keep every other hit, the TAP RULE code, `dayLine` caching and the keyboard handler exactly as they are.
2. In `draw`: keep everything up to Dave and Mark. Replace the `speechBubble(...)` call by `drawBanner(ctx, this.dayLine.line, {tailX: OFFICE.dave.x + 48, tailY: OFFICE.dave.y + 20, reveal: <typewriter fraction>})` where the fraction is clamp01((nowMs - this.lineSince) * 40 / 1000 / Math.max(1, this.dayLine.line.length)) and `this.lineSince` is set to nowMs whenever the cached line changes (nowMs = typeof app.now === 'function' ? app.now() : app.now). Draw the banner AFTER the hotspot glows so it covers art, and the HUD strip last: replace `drawHud(ctx, state, t)` by `drawHudStrip(ctx, state, {cashShown: counterValue(this.cashCounter, nowMs), portrait: null, nowMs, dayChangedAt: app.dayChangedAt, prevDay: day - 1}, t)`. `this.cashCounter = makeCounter(state.cash)` is created in `enter` (and lazily in draw when missing); in draw call `counterSet(this.cashCounter, state.cash, nowMs)` only when state.cash differs from this.lastCash (then store lastCash) so the figure counts up over 700 ms. The strip's calendar sheet makes the old wall-calendar prop redundant but keep drawing it (its hit and test remain).
3. `tests/scene_office_rsamh.test.mjs` (same fake app and startGame(3) as scene_office.test.mjs; the fake app clock is a number: set `app.now = () => 5000` for time-based checks): the office draw includes the banner text uppercased (the day-1 line from chatterFor({rng: 1*7919+13}, 'newmonth').toUpperCase(), fully revealed when lineSince is far in the past: set officeScene.lineSince = -100000 after the first draw, or draw twice with now 0 then 100000) and no longer calls drawHud (no fillText 'REP 40' and no 'BUZZ 0'); texts include '£20,000' and 'DAY 1/365'; the first fillRect of the strip [0,590,1280,130] is present; tapping the centre of LAYOUT.hits.fatcat toasts 'Fat Cat...' exactly as before and LAYOUT.hits.fatcat equals {key:'fatcat', x:24, y:600, w:48, h:48}; the cash counter: after state.cash changes from 20000 to 21000 at now 5000 the shown figure at now 5350 is '£20,875'... compute exactly: round(20000 + 1000*outCubic(0.5)) = 20875; at 5700 it is '£21,000'; two draws with an unchanged cash do not restart the counter; the audit helper tests/uiaudit.js (GU03) on the HUD strip region only: filter the entries with y0 >= 590 and require none below the floor and no overlaps among them.

## Acceptance (all must pass; exact commands)
- `make test 2>&1 | grep 'PASS tests/scene_office_rsamh.test.mjs'` prints one line.
- `make test 2>&1 | grep -E 'PASS tests/(scene_office|office_art|hud|playthrough).test.mjs'` prints 4 lines (existing office, art, hud and playthrough tests stay green).
- `make test 2>&1 | grep -c '^FAIL'` prints 0.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- src/art/*.js (room art, hud.js, speech.js stay as they are), OFFICE rectangles, every other scene.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GU24: Office in the RSAMH frame: speech banner on top, HUD strip at the bottom`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
