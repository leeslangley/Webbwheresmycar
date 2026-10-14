[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDR15 StageFit: centred 1280x720 stage, wide strips, safe area

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDR15
Needs (already merged into `dev`): GDR11, GDR19
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Wide-screen and notch handling. The window uses stretch `canvas_items` with aspect `expand`: the 1280x720 stage stays centred and unscaled relative to its height, extra width (or height on a 4:3 iPad) shows only background. Pure helpers compute the centred stage rect, the safe-area insets in STAGE units (a notch that lies in the extra strips costs the stage nothing; port of viewInsets in src/ui/canvas.js / WD cards) and the strip filler: four ColorRects in each room's Background layer so the extra area is never empty. Flow calls them on every resize and room change.

## Read first
- docs/GODOT.md (plan, TV-centred layout, tap rule, determinism) and docs/GODOT_PLANNER_BRIEF.md section SHARED CONTRACTS (Game, Data, Sim*, Core*, tests, tools)
- godot/rooms/room_base.gd (GDR19, class `RoomBase extends Control`): `LAYER_NAMES`, `build_layers()`, `layer(name)`, `placeholder(name)`, `set_plate(layer, tex, pos)`, `add_hotspot(id, rect)`, `hotspots`, `game` + `get_game()`, signals `request_scene(scene_id: StringName, params: Dictionary)`, `chatter(text)`, `toast(text)`, statics `add_box`, `add_panel`, `add_label`, `pixel_font`. Rooms are built IN CODE in `_ready` (the .tscn is only a root Control with the script), so every node name in a card is an exact contract for the art cards (GDA) and the tests.
- Tests: `godot/tests/test_<name>.gd` starts with `extends "res://tests/harness.gd"`; every method named `test_*` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`. Run one file with `sh tools/godot/gtest.sh test_<name>` (last line `GDTEST OK`).
- Test hygiene: get the tree with `var tree := Engine.get_main_loop() as SceneTree`; add a node with `tree.root.add_child(n)` when its `_ready` must run; at the end of each test `tree.root.remove_child(n)` (if added) and `n.free()`. Nodes made with `.new()` and never added can simply be `free()`d.
- /Users/leelangley/wt/webbwheresmycar/_dev/src/ui/canvas.js (fitLayout, viewInsets, safeRect)
- docs/art/WD.md (the wide-screen decision)
- godot/scenes/flow.gd (GDR11: the `_after_install` hook)

## Files you may change (and nothing else)
- `godot/rooms/stage_fit.gd`
- `godot/scenes/flow.gd`
- `godot/tests/test_stage_fit.gd`

## Steps
1. `godot/rooms/stage_fit.gd`: `class_name StageFit`, `extends RefCounted`, all `static`, `const STAGE := Vector2(1280, 720)`. `stage_rect(vp: Vector2) -> Rect2` = `Rect2(((vp - STAGE) * 0.5).round(), STAGE)`. `strip_size(vp: Vector2) -> Vector2` = `Vector2(maxf(0.0, (vp.x - 1280.0) / 2.0), maxf(0.0, (vp.y - 720.0) / 2.0))`. `insets_in_stage(win_px: Vector2, safe_px: Rect2, vp: Vector2) -> Dictionary`: zeros `{"left": 0.0, "right": 0.0, "top": 0.0, "bottom": 0.0}` when any of win / vp is not positive; else `scale = minf(win_px.x / vp.x, win_px.y / vp.y)`; `l = safe_px.position.x / scale`, `r = (win_px.x - safe_px.end.x) / scale`, `t = safe_px.position.y / scale`, `b = (win_px.y - safe_px.end.y) / scale` (each at least 0); subtract the strips: `left = maxf(0, l - strip.x)`, `right = maxf(0, r - strip.x)`, `top = maxf(0, t - strip.y)`, `bottom = maxf(0, b - strip.y)`. `safe_rect(ins: Dictionary) -> Rect2` = `Rect2(ins.left, ins.top, 1280.0 - ins.left - ins.right, 720.0 - ins.top - ins.bottom)`.
2. `add_strips(room: RoomBase, color: Color) -> void`: idempotent (return if `Background/StripL` exists). In `room.layer("Background")` add `ColorRect`s (mouse_filter IGNORE, `color`): `StripL` Rect2(-640, 0, 640, 720), `StripR` Rect2(1280, 0, 640, 720), `StripT` Rect2(-640, -300, 2560, 300), `StripB` Rect2(-640, 720, 2560, 300); `move_child` each to the front (index 0..3) so the `Plate` and placeholders draw above them.
3. Edit `godot/scenes/flow.gd`: `signal layout_changed(stage: Rect2, insets: Dictionary)`, `var safe_insets: Dictionary = {"left": 0.0, "right": 0.0, "top": 0.0, "bottom": 0.0}`. `func fit_stage()`: `var vp := get_viewport_rect().size`, `var win := Vector2(DisplayServer.window_get_size())`, `var safe := Rect2(DisplayServer.get_display_safe_area())`, `safe_insets = StageFit.insets_in_stage(win, safe, vp)`, `layout_changed.emit(StageFit.stage_rect(vp), safe_insets)`. Call `fit_stage()` at the end of `_ready` and connect `get_viewport().size_changed` to it. Fill the GDR11 hook: `func _after_install(node: Node) -> void: if node is RoomBase: StageFit.add_strips(node, node.strip_color)`.
4. `godot/tests/test_stage_fit.gd`: `stage_rect(Vector2(1280, 720)) == Rect2(0, 0, 1280, 720)`; `(1568, 720)` -> `Rect2(144, 0, 1280, 720)`; `(1600, 720)` -> position `(160, 0)`; `(1280, 960)` -> `Rect2(0, 120, 1280, 720)`. `strip_size(Vector2(1600, 720)) == Vector2(160, 0)`; `(1280, 960)` -> `(0, 120)`. `insets_in_stage`: win (2400, 1080), vp (1600, 720), safe `Rect2(120, 0, 2160, 1080)` -> all four 0 (the notch is inside the strips); safe `Rect2(300, 60, 1800, 960)` -> left 40, right 40, top 40, bottom 40; safe equal to the whole window -> zeros; win (1024, 768), vp (1280, 960), safe `Rect2(0, 24, 1024, 720)` -> zeros; win `Vector2.ZERO` -> zeros. `safe_rect({"left": 40.0, "right": 40.0, "top": 40.0, "bottom": 40.0}) == Rect2(40, 40, 1200, 640)`. `add_strips`: `var r := RoomBase.new(); r.build_layers(); StageFit.add_strips(r, Color.RED)`: `Background` first four children are StripL, StripR, StripT, StripB (colour red), `StripR.position == Vector2(1280, 0)`, calling it again adds nothing; the `Plate` sprite is now child index 4. Flow: instantiate main.tscn with `auto_start = false`, `room_paths = {&"a": fake_room}`; `go(&"a")` -> the fake room's `Background/StripL` exists; `fit_stage()` runs without error and `safe_insets` has the four keys. Free the nodes.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_stage_fit` ends with `GDTEST OK`.
- Screenshot step: run `sh tools/godot/gshot.sh scenes/main.tscn /tmp/gdr15_wide.png 12 1600x720`, then LOOK at the PNG with the Read tool and describe it in your final reply (what is where, anything overlapping, anything off screen). If the screenshot step fails because the card it needs is not merged, say so, do not fake it. Use the 1600x720 size on purpose: check the stage is centred, the extra 160 px on each side are filled with the room colour (no black/empty gaps), and nothing tappable sits in the strips.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files. Real art for the strips (GDA).

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDR15: StageFit: centred 1280x720 stage, wide strips, safe area`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
