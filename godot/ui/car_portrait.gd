class_name CarPortrait
extends Control

# The single API for "show this car here" (HUD slot, shop detail, bookings).
# The car itself is a CarView child (GDA03: 3D car in a pixel viewport), made on first use. This node keeps the
# frame, the dither background, the empty "NO CAR" slot and the name plaque. Keep the public method names stable.

const FRAME_BW: int = 4
const DITHER_SQ: int = 4
const DITHER_PITCH: int = 8
const PLAQUE_H: float = 24.0

var view_name := "front"

var _id: String = ""
var _paint: Color = Color(0.53, 0.53, 0.53)
var _wear: float = 0.0
var _shown: bool = false
var _cv: CarView


func _init() -> void:
	size = Vector2(200, 114)
	mouse_filter = MOUSE_FILTER_IGNORE
	clip_contents = true


func set_car(id: String, paint, wear: float = 0.0) -> bool:
	_id = id
	var c: Color = paint if paint is Color else Color(String(paint))
	_paint = c
	_wear = Wear.clamp_level(wear)
	_ensure_view()
	_shown = _cv.set_car(id)
	_cv.set_paint(c)
	_cv.set_wear(wear)
	_cv.visible = _shown
	queue_redraw()
	return _shown


func clear() -> void:
	_id = ""
	_shown = false
	if _cv != null:
		_cv.visible = false
	queue_redraw()


func set_portrait_view(v: String) -> bool:
	_ensure_view()
	if not _cv.set_view(v):
		return false
	view_name = v
	return true


func get_view() -> CarView:
	return _cv


func get_car_id() -> String:
	return _id


func get_paint() -> Color:
	return _paint


func get_wear() -> float:
	return _wear


func body_color() -> Color:
	return _paint.darkened(0.12 * _wear)


func display_name() -> String:
	if _id == "":
		return ""
	var m: Dictionary = Data.car_by_id(_id)
	if m.has("name"):
		return str(m["name"]).to_upper()
	return _id.to_upper()


static func wear_for(condition: float) -> int:
	return clampi(int(floor((10.0 - condition) / 2.5)), 0, 3)


func _ensure_view() -> void:
	if _cv != null:
		return
	_cv = preload("res://art/carview.tscn").instantiate() as CarView
	_cv.name = "View"
	add_child(_cv)
	_cv.build()
	_cv.set_view(view_name)
	# carview.tscn sets a 480x240 minimum size, which would stop the view fitting the portrait.
	_cv.custom_minimum_size = Vector2.ZERO
	_cv.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_cv.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_cv.visible = false


func _draw() -> void:
	var frame := Rect2(Vector2.ZERO, size)
	var sky: Color = UiTheme.color("lightblue")
	UiTheme.draw_box(self, frame, sky, UiTheme.color("ink"), FRAME_BW, true)
	_draw_dither()
	if not _shown:
		UiTheme.draw_text(self, "NO CAR", Vector2(0, size.y * 0.5 - UiTheme.size_for("h3") * 0.5), "h3", UiTheme.color("cream"), size.x, HORIZONTAL_ALIGNMENT_CENTER)
	if _id != "":
		_draw_plaque()


func _draw_dither() -> void:
	var dot: Color = UiTheme.color("lightblue").lightened(0.18)
	for k in range(1, 4):
		var y: float = size.y * float(k) / 4.0
		var offset: float = float(DITHER_SQ) if k % 2 == 0 else 0.0
		var x: float = offset
		while x < size.x:
			draw_rect(Rect2(x, y, DITHER_SQ, DITHER_SQ), dot)
			x += DITHER_PITCH


func _draw_plaque() -> void:
	var plaque := Rect2(0, size.y - PLAQUE_H, size.x, PLAQUE_H)
	draw_rect(plaque, UiTheme.color("cream"))
	UiTheme.draw_text(self, display_name(), plaque.position, "caption", UiTheme.color("ink"), size.x, HORIZONTAL_ALIGNMENT_CENTER)
