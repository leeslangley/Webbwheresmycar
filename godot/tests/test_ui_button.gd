extends "res://tests/harness.gd"

# UiTap (the tap rule) and UiButton (the stock button). Taps go through TapUtil, which emits the
# gui_input signal and calls handle_event(ev) the same way the engine path does. No frames are run.


func test_tap_class() -> void:
	var t := UiTap.new()
	t.press("a")
	eq(t.release("a"), true, "press then release on the same id")
	eq(t.release("a"), false, "second release is not a hit")
	t.press("a")
	eq(t.release("b"), false, "release on another id is not a hit")
	eq(t.is_down(), false, "release clears the pressed id")
	t.press("")
	eq(t.release(""), false, "empty id never hits")
	t.press("a")
	t.cancel()
	eq(t.release("a"), false, "cancel clears the press")
	eq(t.is_down(), false, "cancel leaves nothing down")


func test_button_min_size() -> void:
	var b := UiButton.new()
	eq(b.custom_minimum_size, Vector2(64, 64), "minimum 64x64")
	b.free()


func test_button_tap() -> void:
	var b := UiButton.new()
	b.size = Vector2(200, 64)
	var hits: Array = []
	b.activated.connect(func(): hits.append(1))
	TapUtil.press(b, Vector2(10, 10))
	TapUtil.release(b, Vector2(12, 12))
	eq(hits.size(), 1, "press and release inside gives one hit")
	TapUtil.press(b, Vector2(10, 10))
	TapUtil.release(b, Vector2(500, 10))
	eq(hits.size(), 1, "release outside gives no new hit")
	TapUtil.release(b, Vector2(10, 10))
	eq(hits.size(), 1, "release with no press gives no hit")
	TapUtil.tap(b, Vector2(10, 10))
	eq(hits.size(), 2, "a second inside tap gives a second hit")
	b.free()


func test_button_disabled() -> void:
	var b := UiButton.new()
	b.size = Vector2(200, 64)
	b.enabled = false
	var hits: Array = []
	var blocks: Array = []
	b.activated.connect(func(): hits.append(1))
	b.blocked.connect(func(): blocks.append(1))
	TapUtil.tap(b, Vector2(10, 10))
	eq(hits.size(), 0, "disabled button does not activate")
	eq(blocks.size(), 1, "disabled button emits blocked")
	b.free()


func test_button_activate() -> void:
	var b := UiButton.new()
	var hits: Array = []
	b.activated.connect(func(): hits.append(1))
	b.activate()
	eq(hits.size(), 1, "activate emits once when enabled")
	b.free()


func test_down_state() -> void:
	var b := UiButton.new()
	b.size = Vector2(200, 64)
	TapUtil.press(b, Vector2(10, 10))
	eq(b.down, true, "down after press")
	TapUtil.release(b, Vector2(10, 10))
	eq(b.down, false, "not down after release")
	b.free()
