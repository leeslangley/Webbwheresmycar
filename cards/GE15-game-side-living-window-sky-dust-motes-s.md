[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GE15 Game side: living window sky, dust motes, steam

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GE15
Needs (already merged into `dev`): W43
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Animated things that sit behind or in front of a still plate: the sky seen through the office window (changes with the hour, drifting clouds, moves a few pixels against the pointer), floating dust motes in lamp light, and tea/kettle steam puffs.

## Read first
- src/ui/theme.js (`rgba`)
- tests/fakectx.js
- src/art/props.js (drawKettle: how steam curls are drawn from t)

## Files you may change (and nothing else)
- `src/art/roomfx_world.js`
- `tests/roomfx_world.test.mjs`

## Steps
1. `src/art/roomfx_world.js` (pure; deterministic). `skyColors(hour)` -> `{top, bottom}` hex strings: hour 6..8 `#3b4a8a`/`#f2a65a`; 9..16 `#6fb4ee`/`#d8efff`; 17..19 `#4a3a7a`/`#f08a5d`; otherwise `#0b0d24`/`#1d2450`. `drawSky(ctx, rect, hour, t, look)`: `save`, clip to rect, vertical linear gradient top->bottom over the rect, a sun (hours 6..19: filled circle r 14, colour `#fff2b0`) or moon (otherwise: circle r 10 `#e8ecff`) at `x = rect.x + rect.w * (0.25 + 0.5 * frac)`, `y = rect.y + rect.h * 0.3` where `frac = ((hour % 12) / 12)`; two clouds, each ONE plain `fillRect` (k = 0: width 60 height 16; k = 1: width 44 height 12; colour `rgba('#ffffff', 0.8)`) at `x = rect.x + ((t * 4 + k * 90) % (rect.w + 80)) - 40 - look.x * 4` and `y = rect.y + 30 + 28 * k`; `restore`. `look` may be undefined (treated as {x:0,y:0}).
2. `drawDust(ctx, rect, t, n)`: n motes, mote i at `x = rect.x + (((i * 7919 + 13) % 97) / 97 * rect.w + t * 3 * (1 + i % 3)) % rect.w`, `y = rect.y + ((((i * 6007 + 7) % 89) / 89 * rect.h - t * 2 * (1 + i % 2)) % rect.h + rect.h) % rect.h`, a 2x2 `fillRect` with `rgba('#ffe9c0', 0.25 + 0.2 * Math.sin(t * 1.3 + i))` (alpha never below 0.05).
3. `steamPuffs(ctx, x, y, t, n)`: for k in 0..n-1: `phase = (t * 0.8 + k / n) % 1`; circle (use `ctx.arc`) centre `(x + Math.sin(phase * 6.283 + k) * 6, y - phase * 60)`, radius `4 + phase * 10`, fill `rgba('#ffffff', 0.35 * (1 - phase))`.
4. `tests/roomfx_world.test.mjs` (fakectx): `skyColors(12).top === '#6fb4ee'`, `skyColors(7).bottom === '#f2a65a'`, `skyColors(18).top === '#4a3a7a'`, `skyColors(2).top === '#0b0d24'`; `drawSky` clips once, balanced save/restore, the gradient has two stops with those colours; a daytime call and a night call each make at least one `arc` call (sun or moon); with `rect.w` 160, the `fillRect` call of width 60 (first cloud) has its x reduced by exactly 4 when `look.x` goes from 0 to 1; `drawDust(ctx, rect, 5, 30)` makes 30 `fillRect` calls all inside the rect; `steamPuffs(ctx, 100, 100, 2, 4)` makes 4 `arc` calls and every fillStyle alpha is between 0 and 0.35.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep roomfx_world` shows PASS.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GE15: Game side: living window sky, dust motes, steam`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
