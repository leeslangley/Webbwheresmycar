extends "res://tests/harness.gd"

# Tests for the BOOKINGS accept flow (GDU25): the refusals with a toast, ACCEPT JOB, the job result panel,
# OK and BACK. _ready does not fire under the runner, so the channel is built by hand and taps go through
# handle_event.


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


# Makes car c1 a strong, healthy car (a Porshe at condition 10).
func _strong(g: TestFakeGame) -> void:
	g.state.cars[0].modelId = "t3_porshe"
	g.state.cars[0].condition = 10.0
	g.changed.emit()


func _success() -> Dictionary:
	return {"ok": true, "msg": "All went well.", "outcome": {"type": "success", "paid": 900, "wear": 0.3, "faultLabel": null}}


# A channel with booking Q1 and car c1 picked, ready to accept.
func _picked(g: TestFakeGame) -> BookingsChannel:
	var ch := _make()
	ch.enter(g)
	_strong(g)
	ch.Requests.select(0, true)
	_tap(ch.Car0)
	return ch


# A channel that has accepted Q1 with car c1 and shows the result panel.
func _accepted(g: TestFakeGame) -> BookingsChannel:
	var ch := _picked(g)
	g.next_result = _success()
	_tap(ch.AcceptBtn)
	return ch


func test_refusal_order() -> void:
	var g := TestFakeGame.new()
	var st: Dictionary = g.state
	var req: Dictionary = st.requests[0]
	var good: Dictionary = st.cars[0]
	good.modelId = "t3_porshe"
	good.condition = 10.0
	var porshe := ChannelBase.model_of("t3_porshe")
	var faulty: Dictionary = st.cars[1]
	eq(BookingsChannel.accept_refusal(st, req, {}, {}), "Pick a car first", "no car picked")
	eq(BookingsChannel.accept_refusal(st, req, faulty, ChannelBase.model_of(str(faulty.modelId))), "That car is not fit to go out", "a car with a fault")
	eq(BookingsChannel.accept_refusal(st, {}, good, porshe), "Pick a booking first", "no booking picked")
	req.minDesirability = 99
	eq(BookingsChannel.accept_refusal(st, req, good, porshe), "That car is too plain for this booking", "not desirable enough")
	req.minDesirability = 3
	req.minReliability = 99
	eq(BookingsChannel.accept_refusal(st, req, good, porshe), "That car is too flaky for this booking", "not reliable enough")
	req.minReliability = 3
	req.minCondition = 11
	eq(BookingsChannel.accept_refusal(st, req, good, porshe), "That car is too scruffy for this booking", "condition too low")
	req.minCondition = 6
	eq(BookingsChannel.accept_refusal(st, req, good, porshe), "", "a good match is fine")


func test_labels() -> void:
	eq(BookingsChannel.type_label("disaster"), "DISASTER", "disaster label")
	eq(BookingsChannel.type_label("zzz"), "JOB DONE", "an unknown type reads JOB DONE")
	eq(BookingsChannel.paid_text(900), "Paid " + CoreFormat.money(900), "money paid")
	eq(BookingsChannel.paid_text(-250), "Compensation " + CoreFormat.money(250), "compensation")
	eq(BookingsChannel.paid_text(0), "Paid nothing", "nothing paid")
	eq(BookingsChannel.type_color_name("mishap"), "warn", "mishap is warn")
	eq(BookingsChannel.type_color_name("breakdown"), "bad", "breakdown is bad")
	eq(BookingsChannel.type_color_name("success"), "good", "success is good")


func test_accept_flow() -> void:
	var g := TestFakeGame.new()
	var ch := _make()
	ch.enter(g)
	_strong(g)
	ch.Requests.select(0, true)
	_tap(ch.Car0)
	ok(ch.AcceptBtn.enabled, "accept is ready once a booking and a car are picked")
	eq(ch.AcceptBtn.text, "ACCEPT JOB " + CoreFormat.money(900), "accept names the fee")
	g.next_result = _success()
	_tap(ch.AcceptBtn)
	eq(g.acts, [{"action": "accept_job", "params": {"request_id": "Q1", "car_id": "c1"}}], "accept_job is sent")
	eq(str(ch.result.get("type", "")), "success", "the result type")
	eq(int(ch.result.get("paid", 0)), 900, "the result paid")
	eq(str(ch.result.get("text", "")), "All went well.", "the result text")
	ok(ch.OkBtn.visible, "OK shows")
	ok(not ch.AcceptBtn.visible, "ACCEPT JOB is hidden")
	ok(not ch.Requests.visible, "the bookings list is hidden")
	eq(ch.sel_req, "", "the booking is cleared")
	_done(ch)


func test_dismiss() -> void:
	var g := TestFakeGame.new()
	var ch := _accepted(g)
	ok(ch.on_back(), "BACK dismisses the result")
	ok(ch.result.is_empty(), "the result is gone")
	ok(ch.Requests.visible, "the bookings list is back")
	ok(ch.AcceptBtn.visible, "ACCEPT JOB is back")
	ok(not ch.on_back(), "BACK with no result showing is not handled")
	_done(ch)


func test_refused_tap() -> void:
	var g := TestFakeGame.new()
	var ch := _make()
	ch.enter(g)
	ok(not ch.AcceptBtn.enabled, "accept is greyed out with nothing picked")
	_tap(ch.AcceptBtn)
	eq(g.acts, [], "nothing is sent")
	eq(g.toasts, ["Pick a car first"], "the toast says why")
	_done(ch)


func test_failed_act() -> void:
	var g := TestFakeGame.new()
	var ch := _picked(g)
	g.next_result = {"ok": false, "msg": "Expired"}
	_tap(ch.AcceptBtn)
	ok(ch.result.is_empty(), "no result panel after a failed act")
	eq(g.toasts, ["Expired"], "the failure is toasted once")
	eq(ch.sel_req, "Q1", "the booking stays picked")
	_done(ch)


func test_ok_key() -> void:
	var g := TestFakeGame.new()
	var ch := _picked(g)
	g.next_result = _success()
	ch.on_ok()
	eq(g.acts.size(), 1, "OK accepts when the job is ready")
	ok(not ch.result.is_empty(), "the result shows after OK")
	ch.on_ok()
	ok(ch.result.is_empty(), "OK dismisses the result")
	eq(g.acts.size(), 1, "OK does not accept again while the result shows")
	_done(ch)


func test_sizes() -> void:
	var ch := _make()
	ok(ch.AcceptBtn.size.y >= 72.0, "ACCEPT JOB is at least 72 px tall")
	ok(ch.OkBtn.size.y >= 72.0, "OK is at least 72 px tall")
	_done(ch)
