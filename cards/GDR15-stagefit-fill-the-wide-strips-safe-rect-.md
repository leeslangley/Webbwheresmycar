[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDR15 StageFit: fill the wide strips, safe rect, wide-screen test

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDR15
Needs (already merged into `dev`): GDR11, GDR19, GDU08
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Wide-screen handling on top of GDU08's Main (which already centres the 1280x720 Stage and computes the notch insets: `Main.stage_position`, `Main.stage_insets`, `main.stage_safe`). The window uses stretch `canvas_items` with aspect `expand`, so on a tall phone (or a 4:3 iPad) extra picture appears left and right (or above and below) of the stage. This card makes sure that area is never empty: four ColorRects in each room's Background layer, plus a small `safe_rect` helper rooms and HUD can use. Flow calls it for every room it installs.

## Read first
- docs/GODOT.md (plan, TV-centred layout, tap rule, determinism) and docs/GODOT_PLANNER_BRIEF.md section SHARED CONTRACTS (Game, Data, Sim*, Core*, tests, tools)
- godot/rooms/room_base.gd (GDR19, class `RoomBase extends Control`): `LAYER_NAMES`, `build_layers()`, `layer(name)`, `placeholder(name)`, `ui()`, `set_plate(layer, tex, pos)`, `add_hotspot(id, rect) -> RoomHotspot` (invisible tap rect), `add_button(id, rect, text, kind) -> UiButton`, `hotspots` (id -> control, both kinds), `game` + `get_game()`, signals `request_scene(scene_id: StringName, params: Dictionary)`, `chatter(text)`, `toast(text)`, virtuals `enter(params)`, `exit()`, `_on_hotspot(id)`, `_on_button_blocked(id)`, `_on_button_down(id)`, statics `add_box`, `add_panel`, `add_label`, `pixel_font`. Rooms are built IN CODE in `_ready` (the .tscn is only a root Control with the script), so every node name in a card is an exact contract for the art cards (GDA) and the tests. Rooms are shown by the SceneHost (GDU30), which calls `enter(params)` after adding and `exit()` before removing.
- Tests: `godot/tests/test_<name>.gd` starts with `extends "res://tests/harness.gd"`; every method named `test_*` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`. Run one file with `sh tools/godot/gtest.sh test_<name>` (last line `GDTEST OK`).
- Test hygiene: get the tree with `var tree := Engine.get_main_loop() as SceneTree`; add a node with `tree.root.add_child(n)` when its `_ready` must run; at the end of each test `tree.root.remove_child(n)` (if added) and `n.free()`. Nodes made with `.new()` and never added can simply be `free()`d.
- /Users/leelangley/wt/webbwheresmycar/_dev/src/ui/canvas.js (fitLayout, viewInsets, safeRect)
- docs/art/WD.md (the wide-screen decision)
- godot/scenes/main.gd (GDU08: stage_position, stage_insets, stage_safe, layout)
- godot/scenes/flow.gd (GDR11: the `_after_install` hook)

## Files you may change (and nothing else)
- `godot/rooms/stage_fit.gd`
- `godot/scenes/flow.gd`
- `godot/tests/test_stage_fit.gd`

## Steps
1. `godot/rooms/stage_fit.gd`: `class_name StageFit`, `extends RefCounted`, all `static`, `const STAGE := Vector2(1280, 720)`. `strip_size(vp: Vector2) -> Vector2` = `Vector2(maxf(0.0, (vp.x - 1280.0) / 2.0), maxf(0.0, (vp.y - 720.0) / 2.0))` (the extra picture on each side of the stage). `safe_rect(ins: Dictionary) -> Rect2` = `Rect2(ins.left, ins.top, 1280.0 - ins.left - ins.right, 720.0 - ins.top - ins.bottom)` (`ins` has the keys left, right, top, bottom like `Main.stage_insets`).
2. `add_strips(room: RoomBase, color: Color) -> void`: idempotent (return if `Background/StripL` exists). In `room.layer("Background")` add `ColorRect`s (mouse_filter IGNORE, `color`): `StripL` Rect2(-640, 0, 640, 720), `StripR` Rect2(1280, 0, 640, 720), `StripT` Rect2(-640, -300, 2560, 300), `StripB` Rect2(-640, 720, 2560, 300); `move_child` each to the front (index 0..3) so the `Plate` and placeholders draw above them.
3. Edit `godot/scenes/flow.gd`: fill the GDR11 hook: `func _after_install(node: Node) -> void: if node is RoomBase: StageFit.add_strips(node, node.strip_color)`. Add `func stage_safe() -> Dictionary: return main.stage_safe` (the insets rooms may use for edge buttons).
4. `godot/tests/test_stage_fit.gd`: `strip_size(Vector2(1280, 720)) == Vector2.ZERO`; `(1600, 720)` -> `Vector2(160, 0)`; `(1568, 720)` -> `(144, 0)`; `(1280, 960)` -> `(0, 120)`; `(1000, 500)` -> zero. `safe_rect({"left": 40.0, "right": 40.0, "top": 40.0, "bottom": 40.0}) == Rect2(40, 40, 1200, 640)` and with all zeros `Rect2(0, 0, 1280, 720)`. `add_strips`: `var r := RoomBase.new(); r.build_layers(); StageFit.add_strips(r, Color.RED)`: `Background` first four children are StripL, StripR, StripT, StripB (colour red), `StripR.position == Vector2(1280, 0)`, calling it again adds nothing; the `Plate` sprite is now child index 4. Flow: `var main = load("res://scenes/main.tscn").instantiate()`, `main.auto_start = false`, add to the tree, `main.flow.room_paths = {&"a": "res://tests/fake_room.tscn"}`; `go(&"a")` -> the room's `Background/StripL` exists with `strip_color` (default `Color("14102A")`); `stage_safe()` has the four keys. Free the nodes.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_stage_fit` ends with `GDTEST OK`.
- Screenshot step: run `sh tools/godot/gshot.sh scenes/office.tscn /tmp/gdr15_wide.png 8 1600x720`, then LOOK at the PNG with the Read tool and describe it in your final reply (what is where, anything overlapping, anything off screen). If the screenshot step fails because a card it needs is not merged, say so, do not fake it. The standalone office has no strips (only the Flow adds them): instead take a second shot of the whole game, `sh tools/godot/gshot.sh scenes/main.tscn /tmp/gdr15_main.png 12 1600x720`, and check the stage is centred, the extra 160 px on each side are filled with the loading room colour (no empty gaps) and nothing tappable sits in the strips.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files. The stage centring and notch maths (GDU08). Real art for the strips (GDA).

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDR15: StageFit: fill the wide strips, safe rect, wide-screen test`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
