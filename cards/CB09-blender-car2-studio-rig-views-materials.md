[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CB09 blender_car2: studio rig, views, materials

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CB09
Needs (already merged into `dev`): V06, CA03, CB01, CB02, CB03, CB04
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Switch the car builder to the studio look with new flags, keeping the old behaviour as the default so the older V01-V06 tests still pass. Geometry (loft body, arches, windows, wheels, parts) comes from the CA cards; this card changes only materials, light, camera and render settings.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run scripts as `/opt/homebrew/bin/blender --background --python-exit-code 1 --python <script> -- <args>` (arguments after the lone `--`). Blender's Python has bpy, bmesh, mathutils and numpy, NOT PIL. An uncaught exception or `sys.exit(1)` makes the command fail, so tests use plain `assert`. You cannot see images: check files with `file`, `ls -l` and the numbers the tests print.
- tools/art/blender_car2.py (as extended by V02-V06 and CA03: `--details`, `--body`, `parts.build_all`), tools/art/parts/_mats.py (CA03: wraps `cbmat.make_all`), tools/art/cbrig.py, tools/art/cbmat.py
- tests/run_blender_car2f.sh (the style of the shell tests)
- docs/art/CARS_ALIGN.md (THE contract with the CA and CC card sets: densities, views, file names, manifest v2, game mask; it wins over any other text) and docs/art/CB.md (why the numbers were chosen)

## Files you may change (and nothing else)
- `tools/art/blender_car2.py`
- `tests/run_blender_car2g.sh`

## Steps
1. Add flags to `blender_car2.py`: `--rig v1|studio` (default `v1` = everything exactly as before), `--view q|s|front|r` (default `s`; in rig `v1` the V06 values `side|threequarter` still work: accept both spellings, mapping threequarter to the old camera), `--finish solid|metallic` (default: `paint.finish` of the details file, else `solid`), `--color2 <#rrggbb>` (default: `paint.colour2` of the details file, else none), `--samples <int>` (default 48). With `--rig studio` the default of `--body` is `loft`. Bad values: clear message, exit 2.
2. With `--rig studio`: pass `finish` and `color2` to `parts._mats.make_all(hex, finish, hex2)`; DO NOT create the shadow catcher in the colour render; call `cbrig.setup_color_management(scene)`, `setup_studio_world`, `setup_studio_lights`, `setup_fixed_camera(scene, view)`; render with Cycles CPU, `scene.cycles.seed = 0`, `use_animated_seed = False`, denoising on, the canvas fixed at 1600x800 (ignore `--w/--h`), file `--out`. Print `RENDERED <out>` and with `--report` the usual REPORT lines.
3. Create `tests/run_blender_car2g.sh` (sh): renders `tests/fixtures/dossier_ok.json` with `--rig studio --view s --samples 8 --report --out /tmp/cb09_s.png` and `--view q` to `/tmp/cb09_q.png` and `--view r` to `/tmp/cb09_r.png`; requires exit 0, `RENDERED`, `REPORT body`, that `file /tmp/cb09_s.png` says `1600 x 800`, that a bad `--view x` exits non-zero, and that the old default command (no `--rig`) still renders a 1024 x 512 PNG; prints `BLENDER CAR2G OK`. Run `sh tests/run_blender_car2f.sh` too (it must still print its OK line).

## Acceptance (all must pass; exact commands)
- `sh tests/run_blender_car2g.sh` prints `BLENDER CAR2G OK`.
- `sh tests/run_blender_car2f.sh` still prints `BLENDER CAR2F OK`.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CB09: blender_car2: studio rig, views, materials`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
