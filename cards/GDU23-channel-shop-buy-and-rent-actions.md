[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDU23 Channel SHOP: buy and rent actions

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDU23
Needs (already merged into `dev`): GDU13
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Add BUY and RENT to the SHOP channel: two 72 px buttons that call `game.act('buy_car' / 'rent_car')`, with a refusal explained by a toast BEFORE any action is sent (same order as tvshop.js), and OK on the remote buying or renting the selected car.

## Read first
- docs/GODOT.md (the plan: layout zones, the TV is the centre, tap rule, 64 px touch targets)
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` (it is a RefCounted, so there is NO scene and NO `await`); every `func test_*() -> void` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `tree()` (the SceneTree), `autoload(name)`. To test a node: `tree().root.add_child(n)` and finish the test with `n.free()`. Never wait for frames: every animated widget has `advance(dt)` (seconds) so a test steps time by hand. Mouse input is simulated by calling the widget's public `handle_event(ev)`; copy this helper into the test file: `func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:` creating `InputEventMouseButton.new()` with `button_index = MOUSE_BUTTON_LEFT`, `pressed = down`, `position = pos`
- godot/tv/channel_base.gd (GDU12: `ChannelBase`, the channel contract, `_paint()`, `refresh()`, `toast()`, `model_of()`, `paint_of()`)
- godot/tv/shop_channel.gd (GDU13)
- godot/ui/button.gd (GDU02: `UiButton`: `text`, `kind`, `enabled`, signals `activated` and `blocked`, `handle_event(ev)`, `activate()`)
- godot/tests/fake_game.gd (GDU28: `TestFakeGame`, a stand-in for Game with `state`, `act()`, `acts`, `toasts`, `next_result`, signals `changed`, `toast_requested`)
- src/ui/scenes/tvshop.js (buyRefusal, rentRefusal, actBuy, actRent) and src/sim/actions.js (buyCar / rentCar messages)
- godot/autoload/game.gd (GDF10: failed actions are toasted by Game itself; do NOT toast a failed result again)

## Files you may change (and nothing else)
- `godot/tv/shop_channel.gd`
- `godot/tests/test_shop_actions.gd`

## Steps
1. Edit `godot/tv/shop_channel.gd`. Add `static func refusal(st: Dictionary, listing: Dictionary, mode: String) -> String` (`""` means fine), checked in this order: (1) `listing.is_empty()` or `listing.get("mode", "") != mode` -> `"That one is not for sale"` when `mode == "sale"` else `"That one is not for rent"`; (2) `st.cars.size() >= int(st.garageSlots)` -> `"No free garage slot"`; (3) `float(st.cash) < float(listing.price)` -> `"Not enough money"`; else `""`.
2. In `_ready()` add two `UiButton`s: `BuyBtn` (`text = "BUY"`, `kind = "primary"`) at `Vector2(316, 376)` size `Vector2(150, 72)` and `RentBtn` (`text = "RENT"`) at `Vector2(482, 376)` size `Vector2(150, 72)`. Connect `activated` AND `blocked` of each to `_do_buy` / `_do_rent`. Add `func _do_buy() -> void: _do("sale")` and `func _do_rent() -> void: _do("rent")`. `func _do(mode: String) -> void`: `var l := selected_listing()`; `var why := ShopChannel.refusal(state(), l, mode)`; if `why != ""`: `toast(why)` and return; `var res: Dictionary = game.act("buy_car" if mode == "sale" else "rent_car", {"listing_id": l.listingId})`; if `res.get("ok", false)`: `toast(str(res.get("msg", "")))` (a failure is already toasted by Game). `func on_ok() -> void`: `var l := selected_listing()`; `if l.is_empty(): return`; `_do(str(l.mode))`.
3. In `refresh()` (after the existing lines) set the enabled flags so the buttons grey out like the JS: `var l := selected_listing()`; `BuyBtn.enabled = ShopChannel.refusal(state(), l, "sale") == ""`; `RentBtn.enabled = ShopChannel.refusal(state(), l, "rent") == ""`. Disabled buttons still emit `blocked` on tap, which runs the same `_do` and so explains the refusal with a toast.
4. `godot/tests/test_shop_actions.gd` (channel `c` from `res://tv/shop_channel.tscn` entered with a `TestFakeGame` `g`; helper `_tap(btn)` presses at (10, 10) and releases at (12, 12) through `btn.handle_event`). `test_refusal`: with `g.state`: L1 sale price 4000, cash 12345, 2 cars of 3 slots: `ShopChannel.refusal(st, L1, "sale") == ""`; `refusal(st, L1, "rent") == "That one is not for rent"`; `refusal(st, L2, "sale") == "That one is not for sale"`; `refusal(st, {}, "sale") == "That one is not for sale"`; with `st.cash = 100`: `"Not enough money"`; with `st.cars` holding 3 cars (append a copy of c1): `"No free garage slot"` (checked BEFORE money: set cash 100 as well and still expect the slot message). `test_buy`: selected L1; `_tap(c.get_node("BuyBtn"))`: `g.acts == [{"action": "buy_car", "params": {"listing_id": "L1"}}]`; the success text (`"Done"` from the fake) is in `g.toasts`. `test_rent_selected_buy_refused`: `get_node("List").select(1, true)` (L2 is for rent): `_tap(BuyBtn)`: `g.acts` is empty and `g.toasts == ["That one is not for sale"]`; then `_tap(RentBtn)`: act `rent_car` with `listing_id` "L2". `test_failure_not_toasted_twice`: `g.next_result = {"ok": false, "msg": "No way"}`; `_tap(BuyBtn)`: `g.toasts == ["No way"]` (exactly once: the fake toasts failures like the real Game and the channel adds nothing). `test_enabled_flags`: initially `BuyBtn.enabled` true and `RentBtn.enabled` false (L1 is a sale); after `select(1, true)` the flags flip; with `g.state.cash = 100` plus `g.changed.emit()` both are false. `test_ok_button`: `c.on_ok()` with L1 selected sends `buy_car`; with L2 selected sends `rent_car`; with an empty board sends nothing. Free `c` at the end of each test.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_shop_actions` last line is `GDTEST OK`.
- `sh tools/godot/gtest.sh test_shop_channel` last line is `GDTEST OK`.
- Screenshot step: run `sh tools/godot/gshot.sh tests/shots/shop_shot.tscn /tmp/shop.png 8`, then LOOK at /tmp/shop.png with the Read tool and describe in your final reply what you see (is the text readable, does anything overlap or run off the 640x448 screen, are the buttons visible). Fix what is wrong. The BUY and RENT buttons must now be visible along the bottom of the right half.
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDU23: Channel SHOP: buy and rent actions`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
