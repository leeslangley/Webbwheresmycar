[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GC10 Dave head: bald, flat cap, moustache, big nose

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GC10
Needs (already merged into `dev`): GC06
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Dave 'Spanner' Dobbs's head in toon-shaded Blender geometry, same pivot convention as Mark's head, with the shared face builder on top.

## Read first
- Blender 5.2 headless: `/opt/homebrew/bin/blender --background --python-exit-code 1 --python <script> -- <args>` (args after the lone `--` are `sys.argv[sys.argv.index('--')+1:]`). Blender's Python has bpy, bmesh, mathutils, numpy and NO PIL. You cannot see images: check files with `file`, `ls -l` and the numbers your own scripts print. Every script must start with `sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))` so it can import its sibling modules, and must run nothing on import (use `if __name__ == '__main__':`).
- tools/art/charlib.py (card GC01: lin, toon_mat, flat_mat, make_mats, sphere, capsule, ring, rbox, empty, attach, set_visible, setup_char_scene, render_png)
- docs/characters/mark.json and docs/characters/dave.json (card GC02)
- tools/art/mark_head.py and tools/art/charface.py (conventions, test harness)

## Files you may change (and nothing else)
- `tools/art/dave_head.py`

## Steps
1. Create `tools/art/dave_head.py` with `build_head(spec, mats, pivot)` and local coordinates as in mark_head.py (c = `head['center_offset']` = 0.30): head `sphere` radii `head['radii']` at (0,0,c) skin, material slot 1 skin_shade for faces whose local z < c-0.12 and y < 0.02 (a faint five-o'clock shadow); ears: spheres radii (0.05,0.05,0.085) at (+-radii[0], 0, c-0.02) `ear`; big round nose: sphere radii (0.075,0.07,0.07) at (0, -radii[1]-0.005, c-0.04) material `nose`; neck: `capsule((0,0,-0.10),(0,0,0.0), 0.12, skin, 'neck')`; two grey side tufts: spheres radii (0.05,0.05,0.07) at (+-(radii[0]-0.01), 0.02, c+0.03) material `hair_grey`; return `{'parts': [...], 'head': obj, 'nose': obj}`.
2. Cap: `build_cap(spec, mats, pivot)`: dome `sphere` radii (0.31,0.30,0.13) at (0, 0, c+0.19) material `cap`; a band `ring((0,0,c+0.14),0.28,0.025, mats['cap_dark'])` scaled (1.07,1.0,1.0) in X; the peak: `rbox((0,-0.30,c+0.15),(0.30,0.22,0.03),0.012, mats['cap_dark'],'peak')` rotated -12 degrees about X (`rotation_euler[0] = radians(-12)`); a small button `sphere((0,0,c+0.32),(0.025,0.025,0.025), cap_dark)`. Moustache: `build_moustache(spec, mats, pivot)`: from the spec `moustache.span` s: two `capsule`s from (0, -0.26, c-0.115) to (+-s, -0.245, c-0.125) radius 0.04 plus drooping tips `capsule((+-s, -0.245, c-0.125), (+-(s+0.04), -0.23, c-0.185), 0.032)` all material `moustache`.
3. Test `main()` (`--out`, `--face <name>`, `--report`): pivot empty scale head_scale (1.25) at the Dave neck pivot (0,0,1.58), head, cap, moustache, glasses none, face via `charface.build_face(spec, mats, pivot, face)`, render 80x80 with `setup_char_scene(scene,'front',(0, 1.58+0.30*1.25),1.25,80,80)`. `--report` prints `DAVE HEAD dx=<w> dz=<h incl cap> parts=<n>`: dx (bounding box of the head object alone) must be 0.68..0.72 (2*0.28*1.25 = 0.70) and dz (bounding box of the head and cap objects together) 0.75..0.95. The render must be 80x80 and its opaque bounding box at least 40 px wide.

## Acceptance (all must pass; exact commands)
- `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/dave_head.py -- --out /tmp/gc10.png --face neutral --report` prints `DAVE HEAD dx=` in 0.68..0.72 and exits 0.
- `... --face laugh` and `--face panic` also exit 0.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GC10: Dave head: bald, flat cap, moustache, big nose`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
