[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDR18 RoomHotspot: invisible tap-rule rect

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDR18
Needs (already merged into `dev`): GDF02, GDU02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The invisible tappable rect rooms put over props (door, poster, kettle ...). It uses the shared tap rule class `UiTap` (press remembered on THIS control, activate only on release inside it) and never lets a touch target be smaller than 64x64. (Visible buttons are `UiButton`s.)

## Read first
- docs/GODOT.md (plan, TV-centred layout, tap rule, determinism) and docs/GODOT_PLANNER_BRIEF.md section SHARED CONTRACTS (Game, Data, Sim*, Core*, tests, tools)
- Widgets from the GDU cards that rooms use: `UiButton` (godot/ui/button.gd: `UiButton.new()`, vars `text` (up to 2 lines, split on \n), `kind` 'normal'|'primary'|'remote'|'card', `enabled`, `hot` (gold outline = selected), signals `activated` and `blocked` (a tap on a DISABLED button), `handle_event(ev)`, minimum size 64x64); `UiTap` (godot/ui/tap.gd: `press(id)`, `release(id) -> bool`); `UiMenu` (godot/ui/menu.gd: `open(list: Array[String], at: Vector2)`, `set_item_enabled(i, on)`, signal `chosen(index: int)`, closes itself when a row is chosen, rows 64 px, width 280); `UiTheme` (godot/ui/ui_theme.gd: `title_font()`, `body_font()`, `color(key)`).
- Tapping in tests: `TapUtil.tap(control)` (godot/tests/tap_util.gd, GDR32) does press then release inside on ANY control that has `handle_event(ev)` (UiButton, RoomHotspot, UiMenu); `TapUtil.press(c)`, `TapUtil.release(c)`, `TapUtil.tap_away(c)` (press inside, release outside: must NOT activate); positions default to `Vector2(5, 5)` (inside) and `TapUtil.OUTSIDE`; for a UiMenu row pass a position such as `Vector2(20, 8 + 64 * i + 10)`.
- Tests: `godot/tests/test_<name>.gd` starts with `extends "res://tests/harness.gd"`; every method named `test_*` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`. Run one file with `sh tools/godot/gtest.sh test_<name>` (last line `GDTEST OK`).
- Test hygiene: get the tree with `var tree := Engine.get_main_loop() as SceneTree`; add a node with `tree.root.add_child(n)` when its `_ready` must run; at the end of each test `tree.root.remove_child(n)` (if added) and `n.free()`. Nodes made with `.new()` and never added can simply be `free()`d.
- godot/ui/tap.gd and godot/ui/button.gd (GDU02: copy the event handling shape)
- /Users/leelangley/wt/webbwheresmycar/_dev/docs/SCENE_RULES.md section TAP RULE

## Files you may change (and nothing else)
- `godot/rooms/hotspot.gd`
- `godot/tests/test_hotspot.gd`

## Steps
1. Create `godot/rooms/hotspot.gd`: `class_name RoomHotspot`, `extends Control`. `const MIN_PX := 64.0`; `signal tapped(id: StringName)`; `signal pressed_down(id: StringName)`; `var id: StringName = &""`; `var enabled := true`; `var pressed := false`; `var glow := false`; `var _tap := UiTap.new()`.
2. `static func fit_rect(rect: Rect2) -> Rect2`: size = `Vector2(maxf(rect.size.x, MIN_PX), maxf(rect.size.y, MIN_PX))`, centre = `rect.get_center()`, return `Rect2((centre - size * 0.5).round(), size)`. `static func make(hs_id: StringName, rect: Rect2) -> RoomHotspot`: creates the node, `id = hs_id`, `name = "Hot_" + String(hs_id)`, applies `fit_rect(rect)` to `position` and `size`, `mouse_filter = Control.MOUSE_FILTER_STOP`, `focus_mode = Control.FOCUS_NONE`, returns it.
3. `func press() -> void`: if not enabled return; `_tap.press("h")`; `pressed = true`; `pressed_down.emit(id)`; `queue_redraw()`. `func release(inside: bool) -> void`: `var hit := _tap.release("h" if inside else "")`; `pressed = false`; `queue_redraw()`; if `hit and enabled` then `tapped.emit(id)`. `func handle_event(ev: InputEvent) -> void`: only `InputEventMouseButton` with `button_index == MOUSE_BUTTON_LEFT` matters: pressed -> `press()`; released -> `release(Rect2(Vector2.ZERO, size).has_point(ev.position))`. `func _gui_input(event: InputEvent) -> void: handle_event(event); accept_event()`. `func set_glow(v: bool) -> void`: store, `set_process(v)`, `queue_redraw()`. `func _process(_d: float) -> void: queue_redraw()` (runs only while glowing).
4. `func _draw() -> void`: only when `glow`: `draw_rect(Rect2(Vector2.ZERO, size), Color(1.0, 0.82, 0.48, 0.35 + 0.35 * sin(Time.get_ticks_msec() / 250.0)), false, 4.0)`. Nothing else is drawn.
5. `godot/tests/test_hotspot.gd`: (1) `fit_rect(Rect2(10, 10, 30, 20)) == Rect2(-7, -12, 64, 64)`; `fit_rect(Rect2(0, 0, 200, 100)) == Rect2(0, 0, 200, 100)`. (2) `make(&"a", Rect2(100, 100, 10, 10))` has size (64, 64), `name == &"Hot_a"`, `mouse_filter == Control.MOUSE_FILTER_STOP`. (3) Tap rule with a signal counter (`var got := []; hs.tapped.connect(func(i): got.append(i))`): `TapUtil.tap(hs)` gives `got == [&"a"]`; `TapUtil.tap_away(hs)` adds nothing; `TapUtil.release(hs)` without a press adds nothing; with `enabled = false`, `TapUtil.tap(hs)` adds nothing. (4) `pressed_down` fires once per press and `pressed` is true between press and release. (5) `release(true)` after `press()` called directly also fires. (6) After `set_glow(true)`, `is_processing()` is true; after `set_glow(false)` false. Free every node.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_hotspot` ends with `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDR18: RoomHotspot: invisible tap-rule rect`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
