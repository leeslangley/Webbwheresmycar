[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDR26 GarageCosts: treatment prices, dealer price, fees

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDR26
Needs (already merged into `dev`): GDF02, GDF03, GDF05, GDS03
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Pure functions with the exact garage money rules from src/ui/scenes/garage.js (tinker, service, restore prices, the dealer's 60 percent, the rental damage fee, the auction reserve) so the garage UI and the sim agree. Also the model lookup used by the garage. Needs SimCarStats (src/sim/carstats.js, GDS03) for `market_value`, and CoreRng.round_to.

## Read first
- docs/GODOT.md (plan, TV-centred layout, tap rule, determinism) and docs/GODOT_PLANNER_BRIEF.md section SHARED CONTRACTS (Game, Data, Sim*, Core*, tests, tools)
- Tests: `godot/tests/test_<name>.gd` starts with `extends "res://tests/harness.gd"`; every method named `test_*` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`. Run one file with `sh tools/godot/gtest.sh test_<name>` (last line `GDTEST OK`).
- Test double for the Game autoload: `TestFakeGame.new()` (godot/tests/fake_game.gd, GDU28). Its `state` is the sample state: day 12, cash 12345, reputation 40, garageSlots 3, cars `c1` (modelId t1_allergy, owned, condition 6.0, fault null) and `c2` (t1_robbin, owned, condition 9.0, fault `{faultId: 'puncture', label: 'Flat tyre', cost: 80, severity: 'minor'}`, rentMonthly 0, rentedAtCondition null), 3 shop listings, 2 requests, stats.jobsDone 2, plates all false, auction `{month 1, lots [], consigned [], lastResults []}`, flags `{gameOver false, won false, reason ''}`. `act(action, params)` appends `{action, params}` to `acts`, returns a copy of `next_result` (default `{ok: true, msg: 'Done'}`), emits `changed` when ok is true and `toast_requested(msg)` when ok is false with a message; `toasts` collects the toast texts; signals `changed`, `toast_requested`, `day_advanced`, `game_over`. A room gets it with `room.game = TestFakeGame.new()` BEFORE it is added to the tree.
- /Users/leelangley/wt/webbwheresmycar/_dev/src/ui/scenes/garage.js (tinkerCost, serviceCost, restoreCost, dealerPrice, damageFee, isConsigned and the consign reserve)
- /Users/leelangley/wt/webbwheresmycar/_dev/src/sim/carstats.js (marketValue)
- /Users/leelangley/wt/webbwheresmycar/_dev/src/core/rng.js (roundTo)

## Files you may change (and nothing else)
- `godot/rooms/garage_costs.gd`
- `godot/tests/test_garage_costs.gd`

## Steps
1. `godot/rooms/garage_costs.gd`: `class_name GarageCosts`, `extends RefCounted`, all `static`. `model_of(model_id: String) -> Dictionary` = `Data.car_by_id(model_id)` (`{}` when unknown). `tinker_cost(model: Dictionary) -> int` = `roundi(40.0 + float(model.basePrice) * 0.002)`. `service_cost(model)` = `roundi(150.0 + float(model.basePrice) * 0.008)`. `restore_cost(model)` = `maxi(1200, roundi(float(model.basePrice) * 0.06))`.
2. `dealer_price(state: Dictionary, model: Dictionary, car: Dictionary) -> float` = `CoreRng.round_to(SimCarStats.market_value(state, model, car) * 0.6, 10)`. `consign_reserve(state, model, car) -> float` = `CoreRng.round_to(SimCarStats.market_value(state, model, car) * 0.7, 10)`. `damage_fee(model: Dictionary, car: Dictionary) -> int` = `roundi(maxf(0.0, float(car.rentedAtCondition) - float(car.condition)) * 0.02 * float(model.basePrice))` (treat a `null` rentedAtCondition as 0). `is_consigned(state: Dictionary, car_id: String) -> bool`: true when some entry of `state.auction.consigned` has `carId == car_id`.
3. `godot/tests/test_garage_costs.gd`: with `{"basePrice": 3500}`: tinker 47, service 178, restore 1200. With `{"basePrice": 45000}`: tinker 130, service 510, restore 2700. With `{"basePrice": 4500}`: tinker 49, service 186. `damage_fee({"basePrice": 4500}, {"rentedAtCondition": 7.0, "condition": 6.0})` is 90; condition 6.5 gives 45; condition 8.0 gives 0; `rentedAtCondition` null gives 0. `is_consigned` with `{"auction": {"consigned": [{"carId": "c1", "reserve": 100}]}}` is true for "c1", false for "c2". `model_of("t1_allergy").name == "Austen Allergy"` and `model_of("nope")` is empty. With `TestFakeGame.sample_state()`, the model `model_of("t1_allergy")` and car 1: `dealer_price == CoreRng.round_to(SimCarStats.market_value(state, model, car) * 0.6, 10)`, `consign_reserve` the same with 0.7, and `dealer_price < consign_reserve`.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_garage_costs` ends with `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDR26: GarageCosts: treatment prices, dealer price, fees`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
