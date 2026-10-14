[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GC01 Character Blender helpers: toon material, shapes, camera

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GC01
Needs (already merged into `dev`): A04
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The shared Blender helper module for all character modelling: a 3-step cel-shaded material (so every frame has few clean colours), primitive shape helpers, and a fixed orthographic camera plus warm-key lighting. Colours must be converted to LINEAR before Blender sees them (the old car code forgot this and renders washed out).

## Read first
- Blender 5.2 headless: `/opt/homebrew/bin/blender --background --python-exit-code 1 --python <script> -- <args>` (args after the lone `--` are `sys.argv[sys.argv.index('--')+1:]`). Blender's Python has bpy, bmesh, mathutils, numpy and NO PIL. You cannot see images: check files with `file`, `ls -l` and the numbers your own scripts print. Every script must start with `sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))` so it can import its sibling modules, and must run nothing on import (use `if __name__ == '__main__':`).
- docs/art/GC.md (the plan: units, frame sizes, joint names, conventions; read it fully)
- tools/art/carlib.py (copy `look_at` from it; do not import it)
- tools/art/pixelate.py (colour handling in linear RGB)

## Files you may change (and nothing else)
- `tools/art/charlib.py`
- `tests/charlib_check.py`
- `tests/run_charlib.sh`

## Steps
1. Create `tools/art/charlib.py` (imports bpy, bmesh, math, sys, `from mathutils import Vector`). Colour: `lin(hexstr)` -> (r,g,b) linear floats (c = v/255; c<=0.04045 -> c/12.92 else ((c+0.055)/1.055)**2.4; a bad hex prints a message and `sys.exit(2)`); `byte(x)` -> linear float to sRGB 0..255 int (inverse formula, clamp 0..1, round).
2. Materials. `toon_mat(name, hexc, ramp=(0.58, 0.86, 1.06), cuts=(0.30, 0.72))`: `m = bpy.data.materials.new(name); m.use_nodes = True; m.node_tree.nodes.clear()`; nodes: Diffuse BSDF (Color white) -> Shader to RGB -> Color Ramp (`interpolation = 'CONSTANT'`; element 0 at 0.0 = grey `ramp[0]`; add elements at `cuts[0]` = grey `ramp[1]` and `cuts[1]` = grey `ramp[2]`) -> Mix node (`data_type='RGBA'`, `blend_type='MULTIPLY'`, Factor 1.0, input A = ramp colour, input B = `lin(hexc)` + alpha 1) -> Emission (Color = Mix 'Result') -> Material Output. `flat_mat(name, hexc)`: Emission only, Color `lin(hexc)`, Strength 1 (used for pupils and outlines so they never shade). `make_mats(palette, flat=('pupil',))`: dict palette-key -> material (`flat_mat` for keys in `flat`, else `toon_mat`).
3. Shapes (all `shade smooth`, all take a material and a name, all return the object): `sphere(loc, scale, mat, name, seg=24)` (UV sphere, radius 1 then `scale` xyz); `capsule(a, b, r, mat, name)` (cylinder from point a to b plus a sphere cap at each end, one object per part is fine, return the cylinder); `ring(loc, major, minor, mat, name)` (torus, major 32 / minor 10 segments, facing the Y axis i.e. rotation (pi/2,0,0)); `rbox(loc, size, bevel, mat, name)` (cube of full size (sx,sy,sz), Bevel modifier width=bevel segments=4, Subsurf level 2); `empty(name, loc, parent=None)`; `attach(obj, parent)` (set parent keeping the world position: `obj.parent = parent; obj.matrix_parent_inverse = parent.matrix_world.inverted()`); `set_visible(objs, shown)` (sets `hide_render` and `hide_viewport` to `not shown`); `clear_scene()` (`bpy.ops.wm.read_factory_settings(use_empty=True)`, returns `bpy.context.scene`); `look_at(obj, target)` copied from carlib.py.
4. Scene. `VIEWS = {'front': 0, 'back': 180, 'q_left': -35, 'q_right': 35}` (camera azimuth degrees around the vertical axis; characters face -Y so the front camera sits at -Y). `setup_char_scene(scene, view, center, ortho, w, h)`: `center` = (x, z) world point at the middle of the image; world background colour (0.16, 0.16, 0.20) strength 1 (NOT white: white ambient flattens all shading); `film_transparent = True`; ONE sun light, energy 2.4, direction vector (0.55, 0.75, -0.8) rotated about Z by the azimuth, applied as `rotation_euler = vec.to_track_quat('-Z','Y').to_euler()` (warm key from upper left front); a second sun, colour #a8c4ff, energy 0.6, direction (-0.4, -0.5, -0.3) rotated the same way (cool rim); orthographic camera with `ortho_scale = ortho`, placed 10 units from (center x, 0, center z) in the azimuth direction (azimuth 0 -> (cx, -10, cz)), looking at (cx, 0, cz); engine `BLENDER_EEVEE`, `view_settings.view_transform = 'Standard'`, resolution w x h, RGBA PNG. `render_png(scene, path)` renders a still to `path`.
5. Test. `tests/charlib_check.py` (run in Blender): build a sphere (radius 1, `toon_mat('t', '#243a66')`), `setup_char_scene(scene, 'front', (0, 0), 2.4, 64, 64)`, `render_png` to `/tmp/charlib_t.png`, load it with `bpy.data.images.load` (set `colorspace_settings.name = 'Non-Color'`; pixels come bottom row first, flip with `[::-1]`) and check: opaque pixels (alpha > 0.99) between 1800 and 2300; the three expected band colours `byte(lin('#243a66') component * k)` for k in 0.58, 0.86, 1.06 (per channel, then `byte`) are each found within +-4 per channel on at least 8 percent of the opaque pixels; mean luminance of the upper-left 32x32 quarter divided by the lower-right quarter is at least 1.15. Print `CHARLIB OK opaque=<n> ratio=<x.xx>` or `CHARLIB FAIL <reason>` and exit 2. `tests/run_charlib.sh` runs it with Blender and prints `CHARLIB OK` only when the output has it. Not part of `make test`.

## Acceptance (all must pass; exact commands)
- `sh tests/run_charlib.sh` prints a line starting `CHARLIB OK`.
- `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/charlib.py` exits 0 and prints nothing about errors (nothing runs on import).
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GC01: Character Blender helpers: toon material, shapes, camera`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
