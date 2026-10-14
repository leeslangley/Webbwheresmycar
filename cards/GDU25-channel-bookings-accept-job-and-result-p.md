[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDU25 Channel BOOKINGS: accept job and result panel

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDU25
Needs (already merged into `dev`): GDU17
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Add ACCEPT JOB to the BOOKINGS channel: it explains every refusal with a toast before acting, calls `game.act('accept_job')`, then shows the job RESULT (type, money, the funny text) on a result panel that OK or BACK dismisses.

## Read first
- docs/GODOT.md (the plan: layout zones, the TV is the centre, tap rule, 64 px touch targets)
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` (it is a RefCounted, so there is NO scene and NO `await`); every `func test_*() -> void` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `tree()` (the SceneTree), `autoload(name)`. To test a node: `tree().root.add_child(n)` and finish the test with `n.free()`. Never wait for frames: every animated widget has `advance(dt)` (seconds) so a test steps time by hand. Mouse input is simulated by calling the widget's public `handle_event(ev)`; copy this helper into the test file: `func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:` creating `InputEventMouseButton.new()` with `button_index = MOUSE_BUTTON_LEFT`, `pressed = down`, `position = pos`
- godot/tv/channel_base.gd (GDU12: `ChannelBase`, the channel contract, `_paint()`, `refresh()`, `toast()`, `model_of()`, `paint_of()`)
- godot/ui/button.gd (GDU02: `UiButton`: `text`, `kind`, `enabled`, signals `activated` and `blocked`, `handle_event(ev)`, `activate()`)
- godot/ui/ui_text.gd (GDU31: `UiText.wrap(text, max_chars, max_lines) -> Array[String]`, `ellipsize(text, max_chars)`, `pips(n)`)
- godot/tests/fake_game.gd (GDU28: `TestFakeGame`, a stand-in for Game with `state`, `act()`, `acts`, `toasts`, `next_result`, signals `changed`, `toast_requested`)
- Channel screens are 640x448 (the SubViewport inside the TV) and are shown at 600x420 on the glass (scale 0.9375), so every interactive control inside a channel is at least 72x72 channel px (72 * 0.9375 = 67.5 stage px, above the 64 px rule).
- godot/tv/bookings_channel.gd (GDU17)
- src/ui/scenes/bookings.js `onAccept` (the exact refusal messages and order)
- src/sim/jobresolve.js acceptJob (the result `{ok, msg, outcome: {type, paid, wear, faultLabel}}` where type is success, mishap, breakdown or disaster; `paid` is negative for compensation)
- godot/autoload/game.gd (GDF10: failed actions are toasted by Game itself)

## Files you may change (and nothing else)
- `godot/tv/bookings_channel.gd`
- `godot/tests/shots/bookings_result_shot.tscn`
- `godot/tests/test_bookings_actions.gd`

## Steps
1. Edit `godot/tv/bookings_channel.gd`. Add `var result: Dictionary = {}` (empty = no result showing). Add `static func accept_refusal(st: Dictionary, req: Dictionary, car: Dictionary, model: Dictionary) -> String` (`""` = fine), in the order of the JS `onAccept`: `car.is_empty()` -> `"Pick a car first"`; the car has a fault or is impounded or the model is empty (`BookingsMath.block_reason` returns `"FAULT"` or `"IMPOUNDED"`) -> `"That car is not fit to go out"`; `req.is_empty()` -> `"Pick a booking first"`; `BookingsMath.eff_d(...) < req.minDesirability` -> `"That car is too plain for this booking"`; `eff_r < req.minReliability` -> `"That car is too flaky for this booking"`; `car.condition < req.minCondition` -> `"That car is too scruffy for this booking"`; else `""`.
2. Add `AcceptBtn` in `_ready()` (`UiButton`, kind "primary", `Rect2(8, 376, 624, 72)`, `activated` and `blocked` -> `_accept`) and `OkBtn` (`UiButton`, text "OK", the same rect, `visible = false`, `activated` -> `dismiss`). In `refresh()` set `AcceptBtn.text = "ACCEPT JOB " + (CoreFormat.money(req.fee) if a request is chosen else "")` and `AcceptBtn.enabled = accept_refusal(...) == ""`. `func _accept() -> void`: `var req := req_by_id(sel_req)`, `var car := car_by_id(sel_car)`, `var model := ChannelBase.model_of(str(car.get("modelId", "")))`; `var why := BookingsChannel.accept_refusal(state(), req, car, model)`; if `why != ""`: `toast(why)`, return; `var res: Dictionary = game.act("accept_job", {"request_id": req.id, "car_id": car.id})`; if `res.get("ok", false)`: `result = {"text": str(res.get("msg", "")), "type": str(res.get("outcome", {}).get("type", "success")), "paid": int(res.get("outcome", {}).get("paid", 0))}`; `sel_req = ""`; `sel_car = ""`; show the panel (`AcceptBtn.visible = false`, `OkBtn.visible = true`); `queue_redraw()`. `func dismiss() -> void`: `result = {}`; swap the buttons back; `refresh()`. `func on_ok() -> void: if result.is_empty(): _accept() else: dismiss()`. `func on_back() -> bool: if not result.is_empty(): dismiss(); return true`; `return false`.
3. Result drawing: `static func type_label(t: String) -> String`: `{"success": "JOB DONE", "mishap": "MISHAP", "breakdown": "BREAKDOWN", "disaster": "DISASTER"}.get(t, "JOB DONE")`. `static func paid_text(paid: int) -> String`: `paid > 0` -> `"Paid " + CoreFormat.money(paid)`; `paid < 0` -> `"Compensation " + CoreFormat.money(-paid)`; else `"Paid nothing"`. `static func type_color_name(t: String) -> String`: success "good", mishap "warn", breakdown and disaster "bad". When `result` is not empty `_paint()` draws ONLY the result panel (hide the Requests list and the strip while it shows: `refresh()` sets `Requests.visible`, `PrevBtn.visible`, `NextBtn.visible` to `result.is_empty()`, and a car slot is visible only when `result.is_empty()` and it has a car; `AcceptBtn.visible = result.is_empty()` and `OkBtn.visible = not result.is_empty()`; `_accept` sets `result` and then calls `refresh()` and `queue_redraw()`, and `dismiss()` clears `result` and calls `refresh()`): `UiTheme.draw_box(self, Rect2(8, 48, 624, 316), paper, ink, 4, true)`; the label `type_label` (role "h1", colour `UiTheme.color(type_color_name(type))`, centred, width 640) at y 62; `paid_text` (role "h2", ink, centred) at y 108; the text `UiText.wrap(result.text, 48, 6)` at x 28, y 156, pitch 26 (role "caption", ink).
4. `godot/tests/shots/bookings_result_shot.tscn`: like `bookings_shot.tscn` (GDU17) plus `metadata/calls = [["_test_show_result", [{"text": "Mrs Pym wept into a very good hankie. The Reliable Robbin swept up to the church as the bells rang.", "type": "success", "paid": 900}]]]`. Add to `bookings_channel.gd` the public helper `func _test_show_result(r: Dictionary) -> void: result = r; show the panel exactly as `_accept` does` (the screenshot uses it).
5. `godot/tests/test_bookings_actions.gd` (channel from `res://tv/bookings_channel.tscn`, entered with `TestFakeGame` `g`; helper `_tap(btn)`). Make car c1 a strong, healthy car first: in a helper `_strong(g)`: `g.state.cars[0].modelId = "t3_porshe"`, `g.state.cars[0].condition = 10.0`, then `g.changed.emit()`. `test_refusal_order`: pure `accept_refusal` with `req = g.state.requests[0]`: empty car -> `"Pick a car first"`; the faulty sample car c2 -> `"That car is not fit to go out"`; empty req with a good car -> `"Pick a booking first"`; `req.minDesirability = 99` -> `"That car is too plain for this booking"`; `req.minReliability = 99` (with D met) -> `"That car is too flaky for this booking"`; `req.minCondition = 11` (with D and R met) -> `"That car is too scruffy for this booking"`; a good match -> `""`. Use the model from `ChannelBase.model_of`. `test_labels`: `type_label("disaster") == "DISASTER"`, `type_label("zzz") == "JOB DONE"`; `paid_text(900) == "Paid " + CoreFormat.money(900)`; `paid_text(-250) == "Compensation " + CoreFormat.money(250)`; `paid_text(0) == "Paid nothing"`; `type_color_name("mishap") == "warn"`. `test_accept_flow`: `_strong(g)`; pick Q1 (`Requests.select(0, true)`), tap `Car0`, then `AcceptBtn.enabled` is true and its text is `"ACCEPT JOB " + CoreFormat.money(900)`; set `g.next_result = {"ok": true, "msg": "All went well.", "outcome": {"type": "success", "paid": 900, "wear": 0.3, "faultLabel": null}}`; `_tap(AcceptBtn)`: `g.acts == [{"action": "accept_job", "params": {"request_id": "Q1", "car_id": "c1"}}]`; `result.type == "success"`, `result.paid == 900`, `result.text == "All went well."`; `OkBtn.visible`, not `AcceptBtn.visible`, not `Requests.visible`; `sel_req == ""`. `test_dismiss`: `on_back()` returns true and the panel is gone (`result.is_empty()`, `Requests.visible`); `on_back()` again returns false. `test_refused_tap`: nothing chosen: `_tap(AcceptBtn)` (disabled, so `blocked` fires): `g.acts` is empty and `g.toasts == ["Pick a car first"]`. `test_failed_act`: `g.next_result = {"ok": false, "msg": "Expired"}`; accept: `result.is_empty()` and `g.toasts == ["Expired"]`. `test_ok_key`: `on_ok()` accepts when ready and dismisses when a result shows. `test_sizes`: `AcceptBtn.size.y >= 72.0`. Free nodes after each test.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_bookings_actions` last line is `GDTEST OK`.
- `sh tools/godot/gtest.sh test_bookings_channel` last line is `GDTEST OK`.
- `sh tools/godot/gshot.sh tests/shots/bookings_result_shot.tscn /tmp/bookings_result.png 8`, LOOK at /tmp/bookings_result.png and describe it (expected: a paper panel with a big green JOB DONE, Paid and the amount, then the wrapped result text, and an OK button along the bottom).
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDU25: Channel BOOKINGS: accept job and result panel`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
