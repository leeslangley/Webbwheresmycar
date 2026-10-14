[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDR31 Flow: game over to news to endgame, settings applied

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDR31
Needs (already merged into `dev`): GDR30, GDR09, GDR02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The last two behaviours of Flow. (1) The JS 'wrapped pop' from src/game.js: when a day ends the game (`state.flags.gameOver`), the newspaper (here: the TV's NEWS channel) is shown first and only when it is closed does the game go to the endgame screen; a finished save that is continued, or any attempt to enter the office while the game is over, goes straight to the endgame. (2) Settings changes are applied: CRT filter on the TV, sound muted or not (music has no player yet and is only stored).

## Read first
- docs/GODOT.md (plan, TV-centred layout, tap rule, determinism) and docs/GODOT_PLANNER_BRIEF.md section SHARED CONTRACTS (Game, Data, Sim*, Core*, tests, tools)
- godot/rooms/room_base.gd (GDR19, class `RoomBase extends Control`): `LAYER_NAMES`, `build_layers()`, `layer(name)`, `placeholder(name)`, `ui()`, `set_plate(layer, tex, pos)`, `add_hotspot(id, rect) -> RoomHotspot` (invisible tap rect), `add_button(id, rect, text, kind) -> UiButton`, `hotspots` (id -> control, both kinds), `game` + `get_game()`, signals `request_scene(scene_id: StringName, params: Dictionary)`, `chatter(text)`, `toast(text)`, virtuals `enter(params)`, `exit()`, `_on_hotspot(id)`, `_on_button_blocked(id)`, `_on_button_down(id)`, statics `add_box`, `add_panel`, `add_label`, `pixel_font`. Rooms are built IN CODE in `_ready` (the .tscn is only a root Control with the script), so every node name in a card is an exact contract for the art cards (GDA) and the tests. Rooms are shown by the SceneHost (GDU30), which calls `enter(params)` after adding and `exit()` before removing.
- Tests: `godot/tests/test_<name>.gd` starts with `extends "res://tests/harness.gd"`; every method named `test_*` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`. Run one file with `sh tools/godot/gtest.sh test_<name>` (last line `GDTEST OK`).
- Test hygiene: get the tree with `var tree := Engine.get_main_loop() as SceneTree`; add a node with `tree.root.add_child(n)` when its `_ready` must run; at the end of each test `tree.root.remove_child(n)` (if added) and `n.free()`. Nodes made with `.new()` and never added can simply be `free()`d.
- /Users/leelangley/wt/webbwheresmycar/_dev/src/game.js (the `pop` wrapper at the end of createGame, loadSettings)
- godot/scenes/flow.gd (GDR11, GDR30), godot/scenes/settings.gd (GDR09: signal setting_changed), godot/scenes/office.gd (GDR02: `show_news()` and the signal `news_closed`), godot/tv/tv.gd (GDU10: `set_crt(on)`), godot/autoload/sfx.gd (GDF12: `set_muted(on)`)

## Files you may change (and nothing else)
- `godot/scenes/flow.gd`
- `godot/scenes/office.gd`
- `godot/tests/fake_room.gd`
- `godot/tests/test_flow_gameover.gd`

## Steps
1. Edit `godot/scenes/flow.gd`. `func _is_game_over() -> bool`: `var s = get_game().state`; true when `s.get("flags", {}).get("gameOver", false) == true`. At the very top of `go(...)`: `if id == &"office" and _is_game_over(): id = &"endgame"` (the wrapped pop; `kind` stays what the caller passed). Fill `_on_game_over()`: return when `_end_pending` (add `var _end_pending := false`); `_end_pending = true`; if `current != null and current.has_signal("news_closed") and current.has_method("show_news")` then `current.news_closed.connect(_goto_endgame, CONNECT_ONE_SHOT)` and `current.show_news()`, else `_goto_endgame()`. `func _goto_endgame()`: `_end_pending = false`; `go(&"endgame", {}, "default")`. Change `_on_day_advanced()` (GDR30): first `if _is_game_over(): _on_game_over(); return`, so the news is shown exactly once.
2. Settings: `func apply_settings() -> void`: `var s: Dictionary = get_game().settings`; if `current != null and current.has_method("set_crt")` call `current.set_crt(bool(s.get("crt", false)))`; `var sfx := get_node_or_null("/root/Sfx")` and when it has the method `set_muted` call `sfx.set_muted(not bool(s.get("sound", true)))`. In `attach()` connect `scene_changed` to a lambda calling `apply_settings()` (so a new room gets the CRT choice) and call `get_game().load_settings()` then `apply_settings()` before the auto start. In `_wire`: when the node has the signal `setting_changed` connect it to a lambda calling `apply_settings()`.
3. Edit `godot/scenes/office.gd` (GDR02): add `func set_crt(on: bool) -> void`: `var tv := get_node_or_null("Props/Tv")`; if it has the method `set_crt` call `tv.set_crt(on)`. Edit `godot/tests/fake_room.gd`: add `var crt_calls: Array = []` and `func set_crt(on: bool) -> void: crt_calls.append(on)`.
4. `godot/tests/test_flow_gameover.gd` (as in GDR30's test: real Game instance with temp `save_path` / `settings_path`, `main.flow.bind_game(g)`, fake rooms for office / endgame / title / settings): `g.new_game(3)`, `flow.go(&"office")`, then `g.state.flags.gameOver = true` and `g.game_over.emit()`: `flow.current.news_calls == 1`, `current_id` is still `&"office"`; then `flow.current.news_closed.emit()` -> `current_id == &"endgame"`. Reset to the office with the flag false: set the flag true and emit BOTH `g.day_advanced` and `g.game_over` -> `news_calls` is exactly 1 (no double news). With no current room (`flow.current = null`) a `game_over` goes straight to `endgame`. Wrapped pop: with the flag already true, `flow.go(&"office")` ends in `current_id == &"endgame"`; `continue_game()` of a finished save also ends in the endgame. `_end_pending` is false again after the redirect. Settings: `g.settings.crt = true`; `flow.apply_settings()` -> the fake room's `crt_calls.back() == true`; `go(&"office")` again applies the setting to the NEW room (`crt_calls` of the new fake room is `[true]`); `g.settings.sound = false` + `apply_settings()` -> `Sfx.muted == true` (restore `Sfx.set_muted(false)` at the end of the test); emitting `setting_changed("crt", false)` from an opened settings overlay (set `room_paths[&"settings"]` to the real `res://scenes/settings.tscn`, open it, set `g.settings.crt = false`, call the overlay's `toggle("music")`) re-applies (`crt_calls.back() == false`). Free the instance and erase the test files.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_flow_gameover` ends with `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDR31: Flow: game over to news to endgame, settings applied`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
