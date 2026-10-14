[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GU19 Day-change sequence: timeline, events and overlay

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GU19
Needs (already merged into `dev`): GU01, GU07, GU08, GU10
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The ceremony when a day passes (2.4 s): the screen dims, the calendar sheet is torn off, the money delta counts up with coins or rust, and the banner types the headline. A pure timeline, a list of one-shot events (sounds and particle bursts for the app to fire), and the overlay draw.

## Read first
- docs/art/GU.md (the plan: palette, type scale, spacing grid, motion timings, zones) and docs/art/RSAMH_STYLE.md (the look we echo)
- src/ui/tokens.js (card GU01: `COLOR`, `SPACE`, `ZONES`, `TYPE`, `FLOOR`, `MOTION`, `EASE`, `lerp`, `clamp01`)
- tests/fakectx.js (recording fake canvas: `ctx.calls` is a list of [method, args]; property sets are recorded as `set:<prop>`; `measureText(s).width` is `s.length * 0.6 * <px size in ctx.font>`; helpers `makeCtx, texts, count, lastSet, anySet, reset`) and tests/harness.js (`test, eq, ok, throws, done`; end every test file with `done();`)
- src/ui/calendarsheet.js (GU10: drawCalendarTear)
- src/ui/banner.js (GU08: drawBanner)
- src/core/format.js (money)

## Files you may change (and nothing else)
- `src/ui/daychange.js`
- `tests/daychange.test.mjs`

## Steps
1. `src/ui/daychange.js` (imports EASE, clamp01, MOTION from tokens; drawCalendarTear; drawBanner; money). No DOM, no `Math.random`, no `Date`: time comes in as a `nowMs` argument, randomness from a seeded integer hash. Export `PHASES` = [{id:'dim',t0:0,t1:300},{id:'tear',t0:300,t1:1000},{id:'money',t0:700,t1:1700},{id:'banner',t0:1000,t1:2400},{id:'out',t0:2100,t1:2400}] and `TOTAL` = 2400. Export `dayTimeline(prev, next)`: prev and next are {day, cash, rep, buzz}; returns {prev, next, total: 2400, delta: {cash: next.cash - prev.cash, rep: next.rep - prev.rep, buzz: next.buzz - prev.buzz}}. Export `phaseProgress(tl, ms, id)` -> 0 before t0, 1 after t1, else (ms - t0)/(t1 - t0). Export `dimAlpha(ms)`: 0.55*phaseProgress(dim) while ms < 2100, else 0.55*(1 - phaseProgress(out)); 0 at ms >= 2400.
2. Export `dayEvents(tl, fromMs, toMs)`: all events with fromMs < at <= toMs, in time order, from this fixed table: {at:300, kind:'sound', name:'paper'}; at 700: when delta.cash > 0 {kind:'sound', name:'coins'} and {kind:'emit', what:'cash', n: Math.min(30, Math.max(6, Math.floor(delta.cash/200)))}; when delta.cash < 0 {kind:'sound', name:'thud'} and {kind:'emit', what:'rust', n: Math.min(30, Math.max(6, Math.floor(-delta.cash/200)))}; when delta.cash is 0 neither; at 1000 {kind:'sound', name:'stamp'}. Export `drawDayChange(ctx, tl, ms, headline)`: when ms <= 0 or ms >= TOTAL do nothing; a = dimAlpha(ms); fillStyle `rgba(20,16,42,${a.toFixed(3)})`, fillRect(-144, 0, 1568, 720) (always; overdraw 144 px each side for wide phone screens, docs/art/WD.md); drawCalendarTear(ctx, 500, 150, 280, 200, tl.prev.day, tl.next.day, phaseProgress(tl, ms, 'tear')); money text (only when delta.cash != 0): shown = Math.round(delta.cash * EASE.outCubic(phaseProgress(tl, ms, 'money'))); text = (shown >= 0 ? '+' : '') + money(shown) (money() already gives '-£400' for negatives); font '32px "Press Start 2P", monospace', textAlign 'center', textBaseline 'middle', fillStyle (delta.cash > 0 ? '#3FAE49' : '#D9483B'), fillText at (640, 400). Headline: when ms >= 1000 and headline: drawBanner(ctx, headline, {reveal: phaseProgress(tl, ms, 'banner')*1.6 (so it finishes typing before the end; clamp done by drawBanner), tailX: 640, tailY: 150}).
3. `tests/daychange.test.mjs`: tl = dayTimeline({day:1,cash:1000,rep:40,buzz:0},{day:2,cash:2400,rep:41,buzz:3}) has delta {cash:1400,rep:1,buzz:3} and total 2400; phaseProgress(tl,150,'dim') 0.5, (tl,650,'tear') 0.5, (tl,2200,'out') 1/3 within 1e-9, (tl,0,'money') 0, (tl,5000,'banner') 1; dimAlpha(0) 0, (300) 0.55, (1000) 0.55, (2250) 0.275, (2400) 0. dayEvents(tl,0,2400) is exactly [paper@300, coins@700, emit cash n 7 @700, stamp@1000] (floor(1400/200)=7; check the order of the two events at 700: sound first, emit second); dayEvents(tl,300,700) -> coins and emit only (300 is excluded, 700 is included); a negative delta (-1000): thud + emit rust n 6 (floor(5) -> min 6); zero delta: only paper and stamp. drawDayChange at ms 0 and 2400 draws nothing (0 calls); at ms 650 (tear 0.5, money not started): the first fillRect is [-144,0,1568,720] with fillStyle 'rgba(20,16,42,0.550)', two calendar sheets (texts include 'DAY 2/365' and 'DAY 1/365') and the money text is '+£0'; at ms 1200 (tear done, money u 0.5, outCubic 0.875): one sheet only and the money text is '+£1,225' (round(1400*0.875)) drawn at (640,400) in fillStyle '#3FAE49'; a negative delta (-1000) at ms 1700 shows '-£1,000' in '#D9483B'; delta 0 draws no money text; with headline 'Big news' at ms 1500 some fillText starts with 'BIG' (the banner is typing) and without a headline there is no banner (no 1525-dot dither); all fillRects of the dim overlay lie inside x -144..1424 and y 0..720.

## Acceptance (all must pass; exact commands)
- `make test 2>&1 | grep 'PASS tests/daychange.test.mjs'` prints one line.
- `grep -nE 'Math.random|Date' src/ui/daychange.js` prints nothing.
- No existing file is edited, so every existing test stays green.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Wiring into the office/kettle tap (wave 2).

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GU19: Day-change sequence: timeline, events and overlay`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
