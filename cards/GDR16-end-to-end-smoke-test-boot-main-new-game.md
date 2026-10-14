[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDR16 End-to-end smoke test: boot main, new game, ten days, game over

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDR16
Needs (already merged into `dev`): GDR31, GDR15, GDR02, GDR27, GDR28, GDR07, GDR08, GDR09, GDR10
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
One test that plays the real game headless through the real scenes: instantiate `res://scenes/main.tscn`, start a new game, tap the kettle ten days in a row, visit the garage and the settings overlay and come back, continue from the title, then force a game over and check the redirect to the endgame screen, and PLAY AGAIN. Fails on any wrong state and (through the acceptance command) on any Godot script error in the output. Uses the real autoloads Game, Data, Sfx and the real sim: this card also proves the GDS cards are wired (`advance`, SimNewGame).

## Read first
- docs/GODOT.md (plan, TV-centred layout, tap rule, determinism) and docs/GODOT_PLANNER_BRIEF.md section SHARED CONTRACTS (Game, Data, Sim*, Core*, tests, tools)
- godot/rooms/room_base.gd (GDR19, class `RoomBase extends Control`): `LAYER_NAMES`, `build_layers()`, `layer(name)`, `placeholder(name)`, `set_plate(layer, tex, pos)`, `add_hotspot(id, rect)`, `hotspots`, `game` + `get_game()`, signals `request_scene(scene_id: StringName, params: Dictionary)`, `chatter(text)`, `toast(text)`, statics `add_box`, `add_panel`, `add_label`, `pixel_font`. Rooms are built IN CODE in `_ready` (the .tscn is only a root Control with the script), so every node name in a card is an exact contract for the art cards (GDA) and the tests.
- Action names and parameters this card assumes in `Game.act` (the GDS planner must provide them): `advance` (the kettle; one day passes), `service_car {carId, kind: 'quick'|'full'}`, `fix_fault {carId}`, `restore_car {carId}`, `sell_to_dealer {carId}`, `return_rental {carId}`, `consign_car {carId, reserve}`, `unconsign {carId}`, `attend_auction {}`, `reveal_stat {lotId, stat}`, `place_bid {lotId, steps}`. Every result is a Dictionary with `ok` (bool) and `msg` (String), exactly as src/sim/actions.js. Parameter keys are camelCase like the state keys.
- Tests: `godot/tests/test_<name>.gd` starts with `extends "res://tests/harness.gd"`; every method named `test_*` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`. Run one file with `sh tools/godot/gtest.sh test_<name>` (last line `GDTEST OK`).
- Test hygiene: get the tree with `var tree := Engine.get_main_loop() as SceneTree`; add a node with `tree.root.add_child(n)` when its `_ready` must run; at the end of each test `tree.root.remove_child(n)` (if added) and `n.free()`. Nodes made with `.new()` and never added can simply be `free()`d.
- godot/scenes/flow.gd (GDR11, GDR15, GDR30, GDR31: new_game, continue_game, go, open_overlay, current, current_id)
- godot/scenes/office.gd (GDR02), godot/rooms/save.gd (GDR12)

## Files you may change (and nothing else)
- `godot/tests/test_e2e_smoke.gd`

## Steps
1. Everything runs synchronously (the headless Transitions path never awaits). Setup: `Save.path = "user://e2e_save.json"`, `Save.erase()`, `SettingsStore.path = "user://e2e_settings.json"`; `var tree := Engine.get_main_loop() as SceneTree`; `var main = load("res://scenes/main.tscn").instantiate()`; `main.auto_start = false`; `main.seed_fn = func(): return 12345`; `tree.root.add_child(main)`. Use the real `Game` autoload (`main.get_game()`). All tapping goes through hotspots: a helper `func tap(hs) -> void: hs.press(); hs.release(true)`.
2. `test_boot_and_new_game()`: `main.go(&"loading")` returns true; `main.go(&"title")`; the continue hotspot `main.current.hotspots[&"continue"].enabled` is false; `tap(main.current.hotspots[&"new_game"])` -> `main.current_id == &"office"`, `Game.state.day == 1`, `Game.state.cash == 20000`, `Game.state.seed == 12345`, `Save.has_save()` true, `Stage/Hud.visible` true. `test_ten_days()`: from day 1, ten times: `tap(main.current.hotspots[&"kettle"])` then check `Game.state.day == previous + 1`, `Save.read().day == Game.state.day` (autosave), and the banner `Stage/Banner/Text` text is not empty after the first day; after ten taps `Game.state.day == 11` and the Stage/Room still has exactly one child. (If a tap returns a refusal toast the test fails: kettle days never fail.)
3. `test_garage_and_settings()`: `main.go(&"garage")`; `tap(main.current.hotspots[&"back"])` -> `current_id == &"office"`. `main.open_overlay(&"settings")` -> `overlay_id == &"settings"`; `tap(main.overlay.hotspots[&"crt"])` -> `SettingsStore.get_value("crt")` true and `Post/Crt.visible` true; `tap(main.overlay.hotspots[&"crt"])` again -> false; `tap(main.overlay.hotspots[&"back"])` -> `overlay_id == &""`. `test_auction_day()`: set `Game.state.day = 24` and `Game.changed.emit()`; `main.go(&"office")`; the poster hotspot has `glow == true`; tap it -> `current_id == &"auction"`; the lot label `main.current.get_node("Ui/LotNo").text == "LOT 1/6"`; tap `back` -> office. (If the first auction in the real start state has fewer than 6 lots, compare against `Game.state.auction.lots.size()`.) `test_continue()`: `main.go(&"title")`; the continue hotspot is now enabled; tap it -> `current_id == &"office"` and the day equals the saved day.
4. `test_game_over_redirect()`: set `Game.state.flags = {"gameOver": true, "won": false, "reason": "year-end"}` and emit `Game.game_over`. The office asks its TV for the news: if `main.current_id` is still `&"office"` then emit `main.current.news_closed` by hand (the real TV needs frames to close a channel). Then `main.current_id == &"endgame"`, the `Ui/Heading` label text is `EndgameRoom.heading_for(Game.state.flags)`, and `main.go(&"office")` now also ends in `&"endgame"`. Tap `again` -> `current_id == &"office"`, `Game.state.day == 1`, `Game.state.flags.gameOver == false`. Finally `main.to_title()` and `current_id == &"title"`. Cleanup: remove and free `main`, `Save.erase()`, delete the e2e settings file.
5. Run it once for real and read the whole output. The acceptance command also fails on ANY line containing `SCRIPT ERROR` or `ERROR:` in the output, so fix script errors in the files of the cards that own them ONLY by reporting them: do not edit other cards' files (finish with `STATUS: BLOCKED` and the exact error text and file when a bug is not in your own test file).

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
