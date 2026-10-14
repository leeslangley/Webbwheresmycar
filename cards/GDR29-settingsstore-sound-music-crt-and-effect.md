[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDR29 SettingsStore: sound, music, CRT and effects switches

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDR29
Needs (already merged into `dev`): GDF02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The persisted settings as a static class `SettingsStore`: four boolean switches (crt, sound, music, fx) saved as JSON in `user://settings.json`. Port of loadSettings / saveSettings in src/game.js (defaults crt false, sound true, music true; anything corrupt falls back to the defaults) plus the new `fx` switch (screen transitions and effects; src/ui/scenes.js already treats `settings.fx === false` as 'no transitions').

## Read first
- docs/GODOT.md (plan, TV-centred layout, tap rule, determinism) and docs/GODOT_PLANNER_BRIEF.md section SHARED CONTRACTS (Game, Data, Sim*, Core*, tests, tools)
- Tests: `godot/tests/test_<name>.gd` starts with `extends "res://tests/harness.gd"`; every method named `test_*` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`. Run one file with `sh tools/godot/gtest.sh test_<name>` (last line `GDTEST OK`).
- /Users/leelangley/wt/webbwheresmycar/_dev/src/game.js (loadSettings, DEFAULT_SETTINGS, saveSettings)

## Files you may change (and nothing else)
- `godot/rooms/settings_store.gd`
- `godot/tests/test_settings_store.gd`

## Steps
1. `godot/rooms/settings_store.gd`: `class_name SettingsStore`, `extends RefCounted`. `const KEYS := ["crt", "sound", "music", "fx"]`; `static var path := "user://settings.json"`; `static var values: Dictionary = SettingsStore.defaults()`. `static func defaults() -> Dictionary` = `{"crt": false, "sound": true, "music": true, "fx": true}`.
2. `static func parse(text: String) -> Dictionary` (pure, never errors): returns `defaults()` for unparsable text or anything that is not a Dictionary; otherwise `crt` is true only when the parsed `crt` is exactly `true`; `sound`, `music`, `fx` are false only when the parsed value is exactly `false` (missing or odd values mean true). `static func load_settings() -> Dictionary`: read the file at `path` (missing file -> defaults), `values = parse(text)`, return `values`. `static func save_settings() -> bool`: write `JSON.stringify(values)`; false when it cannot be opened. `static func get_value(key: String) -> bool` = `bool(values.get(key, defaults().get(key, false)))`. `static func set_value(key: String, on: bool) -> void`: ignore keys not in KEYS; set and `save_settings()`.
3. `godot/tests/test_settings_store.gd` (start of each test: `SettingsStore.path = "user://test_settings.json"`, remove that file with `DirAccess.remove_absolute(ProjectSettings.globalize_path(...))` if it exists, `SettingsStore.values = SettingsStore.defaults()`). Cases: `defaults()` equals `{"crt": false, "sound": true, "music": true, "fx": true}`; `parse("")`, `parse("junk")`, `parse("[]")`, `parse("5")` all equal the defaults; `parse('{"crt": true, "sound": false}')` gives crt true, sound false, music true, fx true; `parse('{"crt": 1, "sound": 0, "music": "no"}')` gives crt false, sound true, music true; `set_value("crt", true)` then `values = defaults()` then `load_settings()` brings `crt` back as true (persistence); `set_value("bogus", true)` leaves `values` without a "bogus" key; `get_value("fx")` is true by default and false after `set_value("fx", false)`.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_settings_store` ends with `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDR29: SettingsStore: sound, music, CRT and effects switches`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
