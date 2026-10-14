class_name CarView
extends Control

# One node that shows a car: a SubViewport with an orthographic camera, a key light and a rim light, the car glb
# loaded by id, rendered at 1/3 size and scaled up with the nearest filter (the pixel look). Paint, wear and view
# are set from code. build() is idempotent; _ready() calls it.

const CARS_DIR := "res://art/cars/"
const TURN_SPEED := 0.6
const TARGET := Vector3(0.0, 0.75, 0.0)
const DIST := 30.0
const VIEWS := {
	"side": {"yaw": 0.0, "pitch": 3.0, "size": 3.2, "shrink": 3},
	"three_quarter": {"yaw": 35.0, "pitch": 12.0, "size": 3.6, "shrink": 3},
	"front": {"yaw": 90.0, "pitch": 4.0, "size": 2.4, "shrink": 3},
	"mini": {"yaw": 0.0, "pitch": 3.0, "size": 3.6, "shrink": 2},
}

@export var default_car := ""

var car_id := ""
var paint := Color("c96f32")
var wear := 0.0
var view := "side"

static var _manifest: Dictionary

var _box: SubViewportContainer
var _vp: SubViewport
var _rig: Node3D
var _cam: Camera3D
var _pivot: Node3D
var _blob: MeshInstance3D
var _entry: Dictionary = {}
var _surfaces: Array = []
var _ground := 0.0
var _body_h := 3.8


func _ready() -> void:
	build()
	if default_car != "":
		set_car(default_car)


static func manifest() -> Dictionary:
	if _manifest.is_empty() and FileAccess.file_exists(CARS_DIR + "manifest.json"):
		var f := FileAccess.open(CARS_DIR + "manifest.json", FileAccess.READ)
		if f != null:
			var parsed: Variant = JSON.parse_string(f.get_as_text())
			if parsed is Dictionary:
				_manifest = parsed
	return _manifest


func build() -> void:
	if get_node_or_null("Box") != null:
		return
	_box = SubViewportContainer.new()
	_box.name = "Box"
	_box.stretch = true
	_box.stretch_shrink = 3
	_box.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
	_box.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_box.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(_box)

	_vp = SubViewport.new()
	_vp.name = "VP"
	_vp.transparent_bg = true
	_vp.own_world_3d = true
	_vp.msaa_3d = Viewport.MSAA_DISABLED
	_vp.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	_box.add_child(_vp)

	var env := Environment.new()
	env.background_mode = Environment.BG_CLEAR_COLOR
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("6e6a8c")
	env.ambient_light_energy = 0.9
	var world := WorldEnvironment.new()
	world.name = "Env"
	world.environment = env
	_vp.add_child(world)

	_rig = Node3D.new()
	_rig.name = "Rig"
	_vp.add_child(_rig)

	_cam = Camera3D.new()
	_cam.name = "Cam"
	_cam.projection = Camera3D.PROJECTION_ORTHOGONAL
	_cam.near = 0.05
	_cam.far = 100.0
	_rig.add_child(_cam)

	var key := DirectionalLight3D.new()
	key.name = "Key"
	key.rotation_degrees = Vector3(-45, -35, 0)
	key.light_color = Color("fff2e0")
	key.light_energy = 1.2
	key.shadow_enabled = true
	_rig.add_child(key)

	var rim := DirectionalLight3D.new()
	rim.name = "Rim"
	rim.rotation_degrees = Vector3(-20, 150, 0)
	rim.light_color = Color("a8c4ff")
	rim.light_energy = 0.7
	_rig.add_child(rim)

	_pivot = Node3D.new()
	_pivot.name = "Pivot"
	_vp.add_child(_pivot)

	_blob = MeshInstance3D.new()
	_blob.name = "Blob"
	_blob.position = Vector3(0.0, 0.01, 0.0)
	_blob.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	var plane := PlaneMesh.new()
	plane.size = Vector2(1.0, 1.0)
	var shadow_grad := Gradient.new()
	shadow_grad.offsets = PackedFloat32Array([0.0, 1.0])
	shadow_grad.colors = PackedColorArray([Color(0, 0, 0, 0.55), Color(0, 0, 0, 0)])
	var shadow_tex := GradientTexture2D.new()
	shadow_tex.gradient = shadow_grad
	shadow_tex.fill = GradientTexture2D.FILL_RADIAL
	shadow_tex.fill_from = Vector2(0.5, 0.5)
	shadow_tex.fill_to = Vector2(1.0, 0.5)
	shadow_tex.width = 64
	shadow_tex.height = 64
	var blob_mat := StandardMaterial3D.new()
	blob_mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	blob_mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	blob_mat.albedo_texture = shadow_tex
	plane.material = blob_mat
	_blob.mesh = plane
	_pivot.add_child(_blob)

	set_process(false)
	set_view("side")


