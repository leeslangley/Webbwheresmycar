[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDU16 Channel LEDGER: books, plates and sales chart

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDU16
Needs (already merged into `dev`): GDU12, GDU29, GDU31, GDF03, GDF07
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The LEDGER channel (port of the ledger tab of src/ui/scenes/ledger.js): the books (cash, net worth, stable value, expected next bills, reputation, buzz, stats), progress towards the four Gold Number Plates and the small sales chart. DISPLAY only: the figures are computed here from `state` + `Data` by a small pure class `LedgerMath` (copies of the JS formulas; the real rules stay in the sim).

## Read first
- docs/GODOT.md (the plan: layout zones, the TV is the centre, tap rule, 64 px touch targets)
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` (it is a RefCounted, so there is NO scene and NO `await`); every `func test_*() -> void` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `tree()` (the SceneTree), `autoload(name)`. To test a node: `tree().root.add_child(n)` and finish the test with `n.free()`. Never wait for frames: every animated widget has `advance(dt)` (seconds) so a test steps time by hand. Mouse input is simulated by calling the widget's public `handle_event(ev)`; copy this helper into the test file: `func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:` creating `InputEventMouseButton.new()` with `button_index = MOUSE_BUTTON_LEFT`, `pressed = down`, `position = pos`
- godot/tv/channel_base.gd (GDU12: `ChannelBase`, the channel contract, `_paint()`, `refresh()`, `toast()`, `model_of()`, `paint_of()`)
- godot/ui/ui_text.gd (GDU31: `UiText.wrap(text, max_chars, max_lines) -> Array[String]`, `ellipsize(text, max_chars)`, `pips(n)`)
- godot/ui/ui_theme.gd (GDU01: `UiTheme.color(name)`, `font_for(role)`, `size_for(role)`, `draw_box`, `draw_text`, `draw_bar`, `TOUCH`)
- godot/tests/fake_game.gd (GDU28: `TestFakeGame`, a stand-in for Game with `state`, `act()`, `acts`, `toasts`, `next_result`, signals `changed`, `toast_requested`)
- Channel screens are 640x448 (the SubViewport inside the TV) and are shown at 600x420 on the glass (scale 0.9375), so every interactive control inside a channel is at least 72x72 channel px (72 * 0.9375 = 67.5 stage px, above the 64 px rule).
- src/ui/scenes/ledger.js (read drawLedger, plateProgress, expectedBills, stableValue)
- src/sim/carstats.js (marketValue, valueFactor, runningCost, maintMult) and src/sim/endgame.js (PLATE_INFO, netWorth)
- godot/ui/sales_chart.gd and cash_history.gd (GDU29)
- godot/core/format.gd (GDF07)

## Files you may change (and nothing else)
- `godot/tv/ledger_math.gd`
- `godot/tv/ledger_channel.gd`
- `godot/tv/ledger_channel.tscn`
- `godot/tests/shots/ledger_shot.tscn`
- `godot/tests/test_ledger_channel.gd`

## Steps
1. `godot/tv/ledger_math.gd`: `class_name LedgerMath`, `extends RefCounted`, static. `const PLATE_KEYS: Array[String] = ["fatcat", "stable", "household", "hammer"]`, `const PLATE_NAMES := {"fatcat": "Fat Cat", "stable": "Stable Boy", "household": "Household Name", "hammer": "Hammer Time"}`, `const LEASE := 400`. `static func value_factor(condition: float) -> float: return 0.5 + 0.05 * condition`. `static func maint_mult(condition: float) -> float: return 1.0 + (10.0 - condition) * 0.08`. `static func market_value(st: Dictionary, model: Dictionary, car: Dictionary) -> int: return int(floor(float(model.basePrice) * value_factor(float(car.condition)) * float(st.market.priceMult) + 0.5))`. `static func running_cost(model: Dictionary, car: Dictionary) -> int: return int(floor(float(model.maintenance) * (60.0 + float(model.basePrice) * 0.0025) * maint_mult(float(car.condition)) + 0.5))`. `static func stable_value(st: Dictionary, models: Dictionary) -> int`: sum of `market_value` for cars with `owned == true` whose `modelId` is in `models` (unknown models count 0). `static func net_worth(st, models) -> int: return int(floor(float(st.cash) + 0.5)) + stable_value(st, models)`. `static func expected_bills(st, models) -> int`: `LEASE` + `running_cost` of each owned car with a known model + `int(car.rentMonthly)` of each rented car (`owned == false`). `static func owned_count(st) -> int`.
2. `static func plate_progress(st: Dictionary, key: String, models: Dictionary) -> String`: `"WON"` when `st.plates.get(key, false) == true`; otherwise `fatcat`: `CoreFormat.money(net_worth(st, models)) + "/" + CoreFormat.money(100000)`; `stable`: `"%d/6 cars" % owned_count(st)`; `household`: `"%d/85" % int(st.reputation)`; `hammer`: `"best " + CoreFormat.money(st.stats.bestAuctionSale) + "/" + CoreFormat.money(100000)`. `static func stat_lines(st: Dictionary) -> Array[String]`: `"Jobs done %d / failed %d"`, `"Adverts run %d"`, `"Cars bought %d / sold %d"`, `"Best sale " + CoreFormat.money(bestAuctionSale) + "  Faults %d"` from `st.stats`.
3. `godot/tv/ledger_channel.tscn` (text scene, exactly: `[gd_scene load_steps=2 format=3]`, blank line, `[ext_resource type="Script" path="res://tv/ledger_channel.gd" id="1"]`, blank line, `[node name="LedgerChannel" type="Control"]`, then `script = ExtResource("1")`)
4. `godot/tv/ledger_channel.gd`: `class_name LedgerChannel`, `extends ChannelBase`. `_init`: `super()`; `title = "LEDGER"`. `_ready()` creates `Chart` (`UiSalesChart`, `position = Vector2(336, 256)`, `size = Vector2(296, 112)`). `func refresh() -> void`: `Chart.set_values(UiCashHistory.values(14))`; `queue_redraw()`. (`UiCashHistory` is fed by the HUD; this channel only reads it. If it holds fewer than 2 points, record the current one: `UiCashHistory.record(int(state().get("day", 1)), float(state().get("cash", 0)))` first.) `func _paint()` (use `var st := state()`, `var models := ChannelBase.models_by_id()`): book panel `UiTheme.draw_box(self, Rect2(8, 48, 320, 320), paper, ink, 4, false)`; heading "THE BOOKS" (role "h3", ink) at (24, 56); six rows at x 24, y = 84 + k * 26 (role "caption", colour "ink"): `"Cash " + CoreFormat.money(st.cash)`, `"Net worth " + CoreFormat.money(LedgerMath.net_worth(st, models))`, `"Stable value " + CoreFormat.money(LedgerMath.stable_value(st, models))`, `"Next bills " + CoreFormat.money(LedgerMath.expected_bills(st, models))`, `"Reputation %d/100" % int(st.reputation)`, `"Buzz %d" % int(st.buzz)`; "STATS" (role "h3") at (24, 248) and the four `stat_lines` at y = 272 + k * 22 (role "caption", colour "darkgrey").
5. Plates panel in `_paint()`: `UiTheme.draw_box(self, Rect2(336, 48, 296, 204), paper, ink, 4, false)`; heading "GOLD NUMBER PLATES" (role "caption", colour "woodDark") at (348, 52). For `k` in 0..3 with `key = LedgerMath.PLATE_KEYS[k]` and `y = 78 + k * 42`: the plate name `LedgerMath.PLATE_NAMES[key]` (role "caption"; colour "gold" when won else "ink") at (348, y), `"WON"` right-aligned at the panel's right edge (only when won, colour "gold"), and the progress string `LedgerMath.plate_progress(st, key, models)` (role "caption", colour "darkgrey", ellipsized to 27) at (348, y + 20).
6. `godot/tests/shots/ledger_shot.tscn` (text scene, exactly: `[gd_scene load_steps=2 format=3]`, blank line, `[ext_resource type="Script" path="res://tests/shots/channel_shot.gd" id="1"]`, blank line, `[node name="Shot" type="Control"]`, then the lines `layout_mode = 3`, `anchors_preset = 15`, `anchor_right = 1.0`, `anchor_bottom = 1.0`, `script = ExtResource("1")`, `metadata/channel = "res://tv/ledger_channel.tscn"`)
7. `godot/tests/test_ledger_channel.gd`: `test_math` with an explicit tiny model table `models = {"m": {"basePrice": 4000, "maintenance": 2}}` and a state `st = {"cash": 1000, "market": {"priceMult": 1}, "reputation": 60, "plates": {"fatcat": false, "stable": false, "household": false, "hammer": true}, "stats": {"jobsDone": 2, "jobsFailed": 1, "adsRun": 3, "carsBought": 1, "carsSold": 0, "bestAuctionSale": 5000, "faults": 1}, "cars": [{"modelId": "m", "owned": true, "condition": 10.0, "rentMonthly": 0}, {"modelId": "m", "owned": false, "condition": 5.0, "rentMonthly": 200}, {"modelId": "unknown", "owned": true, "condition": 10.0, "rentMonthly": 0}]}`: `value_factor(10.0)` near 1.0; `maint_mult(10.0)` near 1.0; `market_value(st, models.m, st.cars[0]) == 4000`; `running_cost(models.m, st.cars[0]) == 140` (2 * (60 + 10) * 1); `stable_value(st, models) == 4000` (the unknown model and the rental count 0); `net_worth(st, models) == 5000`; `expected_bills(st, models) == 740` (400 + 140 + 200); `owned_count(st) == 2`. `test_plate_progress`: `"stable"` -> `"2/6 cars"`; `"household"` -> `"60/85"`; `"fatcat"` -> `CoreFormat.money(5000) + "/" + CoreFormat.money(100000)`; `"hammer"` -> `"WON"`; with `plates.hammer = false`: `"best " + CoreFormat.money(5000) + "/" + CoreFormat.money(100000)`. `test_stat_lines`: the four lines `["Jobs done 2 / failed 1", "Adverts run 3", "Cars bought 1 / sold 0", "Best sale " + CoreFormat.money(5000) + "  Faults 1"]`. `test_sample_state_with_real_data`: `LedgerMath.net_worth(TestFakeGame.sample_state(), ChannelBase.models_by_id())` equals `12345 + market_value` of the two sample cars (compute both with `LedgerMath.market_value` and `ChannelBase.model_of`) and is greater than 12345. Scene tests (instantiate `res://tv/ledger_channel.tscn`, add to the tree, `UiCashHistory.reset()`, `enter(TestFakeGame)`): `test_enter`: `title == "LEDGER"`; `Chart` exists, `Chart.values.size() >= 1`; after `UiCashHistory.record(13, 20000.0)` and `g.changed.emit()` the chart has 2 values. Reset the history at the end of each scene test and free the node.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_ledger_channel` last line is `GDTEST OK`.
- Screenshot step: run `sh tools/godot/gshot.sh tests/shots/ledger_shot.tscn /tmp/ledger.png 8`, then LOOK at /tmp/ledger.png with the Read tool and describe in your final reply what you see (is the text readable, does anything overlap or run off the 640x448 screen, are the buttons visible). Fix what is wrong.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- The workshop tab and BUY SLOT (GDU24).

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDU16: Channel LEDGER: books, plates and sales chart`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
