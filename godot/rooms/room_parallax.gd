class_name RoomParallax
extends Node

# Turns the pointer position (or the phone's tilt) into a look vector in -1..1 and shifts the room's
# art layers a few whole pixels against it, the front layer most. Hotspots and Ui never move. Port of
# PARALLAX in src/art/rooms.js and the look from the pointer in src/boot.js.

const SHIFT_PX := {
	"Background": Vector2(2, 1),
	"Props": Vector2(3, 1.5),
	"Characters": Vector2(4, 2),
	"Lights": Vector2(3, 1.5),
	"Front": Vector2(6, 3),
}
const RATE := 8.0
const GRAVITY_FULL := 4.9

var room: Node = null
var look := Vector2.ZERO
var target := Vector2.ZERO
var enabled := true
var use_gravity := false
var _base: Dictionary = {}


static func look_from_pointer(p: Vector2, size: Vector2) -> Vector2:
	return Vector2(
		clampf((p.x - size.x / 2.0) / (size.x / 2.0), -1.0, 1.0),
		clampf((p.y - size.y / 2.0) / (size.y / 2.0), -1.0, 1.0))


# A tilt of about 30 degrees (4.9 m/s^2 of gravity on the screen axes) is full look.
static func look_from_gravity(g: Vector3) -> Vector2:
	return Vector2(clampf(g.x / GRAVITY_FULL, -1.0, 1.0), clampf(-g.y / GRAVITY_FULL, -1.0, 1.0))


static func shift_for(layer_name: String, look_vec: Vector2) -> Vector2:
	var px: Vector2 = SHIFT_PX.get(layer_name, Vector2.ZERO)
	return (-look_vec * px).round()


func attach(room_node: Node) -> void:
	room = room_node
	_base = {}
	for layer_name in RoomBase.LAYER_NAMES:
		var layer := room.get_node_or_null(layer_name) as Node2D
		if layer != null:
			_base[layer_name] = layer.position
	use_gravity = OS.has_feature("ios") or OS.has_feature("android")


func set_pointer(local_pos: Vector2, size := Vector2(1280, 720)) -> void:
	target = look_from_pointer(local_pos, size)


func step(delta: float) -> void:
	if not enabled:
		return
	if use_gravity:
		target = look_from_gravity(Input.get_gravity())
	look = look.lerp(target, 1.0 - exp(-RATE * delta))
	apply()


func apply() -> void:
	if room == null:
		return
	for layer_name in _base:
		var layer := room.get_node_or_null(layer_name) as Node2D
		if layer != null:
			layer.position = _base[layer_name] + shift_for(layer_name, look)


func _process(delta: float) -> void:
	step(delta)


func _input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and room is Control:
		set_pointer((room as Control).get_local_mouse_position())
