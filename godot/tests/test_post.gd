extends "res://tests/harness.gd"


func _make() -> Node:
	var scene := load("res://art/post.tscn") as PackedScene
	return scene.instantiate()


func test_shader_text() -> void:
	var src := FileAccess.get_file_as_string("res://art/post.gdshader")
	ok(src.contains("shader_type canvas_item;"), "canvas_item shader")
	ok(src.contains("hint_screen_texture"), "screen texture hint")
	ok(src.contains("uniform float vignette"), "vignette uniform")
	ok(src.contains("uniform float grain"), "grain uniform")
	ok(src.contains("uniform float glow"), "glow uniform")
	ok(src.contains("textureLod("), "glow uses textureLod")


func test_scene_layout() -> void:
	var node := _make()
	eq(node.layer, 100, "layer is 100")
	var rect := node.get_node("Rect") as ColorRect
	ok(rect != null, "Rect is a ColorRect")
	eq(rect.mouse_filter, 2, "Rect ignores the mouse")
	var mat := rect.material as ShaderMaterial
	ok(mat != null and mat.shader != null, "Rect has a ShaderMaterial with a shader")
	node.free()


func test_params() -> void:
	var node := _make()
	ok(node.set_param("grain", 0.1), "grain accepted")
	near(node.get_param("grain"), 0.1, 1e-6, "grain round trip")
	ok(not node.set_param("nope", 1.0), "unknown param refused")
	node.free()


func test_enable_and_processing() -> void:
	var node := _make()
	node.set_enabled(true)
	ok(node.is_enabled(), "enabled")
	ok(node.is_processing(), "processing while enabled")
	node.set_enabled(false)
	ok(not node.is_enabled(), "disabled")
	ok(not node.is_processing(), "not processing while disabled")
	node.free()


func test_starts_off() -> void:
	var node := _make()
	# add_child does not run _ready synchronously under the runner, so call it directly.
	node.set_enabled(true)
	node._ready()
	ok(not node.is_enabled(), "off after _ready")
	ok(not node.is_processing(), "not processing after _ready")
	node.free()


func test_apply_settings() -> void:
	var node := _make()
	node.apply_settings({"crt": false})
	ok(not node.is_enabled(), "crt false turns it off")
	node.apply_settings({"crt": true, "scanlines": 0.5})
	ok(node.is_enabled(), "crt true turns it on")
	near(node.get_param("scanlines"), 0.5, 1e-6, "scanlines from settings")
	node.apply_settings({})
	ok(not node.is_enabled(), "empty settings turn it off")
	node.free()
