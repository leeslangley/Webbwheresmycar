[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDR16 End-to-end smoke test: boot main, new game, ten days, game over

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDR16
Needs (already merged into `dev`): GDR31, GDR15, GDR02, GDR27, GDR28, GDR07, GDR08, GDR09, GDR10, GDS20
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
One test that plays the real game headless through the real scenes: instantiate `res://scenes/main.tscn`, start a new game, tap the kettle ten days in a row, visit the garage and the settings overlay and come back, continue from the title, then force a game over and check the redirect to the endgame screen, and PLAY AGAIN. Fails on any wrong state and (through the acceptance command) on any Godot script error in the output. Uses the real autoloads Game, Data, Sfx and the real sim: this card also proves the GDS cards are wired (`wait_day`, SimNewGame).

## Read first
- docs/GODOT.md (plan, TV-centred layout, tap rule, determinism) and docs/GODOT_PLANNER_BRIEF.md section SHARED CONTRACTS (Game, Data, Sim*, Core*, tests, tools)
- godot/rooms/room_base.gd (GDR19, class `RoomBase extends Control`): `LAYER_NAMES`, `build_layers()`, `layer(name)`, `placeholder(name)`, `ui()`, `set_plate(layer, tex, pos)`, `add_hotspot(id, rect) -> RoomHotspot` (invisible tap rect), `add_button(id, rect, text, kind) -> UiButton`, `hotspots` (id -> control, both kinds), `game` + `get_game()`, signals `request_scene(scene_id: StringName, params: Dictionary)`, `chatter(text)`, `toast(text)`, virtuals `enter(params)`, `exit()`, `_on_hotspot(id)`, `_on_button_blocked(id)`, `_on_button_down(id)`, statics `add_box`, `add_panel`, `add_label`, `pixel_font`. Rooms are built IN CODE in `_ready` (the .tscn is only a root Control with the script), so every node name in a card is an exact contract for the art cards (GDA) and the tests. Rooms are shown by the SceneHost (GDU30), which calls `enter(params)` after adding and `exit()` before removing.
- Game.act actions this card uses (GDS20 dispatch; results are Dictionaries `{ok: bool, msg: String}`; parameter keys are camelCase like the state): `wait_day` (the kettle: one day passes), `service_car {carId, kind: 'quick'|'full'}`, `fix_fault {carId}`, `restore_car {carId}`, `sell_to_dealer {carId}`, `return_rental {carId}`, `consign_car {carId, reserve}`, `unconsign {carId}`, `attend_auction {}`, `reveal_stat {lotId, stat}`, `place_bid {lotId, steps}`. The Game itself emits `toast_requested(msg)` for every REFUSED action, saves after every successful one, and emits `day_advanced` / `changed` / `game_over`: rooms therefore never toast a refusal themselves (they would show twice); they only toast the success messages the JS scenes toasted.
- Tapping in tests: `TapUtil.tap(control)` (godot/tests/tap_util.gd, GDR32) does press then release inside on ANY control that has `handle_event(ev)` (UiButton, RoomHotspot, UiMenu); `TapUtil.press(c)`, `TapUtil.release(c)`, `TapUtil.tap_away(c)` (press inside, release outside: must NOT activate); positions default to `Vector2(5, 5)` (inside) and `TapUtil.OUTSIDE`; for a UiMenu row pass a position such as `Vector2(20, 8 + 64 * i + 10)`.
- Tests: `godot/tests/test_<name>.gd` starts with `extends "res://tests/harness.gd"`; every method named `test_*` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`. Run one file with `sh tools/godot/gtest.sh test_<name>` (last line `GDTEST OK`).
- Test hygiene: get the tree with `var tree := Engine.get_main_loop() as SceneTree`; add a node with `tree.root.add_child(n)` when its `_ready` must run; at the end of each test `tree.root.remove_child(n)` (if added) and `n.free()`. Nodes made with `.new()` and never added can simply be `free()`d.
- godot/scenes/flow.gd (GDR11, GDR15, GDR30, GDR31: new_game, continue_game, go, open_overlay, current, current_id)
- godot/scenes/office.gd (GDR02)
- godot/autoload/game.gd (GDF10, GDS20: save_path, settings_path, erase_save)

## Files you may change (and nothing else)
- `godot/tests/test_e2e_smoke.gd`

## Steps
1. Everything runs synchronously (the headless Transitions path never awaits). Setup: `Game.save_path = "user://e2e_save.json"`, `Game.settings_path = "user://e2e_settings.json"`, `Game.erase_save()`; `var tree := Engine.get_main_loop() as SceneTree`; `var main = load("res://scenes/main.tscn").instantiate()`; `main.auto_start = false`; `tree.root.add_child(main)`; `var flow: Flow = main.flow`. Use the real `Game` autoload. All tapping goes through `TapUtil.tap(...)` on `flow.current.hotspots[...]`.
2. `test_boot_and_new_game()`: `flow.go(&"loading")` returns true; `flow.go(&"title")`; the continue button `flow.current.hotspots[&"continue"].enabled` is false; `TapUtil.tap(flow.current.hotspots[&"new_game"])` -> `flow.current_id == &"office"`, `Game.state.day == 1`, `Game.state.cash == 20000`, `Game.has_save()` true, the Main's HUD visible. `test_ten_days()`: from day 1, ten times: `TapUtil.tap(flow.current.hotspots[&"kettle"])` then check `Game.state.day == previous + 1`; after ten taps `Game.state.day == 11`, `main.scenes().depth() == 1`, and the banner `Stage/Banner.full_text` is not empty.
3. `test_garage_and_settings()`: `flow.go(&"garage")`; `TapUtil.tap(flow.current.hotspots[&"back"])` -> `current_id == &"office"`. `flow.open_overlay(&"settings")` -> `overlay_id == &"settings"`; `TapUtil.tap(flow.overlay.hotspots[&"crt"])` -> `Game.settings.crt` true; tap again -> false; `TapUtil.tap(flow.overlay.hotspots[&"back"])` -> `overlay_id == &""`. `test_auction_day()`: set `Game.state.day = 24` and `Game.changed.emit()`; `flow.go(&"office")`; the poster hotspot has `glow == true`; tap it -> `current_id == &"auction"`; `flow.current.get_node("Ui/LotNo").text` starts with "LOT 1/"; tap `back` -> office. `test_continue()`: `flow.go(&"title")`; the continue button is now enabled; tap it -> `current_id == &"office"` and `Game.state.day` equals the saved day.
4. `test_game_over_redirect()`: set `Game.state.flags = {"gameOver": true, "won": false, "reason": "year-end"}` and emit `Game.game_over`. The office asks its TV for the news: if `flow.current_id` is still `&"office"` then emit `flow.current.news_closed` by hand (the real TV needs frames to close a channel). Then `flow.current_id == &"endgame"`, the `Ui/Heading` label text is `EndgameRoom.heading_for(Game.state.flags)`, and `flow.go(&"office")` now also ends in `&"endgame"`. Tap `again` -> `current_id == &"office"`, `Game.state.day == 1`, `Game.state.flags.gameOver == false`. Finally `flow.to_title()` and `current_id == &"title"`. Cleanup: remove and free `main`, `Game.erase_save()`, delete the e2e settings file, put `Game.save_path` and `Game.settings_path` back to `CoreSave.SAVE_PATH` / `CoreSave.SETTINGS_PATH`.
5. Run it once for real and read the whole output. The acceptance command also fails on ANY line containing `SCRIPT ERROR` or `ERROR:` in the output. Fix errors in your own test file only; when a bug is in another card's file finish with `STATUS: BLOCKED` and the exact error text and file.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_e2e_smoke > /tmp/e2e.txt 2>&1; tail -1 /tmp/e2e.txt` prints `GDTEST OK`.
- `grep -c -E 'SCRIPT ERROR|ERROR:' /tmp/e2e.txt` prints `0`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything outside the one test file.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDR16: End-to-end smoke test: boot main, new game, ten days, game over`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
