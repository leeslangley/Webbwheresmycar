[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDR24 OfficeChat: Dave's line of the day and Mark's mood

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDR24
Needs (already merged into `dev`): GDF02, GDF03, GDF05, GDF06, GDU28
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Pure helper that picks Dave's one chatter line per day from the office situation and Mark's mood from the cash, exactly as src/ui/scenes/office.js did, without touching the game's own rng.

## Read first
- docs/GODOT.md (plan, TV-centred layout, tap rule, determinism) and docs/GODOT_PLANNER_BRIEF.md section SHARED CONTRACTS (Game, Data, Sim*, Core*, tests, tools)
- Tests: `godot/tests/test_<name>.gd` starts with `extends "res://tests/harness.gd"`; every method named `test_*` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`. Run one file with `sh tools/godot/gtest.sh test_<name>` (last line `GDTEST OK`).
- Test double for the Game autoload: `TestFakeGame.new()` (godot/tests/fake_game.gd, GDU28). Its `state` is the sample state: day 12, cash 12345, reputation 40, garageSlots 3, cars `c1` (modelId t1_allergy, owned, condition 6.0, fault null) and `c2` (t1_robbin, owned, condition 9.0, fault `{faultId: 'puncture', label: 'Flat tyre', cost: 80, severity: 'minor'}`, rentMonthly 0, rentedAtCondition null), 3 shop listings, 2 requests, stats.jobsDone 2, plates all false, auction `{month 1, lots [], consigned [], lastResults []}`, flags `{gameOver false, won false, reason ''}`. `act(action, params)` appends `{action, params}` to `acts`, returns a copy of `next_result` (default `{ok: true, msg: 'Done'}`), emits `changed` when ok is true and `toast_requested(msg)` when ok is false with a message; `toasts` collects the toast texts; signals `changed`, `toast_requested`, `day_advanced`, `game_over`. A room gets it with `room.game = TestFakeGame.new()` BEFORE it is added to the tree.
- /Users/leelangley/wt/webbwheresmycar/_dev/src/ui/scenes/office.js (functions daveSit, daveLine, ownedCount and the mood line)
- /Users/leelangley/wt/webbwheresmycar/_dev/src/data/chatter.js (keys idle, broke, rich, newmonth, auctionday, breakdown, fullgarage, emptygarage)
- godot/core/clock.gd (CoreClock: is_month_start, is_auction_day, both return false for an invalid day) and godot/core/rng.gd (CoreRng.pick(state, array))

## Files you may change (and nothing else)
- `godot/rooms/office_chat.gd`
- `godot/tests/test_office_chat.gd`

## Steps
1. `godot/rooms/office_chat.gd`: `class_name OfficeChat`, `extends RefCounted`, all `static`. `owned_count(state: Dictionary) -> int` counts cars with `owned == true`. `sit_for(state: Dictionary) -> String`, the FIRST tag that applies: cash < 1000 -> "broke"; cash > 50000 -> "rich"; the last entry of `state.today.events` (if any, as a String) contains "broke down" -> "breakdown"; `CoreClock.is_month_start(day)` -> "newmonth"; `CoreClock.is_auction_day(day)` -> "auctionday"; `owned_count >= state.garageSlots` -> "fullgarage"; `owned_count == 0` -> "emptygarage"; else "idle".
2. `line_for(state: Dictionary) -> String`: `var table: Dictionary = Data.chatter()`; `var lines: Array = table.get(sit_for(state), table["idle"])`; return `String(CoreRng.pick({"rng": int(state.day) * 7919 + 13}, lines))`. The throwaway dictionary is the point: `state.rng` must not change. `mood_for(state: Dictionary) -> String`: cash > 30000 -> "happy"; cash < 1500 -> "worried"; else "normal".
3. `godot/tests/test_office_chat.gd` (state from `TestFakeGame.sample_state()`, then edit; its cars are both owned: set `cars[1].owned = true` explicitly): `owned_count == 2`; day 12 (the sample) -> sit_for == "idle"; day 1 -> "newmonth"; day 24 -> "auctionday"; day 32 -> "newmonth"; cash 500 on day 24 -> "broke" (priority); cash 60000 -> "rich"; `today.events = ["The van broke down"]` on day 12 -> "breakdown"; `garageSlots = 2` on day 12 -> "fullgarage"; both cars `owned = false` on day 12 -> "emptygarage". `mood_for`: 31000 happy, 30000 normal, 5000 normal, 1500 normal, 1499 worried. `line_for`: the result is a non-empty String contained in `Data.chatter()[sit_for(state)]`; calling it twice gives the same line; `state` has no `rng` key before and after (the call does not add or change one); a state with `rng = 77` keeps `rng == 77`. Do not require different days to give different lines.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_office_chat` ends with `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDR24: OfficeChat: Dave's line of the day and Mark's mood`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
