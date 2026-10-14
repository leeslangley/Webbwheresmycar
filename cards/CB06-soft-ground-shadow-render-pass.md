[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CB06 Soft ground shadow render pass

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CB06
Needs (already merged into `dev`): CB03
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
A separate shadow-only render (a soft contact shadow as alpha), so the game can draw a real car-shaped shadow under any background without baking dark pixels into the car sprite.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts as `/opt/homebrew/bin/blender --background --python-exit-code 1 --python <script> -- <args>` (arguments after the lone `--`). Blender's Python has bpy, bmesh, mathutils and numpy, NOT PIL. An uncaught exception or `sys.exit(1)` makes the command fail, so tests use plain `assert`. You cannot see images: check files with `file`, `ls -l` and the numbers the tests print.
- Blender 5.2 facts already checked: `ShaderNodeMix` with `data_type='RGBA'` has inputs[0]=Factor, inputs[6]=A, inputs[7]=B and outputs[2]=Result; `Light.size_y` works for `shape='RECTANGLE'`; `obj.visible_camera` (bool) hides an object from the camera but it still casts shadows; `scene.render.dither_intensity = 0.0` stops Blender adding noise to 8-bit PNGs (needed for exact mask values); a Boolean modifier solver must be 'EXACT' or 'MANIFOLD' (not 'FAST').
- tools/art/cbrig.py (CB02-CB05)
- docs/art/CARS_ALIGN.md (THE contract with the CA and CC card sets: densities, views, file names, manifest v2, game mask; it wins over any other text) and docs/art/CB.md (why the numbers were chosen)

## Files you may change (and nothing else)
- `tools/art/cbrig.py`
- `tests/cb_shadow_test.py`

## Steps
1. In `cbrig.py` add `render_shadow(scene, out_png)`. Create the catcher if the scene has none (plane size 40 at z 0, `is_shadow_catcher = True`, remember to remove it at the end). Set every MESH object except the catcher to `visible_camera = False` (they still cast shadows). Hide all LIGHT objects from render and set the world Background strength to 0. Add one SUN light: energy 4.0, `angle = radians(18)`, location (-1.2,-0.8,10) aimed at the origin with `carlib.look_at` (almost overhead, so the shadow sits under the car with a soft edge).
2. Cycles 32 samples, denoising off, `film_transparent` True; the saved PNG alpha is the shadow density, RGB is irrelevant. Then restore everything (visibility, lights, world strength, sun and temporary catcher removed). Do not change the camera.
3. Write `tests/cb_shadow_test.py` (Blender): `cbrig.setup_color_management`, `setup_studio_world`, `setup_studio_lights`, `setup_fixed_camera(scene,'s')`, a 1.0 x 1.0 x 0.5 m box on the ground made with `cbmat.make_paint('#C96F32')`; call `render_shadow(scene,'/tmp/cb_shadow.png')`. Load the PNG (Non-Color). Assert: max alpha >= 0.95; the count of pixels with alpha > 0.5 is between 2000 and 60000; their bounding box lies within x 800 +- 450 px; the mean luma of pixels with alpha > 0.5 is < 0.1; after the call the box has `visible_camera == True` and the light objects are not hidden. Print `CB SHADOW OK`.

## Acceptance (all must pass; exact commands)
- `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tests/cb_shadow_test.py 2>&1 | tail -1` prints `CB SHADOW OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CB06: Soft ground shadow render pass`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
