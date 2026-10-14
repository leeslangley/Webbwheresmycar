[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDR21 Main scene shell: stage, chrome, toasts, banner text

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDR21
Needs (already merged into `dev`): GDF01, GDF02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The skeleton of the running game: `godot/scenes/main.tscn` with a centred 1280x720 `Stage` (rooms are shown inside it; extra window width shows only a backdrop), placeholder HUD and banner, an overlay layer, a toast layer, an effects layer and a post-process layer for the CRT. Its root script `flow.gd` (class `Flow`) is only a STUB here with two helpers: `say(text)` (Dave's chatter into the banner) and `show_toast(text)`. Later cards fill the rest of Flow.

## Read first
- docs/GODOT.md (plan, TV-centred layout, tap rule, determinism) and docs/GODOT_PLANNER_BRIEF.md section SHARED CONTRACTS (Game, Data, Sim*, Core*, tests, tools)
- Tests: `godot/tests/test_<name>.gd` starts with `extends "res://tests/harness.gd"`; every method named `test_*` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`. Run one file with `sh tools/godot/gtest.sh test_<name>` (last line `GDTEST OK`).
- Test hygiene: get the tree with `var tree := Engine.get_main_loop() as SceneTree`; add a node with `tree.root.add_child(n)` when its `_ready` must run; at the end of each test `tree.root.remove_child(n)` (if added) and `n.free()`. Nodes made with `.new()` and never added can simply be `free()`d.
- docs/art/GU.md section 'RSAMH echo' (banner, HUD zones)
- /Users/leelangley/wt/webbwheresmycar/_dev/src/ui/scenes.js (the toast stack: 2500 ms, stacked upward)

## Files you may change (and nothing else)
- `godot/scenes/main.tscn`
- `godot/scenes/flow.gd`
- `godot/tests/test_main_shell.gd`

## Steps
1. Write `godot/scenes/main.tscn` BY HAND in Godot 4 text format (`[gd_scene load_steps=2 format=3]`, one `[ext_resource type="Script" path="res://scenes/flow.gd" id="1"]`). Exact node tree (names are contracts): `Main` (Control, script flow.gd, full-rect anchors: `anchors_preset = 15`, `grow_horizontal = 2`, `grow_vertical = 2`, `mouse_filter = 2`) with children: `Backdrop` (ColorRect, full rect, color `Color(0.0784, 0.0627, 0.1647, 1)` = ink `#14102A`); `Stage` (Control, `anchor_left = anchor_right = anchor_top = anchor_bottom = 0.5`, `offset_left = -640`, `offset_top = -360`, `offset_right = 640`, `offset_bottom = 360`, `grow_horizontal = 2`, `grow_vertical = 2`, `mouse_filter = 2`) with children IN THIS ORDER: `Room` (Control, 1280x720, mouse_filter 2), `Hud` (ColorRect at (0,590) size (1280,130), color dark `Color(0.06, 0.05, 0.12, 1)`, with a child `Label` named `Caption`, text `HUD`), `Banner` (ColorRect at (24,8) size (1232,104), color paper `Color(0.965, 0.812, 0.627, 1)`, with a child `Label` named `Text` at (16,12) size (1200,80), autowrap on, ink font colour, empty text), `Overlays` (Control, 1280x720, mouse_filter 2), `Toasts` (Control, 1280x720, mouse_filter 2). Then `Fx` (Control, full rect, mouse_filter 2) and `Post` (CanvasLayer, layer 10) with child `Crt` (ColorRect, full rect, `visible = false`, `mouse_filter = 2`, color `Color(0, 0, 0, 0)`).
2. `godot/scenes/flow.gd`: `class_name Flow`, `extends Control`. Helpers: `func say(text: String) -> void`: let `b := get_node_or_null("Stage/Banner")`; if null return; if `b.has_method("say")` call `b.say(text)` (a later GDU banner may replace the placeholder), else set `b.get_node("Text").text = text`. `func show_toast(text: String, secs := 2.5) -> void`: add a `Label` (name `Toast`, autowrap off, font `RoomBase.pixel_font("body")` 28 px, ink colour, `horizontal_alignment` centre, size (560, 40), `StyleBoxFlat` override "normal" with bg paper and 3 px ink border) into `Stage/Toasts`, then re-stack all toasts: toast `k` (0 = oldest) is at x = 360, y = 540 - k * 48. Keep at most 3: free the oldest when a fourth arrives. Remove each toast after `secs` with `create_tween()`: `tween_interval(secs)`, `tween_property(label, "modulate:a", 0.0, 0.2)`, `tween_callback(label.queue_free)`. `func toast_count() -> int` returns the number of toasts. Nothing else (no navigation yet: later cards add it).
3. `godot/tests/test_main_shell.gd`: `load("res://scenes/main.tscn").instantiate()`, add to the tree. Check the nodes exist at these paths: `Backdrop`, `Stage`, `Stage/Room`, `Stage/Hud`, `Stage/Banner`, `Stage/Banner/Text`, `Stage/Overlays`, `Stage/Toasts`, `Fx`, `Post/Crt`; `Stage` has `anchor_left == 0.5`, `offset_left == -640.0`, `offset_right == 640.0`, `offset_top == -360.0`, `offset_bottom == 360.0`; child order of Stage is Room, Hud, Banner, Overlays, Toasts; `Post/Crt.visible == false`. `say("HELLO")` sets `Stage/Banner/Text` text to "HELLO". Five calls of `show_toast("T")` leave `toast_count() == 3`. Free the instance (remove from the tree first).

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_main_shell` ends with `GDTEST OK`.
- Screenshot step: run `sh tools/godot/gshot.sh scenes/main.tscn /tmp/gdr21_main.png 8`, then LOOK at the PNG with the Read tool and describe it in your final reply (what is where, anything overlapping, anything off screen). If the screenshot step fails because the card it needs is not merged, say so, do not fake it.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Navigation, game logic, transitions (later cards). The real HUD and banner widgets (GDU cards) replace the placeholders later.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDR21: Main scene shell: stage, chrome, toasts, banner text`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
