[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDR28 Auction actions: reveal stats, bid, leave and settle

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDR28
Needs (already merged into `dev`): GDR06
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Make the hall playable: tap a hidden stat row to pay to reveal it, BID +1 and BID +3, and LEAVE & SETTLE (the auction-day visit that settles everything and costs the day). All through Game.act. Keeps the JS safety rule: a tap only counts for the lot that was on screen when the finger went DOWN.

## Read first
- docs/GODOT.md (plan, TV-centred layout, tap rule, determinism) and docs/GODOT_PLANNER_BRIEF.md section SHARED CONTRACTS (Game, Data, Sim*, Core*, tests, tools)
- godot/rooms/room_base.gd (GDR19, class `RoomBase extends Control`): `LAYER_NAMES`, `build_layers()`, `layer(name)`, `placeholder(name)`, `set_plate(layer, tex, pos)`, `add_hotspot(id, rect)`, `hotspots`, `game` + `get_game()`, signals `request_scene(scene_id: StringName, params: Dictionary)`, `chatter(text)`, `toast(text)`, statics `add_box`, `add_panel`, `add_label`, `pixel_font`. Rooms are built IN CODE in `_ready` (the .tscn is only a root Control with the script), so every node name in a card is an exact contract for the art cards (GDA) and the tests.
- Action names and parameters this card assumes in `Game.act` (the GDS planner must provide them): `advance` (the kettle; one day passes), `service_car {carId, kind: 'quick'|'full'}`, `fix_fault {carId}`, `restore_car {carId}`, `sell_to_dealer {carId}`, `return_rental {carId}`, `consign_car {carId, reserve}`, `unconsign {carId}`, `attend_auction {}`, `reveal_stat {lotId, stat}`, `place_bid {lotId, steps}`. Every result is a Dictionary with `ok` (bool) and `msg` (String), exactly as src/sim/actions.js. Parameter keys are camelCase like the state keys.
- Tests: `godot/tests/test_<name>.gd` starts with `extends "res://tests/harness.gd"`; every method named `test_*` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`. Run one file with `sh tools/godot/gtest.sh test_<name>` (last line `GDTEST OK`).
- Test hygiene: get the tree with `var tree := Engine.get_main_loop() as SceneTree`; add a node with `tree.root.add_child(n)` when its `_ready` must run; at the end of each test `tree.root.remove_child(n)` (if added) and `n.free()`. Nodes made with `.new()` and never added can simply be `free()`d.
- godot/tests/fake_game.gd (GDR19): `FakeGame.new()` is a stand-in for the Game autoload with the same surface: `state` (Dictionary, JS key names such as day, cash, cars[].modelId), `act(action, params) -> Dictionary` (records `[action, params]` in `calls` and returns `result`, default `{"ok": true, "msg": ""}`), and signals `changed`, `toast_requested(text)`, `day_advanced`, `game_over`. A room gets it with `room.game = FakeGame.new()` BEFORE it is added to the tree.
- /Users/leelangley/wt/webbwheresmycar/_dev/src/ui/scenes/auction.js (the hits in draw, pointer with pressedLot)
- godot/scenes/auction.gd (GDR06), godot/rooms/hotspot.gd (GDR18: signal pressed_down)

## Files you may change (and nothing else)
- `godot/scenes/auction.gd`
- `godot/tests/test_auction_actions.gd`

## Steps
1. Edit `godot/scenes/auction.gd`. In `_build_controls()` add: `RoomButton.add_to(self, &"bid1", R_BID1, "", "primary")`, `&"bid3"` with R_BID3 (primary), `&"leave"` with R_LEAVE and text "LEAVE & SETTLE" (primary); and four invisible tap rects `add_hotspot(&"reveal0", R_STAT_ROWS[0])` ... `&"reveal3"`. Add `var _pressed_lot := ""` and connect every one of these seven controls' `pressed_down` signal to a lambda that sets `_pressed_lot = shown_lot_id`.
2. `_refresh_buttons()` (override the empty virtual): with a current lot `bid1.text = "BID +1 " + CoreFormat.money(SimAuction.min_bid(lot))`, `bid3.text = "BID +3 " + money(SimAuction.min_bid(lot) + 2 * SimAuction.bid_step(lot))`, both visible and enabled; with no lots they are `visible = false`, `enabled = false`. `revealN.enabled` is true only when a lot exists and `view.revealed[SimAuction.STATS[N]]` is false. `leave` is always visible and enabled.
3. `_on_action(id)`: `func _act(action: String, params: Dictionary) -> Dictionary` calls `get_game().act(action, params)` (returns `{}` when the result is not a Dictionary), then `refresh()`. `bid1` / `bid3`: return without doing anything when `_pressed_lot != shown_lot_id` (the tap rule for lots); otherwise `var r := _act("place_bid", {"lotId": shown_lot_id, "steps": 1 or 3})` and emit `toast(String(r.get("msg", "")))` when the msg is not empty. `reveal0..3`: same guard, `_act("reveal_stat", {"lotId": shown_lot_id, "stat": SimAuction.STATS[N]})`, toast the msg. `leave`: `var r := _act("attend_auction", {})`; if `r.get("ok", false)` emit `request_scene(&"office", {})`, else toast the msg. Bids and reveals cost no day (the Game does not advance); attending costs the day (the Game advances and emits `day_advanced`).
4. `godot/tests/test_auction_actions.gd` (state prepared exactly as in GDR06's test: seeded, day 24, `SimAuction.prepare_auction`). `bid1.text == "BID +1 " + money(min_bid(lot))`, `bid3.text == "BID +3 " + money(min_bid(lot) + 2 * bid_step(lot))`. Tap bid1: `fake.calls.back() == ["place_bid", {"lotId": lot.lotId, "steps": 1}]`; with `fake.result = {"ok": true, "msg": "You lead."}` a toast "You lead." is emitted; bid3 uses steps 3. Lot guard: `bid1.press()`, then `room.step(1)`, then `bid1.release(true)` -> `fake.calls` did not grow. Reveal: tap `reveal0` -> `["reveal_stat", {"lotId": ..., "stat": "desirability"}]`, reveal1 "maintenance", reveal2 "reliability", reveal3 "condition"; after marking a stat revealed in the lot (`lot.revealed.desirability = true`) + `refresh()`, `reveal0.enabled == false` and a tap makes no call. Leave: default result `ok` true -> `[&"office", {}]` requested and `calls.back()[0] == "attend_auction"`; with `{"ok": false, "msg": "Already been"}` a toast "Already been" and no request. No lots: bid buttons not visible, all reveals disabled. Free the node.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_auction_actions` ends with `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDR28: Auction actions: reveal stats, bid, leave and settle`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
