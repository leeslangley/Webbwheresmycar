[Project: Webbwheresmycar]
# Task: [GLM-SPARK] GLM-5.3-Flash W72 CRT filter overlay

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: W72
Needs (already merged into `dev`): W44, W43
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (GLM-5.3-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
An optional retro screen effect (scanlines, vignette, faint flicker) drawn over the finished frame.

## Read first
- docs/DESIGN.md section 3 (optional CRT filter)
- src/ui/theme.js (rgba)

## Files you may change (and nothing else)
- `src/art/crt.js`
- `tests/crt.test.mjs`

## Steps
1. Create `src/art/crt.js` exporting `drawCrt(ctx, w, h, t)`: (1) scanlines: for every 3rd pixel row `y` in 0..h draw a 1px `fillRect(0, y, w, 1)` with `rgba('#000000', 0.18)` (use a single path or a repeated pattern: at most `ceil(h/3)` fillRect calls); (2) vignette: a radial gradient centred in the screen from transparent at 55% of the radius to `rgba('#000000',0.45)` at the corners, filled over the whole screen; (3) flicker: a full-screen `fillRect` with `rgba('#ffffff', 0.012 + 0.008*Math.sin(t*53))`.
2. Write `tests/crt.test.mjs`: `drawCrt(ctx,1280,720,0)` makes exactly 240 scanline `fillRect` calls with height 1 (plus other fillRects: assert at least 240 and at most 245 fillRect calls in total), uses `createRadialGradient` once, `save`/`restore` balanced; two different `t` values give different flicker alpha (logs differ); no call writes outside 0..w by more than 0 pixels.

## Acceptance (all must pass; exact commands)
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- No wiring (a later card hooks it into the draw loop when `settings.crt` is on).

## Rules for every card (do not skip)
- Work only inside your worktree. Read `docs/DESIGN.md` (the sections named in "Read first") before you write anything.
- Stack and purity rules are DESIGN.md section 9.1: plain ES modules; no DOM, `Math.random` or `Date` in `src/core`, `src/data`, `src/sim`, `src/save`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Change only the files in "Files you may change". Prove it with `git diff --stat dev...HEAD`.
- Run `make test` and paste the real last lines of its output into your summary.
- Self-review before you finish: re-read `git diff`, re-run every Acceptance command, try to break your code with bad or missing inputs, fix what you find. Commit in the worktree with the message `W72: CRT filter overlay`.
- If something is ambiguous, or cannot pass without leaving scope, finish with `STATUS: BLOCKED` and the question. Do not guess.
