[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDU18 UI: scrolling list widget (drag, fling, tap)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDU18
Needs (already merged into `dev`): GDU01, GDU02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
`UiList`: a vertical list that scrolls by dragging (phones), flings, mouse wheel and keys, and selects a row by TAP (not after a drag). Port of the ScrollList model in src/ui/kit_hits.js. The owner draws the rows through a Callable.

## Read first
- docs/GODOT.md (the plan: layout zones, the TV is the centre, tap rule, 64 px touch targets)
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` (it is a RefCounted, so there is NO scene and NO `await`); every `func test_*() -> void` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `tree()` (the SceneTree), `autoload(name)`. To test a node: `tree().root.add_child(n)` and finish the test with `n.free()`. Never wait for frames: every animated widget has `advance(dt)` (seconds) so a test steps time by hand. Mouse input is simulated by calling the widget's public `handle_event(ev)`; copy this helper into the test file: `func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:` creating `InputEventMouseButton.new()` with `button_index = MOUSE_BUTTON_LEFT`, `pressed = down`, `position = pos`
- godot/ui/tap.gd (GDU02: `UiTap` with `press(id)`, `release(id) -> bool`, `cancel()`)
- src/ui/kit_hits.js class ScrollList (read it all; the numbers 8 px drag threshold, velocity in px per ms, decay 0.95 per 16 ms are copied)

## Files you may change (and nothing else)
- `godot/ui/list.gd`
- `godot/tests/test_ui_list.gd`

## Steps
1. `godot/ui/list.gd`: `class_name UiList`, `extends Control`. Signal `row_tapped(index: int)`. Vars: `row_h: int = 72`, `count: int = 0`, `offset: float = 0.0`, `selected: int = -1`, `row_painter: Callable` (called as `row_painter.call(self, index, rect, is_selected)` from inside `_draw()`; `rect` is the row's `Rect2` in this control's coordinates; when the Callable is not valid a default painter draws the row number), `vel: float = 0.0`, `dragging: bool = false`, private `_start_y`, `_last_y`, `_last_t` (floats), `_tap := UiTap.new()`, `_press_row: int = -1`. `_init`: `size = Vector2(300, 320)`, `clip_contents = true`, `mouse_filter = MOUSE_FILTER_STOP`.
2. Model (exact port): `func max_offset() -> float: return maxf(0.0, count * row_h - size.y)`. `func set_count(n: int) -> void: count = n; offset = clampf(offset, 0.0, max_offset()); selected = mini(selected, n - 1); queue_redraw()`. `func scroll_by(dy: float) -> void: offset = clampf(offset + dy, 0.0, max_offset()); queue_redraw()`. `func begin_drag(y: float, now_ms: float) -> void`: `_start_y = y; _last_y = y; _last_t = now_ms; dragging = false; vel = 0.0`. `func drag_to(y: float, now_ms: float) -> void`: if `absf(y - _start_y) > 8.0` then `dragging = true`; if not dragging return; `scroll_by(_last_y - y)`; `vel = (_last_y - y) / maxf(1.0, now_ms - _last_t)`; `_last_y = y; _last_t = now_ms`. `func end_drag() -> bool`: `var tapped := not dragging`; if tapped `vel = 0.0`; `dragging = false`; return `tapped`. `func advance_ms(dt_ms: float) -> void`: if `dragging` return; if `absf(vel) <= 0.01` { `vel = 0.0`; return }; `scroll_by(vel * dt_ms)`; `vel *= pow(0.95, dt_ms / 16.0)`; if `offset <= 0.0 or offset >= max_offset()` { `vel = 0.0` }; if `absf(vel) <= 0.01` { `vel = 0.0` }. `func advance(dt: float) -> void: advance_ms(dt * 1000.0)`; `_process(dt)` calls `advance(dt)`.
3. Geometry: `func row_at(local_y: float) -> int`: -1 when `local_y < 0` or `>= size.y`; `idx = int(floor((local_y + offset) / row_h))`; -1 when `idx < 0` or `idx >= count`. `func row_rect(i: int) -> Rect2: return Rect2(0.0, i * row_h - offset, size.x, row_h)`. `func visible_range() -> Vector2i`: `Vector2i(0, -1)` when `count == 0`; else `first = int(floor(offset / row_h))`, `last = mini(count - 1, int(ceil((offset + size.y) / row_h)) - 1)`. `func ensure_visible(i: int) -> void`: `var top := i * row_h`; if `top < offset` `scroll_by(top - offset)`; elif `top + row_h > offset + size.y` `scroll_by(top + row_h - offset - size.y)`. `func select(i: int, emit: bool = false) -> void`: `selected = clampi(i, -1, count - 1)`; `ensure_visible` when >= 0; `queue_redraw()`; if `emit` and `selected >= 0` emit `row_tapped(selected)`. `func move_selection(d: int) -> void`: `select(clampi(selected + d, 0, count - 1))` (when `count == 0` do nothing).
4. Input (`_gui_input` forwards to `handle_event(ev)`): `now = Time.get_ticks_msec()` as float. Left press: `_press_row = row_at(ev.position.y)`; `_tap.press("r%d" % _press_row if _press_row >= 0 else "")`; `begin_drag(ev.position.y, now)`. `InputEventMouseMotion` with `(ev.button_mask & MOUSE_BUTTON_MASK_LEFT) != 0`: `drag_to(ev.position.y, now)`. Left release: `var tapped := end_drag()`; `var r := row_at(ev.position.y)`; `var hit := _tap.release("r%d" % r if r >= 0 else "")`; if `tapped and hit` then `select(r)` and emit `row_tapped(r)`. Wheel up/down (`MOUSE_BUTTON_WHEEL_UP` / `MOUSE_BUTTON_WHEEL_DOWN`, pressed): `scroll_by(-row_h / 2.0)` / `scroll_by(row_h / 2.0)`. Keys: KEY_UP -> `move_selection(-1)`, KEY_DOWN -> `move_selection(1)`.
5. `_draw()`: for `i` in `visible_range()`: `row_painter.call(self, i, row_rect(i), i == selected)` when the Callable is valid, else `draw_string(ThemeDB.fallback_font, row_rect(i).position + Vector2(8, 24), str(i))`. When `max_offset() > 0.0` draw a 6 px wide "midgrey" scroll thumb at the right edge: height `size.y * size.y / (count * row_h)` (at least 24), y = `offset / max_offset() * (size.y - height)`.
6. `godot/tests/test_ui_list.gd`: every test builds its own `UiList` `l` with `count = 10`, `row_h = 72`, `size = Vector2(300, 320)` (so no state leaks between tests). `test_model`: `max_offset() == 400.0`; `visible_range() == Vector2i(0, 4)`; `scroll_by(100.0)`: offset 100.0, `visible_range() == Vector2i(1, 5)`, `row_at(10.0) == 1`; `scroll_by(9999.0)` -> 400.0; `scroll_by(-9999.0)` -> 0.0; `row_at(-1.0) == -1`; `row_at(400.0) == -1`; with `count = 2` `row_at(300.0) == -1` (past the last row). `test_rect_and_set_count`: offset 100: `row_rect(2) == Rect2(0, 44, 300, 72)`; `set_count(3)` clamps the offset to 0.0 (max is 216 - 320 < 0 -> 0). `test_tap_vs_drag`: `begin_drag(100.0, 0.0)`, `drag_to(104.0, 10.0)` leaves `dragging == false`, `end_drag() == true`; `begin_drag(100.0, 0.0)`, `drag_to(80.0, 10.0)`: `dragging`, offset 20.0, `vel` near 2.0; `end_drag() == false`. `test_fling`: continuing that state (`vel` 2.0, offset 20.0): `advance_ms(16.0)`: offset near 52.0 and `vel` near 1.9; at the end of the list the velocity is zeroed (`scroll_by(9999.0)` then `vel = 1.0`, `advance_ms(16.0)` -> `vel == 0.0`). `test_ensure_visible_select`: offset 0: `ensure_visible(9)` -> offset 400.0 (`9 * 72 + 72 - 320 = 400`); `ensure_visible(0)` -> 0.0; `select(3)` -> `selected == 3`; `select(99)` -> 9; `select(-5)` -> -1. `test_tap_signal`: collect `row_tapped`; press at (10, 100) (row 1) release at (12, 102) -> `[1]` and `selected == 1`; press row 1, release on row 2 (10, 170) -> nothing new; press, motion to a point 30 px away, release -> no tap (build a motion event: `InputEventMouseMotion.new()` with `position` and `button_mask = MOUSE_BUTTON_MASK_LEFT`). `test_painter`: set `row_painter = func(_l, _i, _r, _s): pass`; calling `queue_redraw()` must not error (`ok(row_painter.is_valid(), "valid")`).

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_ui_list` last line is `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDU18: UI: scrolling list widget (drag, fling, tap)`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
