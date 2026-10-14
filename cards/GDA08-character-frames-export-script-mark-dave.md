[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDA08 Character frames export script (Mark, Dave)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDA08
Needs (already merged into `dev`): none
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Blender renders and pixelates the Mark and Dave sprites into `assets/art/characters/` with a `manifest.json` (card GC19, `sh tools/art/render_chars.sh all`). This script (plain python3, no Blender) copies exactly the PNGs the manifest lists into the Godot project and writes one JSON per character that Godot's `CharFrames` (GDA09) reads: clips with fps/loop/hold and neck positions, head faces by angle, busts.

## Read first
- The Blender art tools (tools/art/*.py, docs/cars/*.json, docs/cars/details/*.json, docs/characters/*.json, docs/CAR_DOSSIER_SPEC.md, docs/CAR_DETAILS_SPEC.md, docs/art/*.md) live on the `dev` branch (checkout: /Users/leelangley/wt/webbwheresmycar/_dev). Your working copy must contain them (the planner merges `dev` before the GDA art cards run). If `ls tools/art/carlib.py` fails, finish with `STATUS: BLOCKED` and say so.
- cards/GC19-*.md in the dev worktree (the manifest.json format: `characters.<name>.frame/head/clips/heads/head_back/bust/busts`, `scale.world`, `customers`)
- docs/characters/mark.json, docs/characters/poses_mark_front_a.json (clip fps, loop, hold, view)
- docs/GODOT.md

## Files you may change (and nothing else)
- `tools/art/export_char_frames.py`
- `tools/art/test_export_char_frames.sh`

## Steps
1. `tools/art/export_char_frames.py` (python3 standard library only). Usage: `python3 tools/art/export_char_frames.py [--src assets/art/characters] [--out godot/art/chars] [--char mark|dave|all] [--selftest]`. If `<src>/manifest.json` is missing: print `NO SOURCE: run sh tools/art/render_chars.sh all first` and exit 3.
2. For each character name (`mark`, `dave`, or the one asked): read `manifest['characters'][name]`. Collect the ids to copy: every `clips.<clip>.frames[].id`, every id in `heads.<face>.<angle>`, `head_back`, every id in `busts`. Copy `<src>/<id>.png` to `<out>/<name>/<id>.png` (create folders) and DROP (and print `WARN missing <id>`) every id whose PNG does not exist: the dropped ids are removed from the clip frame lists (a clip left with no frames is removed), from heads and from busts. Write `<out>/<name>.json` with `json.dump(doc, indent=1, sort_keys=True)` plus a trailing newline: `{"version": 1, "char": name, "scale": manifest['scale']['world'], "frame": [w, h], "head": {"size": [w, h], "pivot": [x, y]}, "bust": [w, h], "clips": {clip: {"view", "fps", "loop", "hold", "frames": [{"id", "neck": [x, y], "angle"}]}}, "heads": {face: {angle: id}}, "head_back": id or "", "busts": {face: id}}`. Print `EXPORTED <name> clips=<n> frames=<n> heads=<n> busts=<n>` (heads = number of faces).
3. Customers: when `manifest['customers']` is not empty write `<out>/customers.json` = `{job: {"variants": n, "w": w, "h": h, "ids": [...]}}` (only ids whose PNG exists) and copy those PNGs to `<out>/customers/`. Print `EXPORTED customers jobs=<n> files=<n>`.
4. `--selftest`: in `tempfile.mkdtemp()` write a fake source (4x4 RGBA PNGs written with `zlib` and `struct`: signature, IHDR, IDAT, IEND with CRCs) and a manifest with mark: frame 144x144, head 80x80 pivot [40, 66], clips `idle` (view front, fps 3, loop true, hold 0, 2 frames, angle fwd, necks [72, 75] and [72, 76]) and `talk` (fps 6, loop true, hold 2, 3 frames), heads `neutral.fwd`, `talk_A.fwd`, `blink.fwd`, `head_back`, bust `neutral`; one frame id deliberately has NO png. Run the export into another temp folder and assert: the JSON parses, `clips.idle.frames` has 2 entries, `clips.talk.frames` has 2 (the missing one dropped), `frame` is [144, 144], `scale` 2, `head.pivot` is [40, 66], all copied PNG files exist, a second run gives a byte-identical JSON, no `customers.json` is written when the manifest has no customers. Print `CHAR EXPORT SELFTEST OK`.
5. `tools/art/test_export_char_frames.sh`: runs `python3 tools/art/export_char_frames.py --selftest` and requires its last line; then, when `assets/art/characters/manifest.json` exists, runs the real export (`--char all`) and requires `EXPORTED mark` and `EXPORTED dave` and that `godot/art/chars/mark.json` parses; otherwise prints `SKIP real export (no assets/art/characters/manifest.json yet)`. Finally prints `EXPORT CHARS OK`. If the real export ran, commit `godot/art/chars/` (the planner will add it to the card list: say in your reply how many files and bytes).

## Acceptance (all must pass; exact commands)
- `python3 tools/art/export_char_frames.py --selftest` last line is `CHAR EXPORT SELFTEST OK`.
- `sh tools/art/test_export_char_frames.sh` last line is `EXPORT CHARS OK`.
- `python3 tools/art/export_char_frames.py --src /nonexistent` prints a line starting `NO SOURCE` and exits 3.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- No Blender run. Do not render characters (card set GC owns that). Generated PNGs from a real run may be committed but are not required.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDA08: Character frames export script (Mark, Dave)`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
