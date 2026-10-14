[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDU21 UI: Gold Number Plate slots and CASH bar

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDU21
Needs (already merged into `dev`): GDU02, GDU05
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Two HUD pieces for the bottom strip: `UiPlateRow` (the four Gold Number Plate slots, tappable for a hint) and `UiCashBar` (green CASH bar with the money figure rolling via UiCounter).

## Read first
- docs/GODOT.md (the plan: layout zones, the TV is the centre, tap rule, 64 px touch targets)
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` (it is a RefCounted, so there is NO scene and NO `await`); every `func test_*() -> void` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `tree()` (the SceneTree), `autoload(name)`. To test a node: `tree().root.add_child(n)` and finish the test with `n.free()`. Never wait for frames: every animated widget has `advance(dt)` (seconds) so a test steps time by hand. Mouse input is simulated by calling the widget's public `handle_event(ev)`; copy this helper into the test file: `func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:` creating `InputEventMouseButton.new()` with `button_index = MOUSE_BUTTON_LEFT`, `pressed = down`, `position = pos`
- godot/ui/ui_theme.gd (GDU01: `UiTheme.color(name)`, `font_for(role)`, `size_for(role)`, `draw_box`, `draw_text`, `draw_bar`, `TOUCH`)
- godot/ui/tap.gd (GDU02: `UiTap` with `press(id)`, `release(id) -> bool`, `cancel()`)
- godot/ui/counter.gd (GDU05)
- src/art/hud.js (plate codes FC SB HN HT, gold when won, grey when not) and docs/art/RSAMH_STYLE.md section 3

## Files you may change (and nothing else)
- `godot/ui/plate_row.gd`
- `godot/ui/cash_bar.gd`
- `godot/tests/test_ui_plates_cash.gd`

## Steps
1. `godot/ui/plate_row.gd`: `class_name UiPlateRow`, `extends Control`. Signal `plate_tapped(key: String)`. `const KEYS: Array[String] = ["fatcat", "stable", "household", "hammer"]`, `const CODES := {"fatcat": "FC", "stable": "SB", "household": "HN", "hammer": "HT"}`. `var plates: Dictionary = {}`, `var _tap := UiTap.new()`. `_init`: `size = Vector2(280, 64)`, `mouse_filter = MOUSE_FILTER_STOP`. `func set_plates(p: Dictionary) -> void: plates = p; queue_redraw()`. `func is_won(key: String) -> bool: return plates.get(key, false) == true`. `func slot_rect(i: int) -> Rect2: return Rect2(i * 72, 0, 64, 64)` (a 64x64 touch cell). `func slot_at(pos: Vector2) -> int`: the slot index whose rect contains `pos`, else -1. `handle_event(ev)` (and `_gui_input` forwarding): left press `_tap.press("p%d" % slot)` ("" when -1); left release: if `_tap.release(...)` for the same slot and slot >= 0, emit `plate_tapped(KEYS[slot])`.
2. `UiPlateRow._draw()`: for each slot: the visible plate is `Rect2(cell.position + Vector2(4, 12), Vector2(56, 40))`; won: `UiTheme.draw_box(self, plate, UiTheme.color("gold"), UiTheme.color("ink"), 4, true)` with a 2 px "brassLight" highlight line along the top inside edge, code text colour "ink"; not won: fill "midgrey", code text colour "darkgrey". The two-letter code is drawn centred with role "h3" (16 px) at `plate.position + Vector2(0, 12)`, width `plate.size.x`.
3. `godot/ui/cash_bar.gd`: `class_name UiCashBar`, `extends Control`. `const TARGET := 100000.0` (the Fat Cat plate). `_init`: `size = Vector2(280, 44)`, `mouse_filter = MOUSE_FILTER_IGNORE`. A child `UiCounter` named "Counter" created in `_ready()`: `position = Vector2(88, 0)`, `size = Vector2(184, 44)`, `role = "h3"`, `align = HORIZONTAL_ALIGNMENT_RIGHT`, `money_mode = true`. `var cash: float`. `static func fill_ratio(c: float) -> float: return clampf(c / TARGET, 0.0, 1.0)`. `func set_cash(c: float, animate: bool = true) -> void`: `cash = c`; `$Counter.set_value(c, animate)`; `$Counter.base_color = UiTheme.color("bad") if c < 0.0 else UiTheme.color("white")`; `queue_redraw()`. `_draw()`: `UiTheme.draw_bar(self, Rect2(Vector2.ZERO, size), fill_ratio(cash), UiTheme.color("cashGreen"), UiTheme.color("cashDark"))`, then "CASH" with `UiTheme.draw_text(self, "CASH", Vector2(12, 14), "h3", UiTheme.color("cream"))`.
4. `godot/tests/test_ui_plates_cash.gd`: `test_slots`: `UiPlateRow.new()`: `slot_rect(0) == Rect2(0, 0, 64, 64)`, `slot_rect(3) == Rect2(216, 0, 64, 64)`, `slot_at(Vector2(70, 10)) == -1` (the 8 px gap), `slot_at(Vector2(80, 10)) == 1`, `slot_at(Vector2(300, 10)) == -1`. `test_won`: `set_plates({"fatcat": true, "stable": false})`: `is_won("fatcat")` true, `is_won("stable")` false, `is_won("hammer")` false. `test_tap`: connect `plate_tapped` to collect keys; press (80, 10) release (82, 12) gives `["stable"]`; press slot 1 and release on slot 2 (150, 10) gives nothing new; press in the gap (70, 10) release there: nothing new. `test_fill_ratio`: `UiCashBar.fill_ratio(50000.0)` near 0.5; `(-5.0)` is 0.0; `(250000.0)` is 1.0. `test_cash_bar`: add a `UiCashBar` to the tree (`tree().root.add_child`) so `_ready` runs; `set_cash(1500.0, false)`; `$Counter.text() == CoreFormat.money(1500)` (use `get_node("Counter")`); `set_cash(-20.0, false)`: counter `base_color == UiTheme.color("bad")`; free the node.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_ui_plates_cash` last line is `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDU21: UI: Gold Number Plate slots and CASH bar`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
