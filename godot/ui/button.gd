class_name UiButton
extends Control

# The stock touch button (port of kit_draw.js button, with the tap rule from UiTap), painted as a chunky
# glossy key: ink outline, gradient face, a darker lip that squashes when pressed, a soft drop shadow and a
# warm glow ring when hot. Kinds: normal, primary, remote, card (and danger); disabled greys it out.
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
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR


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


# The baked face texture for the current kind and state.
func face_name() -> String:
	var k := kind
	if not enabled:
		k = "disabled"
	elif not ["normal", "primary", "remote", "card", "danger"].has(k):
		k = "normal"
	return "btn_" + k + ("_down" if down else "")


func _draw() -> void:
	var rect := Rect2(Vector2.ZERO, size)
	if UiSkin.tex(face_name()) == null:
		_draw_flat()
		return
	if hot and enabled:
		UiSkin.nine(self, "glow9", rect.grow(16.0))
	if not down:
		UiSkin.nine(self, "shadow9", Rect2(rect.position + Vector2(-14, -10), rect.size + Vector2(28, 30)), Color(1, 1, 1, 0.8))
	UiSkin.nine(self, face_name(), rect, Color.WHITE, "btn")

	var text_col: Color
	var outline := Color(0, 0, 0, 0)
	var opx := 0
	if not enabled:
		text_col = Color("8A857C")
	elif kind == "primary" or kind == "danger":
		text_col = Color.WHITE
		outline = UiTheme.INK
		opx = 6
	elif kind == "remote":
		text_col = UiTheme.color("cream")
		outline = UiTheme.INK
		opx = 5
	else:
		text_col = UiTheme.color("ink")
	var lines: PackedStringArray = text.split("\n")
	var px: int = UiTheme.size_for(role)
	var pitch: int = px + 6
	var block: float = float((lines.size() - 1) * pitch + px)
	var top: float = (size.y - 4.0 - block) * 0.5
	if down:
		top += 3.0
	for i in range(lines.size()):
		UiSkin.role_text(self, lines[i], Vector2(0, top + float(i * pitch)), role, text_col, outline, opx, size.x, HORIZONTAL_ALIGNMENT_CENTER)


# Fallback when the baked textures are missing: the old flat box.
func _draw_flat() -> void:
	var fill: Color = UiTheme.color("paper")
	if not enabled:
		fill = UiTheme.color("lightgrey")
	elif kind == "primary":
		fill = UiTheme.color("good")
	elif kind == "remote":
		fill = UiTheme.color("darkgrey")
	if down:
		fill = fill.darkened(0.15)
	UiTheme.draw_box(self, Rect2(Vector2.ZERO, size), fill, UiTheme.color("ink"), 4, not down)
	UiTheme.draw_text(self, text, Vector2(0, (size.y - UiTheme.size_for(role)) * 0.5), role, UiTheme.color("ink"), size.x, HORIZONTAL_ALIGNMENT_CENTER)
