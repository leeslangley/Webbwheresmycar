[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W50 Car drawer

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W50
Needs (already merged into `dev`): W48, W49
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Draw a side-on classic car from its profile, with paint, glass, chrome, wheels, lights, and rust and smoke when the condition is poor.

## Read first
- docs/ART_SPEC.md (rendering recipe: follow it step by step)
- src/art/common.js, src/art/profiles.js, src/ui/theme.js (shade)
- tests/fakectx.js
- UI files may use the canvas 2D API but always receive `ctx` as a parameter (never `document`/`window`), so they run in `jsc` tests with `tests/fakectx.js`.

## Files you may change (and nothing else)
- `src/art/cardraw.js`
- `tests/cardraw.test.mjs`

## Steps
1. Create `src/art/cardraw.js` exporting `drawCar(ctx, archetype, x, y, scale, opts = {})` with opts `{body = '#9a2a2a', roof = null, stripe = null, wheel = '#c9ccd2', cond = 10, t = 0}`. Follow the 7-step rendering recipe in `docs/ART_SPEC.md` exactly. Use `ctx.save()` at the start and `ctx.restore()` at the end; every extra `save` must have a matching `restore`. `archetype` unknown -> throw via `profileOf`.
2. Implementation hints: `k = profile.lengthPx / 100 * scale`; `ctx.translate(x, y); ctx.scale(k, -k)`. Body polygon: `roundedPoly(ctx, part.pts, part.r)`; fill with `vgrad(ctx, minY, maxY, shade(body, 0.25), shade(body, -0.25))` where minY/maxY are the min and max y of that part's points. Roof repaint: `ctx.save(); roundedPoly(...); ctx.clip();` then `fillRect` from `maxY * 0.65` to `maxY + 1` across x -51..51 in the roof colour; `restore`. Stripe: same clip, a rect 2.4 units tall centred at 60% of body height in the stripe colour. Wheel arches: for each wheel draw a dark half circle (`#101014`) radius `w.r * 1.18` centred at `(w.x, w.r)` clipped to the body (draw it after the body, before the wheels). Wheels via `wheel(ctx, w.x, w.r, w.r, t, w.dim)`; the wheel colour option overrides the rim colour by drawing a thin ring (`arc` radius `w.r*0.62`, stroke `opts.wheel`).
3. Also export `carBounds(archetype, scale)` returning `{w, h}` in pixels: `w = lengthPx * scale`, `h = (maxY of all part points + 2) * (lengthPx / 100) * scale`.
4. Write `tests/cardraw.test.mjs` with `makeCtx` and the 13 archetype names: for each archetype `drawCar(ctx, a, 400, 300, 1, {})` does not throw; `count(ctx,'save') === count(ctx,'restore')`; at least 3 `arc` calls (wheels); the number of wheels drawn equals the number of `set:fillStyle` calls whose value is `#15151a` (the tyre colour): 3 for `trike`, 2 for every other archetype, when `cond` is 10. With `cond: 10` no fillStyle `#8a4b1f` is ever set; with `cond: 3` it is; with `cond: 1` the smoke grey `rgba(160,160,160,0.5)` is set; `roof: '#ffffff'` makes `#ffffff` appear in fillStyle sets for the roadster too without throwing; unknown archetype throws; `carBounds('micro', 1).w === 300`; `carBounds('saloon', 2).w === 840`; `carBounds('saloon',1).h` is between 120 and 200.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Do not edit profiles.js or common.js.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W50: Car drawer`.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
