[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GC04 Mark head and neck in Blender

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GC04
Needs (already merged into `dev`): GC01, GC02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Mark Webb's bare head as toon-shaded Blender geometry: big caricature head, ears, nose, light stubble band, neck. Hair, glasses and face parts are other cards. Mark is a real friend of the author: keep the shape friendly and rounded, never grotesque.

## Read first
- Blender 5.2 headless: `/opt/homebrew/bin/blender --background --python-exit-code 1 --python <script> -- <args>` (args after the lone `--` are `sys.argv[sys.argv.index('--')+1:]`). Blender's Python has bpy, bmesh, mathutils, numpy and NO PIL. You cannot see images: check files with `file`, `ls -l` and the numbers your own scripts print. Every script must start with `sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))` so it can import its sibling modules, and must run nothing on import (use `if __name__ == '__main__':`).
- tools/art/charlib.py (card GC01: lin, toon_mat, flat_mat, make_mats, sphere, capsule, ring, rbox, empty, attach, set_visible, setup_char_scene, render_png)
- docs/characters/mark.json and docs/characters/dave.json (card GC02)
- docs/art/GC.md sections 'Conventions' and 'Mark likeness'

## Files you may change (and nothing else)
- `tools/art/mark_head.py`

## Steps
1. Create `tools/art/mark_head.py` with `build_head(spec, mats, pivot)`: `spec` is the loaded mark.json dict, `mats` is `make_mats(spec['palette'])`, `pivot` is an Empty at `spec['body']['neck_pivot']` (the caller makes it; set its scale to `head_scale` in the rig, NOT here). Build, all with `attach(obj, pivot)` and local positions relative to the pivot (world position = pivot + local, so the head centre is at local z = `head['center_offset']`): head = `sphere` radii `head['radii']` with 32 segments at local (0,0,c) where c = center_offset, materials slot 0 skin, slot 1 skin_shade; every polygon whose centre has local z < c - 0.11 AND local y < 0.02 gets `material_index = 1` (stubble over the jaw, chin and upper lip); two ears: spheres radii (0.04,0.045,0.07) at (+-radii[0], 0, c-0.02) material `ear`; nose: sphere radii (0.045,0.05,0.06) at (0, -radii[1], c-0.05) skin; neck: `capsule((0,0,-0.10),(0,0,0.0), 0.095, skin, 'neck')`. Return a dict `{'head': obj, 'ears': [..], 'nose': obj, 'neck': obj, 'parts': [every created object]}`.
2. Add `main()` guarded by `if __name__ == '__main__':` for testing: args `--out <png>` and `--report`: `clear_scene()`, load `docs/characters/mark.json` (path relative to this file: `../../docs/characters/mark.json`), `mats`, create the pivot empty at neck_pivot with scale (head_scale,)*3, `build_head`, `setup_char_scene(scene, 'front', (0, 1.52), 1.25, 80, 80)`, `render_png`. With `--report` print `HEAD dx=<..> dz=<..> polys=<n> stubble=<m>` where dx and dz are the head object's world-space bounding-box width and height (use `obj.dimensions` times the pivot scale), n the polygon count and m the count with material_index 1.
3. Run it to `/tmp/gc04.png` with `--report`. The numbers must satisfy: dx between 0.66 and 0.72, dz between 0.74 and 0.84, stubble / polys between 0.15 and 0.45. Then check the PNG with a small python snippet in Blender or `file`: it is 80 x 80 and the opaque pixel bounding box is at least 40 px wide and at least 45 px tall (the head fills the frame; read the pixels through bpy images as in tests/charlib_check.py).

## Acceptance (all must pass; exact commands)
- `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/mark_head.py -- --out /tmp/gc04.png --report` prints `HEAD dx=` and `dz=` and `stubble=` with the ranges above and exits 0.
- `file /tmp/gc04.png` says `80 x 80`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GC04: Mark head and neck in Blender`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
