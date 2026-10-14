class_name RoomHotspot
extends Control

# An invisible tappable rect over a room prop (door, poster, kettle ...). It follows the shared tap
# rule (UiTap): the press is remembered on THIS hotspot, and tapped fires only on a release that
# ends inside it. Never smaller than MIN_PX on either side, so every touch target is big enough.

const MIN_PX := 64.0

signal tapped(id: StringName)
signal pressed_down(id: StringName)

var id: StringName = &""
var enabled := true
var pressed := false
var glow := false
var _tap := UiTap.new()


# The rect grown to MIN_PX on each side that is smaller, keeping its centre.
static func fit_rect(rect: Rect2) -> Rect2:
	var s := Vector2(maxf(rect.size.x, MIN_PX), maxf(rect.size.y, MIN_PX))
	var c := rect.get_center()
	return Rect2((c - s * 0.5).round(), s)


static func make(hs_id: StringName, rect: Rect2) -> RoomHotspot:
	var hs := RoomHotspot.new()
	hs.id = hs_id
	hs.name = "Hot_" + String(hs_id)
	var fitted := fit_rect(rect)
	hs.position = fitted.position
	hs.size = fitted.size
	hs.mouse_filter = Control.MOUSE_FILTER_STOP
	hs.focus_mode = Control.FOCUS_NONE
	return hs


func press() -> void:
	if not enabled:
		return
	_tap.press("h")
	pressed = true
	pressed_down.emit(id)
	queue_redraw()


func release(inside: bool) -> void:
	var hit := _tap.release("h" if inside else "")
	pressed = false
	queue_redraw()
	if hit and enabled:
		tapped.emit(id)


func handle_event(ev: InputEvent) -> void:
	var mb := ev as InputEventMouseButton
	if mb == null or mb.button_index != MOUSE_BUTTON_LEFT:
		return
	if mb.pressed:
		press()
	else:
		release(Rect2(Vector2.ZERO, size).has_point(mb.position))


func _gui_input(event: InputEvent) -> void:
	handle_event(event)
	accept_event()


func set_glow(v: bool) -> void:
	glow = v
	set_process(v)
	queue_redraw()


func _process(_d: float) -> void:
	queue_redraw()


func _draw() -> void:
	if not glow:
		return
	draw_rect(Rect2(Vector2.ZERO, size), Color(1.0, 0.82, 0.48, 0.35 + 0.35 * sin(Time.get_ticks_msec() / 250.0)), false, 4.0)
