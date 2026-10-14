[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CB01 Car materials: paint, chrome, glass, rubber, lamps

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CB01
Needs (already merged into `dev`): V01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
One module that builds every car material with fixed numbers (period paint, real chrome, dark glass, rubber, lamp glow), and the table of flat colours used by the material-mask render later.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts as `/opt/homebrew/bin/blender --background --python-exit-code 1 --python <script> -- <args>` (arguments after the lone `--`). Blender's Python has bpy, bmesh, mathutils and numpy, NOT PIL. An uncaught exception or `sys.exit(1)` makes the command fail, so tests use plain `assert`. You cannot see images: check files with `file`, `ls -l` and the numbers the tests print.
- Blender 5.2 facts already checked: `ShaderNodeMix` with `data_type='RGBA'` has inputs[0]=Factor, inputs[6]=A, inputs[7]=B and outputs[2]=Result; `Light.size_y` works for `shape='RECTANGLE'`; `obj.visible_camera` (bool) hides an object from the camera but it still casts shadows; `scene.render.dither_intensity = 0.0` stops Blender adding noise to 8-bit PNGs (needed for exact mask values); a Boolean modifier solver must be 'EXACT' or 'MANIFOLD' (not 'FAST').
- tools/art/carlib.py (`make_mat(name, color, ...)` takes a LINEAR rgb tuple; `set_socket`, `look_at`, `extrude_polygon`, `polygons`, `load_dossier`, `U = 0.1` metres per car unit). WARNING: `carlib.hex_to_rgb` returns sRGB until card V06 lands and LINEAR after it, so the CB modules never call it: cbmat.py has its own `hex_lin(hexs)` (sRGB hex -> linear tuple, formula `c/12.92 if c <= 0.04045 else ((c+0.055)/1.055)**2.4`) and cbrig.py has a private copy `_lin`.
- tools/art/carlib.py `make_mat` (copy how it sets sockets), and docs/art/CARS_ALIGN.md (THE contract with the CA and CC card sets: densities, views, file names, manifest v2, game mask; it wins over any other text) and docs/art/CB.md (why the numbers were chosen)

## Files you may change (and nothing else)
- `tools/art/cbmat.py`
- `tests/cb_mat_test.py`

## Steps
1. Create `tools/art/cbmat.py` (imports `carlib` from its own folder like blender_car2.py does; nothing runs on import). Add `hex_lin(hexs)` (see the WARNING above; exit 2 with a message for a bad colour) and `MASK_RGB = {'paint':(255,0,0),'chrome':(0,255,0),'glass':(0,0,255),'tyre':(255,255,0),'wall':(255,255,255),'lamp':(255,0,255),'trim':(0,255,255),'tail':(0,0,0),'paint2':(128,0,0)}` (8-bit FILE values, used by card CB05). Add `MASK_CLASS`: every material name a part card may use -> one of those 9 classes (the 9 names map to themselves; alloy, brass -> chrome; plate_white, plate_yellow -> wall; lamp_white, lamp_amber -> lamp; lamp_red -> tail; black, dark, vinyl, fabric, leather -> trim) and `class_of(name)`: strip a Blender suffix such as `.001`, look the name up, unknown names give 'trim' (never 'paint').
2. Add `make_paint(hexs, finish='solid', name='paint')`: a Principled BSDF with Roughness 0.32, Coat Weight 1.0, Coat Roughness 0.02, Metallic 0.25 when `finish == 'metallic'` else 0.0. Colour flop: a Layer Weight node (Blend 0.5) `Facing` output drives the Factor of a Mix node (data_type 'RGBA'); A = `hex_lin(hexs)`; B = the same colour with 0.10 added to every channel (capped at 1.0) for 'metallic', or equal to A for 'solid'; the Mix Result goes to Base Color. Name the material `name`.
3. Add these, each a `carlib.make_mat` call, material name equal to the class name: `make_chrome()` colour '#f2f2f4' metallic 1.0 roughness 0.04; `make_glass()` colour '#1b2830' roughness 0.02 coat 1.0 coat_rough 0.0 (OPAQUE dark glass, alpha 1: it keeps the pixel art crisp and hides the unmodelled interior); `make_tyre()` '#16161a' roughness 0.85; `make_whitewall()` (name 'wall') '#e8e2d0' roughness 0.7; `make_lamp()` colour '#fff1c0' roughness 0.1 emission '#ffe9a8' strength 6.0; `make_trim()` '#0e0e10' roughness 0.55; `make_tail()` '#c01818' roughness 0.2 emission '#ff2010' strength 1.5.
4. Add `make_all(hexs, finish='solid', hex2=None)` returning a dict with keys `paint, glass, chrome, tyre, whitewall, lamp, trim, tail` (and `paint2` = `make_paint(hex2, finish, 'paint2')` only when hex2 is given). The old V03/V04/V05 code reads `mats['glass']`, `mats['chrome']`, `mats['tyre']`: keep those keys. Write `tests/cb_mat_test.py` (run under Blender): call `bpy.ops.wm.read_factory_settings(use_empty=True)` then `make_all('#C96F32','metallic','#202020')`; assert the exact Principled values above for every material (use abs diff < 1e-6), the paint Mix node A equals `cbmat.hex_lin('#C96F32')` and B equals A + 0.10 capped; with `finish='solid'` Metallic is 0.0 and B equals A; `MASK_RGB` has 9 distinct values; `class_of('paint.001') == 'paint'`, `class_of('lamp_red') == 'tail'`, `class_of('plate_yellow') == 'wall'`, `class_of('zzz') == 'trim'`; print `CB MAT OK`.

## Acceptance (all must pass; exact commands)
- `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tests/cb_mat_test.py 2>&1 | tail -1` prints `CB MAT OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CB01: Car materials: paint, chrome, glass, rubber, lamps`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
