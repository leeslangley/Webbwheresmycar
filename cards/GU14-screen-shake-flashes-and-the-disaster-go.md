[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GU14 Screen shake, flashes and the disaster / good-news presets

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GU14
Needs (already merged into `dev`): GU01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Deterministic screen shake and colour flashes, called by breakdowns (red flash and shake), sales and plates (gold flash), and a short hit-stop. Time comes in as nowMs.

## Read first
- docs/art/GU.md (the plan: palette, type scale, spacing grid, motion timings, zones) and docs/art/RSAMH_STYLE.md (the look we echo)
- src/ui/tokens.js (card GU01: `COLOR`, `SPACE`, `ZONES`, `TYPE`, `FLOOR`, `MOTION`, `EASE`, `lerp`, `clamp01`)
- tests/fakectx.js (recording fake canvas: `ctx.calls` is a list of [method, args]; property sets are recorded as `set:<prop>`; `measureText(s).width` is `s.length * 0.6 * <px size in ctx.font>`; helpers `makeCtx, texts, count, lastSet, anySet, reset`) and tests/harness.js (`test, eq, ok, throws, done`; end every test file with `done();`)

## Files you may change (and nothing else)
- `src/ui/screenfx.js`
- `tests/screenfx.test.mjs`

## Steps
1. `src/ui/screenfx.js` (imports MOTION from tokens). No DOM, no `Math.random`, no `Date`: time comes in as a `nowMs` argument, randomness from a seeded integer hash. Export `makeScreenFx()` -> {shake: null, flash: null, freezeUntil: 0}. `fxShake(fx, mag, ms, nowMs)` sets fx.shake = {mag, ms, start: nowMs} (a stronger new shake replaces a weaker running one: keep the old when its remaining amplitude is bigger). `fxFlash(fx, color, ms, nowMs, peak = 0.8)` sets fx.flash = {color, ms, start: nowMs, peak}. `fxFreeze(fx, ms, nowMs)` sets freezeUntil = nowMs + ms; `fxFrozen(fx, nowMs)` = nowMs < fx.freezeUntil. `fxActive(fx, nowMs)` is true while a shake or flash is still running. Presets: `fxDisaster(fx, nowMs)` = shake 14 for 500ms + flash '#D9483B' 260ms peak 0.6 + freeze 80ms; `fxGood(fx, nowMs)` = flash '#FFD27A' 200ms peak 0.35 (no shake); `fxBump(fx, nowMs)` = shake 4 for 150ms.
2. `shakeOffset(fx, nowMs)` -> {dx, dy}: no shake or age >= ms gives {dx:0, dy:0}; else age = nowMs - start; amp = mag*(1 - age/ms); dx = Math.round(amp*Math.sin(age*0.09)); dy = Math.round(amp*Math.cos(age*0.13)). `flashAlpha(fx, nowMs)`: no flash or age >= ms gives 0; else u = age/ms; peak*(1-u)*(1-u). `fxBegin(ctx, fx, nowMs)`: ctx.save(); o = shakeOffset; when dx or dy is non-zero ctx.translate(dx, dy). `fxEnd(ctx, fx, nowMs)`: ctx.restore(); a = flashAlpha; when a > 0.001: fillStyle rgba of the flash colour (use rgba() from './theme.js') with alpha a, fillRect(-144, 0, 1568, 720) (overdraw 144 px each side so the flash also covers the strips of a wide phone screen, docs/art/WD.md); expired shake/flash are set back to null here.
3. `tests/screenfx.test.mjs`: shake mag 10 ms 300 start 0: shakeOffset at 0 is {dx:0,dy:10}; at 100 is {dx:3,dy:6} (amp 6.667; round(6.667*sin 9)=3, round(6.667*cos 13)=6); at 300 and after is {dx:0,dy:0}; a weaker second shake (mag 2) while a mag-10 shake is fresh does not replace it; flash peak 0.8 ms 180: alpha at 0 is 0.8, at 90 is 0.2 (within 1e-9), at 180 is 0; fxBegin makes one `save` and, when the offset is non-zero, a translate with the offset; fxEnd makes one `restore` and a fillRect [-144,0,1568,720] whose fillStyle is 'rgba(217,72,59,0.xxx)' for the disaster preset at age 0 (alpha 0.6: assert the fillStyle starts with 'rgba(217,72,59,0.6'); after the flash expired fxEnd draws no fillRect and sets fx.flash to null; fxDisaster sets freezeUntil to nowMs+80 and fxFrozen is true at +79, false at +80; fxGood has no shake (fx.shake null); fxActive false on a fresh fx.

## Acceptance (all must pass; exact commands)
- `make test 2>&1 | grep 'PASS tests/screenfx.test.mjs'` prints one line.
- No existing file is edited, so every existing test stays green.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Wiring into the app (GU22).

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GU14: Screen shake, flashes and the disaster / good-news presets`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
