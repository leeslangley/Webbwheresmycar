[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDA02 Export every car to glb plus manifest.json

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDA02
Needs (already merged into `dev`): GDA01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
One command exports every car with a dossier in docs/cars/ to `godot/art/cars/<id>.glb` and writes `godot/art/cars/manifest.json`, which Godot reads to know what cars exist, their game names, real lengths, boxes, wheelbase and paint colours.

## Read first
- The Blender art tools (tools/art/*.py, docs/cars/*.json, docs/cars/details/*.json, docs/characters/*.json, docs/CAR_DOSSIER_SPEC.md, docs/CAR_DETAILS_SPEC.md, docs/art/*.md) live on the `dev` branch (checkout: /Users/leelangley/wt/webbwheresmycar/_dev). Your working copy must contain them (the planner merges `dev` before the GDA art cards run). If `ls tools/art/carlib.py` fails, finish with `STATUS: BLOCKED` and say so.
- Blender 5.2 is at `/opt/homebrew/bin/blender` and runs on the Mac (headless, no window, it does not steal focus). Run scripts like `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/<script>.py -- <args>` (everything after the lone `--` is for your script: `sys.argv[sys.argv.index('--')+1:]`). Blender's Python has bpy, bmesh, mathutils and numpy; no PIL. You cannot see images: check files with `file`, `ls -l` and numbers your own checks print.
- tools/art/export_glb.py (GDA01: `--list` prints `<id>` TAB `<game_name>`; a Blender run prints `EXPORTED ...` and one `META {json}` line)
- tools/art/test_export_glb.sh (style of the shell tests)
- Car model contract (GDA01/GDA02): `res://art/cars/<id>.glb` has one MeshInstance3D node per part named `<class>_<NN>` (class is one of paint, paint2, chrome, glass, lamp, tail, trim, tyre, wall; NN two digits) and each mesh surface has a material whose `resource_name` is exactly the class. Axes in Godot: the car faces +X, up is +Y, the near (screen) side is +Z, the model is built 10.0 m long whatever the real car (1 car unit = 0.1 m); the real length is `len_mm` in `res://art/cars/manifest.json`, so the in-game scale of a car is `len_mm / 10000.0`.

## Files you may change (and nothing else)
- `tools/art/export_all_glb.sh`
- `tools/art/glb_manifest.py`
- `tools/art/test_export_all_glb.sh`
- `godot/art/cars/manifest.json`
- `godot/art/cars/t1_allergy.glb`
- `godot/art/cars/t1_alpaca.glb`
- `godot/art/cars/t1_chimp.glb`
- `godot/art/cars/t1_cooker.glb`
- `godot/art/cars/t1_maurice.glb`
- `godot/art/cars/t1_robbin.glb`
- `godot/art/cars/t1_trumpet.glb`
- `godot/art/cars/t1_volksbeagle.glb`

## Steps
1. `tools/art/export_all_glb.sh [id]` (sh, `cd` to the repo root first). Ids: the one argument, or every first column of `python3 tools/art/export_glb.py --list`. For each id: `mkdir -p build/glb`; run `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/export_glb.py -- --id $id > build/glb/$id.log 2>&1`; on exit 0 take the line of the log that starts with `META ` (text after the 5 character prefix) into `build/glb/$id.meta.json` and print `OK $id`; otherwise print `FAIL $id` and keep going. Afterwards run `python3 tools/art/glb_manifest.py build` and exit 1 if any car failed. Add nothing to .gitignore; `build/` is scratch.
2. `tools/art/glb_manifest.py` (python3 standard library only). `build`: reads every `build/glb/*.meta.json` and writes `godot/art/cars/manifest.json` as `{"version": 1, "cars": {<id>: {"file": "<id>.glb", "game_name", "len_mm", "bbox_min", "bbox_max", "wheelbase_units", "wheels", "classes", "paints", "paint2", "finish"}}}` with `json.dump(..., sort_keys=True, indent=1)` and a trailing newline (byte-identical on a second run). Cars whose meta is missing are kept from the existing manifest if it exists. Prints `MANIFEST <n> cars`. `check`: for every car in the manifest requires the glb file to exist, to start with the 4 bytes `glTF`, `len_mm` > 2500, `wheels` >= 3 and `classes` to contain `paint` and `tyre`; prints `MANIFEST CHECK OK <n>` or the first problem and exit 1.
3. `tools/art/test_export_all_glb.sh`: runs `sh tools/art/export_all_glb.sh` (all cars), requires `OK` lines for every id of `--list`, `MANIFEST 8 cars` (or the number of ids), runs `python3 tools/art/glb_manifest.py check`, runs `build` a second time and requires the manifest md5 (`md5 -q`) to be unchanged, requires `t1_chimp` game_name `Hillbilly Chimp` and `len_mm` 3556 in the manifest. Print `EXPORT ALL OK`.
4. Run the full export once yourself and commit the 8 glbs and the manifest.

## Acceptance (all must pass; exact commands)
- `sh tools/art/test_export_all_glb.sh` prints `EXPORT ALL OK`.
- `python3 tools/art/glb_manifest.py check` prints `MANIFEST CHECK OK 8`.
- `git status --short` lists only files from the list above.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Do not edit export_glb.py (a bug there: finish with STATUS: BLOCKED and the exact error).
- Cars without a dossier (only a details file) are skipped.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDA02: Export every car to glb plus manifest.json`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
