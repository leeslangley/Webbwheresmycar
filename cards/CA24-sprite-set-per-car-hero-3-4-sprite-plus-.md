[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash CA24 Sprite set per car: hero 3/4 sprite plus HUD face portrait

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: CA24
Needs (already merged into `dev`): CA21, CA23, V07
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
One command per car that makes the two images the game needs: the hero sprite (front three-quarter, 320 px wide) for the telly and garage, and a square face portrait (front view, 96x96) for the HUD portrait cluster, both with the RSAMH finish.

## Read first
- Blender 5.2 is at `/opt/homebrew/bin/blender`; run `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/blender_car2.py -- --dossier tests/fixtures/dossier_ok.json --out /tmp/x.png --report` (everything after the lone `--` is for the script). Blender's Python has bpy, bmesh, mathutils, numpy and NOT PIL. You cannot see images: check numbers (the `--report` lines `REPORT <object name> dx=.. dy=.. dz=..`).
- tools/art/render_all.sh (V07: the loop, the manifest format)
- tools/art/pixelate.py and tools/art/rsamh_finish.py (CA23)
- src/art/sprites.js (S01: how the game reads `assets/art/cars/manifest.json`; do not change it)

## Files you may change (and nothing else)
- `tools/art/render_sprites.sh`
- `tests/run_ca24.sh`

## Steps
1. `tools/art/render_sprites.sh <id>...` (sh; all ids when none given): for each id with `docs/cars/<id>.json`: render `--view front34 --w 1280 --h 640` to `build/art/raw/<id>_hero.png`, `pixelate.py --width 320 --colors 28`, `rsamh_finish.py --outline 2` -> `assets/art/cars/<id>.png`; render `--view front --w 768 --h 768` to `build/art/raw/<id>_face.png`, `pixelate.py --width 92 --colors 20`, `rsamh_finish.py --outline 2` -> `assets/art/cars/<id>_face.png` (92 + 4 = 96 px square). Print `SPRITES <id> hero=<w>x<h> face=<w>x<h>` (read sizes with `file`) or `FAIL <id>` and continue.
2. Rewrite the manifest at the end (python3 inline): `{ "<id>": {"file": "<id>.png", "w": W, "h": H, "face": "<id>_face.png", "fw": 96, "fh": 96} }` for every `<id>.png` present (keep existing keys V07 wrote; only add the face keys). `tests/run_ca24.sh`: copies the dossier_ok fixture to `docs/cars/dossier_ok.json`, runs the script for `dossier_ok`, requires `SPRITES dossier_ok`, the face PNG to be exactly 96x96, the hero width between 322 and 330, the manifest to hold the face key, then removes the three test files; prints `CA24 OK`. Do not commit the sprites.

## Acceptance (all must pass; exact commands)
- `sh tests/run_ca24.sh` prints `CA24 OK` and `git status --short` shows only your two files.
- `make test` last line starts with `ALL TESTS PASS`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Read docs/DESIGN.md only for the sections named. Pure sim/data/core code has no DOM, `Math.random` or `Date`; tests run on macOS `jsc -m` (no `console`, use `print()`).
- Write your first complete version within 10 turns, run `make test`, commit with the message `CA24: Sprite set per car: hero 3/4 sprite plus HUD face portrait`, then improve. Paste the last 2 lines of `make test` in your summary.
- Text you write for players: ASCII only, no real brands or people, no he/she/him/her for customers or named people.
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
