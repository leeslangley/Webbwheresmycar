[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDR12 Save: write, read and erase the saved game

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDR12
Needs (already merged into `dev`): GDF02, GDR32
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The saved-game file as a static class `Save` (no autoload needed). One JSON file `user://save.json` with a version field. Port of src/save/save.js. GOTCHA that decides the design: Godot's JSON parser turns every number into a float, which would break integer maths in the sim; so the state is stored as the text from `var_to_str(state)` INSIDE the JSON, which keeps int / float exactly.

## Read first
- docs/GODOT.md (plan, TV-centred layout, tap rule, determinism) and docs/GODOT_PLANNER_BRIEF.md section SHARED CONTRACTS (Game, Data, Sim*, Core*, tests, tools)
- Tests: `godot/tests/test_<name>.gd` starts with `extends "res://tests/harness.gd"`; every method named `test_*` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`. Run one file with `sh tools/godot/gtest.sh test_<name>` (last line `GDTEST OK`).
- /Users/leelangley/wt/webbwheresmycar/_dev/src/save/save.js (serialize, deserialize, saveTo, loadFrom, clearSave)
- godot/tests/fake_game.gd (GDR19: `FakeGame.sample_state()`; if it is not merged hand-build a small state with keys v, day, cash, cars)

## Files you may change (and nothing else)
- `godot/rooms/save.gd`
- `godot/tests/test_save.gd`

## Steps
1. `godot/rooms/save.gd`: `class_name Save`, `extends RefCounted`. `const VERSION := 1`; `static var path := "user://save.json"` (tests override it). `static func serialize(state: Dictionary) -> String` = `JSON.stringify({"version": VERSION, "state": var_to_str(state)})`. `static func is_plain(v) -> bool`: true only for null, bool, int, float, String, StringName, and Arrays / Dictionaries whose items (and Dictionary keys) are all plain (recursive). `static func deserialize(text: String) -> Dictionary`: returns `{}` for ANY problem: not parseable JSON; not a Dictionary; `int(version) != VERSION`; `state` missing or not a String; the state text contains "Object(" (reject before parsing); `str_to_var` result not a Dictionary; not `is_plain`; missing any of the keys `day`, `cash`, `cars`, `flags`.
2. `static func write(state: Dictionary) -> bool`: open `path` with `FileAccess.WRITE`, store the string, return true; false when the file cannot be opened. `static func read() -> Dictionary`: `{}` when the file is missing or unreadable, else `deserialize(text)`. `static func has_save() -> bool` = `not read().is_empty()`. `static func erase() -> bool`: removes the file if it exists (`DirAccess.remove_absolute(ProjectSettings.globalize_path(path))`); returns true when no file remains.
3. `godot/tests/test_save.gd`: at the start of every test `Save.path = "user://test_save.json"` and `Save.erase()`. (1) Round trip: `var s := FakeGame.sample_state()`; `var back := Save.deserialize(Save.serialize(s))`; `eq(var_to_str(back), var_to_str(s))`; `typeof(back.cash) == TYPE_INT`; `typeof(back.cars[0].condition) == TYPE_FLOAT`; `back.cars[0].fault == null`; `typeof(back.cars[1].fault.cost) == TYPE_INT`. (2) File round trip: `has_save()` false, `write(s)` true, `has_save()` true, `read().day == 1`, `erase()` true, `has_save()` false, `erase()` again is true. (3) Garbage returns `{}`: `deserialize("")`, `"not json"`, `"[]"`, `JSON.stringify({"version": 2, "state": "{}"})`, `JSON.stringify({"version": 1})`, `JSON.stringify({"version": 1, "state": 5})`, `JSON.stringify({"version": 1, "state": "{}"})` (missing keys), `JSON.stringify({"version": 1, "state": "Object(Node)"})`. (4) A file with garbage text makes `read()` return `{}` and `has_save()` false. (5) `is_plain({"a": [1, 2.5, "x", null, true]})` true; `is_plain({"a": Node.new()})` false (free the node); `is_plain(Vector2.ZERO)` false.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_save` ends with `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files. Wiring into the game flow is GDR30.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDR12: Save: write, read and erase the saved game`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
