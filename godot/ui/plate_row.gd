class_name UiPlateRow
extends Control

# The four Gold Number Plate slots of the bottom HUD strip (port of the plate block in src/art/hud.js).
# Each slot is a 64x64 touch cell; a gold plate (won) or grey plate (not won) is drawn inside it.
# A tap on a slot (press and release on the same slot, UiTap rule) emits plate_tapped(key).

signal plate_tapped(key: String)

const KEYS: Array[String] = ["fatcat", "stable", "household", "hammer"]
const CODES := {"fatcat": "FC", "stable": "SB", "household": "HN", "hammer": "HT"}

var plates: Dictionary = {}
var _tap := UiTap.new()


func _init() -> void:
	size = Vector2(280, 64)
	mouse_filter = MOUSE_FILTER_STOP


func _gui_input(event: InputEvent) -> void:
	handle_event(event)


func set_plates(p: Dictionary) -> void:
	plates = p
	queue_redraw()


func is_won(key: String) -> bool:
	return plates.get(key, false) == true


func slot_rect(i: int) -> Rect2:
	return Rect2(i * 72.0, 0.0, 64.0, 64.0)


func slot_at(pos: Vector2) -> int:
	for i in KEYS.size():
		if slot_rect(i).has_point(pos):
			return i
	return -1


func handle_event(ev: InputEvent) -> void:
	var mb := ev as InputEventMouseButton
	if mb == null or mb.button_index != MOUSE_BUTTON_LEFT:
		return
	var slot := slot_at(mb.position)
	var id := "p%d" % slot if slot >= 0 else ""
	if mb.pressed:
		_tap.press(id)
		return
	if _tap.release(id) and slot >= 0:
		plate_tapped.emit(KEYS[slot])


func _draw() -> void:
	for i in KEYS.size():
		var key: String = KEYS[i]
		var code: String = CODES[key]
		var plate := Rect2(slot_rect(i).position + Vector2(4.0, 12.0), Vector2(56.0, 40.0))
		var won := is_won(key)
		if won:
			UiTheme.draw_box(self, plate, UiTheme.color("gold"), UiTheme.color("ink"), 4, true)
			draw_rect(Rect2(plate.position + Vector2(4.0, 4.0), Vector2(plate.size.x - 8.0, 2.0)), UiTheme.color("brassLight"))
		else:
			UiTheme.draw_box(self, plate, UiTheme.color("midgrey"), UiTheme.color("ink"), 4, true)
		var col: Color = UiTheme.color("ink") if won else UiTheme.color("darkgrey")
		UiTheme.draw_text(self, code, plate.position + Vector2(0.0, 12.0), "h3", col, plate.size.x, HORIZONTAL_ALIGNMENT_CENTER)
