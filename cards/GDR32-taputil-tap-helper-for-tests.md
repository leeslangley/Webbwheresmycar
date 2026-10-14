[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDR32 TapUtil: tap helper for tests

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDR32
Needs (already merged into `dev`): GDF02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
One tiny test helper so every room test taps controls the same way: it builds real left-button mouse events and feeds them to `handle_event(ev)` (the entry point UiButton, UiMenu and RoomHotspot all have), also emitting the control's `gui_input` signal first, exactly as the engine does.

## Read first
- docs/GODOT.md (plan, TV-centred layout, tap rule, determinism) and docs/GODOT_PLANNER_BRIEF.md section SHARED CONTRACTS (Game, Data, Sim*, Core*, tests, tools)
- Tests: `godot/tests/test_<name>.gd` starts with `extends "res://tests/harness.gd"`; every method named `test_*` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`. Run one file with `sh tools/godot/gtest.sh test_<name>` (last line `GDTEST OK`).
- Test hygiene: get the tree with `var tree := Engine.get_main_loop() as SceneTree`; add a node with `tree.root.add_child(n)` when its `_ready` must run; at the end of each test `tree.root.remove_child(n)` (if added) and `n.free()`. Nodes made with `.new()` and never added can simply be `free()`d.

## Files you may change (and nothing else)
- `godot/tests/tap_util.gd`
- `godot/tests/test_tap_util.gd`

## Steps
1. `godot/tests/tap_util.gd`: `class_name TapUtil`, `extends RefCounted`, all `static`. `const INSIDE := Vector2(5, 5)`, `const OUTSIDE := Vector2(-500, -500)`. `mouse(pressed: bool, pos: Vector2) -> InputEventMouseButton` (`button_index = MOUSE_BUTTON_LEFT`, `pressed`, `position = pos`, `global_position = pos`). `press(c: Control, pos := INSIDE)`: `var ev := mouse(true, pos)`; `c.gui_input.emit(ev)`; `c.call("handle_event", ev)`. `release(c: Control, pos := INSIDE)`: the same with `pressed = false`. `tap(c, pos := INSIDE)`: `press(c, pos)` then `release(c, pos)`. `tap_away(c)`: `press(c, INSIDE)` then `release(c, OUTSIDE)`.
2. `godot/tests/test_tap_util.gd`: build a probe control from inline script source: `var s := GDScript.new(); s.source_code = "extends Control\nvar evs := []\nfunc handle_event(ev):\n\tevs.append(ev)\n"; s.reload(); var c := Control.new(); c.set_script(s)`; count `c.gui_input` emissions with a lambda. `TapUtil.tap(c)`: `c.evs.size() == 2`, the first `pressed == true`, the second `pressed == false`, both `button_index == MOUSE_BUTTON_LEFT` and `position == Vector2(5, 5)`, `gui_input` fired twice. `tap_away(c)` on a fresh probe: second event position equals `TapUtil.OUTSIDE`. `mouse(true, Vector2(1, 2)).position == Vector2(1, 2)`. Free the probe.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_tap_util` ends with `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDR32: TapUtil: tap helper for tests`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
