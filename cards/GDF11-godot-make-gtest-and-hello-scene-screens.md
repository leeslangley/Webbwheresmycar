[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDF11 Godot: make gtest and hello scene screenshot check

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDF11
Needs (already merged into `dev`): GDF01, GDF02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Wire `make gtest`, and prove the screenshot path works end to end with a tiny scene (title text on the night-blue background) so every later scene card has a working example of a scene, a smoke test and a `gshot.sh` screenshot.

## Read first
- docs/GODOT.md (the plan: layout, determinism and parity rules, card rules) section 'Card rules for Godot cards'
- Makefile (it already has `test`, `serve`... targets; if it does not exist in your checkout create it with only the gtest target)
- tools/godot/gshot.sh and tools/godot/shot.gd
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` and every method named `test_*` is run; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `autoload(name) -> Node`

## Files you may change (and nothing else)
- `Makefile`
- `godot/scenes/hello.tscn`
- `godot/scenes/hello.gd`
- `godot/tests/test_hello.gd`
- `godot/project.godot`

## Steps
1. `Makefile`: add `gtest` to the `.PHONY:` list (create the line if missing) and add a target `gtest:` whose single recipe line (a TAB, then) is `sh tools/godot/gtest.sh`. Do not change other targets.
2. `godot/scenes/hello.gd`: `extends Control`, `func get_title() -> String: return $Title.text`.
3. `godot/scenes/hello.tscn` (Godot 4 text scene, `[gd_scene load_steps=2 format=3]`, one ext_resource for hello.gd): root node `Hello` of type `Control` with the script, anchors preset full rect (`layout_mode = 3`, `anchors_preset = 15`, `anchor_right = 1.0`, `anchor_bottom = 1.0`, `grow_horizontal = 2`, `grow_vertical = 2`); child `Background` (`ColorRect`, full rect likewise, `color = Color(0.105882, 0.0901961, 0.207843, 1)` which is #1B1735); child `Title` (`Label`, full rect, `text = "Webb, where's my car?"`, `horizontal_alignment = 1`, `vertical_alignment = 1`, theme font size override 48 via `theme_override_font_sizes/font_size = 48`, `theme_override_colors/font_color = Color(0.94902, 0.85098, 0.541176, 1)` which is #F2D98A).
4. In `godot/project.godot` add under `[application]` the line `run/main_scene="res://scenes/hello.tscn"` (GDR cards replace it later).
5. `godot/tests/test_hello.gd`: `test_scene_loads`: `var packed: PackedScene = load("res://scenes/hello.tscn")`, `var s := packed.instantiate()`, check `s is Control`, `s.get_node("Title") is Label`, `s.get_node("Background") is ColorRect`, `s.get_title() == "Webb, where's my car?"`, then `s.free()`. `test_ascii_title`: the title contains no character above code 127.
6. Run the screenshot command from the acceptance list, then LOOK at `/tmp/hello.png` with the Read tool and say in your summary what it shows (expected: a dark blue 1280x720 picture with pale-gold centred text).

## Acceptance (all must pass; exact commands)
- `make -n gtest` prints `sh tools/godot/gtest.sh`.
- `sh tools/godot/gshot.sh scenes/hello.tscn /tmp/hello.png 8` prints `wrote /tmp/hello.png`, and `file /tmp/hello.png` mentions `1280 x 720`.
- `sh tools/godot/gtest.sh test_hello | tail -1` prints `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Real scenes, theme, fonts. Other Makefile targets (the JS `test` target stays as is).

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDF11: Godot: make gtest and hello scene screenshot check`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
