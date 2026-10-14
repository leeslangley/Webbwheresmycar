[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CC08 Stages: showroom, garage and auction sets

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CC08
Needs (already merged into `dev`): CC06
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
`drawStage(ctx, r, kind, t)`: the fixed tableau the car stands in (like the fixed stage sets of the original game): back wall, floor band, light, drawn inside rect `r`. Three kinds: showroom, garage, auction. Returns where to stand the car.

## Read first
- docs/art/CARS_ALIGN.md (THE sprite contract: views, densities, file names, manifest v2, game mask; it wins over any other text) and docs/art/CC.md (API names and background; its 'Sprite contract' section is superseded)
- src/ui/theme.js (PALETTE, shade, rgba)
- src/ui/scenes/auction.js function drawHall (the plank stage and spotlight to be replaced)

## Files you may change (and nothing else)
- `src/art/stage.js`
- `tests/stage.test.mjs`

## Steps
1. `src/art/stage.js`: `export function drawStage(ctx, r, kind, t)` returns `{groundY, centerX, floorY}` where `centerX = r.x + r.w/2`, `floorY = r.y + Math.round(r.h*0.78)` (top of the floor band) and `groundY = r.y + Math.round(r.h*0.86)` (the car's tyres). Throw `Error('unknown stage ' + kind)` for other kinds. Begin with `save`, `beginPath`, `rect(r.x,r.y,r.w,r.h)`, `clip`; end with `restore`; draw a 4 px `PALETTE.ink` frame with `strokeRect` after the restore. Wall = fillRect(r.x, r.y, r.w, floorY - r.y); floor = fillRect(r.x, floorY, r.w, r.y + r.h - floorY). All shades come from `shade()` or fixed hex below.
2. showroom: wall `#3B3470` with vertical panel seams every 64 px (2 px wide `#2F2A5C`), a dado rail `#6C5EB5` 4 px high at `floorY - 28`, floor `#4A4180` with two-tone tiles: 48 px wide, 12 px high, alternating `#4A4180` and `#5A4F8F` by `(col + row) % 2`, a sign on the wall top-left `ctx.fillText` 'WEBB WHEELS' in `font('title', 14)` colour `PALETTE.lamp`; a spotlight cone polygon from `(centerX, r.y)` widening to `centerX +- r.w*0.30` at `floorY`, `rgba(255,210,122,0.16)`, and a floor pool ellipse at (centerX, groundY) radii (r.w*0.28, 9) `rgba(255,210,122,0.20)`.
3. garage: wall `#5B5F66` with corrugated lines every 6 px (1 px `#4D5158`), floor `#3A3D42` plus an oil stain ellipse `#26282C` under the car (radii r.w*0.18, 6), a strip light bar `#E8F0FF` 120 x 6 at `(centerX - 60, r.y + 10)` that dips to alpha 0.55 when `Math.sin(t * 31) > 0.92` (flicker) with a cool cone `rgba(200,225,255,0.12)`, and a pegboard on the left: rect `#7A5C3A` 120 x 80 at `(r.x + 24, r.y + 24)` with three tool bars (`#C9CCD2`, 4 x 40 px) on it. auction: curtains left and right 90 px wide `#8A1C2B` with fold stripes every 14 px `#6E1422`, a valance across the top 24 px `#6E1422`, plank floor `#433900` with 3 px seams `#2B2400` every 12 px, spot cone and pool in `rgba(255,210,122,0.24)`.
4. `tests/stage.test.mjs`: for each kind and the rects `{x:632,y:168,w:596,h:232}`, `{x:496,y:154,w:728,h:230}`, `{x:120,y:100,w:1040,h:260}`: the first call is `save` and `rect` then `clip` appear before the first `fillRect`; count of `fillRect` >= 8; `groundY` is inside r and larger than `floorY`; `centerX` equals r.x + r.w/2; the first `fillStyle` set differs between the three kinds; garage at t=0 versus t=0.0505 (where `Math.sin(t*31)` is 0.99999, above 0.92) sets a different `globalAlpha` or `fillStyle` for the strip light; an unknown kind throws; save count equals restore count.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep 'stage'` shows PASS.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CC08: Stages: showroom, garage and auction sets`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
