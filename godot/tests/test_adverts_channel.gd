extends "res://tests/harness.gd"

# Tests for the ADVERTS channel (tv/adverts_channel.gd) and its numbers (tv/adverts_math.gd).
# _ready does not fire under the runner, so each scene test adds the channel to the tree and calls _ready by hand.


func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:
	var ev := InputEventMouseButton.new()
	ev.button_index = MOUSE_BUTTON_LEFT
	ev.pressed = down
	ev.position = pos
	return ev


func _tap(b: Control) -> void:
	var pos := Vector2(20, 20)
	b.handle_event(_mb(pos, true))
	b.handle_event(_mb(pos, false))


func _make() -> AdvertsChannel:
	var c := (load("res://tv/adverts_channel.tscn") as PackedScene).instantiate() as AdvertsChannel
	tree().root.add_child(c)
	c.call("_ready")
	return c


func test_math() -> void:
	var med := {"outcomes": [{"w": 30, "buzz": 0, "rep": 0}, {"w": 60, "buzz": 8, "rep": 0}, {"w": 10, "buzz": 20, "rep": 0}]}
	near(AdvertsMath.expected_buzz(med), 6.8, 1e-9, "expected buzz")
	eq(AdvertsMath.flop_chance(med), 30, "flop chance")
	eq(AdvertsMath.best_buzz(med), 20, "best buzz")
	eq(AdvertsMath.pays(med), 1, "pays rounds 0.68 to 1")
	eq(AdvertsMath.best_buzz({"outcomes": []}), 0, "best buzz of no outcomes")
	var med2 := {"outcomes": [{"w": 10, "buzz": 5, "rep": 0}, {"w": 90, "buzz": 6, "rep": 0}]}
	eq(AdvertsMath.flop_chance(med2), 10, "buzz 5 counts as a flop, buzz 6 does not")


func test_real_data() -> void:
	var paper := Data.advert_by_id("paper")
	ok(AdvertsMath.flop_chance(paper) >= 0, "paper flop chance is not negative")
	var p := AdvertsMath.pays(paper)
	ok(p >= 0 and p <= 10, "paper pays is 0..10")
	var ads: Array = Data.adverts()
	eq(ads.size(), 7, "seven media")
	for m in ads:
		var total := 0
		for o in m.get("outcomes", []):
			total += int(o.w)
		eq(total, 100, "weights of %s sum to 100" % m.get("id"))


func test_result_lines() -> void:
	eq(AdvertsMath.result_lines({"msg": "It worked.", "outcome": {"buzz": 8, "rep": 0}}), ["It worked.", "Buzz +8"], "buzz line")
	eq(AdvertsMath.result_lines({"msg": "It worked.", "outcome": {"buzz": 0, "rep": -2}}), ["It worked.", "Reputation -2"], "reputation line")
	var none := AdvertsMath.result_lines({"msg": "Meh.", "outcome": {"buzz": 0, "rep": 0}})
	eq(none[none.size() - 1], "Nothing much changed.", "nothing changed line")


func test_enter() -> void:
	var c := _make()
	var g := TestFakeGame.new()
	c.enter(g)
	eq(c.List.count, Data.adverts().size(), "one row per medium")
	eq(c.List.selected, 0, "first row selected")
	eq(c.RunBtn.text, "RUN ADVERT " + CoreFormat.money(float(c.medium().get("cost", 0))), "run button text")
	ok(c.RunBtn.enabled, "run button enabled with cash")
	ok(c.RunBtn.size.y >= 72.0, "run button is at least 72 px tall")
	c.leave()
	c.free()


func test_select_row_updates_cost() -> void:
	var c := _make()
	var g := TestFakeGame.new()
	c.enter(g)
	# Row 1 spans y 72..144 in the list; press and release on it without a drag selects it.
	c.List.handle_event(_mb(Vector2(20, 100), true))
	c.List.handle_event(_mb(Vector2(20, 100), false))
	eq(c.List.selected, 1, "tapping row 1 selects it")
	eq(c.RunBtn.text, "RUN ADVERT " + CoreFormat.money(float(Data.adverts()[1].get("cost", 0))), "run button shows the selected medium's cost")
	c.leave()
	c.free()


func test_run() -> void:
	var c := _make()
	var g := TestFakeGame.new()
	c.enter(g)
	_tap(c.RunBtn)
	eq(g.acts, [{"action": "advertise", "params": {"media_id": Data.adverts()[0].get("id")}}], "one advertise act for the first medium")
	ok(not c.result.is_empty(), "result panel is showing")
	ok(c.OkBtn.visible and not c.RunBtn.visible, "OK replaces RUN ADVERT")
	eq(c.on_back(), true, "BACK dismisses the result")
	ok(c.result.is_empty(), "result is gone after BACK")
	ok(c.RunBtn.visible and not c.OkBtn.visible, "RUN ADVERT is back")
	eq(c.on_back(), false, "BACK with no result is not handled")
	c.leave()
	c.free()


func test_poor() -> void:
	var c := _make()
	var g := TestFakeGame.new()
	c.enter(g)
	g.state["cash"] = 1
	g.changed.emit()
	eq(c.RunBtn.enabled, false, "run button disabled without the cash")
	_tap(c.RunBtn)
	eq(g.acts, [], "no act when the cash cannot cover the cost")
	eq(g.toasts, ["Not enough money"], "a toast explains why")
	c.leave()
	c.free()


func test_ok_key() -> void:
	var c := _make()
	var g := TestFakeGame.new()
	c.enter(g)
	c.on_ok()
	eq(g.acts.size(), 1, "OK with no result runs the advert")
	ok(not c.result.is_empty(), "OK shows the result")
	c.on_ok()
	eq(g.acts.size(), 1, "OK with a result does not run again")
	ok(c.result.is_empty(), "OK with a result dismisses it")
	c.leave()
	c.free()


func test_failed_act() -> void:
	var c := _make()
	var g := TestFakeGame.new()
	g.next_result = {"ok": false, "msg": "Nope"}
	c.enter(g)
	_tap(c.RunBtn)
	ok(c.result.is_empty(), "a failed act shows no result")
	eq(g.toasts, ["Nope"], "the failure message is toasted")
	c.leave()
	c.free()
