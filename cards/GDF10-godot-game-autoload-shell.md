[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDF10 Godot: Game autoload shell

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDF10
Needs (already merged into `dev`): GDF08, GDF09, GDF15
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The `Game` singleton: the port of `src/game.js` createGame. It owns `state`, starts / continues / erases games, saves after each successful action, and `act()` dispatches an action NAME to the sim ports (which other cards write). Scenes only read `Game.state` and call `Game.act`.

## Read first
- src/game.js (read it all)
- src/sim/actions.js (result shape `{ok, msg}`; first 80 lines)
- src/sim/newgame.js
- godot/core/state.gd (GDF08)
- godot/autoload/save.gd (GDF09)
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` and every method named `test_*` is run; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `autoload(name) -> Node`

## Files you may change (and nothing else)
- `godot/autoload/game.gd`
- `godot/tests/fake_actions.gd`
- `godot/tests/test_game.gd`

## Steps
1. `godot/autoload/game.gd` (replace the stub): `extends Node`. Signals: `signal changed`, `signal toast_requested(text: String)`, `signal day_advanced`, `signal game_over`. Vars: `var state: Dictionary = {}`, `var settings: Dictionary = CoreSave.default_settings()`, `var save_path: String = CoreSave.SAVE_PATH`, `var settings_path: String = CoreSave.SETTINGS_PATH`.
2. Action table: `var _actions: Dictionary` initialised from this constant (entry = `[script path, function name, [param keys in call order]]`): `"buy_car": ["res://sim/actions.gd", "buy_car", ["listing_id"]]`, `"rent_car"` (same, `listing_id`), `"return_rental"` (`car_id`), `"sell_to_dealer"` (`car_id`), `"buy_slot"` (no params), `"wait_day"` (no params), `"service_car": ["res://sim/garage.gd", "service_car", ["car_id", "kind"]]`, `"fix_fault"` (garage.gd, `car_id`), `"restore_car"` (garage.gd, `car_id`), `"accept_job": ["res://sim/jobresolve.gd", "accept_job", ["request_id", "car_id"]]`, `"advertise": ["res://sim/adsim.gd", "advertise", ["media_id"]]`. `func register_action(action: String, script_path: String, func_name: String, param_keys: Array) -> void` adds or replaces an entry (later cards add the auction actions this way); `func has_action(action: String) -> bool`.
3. `func act(action: String, params: Dictionary = {}) -> Dictionary`, in this order: (a) `state.is_empty()` -> return `{"ok": false, "msg": "No game running"}`; (b) unknown name -> `{"ok": false, "msg": "Unknown action: " + action}`; (c) script path not found (`ResourceLoader.exists`) -> `{"ok": false, "msg": "Action not built yet: " + action}`; (d) a param key missing from `params` -> `{"ok": false, "msg": "Missing parameter: " + key}`; (e) `var r: Variant = load(path).callv(func_name, [state] + args)` (the sim functions are `static`, take the state Dictionary first and return a Dictionary); (f) when `r` is a Dictionary with `ok == true`: `save_now()`, then emit `day_advanced`, then `changed`, then play the cash sound if the Sfx singleton exists (`Engine.get_main_loop().root.get_node_or_null("Sfx")` and it `has_method("play")`), then if `state.flags.gameOver == true` emit `game_over`; when `ok == false` and it has a non-empty `msg` emit `toast_requested(msg)` (no other signal); (g) return `r` untouched (a result without an `ok` field passes through with no signals).
4. Other methods: `func new_game(seed_value: int = -1) -> void`: seed = `seed_value` unless it is -1, then `int(Time.get_unix_time_from_system()) + 1`; `state = ` the result of `load("res://sim/newgame.gd").start_game(seed)` when that file exists (`ResourceLoader.exists`), else `CoreState.new_game_state(seed)`; `save_now()`; emit `changed`. `func continue_game() -> bool`: load with `CoreSave.load_from(save_path)`; when null emit `toast_requested("No saved game")` and return false; else set `state`, emit `changed`, return true. `func has_save() -> bool`, `func erase_save() -> bool` (via CoreSave with `save_path`), `func save_now() -> bool` (`CoreSave.save_to(state, save_path)`), `func load_settings() -> void` (`settings = CoreSave.load_settings(settings_path)`), `func save_settings() -> bool`. `func _ready() -> void: load_settings()`.
5. `godot/tests/fake_actions.gd` (test helper, no tests in it): `extends RefCounted`; `static func double_cash(state: Dictionary, n: int) -> Dictionary` (`state.cash = state.cash * n`, returns `{"ok": true, "msg": "doubled"}`); `static func refuse(_state: Dictionary) -> Dictionary` (returns `{"ok": false, "msg": "No way"}`); `static func end_it(state: Dictionary) -> Dictionary` (sets `state.flags.gameOver = true`, returns ok true); `static func plain(_state: Dictionary) -> int` (returns 5).
6. `godot/tests/test_game.gd`: create the Game under test with `var g: Node = load("res://autoload/game.gd").new()` (NOT the autoload; it is not in the tree), set `g.save_path = "user://test_game_save.json"` and `g.settings_path = "user://test_game_settings.json"`, register the four fake actions (`double_cash` with `["n"]`, `refuse`, `end_it`, `plain` with no params; script path `res://tests/fake_actions.gd`), and `g.free()` plus delete the two temp files at the end of each test. Count signals with lambdas over a shared Array, e.g. `var hits := [0]; g.changed.connect(func(): hits[0] += 1)`. Tests: `test_no_game` (act before new_game gives `No game running`); `test_new_game` (`new_game(7)`: `state.seed == 7`, `state.day == 1`, `state.cash == 20000`, `g.has_save()` true); `test_unknown_action` (`msg` is `Unknown action: nope`, `ok` false); `test_missing_param` (`act("double_cash", {})` -> `Missing parameter: n`); `test_success` (`act("double_cash", {"n": 2})` returns ok true, `state.cash == 40000`, `changed` once, `day_advanced` once, `toast_requested` zero times, and a fresh `continue_game()` after resetting `g.state = {}` restores cash 40000); `test_refused` (ok false; `toast_requested` got text `No way`; `day_advanced` and `changed` zero); `test_game_over_signal` (`end_it` emits `game_over` once); `test_passthrough` (`plain` returns 5 and no signals); `test_not_built_yet` (`act("buy_car", {"listing_id": 1})` gives ok false with `msg` either `Action not built yet: buy_car` or any msg when the sim file already exists; just check `ok` is false OR the call returned a Dictionary); `test_has_action` (`buy_car`, `accept_job`, `advertise` true; `nope` false); `test_continue_without_save` (returns false and emits the toast `No saved game`); `test_settings_roundtrip`.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_game | tail -1` prints `GDTEST OK`.
- `sh tools/godot/gtest.sh | tail -1` prints `GDTEST OK` (the whole suite).
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- The sim ports themselves (GDS cards). Scenes. Scene stack / navigation (GDR cards). Music.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDF10: Godot: Game autoload shell`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
