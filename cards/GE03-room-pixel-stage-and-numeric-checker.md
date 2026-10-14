[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GE03 Room pixel stage and numeric checker

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GE03
Needs (already merged into `dev`): A04
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Two Blender-python tools: `pixelbg.py` turns a 1280x720 room render into a 640x360 limited-palette pixel plate (alpha kept as holes, no outline), and `check_room.py` prints numbers about a plate (size, colour count, transparent holes, brightness, warmth) so cards can test pictures without seeing them.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts like `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/<script>.py -- <args>` (everything after the lone `--` is for your script: `sys.argv[sys.argv.index('--')+1:]`). Blender's Python has bpy, bmesh, mathutils and numpy, NOT PIL. You cannot see images: check files with `file`, `ls -l` and the numbers the check scripts print. Do NOT add Blender scripts to `make test` (slow).
- tools/art/pixelate.py (its helper functions load_rgba, downscale, kmeans, nearest, apply_dither, save_rgba are reused: import it with `sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))`)
- docs/art/ge_proto/pixelbg.py and docs/art/ge_proto/check_room.py (working versions with positional arguments: make the arguments named as below)

## Files you may change (and nothing else)
- `tools/art/pixelbg.py`
- `tools/art/check_room.py`
- `tests/run_pixelbg.sh`

## Steps
1. `tools/art/pixelbg.py`: arguments after `--`: `--in <png> --out <png>` (required), `--width` (640), `--colors` (96), `--dither` (0.22), `--preview <png>` (optional: also write the plate scaled x2 with nearest neighbour). Bad or missing arguments print `pixelbg: <reason>` and `sys.exit(2)`. Algorithm (exactly as the prototype): load, `downscale` to `width` x round(h*width/w), opaque = alpha >= 0.5, `kmeans` over the opaque pixels' rgb, `nearest(apply_dither(rgb, dither)[opaque], centres)`, write the palette colours for opaque pixels, alpha exactly 0 or 1, NO outline, `save_rgba`. Print `PIXBG OK out=<out> size=<w>x<h> colors=<n>`.
2. `tools/art/check_room.py`: copy docs/art/ge_proto/check_room.py (arguments: `<png> [--size WxH] [--max-colors N]` then any of `--hole x,y,w,h` (all pixels transparent), `--solid x,y,w,h` (all opaque), `--dark x,y,w,h,maxLuma`, `--bright x,y,w,h,minLuma`, `--calm x,y,w,h,maxStd`, `--warm x,y,w,h,min` (mean R - mean B), `--cold x,y,w,h,min`). Rectangles are SCREEN px (1280x720) and are scaled to the png size. Prints `ROOM OK size=WxH colors=N ...` or `ROOM FAIL ...` plus `ROOM REASONS ...` and exits 2.
3. `tests/run_pixelbg.sh` (sh, cd to repo root): make a synthetic input with `blender --background --python-expr` (numpy: `w,h=1280,720; a=np.zeros((h,w,4),np.float32); a[:,:,0]=np.linspace(0,1,w)[None,:]; a[:,:,1]=np.linspace(0,1,h)[:,None]; a[:,:,2]=0.5; a[:,:,3]=1; a[h-200:h-100,100:300,3]=0; im=bpy.data.images.new('s',w,h,alpha=True); im.pixels.foreach_set(a.reshape(-1)); im.filepath_raw='/tmp/ge03_in.png'; im.file_format='PNG'; im.save()`). Run pixelbg on it (`--width 640 --colors 16 --dither 0.22`) twice into /tmp/ge03_a.png and /tmp/ge03_b.png; require `cmp` equal (deterministic); run check_room on the first with `--size 640x360 --max-colors 16 --hole 110,110,180,80 --solid 400,300,100,100` and require `ROOM OK`; run check_room with `--hole 400,300,100,100` and require exit code 2 (the checker really fails). Print `PIXELBG OK`.

## Acceptance (all must pass; exact commands)
- `sh tests/run_pixelbg.sh` prints `PIXELBG OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `GE03: Room pixel stage and numeric checker`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
