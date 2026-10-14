[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GE18 Tellies and laptops: glass glare, scanlines, vignette

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GE18
Needs (already merged into `dev`): GE14
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The TV shop and the advertising laptop are full-screen devices. Give their glass depth with the shared light effects, without moving any button or list (their LAYOUT constants and hit areas must not change).

## Read first
- src/ui/scenes/tvshop.js (draw: the BEZEL/SCREEN panels and scanlines, step 1)
- src/ui/scenes/adverts.js (draw: BEZEL and SCREEN)
- src/art/roomfx_light.js (GE14: `glassGlare`, `vignette`, `grain`)

## Files you may change (and nothing else)
- `src/ui/scenes/tvshop.js`
- `src/ui/scenes/adverts.js`
- `tests/scene_device_glass.test.mjs`

## Steps
1. In tvshop.js `draw`: right after the existing scanline loop (end of 'step 1') call `glassGlare(ctx, SCREEN, t)` and `vignette(ctx, 1280, 720, 0.28)`. Import them from `../../art/roomfx_light.js`. Remove nothing else.
2. In adverts.js `draw`: right after `ctx.fillRect(SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h)` call `glassGlare(ctx, SCREEN, t)` and `vignette(ctx, 1280, 720, 0.22)`. In both scenes add `grain(ctx, 1280, 720, t, 40)` at the very END of draw (grain over everything, 40 specks).
3. `tests/scene_device_glass.test.mjs`: draw tvshopScene and advertsScene once with fakectx/fakeapp (see tests/scene_adverts.test.mjs and tests/scene_tvshop_input.test.mjs for how the app and state are built); in both, a `clip` call exists whose rect equals `[SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h]` (use the numbers 32,32,1208,656 for tv and 32,28,1216,676 for adverts) and the last 40 `fillRect` calls are 2x2 specks. Layout guard: `LAYOUT.buy` of tvshop still deep-equals `{x:640,y:600,w:290,h:64}` and `LAYOUT.run` of adverts still `{x:660,y:560,w:580,h:70}`.

## Acceptance (all must pass; exact commands)
- `sh tools/run_tests.sh 2>&1 | grep -E 'scene_device_glass|scene_tvshop|scene_adverts'` shows PASS for all.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GE18: Tellies and laptops: glass glare, scanlines, vignette`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
