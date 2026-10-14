[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDU20 UI: screen shake, flash and pop FX helper

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDU20
Needs (already merged into `dev`): GDU01, GDF02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
`UiFx`: Tween-based juice used by every scene: shake any Control/Node2D, flash the screen, pop-scale a node. Deterministic (no random numbers), and testable with `Tween.custom_step`.

## Read first
- docs/GODOT.md (the plan: layout zones, the TV is the centre, tap rule, 64 px touch targets)
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` (it is a RefCounted, so there is NO scene and NO `await`); every `func test_*() -> void` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `tree()` (the SceneTree), `autoload(name)`. To test a node: `tree().root.add_child(n)` and finish the test with `n.free()`. Never wait for frames: every animated widget has `advance(dt)` (seconds) so a test steps time by hand. Mouse input is simulated by calling the widget's public `handle_event(ev)`; copy this helper into the test file: `func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:` creating `InputEventMouseButton.new()` with `button_index = MOUSE_BUTTON_LEFT`, `pressed = down`, `position = pos`
- src/ui/screenfx.js (shake 300 ms, flash 180 ms) and src/ui/tokens.js MOTION

## Files you may change (and nothing else)
- `godot/ui/fx.gd`
- `godot/tests/test_ui_fx.gd`

## Steps
1. `godot/ui/fx.gd`: `class_name UiFx`, `extends RefCounted`, static, typed. `static func shake_offsets(strength: float, steps: int) -> Array[Vector2]`: for `i` in `0..steps-1`: `amp = strength * (1.0 - float(i) / float(steps))`; offset `Vector2(sin(i * 2.1) * amp, cos(i * 3.3) * amp * 0.6)`. (No randomness: the same call always gives the same list.) For `steps <= 0` return `[]`.
2. `static func shake(node: CanvasItem, strength: float = 8.0, duration: float = 0.3) -> Tween`: remember `var home: Vector2 = node.position`; `var tw := node.create_tween()`; for each offset of `shake_offsets(strength, 8)` add `tw.tween_property(node, "position", home + off, duration / 9.0)`; finally `tw.tween_property(node, "position", home, duration / 9.0)`; return `tw`. (The node must be a Control or Node2D: both have `position`.) If `strength <= 0.0` return a tween with a single zero-length step to `home`.
3. `static func flash(host: Control, color: Color = Color(1, 1, 1, 1), duration: float = 0.18, peak: float = 0.6) -> Tween`: create `var r := ColorRect.new()`, `r.name = "FxFlash"`, `r.color = Color(color.r, color.g, color.b, 0.0)`, `r.mouse_filter = Control.MOUSE_FILTER_IGNORE`, `r.set_anchors_preset(Control.PRESET_FULL_RECT)`, `host.add_child(r)`; `var tw := r.create_tween()`; `tw.tween_property(r, "color:a", peak, duration * 0.25)`; `tw.tween_property(r, "color:a", 0.0, duration * 0.75)`; `tw.tween_callback(r.queue_free)`; return `tw`. `static func pop(node: CanvasItem, amount: float = 1.15, duration: float = 0.18) -> Tween`: `node.pivot_offset = node.size / 2.0` when it is a Control; `var tw := node.create_tween()`; tween `scale` to `Vector2(amount, amount)` over `duration * 0.4` (linear) and then back to `Vector2.ONE` over `duration * 0.6`; return `tw`.
4. `godot/tests/test_ui_fx.gd`: `test_offsets`: `shake_offsets(10.0, 5).size() == 5`; the first offset equals `Vector2(0.0, 6.0)` (i = 0: sin 0 = 0, cos 0 = 1, amp 10, 0.6 factor); every offset's `length()` is at most 10.0 + 0.001; `shake_offsets(10.0, 0) == []`; two calls give identical arrays. `test_shake_returns_home`: a `Control` `c` with `position = Vector2(100, 50)` added to the tree; `var tw := UiFx.shake(c, 8.0, 0.3)`; `tw.custom_step(0.1)` (the node has moved or still near home, no assertion on position); `tw.custom_step(5.0)`; `c.position == Vector2(100, 50)` (back home); free `c`. `test_flash`: a host Control in the tree; `var tw := UiFx.flash(host)`; the host has a child named "FxFlash"; `tw.custom_step(5.0)` finishes; the child `is_queued_for_deletion()`; free host. `test_pop`: a Control `c` with `size = Vector2(40, 40)` in the tree; `var tw := UiFx.pop(c)`; `c.pivot_offset == Vector2(20, 20)`; `tw.custom_step(5.0)`; `c.scale == Vector2.ONE`; free it.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_ui_fx` last line is `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDU20: UI: screen shake, flash and pop FX helper`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
