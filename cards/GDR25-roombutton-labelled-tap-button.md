[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDR25 RoomButton: labelled tap button

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDR25
Needs (already merged into `dev`): GDR19
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The standard labelled button for rooms, built on RoomHotspot (same tap rule, never below 64x64). Looks: paper box with an ink border, pixel font, pressed state, a gold selected outline, and a DIMMED state that looks disabled but still takes the tap (the sim refuses politely and the refusal becomes a toast, like the JS garage).

## Read first
- docs/GODOT.md (plan, TV-centred layout, tap rule, determinism) and docs/GODOT_PLANNER_BRIEF.md section SHARED CONTRACTS (Game, Data, Sim*, Core*, tests, tools)
- Tests: `godot/tests/test_<name>.gd` starts with `extends "res://tests/harness.gd"`; every method named `test_*` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`. Run one file with `sh tools/godot/gtest.sh test_<name>` (last line `GDTEST OK`).
- Test hygiene: get the tree with `var tree := Engine.get_main_loop() as SceneTree`; add a node with `tree.root.add_child(n)` when its `_ready` must run; at the end of each test `tree.root.remove_child(n)` (if added) and `n.free()`. Nodes made with `.new()` and never added can simply be `free()`d.
- godot/rooms/hotspot.gd (GDR18)
- /Users/leelangley/wt/webbwheresmycar/_dev/src/ui/theme.js (PALETTE) and src/ui/kit_draw.js function `button` (the old look: kinds normal/primary/danger)

## Files you may change (and nothing else)
- `godot/rooms/room_button.gd`
- `godot/tests/test_room_button.gd`

## Steps
1. Create `godot/rooms/room_button.gd`: `class_name RoomButton`, `extends RoomHotspot`. Members: `var text := ""`, `var kind := "normal"` (also "primary", "danger"), `var font_kind := "title"` (or "body"), `var font_px := 16`, `var dimmed := false`, `var selected := false`, `var align_left := false`. Colour constants: `COL_INK := Color("14102A")`, `COL_PAPER := Color("FFF7DC")`, `COL_PRIMARY := Color("FFD27A")`, `COL_DANGER := Color("D9483B")`, `COL_GREY := Color("959595")`, `COL_GREY_TEXT := Color("6C6C6C")`, `COL_GOLD := Color("E8B923")`.
2. `static func make_button(btn_id: StringName, rect: Rect2, label_text: String, btn_kind := "normal") -> RoomButton`: like `RoomHotspot.make` but returns a RoomButton (use `RoomHotspot.fit_rect(rect)`; `name = "Btn_" + String(btn_id)`; `mouse_filter` STOP; `focus_mode` NONE; `text = label_text`; `kind = btn_kind`). Setters that also `queue_redraw()`: `set_text(t)`, `set_dimmed(v)`, `set_selected(v)`. `static func add_to(room: RoomBase, btn_id: StringName, rect: Rect2, label_text: String, btn_kind := "normal") -> RoomButton`: `make_button(...)`, add it to the room's `Hotspots` child (`room.get_node("Hotspots")`), store it in `room.hotspots[btn_id]`, connect its `tapped` signal to `room._on_hotspot`, return it (all room cards use this to create buttons).
3. `func fill_color() -> Color`: if `dimmed or not enabled` return `COL_GREY`; else base = `COL_PRIMARY` for kind "primary", `COL_DANGER` for "danger", otherwise `COL_PAPER`; if `pressed` return `base.darkened(0.15)`; else base. `func text_color() -> Color`: `COL_GREY_TEXT` when dimmed or disabled, `Color.WHITE` for kind "danger", otherwise `COL_INK`.
4. `func _draw() -> void`: fill the whole rect with `fill_color()`; draw a 4 px ink border (`draw_rect(rect, COL_INK, false, 4.0)`); when `selected`, a second 4 px gold border inset by 6 px. Text: font = `RoomBase.pixel_font(font_kind)`; split `text` on "\n"; each line is drawn with `draw_string(font, pos, line, HORIZONTAL_ALIGNMENT_LEFT, size.x - 16.0, font_px, text_color())` where the block of lines is vertically centred (line height = `font_px * 1.4`) and each line is horizontally centred (width from `font.get_string_size(line, HORIZONTAL_ALIGNMENT_LEFT, -1, font_px).x`), or starts at x = 14 when `align_left`. While `pressed`, shift the text 2 px down. End with `super._draw()` so the glow outline of RoomHotspot still works.
5. `godot/tests/test_room_button.gd`: `make_button(&"go", Rect2(0, 0, 40, 30), "GO")` has size (64, 64), `text == "GO"`, name `Btn_go`. `fill_color()`: normal == `Color("FFF7DC")`, primary == `Color("FFD27A")`, danger == `Color("D9483B")`, `dimmed = true` == `Color("959595")`, `enabled = false` == `Color("959595")`; with `pressed = true` on a normal button `fill_color() == Color("FFF7DC").darkened(0.15)`. `text_color()` for danger is white, dimmed is `Color("6C6C6C")`. DIMMED still taps: `set_dimmed(true)`, `press()`, `release(true)` -> the `tapped` signal fired once; with `enabled = false` it does not. Setting `selected` and `text` with the setters does not error (call `_draw` is not needed). `add_to`: with `var r := RoomBase.new(); r.build_layers()`, `RoomButton.add_to(r, &"go", Rect2(0, 0, 100, 70), "GO")` returns a RoomButton that is a child of `Hotspots`, is stored in `r.hotspots[&"go"]`, and a tap on it (`press(); release(true)`) reaches an overridden `_on_hotspot` (use the same inline-GDScript subclass trick as in GDR19's test). Free every node.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_room_button` ends with `GDTEST OK`.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDR25: RoomButton: labelled tap button`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
