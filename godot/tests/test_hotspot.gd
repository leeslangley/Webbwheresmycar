extends "res://tests/harness.gd"

# RoomHotspot: the invisible tap-rule rect over room props. Taps go through TapUtil, which emits
# gui_input and calls handle_event(ev) the same way the engine path does. No frames are run.


func test_fit_rect() -> void:
	eq(RoomHotspot.fit_rect(Rect2(10, 10, 30, 20)), Rect2(-7, -12, 64, 64), "small rect grows to 64 about its centre")
	eq(RoomHotspot.fit_rect(Rect2(0, 0, 200, 100)), Rect2(0, 0, 200, 100), "big rect is kept as it is")


func test_make() -> void:
	var hs := RoomHotspot.make(&"a", Rect2(100, 100, 10, 10))
	eq(hs.size, Vector2(64, 64), "made hotspot is at least 64x64")
	eq(hs.name, &"Hot_a", "node name carries the id")
	eq(hs.mouse_filter, Control.MOUSE_FILTER_STOP, "hotspot stops mouse input")
	hs.free()


func test_tap_rule() -> void:
	var hs := RoomHotspot.make(&"a", Rect2(0, 0, 100, 100))
	var got: Array = []
	hs.tapped.connect(func(i): got.append(i))
	TapUtil.tap(hs)
	eq(got, [&"a"], "press and release inside fires tapped with the id")
	TapUtil.tap_away(hs)
	eq(got.size(), 1, "press inside, release outside does not fire")
	TapUtil.release(hs)
	eq(got.size(), 1, "release with no press does not fire")
	hs.enabled = false
	TapUtil.tap(hs)
	eq(got.size(), 1, "disabled hotspot does not fire")
	hs.free()


func test_pressed_state() -> void:
	var hs := RoomHotspot.make(&"a", Rect2(0, 0, 100, 100))
	var downs: Array = []
	hs.pressed_down.connect(func(i): downs.append(i))
	TapUtil.press(hs)
	eq(downs.size(), 1, "pressed_down fires once per press")
	eq(hs.pressed, true, "pressed between press and release")
	TapUtil.release(hs)
	eq(hs.pressed, false, "not pressed after release")
	eq(downs.size(), 1, "release does not fire pressed_down")
	hs.free()


func test_direct_press_release() -> void:
	var hs := RoomHotspot.make(&"a", Rect2(0, 0, 100, 100))
	var got: Array = []
	hs.tapped.connect(func(i): got.append(i))
	hs.press()
	hs.release(true)
	eq(got.size(), 1, "press() then release(true) fires tapped")
	hs.free()


func test_glow_processing() -> void:
	var t := Engine.get_main_loop() as SceneTree
	var hs := RoomHotspot.make(&"a", Rect2(0, 0, 100, 100))
	t.root.add_child(hs)
	hs.set_glow(true)
	eq(hs.is_processing(), true, "glow on runs _process")
	hs.set_glow(false)
	eq(hs.is_processing(), false, "glow off stops _process")
	t.root.remove_child(hs)
	hs.free()
