[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GE14 Game side: light effects (glow, flicker, shaft, vignette, grain, glass)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GE14
Needs (already merged into `dev`): W43
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Cheap canvas effects that make a still plate feel lit: additive lamp and TV glow with deterministic flicker, a window light shaft, a vignette, film grain and a glass glare for the telly and laptop screens.

## Read first
- src/ui/theme.js (`rgba(hex, alpha)` helper)
- tests/fakectx.js (recording fake canvas) and tests/props.test.mjs (style of draw tests)
- src/art/common.js (helpers `circle`, `pulse`)

## Files you may change (and nothing else)
- `src/art/roomfx_light.js`
- `tests/roomfx_light.test.mjs`

## Steps
1. `src/art/roomfx_light.js` (pure; deterministic; no Math.random, no Date). `flicker(t, seed, depth)` returns `1 - depth * (0.5 + 0.5 * (0.6 * Math.sin(t * 7.3 + seed) + 0.4 * Math.sin(t * 17.9 + seed * 2.1)))` (always between 1-depth and 1). `glow(ctx, x, y, r, color, alpha)`: `save`, set `globalCompositeOperation = 'lighter'`, a radial gradient from (x,y,0) to (x,y,r) with stops 0 -> `rgba(color, alpha)` and 1 -> `rgba(color, 0)`, `fillRect(x - r, y - r, 2 * r, 2 * r)`, `restore`.
2. `lampGlow(ctx, x, y, t)` = `glow(ctx, x, y, 170, '#ffab55', 0.38 * flicker(t, 1.3, 0.12))`. `tvGlow(ctx, rect, t)` = `glow(ctx, rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w * 0.9, '#78b4ff', 0.22 * flicker(t, 4.1, 0.25))`. `sunShaft(ctx, quad, t)`: `quad` is four [x,y] points; `save`, composite 'lighter', fill the polygon with `rgba('#ffe2b8', 0.10 + 0.03 * Math.sin(t * 0.6))`, `restore`.
3. `vignette(ctx, w, h, strength)`: radial gradient centred (w/2,h/2) from radius `h * 0.45` (stop 0 -> `rgba('#000000', 0)`) to radius `w * 0.62` (stop 1 -> `rgba('#000000', strength)`), `fillRect(0, 0, w, h)`. `grain(ctx, w, h, t, n)`: for i in 0..n-1 one 2x2 `fillRect` at `x = (i * 7919 + k * 104729) % w`, `y = (i * 6007 + k * 15485863) % h` where `k = Math.floor(t * 12)`, colour `rgba('#ffffff', 0.05)` for even i and `rgba('#000000', 0.06)` for odd i (integers only). `glassGlare(ctx, rect, t)`: `save`, clip to rect, a diagonal band (polygon from (rect.x + rect.w*0.1, rect.y) to (rect.x + rect.w*0.3, rect.y) to (rect.x + rect.w*0.15, rect.y + rect.h) to (rect.x - rect.w*0.05, rect.y + rect.h)) filled `rgba('#ffffff', 0.05)`; thin scanlines `fillRect(rect.x, y, rect.w, 1)` every 6 px with `rgba('#000000', 0.06)`; `restore`.
4. `tests/roomfx_light.test.mjs` (fakectx): `flicker` over t = 0..20 step 0.1 stays within [0.88, 1] for depth 0.12 and the same call twice gives the same number; `glow` makes one `createRadialGradient` and one `fillRect(x-r, y-r, 2r, 2r)`, sets `globalCompositeOperation` to `'lighter'` inside a balanced save/restore; `vignette` fills exactly `(0,0,w,h)`; `grain(ctx,1280,720,1.0,60)` makes exactly 60 `fillRect` calls, every rect inside the canvas, and two calls with the same t give identical call logs; `glassGlare` clips (`clip` call count 1) and draws `Math.floor(rect.h / 6)` or one more scanline; `sunShaft` calls `fill` once.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep roomfx_light` shows PASS.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GE14: Game side: light effects (glow, flicker, shaft, vignette, grain, glass)`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
