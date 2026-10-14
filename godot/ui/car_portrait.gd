class_name CarPortrait
extends Control

# The single API for "show this car here" (HUD slot, shop detail, bookings).
# For now it draws a coloured placeholder car with the model name. The GDA cards later swap the
# inside for the real 3D CarView WITHOUT changing this API: keep the public method names stable.

const FRAME_BW: int = 4
const DITHER_SQ: int = 4
const DITHER_PITCH: int = 8
const PLAQUE_H: float = 24.0

var _id: String = ""
var _paint: Color = Color(0.53, 0.53, 0.53)
var _wear: int = 0


func _init() -> void:
	size = Vector2(200, 114)
	mouse_filter = MOUSE_FILTER_IGNORE
	clip_contents = true


func set_car(id: String, paint: Color, wear: int = 0) -> void:
	_id = id
	_paint = paint
	_wear = clampi(wear, 0, 3)
	queue_redraw()


func clear() -> void:
	_id = ""
	queue_redraw()


func get_car_id() -> String:
	return _id


func get_paint() -> Color:
	return _paint


func get_wear() -> int:
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


func _draw() -> void:
	var frame := Rect2(Vector2.ZERO, size)
	var sky: Color = UiTheme.color("lightblue")
	UiTheme.draw_box(self, frame, sky, UiTheme.color("ink"), FRAME_BW, true)
	_draw_dither()
	if _id == "":
		UiTheme.draw_text(self, "NO CAR", Vector2(0, size.y * 0.5 - UiTheme.size_for("h3") * 0.5), "h3", UiTheme.color("cream"), size.x, HORIZONTAL_ALIGNMENT_CENTER)
		return
	_draw_car()
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


func _draw_car() -> void:
	var body := Rect2(size.x * 0.17, size.y * 0.50, size.x * 0.66, size.y * 0.22)
	var cabin := Rect2(size.x * 0.32, size.y * 0.33, size.x * 0.34, size.y * 0.18)
	draw_rect(body, body_color())
	draw_rect(cabin, body_color().lightened(0.1))
	var inner: Rect2 = cabin.grow(-4.0)
	var win_w: float = (inner.size.x - 4.0) * 0.5
	var cyan: Color = UiTheme.color("cyan")
	draw_rect(Rect2(inner.position, Vector2(win_w, inner.size.y)), cyan)
	draw_rect(Rect2(inner.position + Vector2(win_w + 4.0, 0), Vector2(win_w, inner.size.y)), cyan)
	var wheel_r: float = size.y * 0.10
	var wheel_y: float = size.y * 0.74
	for wx in [size.x * 0.30, size.x * 0.70]:
		var c := Vector2(wx, wheel_y)
		draw_circle(c, wheel_r, UiTheme.color("black"))
		draw_circle(c, wheel_r * 0.5, UiTheme.color("lightgrey"))
	var rust: Array[Vector2] = [
		Vector2(0.20, 0.30), Vector2(0.62, 0.55), Vector2(0.45, 0.62), Vector2(0.80, 0.28),
	]
	var patches: int = 0
	if _wear == 3:
		patches = 4
	elif _wear >= 2:
		patches = 2
	for i in range(patches):
		var p: Vector2 = body.position + Vector2(body.size.x * rust[i].x, body.size.y * rust[i].y)
		draw_rect(Rect2(p, Vector2(4, 4)), UiTheme.color("orange"))


func _draw_plaque() -> void:
	var plaque := Rect2(0, size.y - PLAQUE_H, size.x, PLAQUE_H)
	draw_rect(plaque, UiTheme.color("cream"))
	UiTheme.draw_text(self, display_name(), plaque.position, "caption", UiTheme.color("ink"), size.x, HORIZONTAL_ALIGNMENT_CENTER)
