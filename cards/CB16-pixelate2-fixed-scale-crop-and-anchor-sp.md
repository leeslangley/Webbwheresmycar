[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CB16 pixelate2: fixed scale, crop and anchor, sprite profiles

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CB16
Needs (already merged into `dev`): CB04, CB15
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Sprites at fixed pixel densities, cropped tight, with the ground anchor recorded: hero (the s side view is THE default picture of every car: title drive-by, shop, garage, auction, bookings and telly stages; the q three-quarter is an extra at the same density), mini (the s view small: thumbnails, lists) and face (head-on car portrait, the 'face' of the HUD cluster as in the 1989 game). The three densities are fixed in docs/art/CARS_ALIGN.md; hero 48 px/m makes a 5.7 m limo in side view about 276 px (552 at x2), inside the 572 px TV shop slot.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts as `/opt/homebrew/bin/blender --background --python-exit-code 1 --python <script> -- <args>` (arguments after the lone `--`). Blender's Python has bpy, bmesh, mathutils and numpy, NOT PIL. An uncaught exception or `sys.exit(1)` makes the command fail, so tests use plain `assert`. You cannot see images: check files with `file`, `ls -l` and the numbers the tests print.
- tools/art/pixelate2.py (CB15), tools/art/cbrig.py (CB04 constants CANVAS_W/H, PX_PER_M, ORIGIN_PX)
- docs/art/CARS_ALIGN.md (THE contract with the CA and CC card sets: densities, views, file names, manifest v2, game mask; it wins over any other text) and docs/art/CB.md (why the numbers were chosen)

## Files you may change (and nothing else)
- `tools/art/pixelate2.py`
- `tests/run_pixelate2b.sh`
- `tests/pixelate2b_check.py`

## Steps
1. In `pixelate2.py` add `PROFILES = {'hero': dict(ppm=48, dither=0.5, steps=(0,1,2,3,4,5,6)), 'mini': dict(ppm=24, dither=0.3, steps=(1,3,4,5,6)), 'face': dict(ppm=40, dither=0.3, steps=(1,3,4,5,6))}` and a flag `--profile hero|mini|face` that REPLACES `--width` (sprite width = `round(1600 * ppm / 192)`: hero 400, mini 200, face 333; the render is the full 1600x800 canvas, area-averaged down; the hero is drawn x2 on screen). The old `--width` still works when no profile is given.
2. After the outline step crop to the bounding box of the opaque pixels (outline included). Ground anchor: the canvas point (800,680) maps to sprite pixel `(800*ppm/192, 680*ppm/192)` before the crop; after the crop the anchor is that point plus the 1 px outline padding minus the crop origin (`ax`, `ay`, rounded to int, may lie outside the sprite for an odd car). Add `--meta-out <json>`: writes `{"w":..,"h":..,"ax":..,"ay":..,"ppm":<ppm>,"colors":<distinct opaque rgb count>}`.
3. Create `tests/pixelate2b_check.py` and `tests/run_pixelate2b.sh`: build (with a Blender fixture in the checker file) a synthetic full-canvas render+mask 1600x800: a paint block covering canvas x 560..1240 and y 440..680 (so the car's ground edge is exactly at the origin row), alpha 1. Run `--profile hero --color '#C96F32' --meta-out /tmp/px2b.json` and require (each +-1): sprite w = 172 (680/4 = 170 block pixels plus the 2 outline pixels), h = 62 (240/4 = 60 plus 2), `ax` = 61 (the origin column 200 plus 1 for the outline padding, minus the crop origin 140) and `ay` = 61 (= h - 1: the car stands on the anchor row), `ppm` 48. Profile `mini` gives w = 87 (+-2) and at most 5 distinct paint-ramp colours; profile `face` gives w = 144 (+-2), h = 52 (+-2), `ax` = 51 (+-2), `ay` = h - 1 (+-1) and at most 5 distinct paint-ramp colours. Print `PIXELATE2B TEST OK`.

## Acceptance (all must pass; exact commands)
- `sh tests/run_pixelate2b.sh` prints `PIXELATE2B TEST OK`.
- `sh tests/run_pixelate2.sh` still prints `PIXELATE2 TEST OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CB16: pixelate2: fixed scale, crop and anchor, sprite profiles`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
