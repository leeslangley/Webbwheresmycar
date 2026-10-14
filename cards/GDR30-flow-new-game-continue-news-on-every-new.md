[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDR30 Flow: new game, continue, news on every new day, title wiring

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDR30
Needs (already merged into `dev`): GDR11, GDF10, GDS19
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The game lifecycle in `Flow`, ported from src/game.js: NEW GAME starts a fresh game through `Game.new_game(seed)` and enters the office; CONTINUE asks `Game.continue_game()` (it toasts `No saved game` itself) and enters the office; every day that passes lets the room show the news (the Game already saves and plays the cash sound); the title and endgame buttons are wired. Needs `Game.new_game` / `continue_game` (GDF10) and the real SimNewGame (GDS19).

## Read first
- docs/GODOT.md (plan, TV-centred layout, tap rule, determinism) and docs/GODOT_PLANNER_BRIEF.md section SHARED CONTRACTS (Game, Data, Sim*, Core*, tests, tools)
- godot/rooms/room_base.gd (GDR19, class `RoomBase extends Control`): `LAYER_NAMES`, `build_layers()`, `layer(name)`, `placeholder(name)`, `ui()`, `set_plate(layer, tex, pos)`, `add_hotspot(id, rect) -> RoomHotspot` (invisible tap rect), `add_button(id, rect, text, kind) -> UiButton`, `hotspots` (id -> control, both kinds), `game` + `get_game()`, signals `request_scene(scene_id: StringName, params: Dictionary)`, `chatter(text)`, `toast(text)`, virtuals `enter(params)`, `exit()`, `_on_hotspot(id)`, `_on_button_blocked(id)`, `_on_button_down(id)`, statics `add_box`, `add_panel`, `add_label`, `pixel_font`. Rooms are built IN CODE in `_ready` (the .tscn is only a root Control with the script), so every node name in a card is an exact contract for the art cards (GDA) and the tests. Rooms are shown by the SceneHost (GDU30), which calls `enter(params)` after adding and `exit()` before removing.
- Tests: `godot/tests/test_<name>.gd` starts with `extends "res://tests/harness.gd"`; every method named `test_*` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`. Run one file with `sh tools/godot/gtest.sh test_<name>` (last line `GDTEST OK`).
- Test hygiene: get the tree with `var tree := Engine.get_main_loop() as SceneTree`; add a node with `tree.root.add_child(n)` when its `_ready` must run; at the end of each test `tree.root.remove_child(n)` (if added) and `n.free()`. Nodes made with `.new()` and never added can simply be `free()`d.
- /Users/leelangley/wt/webbwheresmycar/_dev/src/game.js (act, newGame, continueGame, eraseSave)
- godot/autoload/game.gd (GDF10, GDS20: `new_game(seed_value := -1)`, `continue_game() -> bool`, `has_save()`, signals day_advanced / game_over, `save_path`)
- godot/scenes/flow.gd and godot/tests/fake_room.gd (GDR11)

## Files you may change (and nothing else)
- `godot/scenes/flow.gd`
- `godot/tests/fake_room.gd`
- `godot/tests/test_flow_lifecycle.gd`

## Steps
1. Edit `godot/scenes/flow.gd`. `func bind_game(g) -> void`: disconnect the old game's `day_advanced` and `game_over` from this node when connected; `game = g`; when not null connect `g.day_advanced` to `_on_day_advanced` and `g.game_over` to `_on_game_over` (the latter is an empty `func _on_game_over() -> void: pass` here, GDR31 fills it). In `attach()` call `bind_game(get_node_or_null("/root/Game"))` before the auto start. `_exit_tree` disconnects.
2. `func new_game(seed_value := -1) -> void`: `get_game().new_game(seed_value)` (the Game saves and emits `changed`); `go(&"office", {}, "fade")`. `func continue_game() -> bool`: `if get_game().continue_game(): go(&"office", {}, "fade"); return true`; else return false (the Game has already emitted the toast). `func to_title() -> void: go(&"title", {}, "fade")`. `func _on_day_advanced() -> void`: `if current != null and current.has_method("show_news"): current.show_news()`.
3. Extend `_wire(node, is_overlay)`: when the node has the signal `new_game` connect it to a lambda calling `new_game()`; `continue_game` -> `continue_game()`; `open_settings` -> `open_overlay(&"settings", {})`; `play_again` -> `new_game()`; `to_title` -> `to_title()`. (Use lambdas: the signals and the methods share names.)
4. Edit `godot/tests/fake_room.gd` (GDR11's fixture): add the signals `new_game`, `continue_game`, `open_settings`, `play_again`, `to_title`.
5. `godot/tests/test_flow_lifecycle.gd`: a REAL Game instance as in GDF10's tests: `var g = load("res://autoload/game.gd").new()`, `g.save_path = "user://test_flow_save.json"`, `g.settings_path = "user://test_flow_settings.json"`, `g.erase_save()`; main instance with `auto_start = false`; `main.flow.bind_game(g)`; `main.flow.room_paths` = fake room for office / title / endgame / settings; collect `g.toast_requested` texts. `flow.new_game(5)`: `g.state.seed == 5`, `g.state.day == 1`, `g.state.cash == 20000`, `g.has_save()`, `current_id == &"office"`. `flow.to_title()` then `continue_game()` after `g.erase_save()` returns false and the collected toasts contain `No saved game`, `current_id` stays `&"title"`; after `g.state.cash = 777`, `g.save_now()`, `g.state = {}`: `continue_game()` returns true, `g.state.cash == 777`, `current_id == &"office"`. `g.day_advanced.emit()` -> the fake office's `news_calls` is 1. Title wiring: after `go(&"title")`, emitting the room's `new_game` starts a game (cash 20000 again), `open_settings` sets `overlay_id == &"settings"`, `to_title` (from the endgame room) sets `current_id == &"title"`, `play_again` starts a new game and ends in `&"office"`. Erase the temp files, `g.free()` and free the instance at the end.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_flow_lifecycle` ends with `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Game over redirect and settings application (GDR31). Game itself (GDF10, GDS cards).

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDR30: Flow: new game, continue, news on every new day, title wiring`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