func set_view(v: String) -> bool:
	if not VIEWS.has(v):
		return false
	view = v
	var d: Dictionary = VIEWS[v]
	var pitch_rad := deg_to_rad(float(d["pitch"]))
	_rig.rotation_degrees.y = float(d["yaw"])
	_cam.size = float(d["size"])
	_box.stretch_shrink = int(d["shrink"])
	var cam_pos := TARGET + DIST * Vector3(0.0, sin(pitch_rad), cos(pitch_rad))
	_cam.transform = Transform3D(Basis(), cam_pos).looking_at(TARGET, Vector3.UP)
	return true


func set_car(id: String) -> bool:
	var cars: Dictionary = manifest().get("cars", {})
	if not cars.has(id) or not (cars[id] is Dictionary):
		return false
	var entry: Dictionary = cars[id]
	var path := CARS_DIR + str(entry.get("file", id + ".glb"))
	if not ResourceLoader.exists(path):
		return false
	var scene := load(path) as PackedScene
	if scene == null:
		return false
	var inst := scene.instantiate() as Node3D
	if inst == null:
		return false

	var old := _pivot.get_node_or_null("Car")
	if old != null:
		old.free()
	inst.name = "Car"
	_pivot.add_child(inst)

	var s := float(entry.get("len_mm", 4000)) / 10000.0
	inst.scale = Vector3(s, s, s)
	var bmin := _to_vec3(entry.get("bbox_min", [0.0, 0.0, 0.0]))
	var bmax := _to_vec3(entry.get("bbox_max", [0.0, 0.0, 0.0]))
	inst.position = Vector3(-(bmin.x + bmax.x) * 0.5 * s, -bmin.y * s, -(bmin.z + bmax.z) * 0.5 * s)

	_surfaces.clear()
	for mi in _meshes_under(inst):
		if mi.mesh == null:
			continue
		for i in mi.mesh.get_surface_count():
			_surfaces.append({"mi": mi, "idx": i, "cls": _class_of(mi, i)})

	_entry = entry
	_ground = bmin.y
	_body_h = bmax.y - bmin.y
	var blob_plane := _blob.mesh as PlaneMesh
	blob_plane.size = Vector2((bmax.x - bmin.x) * s * 1.15, (bmax.z - bmin.z) * s * 1.5)
	car_id = id
	_apply()
	return true


func set_paint(c: Color) -> void:
	paint = c
	_apply()


func set_wear(w: float) -> void:
	wear = Wear.clamp_level(w)
	_apply()


func turntable(on: bool) -> void:
	set_process(on)


func _process(delta: float) -> void:
	_pivot.rotation.y += TURN_SPEED * delta


func get_texture() -> Texture2D:
	return _vp.get_texture()


func car_node() -> Node3D:
	if _pivot == null:
		return null
	return _pivot.get_node_or_null("Car") as Node3D


func surface_classes() -> Dictionary:
	var out := {}
	for s in _surfaces:
		var c: String = s["cls"]
		out[c] = int(out.get(c, 0)) + 1
	return out


func paint_materials() -> Array:
	var out := []
	for s in _surfaces:
		if s["cls"] == "paint" or s["cls"] == "paint2":
			out.append((s["mi"] as MeshInstance3D).get_surface_override_material(s["idx"]))
	return out


func ground_y_px() -> float:
	var pitch := float(VIEWS[view]["pitch"])
	return size.y * 0.5 + 0.75 * cos(deg_to_rad(pitch)) * size.y / _cam.size


func _apply() -> void:
	var paint2 := paint
	var hex := str(_entry.get("paint2", ""))
	if hex != "":
		paint2 = Color(hex)
	for s in _surfaces:
		var cls: String = s["cls"]
		var col := paint
		if cls == "paint2":
			col = paint2
		(s["mi"] as MeshInstance3D).set_surface_override_material(
			s["idx"], CarMats.make(cls, col, wear, _ground, _body_h))


static func _class_of(mi: MeshInstance3D, idx: int) -> String:
	var mat := mi.mesh.surface_get_material(idx)
	if mat != null and CarMats.CLASSES.has(mat.resource_name):
		return mat.resource_name
	var prefix := String(mi.name).get_slice("_", 0)
	if CarMats.CLASSES.has(prefix):
		return prefix
	return "trim"


static func _meshes_under(n: Node) -> Array[MeshInstance3D]:
	var out: Array[MeshInstance3D] = []
	if n is MeshInstance3D:
		out.append(n as MeshInstance3D)
	for c in n.get_children():
		out.append_array(_meshes_under(c))
	return out


static func _to_vec3(a: Variant) -> Vector3:
	var arr: Array = a
	return Vector3(float(arr[0]), float(arr[1]), float(arr[2]))
