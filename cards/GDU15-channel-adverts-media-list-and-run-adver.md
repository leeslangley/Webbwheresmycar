[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDU15 Channel ADVERTS: media list and run advert

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDU15
Needs (already merged into `dev`): GDU12, GDU18, GDU02, GDU31, GDF03, GDF07
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
The ADVERTS channel (port of src/ui/scenes/adverts.js): Mark's seven advertising media in a list with cost, PAYS pips and RISK %, a detail panel with the blurb and numbers, a BUZZ meter and a RUN ADVERT button that calls `game.act('advertise')` and shows the funny result.

## Read first
- docs/GODOT.md (the plan: layout zones, the TV is the centre, tap rule, 64 px touch targets)
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` (it is a RefCounted, so there is NO scene and NO `await`); every `func test_*() -> void` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `tree()` (the SceneTree), `autoload(name)`. To test a node: `tree().root.add_child(n)` and finish the test with `n.free()`. Never wait for frames: every animated widget has `advance(dt)` (seconds) so a test steps time by hand. Mouse input is simulated by calling the widget's public `handle_event(ev)`; copy this helper into the test file: `func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:` creating `InputEventMouseButton.new()` with `button_index = MOUSE_BUTTON_LEFT`, `pressed = down`, `position = pos`
- godot/tv/channel_base.gd (GDU12: `ChannelBase`, the channel contract, `_paint()`, `refresh()`, `toast()`, `model_of()`, `paint_of()`)
- godot/ui/list.gd (GDU18: `UiList`)
- godot/ui/button.gd (GDU02: `UiButton`: `text`, `kind`, `enabled`, signals `activated` and `blocked`, `handle_event(ev)`, `activate()`)
- godot/ui/ui_text.gd (GDU31: `UiText.wrap(text, max_chars, max_lines) -> Array[String]`, `ellipsize(text, max_chars)`, `pips(n)`)
- godot/ui/ui_theme.gd (GDU01: `UiTheme.color(name)`, `font_for(role)`, `size_for(role)`, `draw_box`, `draw_text`, `draw_bar`, `TOUCH`)
- godot/tests/fake_game.gd (GDU28: `TestFakeGame`, a stand-in for Game with `state`, `act()`, `acts`, `toasts`, `next_result`, signals `changed`, `toast_requested`)
- Channel screens are 640x448 (the SubViewport inside the TV) and are shown at 600x420 on the glass (scale 0.9375), so every interactive control inside a channel is at least 72x72 channel px (72 * 0.9375 = 67.5 stage px, above the 64 px rule).
- src/ui/scenes/adverts.js (read it all: expectedBuzz, flopChance, bestBuzz, rows, detail)
- src/sim/adsim.js (the result: `{ok, msg, outcome: {id, buzz, rep, mediaId}}`)
- godot/autoload/data.gd (GDF03: `Data.adverts()`, `Data.advert_by_id(id)`)

## Files you may change (and nothing else)
- `godot/tv/adverts_math.gd`
- `godot/tv/adverts_channel.gd`
- `godot/tv/adverts_channel.tscn`
- `godot/tests/shots/adverts_shot.tscn`
- `godot/tests/test_adverts_channel.gd`

## Steps
1. `godot/tv/adverts_math.gd`: `class_name AdvertsMath`, `extends RefCounted`, static. `static func expected_buzz(medium: Dictionary) -> float`: sum over `medium.outcomes` of `float(o.w) * float(o.buzz)`, divided by 100.0. `static func flop_chance(medium: Dictionary) -> int`: sum of `int(o.w)` over outcomes with `o.buzz <= 5`. `static func best_buzz(medium: Dictionary) -> int`: the largest `o.buzz` (0 if none). `static func pays(medium: Dictionary) -> int: return int(floor(expected_buzz(medium) / 10.0 + 0.5))` (JS Math.round of eb/10). `static func result_lines(res: Dictionary) -> Array[String]`: for a successful act result: `UiText.wrap(str(res.msg), 40, 5)` followed by `"Buzz " + sign + str(abs(buzz))` and `"Reputation " + sign + str(abs(rep))` lines for the values in `res.outcome` that are not zero (sign `+` or `-`); if both are zero add `"Nothing much changed."`.
2. `godot/tv/adverts_channel.tscn` (text scene, exactly: `[gd_scene load_steps=2 format=3]`, blank line, `[ext_resource type="Script" path="res://tv/adverts_channel.gd" id="1"]`, blank line, `[node name="AdvertsChannel" type="Control"]`, then `script = ExtResource("1")`)
3. `godot/tv/adverts_channel.gd`: `class_name AdvertsChannel`, `extends ChannelBase`. `_init`: `super()`; `title = "ADVERTS"`. Vars `result: Array[String] = []` (non-empty = the result panel is showing). `_ready()`: `List` (`UiList` at `Rect2(8, 76, 300, 292)`, `row_h = 72`, `row_painter = _paint_row`, `set_count(Data.adverts().size())`, `select(0)`; `row_tapped` -> `queue_redraw()`), `RunBtn` (`UiButton`, kind "primary", `Vector2(316, 376)`, size `Vector2(316, 72)`, `activated` and `blocked` -> `_run`), `OkBtn` (`UiButton`, `text = "OK"`, `Vector2(316, 376)`, size `Vector2(316, 72)`, `visible = false`, `activated` -> `dismiss`). `func medium() -> Dictionary`: `Data.adverts()[List.selected]` for a valid selection else `{}`. `func refresh() -> void`: update the button text and enabled state: `RunBtn.text = "RUN ADVERT " + CoreFormat.money(medium().cost)`; `RunBtn.enabled = float(state().get("cash", 0)) >= float(medium().cost)`; `queue_redraw()`.
4. Action: `func _run() -> void`: `var m := medium()`; if `m.is_empty()` return; if `float(state().cash) < float(m.cost)`: `toast("Not enough money")` and return; `var res: Dictionary = game.act("advertise", {"media_id": m.id})`; if `res.get("ok", false)`: `result = AdvertsMath.result_lines(res)`; `RunBtn.visible = false`; `OkBtn.visible = true`; `queue_redraw()`. (A failed act is already toasted by Game.) `func dismiss() -> void`: `result = []`, `RunBtn.visible = true`, `OkBtn.visible = false`, `queue_redraw()`. `func on_ok() -> void: if result.is_empty(): _run() else: dismiss()`. `func on_back() -> bool: if not result.is_empty(): dismiss(); return true`; `return false`.
5. Drawing. Row painter `func _paint_row(list: Control, i: int, r: Rect2, sel: bool) -> void`: `var m: Dictionary = Data.adverts()[i]`; box paper/ink as in the SHOP rows; medium name `UiText.ellipsize(m.name, 17)` (role "caption", ink) at `r.position + Vector2(12, 4)`; cost right-aligned (role "caption", colour "darkgrey") at the right edge; line 2 at y + 34: `"PAYS " + UiText.pips(AdvertsMath.pays(m))` (role "caption", colour "good") on the left and `"RISK %d%%" % AdvertsMath.flop_chance(m)` right-aligned (colour "bad"). Selected row: 4 px "lamp" outline. `_paint()`: BUZZ meter at the top: `"BUZZ %d" % int(round(float(state().get("buzz", 0))))` (role "h3", colour "phosphor") at (8, 50) and a bar `UiTheme.draw_bar(self, Rect2(160, 50, 300, 16), buzz / 100.0, UiTheme.color("good"))`. Detail panel `UiTheme.draw_box(self, Rect2(316, 76, 316, 292), paper, ink, 4, false)`: when `result` is empty: name (role "h3", ink) `UiText.ellipsize(m.name.to_upper(), 18)` at (328, 88); blurb `UiText.wrap(m.blurb, 29, 5)` lines (role "caption", ink) from y 116, pitch 22; then four lines (role "caption") at y 236, 260, 284, 308: `"Cost " + CoreFormat.money(m.cost)`, `"Typical buzz +%d" % int(round(AdvertsMath.expected_buzz(m)))`, `"Chance of a flop %d%%" % AdvertsMath.flop_chance(m)`, `"Best case +%d buzz" % AdvertsMath.best_buzz(m)`. When `result` is not empty: heading "THE RESULT" (role "h3") and the lines at y 116 + k * 26 (role "caption", ink; lines starting with "Buzz +" in "good", "-" ones in "bad").
6. `godot/tests/shots/adverts_shot.tscn` (text scene, exactly: `[gd_scene load_steps=2 format=3]`, blank line, `[ext_resource type="Script" path="res://tests/shots/channel_shot.gd" id="1"]`, blank line, `[node name="Shot" type="Control"]`, then the lines `layout_mode = 3`, `anchors_preset = 15`, `anchor_right = 1.0`, `anchor_bottom = 1.0`, `script = ExtResource("1")`, `metadata/channel = "res://tv/adverts_channel.tscn"`)
7. `godot/tests/test_adverts_channel.gd`: `test_math`: `var med := {"outcomes": [{"w": 30, "buzz": 0, "rep": 0}, {"w": 60, "buzz": 8, "rep": 0}, {"w": 10, "buzz": 20, "rep": 0}]}`: `expected_buzz(med)` near 6.8 (eps 1e-9); `flop_chance(med) == 30`; `best_buzz(med) == 20`; `pays(med) == 1` (0.68 rounds to 1); `best_buzz({"outcomes": []}) == 0`. A medium with outcomes buzz 5 (w 10) and buzz 6 (w 90) has `flop_chance == 10`. `test_real_data`: for the paper medium `Data.advert_by_id("paper")`: `flop_chance` >= 0 and `pays` between 0 and 10; the sum of outcome weights is 100 for every medium in `Data.adverts()` (via `flop_chance` is not needed: sum `w` directly). `test_result_lines`: `result_lines({"msg": "It worked.", "outcome": {"buzz": 8, "rep": 0}})` equals `["It worked.", "Buzz +8"]`; `{"buzz": 0, "rep": -2}` gives `[..., "Reputation -2"]`; both 0 gives a last line `"Nothing much changed."`. Scene tests (instantiate `res://tv/adverts_channel.tscn`, add to the tree, `enter(TestFakeGame)`): `test_enter`: `List.count == Data.adverts().size()` (7); `List.selected == 0`; `RunBtn.text == "RUN ADVERT " + CoreFormat.money(medium().cost)`; `RunBtn.enabled` true; `RunBtn.size.y >= 72.0`. `test_run`: tap `RunBtn`: `g.acts == [{"action": "advertise", "params": {"media_id": <first medium id>}}]`; `result` is non-empty and `OkBtn.visible` and not `RunBtn.visible`; `on_back()` returns true and the result is gone; a second `on_back()` returns false. `test_poor`: `g.state.cash = 1` + `g.changed.emit()`: `RunBtn.enabled` false; tapping it sends NO act and `g.toasts == ["Not enough money"]`. `test_ok_key`: `on_ok()` with no result runs the advert; `on_ok()` with a result dismisses. `test_failed_act`: `g.next_result = {"ok": false, "msg": "Nope"}`; tap `RunBtn`: `result` stays empty and `g.toasts == ["Nope"]`. Free after each test.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_adverts_channel` last line is `GDTEST OK`.
- Screenshot step: run `sh tools/godot/gshot.sh tests/shots/adverts_shot.tscn /tmp/adverts.png 8`, then LOOK at /tmp/adverts.png with the Read tool and describe in your final reply what you see (is the text readable, does anything overlap or run off the 640x448 screen, are the buttons visible). Fix what is wrong.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDU15: Channel ADVERTS: media list and run advert`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
