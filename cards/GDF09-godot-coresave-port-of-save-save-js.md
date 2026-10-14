[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDF09 Godot: CoreSave (port of save/save.js)

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDF09
Needs (already merged into `dev`): GDF01, GDF02, GDF15
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Save and load a game state (and the settings) as JSON files under `user://`, with the same validity rules as `src/save/save.js`. It is a static helper class (`class_name CoreSave`), NOT an autoload.

## Read first
- src/save/save.js (read it all)
- src/game.js (loadSettings, SETTINGS_KEY, DEFAULT_SETTINGS)
- tests/save.test.mjs
- godot/core/json.gd (GDF15)
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` and every method named `test_*` is run; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `autoload(name) -> Node`
- GDScript's JSON parser returns EVERY number as float; `CoreJson` (GDF15) turns whole numbers back into int. GDScript `/` on two ints truncates: always convert with `float()` first when a JS division is meant

## Files you may change (and nothing else)
- `godot/autoload/save.gd`
- `godot/tests/test_save.gd`

## Steps
1. `godot/autoload/save.gd`: `class_name CoreSave`, `extends RefCounted`, static, typed. Constants: `const SAVE_PATH := "user://save.json"`, `const SETTINGS_PATH := "user://settings.json"`, `const REQUIRED_KEYS: Array[String] = ["day", "cash", "reputation", "buzz", "garageSlots", "cars", "shop", "requests", "auction", "stats", "plates", "flags", "rng"]`.
2. `serialize(state: Dictionary) -> String` (`CoreJson.stringify(state)`). `deserialize(text: String) -> Variant`: returns the state Dictionary or null; null when the text is not JSON, not an object, `v` is not 1 (compare numerically), any REQUIRED_KEY is missing, or `cars` is not an Array; extra keys are tolerated. Never errors.
3. `save_to(state: Dictionary, path: String = SAVE_PATH) -> bool` (false when the file cannot be written). `load_from(path: String = SAVE_PATH) -> Variant` (null when the file is missing or invalid). `has_save(path: String = SAVE_PATH) -> bool` (`load_from(path) != null`). `clear_save(path: String = SAVE_PATH) -> bool`: true when the file is gone afterwards (also true when it never existed); use `DirAccess.remove_absolute(ProjectSettings.globalize_path(path))`.
4. Settings (from src/game.js): `static func default_settings() -> Dictionary` returns `{"crt": false, "sound": true, "music": true}` (a new Dictionary each call). `load_settings(path: String = SETTINGS_PATH) -> Dictionary`: defaults when the file is missing, corrupt or not an object; otherwise `crt` is true only when the stored value is exactly `true`, and `sound` / `music` are false only when the stored value is exactly `false`. `save_settings(settings: Dictionary, path: String = SETTINGS_PATH) -> bool`.
5. `godot/tests/test_save.gd`: a helper `func _good() -> Dictionary` building a minimal valid state by hand (`v: 1`, every REQUIRED_KEY present with simple values, `cars: []`, `rng: 5`, `cash: 20000`). Tests: `test_roundtrip_string` (deserialize(serialize(x)) is `GoldenUtil.same` to x); `test_rejects` (not-JSON text, `"[1,2]"`, `"null"`, a state with `v` 2, with `v` missing, with each required key removed in turn, with `cars` a Dictionary: all null); `test_extra_keys_ok`; `test_file_roundtrip` using the temp path `user://test_save_tmp.json`: `save_to` true, `has_save` true, `load_from` same as the state, `clear_save` true, `has_save` false, `clear_save` again true; `test_load_missing_is_null`; `test_save_to_bad_path` (`save_to(_good(), "user://no_such_dir_xyz/s.json")` is false); `test_settings` with temp path `user://test_settings_tmp.json`: missing file gives defaults; save `{crt: true, sound: false, music: true}` and load it back identical; a file containing `{"crt": 1, "sound": 0}` loads as `crt` false, `sound` true, `music` true; a file containing `garbage` loads defaults; clean up the temp file at the end of the test.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_save | tail -1` prints `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Game.gd wiring (GDF10). Cloud saves.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDF09: Godot: CoreSave (port of save/save.js)`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
