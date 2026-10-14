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
var _t: float = 0.0


func _init() -> void:
	size = Vector2(280, 64)
	mouse_filter = MOUSE_FILTER_STOP
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR


func _process(dt: float) -> void:
	_t += dt
	for k in KEYS:
		if is_won(k):
			queue_redraw()
			return


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


# Each slot shows its baked disc: a gold record with the plate's embossed icon, or a dull pewter one.
# Won plates catch a travelling glint now and then.
func _draw() -> void:
	for i in KEYS.size():
		var key: String = KEYS[i]
		var won := is_won(key)
		var at := slot_rect(i).position
		var tex_name := "plate_%s_%s" % [key, "gold" if won else "dull"]
		if UiSkin.tex(tex_name) != null:
			UiSkin.blit(self, tex_name, at)
		else:
			var plate := Rect2(at + Vector2(4.0, 12.0), Vector2(56.0, 40.0))
			UiTheme.draw_box(self, plate, UiTheme.color("gold") if won else UiTheme.color("midgrey"))
			UiTheme.draw_text(self, CODES[key], plate.position + Vector2(0.0, 12.0), "h3", UiTheme.color("ink"), plate.size.x, HORIZONTAL_ALIGNMENT_CENTER)
		if won:
			_glint(at + Vector2(32, 32), float(i))


func _glint(c: Vector2, phase: float) -> void:
	var u := fposmod(_t * 0.5 - phase * 0.37, 2.2)
	if u > 1.0:
		return
	var a := sin(u * PI)
	var p := c + Vector2(-14, -16) + Vector2(20, 8) * u
	var r := 4.0 + 6.0 * a
	var star := PackedVector2Array([p + Vector2(0, -r), p + Vector2(r * 0.22, -r * 0.22), p + Vector2(r, 0), p + Vector2(r * 0.22, r * 0.22), p + Vector2(0, r), p + Vector2(-r * 0.22, r * 0.22), p + Vector2(-r, 0), p + Vector2(-r * 0.22, -r * 0.22)])
	draw_colored_polygon(star, Color(1, 1, 1, a))
