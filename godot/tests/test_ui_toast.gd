extends "res://tests/harness.gd"


func test_toast_flow() -> void:
	var t := UiToast.new()
	t.size = Vector2(1280, 720)
	tree().root.add_child(t)
	t.show_text("A")
	eq(t.active_count(), 1, "shown at once")
	t.advance(1.0)
	eq(t.active_count(), 1, "still shown at 1.0 s")
	t.advance(2.5)
	eq(t.active_count(), 0, "gone after in + hold + out")
	t.free()


func test_toast_limits() -> void:
	var t := UiToast.new()
	tree().root.add_child(t)
	t.show_text("A")
	t.show_text("B")
	t.show_text("C")
	t.show_text("D")
	eq(t.active_count(), 3, "at most three visible")
	eq(t.queued_count(), 1, "the fourth waits")
	eq(t.texts(), ["A", "B", "C"], "oldest first")
	t.advance(3.5)
	eq(t.texts(), ["D"], "expired toasts removed and the queue promoted in the same call")
	eq(t.queued_count(), 0, "queue empty")
	t.free()


func test_toast_duplicate() -> void:
	var t := UiToast.new()
	tree().root.add_child(t)
	t.show_text("A")
	t.advance(0.5)
	t.show_text("A")
	eq(t.active_count(), 1, "same text as the newest is not added twice")
	eq(t.items[0]["age"], 0.0, "age reset by the repeat")
	t.free()


func test_toast_truncate() -> void:
	var t := UiToast.new()
	tree().root.add_child(t)
	t.show_text("X".repeat(100))
	var stored: String = t.items[0]["text"]
	eq(stored.length(), 60, "truncated to 60 characters")
	eq(stored, "X".repeat(57) + "...", "ends in an ellipsis")
	t.free()


func test_toast_alpha() -> void:
	var t := UiToast.new()
	near(t.alpha_of({"text": "x", "age": 0.13, "hold": 2.5}), 0.5, 0.001, "fading in halfway")
	near(t.alpha_of({"text": "x", "age": 1.0, "hold": 2.5}), 1.0, 0.001, "fully shown while held")
	near(t.alpha_of({"text": "x", "age": 0.26 + 2.5 + 0.1, "hold": 2.5}), 0.5, 0.001, "fading out halfway")
	t.free()


func test_tooltip_position() -> void:
	eq(UiTooltip.compute_position(Rect2(100, 100, 40, 40), Vector2(80, 40), Vector2(1280, 720)), Vector2(80, 52), "above the anchor")
	eq(UiTooltip.compute_position(Rect2(100, 10, 40, 40), Vector2(80, 40), Vector2(1280, 720)), Vector2(80, 58), "no room above: below the anchor")
	eq(UiTooltip.compute_position(Rect2(1270, 300, 40, 40), Vector2(80, 40), Vector2(1280, 720)), Vector2(1200, 252), "clamped to the right edge")


func test_tooltip_delay() -> void:
	var tip := UiTooltip.new()
	tree().root.add_child(tip)
	tip.request("HELLO", Rect2(100, 100, 40, 40))
	tip.advance(0.3)
	ok(not tip.visible, "hidden before the delay")
	tip.advance(0.2)
	ok(tip.visible, "visible after the delay")
	eq(tip.size, UiTooltip.measure("HELLO"), "sized to the text")
	tip.hide_tip()
	ok(not tip.visible, "hide_tip hides it")
	tip.request("HELLO", Rect2(100, 100, 40, 40))
	tip.hide_tip()
	tip.advance(1.0)
	ok(not tip.visible, "a cancelled request stays hidden")
	eq(UiTooltip.measure("HELLO"), Vector2(74, 40), "measure of a 5-letter text")
	tip.free()
