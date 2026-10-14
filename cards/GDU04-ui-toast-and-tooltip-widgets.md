[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDU04 UI: toast and tooltip widgets

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDU04
Needs (already merged into `dev`): GDU01, GDU31
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Two pop-up Controls: `UiToast` (stacked slide-in messages, max 3 at once, rest queued) and `UiTooltip` (small label that appears after a short delay next to a rectangle, clamped on screen).

## Read first
- docs/GODOT.md (the plan: layout zones, the TV is the centre, tap rule, 64 px touch targets)
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` (it is a RefCounted, so there is NO scene and NO `await`); every `func test_*() -> void` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `tree()` (the SceneTree), `autoload(name)`. To test a node: `tree().root.add_child(n)` and finish the test with `n.free()`. Never wait for frames: every animated widget has `advance(dt)` (seconds) so a test steps time by hand. Mouse input is simulated by calling the widget's public `handle_event(ev)`; copy this helper into the test file: `func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:` creating `InputEventMouseButton.new()` with `button_index = MOUSE_BUTTON_LEFT`, `pressed = down`, `position = pos`
- godot/ui/ui_theme.gd (GDU01: `UiTheme.color(name)`, `font_for(role)`, `size_for(role)`, `draw_box`, `draw_text`, `draw_bar`, `TOUCH`)
- godot/ui/ui_text.gd (GDU31: `UiText.wrap(text, max_chars, max_lines) -> Array[String]`, `ellipsize(text, max_chars)`, `pips(n)`)
- src/ui/overlays.js (toast look and timings: in 0.26 s, hold 2.5 s, out 0.2 s)

## Files you may change (and nothing else)
- `godot/ui/toast.gd`
- `godot/ui/tooltip.gd`
- `godot/tests/test_ui_toast.gd`

## Steps
1. `godot/ui/toast.gd`: `class_name UiToast`, `extends Control`. Consts `IN := 0.26`, `OUT := 0.2`, `MAX_VISIBLE := 3`, `MAX_QUEUE := 8`, `MAX_CHARS := 60`, `ROW_H := 48`, `GAP := 8`. `mouse_filter = MOUSE_FILTER_IGNORE` (set in `_init`). Vars `items: Array = []` (each a Dictionary `{"text": String, "age": float, "hold": float}`), `queue: Array = []` (pending Dictionaries).
2. `func show_text(text: String, hold: float = 2.5) -> void`: `var t := UiText.ellipsize(text, MAX_CHARS)`; if `t == ""` return; if `items` is not empty and `items.back().text == t` then `items.back().age = 0.0` and return; if `items.size() >= MAX_VISIBLE`: append to `queue` (if the queue already has `MAX_QUEUE` entries drop the oldest first) else append the item to `items`. `queue_redraw()`. `func advance(dt: float) -> void`: add `dt` to every item's age; remove items whose age > `IN + hold + OUT`; then while `items.size() < MAX_VISIBLE` and the queue is not empty move `queue.pop_front()` into `items`; `queue_redraw()`. `_process(dt)` calls `advance(dt)`. `func alpha_of(item: Dictionary) -> float`: `age < IN` -> `age / IN`; `age < IN + hold` -> 1.0; else `clampf(1.0 - (age - IN - item.hold) / OUT, 0.0, 1.0)`. `func active_count() -> int`, `func queued_count() -> int`, `func texts() -> Array[String]` (texts of `items`, oldest first).
3. `UiToast._draw()`: the newest toast is lowest. For item index i (0 = oldest) the box is `Rect2(x, y, w, ROW_H)` with `w = minf(size.x - 64.0, 12.0 * text.length() + 48.0)`, `x = (size.x - w) / 2.0`, `y = size.y - 140.0 - (items.size() - i) * (ROW_H + GAP) + (1.0 - alpha) * 16.0`. Draw with `UiTheme.draw_box(...)` fill "paper", then the text (role "caption", colour "ink", centred in the box); multiply every colour's alpha by `alpha_of(item)` (build the colours with `Color(c.r, c.g, c.b, c.a * alpha)`).
4. `godot/ui/tooltip.gd`: `class_name UiTooltip`, `extends Control`. `mouse_filter = MOUSE_FILTER_IGNORE`, starts `visible = false`. Consts `DELAY := 0.4`, `MARGIN := 8`. Vars `text: String`, `_pending: bool`, `_wait: float`, `_anchor: Rect2`, `bounds: Vector2 = Vector2(1280, 720)`. `static func measure(text: String) -> Vector2`: `Vector2(10.0 * text.length() + 24.0, 40.0)`. `static func compute_position(anchor: Rect2, tip: Vector2, limit: Vector2) -> Vector2`: `x = anchor.get_center().x - tip.x / 2.0`, `y = anchor.position.y - tip.y - 8.0`; if `y < 0.0` then `y = anchor.end.y + 8.0`; clamp `x` to `[0.0, maxf(0.0, limit.x - tip.x)]` and `y` to `[0.0, maxf(0.0, limit.y - tip.y)]`; return `Vector2(x, y)`.
5. `func request(tip_text: String, anchor: Rect2) -> void`: store text/anchor, `_pending = true`, `_wait = 0.0`, `visible = false`. `func advance(dt: float) -> void`: if `_pending`, `_wait += dt`; when `_wait >= DELAY`: `_pending = false`, `size = measure(text)`, `position = compute_position(_anchor, size, bounds)`, `visible = true`, `queue_redraw()`. `func hide_tip() -> void`: `_pending = false; visible = false`. `_process(dt)` calls `advance(dt)`. `_draw()`: `UiTheme.draw_box(self, Rect2(Vector2.ZERO, size), UiTheme.color("night"), UiTheme.color("lamp"), 2, true)` and the text (role "caption", colour "cream") at (12, 8).
6. `godot/tests/test_ui_toast.gd`: `test_toast_flow`: new UiToast `t` with `size = Vector2(1280, 720)`; `show_text("A")` -> `active_count() == 1`; `advance(1.0)` still 1; `advance(2.5)` (total 3.5, past 0.26 + 2.5 + 0.2 = 2.96) -> 0. `test_toast_limits`: show "A", "B", "C", "D": `active_count() == 3`, `queued_count() == 1`, `texts() == ["A", "B", "C"]`; `advance(3.5)` removes the first three and promotes D in the same call: `texts() == ["D"]`, `queued_count() == 0`. `test_toast_duplicate`: `show_text("A")`, `advance(0.5)`, `show_text("A")`: still 1 item and its `age` is 0.0. `test_toast_truncate`: a 100-character string is stored as 60 characters ending in "...". `test_toast_alpha`: `alpha_of({"text": "x", "age": 0.13, "hold": 2.5})` near 0.5 (eps 0.001); age 1.0 -> 1.0; age `0.26 + 2.5 + 0.1` -> near 0.5. `test_tooltip_position`: `UiTooltip.compute_position(Rect2(100, 100, 40, 40), Vector2(80, 40), Vector2(1280, 720)) == Vector2(80, 52)`; an anchor at `Rect2(100, 10, 40, 40)` (no room above) gives y == 58; an anchor at `Rect2(1270, 300, 40, 40)` gives x == 1200 (clamped: 1280 - 80). `test_tooltip_delay`: `request("HELLO", Rect2(100, 100, 40, 40))`; `advance(0.3)` -> not visible; `advance(0.2)` -> visible and `size == UiTooltip.measure("HELLO")`; `hide_tip()` -> not visible; `request` then `hide_tip()` then `advance(1.0)` stays hidden. `UiTooltip.measure("HELLO") == Vector2(74, 40)`.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_ui_toast` last line is `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDU04: UI: toast and tooltip widgets`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
