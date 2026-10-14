[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CB11 Pixel stage: palette ramps

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CB11
Needs (already merged into `dev`): A04
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The hand-authored colour ramps for the pixel stage (pure numpy, no bpy): the paint ramp is generated from the car's exact sRGB hex so the colour is always right (the game re-runs the same formula in JavaScript to repaint a car, card CC04); chrome, glass, rubber and lamps use fixed ramps.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts as `/opt/homebrew/bin/blender --background --python-exit-code 1 --python <script> -- <args>` (arguments after the lone `--`). Blender's Python has bpy, bmesh, mathutils and numpy, NOT PIL. An uncaught exception or `sys.exit(1)` makes the command fail, so tests use plain `assert`. You cannot see images: check files with `file`, `ls -l` and the numbers the tests print.
- Pixel-stage constants (all cards CB11-CB20 use exactly these): paint ramp multipliers MULT=[0.10,0.20,0.38,0.65,1.0,1.5,2.3]; shadow tint weights SW=[0.35,0.28,0.18,0.08,0,0,0] toward '#2a1a5c'; highlight weights HW=[0,0,0,0,0,0.20,0.55] toward cream '#fff2cc' (toward white '#ffffff' instead when the base colour's linear luma >= 0.5); outline colour '#120a1e'.
- tools/art/pixelate.py (copy `srgb_to_linear`, `linear_to_srgb`, `LUMA`: do NOT import it, pixramp.py must not import bpy)
- docs/art/CARS_ALIGN.md (THE contract with the CA and CC card sets: densities, views, file names, manifest v2, game mask; it wins over any other text) and docs/art/CB.md (why the numbers were chosen)

## Files you may change (and nothing else)
- `tools/art/pixramp.py`
- `tests/pixramp_test.py`

## Steps
1. Create `tools/art/pixramp.py` (numpy only). Copy the two sRGB/linear functions and `LUMA = [0.2126,0.7152,0.0722]`. Add `hex_rgb(s)` -> float sRGB array 0..1; `lin_hex(lin3)` -> '#rrggbb' (round to 8 bit after `linear_to_srgb`); the constants of the RAMP text above (`MULT, SW, HW, SHADOW_TINT='#2a1a5c', CREAM='#fff2cc', OUTLINE='#120a1e'`).
2. `paint_ramp(hexs)` -> (7,3) LINEAR array. Base colour: if its largest sRGB channel < 0x20/255 use '#202028' instead (near-black paints still need visible shading). `b` = linear base; for i in 0..6: `c = clip(b * MULT[i], 0, 1)`; shadow tint that keeps luma: `c = c + (tint_lin * (c.luma / tint_lin.luma) - c) * SW[i]`; highlight: `c = c*(1-HW[i]) + top*HW[i]` with `top` = white if `b.luma >= 0.5` else the cream (linear); clip to 0..1. Step 4 therefore equals the base colour.
3. `FIXED_HEX` dict: chrome ['#1b1830','#3c3f66','#7a86b0','#b7c6e2','#eaf2ff','#ffffff']; glass ['#0c141c','#1d2f3d','#4a6f86','#bfe0ee']; tyre ['#0d0d12','#1a1a22','#2b2b36']; wall ['#8f8a7c','#cfc8b4','#f2ecd8']; lamp ['#ffd870','#fffbe0']; trim ['#08080c','#1c1c26']; tail ['#7a0e10','#e02418']. `fixed_ramp(name)` -> (k,3) linear.
4. Write `tests/pixramp_test.py` (run under Blender): for hex in '#C96F32','#b02a2a','#3b4a2f','#1c2a6e','#e5e0cf': `lin_hex(paint_ramp(h)[4]) == h.lower()`; 7 distinct rows; luma non-decreasing; luma of row 6 > 0.45; for all except '#e5e0cf' also luma of row 0 < 0.04. '#101010': row 4 equals '#202028' (lift). '#ffffff': at least 5 distinct rows and non-decreasing luma. Sizes of the fixed ramps (6,4,3,3,2,2,2). Reference rows (the game's JS port in card CC04 is tested against the same literals, so never change them; each channel within 1): `[lin_hex(r) for r in paint_ramp('#C96F32')]` is ['#3e203d','#59304e','#7c4458','#a25a53','#c96f32','#f4a36f','#ffd3a3'] and for '#1E4D2B' it is ['#0a121d','#111d27','#172c2f','#1b3d31','#1e4d2b','#808d6c','#c6c6a1']. Print `PIXRAMP OK`.

## Acceptance (all must pass; exact commands)
- `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tests/pixramp_test.py 2>&1 | tail -1` prints `PIXRAMP OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CB11: Pixel stage: palette ramps`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
