extends "res://tests/harness.gd"

# Runs outside the scene tree: make_overlay and apply_overlay need no _ready.


func test_shader_files_load() -> void:
	ok(load("res://shaders/iris.gdshader") is Shader, "iris.gdshader loads as a Shader")
	ok(load("res://shaders/static_wipe.gdshader") is Shader, "static_wipe.gdshader loads as a Shader")


func test_iris_overlay_material_and_size() -> void:
	var t := Transitions.new()
	var ov := t.make_overlay("iris", Vector2(1280, 720))
	ok(ov != null, "iris overlay made")
	var mat := ov.material as ShaderMaterial
	ok(mat != null, "iris overlay has a ShaderMaterial")
	ok(mat.shader.resource_path.ends_with("iris.gdshader"), "iris overlay uses iris.gdshader")
	eq(mat.get_shader_parameter("rect_size"), Vector2(1280, 720), "iris rect_size set")
	t.apply_overlay(ov, "iris", 0.25, Vector2(1280, 720))
	near(float(mat.get_shader_parameter("radius")), 367.1511950137164, 0.01, "iris radius at u 0.25")
	t.apply_overlay(ov, "iris", 0.5, Vector2(1280, 720))
	near(float(mat.get_shader_parameter("radius")), 0.0, 1e-6, "iris radius at u 0.5 is zero")
	ov.free()
	t.free()


func test_static_overlay_coverage() -> void:
	var t := Transitions.new()
	var ov := t.make_overlay("static", Vector2(1280, 720))
	ok(ov != null, "static overlay made")
	var mat := ov.material as ShaderMaterial
	ok(mat.shader.resource_path.ends_with("static_wipe.gdshader"), "static overlay uses static_wipe.gdshader")
	eq(mat.get_shader_parameter("rect_size"), Vector2(1280, 720), "static rect_size set")
	t.apply_overlay(ov, "static", 0.25, Vector2(1280, 720))
	near(float(mat.get_shader_parameter("coverage")), 0.5, 1e-6, "static coverage at u 0.25")
	t.apply_overlay(ov, "static", 0.5, Vector2(1280, 720))
	near(float(mat.get_shader_parameter("coverage")), 1.0, 1e-6, "static coverage at u 0.5")
	ov.free()
	t.free()


func test_other_kinds_have_no_overlay() -> void:
	var t := Transitions.new()
	ok(t.make_overlay("fade", Vector2(1280, 720)) == null, "fade has no overlay")
	t.free()
