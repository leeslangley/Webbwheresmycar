[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDR01 Office scene: TV-centred layout with placeholder art

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDR01
Needs (already merged into `dev`): GDR19, GDU10
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The office room: the Webb TV (instanced from `res://tv/tv.tscn`, 760x560) dead centre, Mark and Dave seen from behind in chairs in front of its lower corners (their heads overlap the bottom of the glass a little, like the RSAMH shot), desk, wall calendar, window, auction poster and garage door around it, all as FLAT-COLOUR labelled placeholders on the five RoomBase layers so the game is playable before the real art arrives. Layout only: hotspots, the pop-up menu and behaviour come in GDR02.

## Read first
- docs/GODOT.md (plan, TV-centred layout, tap rule, determinism) and docs/GODOT_PLANNER_BRIEF.md section SHARED CONTRACTS (Game, Data, Sim*, Core*, tests, tools)
- STAGE ZONES (1280x720): banner y 0..120, tableau y 120..590, HUD strip y 590..720. The Main scene (GDU08) draws the Hud and Banner above the room; a room keeps every tappable rect inside y 120..590 (the TV and the characters may overlap the zones a little).
- godot/rooms/room_base.gd (GDR19, class `RoomBase extends Control`): `LAYER_NAMES`, `build_layers()`, `layer(name)`, `placeholder(name)`, `ui()`, `set_plate(layer, tex, pos)`, `add_hotspot(id, rect) -> RoomHotspot` (invisible tap rect), `add_button(id, rect, text, kind) -> UiButton`, `hotspots` (id -> control, both kinds), `game` + `get_game()`, signals `request_scene(scene_id: StringName, params: Dictionary)`, `chatter(text)`, `toast(text)`, virtuals `enter(params)`, `exit()`, `_on_hotspot(id)`, `_on_button_blocked(id)`, `_on_button_down(id)`, statics `add_box`, `add_panel`, `add_label`, `pixel_font`. Rooms are built IN CODE in `_ready` (the .tscn is only a root Control with the script), so every node name in a card is an exact contract for the art cards (GDA) and the tests. Rooms are shown by the SceneHost (GDU30), which calls `enter(params)` after adding and `exit()` before removing.
- Tests: `godot/tests/test_<name>.gd` starts with `extends "res://tests/harness.gd"`; every method named `test_*` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`. Run one file with `sh tools/godot/gtest.sh test_<name>` (last line `GDTEST OK`).
- Test hygiene: get the tree with `var tree := Engine.get_main_loop() as SceneTree`; add a node with `tree.root.add_child(n)` when its `_ready` must run; at the end of each test `tree.root.remove_child(n)` (if added) and `n.free()`. Nodes made with `.new()` and never added can simply be `free()`d.
- docs/art/RSAMH_STYLE.md ('How we echo it')
- /Users/leelangley/wt/webbwheresmycar/_dev/src/art/officelayout.js and src/art/office.js (the old room layout: reuse the IDEAS and colours, the coordinates below are new)
- /Users/leelangley/wt/webbwheresmycar/_dev/src/ui/theme.js (PALETTE hex values)
- godot/tv/tv.gd (GDU10: class Tv, fixed size 760x560, `GLASS` rect)

## Files you may change (and nothing else)
- `godot/scenes/office.tscn`
- `godot/scenes/office.gd`
- `godot/rooms/office_art.gd`
- `godot/tests/test_office_scene.gd`

## Steps
1. `godot/scenes/office.gd`: `class_name OfficeRoom`, `extends RoomBase`. Layout constants (stage pixels, these exact numbers): `R_TV := Rect2(260, 60, 760, 560)`, `R_GARAGE_DOOR := Rect2(30, 124, 200, 160)`, `R_WINDOW := Rect2(1040, 124, 110, 110)`, `R_POSTER := Rect2(1164, 124, 96, 110)`, `R_CALENDAR := Rect2(1060, 244, 130, 140)`, `R_DESK := Rect2(1020, 464, 260, 126)`, `R_PHONE := Rect2(1046, 400, 72, 64)`, `R_NEWSPAPER := Rect2(1122, 408, 78, 56)`, `R_KETTLE := Rect2(1208, 396, 56, 70)`, `R_MARK := Rect2(300, 470, 110, 150)`, `R_DAVE := Rect2(870, 470, 110, 150)`, `R_MENU := Rect2(8, 290, 280, 272)` (the UiMenu is 280 wide, 4 rows). `func _ready() -> void: build_layers(); strip_color = Color("6C5EB5"); OfficeArt.build(self)`. `godot/scenes/office.tscn`: a single `Control` node named `Office` with that script (write it by hand: `[gd_scene load_steps=2 format=3]`, one ext_resource, one node).
2. `godot/rooms/office_art.gd`: `class_name OfficeArt`, `extends RefCounted`, `static func build(room: OfficeRoom) -> void` that creates exactly the nodes below with `RoomBase.add_box(parent, name, rect, colour, caption)` (parent = `room.placeholder(<layer>)`). BACKGROUND: `Wall` Rect2(0,0,1280,456) `#6C5EB5`; `Skirting` Rect2(0,456,1280,14) `#433900`; `Floor` Rect2(0,470,1280,250) `#6F4F25`; `Window` = R_WINDOW `#9FD3FF` caption WINDOW; `Poster` = R_POSTER `#F4E9C8` caption POSTER; `Calendar` = R_CALENDAR `#FFF7DC` caption CALENDAR; `GarageDoor` = R_GARAGE_DOOR `#6C6C6C` caption GARAGE DOOR. PROPS: `Desk` = R_DESK `#6B4423` caption DESK; `Phone` = R_PHONE `#B3282D` caption PHONE; `Newspaper` = R_NEWSPAPER `#F4E9C8` caption PAPER; `Kettle` = R_KETTLE `#959595` caption KETTLE.
3. The TV (a child of the `Props` layer itself, NOT of its Placeholder, so hiding placeholders never hides it): if `ResourceLoader.exists("res://tv/tv.tscn")` then `tv = (load("res://tv/tv.tscn") as PackedScene).instantiate()` else a stand-in `RoomBase.add_box(room.layer("Props"), "Tv", OfficeRoom.R_TV, Color("222222"), "TV (tv.tscn missing)")`. Name it `Tv`; for a real instance add it to `room.layer("Props")` and set `position = R_TV.position` (the Tv sets its own size 760x560). The TV must be the centre of the picture: `R_TV.get_center().x == 640`.
4. Characters (seen from behind, in front of the TV): `static func add_figure(parent: Node, fig_name: String, r: Rect2, chair: Color, body: Color, head: Color, caption: String) -> Node2D` creates a `Node2D` named `fig_name` containing `Chair` = box Rect2(r.x - 10, r.y + 50, r.w + 20, r.h - 50) in `chair`, `Torso` = box Rect2(r.x + 10, r.y + 40, r.w - 20, r.h - 40) in `body` with the caption, and `Head` = a `Polygon2D` (16-point circle of radius 30 around Vector2(r.x + r.w / 2, r.y + 30)) in `head`. Call it twice under `room.placeholder("Characters")`: `Mark` (R_MARK, chair `#3F2814`, body `#B3282D`, head `#8C5E34`, caption MARK) and `Dave` (R_DAVE, chair `#3F2814`, body `#1C2E5A`, head `#D9A66F`, caption DAVE).
5. LIGHTS (placeholders for the PointLight2D nodes the GDA cards add): `Polygon2D` `TvGlow` with polygon `[(380,500),(900,500),(1040,590),(240,590)]` colour `Color(0.5, 0.85, 1.0, 0.14)`; `Polygon2D` `WindowLight` with polygon `[(1040,234),(1150,234),(1100,420),(960,420)]` colour `Color(1.0, 0.95, 0.7, 0.10)`. FRONT: `FrontPlant` Rect2(1230,520,50,70) `#588D43` caption PLANT.
6. `godot/tests/test_office_scene.gd`: instantiate `res://scenes/office.tscn`, add to the tree (its `_ready` builds everything). Check: children 0..6 of the root are Background, Props, Characters, Lights, Front, Ui, Hotspots; `Background/Placeholder` has Wall, Skirting, Floor, Window, Poster, Calendar, GarageDoor; `Props/Placeholder` has Desk, Phone, Newspaper, Kettle; `Props/Tv` exists and `position == Vector2(260, 60)`; `Lights/Placeholder` has TvGlow and WindowLight; `Front/Placeholder/FrontPlant` exists; `Characters/Placeholder/Mark` and `.../Dave` each have children Chair, Torso, Head, the Head is a `Polygon2D` with 16 points; Mark's head centre x (average of its polygon points) is less than 640 and Dave's is greater than 640; `OfficeRoom.R_TV.get_center().x == 640.0`; every `R_*` constant is enclosed by `Rect2(0, 0, 1280, 720)` (`encloses`); `R_MENU` does not intersect `R_MARK.grow(10)` nor `R_GARAGE_DOOR`; `strip_color == Color("6C5EB5")`. Free the node.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_office_scene` ends with `GDTEST OK`.
- Screenshot step: run `sh tools/godot/gshot.sh scenes/office.tscn /tmp/gdr01_office.png 8`, then LOOK at the PNG with the Read tool and describe it in your final reply (what is where, anything overlapping, anything off screen). If the screenshot step fails because a card it needs is not merged, say so, do not fake it. Check specifically: TV in the middle, two back-of-head figures in front of its lower corners, window/poster/calendar on the right wall, garage door left, desk with phone/paper/kettle bottom right, an empty strip on the left where the menu will go.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Hotspots, menu, game access (GDR02). Real art, lights, sprites (GDA cards). The TV scene itself (GDU cards).

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDR01: Office scene: TV-centred layout with placeholder art`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
