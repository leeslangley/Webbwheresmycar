[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDR09 Settings overlay: toggles, erase save, back

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDR09
Needs (already merged into `dev`): GDR19, GDR25, GDR29, GDR12
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The settings overlay (shown over the title or the office): CRT FILTER, SOUND, MUSIC and EFFECTS toggles, a two-tap ERASE SAVED GAME (the second tap must come within 3 seconds), and BACK. Port of src/ui/scenes/settings.js. It dims and blocks everything behind it. It only edits SettingsStore / Save and announces changes; the Flow applies them (GDR31).

## Read first
- docs/GODOT.md (plan, TV-centred layout, tap rule, determinism) and docs/GODOT_PLANNER_BRIEF.md section SHARED CONTRACTS (Game, Data, Sim*, Core*, tests, tools)
- godot/rooms/room_base.gd (GDR19, class `RoomBase extends Control`): `LAYER_NAMES`, `build_layers()`, `layer(name)`, `placeholder(name)`, `set_plate(layer, tex, pos)`, `add_hotspot(id, rect)`, `hotspots`, `game` + `get_game()`, signals `request_scene(scene_id: StringName, params: Dictionary)`, `chatter(text)`, `toast(text)`, statics `add_box`, `add_panel`, `add_label`, `pixel_font`. Rooms are built IN CODE in `_ready` (the .tscn is only a root Control with the script), so every node name in a card is an exact contract for the art cards (GDA) and the tests.
- Tests: `godot/tests/test_<name>.gd` starts with `extends "res://tests/harness.gd"`; every method named `test_*` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`. Run one file with `sh tools/godot/gtest.sh test_<name>` (last line `GDTEST OK`).
- Test hygiene: get the tree with `var tree := Engine.get_main_loop() as SceneTree`; add a node with `tree.root.add_child(n)` when its `_ready` must run; at the end of each test `tree.root.remove_child(n)` (if added) and `n.free()`. Nodes made with `.new()` and never added can simply be `free()`d.
- /Users/leelangley/wt/webbwheresmycar/_dev/src/ui/scenes/settings.js (LAYOUT, toggle, erase with CONFIRM_MS, toggleLabel)
- godot/rooms/settings_store.gd (GDR29), godot/rooms/save.gd (GDR12), godot/rooms/room_button.gd (GDR25)

## Files you may change (and nothing else)
- `godot/scenes/settings.tscn`
- `godot/scenes/settings.gd`
- `godot/tests/test_settings_scene.gd`

## Steps
1. `godot/scenes/settings.gd`: `class_name SettingsPanel`, `extends RoomBase`. `signal closed`, `signal setting_changed(key: String, value: bool)`. Constants `CONFIRM_MS := 3000`; `const ROWS := [{"id": &"crt", "name": "CRT FILTER"}, {"id": &"sound", "name": "SOUND"}, {"id": &"music", "name": "MUSIC"}, {"id": &"fx", "name": "EFFECTS"}]`; rects `R_PANEL := Rect2(240, 40, 800, 660)`, button rects `Rect2(340, 150 + 76 * i, 600, 64)` for the four toggles (i = 0..3), `R_ERASE := Rect2(340, 454, 600, 64)`, `R_BACK := Rect2(340, 560, 600, 64)`. `var confirm_until_ms := 0`. `settings.tscn` is one `Control` named `Settings` with the script (write by hand).
2. `_ready()`: `build_layers()`; in `ui()` add a `ColorRect` `Dim` Rect2(0,0,1280,720) colour `Color(0, 0, 0, 0.6)` with `mouse_filter = Control.MOUSE_FILTER_STOP` (blocks the room behind), `add_panel` `Panel` = R_PANEL with ink fill `Color("14102A")`, `add_label` `Title` text `SETTINGS` at (240, 76) width 800 centred, 32 px, lamp `#FFD27A`; buttons with `RoomButton.add_to(self, id, rect, "", "normal")` for `&"crt"`, `&"sound"`, `&"music"`, `&"fx"`, `&"erase"` (kind "danger") and `&"back"` ("BACK"); then `refresh()`. Keep the `Dim` and `Panel` BELOW the buttons: the buttons live in `Hotspots`, which is above `Ui`.
3. `func refresh(now_ms := -1) -> void` (-1 means `Time.get_ticks_msec()`): each toggle text = name + ": " + ("ON" or "OFF") from `SettingsStore.get_value(id)`; erase text = "TAP AGAIN TO CONFIRM" when `erase_armed(now)` else "ERASE SAVED GAME". `func erase_armed(now_ms: int) -> bool` = `confirm_until_ms > now_ms`. `func toggle(key: String)`: `var v := not SettingsStore.get_value(key)`; `SettingsStore.set_value(key, v)`; emit `setting_changed(key, v)`; `refresh()`. `func erase_tap(now_ms: int)`: if armed: `confirm_until_ms = 0`, `Save.erase()`, emit `toast("Save erased")`; else `confirm_until_ms = now_ms + CONFIRM_MS`; then `refresh(now_ms)`. `_on_hotspot(id)`: toggles call `toggle`, erase calls `erase_tap(Time.get_ticks_msec())`, back emits `closed`. `_process(_d)`: if `confirm_until_ms > 0` and not armed now: set it to 0 and `refresh()`. Key KEY_ESCAPE emits `closed` (`handle_key(keycode) -> bool`, forwarded from `_unhandled_key_input`).
4. `godot/tests/test_settings_scene.gd` (first set `SettingsStore.path = "user://test_settings2.json"`, `Save.path = "user://test_save2.json"`, `SettingsStore.values = SettingsStore.defaults()`, `Save.erase()`): instantiate the scene, add to the tree. Texts: `Btn_crt` etc. read "CRT FILTER: OFF", "SOUND: ON", "MUSIC: ON", "EFFECTS: ON"; erase reads "ERASE SAVED GAME". Tapping crt (press, release(true) on `room.hotspots[&"crt"]`) emits `setting_changed("crt", true)`, the text becomes "CRT FILTER: ON", and `SettingsStore.parse(FileAccess.get_file_as_string(SettingsStore.path)).crt` is true. Erase flow: `Save.write(FakeGame.sample_state())`; `erase_tap(1000)` -> `erase_armed(1500)` true, `refresh(1500)` shows "TAP AGAIN TO CONFIRM", `Save.has_save()` still true; `erase_tap(1500)` -> `Save.has_save()` false and the toast "Save erased" was emitted; a fresh `erase_tap(1000)` then `erase_armed(4001)` is false. BACK tap and `handle_key(KEY_ESCAPE)` both emit `closed`. `Ui/Dim.mouse_filter == Control.MOUSE_FILTER_STOP`. All five/six buttons are >= 64 px tall, enclosed by `Rect2(0, 0, 1280, 720)`, and do not intersect. Free the node.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_settings_scene` ends with `GDTEST OK`.
- Screenshot step: run `sh tools/godot/gshot.sh scenes/settings.tscn /tmp/gdr09_settings.png 8`, then LOOK at the PNG with the Read tool and describe it in your final reply (what is where, anything overlapping, anything off screen). If the screenshot step fails because the card it needs is not merged, say so, do not fake it.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Applying the settings (GDR31). Real CRT shader (GDA).

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDR09: Settings overlay: toggles, erase save, back`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
