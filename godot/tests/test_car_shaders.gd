extends "res://tests/harness.gd"

const PREVIEW := "res://art/previews/mat_preview.tscn"


func _check_shader_file(path: String) -> void:
	var sh := load(path) as Shader
	ok(sh != null, path + " loads as a Shader")
	var txt: String = FileAccess.get_file_as_string(path)
	ok(txt.contains("shader_type spatial;"), path + " is a spatial shader")
	ok(txt.contains("#include \"res://art/car_wear.gdshaderinc\""), path + " includes the wear include")
	ok(txt.contains("uniform float wear"), path + " has a wear uniform")


func test_paint_shader_file() -> void:
	var path := "res://art/car_paint.gdshader"
	_check_shader_file(path)
	var txt: String = FileAccess.get_file_as_string(path)
	ok(txt.contains("uniform vec4 base_color : source_color"), "paint has base_color")
	ok(txt.contains("void light()"), "paint has light()")
	ok(txt.contains("uniform float ground_y"), "paint has ground_y")


func test_chrome_shader_file() -> void:
	var path := "res://art/chrome.gdshader"
	_check_shader_file(path)
	var txt: String = FileAccess.get_file_as_string(path)
	ok(txt.contains("uniform sampler2D env_ramp"), "chrome has env_ramp")


func test_glass_shader_file() -> void:
	_check_shader_file("res://art/glass.gdshader")


func test_wear_parameter_round_trips() -> void:
	var mat := ShaderMaterial.new()
	mat.shader = load("res://art/car_paint.gdshader")
	mat.set_shader_parameter("wear", 2.0)
	near(float(mat.get_shader_parameter("wear")), 2.0, 1e-9, "wear is 2.0 after set")


func test_mat_preview_builds_twelve_spheres() -> void:
	var scene := load(PREVIEW) as PackedScene
	ok(scene != null, "preview scene loads")
	if scene == null:
		return
	var node = scene.instantiate()
	node.build()
	eq(_count_meshes(node), 12, "twelve sphere meshes")
	var cam: Camera3D = _find_camera(node)
	ok(cam != null, "preview has a Camera3D")
	if cam != null:
		eq(cam.projection, Camera3D.PROJECTION_ORTHOGONAL, "camera is orthographic")
	node.free()


func test_mat_preview_build_is_idempotent() -> void:
	var scene := load(PREVIEW) as PackedScene
	if scene == null:
		fail("preview scene loads")
		return
	var node = scene.instantiate()
	node.build()
	node.build()
	eq(_count_meshes(node), 12, "second build adds no spheres")
	node.free()


func _count_meshes(n: Node) -> int:
	var c: int = 1 if n is MeshInstance3D else 0
	for ch in n.get_children():
		c += _count_meshes(ch)
	return c


func _find_camera(n: Node) -> Camera3D:
	if n is Camera3D:
		return n as Camera3D
	for ch in n.get_children():
		var found: Camera3D = _find_camera(ch)
		if found != null:
			return found
	return null
