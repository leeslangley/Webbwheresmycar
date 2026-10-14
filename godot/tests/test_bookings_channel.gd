extends "res://tests/harness.gd"

# Tests for the BOOKINGS channel display: the maths (tv/bookings_math.gd) and the channel scene
# (tv/bookings_channel.gd). _ready does not fire under the runner, so the scene tests build the channel
# by hand (add to the root, then call _ready) and drive taps through handle_event.


func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:
	var ev := InputEventMouseButton.new()
	ev.button_index = MOUSE_BUTTON_LEFT
	ev.pressed = down
	ev.position = pos
	return ev


# A press and release inside the control (the tap rule).
func _tap(c: Control) -> void:
	c.call("handle_event", _mb(Vector2(10, 10), true))
	c.call("handle_event", _mb(Vector2(10, 10), false))


func _make() -> BookingsChannel:
	var ch := (load("res://tv/bookings_channel.tscn") as PackedScene).instantiate() as BookingsChannel
	tree().root.add_child(ch)
	ch.call("_ready")
	return ch


func _done(ch: BookingsChannel) -> void:
	ch.leave()
	ch.free()


func test_math() -> void:
	var model := {"desirability": 5, "reliability": 4}
	var car := {"condition": 10.0, "fault": null, "impoundedUntil": 0}
	near(BookingsMath.eff_d(model, car), 5.0, 1e-9, "eff_d at condition 10 is D")
	near(BookingsMath.eff_r(model, car), 4.0, 1e-9, "eff_r at condition 10 is R")
	car.condition = 0.0
	near(BookingsMath.eff_d(model, car), 2.0, 1e-9, "eff_d at condition 0 is 0.4 D")
	near(BookingsMath.eff_r(model, car), 1.2, 1e-9, "eff_r at condition 0 is 0.3 R")


func test_block_reason() -> void:
	var st := {"day": 12}
	var req := {"minDesirability": 3, "minReliability": 3, "minCondition": 6}
	var strong := {"desirability": 5, "reliability": 4}
	var car := {"condition": 10.0, "fault": null, "impoundedUntil": 0}
	eq(BookingsMath.block_reason(st, car, req, strong), "", "a fine car has no reason")

	var faulty := car.duplicate()
	faulty.fault = {"label": "x"}
	eq(BookingsMath.block_reason(st, faulty, req, strong), "FAULT", "a fault blocks")

	var impounded := car.duplicate()
	impounded.impoundedUntil = 13
	eq(BookingsMath.block_reason(st, impounded, req, strong), "IMPOUNDED", "impounded until a later day blocks")
	impounded.impoundedUntil = 12
	eq(BookingsMath.block_reason(st, impounded, req, strong), "", "impounded until today is free")

	eq(BookingsMath.block_reason(st, car, req, {}), "FAULT", "an unknown model is a fault")

	var plain := {"desirability": 2, "reliability": 4}
	eq(BookingsMath.block_reason(st, car, req, plain), "TOO PLAIN", "desirability below the need")

	var flaky := {"desirability": 5, "reliability": 2}
	eq(BookingsMath.block_reason(st, car, req, flaky), "TOO FLAKY", "reliability below the need")

	# Condition 5 with a strong model: eff_d 5.6 and eff_r 5.2 both pass, so only the condition fails.
	var scruffy_car := car.duplicate()
	scruffy_car.condition = 5.0
	var scruffy_model := {"desirability": 8, "reliability": 8}
	eq(BookingsMath.block_reason(st, scruffy_car, req, scruffy_model), "TOO SCRUFFY", "condition below the need")

	var working := {"desirability": 1, "reliability": 1}
	eq(BookingsMath.block_reason(st, car, {}, working), "", "with no booking picked, a plain working car has no reason")


