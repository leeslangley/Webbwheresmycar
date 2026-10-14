[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDA11 Room plate export script (layers and lights JSON)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDA11
Needs (already merged into `dev`): none
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The Blender room pipeline (cards GE07-GE12, `sh tools/art/build_rooms.sh`) writes `assets/art/rooms/<room>.png` (+ `office_front.png`) and `assets/art/rooms/manifest.json`. This plain python3 script copies them to `godot/art/rooms/` as layer PNGs and writes `godot/art/rooms/<room>.json` with the layer list (parallax), the window sky rectangle and the light positions that `RoomPlate` (GDA12) turns into `PointLight2D` nodes.

## Read first
- The Blender art tools (tools/art/*.py, docs/cars/*.json, docs/cars/details/*.json, docs/characters/*.json, docs/CAR_DOSSIER_SPEC.md, docs/CAR_DETAILS_SPEC.md, docs/art/*.md) live on the `dev` branch (checkout: /Users/leelangley/wt/webbwheresmycar/_dev). Your working copy must contain them (the planner merges `dev` before the GDA art cards run). If `ls tools/art/carlib.py` fails, finish with `STATUS: BLOCKED` and say so.
- docs/art/GE.md (rooms, screen px, lamp / TV / window / strip / spot positions and colours; plates are 640x360 shown at x2 = 1280x720)
- cards/GE12-*.md (manifest format `{room: {file, w, h, scale, front?}}`) and cards/GE14-*.md (flicker: depth 0.12 lamp, 0.25 TV)
- docs/GODOT.md

## Files you may change (and nothing else)
- `tools/art/export_room_layers.py`
- `tools/art/test_export_room_layers.sh`

## Steps
1. `tools/art/export_room_layers.py` (python3 standard library only). Usage `python3 tools/art/export_room_layers.py [--src assets/art/rooms] [--out godot/art/rooms] [--room office|garage|auction|title|ledger|bookings|all] [--selftest]`. `<src>/manifest.json` missing: print `NO SOURCE: run sh tools/art/build_rooms.sh first` and exit 3.
2. Module constant `LIGHTS` (stage pixels in the 1280x720 stage; `kind` is lamp, tv, window, strip, spot or sconce; `flicker` is the depth, 0 means steady; every entry also has `id`, `pos` [x, y], `color` hex, `energy`, `radius` in px, `seed`). office: `{id: lamp, kind: lamp, pos: [388, 328], color: #ffab55, energy: 0.45, radius: 170, flicker: 0.12, seed: 1.3}`, `{id: tv, kind: tv, pos: [625, 301], color: #78b4ff, energy: 0.30, radius: 230, flicker: 0.25, seed: 4.1}`, `{id: window, kind: window, pos: [110, 235], color: #b4c8e6, energy: 0.35, radius: 200, flicker: 0.0, seed: 0.0}`. garage: three strips `strip1..3` at pos [320, 130], [640, 130], [960, 130], color #dff1ff, energy 0.35, radius 240, flicker 0.30, seeds 2.0, 5.5, 8.1. auction: `{id: spot, kind: spot, pos: [640, 330], color: #ffe2a0, energy: 0.60, radius: 300, flicker: 0.0, seed: 0.0}`, sconces `sconce1` [120, 300] and `sconce2` [1160, 300], color #ffb070, energy 0.25, radius 120, flicker 0.15, seeds 3.3, 6.6. title: four lamps `lamp1..4` at [200, 330], [460, 330], [820, 330], [1080, 330], color #ffb15c, energy 0.40, radius 160, flicker 0.10, seeds 1.1, 2.2, 3.3, 4.4. ledger: `lamp` kind lamp at [260, 300], #ffab55, 0.40, 150, flicker 0.10, seed 1.3. bookings: `lamp` at [260, 300], #ffab55, 0.40, 150, flicker 0.10, seed 2.3. Constant `SKY` (the window / sky rectangle in stage px, or None): office `[30, 150, 160, 170]`; title `[0, 0, 1280, 720]`; all other rooms None. Constant `FRONT_PARALLAX = [6, 3]`.
3. For each room in the manifest (or the chosen one): copy `<src>/<file>` to `<out>/<room>_mid.png` and, when the manifest entry has `front` and that PNG exists, `<src>/<front>` to `<out>/<room>_front.png` (print `WARN missing <file>` and skip the room if the plate itself is missing). Write `<out>/<room>.json` (`indent=1, sort_keys=True`, trailing newline): `{"version": 1, "room": room, "scale": entry.scale, "size": [entry.w, entry.h], "sky": {"rect": SKY[room]} or null, "layers": [{"name": "mid", "file": "<room>_mid.png", "parallax": [0, 0]}, (+ {"name": "front", "file": "<room>_front.png", "parallax": [6, 3]} when present)], "lights": LIGHTS.get(room, [])}`. Print `EXPORTED <room> layers=<n> lights=<n>`.
4. `--selftest`: temp source folder with 4x4 PNGs (write them with `zlib` and `struct` like any PNG: signature, IHDR, IDAT, IEND, CRC) named `office.png`, `office_front.png`, `garage.png` and a manifest `{office: {file, w: 640, h: 360, scale: 2, front}, garage: {file, w: 640, h: 360, scale: 2}}`; export into another temp folder; assert: `office.json` has 2 layers (`mid`, `front`) with the front parallax [6, 3], `sky.rect` [30, 150, 160, 170], 3 lights of which the `lamp` has color `#ffab55` and `window` has `flicker` 0.0; `garage.json` has 1 layer, `sky` is None (null), 3 lights; `office_mid.png` and `office_front.png` exist; a second run is byte-identical; a manifest entry whose PNG is missing is skipped with a WARN. Print `ROOM EXPORT SELFTEST OK`.
5. `tools/art/test_export_room_layers.sh`: runs the selftest and requires its last line; when `assets/art/rooms/manifest.json` exists runs the real export (`--room all`) and requires at least one `EXPORTED` line, otherwise prints `SKIP real export (no assets/art/rooms/manifest.json yet)`; then prints `EXPORT ROOMS OK`.

## Acceptance (all must pass; exact commands)
- `python3 tools/art/export_room_layers.py --selftest` last line is `ROOM EXPORT SELFTEST OK`.
- `sh tools/art/test_export_room_layers.sh` last line is `EXPORT ROOMS OK`.
- `python3 tools/art/export_room_layers.py --src /nonexistent` prints a line starting `NO SOURCE` and exits 3.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- No Blender run, no rendering of rooms (cards GE07-GE12). Light positions are first estimates from docs/art/GE.md; a later art QA pass tunes them.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDA11: Room plate export script (layers and lights JSON)`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
