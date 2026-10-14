[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GC06 Face parts for both characters: eyes, brows, mouths, glasses

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GC06
Needs (already merged into `dev`): GC03, GC04
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
One module that builds a face expression from the table in expressions.json on any head (Mark with round glasses, Dave with bushy brows and no glasses). The renderer deletes and rebuilds the face for each of the 16 faces.

## Read first
- Blender 5.2 headless: `/opt/homebrew/bin/blender --background --python-exit-code 1 --python <script> -- <args>` (args after the lone `--` are `sys.argv[sys.argv.index('--')+1:]`). Blender's Python has bpy, bmesh, mathutils, numpy and NO PIL. You cannot see images: check files with `file`, `ls -l` and the numbers your own scripts print. Every script must start with `sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))` so it can import its sibling modules, and must run nothing on import (use `if __name__ == '__main__':`).
- tools/art/charlib.py (card GC01: lin, toon_mat, flat_mat, make_mats, sphere, capsule, ring, rbox, empty, attach, set_visible, setup_char_scene, render_png)
- docs/characters/mark.json and docs/characters/dave.json (card GC02)
- docs/characters/expressions.json (card GC03)
- tools/art/mark_head.py

## Files you may change (and nothing else)
- `tools/art/charface.py`

## Steps
1. Create `tools/art/charface.py` with `load_expressions()` (reads `../../docs/characters/expressions.json` relative to the file) and `build_face(spec, mats, pivot, face_name, expr=None)`. Local coordinates relative to the head pivot, c = `head['center_offset']`, f = `spec['face']`. For each side sx in (-1, 1): eye white `sphere((sx*f.eye_x, f.eye_y, c+f.eye_z), (rx, ry, rz*open), mats['white'], 'eye')` where (rx,ry,rz) = `f.eye_radii` and `open` = the face's eye.open clamped to at least 0.08; pupil `sphere((sx*f.eye_x + dx, f.eye_y-0.027, c+f.eye_z + dz), (0.026*p, 0.012, 0.03*p*min(open,1)), mats['pupil'], 'pupil')` (flat pupil material; `p` = eye.pupil, `dx`,`dz` = eye.dx, eye.dz from the table); brow = `capsule` from the OUTER end (sx*0.175, f.eye_y+0.005, c + 0.16 + outer) to the INNER end (sx*0.05, f.eye_y-0.01, c + 0.185 + inner) with radius `f.brow_thick`, material `mats[f.brow_color]`.
2. Mouth: `m = mouths[face['mouth']]`; centre (0, f.mouth_y, c + f.mouth_z). Build the lip shape as an ellipse `sphere(centre, (m.w, 0.02, max(m.h, 0.004)), mats['lip'], 'mouth')`; when `m.curve` is not 0 build the line mouths (h < 0.01) as TWO capsules from the centre corners (+-m.w, y, z + m.curve*0.025) to the middle (0, y, z - m.curve*0.012), radius 0.011, material lip; when `m.teeth` add a white `sphere` at (0, y-0.011, z + m.h*0.35) radii (m.w*0.8, 0.012, m.h*0.28); when `m.tongue` add a `sphere` coloured with the palette key `lip` at (0, y-0.006, z - m.h*0.3) radii (m.w*0.5, 0.01, m.h*0.28) (use `mats['lip']` darkened: just reuse lip).
3. Glasses: `build_glasses(spec, mats, pivot)` when `spec['glasses']` is not null: for each side a `ring((sx*f.eye_x, f.eye_y-0.027, c+f.eye_z), glasses.rim_radius, glasses.rim_thickness, mats['rim'], 'rim')`; a bridge `capsule((-0.017, f.eye_y-0.031, c+f.eye_z+0.005), (0.017, same y, same z), 0.01, rim)`; temple arms `capsule((sx*(f.eye_x+0.085), f.eye_y-0.0, c+f.eye_z+0.005), (sx*(head.radii[0]), f.eye_y+0.085, c+f.eye_z+0.005), 0.009, rim)`. Glasses are separate so the renderer keeps them while faces change. Both functions return `{'parts': [...]}`; `build_face` also returns `parts`.
4. Test in `main()` (`--spec mark|dave --face <name> --out <png> --report`): clear the scene, load the spec, make the pivot empty with scale head_scale, build_head (Mark: from mark_head.py; for Dave use a plain `sphere` radii `head.radii` skin material, because dave_head.py comes later), glasses when present, the face, render an 80x80 front view as before (`center (0, pivot z + c*head_scale)`). `--report` prints `FACE <name> parts=<n> mouth=<mouth key>`. Run all 16 faces for Mark in a loop script in /tmp (not committed) and check each prints and renders without error; additionally for faces `neutral` and `panic` render both and compare: the two PNGs differ in at least 40 pixels (read them with numpy in Blender).

## Acceptance (all must pass; exact commands)
- `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/charface.py -- --spec mark --face panic --out /tmp/gc06.png --report` prints `FACE panic parts=` and `mouth=wide`.
- The same command with `--face neutral --spec dave` prints `mouth=closed` and exits 0.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GC06: Face parts for both characters: eyes, brows, mouths, glasses`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
