[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDU02 UI: UiTap rule and UiButton widget

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDU02
Needs (already merged into `dev`): GDU01, GDF02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The tap rule as a tiny class every widget reuses (remember the pressed control on press, activate on release over the SAME control), and the stock button widget (64x64 minimum).

## Read first
- docs/GODOT.md (the plan: layout zones, the TV is the centre, tap rule, 64 px touch targets)
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` (it is a RefCounted, so there is NO scene and NO `await`); every `func test_*() -> void` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `tree()` (the SceneTree), `autoload(name)`. To test a node: `tree().root.add_child(n)` and finish the test with `n.free()`. Never wait for frames: every animated widget has `advance(dt)` (seconds) so a test steps time by hand. Mouse input is simulated by calling the widget's public `handle_event(ev)`; copy this helper into the test file: `func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:` creating `InputEventMouseButton.new()` with `button_index = MOUSE_BUTTON_LEFT`, `pressed = down`, `position = pos`
- godot/ui/ui_theme.gd (GDU01: `UiTheme.color(name)`, `font_for(role)`, `size_for(role)`, `draw_box`, `draw_text`, `draw_bar`, `TOUCH`)
- src/ui/kit_hits.js (the JS tap rule: pressed id remembered on down, compared on up) and src/ui/kit_draw.js `button`

## Files you may change (and nothing else)
- `godot/ui/tap.gd`
- `godot/ui/button.gd`
- `godot/tests/test_ui_button.gd`

## Steps
1. `godot/ui/tap.gd`: `class_name UiTap`, `extends RefCounted`. `var pressed_id: String = ""`. `func press(id: String) -> void: pressed_id = id`. `func release(id: String) -> bool`: `var hit := pressed_id != "" and id == pressed_id`; set `pressed_id = ""`; return `hit`. `func cancel() -> void` clears it. `func is_down() -> bool: return pressed_id != ""`.
2. `godot/ui/button.gd`: `class_name UiButton`, `extends Control`. Signals `activated` and `blocked` (a tap on a disabled button). Vars with setters that call `queue_redraw()`: `text: String`, `kind: String = "normal"` (one of "normal", "primary", "remote", "card"), `enabled: bool = true`, `hot: bool = false` (highlighted/selected), `role: String = "button"`. `var down: bool = false`, `var _tap := UiTap.new()`. `_init()`: `custom_minimum_size = Vector2(64, 64)`, `size = Vector2(64, 64)`, `mouse_filter = Control.MOUSE_FILTER_STOP`, `focus_mode = Control.FOCUS_NONE`.
3. Input: `func _gui_input(event: InputEvent) -> void: handle_event(event)`. `func handle_event(ev: InputEvent) -> void`: only `InputEventMouseButton` with `button_index == MOUSE_BUTTON_LEFT` matters. On press: `_tap.press("b")`, `down = true`, `queue_redraw()`. On release: `var inside := Rect2(Vector2.ZERO, size).has_point(ev.position)`; `var hit := _tap.release("b" if inside else "")`; `down = false`; `queue_redraw()`; if `hit` then `activate()`. `func activate() -> void`: `if enabled: activated.emit() else: blocked.emit()` (the keyboard OK path uses it too). A release without a press does nothing (UiTap returns false).
4. `_draw()`: colours by `kind` (use `UiTheme.color(...)`): normal = fill "paper", text "ink"; primary = fill "good", text "white"; remote = fill "darkgrey", border "black", text "cream"; card = fill "cream", text "ink". A disabled button (`enabled == false`) uses fill "lightgrey" and text "midgrey". While `down` the fill is `fill.darkened(0.15)` and the text is drawn 2 px lower. Draw with `UiTheme.draw_box(self, Rect2(Vector2.ZERO, size), fill, border, 4, not down)`. When `hot` also draw a 4 px "lamp" outline just inside the border (four thin filled rects). The text may contain `\n` (at most 2 lines): split on `\n`, pitch = `UiTheme.size_for(role) + 4`, the block is centred vertically in `size.y`, each line is centred horizontally with `UiTheme.draw_text(self, line, Vector2(0, y), role, text_col, size.x, HORIZONTAL_ALIGNMENT_CENTER)`.
5. `godot/tests/test_ui_button.gd`: `test_tap_class`: `var t := UiTap.new()`; `t.press("a")`; `t.release("a")` true; `t.release("a")` false (second release); `t.press("a")`, `t.release("b")` false and `t.is_down()` false; `t.press("")`, `t.release("")` false; `t.press("a")`, `t.cancel()`, `t.release("a")` false. `test_button_min_size`: a new UiButton has `custom_minimum_size` equal to `Vector2(64, 64)`. `test_button_tap`: button with `size = Vector2(200, 64)` and an Array `hits`; connect `activated` to `func(): hits.append(1)`; press at (10, 10) and release at (12, 12) gives 1 hit; press inside and release at (500, 10) (outside) gives still 1 hit (no new); a release with no press gives still 1; press inside + release inside again gives 2. `test_button_disabled`: `enabled = false`; connect `blocked` to count; press+release inside: `activated` count 0 and `blocked` count 1. `test_button_activate`: `activate()` emits `activated` once when enabled. `test_down_state`: after a press `down` is true, after the release it is false.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_ui_button` last line is `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDU02: UI: UiTap rule and UiButton widget`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
