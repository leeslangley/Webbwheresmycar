[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDR06 Auction behaviour: browse lots, stats, your lots, bid info

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDR06
Needs (already merged into `dev`): GDR05, GDR25, GDF03, GDF05
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Make the hall readable: PREV / NEXT through the six lots (wrap-around), the lot header (number, name, year, estimate), the four stat rows showing ??? until revealed, the YOUR LOTS panel of consigned cars, the bid / leader / minimum lines, paddles waving while the player leads, and BACK that refuses while the player leads a lot. Port of the draw / key / step parts of src/ui/scenes/auction.js. Buying anything is GDR28. Needs the sim port SimAuction (lot_view, min_bid, STATS) and CoreClock.

## Read first
- docs/GODOT.md (plan, TV-centred layout, tap rule, determinism) and docs/GODOT_PLANNER_BRIEF.md section SHARED CONTRACTS (Game, Data, Sim*, Core*, tests, tools)
- STAGE ZONES (1280x720): banner y 0..120, tableau y 120..590, HUD strip y 590..720. In main.tscn the Hud and Banner are separate nodes; a room keeps every tappable rect inside y 120..590 (the TV may overlap the zones a little).
- godot/rooms/room_base.gd (GDR19, class `RoomBase extends Control`): `LAYER_NAMES`, `build_layers()`, `layer(name)`, `placeholder(name)`, `set_plate(layer, tex, pos)`, `add_hotspot(id, rect)`, `hotspots`, `game` + `get_game()`, signals `request_scene(scene_id: StringName, params: Dictionary)`, `chatter(text)`, `toast(text)`, statics `add_box`, `add_panel`, `add_label`, `pixel_font`. Rooms are built IN CODE in `_ready` (the .tscn is only a root Control with the script), so every node name in a card is an exact contract for the art cards (GDA) and the tests.
- Tests: `godot/tests/test_<name>.gd` starts with `extends "res://tests/harness.gd"`; every method named `test_*` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`. Run one file with `sh tools/godot/gtest.sh test_<name>` (last line `GDTEST OK`).
- Test hygiene: get the tree with `var tree := Engine.get_main_loop() as SceneTree`; add a node with `tree.root.add_child(n)` when its `_ready` must run; at the end of each test `tree.root.remove_child(n)` (if added) and `n.free()`. Nodes made with `.new()` and never added can simply be `free()`d.
- godot/tests/fake_game.gd (GDR19): `FakeGame.new()` is a stand-in for the Game autoload with the same surface: `state` (Dictionary, JS key names such as day, cash, cars[].modelId), `act(action, params) -> Dictionary` (records `[action, params]` in `calls` and returns `result`, default `{"ok": true, "msg": ""}`), and signals `changed`, `toast_requested(text)`, `day_advanced`, `game_over`. A room gets it with `room.game = FakeGame.new()` BEFORE it is added to the tree.
- /Users/leelangley/wt/webbwheresmycar/_dev/src/ui/scenes/auction.js (enter, step, key, playerLeads, consignedViews, drawStatRow)
- /Users/leelangley/wt/webbwheresmycar/_dev/src/sim/auction.js (lotView return shape: lotId, modelId, name, year, estLow, estHigh, revealed{desirability,maintenance,reliability,condition}, values{}, currentBid, leader 'house'|'ai'|'player')
- godot/scenes/auction.gd + godot/rooms/auction_art.gd (GDR05 node names)

## Files you may change (and nothing else)
- `godot/scenes/auction.gd`
- `godot/tests/test_auction_behaviour.gd`

## Steps
1. Edit `godot/scenes/auction.gd`. Add `var lot_index := 0`, `var shown_lot_id := ""`, `var _t := 0.0`. In `_ready` after the art call `_build_controls()`, `_connect_game()`, `refresh()`. `_build_controls()` uses `RoomButton.add_to(self, id, rect, text, kind)`: `&"back"` R_BACK "BACK"; `&"prev"` R_PREV "<\nPREV"; `&"next"` R_NEXT ">\nNEXT" (font 16 title).
2. Helpers: `state()`, `lots() -> Array` (= `state().auction.lots`), `current_lot() -> Dictionary` (`lots()[lot_index]` or `{}`), `current_view() -> Dictionary` (`SimAuction.lot_view(state(), lot.lotId)` or `{}`), `player_leads() -> bool` (any lot with `leader == "player"`), `step(delta: int)`: with `n = lots().size()`, `lot_index = ((lot_index + delta) % n + n) % n` (nothing when n == 0), then `refresh()`. `static func fmt_stat(v) -> String`: if `is_equal_approx(float(v), roundf(float(v)))` return `str(int(roundf(float(v))))` else `CoreFormat.one_dp(float(v))`. `func _is_auction_day() -> bool` (day 1..365 and `CoreClock.is_auction_day`).
3. `enter(_params)`: `lot_index = 0`; if not an auction day emit `toast("The auction is only on the 24th")` and `request_scene(&"office", {})` and return; else `refresh()`. `refresh()`: wrap `lot_index` into range (0 when no lots); `view = current_view()`; `shown_lot_id` = the lot id or "". With a view: `LotNo` = "LOT %d/%d" % [lot_index + 1, n]; `LotName` = view.name; `LotInfo` = str(view.year) + "   Estimate " + `CoreFormat.money(view.estLow)` + " to " + money(view.estHigh); `NoLotsLabel.visible = false`. Without lots: those three are "" and `NoLotsLabel.visible = true`. Stat rows i = 0..3 with `stat = SimAuction.STATS[i]`: if revealed: `StatValue{i}` = `fmt_stat(view.values[stat])`, `StatHint{i}.visible = false`, `StatBar{i}.size.x = 160.0 * clampf(float(value) / 10.0, 0.0, 1.0)`; else `StatValue{i}` = "???", `StatHint{i}` visible with text "REVEAL " + `CoreFormat.money(SimAuction.AUCTION_REVEAL_COST)`, bar width 0 (no lots: same as hidden but the hint is hidden).
4. Bid block: `BidLabel` = "Bid: " + (money(view.currentBid) if `currentBid > 0` else "none"); `LeaderLabel` = "You" / "Rival bidder" / "Nobody" for leader player / ai / otherwise; `MinLabel` = "Min next " + money(`SimAuction.min_bid(lot)`) (lot = the RAW lot dictionary); all "" without lots. YOUR LOTS: for each entry of `state().auction.consigned` whose `carId` is a car in `state().cars`, in order, up to YOURS_ROWS: `YoursRow{j}` = the model name (`Data.cars()` lookup by `modelId`) and `YoursRes{j}` = money(`reserve`); unused rows "" ; `YoursEmpty.visible` only when there are no such entries. Paddles: `Paddle0..4` visible only when `view.leader == "player"`. Finish with `_refresh_buttons()` (empty virtual `func _refresh_buttons() -> void: pass`, GDR28 overrides). `func _process(delta)`: `_t += delta`; for visible paddles set `rotation = sin(_t * 5.0 + i * 1.7) * 0.5`; for persons bob `position.y = round(sin(_t * 2.0 + i) * 3.0)`.
5. Input: `_on_hotspot(id)`: `back` -> `try_leave()`; `prev` -> `step(-1)`; `next` -> `step(1)`; else `_on_action(id)` (empty virtual `func _on_action(_id: StringName) -> void: pass`). `try_leave()`: if `player_leads()` emit `toast("You are winning a lot. Settle first")` else emit `request_scene(&"office", {})`. `handle_key(keycode) -> bool`: KEY_LEFT `step(-1)`, KEY_RIGHT `step(1)`, KEY_ESCAPE `try_leave()`. `_connect_game()` connects `get_game().changed` to `refresh`.
6. `godot/tests/test_auction_behaviour.gd` with `FakeGame`; prepare the state: `var s := fake.state; CoreRng.seed_rng(s, 7); s.day = 24; SimAuction.prepare_auction(s)` (6 lots). `enter({})`: `LotNo.text == "LOT 1/6"`, `LotName.text == current_view().name`, `LotInfo.text` contains `str(year)` and `CoreFormat.money(estLow)`; `step(1)` -> "LOT 2/6"; from 0, `step(-1)` -> "LOT 6/6" (wrap); `fmt_stat(6.0) == "6"`, `fmt_stat(6.4) == "6.4"`, `fmt_stat(7) == "7"`. All stat rows start hidden: `StatValue0.text == "???"`, `StatBar0.size.x == 0`, `StatHint0.text == "REVEAL " + CoreFormat.money(SimAuction.AUCTION_REVEAL_COST)`; reveal one in the test with the sim directly (`SimAuction.reveal_stat(s, lot.lotId, "desirability")`) then `refresh()`: `StatValue0` is the value, hint hidden, bar width `160 * value / 10` (near). Bid block: "Bid: none", "Nobody", `MinLabel.text == "Min next " + money(SimAuction.min_bid(lot))`; set `lot.leader = "player"`, `lot.currentBid = 1234`, `refresh()` -> "Bid: " + money(1234), "You", paddles visible; `leader = "ai"` -> "Rival bidder". BACK tap while the player leads: toast "You are winning a lot. Settle first" and no request; after `leader = "house"` BACK requests `[&"office", {}]`. Consigned: add `{"carId": "c1", "reserve": 2500}` -> `YoursRow0.text == "Austen Allergy"`, `YoursRes0.text == money(2500)`, `YoursEmpty` hidden; remove it -> `YoursEmpty` visible. No lots (`s.auction.lots = []`): `NoLotsLabel.visible`, `LotName.text == ""`. `enter({})` on `s.day = 2` toasts "The auction is only on the 24th" and requests office. `handle_key(KEY_RIGHT)` returns true and steps. Free the node.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_auction_behaviour` ends with `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Bid, reveal and leave actions (GDR28).

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDR06: Auction behaviour: browse lots, stats, your lots, bid info`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
