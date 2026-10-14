class_name TapUtil
extends RefCounted

# Test helper: taps a Control the way the engine does. Each event is a real left-button
# InputEventMouseButton, emitted on the control's gui_input signal first, then fed to
# handle_event(ev) (the entry point UiButton, UiMenu and RoomHotspot all have).

const INSIDE := Vector2(5, 5)
const OUTSIDE := Vector2(-500, -500)


static func mouse(pressed: bool, pos: Vector2) -> InputEventMouseButton:
	var ev := InputEventMouseButton.new()
	ev.button_index = MOUSE_BUTTON_LEFT
	ev.pressed = pressed
	ev.position = pos
	ev.global_position = pos
	return ev


static func press(c: Control, pos: Vector2 = INSIDE) -> void:
	var ev := mouse(true, pos)
	c.gui_input.emit(ev)
	c.call("handle_event", ev)


static func release(c: Control, pos: Vector2 = INSIDE) -> void:
	var ev := mouse(false, pos)
	c.gui_input.emit(ev)
	c.call("handle_event", ev)


static func tap(c: Control, pos: Vector2 = INSIDE) -> void:
	press(c, pos)
	release(c, pos)


static func tap_away(c: Control) -> void:
	press(c, INSIDE)
	release(c, OUTSIDE)
