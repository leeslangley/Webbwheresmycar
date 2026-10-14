[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDR08 Endgame scene: heading, score block, plates, play again

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDR08
Needs (already merged into `dev`): GDR19, GDR25, GDF05
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The end-of-game screen (port of src/ui/scenes/endgame.js): a cream board with the heading for how the year ended, its subline, the score block (final score, rank, net worth, reputation, jobs done), the four Gold Number Plates (WON in gold / missed in grey), the best auction sale, confetti for a win or a drifting cloud for bankruptcy, and PLAY AGAIN / TITLE buttons. Needs the sim port SimEndgame (final_score, rank_of, net_worth, PLATE_INFO) and CoreState.PLATE_KEYS.

## Read first
- docs/GODOT.md (plan, TV-centred layout, tap rule, determinism) and docs/GODOT_PLANNER_BRIEF.md section SHARED CONTRACTS (Game, Data, Sim*, Core*, tests, tools)
- godot/rooms/room_base.gd (GDR19, class `RoomBase extends Control`): `LAYER_NAMES`, `build_layers()`, `layer(name)`, `placeholder(name)`, `set_plate(layer, tex, pos)`, `add_hotspot(id, rect)`, `hotspots`, `game` + `get_game()`, signals `request_scene(scene_id: StringName, params: Dictionary)`, `chatter(text)`, `toast(text)`, statics `add_box`, `add_panel`, `add_label`, `pixel_font`. Rooms are built IN CODE in `_ready` (the .tscn is only a root Control with the script), so every node name in a card is an exact contract for the art cards (GDA) and the tests.
- Tests: `godot/tests/test_<name>.gd` starts with `extends "res://tests/harness.gd"`; every method named `test_*` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`. Run one file with `sh tools/godot/gtest.sh test_<name>` (last line `GDTEST OK`).
- Test hygiene: get the tree with `var tree := Engine.get_main_loop() as SceneTree`; add a node with `tree.root.add_child(n)` when its `_ready` must run; at the end of each test `tree.root.remove_child(n)` (if added) and `n.free()`. Nodes made with `.new()` and never added can simply be `free()`d.
- godot/tests/fake_game.gd (GDR19): `FakeGame.new()` is a stand-in for the Game autoload with the same surface: `state` (Dictionary, JS key names such as day, cash, cars[].modelId), `act(action, params) -> Dictionary` (records `[action, params]` in `calls` and returns `result`, default `{"ok": true, "msg": ""}`), and signals `changed`, `toast_requested(text)`, `day_advanced`, `game_over`. A room gets it with `room.game = FakeGame.new()` BEFORE it is added to the tree.
- /Users/leelangley/wt/webbwheresmycar/_dev/src/ui/scenes/endgame.js (the whole file)
- /Users/leelangley/wt/webbwheresmycar/_dev/src/sim/endgame.js (PLATE_INFO, finalScore, rankOf, netWorth)

## Files you may change (and nothing else)
- `godot/scenes/endgame.tscn`
- `godot/scenes/endgame.gd`
- `godot/tests/test_endgame_scene.gd`

## Steps
1. `godot/scenes/endgame.gd`: `class_name EndgameRoom`, `extends RoomBase`. `signal play_again`, `signal to_title`. Constants `R_BOARD := Rect2(80, 30, 1120, 660)`, `R_SCORE := Rect2(140, 200, 520, 380)`, `R_PLATES := Rect2(680, 200, 460, 380)`, `R_SKY := Rect2(100, 50, 1080, 140)`, `R_AGAIN := Rect2(340, 610, 280, 64)`, `R_TITLE := Rect2(660, 610, 280, 64)`, `ROW_H := 56`. `var _t := 0.0`. `endgame.tscn` = one `Control` named `Endgame` with the script (write by hand).
2. Statics (pure, tested): `static func heading_for(flags: Dictionary) -> String`: reason "won" -> `GOLD! MARK'S A LEGEND`, "year-end" -> `THE YEAR IS UP`, "bankrupt" -> `BANKRUPT! THE BAILIFFS ARRIVE`, anything else -> `GAME OVER`. `static func subline_for(flags)`: won -> `All four Gold Number Plates in one year. Mark buys a round.`, year-end -> `The bank manager is smiling politely.`, bankrupt -> `Dave takes the kettle. Mark takes the bus.`, else `The year at Webb's Wheels is done.`. `static func score_lines(state: Dictionary, won: bool) -> Array`: `["Final score " + str(score), "Rank: " + ("GOLD " if won else "") + SimEndgame.rank_of(score), "Net worth " + CoreFormat.money(SimEndgame.net_worth(state)), "Reputation " + str(state.reputation), "Jobs done " + str(state.stats.jobsDone)]` with `score = SimEndgame.final_score(state)`.
3. `_ready()`: `build_layers()`; `strip_color = Color("14102A")`; BACKGROUND placeholder box `Backdrop` Rect2(0,0,1280,720) `#14102A`. UI (in this order, names exact): `Board` panel = R_BOARD (paper fill); a plain `Control` named `Confetti` with 36 boxes `Confetti0`..`Confetti35` (10x16, colours cycling `[Color("E8B923"), Color("D9483B"), Color("70A4B2"), Color("9AD284"), Color("6F3D86")]`); a `Node2D` `Cloud` with three `Polygon2D` circles (radii 34, 26, 30 at x offsets 0, 44, 84 and y offsets 0, -16, 4; colour `#959595`) and a base box 140x12 `#6C6C6C`; labels `Heading` (centred, Rect2 x 100 width 1080, y 70, title 34), `Subline` (centred, y 140, body 28, ink), `ScorePanel` and `PlatesPanel` panels (R_SCORE, R_PLATES, paper fill), `Score0`..`Score4` labels (x 164, y 236 + i * 56, body 30, ink, width 470), `PlatesTitle` (x 704, y 220, title 18, text GOLD NUMBER PLATES), `PlateName0`..`PlateName3` (x 704, y 262 + i * 56, body 28, width 270) and `PlateState0`..`PlateState3` (right-aligned in x 944..1116, same y, title 18 when WON (gold `#E8B923`) else body 26 `#959595`), `BestSale` (x 704, y 498, body 28, width 420). Buttons `RoomButton.add_to`: `&"again"` R_AGAIN "PLAY AGAIN" primary; `&"title"` R_TITLE "TITLE".
4. `enter(_params)` and `refresh()`: from `get_game().state`: `flags = state.flags`, `won = flags.get("won", false) == true`. Heading/Subline from the statics (heading colour gold `#E8B923` when won else ink); Score0..4 from `score_lines`; plates: for `CoreState.PLATE_KEYS[i]` the name is `SimEndgame.PLATE_INFO[key].name` and the state text is "WON" or "missed" from `state.plates[key]`; `BestSale.text = "Best auction sale " + CoreFormat.money(state.stats.bestAuctionSale)`. `Confetti.visible = won`; `Cloud.visible = (flags.reason == "bankrupt")`. `apply_time(t)` (public; `_process` feeds it): confetti `i` at `x = R_SKY.position.x + round((i % 6) * (R_SKY.size.x / 6.0)) + (((i / 6) * 11) % 24)` (integer division) and `y = R_SKY.position.y + fposmod(i * 41.0 + t * 160.0, R_SKY.size.y)`; the cloud at `x = R_BOARD.position.x - 130.0 + fposmod(t * 46.0, R_BOARD.size.x + 240.0)`, `y = R_BOARD.position.y + 120.0`. `_on_hotspot`: again -> emit `play_again`, title -> emit `to_title`. `handle_key`: KEY_ENTER emits `play_again` (true), anything else false.
5. `godot/tests/test_endgame_scene.gd`: statics: `heading_for({"reason": "won"}) == "GOLD! MARK'S A LEGEND"`, year-end, bankrupt and `heading_for({})` == "GAME OVER"; `subline_for({})` == "The year at Webb's Wheels is done."; `score_lines` on `FakeGame.sample_state()` has 5 entries, `[0] == "Final score " + str(SimEndgame.final_score(state))`, `[1]` starts with "Rank: GOLD " when won is true and "Rank: " otherwise, `[4] == "Jobs done 0"`. Scene (FakeGame, `flags = {"gameOver": true, "won": true, "reason": "won"}`, plates fatcat true): Heading text is the won heading; `PlateState0.text == "WON"`, `PlateState1.text == "missed"`; `PlateName0.text == SimEndgame.PLATE_INFO["fatcat"].name`; `Confetti.visible` true, `Cloud.visible` false; with reason "bankrupt" / won false after `refresh()`: confetti hidden, cloud visible. `apply_time(0.0)`: `Confetti0.position == Vector2(100, 50)`, `Confetti7.position.x == 100 + round(1 * 180) + 11` (180 = 1080 / 6) and y near `50 + fposmod(287.0, 140.0)`. Taps emit `play_again` / `to_title`; `handle_key(KEY_ENTER)` emits `play_again`. Buttons >= 64 tall, non-intersecting. Free the node.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_endgame_scene` ends with `GDTEST OK`.
- Screenshot step: run `sh tools/godot/gshot.sh scenes/endgame.tscn /tmp/gdr08_endgame.png 8`, then LOOK at the PNG with the Read tool and describe it in your final reply (what is where, anything overlapping, anything off screen). If the screenshot step fails because the card it needs is not merged, say so, do not fake it. (without a started game the scene may show zeros: that is fine, say what you see).
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Navigation (Flow). Real art (GDA).

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDR08: Endgame scene: heading, score block, plates, play again`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
