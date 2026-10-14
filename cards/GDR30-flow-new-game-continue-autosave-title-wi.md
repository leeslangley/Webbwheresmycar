[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDR30 Flow: new game, continue, autosave, title wiring

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDR30
Needs (already merged into `dev`): GDR11, GDR12, GDF10
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The game lifecycle in `Flow`, ported from src/game.js: NEW GAME builds a fresh state (SimNewGame.start_game with a time-based seed) and enters the office; CONTINUE loads the saved game or toasts `No saved game`; every day that passes autosaves, plays the cash sound and lets the room show the news; the title and endgame buttons are wired. Needs the sim port SimNewGame (src/sim/newgame.js).

## Read first
- docs/GODOT.md (plan, TV-centred layout, tap rule, determinism) and docs/GODOT_PLANNER_BRIEF.md section SHARED CONTRACTS (Game, Data, Sim*, Core*, tests, tools)
- godot/rooms/room_base.gd (GDR19, class `RoomBase extends Control`): `LAYER_NAMES`, `build_layers()`, `layer(name)`, `placeholder(name)`, `set_plate(layer, tex, pos)`, `add_hotspot(id, rect)`, `hotspots`, `game` + `get_game()`, signals `request_scene(scene_id: StringName, params: Dictionary)`, `chatter(text)`, `toast(text)`, statics `add_box`, `add_panel`, `add_label`, `pixel_font`. Rooms are built IN CODE in `_ready` (the .tscn is only a root Control with the script), so every node name in a card is an exact contract for the art cards (GDA) and the tests.
- Tests: `godot/tests/test_<name>.gd` starts with `extends "res://tests/harness.gd"`; every method named `test_*` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`. Run one file with `sh tools/godot/gtest.sh test_<name>` (last line `GDTEST OK`).
- Test hygiene: get the tree with `var tree := Engine.get_main_loop() as SceneTree`; add a node with `tree.root.add_child(n)` when its `_ready` must run; at the end of each test `tree.root.remove_child(n)` (if added) and `n.free()`. Nodes made with `.new()` and never added can simply be `free()`d.
- godot/tests/fake_game.gd (GDR19): `FakeGame.new()` is a stand-in for the Game autoload with the same surface: `state` (Dictionary, JS key names such as day, cash, cars[].modelId), `act(action, params) -> Dictionary` (records `[action, params]` in `calls` and returns `result`, default `{"ok": true, "msg": ""}`), and signals `changed`, `toast_requested(text)`, `day_advanced`, `game_over`. A room gets it with `room.game = FakeGame.new()` BEFORE it is added to the tree.
- /Users/leelangley/wt/webbwheresmycar/_dev/src/game.js (act, newGame, continueGame, eraseSave)
- godot/scenes/flow.gd (GDR11), godot/rooms/save.gd (GDR12), godot/tests/fake_room.gd (GDR11)

## Files you may change (and nothing else)
- `godot/scenes/flow.gd`
- `godot/tests/fake_room.gd`
- `godot/tests/test_flow_lifecycle.gd`

## Steps
1. Edit `godot/scenes/flow.gd`. Add `var game = null` and `func get_game()` (= `game` if set, else `get_node_or_null("/root/Game")`, cached into `game`); `var seed_fn: Callable = func() -> int: return int(Time.get_unix_time_from_system()) + 1`; `var _end_pending := false` (used by GDR31). In `_ready` (after the existing lines, before `auto_start`) call `_connect_game()`: connect `get_game().day_advanced` to `_on_day_advanced`, and `get_game().toast_requested` to `show_toast` (when the game exists); `_exit_tree` disconnects them.
2. `func new_game() -> void`: `var g = get_game()`; `g.state = SimNewGame.start_game(int(seed_fn.call()))`; `Save.write(g.state)`; `g.changed.emit()`; `go(&"office", {}, "fade")`. `func continue_game() -> bool`: `var s := Save.read()`; when empty `show_toast("No saved game")` and return false; else `get_game().state = s`, `changed.emit()`, `go(&"office", {}, "fade")`, return true. `func to_title() -> void: go(&"title", {}, "fade")`.
3. `func _on_day_advanced() -> void`: `Save.write(get_game().state)`; play the cash sound: `var sfx := get_node_or_null("/root/Sfx")`; `if sfx != null and sfx.has_method("play"): sfx.play("cash")`; then `if current != null and current.has_method("show_news"): current.show_news()`. (GDR31 changes this function for the game-over case.) Extend `_wire(node, is_overlay)`: when the node has the signal `new_game` connect it to `new_game`; `continue_game` -> `continue_game`; `open_settings` -> `open_overlay(&"settings", {})`; `play_again` -> `new_game`; `to_title` -> `to_title`. (Name clash note: connect with lambdas, e.g. `node.new_game.connect(func(): new_game())`, because the signal and the method share a name.)
4. `godot/tests/test_flow_lifecycle.gd`: `Save.path = "user://test_flow_save.json"`, `Save.erase()`; main instance with `auto_start = false`, `main.game = FakeGame.new()`, `main.seed_fn = func(): return 5`, `main.room_paths` = `{&"office": fake_room, &"title": fake_room, &"endgame": fake_room, &"settings": fake_room}`; add to the tree. `new_game()`: `main.game.state.seed == 5`, `state.day == 1`, `state.cash == 20000`, `Save.has_save()` true, `current_id == &"office"`. `continue_game()` with no save returns false and `toast_count() == 1`; after `Save.write(s)` of a state with cash 777 it returns true, `main.game.state.cash == 777`, `current_id == &"office"`. `main.game.day_advanced.emit()` after setting `main.game.state.cash = 1234` -> `Save.read().cash == 1234`, and the fake room's `news_calls` is 1. `main.game.toast_requested.emit("Hello")` -> `toast_count()` grows. Title wiring: first edit `godot/tests/fake_room.gd` (GDR11's fixture) to add the five signals `new_game`, `continue_game`, `open_settings`, `play_again`, `to_title`; then after `go(&"title")` assert that emitting `open_settings` opens the overlay `&"settings"`, `play_again` starts a new game (cash 20000 again, day 1), `to_title` sets `current_id == &"title"`. Erase the save file at the end. Free the instance.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_flow_lifecycle` ends with `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Game over redirect and settings application (GDR31). Real Game autoload code (GDF10, GDS cards).

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDR30: Flow: new game, continue, autosave, title wiring`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
