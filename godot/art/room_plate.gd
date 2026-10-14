class_name RoomPlate
extends Node2D

# One room from the JSON written by tools/art/export_room_layers.py (GDA11): an optional sky gradient behind the
# window, the layer plates (parallax against the pointer) and one PointLight2D per light (lamps flicker, the window
# light follows the hour). Port of src/art/roomfx_light.js (flicker), roomfx_world.js (skyColors) and rooms.js.

const LIGHT_MASK: int = 2
const LOOK_LIMIT: float = 1.0

static var _radial_cache: GradientTexture2D = null

var room_id: String = ""
var _t: float = 0.0
var _parallax: Dictionary = {}
var _lights: Dictionary = {}


static func flicker(t: float, seed: float, depth: float) -> float:
	return 1.0 - depth * (0.5 + 0.5 * (0.6 * sin(t * 7.3 + seed) + 0.4 * sin(t * 17.9 + seed * 2.1)))


static func sky_colors(hour: int) -> Dictionary:
	if hour >= 6 and hour <= 8:
		return {"top": Color("#3b4a8a"), "bottom": Color("#f2a65a")}
	if hour >= 9 and hour <= 16:
		return {"top": Color("#6fb4ee"), "bottom": Color("#d8efff")}
	if hour >= 17 and hour <= 19:
		return {"top": Color("#4a3a7a"), "bottom": Color("#f08a5d")}
	return {"top": Color("#0b0d24"), "bottom": Color("#1d2450")}


static func radial_texture() -> GradientTexture2D:
	if _radial_cache == null:
		var grad := Gradient.new()
		grad.set_color(0, Color(1.0, 1.0, 1.0, 1.0))
		grad.set_offset(0, 0.0)
		grad.set_color(1, Color(1.0, 1.0, 1.0, 0.0))
		grad.set_offset(1, 1.0)
		var tex := GradientTexture2D.new()
		tex.gradient = grad
		tex.fill = GradientTexture2D.FILL_RADIAL
		tex.fill_from = Vector2(0.5, 0.5)
		tex.fill_to = Vector2(1.0, 0.5)
		tex.width = 128
		tex.height = 128
		_radial_cache = tex
	return _radial_cache


func build_from(doc: Dictionary, loader: Callable) -> bool:
	if not doc.has("layers"):
		return false
	for child in get_children():
		remove_child(child)
		child.free()
	_parallax.clear()
	_lights.clear()
	room_id = str(doc.get("room", ""))
	var plate_scale: float = float(doc.get("scale", 1.0))

	var sky_doc: Variant = doc.get("sky")
	if sky_doc is Dictionary and sky_doc.has("rect"):
		var r: Array = sky_doc["rect"]
		var sky := Sprite2D.new()
		sky.name = "Sky"
		sky.centered = false
		var sky_tex := GradientTexture2D.new()
		sky_tex.gradient = Gradient.new()
		sky_tex.fill = GradientTexture2D.FILL_LINEAR
		sky_tex.fill_from = Vector2(0.0, 0.0)
		sky_tex.fill_to = Vector2(0.0, 1.0)
		sky_tex.width = 4
		sky_tex.height = 64
		sky.texture = sky_tex
		sky.position = Vector2(float(r[0]), float(r[1]))
		sky.scale = Vector2(float(r[2]) / 4.0, float(r[3]) / 64.0)
		sky.light_mask = LIGHT_MASK
		add_child(sky)

	var layers: Array = doc["layers"]
	for layer in layers:
		var spr := Sprite2D.new()
		var layer_name: String = str(layer["name"])
		spr.name = layer_name
		spr.centered = false
		spr.texture = loader.call(str(layer["file"]))
		spr.scale = Vector2(plate_scale, plate_scale)
		spr.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
		spr.light_mask = LIGHT_MASK
		add_child(spr)
		var p: Array = layer.get("parallax", [0, 0])
		_parallax[layer_name] = Vector2(float(p[0]), float(p[1]))

	var lights: Array = doc.get("lights", [])
	for lt in lights:
		var light_id: String = str(lt["id"])
		var lp := PointLight2D.new()
		lp.name = light_id
		lp.texture = radial_texture()
		var radius: float = float(lt["radius"])
		lp.texture_scale = 2.0 * radius / 128.0
		lp.color = Color(str(lt["color"]))
		var base: float = float(lt["energy"])
		lp.energy = base
		var pos: Array = lt["pos"]
		lp.position = Vector2(float(pos[0]), float(pos[1]))
		lp.range_item_cull_mask = LIGHT_MASK
		lp.blend_mode = Light2D.BLEND_MODE_ADD
		lp.shadow_enabled = false
		add_child(lp)
		_lights[light_id] = {
			"node": lp,
			"kind": str(lt["kind"]),
			"base_energy": base,
			"depth": float(lt["flicker"]),
			"seed": float(lt["seed"]),
			"mult": 1.0,
		}

	set_hour(12)
	set_look(Vector2.ZERO)
	return true


func load_room(id: String) -> bool:
	var file := FileAccess.open("res://art/rooms/" + id + ".json", FileAccess.READ)
	if file == null:
		return false
	var doc: Variant = JSON.parse_string(file.get_as_text())
	if not (doc is Dictionary):
		return false
	return build_from(doc, func(f: String) -> Texture2D: return load("res://art/rooms/" + f) as Texture2D)


func set_look(v: Vector2) -> void:
	var look := Vector2(clampf(v.x, -LOOK_LIMIT, LOOK_LIMIT), clampf(v.y, -LOOK_LIMIT, LOOK_LIMIT))
	for layer_name in _parallax:
		var spr := layer_node(layer_name)
		if spr == null:
			continue
		var p: Vector2 = _parallax[layer_name]
		spr.position = Vector2(-look.x * p.x, -look.y * p.y).round()


func layer_node(layer_name: String) -> Sprite2D:
	return get_node_or_null(NodePath(layer_name)) as Sprite2D


func light_node(light_id: String) -> PointLight2D:
	return get_node_or_null(NodePath(light_id)) as PointLight2D


func sky_node() -> Sprite2D:
	return get_node_or_null(NodePath("Sky")) as Sprite2D


func set_hour(h: int) -> void:
	var sky := sky_node()
	if sky != null and sky.texture is GradientTexture2D:
		var colours := sky_colors(h)
		var grad: Gradient = (sky.texture as GradientTexture2D).gradient
		grad.set_color(0, colours["top"])
		grad.set_color(1, colours["bottom"])

	var day: bool = h >= 9 and h <= 16
	var dusk: bool = (h >= 6 and h <= 8) or (h >= 17 and h <= 19)
	var window_colour: Color
	var mult: float
	if day:
		window_colour = Color("#b4c8e6")
		mult = 1.0
	elif dusk:
		window_colour = Color("#f2a65a")
		mult = 0.8
	else:
		window_colour = Color("#9db4ff")
		mult = 0.35
	for light_id in _lights:
		var rec: Dictionary = _lights[light_id]
		if rec["kind"] != "window":
			continue
		rec["mult"] = mult
		var node: PointLight2D = rec["node"]
		node.color = window_colour
		node.energy = float(rec["base_energy"]) * mult


func _process(delta: float) -> void:
	_t += delta
	for light_id in _lights:
		var rec: Dictionary = _lights[light_id]
		var depth: float = rec["depth"]
		if depth > 0.0:
			var node: PointLight2D = rec["node"]
			node.energy = float(rec["base_energy"]) * float(rec["mult"]) * flicker(_t, float(rec["seed"]), depth)
