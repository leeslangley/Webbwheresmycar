[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W54 Animated props: TV, phone, laptop, newspaper, kettle

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W54
Needs (already merged into `dev`): W48, W43, W44
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The little animated things on the desk and around the room.

## Read first
- docs/DESIGN.md section 5
- src/art/common.js (pulse, roundedPoly, circle)
- src/ui/theme.js
- UI files may use the canvas 2D API but always receive `ctx` as a parameter (never `document`/`window`), so they run in `jsc` tests with `tests/fakectx.js`.

## Files you may change (and nothing else)
- `src/art/props.js`
- `tests/props.test.mjs`

## Steps
1. Create `src/art/props.js`. Every function takes a rect `{x,y,w,h}` and `t` (seconds) and draws inside that rect only. Export:
2. `drawTvStatic(ctx, r, t)`: fills the rect with dark grey, then ~60 horizontal 2px noise lines whose grey level, x offset and length derive deterministically from `Math.sin(t*13 + i*7.1)` (no Math.random), plus a slowly rolling brighter band at `y = r.y + ((t*60) % r.h)`, 0.15 alpha. Clip to the rect with save/clip/restore.
3. `drawPhone(ctx, r, t, ringing)`: a chunky cream desk phone (base, handset on top, a coiled cord drawn as a short zig-zag, a round dial); when `ringing` the whole phone shakes `Math.sin(t*40)*2` px horizontally and two small ring arcs pulse above it with `pulse(t, 0.5)`; also draws a tiny red lamp circle on the base.
4. `drawLaptop(ctx, r, t)`: open grey laptop seen from the front: screen with a blue desktop, a tiny line-chart that rises (a polyline whose last point oscillates with `t`), the keyboard base below.
5. `drawNewspaper(ctx, r)`: a folded newspaper lying flat: paper `PALETTE.paper`, a black masthead bar, grey text lines, one photo box.
6. `drawKettle(ctx, r, t)`: a chrome kettle with handle, spout and base; two steam curls animated with `t`.
7. `drawHotspotGlow(ctx, r, t)`: a soft pulsing `PALETTE.lamp` outline (rounded rect stroke 4px, alpha `0.35 + 0.35*pulse(t,1.2)`) around a rect, used to hint tappable things.
8. Write `tests/props.test.mjs`: each function runs without throwing for t = 0, 0.37, 5; `save`/`restore` counts equal; `drawTvStatic` at t=0 and t=0.1 give different logs; `drawPhone` with `ringing` true has more draw calls than with false and its first `translate` or `moveTo` x-values differ between t = 0.01 and t = 0.02 (shake) — assert the logs differ; `drawLaptop` logs differ between t = 0 and t = 1; `drawNewspaper` log is identical for the same input (deterministic); `drawKettle` differs across t; `drawHotspotGlow` sets a `strokeStyle`; no function draws outside its rect by more than 40px: collect every `fillRect`/`strokeRect` x,y,w,h argument set from the log and assert x >= r.x - 40 and x + w <= r.x + r.w + 40 (apply to the simple rect calls only).

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No hit areas, no scenes.

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W54: Animated props: TV, phone, laptop, newspaper, kettle`.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
