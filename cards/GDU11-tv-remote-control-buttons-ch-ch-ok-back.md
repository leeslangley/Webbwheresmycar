[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDU11 TV: remote control buttons (CH-, CH+, OK, BACK)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDU11
Needs (already merged into `dev`): GDU10, GDU02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
`TvRemote`: the four big buttons on the TV's control plate (CH-, CH+, OK, BACK, each 96x64) plus keyboard shortcuts, wired into the Tv as the signal `remote(action)`.

## Read first
- docs/GODOT.md (the plan: layout zones, the TV is the centre, tap rule, 64 px touch targets)
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` (it is a RefCounted, so there is NO scene and NO `await`); every `func test_*() -> void` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `tree()` (the SceneTree), `autoload(name)`. To test a node: `tree().root.add_child(n)` and finish the test with `n.free()`. Never wait for frames: every animated widget has `advance(dt)` (seconds) so a test steps time by hand. Mouse input is simulated by calling the widget's public `handle_event(ev)`; copy this helper into the test file: `func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:` creating `InputEventMouseButton.new()` with `button_index = MOUSE_BUTTON_LEFT`, `pressed = down`, `position = pos`
- godot/ui/button.gd (GDU02: `UiButton`: `text`, `kind`, `enabled`, signals `activated` and `blocked`, `handle_event(ev)`, `activate()`)
- godot/tv/tv.gd (GDU10)

## Files you may change (and nothing else)
- `godot/tv/tv_remote.gd`
- `godot/tv/tv.gd`
- `godot/tests/test_tv_remote.gd`

## Steps
1. `godot/tv/tv_remote.gd`: `class_name TvRemote`, `extends Control`. Signals `action(name: String)`. `_init`: `size = Vector2(456, 64)`, `mouse_filter = MOUSE_FILTER_PASS`. `const ACTIONS: Array[String] = ["ch_prev", "ch_next", "ok", "back"]`, `const LABELS: Array[String] = ["CH-", "CH+", "OK", "BACK"]`, `const NODE_NAMES: Array[String] = ["ChPrev", "ChNext", "Ok", "Back"]`. `_ready()` creates four `UiButton`s named by `NODE_NAMES`, `kind = "remote"`, `text = LABELS[i]`, `position = Vector2(i * 120, 0)`, `size = Vector2(96, 64)`, and connects each `activated` to `func(): press_action(ACTIONS[i])` (capture `i` in a local first: `var a: String = ACTIONS[i]`). `func press_action(a: String) -> void: action.emit(a)`. `static func key_to_action(keycode: int) -> String`: KEY_LEFT -> "ch_prev", KEY_RIGHT -> "ch_next", KEY_ENTER / KEY_KP_ENTER / KEY_SPACE -> "ok", KEY_ESCAPE / KEY_BACKSPACE -> "back", anything else "". `func _unhandled_key_input(event: InputEvent) -> void`: for a pressed, non-echo `InputEventKey` with a non-empty action: `press_action(a)` and `get_viewport().set_input_as_handled()`.
2. Edit `godot/tv/tv.gd` (GDU10): add `signal remote(action: String)`; in `_ready()` after the glass: `var r := TvRemote.new()`, `r.name = "Remote"`, `r.position = Vector2(152, 484)`, `add_child(r)`, `r.action.connect(func(a: String): remote.emit(a))`. Do not change anything else in that file.
3. `godot/tests/test_tv_remote.gd`: `test_keys`: `TvRemote.key_to_action(KEY_LEFT) == "ch_prev"`, `KEY_RIGHT` "ch_next", `KEY_ENTER` "ok", `KEY_KP_ENTER` "ok", `KEY_SPACE` "ok", `KEY_ESCAPE` "back", `KEY_BACKSPACE` "back", `KEY_A` "". `test_buttons`: `var r := TvRemote.new()` added to the tree; for the four names the node exists, is a `UiButton`, has `size == Vector2(96, 64)` (height >= 64) and `position.x == i * 120.0`; texts are "CH-", "CH+", "OK", "BACK"; `kind == "remote"`; collect `action`; press+release inside `Ok` (mouse events at (10, 10) via the button's `handle_event`) gives `["ok"]`; the same on `Back` adds "back"; `press_action("ch_next")` adds "ch_next". `test_in_tv`: instantiate `res://tv/tv.tscn`, add to the tree: `Remote` exists at `Vector2(152, 484)`; `Remote.position.y + Remote.size.y <= 560.0`; collect the Tv `remote` signal; tap `Remote/ChNext` (press and release inside): the Tv emitted `["ch_next"]`. Free nodes at the end of each test.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_tv_remote` last line is `GDTEST OK`.
- `sh tools/godot/gshot.sh tv/tv.tscn /tmp/tv_remote.png 10`, LOOK at /tmp/tv_remote.png and describe it (expected: the four dark remote buttons CH-, CH+, OK, BACK in a row on the wooden control plate, readable cream text, none touching the knobs or the brand plate).
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDU11: TV: remote control buttons (CH-, CH+, OK, BACK)`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
