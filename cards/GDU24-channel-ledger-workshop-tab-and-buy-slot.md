[Project: Webbwheresmycar]
# Task: [GLM-SPARK] DeepSeek-V4.1-Flash GDU24 Channel LEDGER: workshop tab and buy slot

From: Claude Code (Sonnet 5.5, Webbwheresmycar session on Lee's Mac)
Source: Lee (10 Oct 2026): "create an iphone game, that could also play via a computer browser ... heavily inspired by the classic computer game Rockstar ate my hamster ... The title is Webb, wheres my car?"
Priority: normal
Card id: GDU24
Needs (already merged into `dev`): GDU16, GDU02
Project folder: ~/Documents/WebbWheresmycar
Working copy: ~/wt/webbwheresmycar/<stem> (branch card/<stem>), branched from `dev`
Worker: GLM-SPARK (DeepSeek-V4.1-Flash via glm-worker). DawnBot/Grok: do not pick up.
Reviewer: glm-reviewer (Sonnet 5.5)
Commit: local only
Deploy: no

## Goal
Add the WORKSHOP tab to the LEDGER channel (the garage board: bays in use and BUY EXTRA SLOT, port of drawWorkshop in ledger.js). A TAB button swaps the books for the workshop; BUY SLOT calls `game.act('buy_slot')`.

## Read first
- docs/GODOT.md (the plan: layout zones, the TV is the centre, tap rule, 64 px touch targets)
- godot/tests/harness.gd (GDF02): a test file starts with `extends "res://tests/harness.gd"` (it is a RefCounted, so there is NO scene and NO `await`); every `func test_*() -> void` runs; helpers `ok(cond, msg)`, `eq(a, b, msg)`, `near(a, b, eps, msg)`, `tree()` (the SceneTree), `autoload(name)`. To test a node: `tree().root.add_child(n)` and finish the test with `n.free()`. Never wait for frames: every animated widget has `advance(dt)` (seconds) so a test steps time by hand. Mouse input is simulated by calling the widget's public `handle_event(ev)`; copy this helper into the test file: `func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:` creating `InputEventMouseButton.new()` with `button_index = MOUSE_BUTTON_LEFT`, `pressed = down`, `position = pos`
- godot/tv/channel_base.gd (GDU12: `ChannelBase`, the channel contract, `_paint()`, `refresh()`, `toast()`, `model_of()`, `paint_of()`)
- godot/ui/button.gd (GDU02: `UiButton`: `text`, `kind`, `enabled`, signals `activated` and `blocked`, `handle_event(ev)`, `activate()`)
- godot/tests/fake_game.gd (GDU28: `TestFakeGame`, a stand-in for Game with `state`, `act()`, `acts`, `toasts`, `next_result`, signals `changed`, `toast_requested`)
- Channel screens are 640x448 (the SubViewport inside the TV) and are shown at 600x420 on the glass (scale 0.9375), so every interactive control inside a channel is at least 72x72 channel px (72 * 0.9375 = 67.5 stage px, above the 64 px rule).
- godot/tv/ledger_channel.gd (GDU16)
- src/ui/scenes/ledger.js (drawWorkshop, BAYS, MAX_SLOTS 8, SLOT_COST 3000) and src/sim/actions.js buySlot

## Files you may change (and nothing else)
- `godot/tv/ledger_channel.gd`
- `godot/tests/shots/ledger_workshop_shot.tscn`
- `godot/tests/test_ledger_workshop.gd`

## Steps
1. Edit `godot/tv/ledger_channel.gd`. Add consts `MAX_SLOTS := 8`, `SLOT_COST := 3000`; var `tab: String = "books"`; `static func slot_refusal(st: Dictionary) -> String`: `int(st.garageSlots) >= 8` -> `"Garage is full-size already"`; `float(st.cash) < 3000.0` -> `"Not enough money"`; else `""`. `func set_tab(t: String) -> void`: `tab = "workshop" if t == "workshop" else "books"`; update visibility: `Chart.visible = (tab == "books")`, `BuySlotBtn.visible = (tab == "workshop")`; `TabBtn.text = "WORKSHOP" if tab == "books" else "BOOKS"`; `queue_redraw()`.
2. In `_ready()` add `TabBtn` (`UiButton`, `Vector2(8, 376)`, size `Vector2(200, 72)`, `text = "WORKSHOP"`, `activated` -> `func(): set_tab("workshop" if tab == "books" else "books")`) and `BuySlotBtn` (`UiButton`, kind "primary", `Vector2(232, 376)`, size `Vector2(400, 72)`, `text` set in `refresh()` to `"BUY SLOT " + CoreFormat.money(SLOT_COST)`, `visible = false`, `activated` and `blocked` -> `_buy_slot`). `func _buy_slot() -> void`: `var why := LedgerChannel.slot_refusal(state())`; if `why != ""`: `toast(why)`, return; `var res: Dictionary = game.act("buy_slot")`; on `ok` `toast(str(res.msg))`. `refresh()` also sets `BuySlotBtn.enabled = LedgerChannel.slot_refusal(state()) == ""`. `func on_ok() -> void: if tab == "workshop": _buy_slot()`. `func on_back() -> bool: if tab == "workshop": set_tab("books"); return true`; `return false`. `_on_enter` sets the tab to "books".
3. `_paint()`: in the "workshop" tab skip the books/plates/chart drawing and draw instead: board `UiTheme.draw_box(self, Rect2(8, 48, 624, 316), paper, ink, 4, false)`; heading "WORKSHOP BOARD" (role "h3") at (24, 58); `"Garage slots %d/%d" % [slots, 8]` right-aligned (role "caption") at y 58; the label "Garage bays" (role "caption", colour "darkgrey") at (24, 120); the bays: for `i` in `0..slots-1`: `Rect2(24 + i * 74, 150, 68, 80)` filled with `good` when `i < cars.size()` else `cream` (via `draw_box`, 4 px ink border, no shadow), number `i + 1` centred (role "h3", colour white or darkgrey); below, at y 250, a caption line `"%d of %d bays in use" % [cars.size(), slots]` (role "caption", ink). The books drawing from GDU16 only runs in the "books" tab.
4. `godot/tests/shots/ledger_workshop_shot.tscn`: the same shape as `ledger_shot.tscn` (GDU16) with `metadata/channel = "res://tv/ledger_channel.tscn"` and one more line `metadata/calls = [["set_tab", ["workshop"]]]`.
5. `godot/tests/test_ledger_workshop.gd` (scene `res://tv/ledger_channel.tscn` entered with a `TestFakeGame` `g`; helper `_tap(btn)` as in the SHOP card): `test_refusal`: `slot_refusal(sample)` is `""` (cash 12345, 3 slots); `garageSlots = 8` -> `"Garage is full-size already"` (even with cash 0); `cash = 2999` -> `"Not enough money"`. `test_tabs`: `tab == "books"`, `Chart.visible`, not `BuySlotBtn.visible`; `_tap(TabBtn)`: `tab == "workshop"`, `TabBtn.text == "BOOKS"`, `BuySlotBtn.visible`, not `Chart.visible`; `_tap(TabBtn)` again returns to books. `test_buy`: in the workshop tab `_tap(BuySlotBtn)`: `g.acts == [{"action": "buy_slot", "params": {}}]` and the success text is toasted. `test_refused_buy`: `g.state.cash = 10` + `g.changed.emit()`: `BuySlotBtn.enabled` false; `_tap(BuySlotBtn)` sends no act and `g.toasts == ["Not enough money"]`. `test_back`: `on_back()` in the workshop returns true and goes to books; in books returns false. `test_button_sizes`: `TabBtn.size.y >= 72.0` and `BuySlotBtn.size.y >= 72.0`. Also re-run in the acceptance: the GDU16 test file must still pass.

## Acceptance (all must pass; exact commands)
- `sh tools/godot/gtest.sh test_ledger_workshop` last line is `GDTEST OK`.
- `sh tools/godot/gtest.sh test_ledger_channel` last line is `GDTEST OK`.
- `sh tools/godot/gshot.sh tests/shots/ledger_workshop_shot.tscn /tmp/ledger_workshop.png 8`, LOOK at /tmp/ledger_workshop.png and describe it (expected: a paper board with WORKSHOP BOARD, three bays (two filled green, one cream), a big BUY SLOT button with the price, a BOOKS tab button).
- `sh tools/godot/gtest.sh` last line is `GDTEST OK`.

## Out of scope (do not touch)
- Everything not listed under files.

## Rules
- Godot rebuild: read docs/GODOT.md first. Change only the files listed above (check `git status`). Scratch files go in /tmp.
- Godot NEVER runs on the Mac (it steals window focus): use `sh tools/godot/gtest.sh [test_name]` (headless on CASE; last line `GDTEST OK` or `GDTEST FAIL`) and `sh tools/godot/gshot.sh <scene> <out.png> [frames]` (screenshot via CASE; view the PNG with the Read tool). The JS reference (src/, tests/*.mjs) is the spec for ports: read the named JS file fully.
- GDScript: tabs, typed signatures, no `randf()`/`randi()`/`Time` in sim code (seeded rng only), no debug `print` left behind. Text for players: ASCII only, pound sign only via Format.money(), no real brands or people, no he/she/him/her for customers or named people.
- Write your first complete version within 10 turns, run the acceptance commands, commit with the message `GDU24: Channel LEDGER: workshop tab and buy slot`, then improve. Paste the real output of the acceptance commands in your final reply (for scene cards also say what the screenshot shows).
- Unclear or impossible within the files listed: finish with `STATUS: BLOCKED` and the question.
