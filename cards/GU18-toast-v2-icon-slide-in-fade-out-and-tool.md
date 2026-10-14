[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GU18 Toast v2 (icon, slide-in, fade-out) and tooltips

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GU18
Needs (already merged into `dev`): GU01, GU04
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The two small overlays: the toast (kind icon, slide in with a little overshoot, fade out) as pose maths + a draw that sits where the old toast did, and the tooltip (appears after a hover delay, clamped to the screen, arrow toward the target).

## Read first
- docs/art/GU.md (the plan: palette, type scale, spacing grid, motion timings, zones) and docs/art/RSAMH_STYLE.md (the look we echo)
- src/ui/tokens.js (card GU01: `COLOR`, `SPACE`, `ZONES`, `TYPE`, `FLOOR`, `MOTION`, `EASE`, `lerp`, `clamp01`)
- src/ui/theme.js (exports `PALETTE`, `font(kind, px)`, `shade(hex, amount)`, `rgba(hex, alpha)`; do not edit it)
- tests/fakectx.js (recording fake canvas: `ctx.calls` is a list of [method, args]; property sets are recorded as `set:<prop>`; `measureText(s).width` is `s.length * 0.6 * <px size in ctx.font>`; helpers `makeCtx, texts, count, lastSet, anySet, reset`) and tests/harness.js (`test, eq, ok, throws, done`; end every test file with `done();`)
- src/ui/scenes.js (the existing toast: {text, until}, panel 560x36 at x 360, y 640 - slot*44, text size 28 centred)
- src/ui/icons.js (GU04: tick, cross, warning, paper)

## Files you may change (and nothing else)
- `src/ui/overlays.js`
- `tests/overlays.test.mjs`

## Steps
1. `src/ui/overlays.js` (imports EASE, MOTION, clamp01 from tokens; drawIcon from './icons.js'; PALETTE from './theme.js'; it must NOT import kit_draw.js, and instead of panel() it receives the panel drawer as a parameter). Export `toastPose(toast, nowMs)`: toast = {born, until}; age = nowMs - born; remaining = until - nowMs; dy = age < MOTION.toast ? 40*(1 - EASE.outBack(clamp01(age/MOTION.toast))) : 0; alpha = Math.min(1, age/130); when remaining < MOTION.toastOut alpha = Math.min(alpha, clamp01(remaining/MOTION.toastOut)); return {dy, alpha}. Export `toastIcon(kind)`: 'good' -> 'tick', 'bad' -> 'cross', 'warn' -> 'warning', 'info' -> 'paper', anything else (including undefined) -> null.
2. Export `drawToast2(ctx, toast, nowMs, slot, panelFn)`: pose = toastPose; y = 640 - slot*44 + pose.dy; save; globalAlpha = pose.alpha; panelFn(ctx, 360, y, 560, 36) (the caller passes kit_draw's `panel`); icon = toastIcon(toast.kind): when icon draw drawIcon(ctx, icon, 372, y + 6, 24); text: font '28px VT323, monospace', textBaseline 'top', textAlign 'center', fillStyle PALETTE.ink, fillText(toast.text, 640 + (icon ? 16 : 0), y + 4); restore. Export tooltip model `makeTooltip()` -> {id:null, since:0}; `ttHover(tt, id, nowMs)`: when id !== tt.id set tt.id = id and tt.since = nowMs; `ttVisible(tt, nowMs, delay = 400)` = tt.id !== null && nowMs - tt.since >= delay. Export `tooltipRect(textW, ax, ay, bounds)`: bounds default {x:8,y:8,w:1264,h:704}; w = textW + 20; h = 40; x = clamp(ax - w/2, bounds.x, bounds.x + bounds.w - w); y = ay - h - 12; below = y < bounds.y; when below y = ay + 12; return {x, y, w, h, below}. Export `drawTooltip(ctx, text, ax, ay, bounds)`: font '24px VT323, monospace'; r = tooltipRect(ctx.measureText(text).width, ax, ay, bounds); fillStyle '#14102A' fillRect(r.x, r.y, r.w, r.h); fillStyle '#FFF7DC' fillRect(r.x+2, r.y+2, r.w-4, r.h-4); arrow: a triangle path pointing at (ax, ay) from the box edge (above: base on the bottom edge at ax-6..ax+6 clamped inside the box, below: top edge), fill '#14102A'; text fillStyle '#14102A', textBaseline 'middle', textAlign 'center' at (r.x + r.w/2, r.y + r.h/2).
3. `tests/overlays.test.mjs`: toastPose({born:0,until:2500}, 0) is {dy:40, alpha:0}; at 130 alpha is 1 (age/130); at 260 dy is 0 (outBack(1)=1) and at 130 dy is 40*(1-outBack(0.5)) = 40*(1-1.0876975) = -3.5079 within 1e-4 (a small overshoot above the rest line); at until-100 alpha is 0.5; at until alpha 0; toastIcon('good') 'tick', 'bad' 'cross', 'warn' 'warning', 'info' 'paper', undefined null. drawToast2 at a settled time (nowMs 1000) with a fake panelFn that records its arguments: called once with (ctx,360,640,560,36); slot 2 gives y 552; a kind 'good' toast draws tick icon fillRects inside [372,396] x [646,670] and the text is at x 656; no kind -> text at x 640 and no icon fillRects; texts equal [toast.text]; globalAlpha set to 1 and the call sequence has save ... restore. Tooltip: ttHover(tt,'a',100); ttVisible(tt,499) false, (tt,500) true; ttHover(tt,'b',600) resets: ttVisible(tt,700) false; ttHover(tt,'b',900) does not reset. tooltipRect(100, 640, 300) -> {x:580,y:248,w:120,h:40,below:false}; tooltipRect(100, 10, 300) clamps x to 8; tooltipRect(100, 640, 30) is below: y 42, below true; an off-right case ax 1275 clamps x to 8+1264-120 = 1152. drawTooltip draws the text once and its box fillRects lie inside the bounds.

## Acceptance (all must pass; exact commands)
- `make test 2>&1 | grep 'PASS tests/overlays.test.mjs'` prints one line.
- No existing file is edited, so every existing test stays green.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- src/ui/scenes.js (GU23).

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GU18: Toast v2 (icon, slide-in, fade-out) and tooltips`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
