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
- godot/rooms/room_base.gd (GDR19, class `RoomBase extends Control`): `LAYER_NAMES`, `build_layers()`, `layer(name)`, `placeholder(name)`, `ui()`, `set_plate(layer, tex, pos)`, `add_hotspot(id, rect) -> RoomHotspot` (invisible tap rect), `add_button(id, rect, text, kind) -> UiButton`, `hotspots` (id -> control, both kinds), `game` + `get_game()`, signals `request_scene(scene_id: StringName, params: Dictionary)`, `chatter(text)`, `toast(text)`, virtuals `enter(params)`, `exit()`, `_on_hotspot(id)`, `_on_button_blocked(id)`, `_on_button_down(id)`, statics `add_box`, `add_panel`, `add_label`, `pixel_font`. Rooms are built IN CODE in `_ready` (the .tscn is only a root Control with the script), so every node name in a card is an exact contract for the art cards (GDA) and the tests. Rooms are shown by the SceneHost (GDU30), which calls `enter(params)` after adding and `exit()` before removing.
- Widgets from the GDU cards that rooms use: `UiButton` (godot/ui/button.gd: `UiButton.new()`, vars `text` (up to 2 lines, split on \n), `kind` 'normal'|'primary'|'remote'|'card', `enabled`, `hot` (gold outline = selected), signals `activated` and `blocked` (a tap on a DISABLED button), `handle_event(ev)`, minimum size 64x64); `UiTap` (godot/ui/tap.gd: `press(id)`, `release(id) -> bool`); `UiMenu` (godot/ui/menu.gd: `open(list: Array[String], at: Vector2)`, `set_item_enabled(i, on)`, signal `chosen(index: int)`, closes itself when a row is chosen, rows 64 px, width 280); `UiTheme` (godot/ui/ui_theme.gd: `title_font()`, `body_font()`, `color(key)`).
- Game.act actions this card uses (GDS20 dispatch; results are Dictionaries `{ok: bool, msg: String}`; parameter keys are camelCase like the state): `wait_day` (the kettle: one day passes), `service_car {carId, kind: 'quick'|'full'}`, `fix_fault {carId}`, `restore_car {carId}`, `sell_to_dealer {carId}`, `return_rental {carId}`, `consign_car {carId, reserve}`, `unconsign {carId}`, `attend_auction {}`, `reveal_stat {lotId, stat}`, `place_bid {lotId, steps}`. The Game itself emits `toast_requested(msg)` for every REFUSED action, saves after every successful one, and emits `day_advanced` / `changed` / `game_over`: rooms therefore never toast a refusal themselves (they would show twice); they only toast the success messages the JS scenes toasted.
- Test double for the Game autoload: `TestFakeGame.new()` (godot/tests/fake_game.gd, GDU28). Its `state` is the sample state: day 12, cash 12345, reputation 40, garageSlots 3, cars `c1` (modelId t1_allergy, owned, condition 6.0, fault null) and `c2` (t1_robbin, owned, condition 9.0, fault `{faultId: 'puncture', label: 'Flat tyre', cost: 80, severity: 'minor'}`, rentMonthly 0, rentedAtCondition null), 3 shop listings, 2 requests, stats.jobsDone 2, plates all false, auction `{month 1, lots [], consigned [], lastResults []}`, flags `{gameOver false, won false, reason ''}`. `act(action, params)` appends `{action, params}` to `acts`, returns a copy of `next_result` (default `{ok: true, msg: 'Done'}`), emits `changed` when ok is true and `toast_requested(msg)` when ok is false with a message; `toasts` collects the toast texts; signals `changed`, `toast_requested`, `day_advanced`, `game_over`. A room gets it with `room.game = TestFakeGame.new()` BEFORE it is added to the tree.
- Tapping in tests: `TapUtil.tap(control)` (godot/tests/tap_util.gd, GDR32) does press then release inside on ANY control that has `handle_event(ev)` (UiButton, RoomHotspot, UiMenu); `TapUtil.press(c)`, `TapUtil.release(c)`, `TapUtil.tap_away(c)` (press inside, release outside: must NOT activate); positions default to `Vector2(5, 5)` (inside) and `TapUtil.OUTSIDE`; for a UiMenu row pass a position such as `Vector2(20, 8 + 64 * i + 10)`.
- Tests: `godot/tests/test_<name>.gd` starts with `extends "res://tests/harness.gd"`; every method named `test_*` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`. Run one file with `sh tools/godot/gtest.sh test_<name>` (last line `GDTEST OK`).
- Test hygiene: get the tree with `var tree := Engine.get_main_loop() as SceneTree`; add a node with `tree.root.add_child(n)` when its `_ready` must run; at the end of each test `tree.root.remove_child(n)` (if added) and `n.free()`. Nodes made with `.new()` and never added can simply be `free()`d.
- /Users/leelangley/wt/webbwheresmycar/_dev/src/ui/scenes/auction.js (the hits in draw, pointer with pressedLot)
- godot/scenes/auction.gd (GDR06), godot/rooms/room_base.gd (GDR19: `_on_button_down`)

## Files you may change (and nothing else)
- `godot/scenes/auction.gd`
- `godot/tests/test_auction_actions.gd`

## Steps
1. Edit `godot/scenes/auction.gd`. In `_build_controls()` add: `add_button(&"bid1", R_BID1, "", "primary")`, `&"bid3"` with R_BID3 (primary), `&"leave"` with R_LEAVE and text "LEAVE & SETTLE" (primary); and four invisible tap rects `add_hotspot(&"reveal0", R_STAT_ROWS[0])` ... `&"reveal3"`. Add `var _pressed_lot := ""` and override `_on_button_down(_id)` to set `_pressed_lot = shown_lot_id` (RoomBase calls it when any button or hotspot is pressed).
2. `_refresh_buttons()` (override the empty virtual): with a current lot `bid1.text = "BID +1 " + CoreFormat.money(SimAuction.min_bid(lot))`, `bid3.text = "BID +3 " + money(SimAuction.min_bid(lot) + 2 * SimAuction.bid_step(lot))`, both visible and enabled; with no lots they are `visible = false`, `enabled = false`. `revealN.enabled` is true only when a lot exists and `view.revealed[SimAuction.STATS[N]]` is false. `leave` is always visible and enabled.
3. `_on_action(id)` (fallthrough of `_on_hotspot`): `func _act(action: String, params: Dictionary) -> Dictionary` calls `get_game().act(action, params)` (returns `{}` when the result is not a Dictionary), then `refresh()`. `bid1` / `bid3`: return without doing anything when `_pressed_lot != shown_lot_id` (the tap rule for lots); otherwise `var r := _act("place_bid", {"lotId": shown_lot_id, "steps": 1 or 3})` and, when `r.get("ok", false)` and the msg is not empty, emit `toast(msg)` (refusals are toasted by the Game). `reveal0..3`: same guard, `_act("reveal_stat", {"lotId": shown_lot_id, "stat": SimAuction.STATS[N]})`, toast the msg on success. `leave`: `var r := _act("attend_auction", {})`; if `r.get("ok", false)` emit `request_scene(&"office", {})`. Bids and reveals cost no day; attending costs the day (the Game advances and emits `day_advanced`).
4. `godot/tests/test_auction_actions.gd` (state prepared exactly as in GDR06's test: seeded, day 24, `SimAuction.prepare_auction`). `bid1.text == "BID +1 " + money(min_bid(lot))`, `bid3.text == "BID +3 " + money(min_bid(lot) + 2 * bid_step(lot))`. Tap bid1: `fake.acts.back() == {"action": "place_bid", "params": {"lotId": lot.lotId, "steps": 1}}`; with `fake.next_result = {"ok": true, "msg": "You lead."}` a room toast "You lead." is emitted; bid3 uses steps 3; with `{"ok": false, "msg": "Too low"}` the room emits no toast and `fake.toasts == ["Too low"]`. Lot guard: `TapUtil.press(bid1)`, then `room.step(1)`, then `TapUtil.release(bid1)` -> `fake.acts` did not grow. Reveal: tap `reveal0` -> `reveal_stat` with `{"lotId": ..., "stat": "desirability"}`, reveal1 "maintenance", reveal2 "reliability", reveal3 "condition"; after marking a stat revealed in the lot (`lot.revealed.desirability = true`) + `refresh()`, `reveal0.enabled == false` and a tap makes no call. Leave: default result ok -> `[&"office", {}]` requested and `acts.back().action == "attend_auction"`; with `{"ok": false, "msg": "Already been"}` no request and `fake.toasts == ["Already been"]`. No lots: bid buttons not visible, all reveals disabled. Free the node.

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
