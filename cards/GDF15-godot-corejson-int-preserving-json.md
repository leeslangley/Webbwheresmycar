[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDF15 Godot: CoreJson (int-preserving JSON)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDF15
Needs (already merged into `dev`): GDF01, GDF02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
`CoreJson`: the one way the game reads and writes JSON. GDScript's JSON parser returns EVERY number as float; `CoreJson` (GDF15) turns whole numbers back into int. GDScript `/` on two ints truncates: always convert with `float()` first when a JS division is meant.

## Read first
- docs/GODOT.md (the plan: layout, determinism and parity rules, card rules)
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` and every method named `test_*` is run; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `autoload(name) -> Node`
- src/save/save.js (the JSON the save format needs)

## Files you may change (and nothing else)
- `godot/core/json.gd`
- `godot/tests/test_json.gd`

## Steps
1. `godot/core/json.gd`: `class_name CoreJson`, `extends RefCounted`. All functions `static`, typed.
2. `static func normalize(v: Variant) -> Variant`: returns a deep copy where every float `f` with `f == floor(f)` and `absf(f) < 9.0e15` becomes `int(f)`; Arrays and Dictionaries are copied recursively (dictionary keys are left as they are); everything else (String, bool, null, other floats) is returned as is.
3. `static func try_parse(text: String) -> Dictionary`: `var j := JSON.new()`; `var err := j.parse(text)`; return `{"ok": false, "value": null}` when `err != OK`, else `{"ok": true, "value": normalize(j.data)}`.
4. `static func parse(text: String) -> Variant`: `try_parse(text).value` (null on any parse error, and also for the text `null`).
5. `static func load_file(path: String) -> Variant`: `FileAccess.open(path, FileAccess.READ)`; null when it cannot be opened, else `parse(f.get_as_text())`.
6. `static func stringify(v: Variant) -> String`: `JSON.stringify(v, "", true)` (compact, keys sorted so output is deterministic).
7. `static func save_file(path: String, v: Variant) -> bool`: open with `FileAccess.WRITE`, return false when null, else `store_string(stringify(v))` and return true.
8. `godot/tests/test_json.gd` with these tests: `test_normalize` (`normalize(1.0)` is int: check `typeof(normalize(1.0)) == TYPE_INT`; `normalize(2.5)` stays float 2.5; `normalize({"a": [1.0, 2.5, {"b": 3.0}]})` has `a[0]` int 1, `a[1]` float 2.5, `a[2].b` int 3; strings, `true` and null unchanged; `normalize(1.0e16)` stays float); `test_parse` (`parse('{"x":5,"y":[1,2.5]}')` gives x int 5, y[0] int 1, y[1] 2.5; `parse('nope')` is null; `try_parse('nope').ok` is false; `try_parse('null').ok` is true and its value null); `test_stringify_sorted` (`stringify({"b": 1, "a": 2})` equals `{"a":2,"b":1}`); `test_file_roundtrip` (`save_file("user://gdf15_tmp.json", {"n": 7, "s": "hi"})` is true, `load_file` gives n int 7 and s hi, then `DirAccess.remove_absolute(ProjectSettings.globalize_path("user://gdf15_tmp.json"))`; `load_file("user://does_not_exist.json")` is null).

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_json | tail -1` prints `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files (other cards own it).

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDF15: Godot: CoreJson (int-preserving JSON)`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
