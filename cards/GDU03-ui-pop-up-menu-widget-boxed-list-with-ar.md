[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDU03 UI: pop-up menu widget (boxed list with arrow cursor)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDU03
Needs (already merged into `dev`): GDU02, GDU01
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The Rock-Star-Ate-My-Hamster style pop-up menu: a small boxed list with a blinking arrow cursor beside the selected row. Used beside the TV and in rooms; rows are 64 px tall.

## Read first
- docs/GODOT.md (the plan: layout zones, the TV is the centre, tap rule, 64 px touch targets)
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` (it is a RefCounted, so there is NO scene and NO `await`); every `func test_*() -> void` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `tree()` (the SceneTree), `autoload(name)`. To test a node: `tree().root.add_child(n)` and finish the test with `n.free()`. Never wait for frames: every animated widget has `advance(dt)` (seconds) so a test steps time by hand. Mouse input is simulated by calling the widget's public `handle_event(ev)`; copy this helper into the test file: `func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:` creating `InputEventMouseButton.new()` with `button_index = MOUSE_BUTTON_LEFT`, `pressed = down`, `position = pos`
- godot/ui/ui_theme.gd (GDU01: `UiTheme.color(name)`, `font_for(role)`, `size_for(role)`, `draw_box`, `draw_text`, `draw_bar`, `TOUCH`)
- godot/ui/tap.gd (GDU02: `UiTap` with `press(id)`, `release(id) -> bool`, `cancel()`)
- docs/art/RSAMH_STYLE.md section 4 (in-scene pop-up menu)

## Files you may change (and nothing else)
- `godot/ui/menu.gd`
- `godot/tests/test_ui_menu.gd`

## Steps
1. `godot/ui/menu.gd`: `class_name UiMenu`, `extends Control`. Signals `chosen(index: int)` and `cancelled`. Consts `ROW := 64`, `PAD := 8`, `CHAR_W := 12`. Vars `items: Array[String] = []`, `disabled: Dictionary = {}` (row index -> true), `selected: int = 0`, `var _t: float = 0.0`, `var _tap := UiTap.new()`. `visible = false` in `_init`, `mouse_filter = MOUSE_FILTER_STOP`.
2. `static func width_for(list: Array) -> int`: `maxi(280, 44 + CHAR_W * longest + 24)` where `longest` is the length of the longest item (0 for an empty list). `func open(list: Array[String], at: Vector2 = Vector2.ZERO) -> void`: `items = list`, `disabled = {}`, `position = at`, `size = Vector2(width_for(list), ROW * list.size() + 2 * PAD)`, `selected = first_enabled()`, `_t = 0.0`, `visible = true`, `queue_redraw()`. `func close() -> void: visible = false`. `func set_item_enabled(i: int, on: bool) -> void` (updates `disabled`). `func first_enabled() -> int`: the first non-disabled index, or 0. `func row_rect(i: int) -> Rect2`: `Rect2(PAD, PAD + i * ROW, size.x - 2 * PAD, ROW)`. `func row_at(pos: Vector2) -> int`: the row whose `row_rect` contains `pos`, else -1.
3. Keys and choosing: `func move(delta: int) -> void`: step `selected` by `delta` (+1 or -1), wrapping with `posmod`, skipping disabled rows (at most `items.size()` attempts; if all are disabled nothing changes). `func choose() -> void`: if the list is empty or the selected row is disabled do nothing; else `var i := selected`, `close()`, `chosen.emit(i)`. `func cancel() -> void: close(); cancelled.emit()`. `func advance(dt: float) -> void: _t += dt; queue_redraw()`; `_process(dt)` calls `advance(dt)` while visible. `func blink_on() -> bool: return int(_t * 4.0) % 2 == 0` (2 blinks per second).
4. `func _gui_input(event: InputEvent) -> void: handle_event(event)`. `func handle_event(ev: InputEvent) -> void`: left-button press: `var r := row_at(ev.position)`; `_tap.press("row%d" % r if r >= 0 else "")`; if `r >= 0` and it is not disabled set `selected = r`; `queue_redraw()`. Left-button release: `var r := row_at(ev.position)`; if `_tap.release("row%d" % r if r >= 0 else "")` and not disabled(r) then `selected = r; choose()`. `InputEventKey` pressed: KEY_UP -> `move(-1)`, KEY_DOWN -> `move(1)`, KEY_ENTER / KEY_KP_ENTER / KEY_SPACE -> `choose()`, KEY_ESCAPE -> `cancel()`.
5. `_draw()`: `UiTheme.draw_box(self, Rect2(Vector2.ZERO, size), UiTheme.color("paper"), UiTheme.color("ink"), 4, true)`. For each row i: if `i == selected` fill `row_rect(i)` with "lamp" at alpha 0.35; text at `row_rect(i).position + Vector2(36, 18)` with role "body", colour "ink" (colour "lightgrey" for disabled rows). The arrow cursor (only when `blink_on()` and the selected row is enabled): `draw_colored_polygon(PackedVector2Array([Vector2(12, cy - 10), Vector2(12, cy + 10), Vector2(30, cy)]), UiTheme.color("ink"))` where `cy = row_rect(selected).get_center().y`.
6. `godot/tests/test_ui_menu.gd`: `test_width_size`: `UiMenu.width_for(["A", "BB"]) == 280`; an item of 30 characters gives `44 + 12 * 30 + 24 == 428`; after `open(["A","B","C"] as Array[String], Vector2(5, 6))`: `position == Vector2(5, 6)`, `size == Vector2(280, 208)` (3 * 64 + 16), `visible`, `selected == 0`. `test_rows`: `row_rect(1) == Rect2(8, 72, 264, 64)`; `row_at(Vector2(20, 80)) == 1`; `row_at(Vector2(2, 80)) == -1`; `row_at(Vector2(20, 300)) == -1`. `test_move`: `move(1)` gives 1; `move(-1)` twice gives 2 (wraps); with `set_item_enabled(1, false)` from 0 `move(1)` gives 2. `test_choose_and_cancel`: connect `chosen` to push the index into an Array: `selected = 2; choose()` gives `[2]` and `visible == false`; reopen, `cancel()` emits `cancelled` once; a choose on a disabled row emits nothing. `test_tap`: reopen; press at (20, 80) (row 1), release at (20, 85): `chosen` gets 1; reopen; press on row 1 and release on row 2 (20, 150): nothing chosen; press outside rows (2, 80) and release there: nothing. `test_blink`: `advance(0.0)` gives `blink_on()` true; `advance(0.25)` false; `advance(0.25)` true.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_ui_menu` last line is `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDU03: UI: pop-up menu widget (boxed list with arrow cursor)`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
