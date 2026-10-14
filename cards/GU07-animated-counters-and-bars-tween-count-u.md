[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GU07 Animated counters and bars: tween, count-up, stat bar with ghost

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GU07
Needs (already merged into `dev`): GU01, GU04
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Time-driven (no timers) tweens for money count-up and stat bars that fill and drain, and a bar drawing recipe whose inner fill keeps the exact geometry of the old `bar` so scene tests stay green.

## Read first
- docs/art/GU.md (the plan: palette, type scale, spacing grid, motion timings, zones) and docs/art/RSAMH_STYLE.md (the look we echo)
- src/ui/tokens.js (card GU01: `COLOR`, `SPACE`, `ZONES`, `TYPE`, `FLOOR`, `MOTION`, `EASE`, `lerp`, `clamp01`)
- src/ui/theme.js (exports `PALETTE`, `font(kind, px)`, `shade(hex, amount)`, `rgba(hex, alpha)`; do not edit it)
- tests/fakectx.js (recording fake canvas: `ctx.calls` is a list of [method, args]; property sets are recorded as `set:<prop>`; `measureText(s).width` is `s.length * 0.6 * <px size in ctx.font>`; helpers `makeCtx, texts, count, lastSet, anySet, reset`) and tests/harness.js (`test, eq, ok, throws, done`; end every test file with `done();`)
- src/ui/kit_draw.js (`bar` and its tests: bar(ctx,10,10,100,20,5,10,'#f00') must still make fillRect [12,12,48,16])

## Files you may change (and nothing else)
- `src/ui/anim.js`
- `src/ui/bars.js`
- `tests/anim_bars.test.mjs`

## Steps
1. `src/ui/anim.js` (imports EASE, MOTION, clamp01, lerp from tokens). Export `makeTween(from, to, startMs, durMs, ease = 'outCubic')` -> {from,to,startMs,durMs,ease}; `tweenValue(tw, nowMs)`: u = durMs <= 0 ? 1 : clamp01((nowMs - startMs)/durMs); return lerp(from, to, EASE[ease](u)); `tweenDone(tw, nowMs)` = nowMs >= startMs + durMs. Export the counter: `makeCounter(v)` -> {tw: makeTween(v, v, 0, 0)}; `counterSet(c, target, nowMs, durMs = MOTION.count)` restarts the tween FROM the currently shown float value; `counterValue(c, nowMs)` = Math.round(tweenValue(c.tw, nowMs)). Export the bar animation: `makeBarAnim(frac)` -> {main: tween(frac,frac), ghost: tween(frac,frac)}; `barAnimSet(a, frac, nowMs)`: main = makeTween(current main value, frac, nowMs, MOTION.bar, 'outCubic'); when frac is lower than the current value the ghost keeps its current value, then drains: ghost = makeTween(current ghost value, frac, nowMs + 300, MOTION.bar, 'outCubic'); when frac is higher the ghost follows the main tween exactly (same start and duration); `barAnimValues(a, nowMs)` -> {value, ghost}.
2. `src/ui/bars.js` (imports COLOR from tokens, shade from theme; must NOT import kit_draw.js). Export `drawBar2(ctx, x, y, w, h, value, max, color, opts)`: frac = max > 0 ? clamp(value/max, 0, 1) : 0; fw = (w-4)*frac (NOT rounded). Order: (1) fillStyle COLOR.well, fillRect(x, y, w, h); (2) fillStyle color, fillRect(x+2, y+2, fw, h-4); (3) when frac > 0: fillStyle shade(color, 0.35), fillRect(x+2, y+2, fw, 2); fillStyle shade(color, -0.3), fillRect(x+2, y+h-4, fw, 2); (4) segment ticks: fillStyle 'rgba(20,16,42,0.35)'; for (sx = x+2+8; sx < x+2+fw; sx += 8) fillRect(sx, y+2, 1, h-4); (5) when opts.ghost (a value in the same units as `value`) gives gf = clamp(ghost/max,0,1) > frac: fillStyle 'rgba(255,255,255,0.35)', fillRect(x+2+fw, y+2, (w-4)*(gf-frac), h-4); (6) lineWidth 2, strokeStyle COLOR.ink, strokeRect(x, y, w, h). Export `drawStatBar(ctx, x, y, w, h, frac, color, iconName)`: drawIcon(ctx, iconName, x, y + Math.round((h-24)/2), 24) (import drawIcon from './icons.js'), then drawBar2(ctx, x+32, y, w-32, h, frac, 1, color).
3. `tests/anim_bars.test.mjs`: tweenValue(makeTween(0,100,0,1000,'linear'),250) is 25; before start gives 0, after end 100; counter: c=makeCounter(0); counterSet(c,1000,0); counterValue(c,350) is 875 (outCubic(0.5)=0.875 of 1000), counterValue(c,700) is 1000; retarget: counterSet(c,0,350) then counterValue(c,350) is 875 and counterValue(c,1050) is 0; barAnim: a=makeBarAnim(1); barAnimSet(a,0.4,0): values at 450 -> value 0.4 (within 1e-9), at 300 -> ghost 1, at 750 -> ghost 0.4; increasing 0.4 -> 0.9 at t 1000: ghost equals value at t 1200. drawBar2(ctx,10,10,100,20,5,10,'#f00') contains the call fillRect [12,12,48,16]; exactly 5 tick fillRects of width 1 (sx = 20,28,36,44,52); value 0 -> inner fillRect [12,12,0,16] and no ticks and no shine; max 0 -> same as empty; with {ghost:8} an extra fillRect [60,12,28.8,16] (96*(0.8-0.5)) appears with fillStyle 'rgba(255,255,255,0.35)'; strokeStyle COLOR.ink with lineWidth 2 is set last.

## Acceptance (all must pass; exact commands)
- `make test 2>&1 | grep 'PASS tests/anim_bars.test.mjs'` prints one line.
- No existing file is edited, so every existing test stays green.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- src/ui/kit_draw.js (GU21).

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GU07: Animated counters and bars: tween, count-up, stat bar with ghost`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
