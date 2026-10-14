extends "res://tests/harness.gd"

# UiMenu (GDU03): the pop-up menu widget. No scene and no frames: time is stepped with advance(dt),
# and mouse input goes through the public handle_event(ev).


func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:
	var ev := InputEventMouseButton.new()
	ev.button_index = MOUSE_BUTTON_LEFT
	ev.pressed = down
	ev.position = pos
	return ev


func _open3(m: UiMenu) -> void:
	m.open(["A", "B", "C"] as Array[String], Vector2(5, 6))


func test_width_size() -> void:
	eq(UiMenu.width_for(["A", "BB"]), 280, "short list uses the 280 minimum")
	var thirty := "123456789012345678901234567890"
	eq(UiMenu.width_for([thirty]), 428, "30 characters: 44 + 12 * 30 + 24")
	var m := UiMenu.new()
	_open3(m)
	eq(m.position, Vector2(5, 6), "open places the menu at the given point")
	eq(m.size, Vector2(280, 208), "3 rows of 64 plus 2 * 8 padding")
	ok(m.visible, "open shows the menu")
	eq(m.selected, 0, "open selects the first enabled row")
	m.free()


func test_rows() -> void:
	var m := UiMenu.new()
	_open3(m)
	eq(m.row_rect(1), Rect2(8, 72, 264, 64), "row 1 rect")
	eq(m.row_at(Vector2(20, 80)), 1, "point in row 1 hits row 1")
	eq(m.row_at(Vector2(2, 80)), -1, "point left of the rows hits nothing")
	eq(m.row_at(Vector2(20, 300)), -1, "point below the rows hits nothing")
	m.free()


func test_move() -> void:
	var m := UiMenu.new()
	_open3(m)
	m.move(1)
	eq(m.selected, 1, "move down one row")
	m.move(-1)
	m.move(-1)
	eq(m.selected, 2, "two moves up from row 1 wrap to row 2")
	m.free()

	var d := UiMenu.new()
	_open3(d)
	d.set_item_enabled(1, false)
	eq(d.selected, 0, "still on row 0 before the move")
	d.move(1)
	eq(d.selected, 2, "move skips the disabled row 1")
	d.free()


func test_choose_and_cancel() -> void:
	var m := UiMenu.new()
	_open3(m)
	var picks: Array = []
	var cancels: Array = []
	m.chosen.connect(func(i: int): picks.append(i))
	m.cancelled.connect(func(): cancels.append(1))
	m.selected = 2
	m.choose()
	eq(picks, [2], "choose emits the selected row")
	eq(m.visible, false, "choose closes the menu")

	_open3(m)
	m.cancel()
	eq(cancels.size(), 1, "cancel emits cancelled once")
	eq(m.visible, false, "cancel closes the menu")

	_open3(m)
	m.set_item_enabled(1, false)
	m.selected = 1
	m.choose()
	eq(picks, [2], "choose on a disabled row emits nothing")
	m.free()


func test_tap() -> void:
	var m := UiMenu.new()
	var picks: Array = []
	m.chosen.connect(func(i: int): picks.append(i))

	_open3(m)
	m.handle_event(_mb(Vector2(20, 80), true))
	m.handle_event(_mb(Vector2(20, 85), false))
	eq(picks, [1], "press and release both in row 1 chooses row 1")

	_open3(m)
	m.handle_event(_mb(Vector2(20, 80), true))
	m.handle_event(_mb(Vector2(20, 150), false))
	eq(picks, [1], "press on row 1 and release on row 2 chooses nothing")

	_open3(m)
	m.handle_event(_mb(Vector2(2, 80), true))
	m.handle_event(_mb(Vector2(2, 80), false))
	eq(picks, [1], "press and release outside the rows chooses nothing")
	m.free()


func test_blink() -> void:
	var m := UiMenu.new()
	_open3(m)
	m.advance(0.0)
	ok(m.blink_on(), "blink is on at t = 0")
	m.advance(0.25)
	ok(not m.blink_on(), "blink is off at t = 0.25")
	m.advance(0.25)
	ok(m.blink_on(), "blink is on again at t = 0.5")
	m.free()
