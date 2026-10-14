[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CB03 Studio light rig and chrome probe test

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CB03
Needs (already merged into `dev`): CB01, CB02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The key / rim / fill / overhead-strip lights, tested by rendering a chrome ball and measuring it.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts as `/opt/homebrew/bin/blender --background --python-exit-code 1 --python <script> -- <args>` (arguments after the lone `--`). Blender's Python has bpy, bmesh, mathutils and numpy, NOT PIL. An uncaught exception or `sys.exit(1)` makes the command fail, so tests use plain `assert`. You cannot see images: check files with `file`, `ls -l` and the numbers the tests print.
- Blender 5.2 facts already checked: `ShaderNodeMix` with `data_type='RGBA'` has inputs[0]=Factor, inputs[6]=A, inputs[7]=B and outputs[2]=Result; `Light.size_y` works for `shape='RECTANGLE'`; `obj.visible_camera` (bool) hides an object from the camera but it still casts shadows; `scene.render.dither_intensity = 0.0` stops Blender adding noise to 8-bit PNGs (needed for exact mask values); a Boolean modifier solver must be 'EXACT' or 'MANIFOLD' (not 'FAST').
- tools/art/cbrig.py and tests/cb_rig_test.py (CB02) and tools/art/cbmat.py (CB01)
- docs/art/CARS_ALIGN.md (THE contract with the CA and CC card sets: densities, views, file names, manifest v2, game mask; it wins over any other text) and docs/art/CB.md (why the numbers were chosen)

## Files you may change (and nothing else)
- `tools/art/cbrig.py`
- `tests/cb_rig_test.py`

## Steps
1. In `cbrig.py` add `STUDIO_LIGHTS` = list of (name, hex, watts, size_x, size_y, location, target): ('top','#fff6e6',900,9.0,1.6,(0,-1.0,7.5),(0,0,1.2)), ('key','#ffe9cc',1400,4.5,3.0,(-6.5,-8.5,5.5),(0,0,1.5)), ('rim','#a9c6ff',800,7.0,1.2,(7.5,6.5,4.5),(0,0,1.5)), ('fill','#dfe8ff',220,7.0,1.5,(8.0,-7.5,1.2),(0,0,1.5)), ('stripL','#ffffff',400,1.2,5.0,(-10,-3,2.0),(0,0,1.0)), ('stripR','#ffffff',300,1.2,5.0,(10,-3,2.0),(0,0,1.0)). Add `setup_studio_lights(scene)`: for each, an AREA light (`shape='RECTANGLE'`, `size = size_x`, `size_y`), colour `_lin(hex)`, energy = watts, at the location, aimed with `carlib.look_at(obj, target)`, named `name`. (Warm key from upper left front, cool rim from behind right, long overhead strip for the highlight along the shoulder line, tall strips for chrome.)
2. Extend `tests/cb_rig_test.py` with a probe: after the CB02 checks, build a fresh scene: `setup_color_management`, `setup_studio_world`, `setup_studio_lights`, a UV sphere radius 1.0 at (0,0,1.0) with `cbmat.make_chrome()` (smooth shaded), an ORTHO camera ortho_scale 3.0 at (0,-20,1.0) aimed at (0,0,1.0), Cycles CPU 32 samples, denoise off, 128x128, PNG to `/tmp/cb_probe.png`. Load it with `bpy.data.images.load` (colorspace 'Non-Color'), take the pixels with alpha > 0.5, luma = 0.2126 r + 0.7152 g + 0.0722 b.
3. Assert on the ball's opaque pixels: mean luma of the upper half >= 2.0 x mean luma of the lower half; max luma >= 0.95; at least 5 percent of pixels have luma > 0.9 (the softbox highlights); at least 10 percent have luma < 0.1 (dark floor reflection). Print the four numbers on one line `PROBE up=.. low=.. max=.. bright=.. dark=..` and `CB RIG OK` at the end. If a threshold fails because of the ball and not the code, report the printed numbers in your summary instead of changing the light table.

## Acceptance (all must pass; exact commands)
- `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tests/cb_rig_test.py 2>&1 | tail -2` shows the `PROBE` line and `CB RIG OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CB03: Studio light rig and chrome probe test`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
