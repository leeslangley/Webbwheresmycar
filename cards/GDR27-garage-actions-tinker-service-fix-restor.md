[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDR27 Garage actions: tinker, service, fix, restore, sell, consign

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDR27
Needs (already merged into `dev`): GDR04, GDR26
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The six action buttons of the garage with the exact labels, prices, dimming rules and Game.act calls of src/ui/scenes/garage.js (drawButtons). Disabled-looking buttons still take the tap: the sim refuses and the refusal message becomes a toast.

## Read first
- docs/GODOT.md (plan, TV-centred layout, tap rule, determinism) and docs/GODOT_PLANNER_BRIEF.md section SHARED CONTRACTS (Game, Data, Sim*, Core*, tests, tools)
- godot/rooms/room_base.gd (GDR19, class `RoomBase extends Control`): `LAYER_NAMES`, `build_layers()`, `layer(name)`, `placeholder(name)`, `set_plate(layer, tex, pos)`, `add_hotspot(id, rect)`, `hotspots`, `game` + `get_game()`, signals `request_scene(scene_id: StringName, params: Dictionary)`, `chatter(text)`, `toast(text)`, statics `add_box`, `add_panel`, `add_label`, `pixel_font`. Rooms are built IN CODE in `_ready` (the .tscn is only a root Control with the script), so every node name in a card is an exact contract for the art cards (GDA) and the tests.
- Action names and parameters this card assumes in `Game.act` (the GDS planner must provide them): `advance` (the kettle; one day passes), `service_car {carId, kind: 'quick'|'full'}`, `fix_fault {carId}`, `restore_car {carId}`, `sell_to_dealer {carId}`, `return_rental {carId}`, `consign_car {carId, reserve}`, `unconsign {carId}`, `attend_auction {}`, `reveal_stat {lotId, stat}`, `place_bid {lotId, steps}`. Every result is a Dictionary with `ok` (bool) and `msg` (String), exactly as src/sim/actions.js. Parameter keys are camelCase like the state keys.
- Tests: `godot/tests/test_<name>.gd` starts with `extends "res://tests/harness.gd"`; every method named `test_*` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`. Run one file with `sh tools/godot/gtest.sh test_<name>` (last line `GDTEST OK`).
- Test hygiene: get the tree with `var tree := Engine.get_main_loop() as SceneTree`; add a node with `tree.root.add_child(n)` when its `_ready` must run; at the end of each test `tree.root.remove_child(n)` (if added) and `n.free()`. Nodes made with `.new()` and never added can simply be `free()`d.
- godot/tests/fake_game.gd (GDR19): `FakeGame.new()` is a stand-in for the Game autoload with the same surface: `state` (Dictionary, JS key names such as day, cash, cars[].modelId), `act(action, params) -> Dictionary` (records `[action, params]` in `calls` and returns `result`, default `{"ok": true, "msg": ""}`), and signals `changed`, `toast_requested(text)`, `day_advanced`, `game_over`. A room gets it with `room.game = FakeGame.new()` BEFORE it is added to the tree.
- /Users/leelangley/wt/webbwheresmycar/_dev/src/ui/scenes/garage.js (function drawButtons and runAct, key handler)
- godot/rooms/garage_costs.gd (GDR26), godot/scenes/garage.gd (GDR04), godot/rooms/room_button.gd (GDR25)

## Files you may change (and nothing else)
- `godot/scenes/garage.gd`
- `godot/tests/test_garage_actions.gd`

## Steps
1. Edit `godot/scenes/garage.gd`. In `_build_controls()` add the six buttons with `RoomButton.add_to(self, id, BTN_RECTS[id], "", "normal")` for ids `&"tinker"`, `&"service"`, `&"fix"`, `&"restore"`, `&"sell"`, `&"consign"`. Implement `_refresh_buttons()` (called at the end of `refresh()`): with no selected car all six are `visible = false, enabled = false`; otherwise they are visible/enabled and (`c` = selected car, `m` = model, `cash` = state cash, `fc` = fault cost or 0, `consigned` = `GarageCosts.is_consigned(state, c.id)`): `tinker` text "TINKER " + `CoreFormat.money(GarageCosts.tinker_cost(m))`, dimmed unless `c.condition < 10 and cash >= tinker_cost`; `service` text "SERVICE " + money(service_cost), same dimming rule; `fix` text "FIX FAULT " + money(fc) when there is a fault else "FIX FAULT", dimmed unless `fault != null and cash >= fc`; `restore` text "RESTORE " + money(restore_cost), dimmed when `(c.condition >= 10 and fault == null)` or `cash < restore_cost`. Owned car: `sell` text "SELL " + money(`GarageCosts.dealer_price`), dimmed when consigned; `consign` text "WITHDRAW" if consigned else "CONSIGN", dimmed unless (consigned or not auction day). Rented car: `sell` text "RETURN " + money(`GarageCosts.damage_fee`), dimmed when `cash < fee`; `consign` is `visible = false, enabled = false`.
2. Actions in `_on_action(id)` through `func _act(action: String, params: Dictionary) -> Dictionary`: `var r = get_game().act(action, params)`; if `r is Dictionary and r.get("ok", true) == false` emit `toast(String(r.get("msg", "")))`; call `refresh()`; return `r` (or `{}`). `tinker` -> `_act("service_car", {"carId": id, "kind": "quick"})`; `service` -> kind "full"; `fix` -> `"fix_fault"`; `restore` -> `"restore_car"`; `sell` -> `"sell_to_dealer"` for an owned car or `"return_rental"` for a rented one (both `{"carId": id}`); `consign`: if consigned -> `_act("unconsign", {"carId": id})`; else if it is an auction day (`state.day` in 1..365 and `CoreClock.is_auction_day`) emit `toast("Too late, the auction is today")`; else `var reserve := GarageCosts.consign_reserve(state, m, c)`, `var r = _act("consign_car", {"carId": id, "reserve": reserve})` and when `r.ok` emit `toast("Consigned. Reserve " + CoreFormat.money(reserve))`.
3. Keys: extend `handle_key`: KEY_S = service (full), KEY_T = tinker (quick), KEY_F = fix; each only when a car is selected.
4. `godot/tests/test_garage_actions.gd` with `FakeGame`: select c1 (owned, cond 5.0, cash 20000): button texts equal "TINKER " + money(tinker_cost) etc.; `tinker.dimmed == false`; `fix.dimmed == true` (no fault) but tapping it still calls `["fix_fault", {"carId": "c1"}]`; tapping tinker gives `fake.calls.back() == ["service_car", {"carId": "c1", "kind": "quick"}]`, service gives kind "full", restore gives `["restore_car", {"carId": "c1"}]`, sell gives `["sell_to_dealer", {"carId": "c1"}]`; `sell.text` starts with "SELL "; with `fake.result = {"ok": false, "msg": "Not enough money"}` a tap emits `toast("Not enough money")`. Cash 10 -> tinker, service, restore dimmed. Select c2 (rented, fault cost 300): `sell.text` starts with "RETURN ", tap gives `["return_rental", {"carId": "c2"}]`, `consign.visible == false`, `fix.text == "FIX FAULT " + money(300)` and not dimmed. Consign on day 2: tap gives `calls.back()[0] == "consign_car"` with `reserve == GarageCosts.consign_reserve(...)` and a toast starting "Consigned. Reserve "; after adding `{"carId": "c1", "reserve": 100}` to `state.auction.consigned` + `refresh()` the text is "WITHDRAW" and a tap calls `["unconsign", {"carId": "c1"}]`; on day 24 a CONSIGN tap emits the toast "Too late, the auction is today" and makes no call. `handle_key(KEY_S)` calls service full. Free the node.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_garage_actions` ends with `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDR27: Garage actions: tinker, service, fix, restore, sell, consign`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
