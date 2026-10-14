class_name Showroom
extends Control

# The showroom stage the SHOP channel shows a car on (GDA07). Port of the look of src/art/showroom.js (drawShowroom)
# and the reflection of src/art/carfx.js (drawReflection). build() is idempotent; _ready() calls it. build() also
# builds the CarView child itself, so tests can call it without a SceneTree.

const W := 596
const H := 420
const FLOOR_Y := 300
const SEAM_STEP := 64
const CONE_X := 298.0
const CONE_HALF := 178.0
const POOL_RX := 170.0
const POOL_RY := 18.0
const REFLECT_ROWS := 60.0

@export var default_car := ""

var _view: CarView
var _reflect_clip: Control
var _reflect: TextureRect
var _cone: Polygon2D
var _pool: Polygon2D


func _ready() -> void:
	build()


func build() -> void:
	size = Vector2(W, H)
	if get_node_or_null("Wall") != null:
		return

	add_child(_rect("Wall", Vector2(0, 0), Vector2(W, FLOOR_Y), Color("3B3470")))

	var seams := Control.new()
	seams.name = "Seams"
	add_child(seams)
	for x in range(SEAM_STEP, W, SEAM_STEP):
		seams.add_child(_rect("Seam%d" % x, Vector2(x, 0), Vector2(2, FLOOR_Y), Color("2F2A5C")))

	add_child(_rect("Dado", Vector2(0, FLOOR_Y - 28), Vector2(W, 4), Color("6C5EB5")))
	add_child(_rect("Floor", Vector2(0, FLOOR_Y), Vector2(W, H - FLOOR_Y), Color("4A4180")))

	_cone = _light("Cone", PackedVector2Array([
		Vector2(CONE_X, 0),
		Vector2(CONE_X + CONE_HALF, FLOOR_Y + 30),
		Vector2(CONE_X - CONE_HALF, FLOOR_Y + 30),
	]), Color(1.0, 0.9, 0.6, 0.10))
	add_child(_cone)

	var ellipse := PackedVector2Array()
	for i in 32:
		var a := TAU * float(i) / 32.0
		ellipse.append(Vector2(CONE_X + POOL_RX * cos(a), FLOOR_Y + 60.0 + POOL_RY * sin(a)))
	_pool = _light("Pool", ellipse, Color(1.0, 0.9, 0.6, 0.18))
	add_child(_pool)

	_view = (load("res://art/carview.tscn") as PackedScene).instantiate() as CarView
	_view.name = "View"
	_view.position = Vector2(0, 40)
	_view.size = Vector2(W, 300)
	_view.build()
	_view.set_view("three_quarter")
	_view.turntable(true)
	_view.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_view)

	_reflect_clip = Control.new()
	_reflect_clip.name = "ReflectClip"
	_reflect_clip.clip_contents = true
	add_child(_reflect_clip)

	_reflect = TextureRect.new()
	_reflect.name = "Reflect"
	_reflect.texture = _view.get_texture()
	_reflect.flip_v = true
	_reflect.modulate = Color(1, 1, 1, 0.16)
	_reflect.stretch_mode = TextureRect.STRETCH_SCALE
	_reflect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_reflect.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	_reflect_clip.add_child(_reflect)

	if default_car != "":
		_view.set_car(default_car)
	_place_reflection()


# The mirror of the car below its ground row. Only the first REFLECT_ROWS px under the ground line show.
func _place_reflection() -> void:
	var g := _view.position.y + _view.ground_y_px()
	_reflect_clip.position = Vector2(0, g)
	_reflect_clip.size = Vector2(W, REFLECT_ROWS)
	_reflect.size = _view.size
	_reflect.position = Vector2(_view.position.x, (2.0 * g - (_view.position.y + _view.size.y)) - _reflect_clip.position.y)


func set_car(id: String) -> bool:
	var ok: bool = _view.set_car(id)
	_place_reflection()
	return ok


func set_paint(c: Color) -> void:
	_view.set_paint(c)


func set_wear(w: float) -> void:
	_view.set_wear(w)


func spin(on: bool) -> void:
	_view.turntable(on)


func spot_on(on: bool) -> void:
	_cone.visible = on
	_pool.visible = on


func get_view() -> CarView:
	return _view


static func _rect(n: String, pos: Vector2, sz: Vector2, col: Color) -> ColorRect:
	var r := ColorRect.new()
	r.name = n
	r.position = pos
	r.size = sz
	r.color = col
	return r


static func _light(n: String, pts: PackedVector2Array, col: Color) -> Polygon2D:
	var p := Polygon2D.new()
	p.name = n
	p.polygon = pts
	p.color = col
	var m := CanvasItemMaterial.new()
	m.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
	p.material = m
	return p
