[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GE04 Room kit: shell (wall, floor, window, frames, bunting)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GE04
Needs (already merged into `dev`): GE02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The reusable parts every room has: materials, back wall with transparent openings, floor and skirting, cornice, window with blinds, framed poster, corkboard, bunting, radiator.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts like `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/<script>.py -- <args>` (everything after the lone `--` is for your script: `sys.argv[sys.argv.index('--')+1:]`). Blender's Python has bpy, bmesh, mathutils and numpy, NOT PIL. You cannot see images: check files with `file`, `ls -l` and the numbers the check scripts print. Do NOT add Blender scripts to `make test` (slow).
- tools/art/roomlib.py (GE02)
- docs/art/ge_proto/roomkit.py (the 'shell' section and `make_materials`)

## Files you may change (and nothing else)
- `tools/art/roomkit_shell.py`
- `tests/run_roomkit_shell.sh`

## Steps
1. Create `tools/art/roomkit_shell.py` (no code runs on import; `from roomlib import *` after `sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))`). Copy from the prototype `roomkit.py`: `WALL_D`, `make_materials()` (the whole dict, keys unchanged: wall, skirt, oak, oakdark, floor, cream, black, steel, grey, brass, red, green, paper, blind, cork, rug, rugb, door, hazard, tyre, screen, glow, plant, pot, tin), `wall_with_openings(M, openings, top_py=-300, left_px=-100, right_px=1380)`, `floor_and_skirting(M)`, `cornice(M, py=96)`, `window(M, r, blinds=True)`, `framed_poster(M, r, bands=())`, `corkboard(M, r, slips=())`, `bunting(M, y_px, x0=20, step=62, n=20, sag=12, names=('red','cream','green'))`, `radiator(M, r)`. Keep object names (`wall`, `floor`, `slat0`...).
2. Create `tests/run_roomkit_shell.sh` (sh, repo root): Blender `--python-expr` builds `sc=R.reset(); R.setup_camera(sc,320,180); R.setup_render(sc,'/tmp/ge04.png',8); M=K.make_materials(); K.wall_with_openings(M,[(30,150,160,170)]); K.floor_and_skirting(M); K.cornice(M); K.window(M,(30,150,160,170)); K.framed_poster(M,(205,156,100,150),[(7,10,86,24,'red')]); K.corkboard(M,(320,170,110,130),[(12,20,40,30)]); K.bunting(M,140); K.radiator(M,(60,408,110,70))`, adds one `R.light('SUN','sun',(0,5,8),3.0,'#ffffff',1.0,(1.0,0,0))` and a world (`R.world(sc)`), prints `SHELL objects=<len(bpy.data.objects)>` and renders (`bpy.ops.render.render(write_still=True)`).
3. The script requires a `SHELL objects=<n>` line with n >= 70. Then it checks the render /tmp/ge04.png with a second small `--python-expr` using numpy (do not use check_room.py: this card does not depend on GE03): the image is 320x180; the pixel at png (150,55) (screen 600,110: plain wall) has alpha > 0.99 and the pixel at png (25,150) (screen 50,300: the empty window opening) has alpha < 0.01. Remember Blender image rows are stored bottom-up, so read row `179 - y`. Print `ROOMKIT SHELL OK`.

## Acceptance (all must pass; exact commands)
- `sh tests/run_roomkit_shell.sh` prints `ROOMKIT SHELL OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GE04: Room kit: shell (wall, floor, window, frames, bunting)`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
