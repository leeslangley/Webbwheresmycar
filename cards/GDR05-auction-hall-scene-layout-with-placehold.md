[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDR05 Auction hall scene: layout with placeholder art

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDR05
Needs (already merged into `dev`): GDR19
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The auction hall layout (port of the layout of src/ui/scenes/auction.js, refitted to the tableau y 120..590): dark hall, a plank stage with a spotlight cone and a slot for the lot's CarView, a crowd of silhouettes with bidding paddles, four stat rows, a YOUR LOTS panel, the bid block and the arrow / back / leave button slots. Layout and named nodes only; behaviour is GDR06 and GDR28.

## Read first
- docs/GODOT.md (plan, TV-centred layout, tap rule, determinism) and docs/GODOT_PLANNER_BRIEF.md section SHARED CONTRACTS (Game, Data, Sim*, Core*, tests, tools)
- STAGE ZONES (1280x720): banner y 0..120, tableau y 120..590, HUD strip y 590..720. In main.tscn the Hud and Banner are separate nodes; a room keeps every tappable rect inside y 120..590 (the TV may overlap the zones a little).
- godot/rooms/room_base.gd (GDR19, class `RoomBase extends Control`): `LAYER_NAMES`, `build_layers()`, `layer(name)`, `placeholder(name)`, `set_plate(layer, tex, pos)`, `add_hotspot(id, rect)`, `hotspots`, `game` + `get_game()`, signals `request_scene(scene_id: StringName, params: Dictionary)`, `chatter(text)`, `toast(text)`, statics `add_box`, `add_panel`, `add_label`, `pixel_font`. Rooms are built IN CODE in `_ready` (the .tscn is only a root Control with the script), so every node name in a card is an exact contract for the art cards (GDA) and the tests.
- Tests: `godot/tests/test_<name>.gd` starts with `extends "res://tests/harness.gd"`; every method named `test_*` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`. Run one file with `sh tools/godot/gtest.sh test_<name>` (last line `GDTEST OK`).
- Test hygiene: get the tree with `var tree := Engine.get_main_loop() as SceneTree`; add a node with `tree.root.add_child(n)` when its `_ready` must run; at the end of each test `tree.root.remove_child(n)` (if added) and `n.free()`. Nodes made with `.new()` and never added can simply be `free()`d.
- /Users/leelangley/wt/webbwheresmycar/_dev/src/ui/scenes/auction.js (LAYOUT, YOURS, drawHall, drawCrowd, drawStatRow, drawYourLots)

## Files you may change (and nothing else)
- `godot/scenes/auction.tscn`
- `godot/scenes/auction.gd`
- `godot/rooms/auction_art.gd`
- `godot/tests/test_auction_scene.gd`

## Steps
1. `godot/scenes/auction.gd`: `class_name AuctionRoom`, `extends RoomBase`. Constants (exact): `R_BACK := Rect2(30, 126, 120, 64)`, `R_PREV := Rect2(30, 200, 120, 100)`, `R_NEXT := Rect2(1130, 200, 120, 100)`, `R_STAGE := Rect2(170, 126, 940, 190)`, `R_CARVIEW := Rect2(440, 184, 400, 130)`, `R_STAT_ROWS := [Rect2(40, 322, 290, 64), Rect2(40, 386, 290, 64), Rect2(40, 450, 290, 64), Rect2(40, 514, 290, 64)]`, `R_YOURS := Rect2(350, 322, 300, 256)`, `R_INFO := Rect2(680, 322, 560, 80)`, `R_BID1 := Rect2(680, 410, 270, 64)`, `R_BID3 := Rect2(970, 410, 270, 64)`, `R_LEAVE := Rect2(680, 490, 560, 64)`, `STAT_LABELS := ["STYLE", "UPKEEP", "GRIT", "CONDITION"]`, `YOURS_ROWS := 7`. `func _ready() -> void: build_layers(); strip_color = Color("14102A"); AuctionArt.build(self)`. `auction.tscn` is one `Control` named `Auction` with the script (write by hand).
2. `godot/rooms/auction_art.gd`: `class_name AuctionArt`, `extends RefCounted`, `static func build(room: AuctionRoom) -> void`. BACKGROUND placeholders (`RoomBase.add_box`): `Hall` Rect2(0,0,1280,590) `#14102A` caption HALL; `Stage` = R_STAGE `#433900` caption STAGE; `Plank1`..`Plank5` thin boxes Rect2(170, 126 + i * 32, 940, 3) `#2B2400`. PROPS: `CarViewSlot` = R_CARVIEW `#222222` caption LOT CAR VIEW (the GDA CarView goes here), `Gavel` Rect2(1020,140,60,16) `#F4E9C8`. LIGHTS: `Spotlight` = `Polygon2D` with polygon `[(640,120),(350,316),(930,316)]`, colour `Color(1.0, 0.82, 0.48, 0.14)`. CHARACTERS: a `Node2D` named `Crowd` with nine `Node2D` children `Person0`..`Person8` (x = 100 + i * 135): each has a `Head` (`Polygon2D` 16-point circle radius 30 centred (x, 500), colour black) and a `Torso` (box Rect2(x - 45, 530, 90, 60) black); and five `Node2D` paddles `Paddle0`..`Paddle4` (x = 120 + i * 260) each with `Stick` (box Rect2(x - 3, 430, 6, 44) `#F4E9C8`) and `Board` (box Rect2(x - 15, 406, 30, 24) `#9A6759`), all `visible = false`.
3. UI (`room.ui()`): panels `YoursPanel` = R_YOURS (fill `Color(0.267, 0.267, 0.267, 0.9)`), `StatPanel0`..`StatPanel3` = each R_STAT_ROWS rect shrunk by 3 px on every side (same fill). Labels (cream `#F4E9C8` / lamp `#FFD27A` / white, pixel fonts as `RoomBase.add_label` + `pixel_font("title")` override where noted): `LotNo` (180,132) title 16 lamp; `LotName` Rect2(170,132) width 940 centred title 16 white; `LotInfo` (170,160) width 940 centred 26 cream; `NoLotsLabel` (170,230) width 940 centred 34 cream text `No lots this month.` hidden; for i in 0..3 with row r: `StatName{i}` (r.x + 12, r.y + 8) title 16 lamp text STAT_LABELS[i]; `StatValue{i}` (r.x + 12, r.y + 34) title 18 white text `???`; `StatHint{i}` (r.x + 150, r.y + 8) width 130 24 cream text `REVEAL`; `StatTrack{i}` box Rect2(r.x + 78, r.y + 38, 160, 14) `#6C6C6C` and `StatBar{i}` box Rect2(r.x + 78, r.y + 38, 0, 14) in the colours `#FFD27A`, `#9A6759`, `#9AD284`, `#70A4B2`; `YoursTitle` (362,330) title 16 lamp text `YOUR LOTS`; `YoursEmpty` (362,372) 24 cream text `Nothing consigned`; for j in 0..6: `YoursRow{j}` (362, 366 + j * 28) width 170 22 white and `YoursRes{j}` (535, 366 + j * 28) width 105 22 cream right-aligned (`horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT`), both empty text; `BidLabel` (680,326) title 20 white text `Bid: none`; `LeaderLabel` (680,358) title 16 lamp text `Nobody`; `MinLabel` (680,384) 24 cream.
4. `godot/tests/test_auction_scene.gd`: instantiate `res://scenes/auction.tscn`, add to the tree. Check the layer children order; `Background/Placeholder` has Hall, Stage, Plank1..Plank5; `Props/Placeholder/CarViewSlot`; `Lights/Placeholder/Spotlight` is a Polygon2D with 3 points; `Characters/Placeholder/Crowd` has 9 persons, each with Head (16 points) and Torso, plus `Paddle0..4` hidden (their parent: put the paddles under `Characters/Placeholder` too); `Ui` has StatPanel0..3, StatName/StatValue/StatHint/StatTrack/StatBar 0..3, YoursRow0..6, YoursRes0..6, `NoLotsLabel` hidden, `BidLabel`, `LeaderLabel`, `MinLabel`; R_CARVIEW is enclosed by R_STAGE; the three stat rows' rects do not intersect each other, R_YOURS, R_INFO, R_BID1, R_BID3 or R_LEAVE; every tappable rect (R_BACK, R_PREV, R_NEXT, the 4 stat rows, R_BID1, R_BID3, R_LEAVE) is at least 64x64 and enclosed by `Rect2(0, 120, 1280, 470)` and none of those intersect each other. Free the node.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_auction_scene` ends with `GDTEST OK`.
- Screenshot step: run `sh tools/godot/gshot.sh scenes/auction.tscn /tmp/gdr05_auction.png 8`, then LOOK at the PNG with the Read tool and describe it in your final reply (what is where, anything overlapping, anything off screen). If the screenshot step fails because the card it needs is not merged, say so, do not fake it.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Behaviour (GDR06, GDR28). Real art (GDA).

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDR05: Auction hall scene: layout with placeholder art`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
