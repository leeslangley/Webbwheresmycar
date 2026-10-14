[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CC12 Webb TV screen car display

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CC12
Needs (already merged into `dev`): CC07, CC11
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The car shown on the Webb TV in the office tableau (the original shows the band on the telly in the middle of the room): a CRT picture with the owned cars cycling like channels, each with a channel-change static burst.

## Read first
- docs/art/CC.md (the plan: sheets, sizes, API names; read the 'Sprite contract' and 'API' sections)
- src/art/props.js (drawTvStatic)
- src/art/officelayout.js (OFFICE.tvScreen is 278 x 206)
- src/art/modelcar.js (CC07)
- src/art/pixelscale.js (idleBob)

## Files you may change (and nothing else)
- `src/art/tvcar.js`
- `tests/tvcar.test.mjs`

## Steps
1. `src/art/tvcar.js`: `drawTvCar(ctx, r, cars, t)` returns true when it drew a car, false when `cars` is empty (draw nothing then, the office keeps its own static). `n = cars.length`, `period = 5`, `idx = Math.floor(t / period) % n`, `local = t % period`. Clip to `r`. Background: vertical gradient `#0F3B3A` to `#1C6B5F`; a floor band over the bottom 26% `#0A2A2A`; `groundY = r.y + Math.round(r.h * 0.74)`. If `local < 0.35` draw `drawTvStatic(ctx, r, t)` and return true (channel change). Else `drawModelCar(ctx, cars[idx].modelId, r.x + r.w/2, groundY, 1, {cond: cars[idx].condition, t, slot:{w: r.w - 16, h: Math.round(r.h*0.62)}, bob:true, shine:true})`.
2. Overlays: scanlines: for `y = r.y; y < r.y + r.h; y += 3` `fillRect(r.x, y, r.w, 1)` colour `rgba(0,0,0,0.20)`; vignette: four corner `fillRect`s 14 x 14 `rgba(0,0,0,0.25)`; channel bug `WEBB TV` at `(r.x + 10, r.y + 8)` size 12 title font `PALETTE.lightgreen` (hidden for 0.3 s every 4 s: skip when `t % 4 < 0.3`); caption strip at the bottom: `fillRect(r.x, r.y + r.h - 30, r.w, 30)` `rgba(0,0,0,0.55)`, text `modelOf(id).name` centred size 14 title font `PALETTE.cream` `maxW r.w - 12` at `y = r.y + r.h - 22`. Use `import { modelOf } from '../data/cars.js'`.
3. `tests/tvcar.test.mjs` (fake art, ds=1): rect `{x:276,y:136,w:278,h:206}` and cars `[{modelId:'t1_chimp',condition:9},{modelId:'t3_cloudy',condition:4}]`: at t=1 exactly one `drawImage`, image id starts with `t1_chimp|`, and its drawn width <= 262 (S p=1 or L p=1 fits the slot); the car name is in `texts`; at t=0.1 no `drawImage` (static burst) but text is not required; at t=5.5 the second car is shown; at t=1 the clip rect call equals the screen rect; `[]` returns false and makes no calls except none at all (calls length 0); scanline count: at least 60 fillRects with colour `rgba(0,0,0,0.20)`.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep tvcar` shows PASS.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CC12: Webb TV screen car display`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
