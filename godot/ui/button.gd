class_name UiButton
extends Control

# The stock touch button (port of kit_draw.js button, with the tap rule from UiTap).
# Emits activated on a tap that starts and ends on this control while enabled, blocked on a
# tap while disabled. Public handle_event(ev) is the entry point; _gui_input forwards to it.

signal activated
signal blocked

var text: String = "":
	set(value):
		text = value
		queue_redraw()

var kind: String = "normal":
	set(value):
		kind = value
		queue_redraw()

var enabled: bool = true:
	set(value):
		enabled = value
		queue_redraw()

var hot: bool = false:
	set(value):
		hot = value
		queue_redraw()

var role: String = "button":
	set(value):
		role = value
		queue_redraw()

var down: bool = false
var _tap := UiTap.new()


func _init() -> void:
	custom_minimum_size = Vector2(64, 64)
	size = Vector2(64, 64)
	mouse_filter = Control.MOUSE_FILTER_STOP
	focus_mode = Control.FOCUS_NONE


func _gui_input(event: InputEvent) -> void:
	handle_event(event)


func handle_event(ev: InputEvent) -> void:
	var mb := ev as InputEventMouseButton
	if mb == null or mb.button_index != MOUSE_BUTTON_LEFT:
		return
	if mb.pressed:
		_tap.press("b")
		down = true
		queue_redraw()
		return
	var inside := Rect2(Vector2.ZERO, size).has_point(mb.position)
	var hit := _tap.release("b" if inside else "")
	down = false
	queue_redraw()
	if hit:
		activate()


# The tap action (also used by the keyboard OK path).
func activate() -> void:
	if enabled:
		activated.emit()
	else:
		blocked.emit()


func _draw() -> void:
	var fill: Color
	var border: Color = UiTheme.color("ink")
	var text_col: Color
	if not enabled:
		fill = UiTheme.color("lightgrey")
		text_col = UiTheme.color("midgrey")
	elif kind == "primary":
		fill = UiTheme.color("good")
		text_col = UiTheme.color("white")
	elif kind == "remote":
		fill = UiTheme.color("darkgrey")
		border = UiTheme.color("black")
		text_col = UiTheme.color("cream")
	elif kind == "card":
		fill = UiTheme.color("cream")
		text_col = UiTheme.color("ink")
	else:
		fill = UiTheme.color("paper")
		text_col = UiTheme.color("ink")
	if down:
		fill = fill.darkened(0.15)

	UiTheme.draw_box(self, Rect2(Vector2.ZERO, size), fill, border, 4, not down)

	if hot:
		var lamp := UiTheme.color("lamp")
		draw_rect(Rect2(4, 4, size.x - 8, 4), lamp)
		draw_rect(Rect2(4, size.y - 8, size.x - 8, 4), lamp)
		draw_rect(Rect2(4, 4, 4, size.y - 8), lamp)
		draw_rect(Rect2(size.x - 8, 4, 4, size.y - 8), lamp)

	var lines: PackedStringArray = text.split("\n")
	var px: int = UiTheme.size_for(role)
	var pitch: int = px + 4
	var block: float = float((lines.size() - 1) * pitch + px)
	var top: float = (size.y - block) * 0.5
	if down:
		top += 2.0
	for i in range(lines.size()):
		UiTheme.draw_text(self, lines[i], Vector2(0, top + float(i * pitch)), role, text_col, size.x, HORIZONTAL_ALIGNMENT_CENTER)