func test_owned_cars() -> void:
	var st := TestFakeGame.sample_state()
	var rented := {"id": "c3", "modelId": "t1_chimp", "owned": false, "condition": 6.0, "fault": null, "impoundedUntil": 0}
	var unknown := {"id": "c4", "modelId": "t9_nope", "owned": true, "condition": 6.0, "fault": null, "impoundedUntil": 0}
	st.cars.append(rented)
	st.cars.append(unknown)
	var got := BookingsMath.owned_cars(st, ChannelBase.models_by_id())
	var ids: Array = []
	for c in got:
		ids.append(c.id)
	eq(ids, ["c1", "c2"], "only the owned cars with known models, in order")


func test_days_left() -> void:
	eq(BookingsMath.days_left({"day": 12}, {"expiresDay": 14}), 2, "two days left")


func test_enter() -> void:
	var ch := _make()
	var g := TestFakeGame.new()
	ch.enter(g)
	eq(ch.Requests.count, 2, "two requests listed")
	eq(ch.title, "BOOKINGS", "title")
	ok(ch.Car0.visible, "first car slot shown")
	ok(ch.Car1.visible, "second car slot shown")
	ok(not ch.Car2.visible, "third car slot hidden with two cars")
	ok(ch.Car0.size.y >= 72.0, "car slot is at least 72 px tall")
	ok(not ch.PrevBtn.enabled, "no previous page")
	ok(not ch.NextBtn.enabled, "no next page")
	_done(ch)


func test_pick_request() -> void:
	var ch := _make()
	var g := TestFakeGame.new()
	ch.enter(g)
	ch.Requests.select(0, true)
	eq(ch.sel_req, "Q1", "selecting row 0 picks Q1")
	_done(ch)


func test_car_strip_reasons() -> void:
	var ch := _make()
	var g := TestFakeGame.new()
	ch.enter(g)
	ch.Requests.select(0, true)
	var want0: String = UiText.ellipsize(str(ChannelBase.model_of("t1_allergy")["name"]), 12) + "\nTOO PLAIN"
	eq(ch.Car0.text, want0, "car 0 names its model and why it cannot go")
	ok(not ch.Car0.enabled, "car 0 is greyed out")
	ok(ch.Car1.text.ends_with("\nFAULT"), "car 1 shows its fault")
	ok(not ch.Car1.enabled, "car 1 is greyed out")
	_done(ch)


func test_pick_car_refused() -> void:
	var ch := _make()
	var g := TestFakeGame.new()
	ch.enter(g)
	ch.Requests.select(0, true)
	_tap(ch.Car0)
	eq(ch.sel_car, "", "a car that is not fit cannot be picked")
	ok(g.toasts.size() == 1 and "too plain" in g.toasts[0], "the toast explains why")
	_done(ch)


func test_pick_car_ok() -> void:
	var ch := _make()
	var g := TestFakeGame.new()
	ch.enter(g)
	g.state.cars[0].modelId = "t3_porshe"
	g.state.cars[0].condition = 10.0
	g.changed.emit()
	ch.Requests.select(0, true)
	_tap(ch.Car0)
	eq(ch.sel_car, "c1", "a fit car is picked")
	ok(ch.Car0.hot, "the picked car is marked hot")
	_done(ch)


func test_paging() -> void:
	var ch := _make()
	var g := TestFakeGame.new()
	ch.enter(g)
	for id in ["c3", "c4", "c5"]:
		var extra: Dictionary = (g.state.cars[0] as Dictionary).duplicate(true)
		extra.id = id
		extra.modelId = "t1_chimp"
		g.state.cars.append(extra)
	g.changed.emit()
	ok(ch.NextBtn.enabled, "a second page exists with five cars")
	_tap(ch.NextBtn)
	eq(ch.car_page, 1, "next moves to page 2")
	ok(not ch.Car2.visible, "page 2 has two cars, so the third slot is hidden")
	ok(ch.PrevBtn.enabled, "previous is enabled on page 2")
	_done(ch)


func test_vanished_request() -> void:
	var ch := _make()
	var g := TestFakeGame.new()
	ch.enter(g)
	ch.Requests.select(0, true)
	eq(ch.sel_req, "Q1", "Q1 picked first")
	g.state.requests.remove_at(0)
	g.changed.emit()
	eq(ch.sel_req, "", "a request that has gone is dropped from the selection")
	_done(ch)
