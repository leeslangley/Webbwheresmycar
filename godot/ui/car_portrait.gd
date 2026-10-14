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
var _bezel: Bezel


# The gold frame and the name plaque, drawn on a child kept above the car view.
class Bezel extends Control:
	var painter: Callable

	func _draw() -> void:
		if painter.is_valid():
			painter.call(self)


func _init() -> void:
	size = Vector2(200, 114)
	mouse_filter = MOUSE_FILTER_IGNORE
	clip_contents = true
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	_bezel = Bezel.new()
	_bezel.name = "Bezel"
	_bezel.painter = draw_bezel
	_bezel.mouse_filter = MOUSE_FILTER_IGNORE
	_bezel.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(_bezel)


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
	_bezel.queue_redraw()
	return _shown


func clear() -> void:
	_id = ""
	_shown = false
	if _cv != null:
		_cv.visible = false
	queue_redraw()
	_bezel.queue_redraw()


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
	move_child(_bezel, -1)


# Behind the car: the showroom backdrop (spotlit wall, glossy floor). Over it, on the Bezel child: the gold
# frame and a brass name plaque.
func _draw() -> void:
	var inner := Rect2(Vector2(6, 6), size - Vector2(12, 12))
	if UiSkin.tex("portrait_bg") != null:
		draw_texture_rect(UiSkin.tex("portrait_bg"), inner, false)
	else:
		UiTheme.draw_box(self, Rect2(Vector2.ZERO, size), UiTheme.color("lightblue"), UiTheme.color("ink"), FRAME_BW, true)
	if not _shown:
		_draw_empty()


func _draw_empty() -> void:
	# A dashed parking bay and the caption.
	var cy := size.y * 0.5 - 6.0
	var col := Color(0.75, 0.85, 1.0, 0.35)
	var x := size.x * 0.5 - 70.0
	while x < size.x * 0.5 + 70.0:
		draw_line(Vector2(x, cy + 30.0), Vector2(x + 10.0, cy + 30.0), col, 3.0)
		x += 18.0
	UiSkin.role_text(self, "NO CAR", Vector2(0, cy - UiTheme.size_for("h3") * 0.5), "h3", UiTheme.color("cream"), UiTheme.INK, 4, size.x, HORIZONTAL_ALIGNMENT_CENTER)


func draw_bezel(on: Control) -> void:
	var frame := Rect2(Vector2.ZERO, size)
	if UiSkin.box("frame9") != null:
		UiSkin.nine(on, "frame9", frame)
	else:
		on.draw_rect(frame, UiTheme.color("ink"), false, float(FRAME_BW))
	if _id != "":
		_draw_plaque(on)


func _draw_plaque(on: Control) -> void:
	var name_text := display_name()
	var f := UiTheme.body_font()
	var px := 22
	var tw := f.get_string_size(name_text, HORIZONTAL_ALIGNMENT_LEFT, -1, px).x
	var w := minf(size.x - 16.0, tw + 34.0)
	var plaque := Rect2((size.x - w) * 0.5, size.y - PLAQUE_H - 3.0, w, PLAQUE_H + 2.0)
	if UiSkin.tex("plaque") != null:
		UiSkin.nine(on, "plaque", plaque)
	else:
		on.draw_rect(plaque, UiTheme.color("cream"))
	var label := name_text
	if tw + 34.0 > size.x - 16.0:
		label = UiText.ellipsize(name_text, int(float(name_text.length()) * (size.x - 50.0) / maxf(tw, 1.0)))
	var at := plaque.position + Vector2(0, 1)
	UiSkin.text(on, f, label, at + Vector2(0, 1), px, Color(1, 0.97, 0.82, 0.8), UiTheme.INK, 0, plaque.size.x, HORIZONTAL_ALIGNMENT_CENTER)
	UiSkin.text(on, f, label, at, px, Color("3A2506"), UiTheme.INK, 0, plaque.size.x, HORIZONTAL_ALIGNMENT_CENTER)
