[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDU05 UI: animated money and number counter

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDU05
Needs (already merged into `dev`): GDU01, GDF07
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
`UiCounter`: a number that rolls up or down to its new value over 0.7 s (ease-out cubic) and flashes green when it rises and red when it falls. Used by the CASH bar and anywhere else money changes.

## Read first
- docs/GODOT.md (the plan: layout zones, the TV is the centre, tap rule, 64 px touch targets)
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` (it is a RefCounted, so there is NO scene and NO `await`); every `func test_*() -> void` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `tree()` (the SceneTree), `autoload(name)`. To test a node: `tree().root.add_child(n)` and finish the test with `n.free()`. Never wait for frames: every animated widget has `advance(dt)` (seconds) so a test steps time by hand. Mouse input is simulated by calling the widget's public `handle_event(ev)`; copy this helper into the test file: `func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:` creating `InputEventMouseButton.new()` with `button_index = MOUSE_BUTTON_LEFT`, `pressed = down`, `position = pos`
- godot/ui/ui_theme.gd (GDU01: `UiTheme.color(name)`, `font_for(role)`, `size_for(role)`, `draw_box`, `draw_text`, `draw_bar`, `TOUCH`)
- godot/core/format.gd (GDF07: `CoreFormat.money(n)`)
- src/ui/tokens.js EASE.outCubic and MOTION.count (700 ms)

## Files you may change (and nothing else)
- `godot/ui/counter.gd`
- `godot/tests/test_ui_counter.gd`

## Steps
1. `godot/ui/counter.gd`: `class_name UiCounter`, `extends Control`. Consts `DURATION := 0.7`. Vars with setters calling `queue_redraw()`: `money_mode: bool = true`, `prefix: String = ""`, `suffix: String = ""`, `role: String = "h2"`, `align: int = HORIZONTAL_ALIGNMENT_LEFT`, `base_color: Color = UiTheme.color("white")`. Private: `_from: float`, `_to: float`, `_shown: float`, `_elapsed: float = DURATION` (finished), `_dir: int = 0` (1 rising, -1 falling, 0 none). `mouse_filter = MOUSE_FILTER_IGNORE` in `_init`; `size = Vector2(240, 48)`.
2. `func set_value(v: float, animate: bool = true) -> void`: if `not animate` or `v == _shown`: `_from = v; _to = v; _shown = v; _elapsed = DURATION; _dir = 0`. Else: `_from = _shown; _to = v; _elapsed = 0.0; _dir = 1 if v > _shown else -1`. `queue_redraw()`. `func advance(dt: float) -> void`: if `_elapsed >= DURATION` return; `_elapsed = minf(DURATION, _elapsed + dt)`; `var u := _elapsed / DURATION`; `var e := 1.0 - pow(1.0 - u, 3.0)`; `_shown = _from + (_to - _from) * e`; when `_elapsed >= DURATION`: `_shown = _to; _dir = 0`. `queue_redraw()`. `_process(dt)` calls `advance(dt)`. `func value_shown() -> float`, `func target() -> float`, `func is_animating() -> bool: return _elapsed < DURATION`.
3. `func text() -> String`: `var n := int(floor(_shown + 0.5))`; money mode: `prefix + CoreFormat.money(n) + suffix`; otherwise `prefix + str(n) + suffix`. `func current_color() -> Color`: `_dir == 1` -> `UiTheme.color("good")`, `_dir == -1` -> `UiTheme.color("bad")`, else `base_color`. `_draw()`: `UiTheme.draw_text(self, text(), Vector2(0, (size.y - UiTheme.size_for(role)) / 2.0), role, current_color(), size.x, align)`.
4. `godot/tests/test_ui_counter.gd` (every `near` in this file uses eps 0.01): `test_instant`: `set_value(1000.0, false)`; `value_shown()` near 1000.0; `text() == CoreFormat.money(1000)`; `is_animating()` false. `test_roll_up`: new counter `c` (money_mode true), `set_value(0.0, false)`, `set_value(1000.0, true)`; `is_animating()` true; `current_color() == UiTheme.color("good")`; `advance(0.35)` -> `value_shown()` near 875.0 (eps 0.001; u = 0.5, eased 0.875); `advance(0.35)` -> near 1000.0, `is_animating()` false, `current_color() == c.base_color`. `test_roll_down_and_retarget`: from 1000 `set_value(500.0, true)`: colour "bad"; `advance(0.35)` -> near 937.5 + ... compute: from 1000 to 500, eased 0.875 -> 562.5 (assert near 562.5); then `set_value(0.0, true)` mid-animation starts from 562.5: `advance(0.35)` -> near `562.5 - 562.5 * 0.875 == 70.3125`. `test_number_mode`: `money_mode = false`, `prefix = "x"`, `suffix = "!"`, `set_value(7.4, false)` gives `text() == "x7!"`; 7.5 gives "x8!". `test_zero_dt`: `advance(0.0)` on a finished counter changes nothing.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_ui_counter` last line is `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDU05: UI: animated money and number counter`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
