[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDU28 Test helpers: TestFakeGame and channel_shot

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDU28
Needs (already merged into `dev`): GDF02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
`TestFakeGame` stands in for the `Game` autoload in channel and widget tests (same `state` shape, `act()`, signals), and `channel_shot.gd` is the generic script for channel screenshot scenes.

## Read first
- docs/GODOT.md (the plan: layout zones, the TV is the centre, tap rule, 64 px touch targets)
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` (it is a RefCounted, so there is NO scene and NO `await`); every `func test_*() -> void` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `tree()` (the SceneTree), `autoload(name)`. To test a node: `tree().root.add_child(n)` and finish the test with `n.free()`. Never wait for frames: every animated widget has `advance(dt)` (seconds) so a test steps time by hand. Mouse input is simulated by calling the widget's public `handle_event(ev)`; copy this helper into the test file: `func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:` creating `InputEventMouseButton.new()` with `button_index = MOUSE_BUTTON_LEFT`, `pressed = down`, `position = pos`
- godot/autoload/game.gd (GDF10: `act` returns `{ok, msg}`; on `ok == false` with a message it emits `toast_requested(msg)` itself; on success it emits `changed`)
- src/core/state.js and src/sim/newgame.js (the real state keys, camelCase like `garageSlots`)

## Files you may change (and nothing else)
- `godot/tests/fake_game.gd`
- `godot/tests/shots/channel_shot.gd`
- `godot/tests/test_fake_game.gd`

## Steps
1. `godot/tests/fake_game.gd`: `class_name TestFakeGame`, `extends RefCounted`. Signals `changed`, `toast_requested(text: String)`, `day_advanced`, `game_over`. Vars `state: Dictionary`, `acts: Array = []` (each `{"action": String, "params": Dictionary}`), `toasts: Array[String] = []`, `next_result: Dictionary = {"ok": true, "msg": "Done"}`. `_init()`: `state = TestFakeGame.sample_state()` and `toast_requested.connect(func(t: String): toasts.append(t))`. `func act(action: String, params: Dictionary = {}) -> Dictionary`: append to `acts`; `var r := next_result.duplicate(true)`; if `r.get("ok", false) == false and str(r.get("msg", "")) != ""` emit `toast_requested(r.msg)` (like the real Game); if `r.ok == true` emit `changed`; return `r`.
2. `static func sample_state() -> Dictionary` returns EXACTLY this data (keys camelCase like the real state): `day 12`, `cash 12345`, `reputation 40`, `buzz 10`, `garageSlots 3`, `nextId 20`, `market {"priceMult": 1}`; `cars`: two Dictionaries `{"id": "c1", "modelId": "t1_allergy", "owned": true, "owner": null, "rentMonthly": 0, "paid": 3500, "condition": 6.0, "fault": null, "lastServiceDay": 1, "jobsDone": 0, "boughtDay": 1, "impoundedUntil": 0, "rentedAtCondition": null}` and `{"id": "c2", "modelId": "t1_robbin", ... "condition": 9.0, "fault": {"faultId": "puncture", "label": "Flat tyre", "cost": 80, "severity": "minor"} ...}` (same keys as c1 otherwise); `shop`: `{"listings": [...], "refreshedDay": 10}` with three listings `{"listingId": "L1", "modelId": "t1_chimp", "mode": "sale", "price": 4000, "condition": 7.0, "owner": null}`, `{"listingId": "L2", "modelId": "t1_maurice", "mode": "rent", "price": 240, "condition": 5.5, "owner": "Old Mrs Pym"}`, `{"listingId": "L3", "modelId": "t1_cooker", "mode": "sale", "price": 5200, "condition": 8.0, "owner": null}`; `requests`: `{"id": "Q1", "jobTypeId": "wedding", "customer": "Mrs Pym", "fee": 900, "minDesirability": 3, "minReliability": 3, "minCondition": 6, "expiresDay": 14, "blurb": "Mrs Pym needs something posh."}` and `{"id": "Q2", "jobTypeId": "wedding", "customer": "Mr Trent", "fee": 700, "minDesirability": 9, "minReliability": 3, "minCondition": 6, "expiresDay": 13, "blurb": "Mr Trent wants a grand arrival."}`; `stats {"jobsDone": 2, "jobsFailed": 1, "adsRun": 3, "carsBought": 1, "carsSold": 0, "bestAuctionSale": 0, "faults": 1}`; `plates {"fatcat": false, "stable": false, "household": false, "hammer": false}`; `headlines ["Local vicar buys round of tea", "Pigeon wins raffle"]`; `today {"day": 12, "headline": "Local vicar buys round of tea", "events": ["Bought nothing. Lovely.", "Dave found a spanner."], "monthReport": null}`; `flags {"gameOver": false, "won": false, "reason": ""}`; `auction {"month": 1, "lots": [], "consigned": [], "lastResults": []}`; `pending []`; `sit []`; `log []`. Use `null` for JSON null.
3. `godot/tests/shots/channel_shot.gd`: `extends Control`. `var _game: TestFakeGame`. `_ready()`: add a full-rect `ColorRect` colour `Color("#14102A")` as first child; `_game = TestFakeGame.new()`; `var ps := load(str(get_meta("channel"))) as PackedScene`; `var ch := ps.instantiate()`; `ch.position = Vector2(320, 136)`; `add_child(ch)`; `ch.enter(_game)`; then for each entry `c` of `get_meta("calls", [])` (an Array of `[method_name, args_array]`): `ch.callv(c[0], c[1])`. (`size = Vector2(1280, 720)` at the top.) The channel cards each add a tiny scene that sets the meta `channel` (and optionally `calls`).
4. `godot/tests/test_fake_game.gd`: `test_sample_state`: `var g := TestFakeGame.new()`; `g.state.cash == 12345`, `g.state.day == 12`, `g.state.cars.size() == 2`, `g.state.cars[1].fault.label == "Flat tyre"`, `g.state.cars[0].fault == null`, `g.state.shop.listings.size() == 3`, `g.state.shop.listings[1].mode == "rent"`, `g.state.requests.size() == 2`, `g.state.today.monthReport == null`, `g.state.plates.fatcat == false`; every model id used exists: `Data.car_by_id(id) != {}` for t1_allergy, t1_robbin, t1_chimp, t1_maurice, t1_cooker, and `Data.job_type_by_id("wedding") != {}`. `test_act_records`: `g.act("buy_car", {"listing_id": "L1"})` returns `{"ok": true, "msg": "Done"}`; `g.acts == [{"action": "buy_car", "params": {"listing_id": "L1"}}]`; a collected `changed` count is 1. `test_act_failure`: `g.next_result = {"ok": false, "msg": "No way"}`; `act("x")` returns it; `g.toasts == ["No way"]`; `changed` count stays 0. `test_independent`: two `TestFakeGame` instances do not share `state` (change cash in one).

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_fake_game` last line is `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDU28: Test helpers: TestFakeGame and channel_shot`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
