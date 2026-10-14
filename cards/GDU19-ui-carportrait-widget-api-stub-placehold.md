[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDU19 UI: CarPortrait widget API stub (placeholder drawing)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDU19
Needs (already merged into `dev`): GDU01, GDF03
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
`CarPortrait`, the single API for 'show this car here' (HUD slot, shop detail, bookings). For now it draws a coloured placeholder car with the model name; the GDA cards later swap the inside for the real 3D `CarView` WITHOUT changing this API.

## Read first
- docs/GODOT.md (the plan: layout zones, the TV is the centre, tap rule, 64 px touch targets)
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` (it is a RefCounted, so there is NO scene and NO `await`); every `func test_*() -> void` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `tree()` (the SceneTree), `autoload(name)`. To test a node: `tree().root.add_child(n)` and finish the test with `n.free()`. Never wait for frames: every animated widget has `advance(dt)` (seconds) so a test steps time by hand. Mouse input is simulated by calling the widget's public `handle_event(ev)`; copy this helper into the test file: `func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:` creating `InputEventMouseButton.new()` with `button_index = MOUSE_BUTTON_LEFT`, `pressed = down`, `position = pos`
- godot/ui/ui_theme.gd (GDU01: `UiTheme.color(name)`, `font_for(role)`, `size_for(role)`, `draw_box`, `draw_text`, `draw_bar`, `TOUCH`)
- godot/autoload/data.gd (GDF03: `Data.car_by_id(id) -> Dictionary` ({} if unknown), `Data.paint_of(id) -> String` hex)
- docs/GODOT.md section 'Art in Godot' (CarView in a SubViewport: paint colour set at runtime, wear 0..3)

## Files you may change (and nothing else)
- `godot/ui/car_portrait.gd`
- `godot/tests/test_car_portrait.gd`

## Steps
1. `godot/ui/car_portrait.gd`: `class_name CarPortrait`, `extends Control`. `_init`: `size = Vector2(200, 114)`, `mouse_filter = MOUSE_FILTER_IGNORE`. Private `_id: String = ""`, `_paint: Color = Color(0.53, 0.53, 0.53)`, `_wear: int = 0`. API (the contract; never rename): `func set_car(id: String, paint: Color, wear: int = 0) -> void` (`wear` clamped to 0..3; `queue_redraw()`), `func clear() -> void` (id `""`), `func get_car_id() -> String`, `func get_paint() -> Color`, `func get_wear() -> int`, `func body_color() -> Color: return _paint.darkened(0.12 * _wear)`. `func display_name() -> String`: `""` when no car; else `var m := Data.car_by_id(_id)`; the model's `name` upper-cased, or `_id.to_upper()` when the model is unknown. `static func wear_for(condition: float) -> int: return clampi(int(floor((10.0 - condition) / 2.5)), 0, 3)` (condition 10 = pristine -> 0, condition 0 -> 3).
2. `_draw()`: frame: `UiTheme.draw_box(self, Rect2(Vector2.ZERO, size), UiTheme.color("lightblue"), UiTheme.color("ink"), 4, true)`; three dither rows at y = `size.y * k / 4` for k = 1..3 of 4x4 squares every 8 px in `UiTheme.color("lightblue").lightened(0.18)`. If there is no car, draw "NO CAR" (role "h3", colour "cream") centred. Otherwise the placeholder car, all relative to `size`: body `Rect2(size.x * 0.17, size.y * 0.50, size.x * 0.66, size.y * 0.22)` in `body_color()`; cabin `Rect2(size.x * 0.32, size.y * 0.33, size.x * 0.34, size.y * 0.18)` in `body_color().lightened(0.1)`; windows two `Rect2` inside the cabin in "cyan"; two wheels `draw_circle` at `(size.x * 0.30, size.y * 0.74)` and `(size.x * 0.70, size.y * 0.74)` radius `size.y * 0.10` in "black" with a smaller "lightgrey" hub; if `_wear >= 2` two small rust patches (4x4 squares in "orange") on the body, if `_wear == 3` four. The name `display_name()` is drawn at the bottom on a 24 px "cream" plaque (role "caption", colour "ink", centred, `UiText.ellipsize` not needed: the plaque is clipped by `clip_contents = true` set in `_init`).
3. `godot/tests/test_car_portrait.gd`: `test_api`: `var p := CarPortrait.new()`; `p.set_car("t1_allergy", Color("#8E8455"), 2)`: `get_car_id() == "t1_allergy"`, `get_paint() == Color("#8E8455")`, `get_wear() == 2`; `display_name() == "AUSTEN ALLERGY"` (the real Data entry); `body_color().r` near `Color("#8E8455").darkened(0.24).r` (eps 0.0001). `test_clamp`: `set_car("t1_allergy", Color.RED, 9)` gives wear 3; `set_car("t1_allergy", Color.RED, -4)` gives 0. `test_unknown_and_clear`: `set_car("zzz", Color.RED)` -> `display_name() == "ZZZ"`; `clear()` -> `get_car_id() == ""` and `display_name() == ""`. `test_wear_for`: `wear_for(10.0) == 0`, `wear_for(8.0) == 0`, `wear_for(7.5) == 1`, `wear_for(5.0) == 2`, `wear_for(2.5) == 3`, `wear_for(0.0) == 3`, `wear_for(12.0) == 0`. `test_default_size`: a new CarPortrait has `size == Vector2(200, 114)`.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_car_portrait` last line is `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Any 3D, SubViewport or Blender work (the GDA cards own that).

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDU19: UI: CarPortrait widget API stub (placeholder drawing)`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
