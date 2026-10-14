[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDR32 FakeGame: test double for the Game autoload

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDR32
Needs (already merged into `dev`): GDF02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
A stand-in for the `Game` autoload so every room, flow and helper test can run without the real sim: same surface (`state`, `act`, the four signals), records the calls, returns a configurable result, and builds a sample state with the exact key set of src/core/state.js plus two cars.

## Read first
- docs/GODOT.md (plan, TV-centred layout, tap rule, determinism) and docs/GODOT_PLANNER_BRIEF.md section SHARED CONTRACTS (Game, Data, Sim*, Core*, tests, tools)
- Tests: `godot/tests/test_<name>.gd` starts with `extends "res://tests/harness.gd"`; every method named `test_*` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`. Run one file with `sh tools/godot/gtest.sh test_<name>` (last line `GDTEST OK`).
- /Users/leelangley/wt/webbwheresmycar/_dev/src/core/state.js (newGameState: the key set)

## Files you may change (and nothing else)
- `godot/tests/fake_game.gd`
- `godot/tests/test_fake_game.gd`

## Steps
1. `godot/tests/fake_game.gd`: `class_name FakeGame`, `extends RefCounted`. Signals `changed`, `toast_requested(text: String)`, `day_advanced`, `game_over`. `var state: Dictionary = FakeGame.sample_state()`, `var calls: Array = []`, `var result: Dictionary = {"ok": true, "msg": ""}`. `func act(action: String, params: Dictionary = {}) -> Dictionary`: append `[action, params]` to `calls`, return `result`. `func last_action() -> String` (action of the last call, "" if none). `static func sample_state() -> Dictionary` returns exactly: `{"v": 1, "seed": 1, "rng": 1, "day": 1, "cash": 20000, "reputation": 40, "buzz": 0, "garageSlots": 3, "nextId": 3, "market": {"priceMult": 1.0}, "cars": [car1, car2], "shop": {"listings": [], "refreshedDay": 1}, "requests": [], "auction": {"month": 1, "lots": [], "consigned": [], "lastResults": [], "attendedDay": 0}, "stats": {"jobsDone": 0, "jobsFailed": 0, "adsRun": 0, "carsBought": 0, "carsSold": 0, "bestAuctionSale": 0, "faults": 0}, "plates": {"fatcat": false, "stable": false, "household": false, "hammer": false}, "headlines": [], "pending": [], "sit": [], "today": {"day": 1, "headline": "", "events": [], "monthReport": null}, "lastMonthReport": null, "flags": {"gameOver": false, "won": false, "reason": ""}, "log": []}` with `car1 = {"id": "c1", "modelId": "t1_allergy", "owned": true, "condition": 5.0, "fault": null, "impoundedUntil": 0, "rentedAtCondition": 0.0, "rentMonthly": 0}` and `car2 = {"id": "c2", "modelId": "t1_robbin", "owned": false, "condition": 6.0, "fault": {"label": "Dodgy clutch", "cost": 300}, "impoundedUntil": 0, "rentedAtCondition": 7.0, "rentMonthly": 260}`.
2. `godot/tests/test_fake_game.gd`: `act("advance")` returns the default result `{"ok": true, "msg": ""}`, `calls == [["advance", {}]]`, `last_action() == "advance"`; a fresh `FakeGame.new().last_action() == ""`; setting `result = {"ok": false, "msg": "No"}` makes `act("x", {"a": 1})` return it and `calls.back() == ["x", {"a": 1}]`. `sample_state()`: `cars.size() == 2`, `typeof(cash) == TYPE_INT`, `typeof(cars[0].condition) == TYPE_FLOAT`, `cars[0].fault == null`, `cars[1].fault.cost == 300`, `flags.gameOver == false`, `garageSlots == 3`; two calls give independent copies (mutating one `cars[0].condition` leaves the other at 5.0); every key of src/core/state.js newGameState exists (`v, seed, rng, day, cash, reputation, buzz, garageSlots, nextId, market, cars, shop, requests, auction, stats, plates, headlines, pending, sit, today, lastMonthReport, flags, log`). The signals exist: `FakeGame.new().has_signal("day_advanced")` etc. for changed, toast_requested, day_advanced, game_over.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_fake_game` ends with `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDR32: FakeGame: test double for the Game autoload`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
