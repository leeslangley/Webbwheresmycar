[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDA17 Contact sheet of all cars (one review image)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDA17
Needs (already merged into `dev`): GDA03, GDF01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
`sh tools/godot/contact_sheet_cars.sh [out.png]` renders every car of `res://art/cars/manifest.json` on one 1280x720 review image: for each car a side view at wear (index mod 4) and a three-quarter view at wear 0, with the game name and wear level written on each cell. Planners and reviewers use it to check recognisable shapes, paint, wear and chrome at a glance.

## Read first
- docs/GODOT.md (plan, Compatibility renderer, pixel look, card rules)
- tools/godot/gshot.sh (renders one scene on CASE and copies the PNG back; usage `gshot.sh <scene> <out.png> [frames] [WxH]`)
- godot/art/carview.gd (GDA03: set_car, set_view, set_wear, `shrink` is set through set_view; to get a coarser pixel size in small cells call `Box.stretch_shrink = 2` via `get_node("Box")`)
- Test rule: tests never need a running SceneTree. Every scene script has a public, idempotent `build()` that `_ready()` calls; the test instantiates the scene, calls `build()` itself, checks node facts, and frees the node with `node.free()` at the end. Do not call `get_tree()` or `add_child` onto the test itself.

## Files you may change (and nothing else)
- `tools/godot/contact_sheet_cars.sh`
- `godot/art/car_sheet.gd`
- `godot/art/car_sheet.tscn`
- `godot/tests/test_car_sheet.gd`

## Steps
1. `godot/art/car_sheet.tscn`: root `Control` named `CarSheet` (`custom_minimum_size = Vector2(1280, 720)`, `layout_mode = 3`, `anchors_preset = 0`, `script = ExtResource("1")` = res://art/car_sheet.gd). `car_sheet.gd`: `class_name CarSheet`, `extends Control`, `const COLS := 4`, `const W := 1280.0`, `const H := 720.0`; `build()` (idempotent, `_ready()` calls it): `size = Vector2(W, H)`; a `ColorRect` `Back` full rect `1b1740`; `ids := CarView.manifest().get("cars", {}).keys()` sorted; `cells := ids.size() * 2`; `rows := ceili(float(cells) / COLS)`; `cell := Vector2(W / COLS, H / max(rows, 1))`. For car index `i`: cell `2*i` is the side view with `wear = float(i % 4)`, cell `2*i+1` the three-quarter view with wear 0.0. Cell `k` is at column `k % COLS`, row `k / COLS`. Each cell is a `CarView` (named `Cell_<k>`, `position` = column * cell.x, row * cell.y, `size` = cell, `custom_minimum_size` = cell) with `build()`, `set_view(...)`, then `get_node("Box").stretch_shrink = 2`, `set_car(id)`, `set_wear(...)`, plus a `Label` child named `Tag` (font size 12, white, outline black 3 px, position (4, 2)) with the text `<game_name> w<wear int>` (game name from the manifest; ASCII).
2. `tools/godot/contact_sheet_cars.sh` (sh): `HERE=$(cd "$(dirname "$0")" && pwd)`; `OUT=${1:-/tmp/car_sheet.png}`; `sh "$HERE/gshot.sh" art/car_sheet.tscn "$OUT" 40 1280x720`; echo `SHEET $OUT`. Pass the exit status of gshot on. Header comment with usage.
3. `godot/tests/test_car_sheet.gd`: instantiate `res://art/car_sheet.tscn`, `build()`; with the manifest's N cars the node has `Back` plus `2 * N` children named `Cell_0` .. (check `Cell_0` and `Cell_<2N-1>` exist); `Cell_0` is a CarView with `view` `side`, `car_id` equal to the first sorted id and `wear` 0.0; `Cell_2` has wear 1.0 (car index 1), `Cell_8` (car index 4) has wear 0.0; `Cell_1` has view `three_quarter` and wear 0.0; cell sizes are `(320, 720 / rows)`; each `Cell_k` has a child `Tag` whose text contains `w` and a game name from the manifest; `Cell_0.get_node("Box").stretch_shrink` is 2. Free the node.
4. Run `sh tools/godot/contact_sheet_cars.sh /tmp/gda17.png`; the output must contain NO line with `ERROR`. Open the PNG with the Read tool and DESCRIBE it in your final reply: how many cars are visible, whether each shows paint, glass, chrome and wheels, whether the wear levels visibly differ (dirt, rust, dull paint, cracked glass on the wreck), anything black or cut off.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_car_sheet` last line is `GDTEST OK`.
- `sh tools/godot/contact_sheet_cars.sh /tmp/gda17.png` prints `SHEET /tmp/gda17.png`, no `ERROR` line; you viewed the PNG and described it.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Do not change CarView. The sheet is a review tool, not a game scene.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDA17: Contact sheet of all cars (one review image)`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
