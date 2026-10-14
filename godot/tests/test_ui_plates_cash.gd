extends "res://tests/harness.gd"


func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:
	var ev := InputEventMouseButton.new()
	ev.button_index = MOUSE_BUTTON_LEFT
	ev.pressed = down
	ev.position = pos
	return ev


func test_slots() -> void:
	var row := UiPlateRow.new()
	eq(row.slot_rect(0), Rect2(0, 0, 64, 64), "slot 0 rect")
	eq(row.slot_rect(3), Rect2(216, 0, 64, 64), "slot 3 rect")
	eq(row.slot_at(Vector2(70, 10)), -1, "the 8 px gap is no slot")
	eq(row.slot_at(Vector2(80, 10)), 1, "x 80 is slot 1")
	eq(row.slot_at(Vector2(300, 10)), -1, "outside the row")
	row.free()


func test_won() -> void:
	var row := UiPlateRow.new()
	row.set_plates({"fatcat": true, "stable": false})
	eq(row.is_won("fatcat"), true, "fatcat won")
	eq(row.is_won("stable"), false, "stable not won")
	eq(row.is_won("hammer"), false, "missing key is not won")
	row.free()


func test_tap() -> void:
	var row := UiPlateRow.new()
	var got: Array = []
	row.plate_tapped.connect(func(k: String) -> void: got.append(k))
	row.handle_event(_mb(Vector2(80, 10), true))
	row.handle_event(_mb(Vector2(82, 12), false))
	eq(got, ["stable"], "press and release on slot 1 taps stable")
	row.handle_event(_mb(Vector2(80, 10), true))
	row.handle_event(_mb(Vector2(150, 10), false))
	eq(got, ["stable"], "release on another slot does not tap")
	row.handle_event(_mb(Vector2(70, 10), true))
	row.handle_event(_mb(Vector2(70, 10), false))
	eq(got, ["stable"], "press and release in the gap does not tap")
	row.free()


func test_fill_ratio() -> void:
	near(UiCashBar.fill_ratio(50000.0), 0.5, 1e-9, "half way")
	near(UiCashBar.fill_ratio(-5.0), 0.0, 1e-9, "negative clamps to 0")
	near(UiCashBar.fill_ratio(250000.0), 1.0, 1e-9, "over target clamps to 1")


func test_cash_bar() -> void:
	var bar := UiCashBar.new()
	tree().root.add_child(bar)
	# The runner does not fire _ready on add_child, so build the child by hand (guarded against a double build).
	if bar.get_node_or_null("Counter") == null:
		bar._ready()
	bar.set_cash(1500.0, false)
	var counter: UiCounter = bar.get_node("Counter")
	eq(counter.text(), CoreFormat.money(1500), "counter shows the money figure")
	bar.set_cash(-20.0, false)
	eq(counter.base_color, UiTheme.color("bad"), "negative cash is red")
	bar.free()
