[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GC05 Mark curly hair in Blender

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GC05
Needs (already merged into `dev`): GC04
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Mark's big tousled curly brown hair as a seeded cluster of toon-shaded curls that covers the whole head (top, sides, fringe AND the back, so the back view has no bald patch).

## Read first
- Blender 5.2 headless: `/opt/homebrew/bin/blender --background --python-exit-code 1 --python <script> -- <args>` (args after the lone `--` are `sys.argv[sys.argv.index('--')+1:]`). Blender's Python has bpy, bmesh, mathutils, numpy and NO PIL. You cannot see images: check files with `file`, `ls -l` and the numbers your own scripts print. Every script must start with `sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))` so it can import its sibling modules, and must run nothing on import (use `if __name__ == '__main__':`).
- tools/art/charlib.py (card GC01: lin, toon_mat, flat_mat, make_mats, sphere, capsule, ring, rbox, empty, attach, set_visible, setup_char_scene, render_png)
- docs/characters/mark.json and docs/characters/dave.json (card GC02)
- tools/art/mark_head.py (build_head and its main(): copy the test harness)
- docs/art/GC.md section 'Mark likeness'

## Files you may change (and nothing else)
- `tools/art/mark_hair.py`

## Steps
1. Create `tools/art/mark_hair.py` with `build_hair(spec, mats, pivot)` using `random.Random(spec['hair']['seed'])`. Local coordinates relative to the pivot, c = `head['center_offset']`, radii (rx,ry,rz) = `head['radii']`. (a) 46 crown curls: repeat until 46 are made: `th = rng.uniform(0, 0.62*pi)`, `ph = rng.uniform(0, 2*pi)`, position (sin(th)*cos(ph)*rx*1.05, sin(th)*sin(ph)*ry*1.05, c + cos(th)*rz*1.05 + 0.01); SKIP the sample when its y < -0.10 and th > 0.9 (keeps the forehead clear); curl radius `s = rng.uniform(*hair['radius'])`. (b) 12 nape curls: `th = rng.uniform(0.5*pi, 0.8*pi)`, `ph = rng.uniform(0.15*pi, 0.85*pi)` (the back half, y > 0), same formula with factor 0.95. (c) 6 fringe curls over the forehead at x in (-0.19,-0.11,-0.04,0.04,0.11,0.19), y = -ry*0.77, z = c + rz*0.70 + 0.012*(i % 2), radius 0.07. (d) 2 sideburn curls at (+-rx*0.98, -0.02, c - 0.08), radius 0.06. Every curl is `sphere(pos, (s, s, s*0.92), mat, 'curl', seg=12)` with material `hair` for 65 percent, `hair_dark` for 25 percent and `hair_light` for 10 percent (choose with one `rng.random()` per curl, always drawn in the same order so a seed gives the same hair). `attach` each to the pivot. Return `{'curls': [...], 'parts': [...]}`; total curls must equal `hair['curls']` (66 = 46 crown + 12 nape + 6 fringe + 2 sideburns; mark.json already says 66). Return `{'curls': [...], 'parts': [...]}`.
2. Add a `main()` like mark_head.py (`--out`, `--report`, `--view front|back`): build head AND hair, `setup_char_scene(scene, view, (0, 1.52), 1.25, 80, 80)`, render. `--report` prints `HAIR curls=<n> top_z=<max world z of any curl centre + its radius> back_cover=<k>` where `k` = number of curls with local y > 0.05 (should be many).
3. Determinism test: run the script twice with `--report` and make sure the reports are identical. Coverage test in the script itself (print `HAIR COVER OK` or `HAIR COVER FAIL <angle>` and exit 2): divide the head into 8 azimuth sectors (45 degrees each around the vertical axis) and require at least 3 curls (by their azimuth `atan2(y, x)`) in every sector.
4. Render `--view back` to /tmp/gc05_back.png: the opaque bounding box must be at least 40 px wide.

## Acceptance (all must pass; exact commands)
- `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/mark_hair.py -- --out /tmp/gc05.png --report` prints `HAIR curls=66` (or the exact count your code makes, and report it) and `HAIR COVER OK`.
- Running it twice gives identical `HAIR curls=` lines (diff the outputs).
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GC05: Mark curly hair in Blender`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
