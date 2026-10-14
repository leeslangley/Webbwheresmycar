[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDR09 Settings overlay: CRT, sound, music, erase save, back

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDR09
Needs (already merged into `dev`): GDR19, GDR32, GDF10
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The settings overlay (shown over the title or the office): CRT FILTER, SOUND and MUSIC toggles stored in `Game.settings` (saved with `Game.save_settings()`), a two-tap ERASE SAVED GAME (`Game.erase_save()`; the second tap must come within 3 seconds), and BACK. Port of src/ui/scenes/settings.js. It dims and blocks everything behind it. It only edits the settings and announces changes; the Flow applies them (GDR31).

## Read first
- docs/GODOT.md (plan, TV-centred layout, tap rule, determinism) and docs/GODOT_PLANNER_BRIEF.md section SHARED CONTRACTS (Game, Data, Sim*, Core*, tests, tools)
- godot/rooms/room_base.gd (GDR19, class `RoomBase extends Control`): `LAYER_NAMES`, `build_layers()`, `layer(name)`, `placeholder(name)`, `ui()`, `set_plate(layer, tex, pos)`, `add_hotspot(id, rect) -> RoomHotspot` (invisible tap rect), `add_button(id, rect, text, kind) -> UiButton`, `hotspots` (id -> control, both kinds), `game` + `get_game()`, signals `request_scene(scene_id: StringName, params: Dictionary)`, `chatter(text)`, `toast(text)`, virtuals `enter(params)`, `exit()`, `_on_hotspot(id)`, `_on_button_blocked(id)`, `_on_button_down(id)`, statics `add_box`, `add_panel`, `add_label`, `pixel_font`. Rooms are built IN CODE in `_ready` (the .tscn is only a root Control with the script), so every node name in a card is an exact contract for the art cards (GDA) and the tests. Rooms are shown by the SceneHost (GDU30), which calls `enter(params)` after adding and `exit()` before removing.
- Widgets from the GDU cards that rooms use: `UiButton` (godot/ui/button.gd: `UiButton.new()`, vars `text` (up to 2 lines, split on \n), `kind` 'normal'|'primary'|'remote'|'card', `enabled`, `hot` (gold outline = selected), signals `activated` and `blocked` (a tap on a DISABLED button), `handle_event(ev)`, minimum size 64x64); `UiTap` (godot/ui/tap.gd: `press(id)`, `release(id) -> bool`); `UiMenu` (godot/ui/menu.gd: `open(list: Array[String], at: Vector2)`, `set_item_enabled(i, on)`, signal `chosen(index: int)`, closes itself when a row is chosen, rows 64 px, width 280); `UiTheme` (godot/ui/ui_theme.gd: `title_font()`, `body_font()`, `color(key)`).
- Tapping in tests: `TapUtil.tap(control)` (godot/tests/tap_util.gd, GDR32) does press then release inside on ANY control that has `handle_event(ev)` (UiButton, RoomHotspot, UiMenu); `TapUtil.press(c)`, `TapUtil.release(c)`, `TapUtil.tap_away(c)` (press inside, release outside: must NOT activate); positions default to `Vector2(5, 5)` (inside) and `TapUtil.OUTSIDE`; for a UiMenu row pass a position such as `Vector2(20, 8 + 64 * i + 10)`.
- Tests: `godot/tests/test_<name>.gd` starts with `extends "res://tests/harness.gd"`; every method named `test_*` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`. Run one file with `sh tools/godot/gtest.sh test_<name>` (last line `GDTEST OK`).
- Test hygiene: get the tree with `var tree := Engine.get_main_loop() as SceneTree`; add a node with `tree.root.add_child(n)` when its `_ready` must run; at the end of each test `tree.root.remove_child(n)` (if added) and `n.free()`. Nodes made with `.new()` and never added can simply be `free()`d.
- /Users/leelangley/wt/webbwheresmycar/_dev/src/ui/scenes/settings.js (LAYOUT, toggle, erase with CONFIRM_MS, toggleLabel)
- godot/autoload/game.gd (GDF10: `settings` Dictionary {crt, sound, music}, `save_settings()`, `erase_save()`)

## Files you may change (and nothing else)
- `godot/scenes/settings.tscn`
- `godot/scenes/settings.gd`
- `godot/tests/test_settings_scene.gd`

## Steps
1. `godot/scenes/settings.gd`: `class_name SettingsPanel`, `extends RoomBase`. `signal closed`, `signal setting_changed(key: String, value: bool)`. Constants `CONFIRM_MS := 3000`; `const ROWS := [{"id": &"crt", "name": "CRT FILTER"}, {"id": &"sound", "name": "SOUND"}, {"id": &"music", "name": "MUSIC"}]`; rects `R_PANEL := Rect2(240, 40, 800, 660)`, toggle button rects `Rect2(340, 150 + 76 * i, 600, 64)` for i = 0..2, `R_ERASE := Rect2(340, 378, 600, 64)`, `R_BACK := Rect2(340, 484, 600, 64)`. `var confirm_until_ms := 0`. `settings.tscn` is one `Control` named `Settings` with the script (write by hand).
2. `_ready()`: `build_layers()`; in `ui()` add a `ColorRect` `Dim` Rect2(0,0,1280,720) colour `Color(0, 0, 0, 0.6)` with `mouse_filter = Control.MOUSE_FILTER_STOP` (blocks the room behind), `add_panel` `Panel` = R_PANEL with ink fill `Color("14102A")`, `add_label` `Title` text `SETTINGS` at (240, 76) width 800 centred, 32 px, lamp `#FFD27A`; buttons with `add_button(id, rect, "", "normal")` for `&"crt"`, `&"sound"`, `&"music"`, `&"erase"` and `&"back"` ("BACK"); then `refresh()`. The `Dim` and `Panel` are in `Ui`, the buttons live in `Hotspots` which is above `Ui`.
3. `func settings() -> Dictionary` = `get_game().settings`. `func refresh(now_ms := -1) -> void` (-1 means `Time.get_ticks_msec()`): each toggle text = name + ": " + ("ON" or "OFF") from `bool(settings().get(id, false))` (sound and music default to ON when the key is missing); erase text = "TAP AGAIN TO CONFIRM" when `erase_armed(now)` else "ERASE SAVED GAME". `func erase_armed(now_ms: int) -> bool` = `confirm_until_ms > now_ms`. `func toggle(key: String)`: `var v := not bool(settings().get(key, key != "crt"))`; `settings()[key] = v`; `get_game().save_settings()`; emit `setting_changed(key, v)`; `refresh()`. `func erase_tap(now_ms: int)`: if armed: `confirm_until_ms = 0`, `get_game().erase_save()`, emit `toast("Save erased")`; else `confirm_until_ms = now_ms + CONFIRM_MS`; then `refresh(now_ms)`. `_on_hotspot(id)`: toggles call `toggle`, erase calls `erase_tap(Time.get_ticks_msec())`, back emits `closed`. `_process(_d)`: if `confirm_until_ms > 0` and not armed now: set it to 0 and `refresh()`. KEY_ESCAPE emits `closed` (`handle_key(keycode) -> bool`, forwarded from `_unhandled_key_input`).
4. `godot/tests/test_settings_scene.gd`: the Game is replaced by a stub defined INSIDE the test file: `class StubGame extends RefCounted:` with `var settings := {"crt": false, "sound": true, "music": true}`, `var saves := 0`, `var erased := 0`, `func save_settings() -> bool: saves += 1; return true`, `func erase_save() -> bool: erased += 1; return true`. Instantiate the scene, set `room.game = StubGame.new()` before adding it to the tree. Texts: `Btn_crt`, `Btn_sound`, `Btn_music` read "CRT FILTER: OFF", "SOUND: ON", "MUSIC: ON"; erase reads "ERASE SAVED GAME". Tapping crt (`TapUtil.tap(room.hotspots[&"crt"])`) emits `setting_changed("crt", true)`, the text becomes "CRT FILTER: ON", `stub.settings.crt` is true and `stub.saves == 1`; tapping sound makes `stub.settings.sound` false and its text "SOUND: OFF". Erase flow: `erase_tap(1000)` -> `erase_armed(1500)` true, `refresh(1500)` shows "TAP AGAIN TO CONFIRM", `stub.erased == 0`; `erase_tap(1500)` -> `stub.erased == 1` and the toast "Save erased" was emitted; a fresh `erase_tap(1000)` then `erase_armed(4001)` is false. BACK tap and `handle_key(KEY_ESCAPE)` both emit `closed`. `Ui/Dim.mouse_filter == Control.MOUSE_FILTER_STOP`. All five buttons are >= 64 px tall, enclosed by `Rect2(0, 0, 1280, 720)`, and do not intersect. Free the node.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_settings_scene` ends with `GDTEST OK`.
- Screenshot step: run `sh tools/godot/gshot.sh scenes/settings.tscn /tmp/gdr09_settings.png 8`, then LOOK at the PNG with the Read tool and describe it in your final reply (what is where, anything overlapping, anything off screen). If the screenshot step fails because a card it needs is not merged, say so, do not fake it. (the standalone scene uses the real Game autoload: it may show defaults).
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Applying the settings (GDR31). Real CRT shader (GDU/GDA).

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDR09: Settings overlay: CRT, sound, music, erase save, back`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
