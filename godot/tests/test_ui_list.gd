extends "res://tests/harness.gd"

# UiList (the scrolling list): model, geometry, drag, fling, selection and tap. Every test builds its
# own list (no state leaks) and steps time by hand with advance_ms. No frames are run.


func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:
	var ev := InputEventMouseButton.new()
	ev.button_index = MOUSE_BUTTON_LEFT
	ev.pressed = down
	ev.position = pos
	return ev


func _mm(pos: Vector2) -> InputEventMouseMotion:
	var ev := InputEventMouseMotion.new()
	ev.position = pos
	ev.button_mask = MOUSE_BUTTON_MASK_LEFT
	return ev


func _make() -> UiList:
	var l := UiList.new()
	l.count = 10
	l.row_h = 72
	l.size = Vector2(300, 320)
	return l


func test_model() -> void:
	var l := _make()
	near(l.max_offset(), 400.0, 1e-9, "max offset is 10 rows minus the view")
	eq(l.visible_range(), Vector2i(0, 4), "rows 0 to 4 visible at offset 0")
	l.scroll_by(100.0)
	near(l.offset, 100.0, 1e-9, "scroll_by moves the offset")
	eq(l.visible_range(), Vector2i(1, 5), "visible range follows the offset")
	eq(l.row_at(10.0), 1, "row under y 10 at offset 100 is row 1")
	l.scroll_by(9999.0)
	near(l.offset, 400.0, 1e-9, "offset clamps to the max")
	l.scroll_by(-9999.0)
	near(l.offset, 0.0, 1e-9, "offset clamps to zero")
	eq(l.row_at(-1.0), -1, "above the view is no row")
	eq(l.row_at(400.0), -1, "below the view is no row")
	l.count = 2
	eq(l.row_at(300.0), -1, "past the last row is no row")
	l.free()


func test_rect_and_set_count() -> void:
	var l := _make()
	l.offset = 100.0
	eq(l.row_rect(2), Rect2(0, 44, 300, 72), "row 2 rect at offset 100")
	l.set_count(3)
	near(l.offset, 0.0, 1e-9, "set_count to 3 clamps the offset to zero")
	eq(l.count, 3, "set_count stores the count")
	l.free()


func test_tap_vs_drag() -> void:
	var l := _make()
	l.begin_drag(100.0, 0.0)
	l.drag_to(104.0, 10.0)
	eq(l.dragging, false, "a move of 4 px is not a drag")
	eq(l.end_drag(), true, "a small move is a tap")
	l.begin_drag(100.0, 0.0)
	l.drag_to(80.0, 10.0)
	eq(l.dragging, true, "a move of 20 px is a drag")
	near(l.offset, 20.0, 1e-9, "the drag scrolls the list by the finger move")
	near(l.vel, 2.0, 1e-9, "velocity is px per ms")
	eq(l.end_drag(), false, "a real drag is not a tap")
	l.free()


func test_fling() -> void:
	var l := _make()
	l.begin_drag(100.0, 0.0)
	l.drag_to(80.0, 10.0)
	l.end_drag()
	near(l.vel, 2.0, 1e-9, "fling keeps the drag velocity")
	l.advance_ms(16.0)
	near(l.offset, 52.0, 1e-6, "one 16 ms step moves by vel * dt")
	near(l.vel, 1.9, 1e-6, "velocity decays by 0.95 per 16 ms")
	l.scroll_by(9999.0)
	l.vel = 1.0
	l.advance_ms(16.0)
	eq(l.vel, 0.0, "velocity is zeroed at the end of the list")
	l.free()


func test_ensure_visible_select() -> void:
	var l := _make()
	l.ensure_visible(9)
	near(l.offset, 400.0, 1e-9, "row 9 scrolls into view at the bottom")
	l.ensure_visible(0)
	near(l.offset, 0.0, 1e-9, "row 0 scrolls into view at the top")
	l.select(3)
	eq(l.selected, 3, "select sets the row")
	l.select(99)
	eq(l.selected, 9, "select clamps to the last row")
	l.select(-5)
	eq(l.selected, -1, "select clamps to no selection")
	l.free()


func test_tap_signal() -> void:
	var l := _make()
	var taps: Array = []
	l.row_tapped.connect(func(i: int): taps.append(i))
	l.handle_event(_mb(Vector2(10, 100), true))
	l.handle_event(_mb(Vector2(12, 102), false))
	eq(taps, [1], "press and release on row 1 is a tap on row 1")
	eq(l.selected, 1, "a tap selects the row")
	l.handle_event(_mb(Vector2(10, 100), true))
	l.handle_event(_mb(Vector2(10, 170), false))
	eq(taps, [1], "release on another row gives no new tap")
	l.handle_event(_mb(Vector2(10, 100), true))
	l.handle_event(_mm(Vector2(10, 130)))
	l.handle_event(_mb(Vector2(10, 130), false))
	eq(taps, [1], "a drag of 30 px gives no tap")
	l.free()


func test_painter() -> void:
	var l := _make()
	l.row_painter = func(_l, _i, _r, _s): pass
	ok(l.row_painter.is_valid(), "painter callable is valid")
	l.queue_redraw()
	l.free()
