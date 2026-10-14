extends "res://tests/harness.gd"

const PROBE_SOURCE := "extends Control\nvar evs := []\nfunc handle_event(ev):\n\tevs.append(ev)\n"


func _make_probe(counter: Array) -> Control:
	var s := GDScript.new()
	s.source_code = PROBE_SOURCE
	s.reload()
	var c := Control.new()
	c.set_script(s)
	c.gui_input.connect(func(_ev: InputEvent) -> void: counter[0] += 1)
	return c


func test_mouse_builds_left_button_event() -> void:
	var ev := TapUtil.mouse(true, Vector2(1, 2))
	eq(ev.button_index, MOUSE_BUTTON_LEFT, "left button")
	eq(ev.pressed, true, "pressed")
	eq(ev.position, Vector2(1, 2), "position")
	eq(ev.global_position, Vector2(1, 2), "global position")


func test_tap_sends_press_then_release_inside() -> void:
	var counter := [0]
	var c := _make_probe(counter)
	TapUtil.tap(c)
	var evs: Array = c.get("evs")
	eq(evs.size(), 2, "two events")
	if evs.size() == 2:
		var first: InputEventMouseButton = evs[0]
		var second: InputEventMouseButton = evs[1]
		eq(first.pressed, true, "first is press")
		eq(second.pressed, false, "second is release")
		eq(first.button_index, MOUSE_BUTTON_LEFT, "press left button")
		eq(second.button_index, MOUSE_BUTTON_LEFT, "release left button")
		eq(first.position, Vector2(5, 5), "press at inside")
		eq(second.position, Vector2(5, 5), "release at inside")
	eq(counter[0], 2, "gui_input fired twice")
	c.free()


func test_tap_away_releases_outside() -> void:
	var counter := [0]
	var c := _make_probe(counter)
	TapUtil.tap_away(c)
	var evs: Array = c.get("evs")
	eq(evs.size(), 2, "two events")
	if evs.size() == 2:
		var first: InputEventMouseButton = evs[0]
		var second: InputEventMouseButton = evs[1]
		eq(first.pressed, true, "first is press")
		eq(second.pressed, false, "second is release")
		eq(first.position, TapUtil.INSIDE, "press inside")
		eq(second.position, TapUtil.OUTSIDE, "release outside")
	eq(counter[0], 2, "gui_input fired twice")
	c.free()
