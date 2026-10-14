[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDA01 Blender glTF export of one car (export_glb.py)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDA01
Needs (already merged into `dev`): none
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
`tools/art/export_glb.py` builds ONE car in Blender exactly like tools/art/blender_car2.py does (same dossier, same parts) and exports it as a binary glTF `godot/art/cars/<id>.glb`: only meshes, one node per part named by material class, one material per class with the class as its name. Godot colours and weathers the parts by class at run time, so the glb only needs the shapes and the class names.

## Read first
- The Blender art tools (tools/art/*.py, docs/cars/*.json, docs/cars/details/*.json, docs/characters/*.json, docs/CAR_DOSSIER_SPEC.md, docs/CAR_DETAILS_SPEC.md, docs/art/*.md) live on the `dev` branch (checkout: /Users/leelangley/wt/webbwheresmycar/_dev). Your working copy must contain them (the planner merges `dev` before the GDA art cards run). If `ls tools/art/carlib.py` fails, finish with `STATUS: BLOCKED` and say so.
- Blender 5.2 is at `/opt/homebrew/bin/blender` and runs on the Mac (headless, no window, it does not steal focus). Run scripts like `/opt/homebrew/bin/blender --background --python-exit-code 1 --python tools/art/<script>.py -- <args>` (everything after the lone `--` is for your script: `sys.argv[sys.argv.index('--')+1:]`). Blender's Python has bpy, bmesh, mathutils and numpy; no PIL. You cannot see images: check files with `file`, `ls -l` and numbers your own checks print.
- tools/art/blender_car2.py and tools/art/carlib.py (how a car is built; main() builds the scene, then renders)
- tools/art/cbmat.py (`class_of(name)`, `MASK_CLASS`, `hex_lin`, `make_all` material names)
- docs/cars/t1_chimp.json (a dossier: keys id, game_name, dims_mm.length, wheels, typical_paint) and docs/cars/details/t1_chimp.json (optional: paint.colour2, paint.finish)
- Car model contract (GDA01/GDA02): `res://art/cars/<id>.glb` has one MeshInstance3D node per part named `<class>_<NN>` (class is one of paint, paint2, chrome, glass, lamp, tail, trim, tyre, wall; NN two digits) and each mesh surface has a material whose `resource_name` is exactly the class. Axes in Godot: the car faces +X, up is +Y, the near (screen) side is +Z, the model is built 10.0 m long whatever the real car (1 car unit = 0.1 m); the real length is `len_mm` in `res://art/cars/manifest.json`, so the in-game scale of a car is `len_mm / 10000.0`.

## Files you may change (and nothing else)
- `tools/art/export_glb.py`
- `tools/art/test_export_glb.sh`
- `godot/art/cars/t1_chimp.glb`

## Steps
1. Header comment with the usage line `blender --background --python-exit-code 1 --python tools/art/export_glb.py -- --id t1_chimp [--out PATH] [--color #rrggbb] [--dossier-dir docs/cars]` and `python3 tools/art/export_glb.py --list`. Do `import bpy` only inside the build function so `--list` runs under plain python3. `argv = sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else sys.argv[1:]`. Defaults: `--dossier-dir docs/cars`, `--out godot/art/cars/<id>.glb`, `--color` = `typical_paint[0]` of the dossier. Bad or missing arguments: print a clear message and `sys.exit(2)`. `sys.dont_write_bytecode = True`.
2. `--list`: for every `<dossier-dir>/*.json` (not in subfolders) that parses and has the keys `id` and `side_profile`, print `<id>` TAB `<game_name>`, sorted by id, then exit 0.
3. Build: `sys.path.insert(0, <tools/art dir>)`; `import carlib, cbmat`; set `carlib.render = lambda *a, **k: None` (no render). Read the text of tools/art/blender_car2.py; build `sys.argv = ['blender_car2.py', '--', '--dossier', <dossier path>, '--out', '/tmp/export_glb_unused.png', '--color', <color>, '--w', '16', '--h', '8']` and APPEND `--details auto` only if the text contains the string `'--details'`, `--body loft` only if it contains `'--body'`, `--samples 1` only if it contains `'--samples'` (flags that do not exist yet must not be passed). Then `runpy.run_path(<tools/art/blender_car2.py>, run_name='__main__')`. The scene is now built in this Blender session.
4. Clean the scene: delete every object that is not a MESH, and every mesh named `shadow_catcher` or with `is_shadow_catcher` true. For every mesh with more than one material slot: make it the only selected and active object, `bpy.ops.object.mode_set(mode='EDIT')`, `bpy.ops.mesh.separate(type='MATERIAL')`, `bpy.ops.object.mode_set(mode='OBJECT')`.
5. Classify: `CLASS_EXTRA = {'lens': 'lamp', 'plate': 'wall', 'fabric': 'trim'}`; `cls_of(material_name)` strips a `.NNN` suffix, returns `CLASS_EXTRA[name]` when present, else `cbmat.class_of(name)`. For each remaining mesh take the class of its FIRST material (no material: `trim`) and store it in a dict `{object: class}`. Then, in this order: `obj.data.materials.clear()` on every mesh; remove EVERY material from `bpy.data.materials` (otherwise the new names get a `.001` suffix); create one canonical material per class that is used with `carlib.make_mat(name, cbmat.hex_lin(hex), metallic=, roughness=, emission=, emission_strength=)` using this table: paint = the `--color` value, metallic 0, roughness 0.32; paint2 = '#c8c8c8' (or paint.colour2 from docs/cars/details/<id>.json when that file and key exist), metallic 0, roughness 0.32; chrome '#f2f2f4' metallic 1 roughness 0.05; glass '#1b2830' roughness 0.02; lamp '#fff1c0' roughness 0.1 emission '#ffe9a8' strength 2.0; tail '#c01818' roughness 0.2 emission '#ff2010' strength 1.0; trim '#0e0e10' roughness 0.55; tyre '#16161a' roughness 0.85; wall '#e8e2d0' roughness 0.7. Append the canonical material of its class to each mesh. Rename every mesh object AND its mesh data to `<class>_<NN>`, NN counting from 00 per class in order of the old object names (sorted), so the result is repeatable.
6. Export: select all objects; `props = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()`; call `bpy.ops.export_scene.gltf(filepath=<out>, **kw)` where `kw` is the dict `{export_format: 'GLB', use_selection: True, export_apply: True, export_yup: True, export_cameras: False, export_lights: False, export_extras: False}` filtered to the keys present in `props` (create the output folder first). Print `EXPORTED <id> <out path> bytes=<file size>`.
7. Meta: compute the bounding box of all remaining meshes in Blender world space (`obj.matrix_world @ Vector(corner)` over `obj.bound_box`), then convert to GODOT axes (Blender x,y,z -> Godot x, z, -y): `bbox_min = [minx, minz, -maxy]`, `bbox_max = [maxx, maxz, -miny]`, each rounded to 4 decimals. Print ONE line `META ` followed by `json.dumps(obj, sort_keys=True)` of `{id, game_name, len_mm (dossier dims_mm.length), bbox_min, bbox_max, wheelbase_units (max wheel x minus min wheel x of the dossier wheels, rounded to 2), wheels (count), classes ({class: number of objects}), paints (dossier typical_paint), paint2 (details paint.colour2 or empty string), finish (details paint.finish or 'solid')}`.
8. `tools/art/test_export_glb.sh` (sh; first line after the shebang `cd "$(dirname "$0")/../.."` so it runs from the repo root; `mkdir -p /tmp/gda01`): (a) `python3 tools/art/export_glb.py --list` output contains the line `t1_chimp` TAB `Hillbilly Chimp`; (b) run the Blender export for t1_chimp with `--out /tmp/gda01/t1_chimp.glb`, require exit 0, `EXPORTED t1_chimp` and a `META ` line; (c) a python3 block reads the glb (12 byte header, first chunk is JSON: bytes 12..20 are length and type, JSON from byte 20) and requires: file starts with `glTF`; every material name is one of the 9 classes and the set includes paint, tyre, glass and chrome; every node name matches `^(paint|paint2|chrome|glass|lamp|tail|trim|tyre|wall)_[0-9][0-9]$`; the JSON has no `cameras` key and no `KHR_lights_punctual`; from META: `bbox_max[0] - bbox_min[0]` is between 9.5 and 10.6, `bbox_max[1]` between 3.0 and 4.5, `bbox_min[1]` between -0.05 and 1.0, `wheels` is 2 or more; (d) `--id nope` exits non-zero. Print `EXPORT GLB OK`.
9. Then really export the car into the repo: run the Blender command with `--id t1_chimp` and no `--out` (writes godot/art/cars/t1_chimp.glb, about 300 KB) and commit that file.

## Acceptance (all must pass; exact commands)
- `sh tools/art/test_export_glb.sh` prints `EXPORT GLB OK`.
- `python3 tools/art/export_glb.py --list` prints 8 lines (one per dossier in docs/cars) and exits 0.
- `ls -l godot/art/cars/t1_chimp.glb` shows a file between 100000 and 2000000 bytes.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Do not edit blender_car2.py, carlib.py, cbmat.py or any other tools/art file.
- Do not render images. Do not export the other cars (card GDA02).

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDA01: Blender glTF export of one car (export_glb.py)`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
