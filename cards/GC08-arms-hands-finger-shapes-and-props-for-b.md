[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GC08 Arms, hands, finger shapes and props for both characters

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GC08
Needs (already merged into `dev`): GC01, GC03
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
A jointed arm (shoulder, elbow, wrist pivots as Blender Empties) with a hand that can take nine finger shapes, plus the four hand props (mug, phone, paper, spanner). Mark and Dave share it; only the sleeve colour and sizes come from the spec. Hands are half of the comedy in these pictures, so they must read clearly at 12 pixels.

## Read first
- Blender 5.2 headless: `/opt/homebrew/bin/blender --background --python-exit-code 1 --python <script> -- <args>` (args after the lone `--` are `sys.argv[sys.argv.index('--')+1:]`). Blender's Python has bpy, bmesh, mathutils, numpy and NO PIL. You cannot see images: check files with `file`, `ls -l` and the numbers your own scripts print. Every script must start with `sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))` so it can import its sibling modules, and must run nothing on import (use `if __name__ == '__main__':`).
- tools/art/charlib.py (card GC01: lin, toon_mat, flat_mat, make_mats, sphere, capsule, ring, rbox, empty, attach, set_visible, setup_char_scene, render_png)
- docs/characters/mark.json and docs/characters/dave.json (card GC02)
- tools/art/poselib.py (HANDS, PROPS, joint conventions)

## Files you may change (and nothing else)
- `tools/art/chararms.py`

## Steps
1. Create `tools/art/chararms.py` with `build_arm(spec, mats, root, side, sleeve_key, skin_key='skin', cuff_key=None)` where `side` is 'L' (world -X) or 'R' (+X). Make Empties `shoulder_<side>` at (sx*shoulder_x, 0, shoulder_z) (parent `root`), `elbow_<side>` at local (0,0,-upper_arm) parented to the shoulder, `wrist_<side>` at local (0,0,-forearm) parented to the elbow. Meshes: upper arm `capsule` in local space from (0,0,0) to (0,0,-upper_arm) radius 0.105 with `mats[sleeve_key]`; forearm likewise radius 0.095 (when `cuff_key` is given the last 0.06 of the forearm uses that material as a second capsule); a shoulder `sphere` radius 0.11 in sleeve colour. Every mesh is attached to its joint empty with `attach`. (Local coordinates: create the capsule at world positions computed from the empty's world position, then `attach`.) Return `{'shoulder': e, 'elbow': e, 'wrist': e, 'hand': hand_dict, 'parts': [...]}` .
2. Hand: `build_hand(mats, wrist, skin_key)`: a palm `sphere` radii (0.075,0.04,0.085) centred 0.075 below the wrist (world), five digits each made of two `capsule` segments (length 0.05 and 0.04, radius 0.017 for fingers, 0.02 thumb) hanging from knuckle empties placed along the palm top: finger x offsets (-0.045,-0.015,0.015,0.045) at height 0.065 below the wrist, thumb at x = -0.07 (for side L) or +0.07 (for side R, mirror) at height 0.04. Store digits as Empties `d<i>_a` (knuckle) and `d<i>_b` (middle joint) so they can rotate about X. `set_hand_shape(hand, name, side)` sets rotations (degrees about the X axis, negative = curl forward): per digit curl table CURL = {relaxed:[0.3,0.35,0.4,0.45,0.5], open:[0.1,0,0,0,0], fist:[0.8,1,1,1,1], point:[0.9,0,1,1,1], thumbs:[0,1,1,1,1], flat:[0,0,0,0,0], phone:[0.7,0.8,0.8,0.8,0.8], spread:[0,0,0,0,0], grip:[0.5,0.7,0.7,0.7,0.7]} (digit order thumb, index, middle, ring, pinky); knuckle rotation = -curl*70, middle joint = -curl*85; SPREAD_DEG = {open:14, spread:34, others:0} applied as rotation about Y fanning the four fingers (index outward). `thumbs` also rotates the thumb knuckle about Z by 70 degrees so it points up. Unknown name: raise ValueError.
3. Props: `build_prop(mats, wrist, side, name)` returns a list of objects attached to the `wrist` empty and visible only for that name (the rig keeps one prop per hand and toggles `set_visible`): `mug` = cylinder radius 0.075 depth 0.17 (use `bpy.ops.mesh.primitive_cylinder_add`, material `mug`) centred 0.12 below the wrist and slightly forward (y -0.05), plus a handle `ring` (major 0.05 minor 0.012) on the outer side, plus a tea disc (cylinder radius 0.065 depth 0.01, material `tea`) at the top; `phone` = `rbox` size (0.07,0.05,0.22) bevel 0.02 colour of palette key `phone` or, if missing, `white`, held vertical beside the head (centred at (0,-0.04,-0.05) from the wrist); `paper` = `rbox` size (0.5,0.012,0.36) bevel 0.004 colour `white`, centred (0.0,-0.10,-0.10) from the wrist; `spanner` = `capsule` from (0,0,0.05) to (0,0,-0.45) radius 0.025 material `spanner` plus a `ring` head (major 0.07 minor 0.02) at the end. Missing palette keys fall back to `white`.
4. Test `main()` (`--spec mark|dave --shape <name> --prop <name> --out <png> --report`): build an empty root, `build_arm(...,'R', 'navy' (mark) or 'sleeve' (dave))`, `set_hand_shape`, rotate `shoulder_R` by (-90, 0, 0) degrees (arm forward) and `elbow_R` by (-45, 0, 0), add the prop, render a 128x128 view from the FRONT with `setup_char_scene(scene,'front',(0.45,0.7),1.6,128,128)`. `--report` prints `ARM wrist_world=(<x>,<y>,<z>) expected=(<x>,<y>,<z>)` (wrist = `wrist.matrix_world.translation`). For Mark the expected value is (0.45, -0.689, 1.249): the upper arm points forward so the elbow is at (0.45, -0.42, 0.98); the forearm is rotated a total of -135 degrees from hanging, so it points forward and up by 0.38*(0.7071, 0.7071). Compute the expected value in the code from `spec` lengths with that formula, print it, and fail (exit 2, `ARM FAIL`) when any axis differs by more than 0.02.

## Acceptance (all must pass; exact commands)
- `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/chararms.py -- --spec mark --shape fist --prop mug --out /tmp/gc08.png --report` prints `ARM wrist_world=` and `expected=` that agree within 0.02 per axis.
- `... -- --spec dave --shape point --prop spanner --out /tmp/gc08b.png --report` exits 0; and `--shape nonsense` exits non-zero with a ValueError message.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GC08: Arms, hands, finger shapes and props for both characters`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
