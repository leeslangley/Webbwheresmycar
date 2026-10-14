[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDA20 CarSheet: show each car in its manifest paint

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDA20
Needs (already merged into `dev`): GDA17, GDA03
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The review contact sheet shows every car in the same brown because it never calls set_paint. Make each cell call set_paint with the car's FIRST manifest paint so a reviewer can judge real colours.

## Read first
- godot/art/car_sheet.gd (_add_cell)
- godot/art/carview.gd (set_paint takes a Color; static manifest() gives the manifest Dictionary)
- godot/art/cars/manifest.json (each car entry has a `paints` array of hex strings like "#c96f32")
- godot/tests/test_car_sheet.gd

## Files you may change (and nothing else)
- `godot/art/car_sheet.gd`
- `godot/tests/test_car_sheet.gd`

## Steps
1. In `_add_cell`, after the CarView has its car set, look up `CarView.manifest()` for `car_id`; if the entry has a non-empty `paints` array, call `set_paint(Color(paints[0]))` on the cell's CarView; otherwise leave the default. Do not change cell layout, labels or wear values.
2. In test_car_sheet.gd add a test `test_paint_applied`: build the sheet (call build() by hand as the other tests do), take the CarView of the first cell, and assert its `paint` equals `Color(paints[0])` of its car from the manifest (use `CarView.manifest()`), with eps 0.003 per channel; also assert that at least two cells have DIFFERENT paint colours.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_car_sheet` ends with `GDTEST OK`.
- `sh tools/godot/contact_sheet_cars.sh /tmp/GDA20.png` writes the PNG; LOOK at it (Read tool) and say honestly which cars now show different colours.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDA20: CarSheet: show each car in its manifest paint`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
