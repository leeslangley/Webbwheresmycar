[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDR03 Garage scene: layout with placeholder art

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDR03
Needs (already merged into `dev`): GDR19
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The garage room layout (port of the layout of src/ui/scenes/garage.js, refitted to the tableau y 120..590): concrete wall and painted floor with strip lights as labelled flat placeholders, a car-list panel on the left, a detail panel on the right with a slot where the 3D CarView will go, six action-button slots and BACK / page buttons. Only the layout and the named nodes: list rows, buttons and logic come in GDR04 and GDR27.

## Read first
- docs/GODOT.md (plan, TV-centred layout, tap rule, determinism) and docs/GODOT_PLANNER_BRIEF.md section SHARED CONTRACTS (Game, Data, Sim*, Core*, tests, tools)
- STAGE ZONES (1280x720): banner y 0..120, tableau y 120..590, HUD strip y 590..720. The Main scene (GDU08) draws the Hud and Banner above the room; a room keeps every tappable rect inside y 120..590 (the TV and the characters may overlap the zones a little).
- godot/rooms/room_base.gd (GDR19, class `RoomBase extends Control`): `LAYER_NAMES`, `build_layers()`, `layer(name)`, `placeholder(name)`, `ui()`, `set_plate(layer, tex, pos)`, `add_hotspot(id, rect) -> RoomHotspot` (invisible tap rect), `add_button(id, rect, text, kind) -> UiButton`, `hotspots` (id -> control, both kinds), `game` + `get_game()`, signals `request_scene(scene_id: StringName, params: Dictionary)`, `chatter(text)`, `toast(text)`, virtuals `enter(params)`, `exit()`, `_on_hotspot(id)`, `_on_button_blocked(id)`, `_on_button_down(id)`, statics `add_box`, `add_panel`, `add_label`, `pixel_font`. Rooms are built IN CODE in `_ready` (the .tscn is only a root Control with the script), so every node name in a card is an exact contract for the art cards (GDA) and the tests. Rooms are shown by the SceneHost (GDU30), which calls `enter(params)` after adding and `exit()` before removing.
- Tests: `godot/tests/test_<name>.gd` starts with `extends "res://tests/harness.gd"`; every method named `test_*` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`. Run one file with `sh tools/godot/gtest.sh test_<name>` (last line `GDTEST OK`).
- Test hygiene: get the tree with `var tree := Engine.get_main_loop() as SceneTree`; add a node with `tree.root.add_child(n)` when its `_ready` must run; at the end of each test `tree.root.remove_child(n)` (if added) and `n.free()`. Nodes made with `.new()` and never added can simply be `free()`d.
- /Users/leelangley/wt/webbwheresmycar/_dev/src/ui/scenes/garage.js (LAYOUT, drawRoom, drawDetail)
- /Users/leelangley/wt/webbwheresmycar/_dev/src/ui/theme.js (PALETTE)

## Files you may change (and nothing else)
- `godot/scenes/garage.tscn`
- `godot/scenes/garage.gd`
- `godot/rooms/garage_art.gd`
- `godot/tests/test_garage_scene.gd`

## Steps
1. `godot/scenes/garage.gd`: `class_name GarageRoom`, `extends RoomBase`. Constants (exact): `R_BACK := Rect2(30, 126, 150, 64)`, `R_PAGE_UP := Rect2(190, 126, 100, 64)`, `R_PAGE_DOWN := Rect2(300, 126, 100, 64)`, `R_LIST := Rect2(30, 196, 370, 360)`, `ROW_H := 72`, `ROWS_PER_PAGE := 5`, `R_DETAIL := Rect2(420, 126, 830, 300)`, `R_CARVIEW := Rect2(440, 196, 480, 220)`, `BAR_X := 940.0`, `BAR_W := 290.0`, `BTN_RECTS := {&"tinker": Rect2(420, 438, 270, 64), &"service": Rect2(700, 438, 270, 64), &"fix": Rect2(980, 438, 270, 64), &"restore": Rect2(420, 514, 270, 64), &"sell": Rect2(700, 514, 270, 64), &"consign": Rect2(980, 514, 270, 64)}`. `static func row_rect(i: int) -> Rect2: return Rect2(30, 196 + i * ROW_H, 370, 68)`. `func _ready() -> void: build_layers(); strip_color = Color("444444"); GarageArt.build(self)`. `garage.tscn` is one `Control` named `Garage` with the script (write by hand).
2. `godot/rooms/garage_art.gd`: `class_name GarageArt`, `extends RefCounted`, `static func build(room: GarageRoom) -> void`. Placeholders via `RoomBase.add_box` (names exact): BACKGROUND `Wall` Rect2(0,0,1280,430) `#5A5A5A` caption CONCRETE WALL; `Floor` Rect2(0,430,1280,290) `#5B4A2E` caption PAINTED FLOOR. PROPS `CarViewSlot` = R_CARVIEW `#222222` caption CAR VIEW (the GDA cards put a node named `CarView` here); `Hoist` Rect2(1150,300,90,110) `#B3282D` caption HOIST. LIGHTS `StripLight0`, `StripLight1`, `StripLight2` = Rect2(220,124,140,12), Rect2(570,124,140,12), Rect2(920,124,140,12) colour `#FFD27A`.
3. UI (in `room.ui()`, using `RoomBase.add_panel` / `add_label`): panels `ListPanel` = R_LIST (fill `Color(0.0784, 0.0627, 0.1647, 0.85)`) and `DetailPanel` = R_DETAIL (fill `Color(1.0, 0.969, 0.863, 0.92)`). Labels (all names exact; font sizes in px; colours cream `#F4E9C8` on the dark list panel, ink `#14102A` on the paper panel): `StableLabel` text `STABLE 0/0` at (30,560) width 370, 24; `EmptyLabel` text `The garage is empty. Mark weeps quietly.` at (40,210) width 350, 26, `visible = false`, autowrap `TextServer.AUTOWRAP_WORD_SMART`, size (350, 80); `NameLabel` at (440,132) width 480, 16 (title font: after `add_label` call `l.add_theme_font_override("font", RoomBase.pixel_font("title"))`); `QuipLabel` at (440,162) width 480, 24; `DesLabel` at (940,132), `RelLabel` at (940,184), `CondLabel` at (940,236), each 16 title font; `ValueLabel` at (940,292), 26; `CostLabel` at (940,322), 26; `FaultLabel` at (940,352), 24, red `#D9483B`, autowrap smart, size (290, 70).
4. Bars: for each of Des, Rel, Cond at y = 158, 210, 262 add a track `DesTrack` / `RelTrack` / `CondTrack` (`add_box` on `room.ui()`, Rect2(BAR_X, y, BAR_W, 16), `#6C6C6C`) and a fill `DesBar` / `RelBar` / `CondBar` (Rect2(BAR_X, y, 0, 16); colours `#6C5EB5`, `#3FAE49`, `#FFD27A`).
5. `godot/tests/test_garage_scene.gd`: instantiate `res://scenes/garage.tscn`, add to the tree. Check: the seven layer/ui children as in RoomBase; the named nodes above exist (`Background/Placeholder/Wall`, `Props/Placeholder/CarViewSlot`, `Lights/Placeholder/StripLight2`, `Ui/ListPanel`, `Ui/DetailPanel`, `Ui/StableLabel`, `Ui/EmptyLabel` hidden, `Ui/NameLabel`, `Ui/QuipLabel`, `Ui/DesBar` with size.x 0, `Ui/FaultLabel`, ...); `R_CARVIEW` is enclosed by `R_DETAIL`; every tappable rect (R_BACK, R_PAGE_UP, R_PAGE_DOWN, the 5 `row_rect(i)`, the 6 BTN_RECTS values) is at least 64x64, enclosed by `Rect2(0, 120, 1280, 470)`, and no two of them intersect; `row_rect(4).end.y <= 590`. Free the node.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_garage_scene` ends with `GDTEST OK`.
- Screenshot step: run `sh tools/godot/gshot.sh scenes/garage.tscn /tmp/gdr03_garage.png 8`, then LOOK at the PNG with the Read tool and describe it in your final reply (what is where, anything overlapping, anything off screen). If the screenshot step fails because a card it needs is not merged, say so, do not fake it.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- List rows, buttons, any behaviour (GDR04, GDR27). Real art (GDA).

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDR03: Garage scene: layout with placeholder art`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
