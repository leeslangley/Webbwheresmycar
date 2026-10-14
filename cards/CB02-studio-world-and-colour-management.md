[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CB02 Studio world and colour management

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CB02
Needs (already merged into `dev`): V01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
A procedural studio sky for believable chrome and glass reflections, plus the exact colour-management settings.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts as `/opt/homebrew/bin/blender --background --python-exit-code 1 --python <script> -- <args>` (arguments after the lone `--`). Blender's Python has bpy, bmesh, mathutils and numpy, NOT PIL. An uncaught exception or `sys.exit(1)` makes the command fail, so tests use plain `assert`. You cannot see images: check files with `file`, `ls -l` and the numbers the tests print.
- Blender 5.2 facts already checked: `ShaderNodeMix` with `data_type='RGBA'` has inputs[0]=Factor, inputs[6]=A, inputs[7]=B and outputs[2]=Result; `Light.size_y` works for `shape='RECTANGLE'`; `obj.visible_camera` (bool) hides an object from the camera but it still casts shadows; `scene.render.dither_intensity = 0.0` stops Blender adding noise to 8-bit PNGs (needed for exact mask values); a Boolean modifier solver must be 'EXACT' or 'MANIFOLD' (not 'FAST').
- tools/art/carlib.py (`make_mat(name, color, ...)` takes a LINEAR rgb tuple; `set_socket`, `look_at`, `extrude_polygon`, `polygons`, `load_dossier`, `U = 0.1` metres per car unit). WARNING: `carlib.hex_to_rgb` returns sRGB until card V06 lands and LINEAR after it, so the CB modules never call it: cbmat.py has its own `hex_lin(hexs)` (sRGB hex -> linear tuple, formula `c/12.92 if c <= 0.04045 else ((c+0.055)/1.055)**2.4`) and cbrig.py has a private copy `_lin`.
- docs/art/CARS_ALIGN.md (THE contract with the CA and CC card sets: densities, views, file names, manifest v2, game mask; it wins over any other text) and docs/art/CB.md (why the numbers were chosen)

## Files you may change (and nothing else)
- `tools/art/cbrig.py`
- `tests/cb_rig_test.py`

## Steps
1. Create `tools/art/cbrig.py` (imports carlib; nothing runs on import). Add `setup_color_management(scene, exposure=-0.2)`: `view_transform = 'Standard'`, `look = 'None'`, `exposure = exposure`, `scene.render.dither_intensity = 0.0`, `scene.render.film_transparent = True`.
2. Add `setup_studio_world(scene)`: a new world with nodes: Texture Coordinate `Object` -> Vector Math NORMALIZE -> Separate XYZ `Z` -> Map Range (From Min -1, From Max 1, To Min 0, To Max 1) -> Color Ramp -> Background -> World Output. Ramp stops (position: sRGB hex, convert with a private `_lin(hexs)` helper in cbrig.py, see the WARNING above): 0.00 '#17121f', 0.44 '#2a2432', 0.50 '#e9dcc4', 0.58 '#b4c8e6', 0.80 '#5d80b8', 1.00 '#2b4a86' (the default ramp has 2 elements: set them to 0.00 and 1.00 and add the other four with `elements.new`). Background Strength 0.22. Assign it to `scene.world`. This is a dark floor, a bright warm horizon band and a blue sky, so chrome shows a believable horizon.
3. Write `tests/cb_rig_test.py` (Blender): fresh empty scene; call both functions; assert the world has exactly one ColorRamp with 6 elements at positions [0,0.44,0.5,0.58,0.8,1.0] (tolerance 1e-4) and element 3 colour equals `cbrig._lin('#e9dcc4')`; Background Strength is 0.22; `scene.view_settings.view_transform == 'Standard'`; exposure -0.2; `render.film_transparent` True; print `CB RIG OK`.

## Acceptance (all must pass; exact commands)
- `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tests/cb_rig_test.py 2>&1 | tail -1` prints `CB RIG OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CB02: Studio world and colour management`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
