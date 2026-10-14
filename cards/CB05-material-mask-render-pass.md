[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CB05 Material mask render pass

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CB05
Needs (already merged into `dev`): CB01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
A second render of the same scene where every material is a flat known colour, so the pixel stage knows exactly which pixels are paint, chrome, glass, tyre and lamp.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts as `/opt/homebrew/bin/blender --background --python-exit-code 1 --python <script> -- <args>` (arguments after the lone `--`). Blender's Python has bpy, bmesh, mathutils and numpy, NOT PIL. An uncaught exception or `sys.exit(1)` makes the command fail, so tests use plain `assert`. You cannot see images: check files with `file`, `ls -l` and the numbers the tests print.
- Blender 5.2 facts already checked: `ShaderNodeMix` with `data_type='RGBA'` has inputs[0]=Factor, inputs[6]=A, inputs[7]=B and outputs[2]=Result; `Light.size_y` works for `shape='RECTANGLE'`; `obj.visible_camera` (bool) hides an object from the camera but it still casts shadows; `scene.render.dither_intensity = 0.0` stops Blender adding noise to 8-bit PNGs (needed for exact mask values); a Boolean modifier solver must be 'EXACT' or 'MANIFOLD' (not 'FAST').
- tools/art/cbmat.py (CB01: `MASK_RGB`, `class_of`) and tools/art/cbrig.py
- docs/art/CARS_ALIGN.md (THE contract with the CA and CC card sets: densities, views, file names, manifest v2, game mask; it wins over any other text) and docs/art/CB.md (why the numbers were chosen)

## Files you may change (and nothing else)
- `tools/art/cbrig.py`
- `tests/cb_mask_test.py`

## Steps
1. In `cbrig.py` add `render_mask(scene, out_png)`. For every MESH object except `shadow_catcher` and names starting `cut_`, replace each material slot's material by a new flat Emission material (nodes: Emission -> Material Output, Emission Strength 1.0) whose colour is the class colour of the ORIGINAL material name from `cbmat.MASK_RGB` (convert the 8-bit file value v to linear with the sRGB formula `v/255/12.92 if <= 0.04045 else ((v/255+0.055)/1.055)**2.4` so the saved PNG holds exactly v); the class of a name is `cbmat.class_of(name)` (`.001` suffixes stripped, unknown names are 'trim'). Remember the originals.
2. Render settings for the mask only: Cycles samples 1, denoising off, `scene.cycles.filter_width = 0.01`, `view_transform 'Standard'`, exposure 0, `dither_intensity 0.0`, world Background strength 0, shadow catcher hidden from render. Write `out_png` (RGBA 8-bit, film transparent). Then RESTORE everything (materials, samples, denoising, filter width, exposure, world strength, catcher visibility) so the normal render can run afterwards.
3. Write `tests/cb_mask_test.py` (Blender): scene with a paint cube (`cbmat.make_paint('#C96F32')`) and a chrome sphere side by side, camera via `setup_fixed_camera(scene,'s')` (CB04 may not be merged: if `setup_fixed_camera` is missing use an ORTHO camera at (0,-20,1) aimed at (0,0,1) with ortho_scale 7, 400x200), `render_mask(scene,'/tmp/cb_mask.png')`. Load with colorspace 'Non-Color'; among pixels with alpha >= 0.5 every rgb (x255, rounded) is exactly (255,0,0) or (0,255,0) and both occur at least 200 times; every alpha is 0 or 255; after the call the cube's material is still named 'paint'. Print `CB MASK OK`.

## Acceptance (all must pass; exact commands)
- `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tests/cb_mask_test.py 2>&1 | tail -1` prints `CB MASK OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CB05: Material mask render pass`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
