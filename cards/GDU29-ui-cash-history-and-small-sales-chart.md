[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDU29 UI: cash history and small sales chart

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDU29
Needs (already merged into `dev`): GDU01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The small white SALES chart of the bottom HUD and the ledger channel: `UiCashHistory` (a static recent-cash series) feeding `UiSalesChart` (a Control that plots a line).

## Read first
- docs/GODOT.md (the plan: layout zones, the TV is the centre, tap rule, 64 px touch targets)
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` (it is a RefCounted, so there is NO scene and NO `await`); every `func test_*() -> void` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `tree()` (the SceneTree), `autoload(name)`. To test a node: `tree().root.add_child(n)` and finish the test with `n.free()`. Never wait for frames: every animated widget has `advance(dt)` (seconds) so a test steps time by hand. Mouse input is simulated by calling the widget's public `handle_event(ev)`; copy this helper into the test file: `func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:` creating `InputEventMouseButton.new()` with `button_index = MOUSE_BUTTON_LEFT`, `pressed = down`, `position = pos`
- godot/ui/ui_theme.gd (GDU01: `UiTheme.color(name)`, `font_for(role)`, `size_for(role)`, `draw_box`, `draw_text`, `draw_bar`, `TOUCH`)
- docs/art/RSAMH_STYLE.md section 3 (white SALES chart panel)

## Files you may change (and nothing else)
- `godot/ui/cash_history.gd`
- `godot/ui/sales_chart.gd`
- `godot/tests/test_ui_chart.gd`

## Steps
1. `godot/ui/cash_history.gd`: `class_name UiCashHistory`, `extends RefCounted`, static only. `const MAX := 30`. `static var _days: Array[int] = []`, `static var _vals: Array[float] = []`. `static func record(day: int, cash: float) -> void`: if `_days` is not empty and `day == _days.back()` replace the last value; elif `_days` is not empty and `day < _days.back()` (a new or loaded game went back in time) clear both arrays then append; else append; then drop the oldest entries while there are more than `MAX`. `static func values(n: int = 14) -> Array[float]`: the last `n` values (all of them if fewer), oldest first. `static func count() -> int`. `static func reset() -> void` clears both.
2. `godot/ui/sales_chart.gd`: `class_name UiSalesChart`, `extends Control`. `_init`: `size = Vector2(320, 114)`, `mouse_filter = MOUSE_FILTER_IGNORE`. `var values: Array[float] = []`. `func set_values(v: Array) -> void`: copy into `values` as floats; `queue_redraw()`. `func plot_rect() -> Rect2: return Rect2(12, 34, size.x - 24, size.y - 46)`. `static func scale_points(vals: Array, r: Rect2) -> PackedVector2Array`: empty input -> empty; one value -> one point at `r.get_center()`; otherwise `x = r.position.x + i * r.size.x / (n - 1)` and `y = r.end.y - (v - lo) / (hi - lo) * r.size.y` where `lo`/`hi` are the min/max of the values; when `hi == lo` every `y` is `r.position.y + r.size.y / 2.0`.
3. `UiSalesChart._draw()`: `UiTheme.draw_box(self, Rect2(Vector2.ZERO, size), UiTheme.color("chartWhite"), UiTheme.color("ink"), 4, true)`; the title "SALES" (role "h3", colour "ink") at (12, 10); three faint horizontal grid lines in "paperShade" across `plot_rect()` at 0, 50 and 100 %; if there are at least 2 points `draw_polyline(points, UiTheme.color("cashDark"), 3.0)` and a 6x6 "bad"/"good" square on the last point (good when the last value >= the first, else bad); with fewer than 2 points draw the caption "no sales yet" (role "caption", colour "midgrey") centred in the plot rect.
4. `godot/tests/test_ui_chart.gd`: `test_history_record`: `UiCashHistory.reset()`; `record(1, 100.0)`, `record(2, 150.0)`, `record(2, 160.0)` (same day replaces): `values() == [100.0, 160.0]` and `count() == 2`. `test_history_cap`: reset, record days 1..40 with cash == day: `count() == 30`, `values(3) == [38.0, 39.0, 40.0]`, `values(100).size() == 30`. `test_history_rewind`: reset, record 5 days then `record(2, 9.0)` (earlier day): `values() == [9.0]`. `test_scale_points`: `UiSalesChart.scale_points([0.0, 10.0, 5.0], Rect2(0, 0, 100, 50))` equals `PackedVector2Array([Vector2(0, 50), Vector2(50, 0), Vector2(100, 25)])`; `scale_points([3.0, 3.0], Rect2(0, 0, 100, 50))` equals `PackedVector2Array([Vector2(0, 25), Vector2(100, 25)])`; `scale_points([5.0], Rect2(0, 0, 100, 50)) == PackedVector2Array([Vector2(50, 25)])`; `scale_points([], Rect2(0, 0, 100, 50)).size() == 0`. `test_chart_values`: `set_values([1, 2, 3])` leaves `values == [1.0, 2.0, 3.0]`; `plot_rect() == Rect2(12, 34, 296, 68)`. End `test_history_*` tests with `UiCashHistory.reset()` so other tests start clean.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_ui_chart` last line is `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDU29: UI: cash history and small sales chart`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
