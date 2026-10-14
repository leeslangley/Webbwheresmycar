extends "res://tests/harness.gd"

# Tests for the CRT shader files, CrtMath and the demo scene (no frames are waited for).


func test_warp_values() -> void:
	eq(CrtMath.warp(Vector2(0.5, 0.5), 0.12), Vector2(0.5, 0.5), "centre is fixed")
	var w := CrtMath.warp(Vector2(1.0, 0.5), 0.12)
	near(w.x, 1.01545, 1e-6, "right edge bulges out")
	near(w.y, 0.5, 1e-6, "right edge y unchanged")
	eq(CrtMath.warp(Vector2(0.3, 0.8), 0.0), Vector2(0.3, 0.8), "zero curvature is identity")
	near(CrtMath.warp(Vector2(0.0, 0.5), 0.12).x, -0.01545, 1e-6, "left edge bulges out (symmetry)")


func test_inside() -> void:
	ok(CrtMath.inside(Vector2(0.5, 0.5)), "centre is inside")
	ok(not CrtMath.inside(Vector2(1.01545, 0.5)), "bulged point is outside")
	ok(CrtMath.inside(Vector2(0, 0)), "corner origin is inside")


func test_glass_to_source() -> void:
	eq(CrtMath.glass_to_source(Vector2(300, 210), Vector2(600, 420), Vector2(640, 448), 0.0), Vector2(320, 224), "centre with no curvature")
	var c := CrtMath.glass_to_source(Vector2(300, 210), Vector2(600, 420), Vector2(640, 448))
	near(c.x, 320.0, 1e-4, "centre x with default curvature")
	near(c.y, 224.0, 1e-4, "centre y with default curvature")
	eq(CrtMath.glass_to_source(Vector2(0, 0), Vector2(600, 420), Vector2(640, 448), 0.0), Vector2(0, 0), "top-left corner")


func test_shader_loads() -> void:
	var sh := load("res://tv/crt.gdshader") as Shader
	ok(sh != null, "crt.gdshader loads as a Shader")
	if sh == null:
		return
	ok(sh.code.contains("uniform float curvature"), "has curvature uniform")
	ok(sh.code.contains("scanline_strength"), "has scanline_strength uniform")
	ok(sh.code.contains("static_amount"), "has static_amount uniform")
	ok(sh.code.contains("vec2 warp(vec2 uv)"), "has warp function")


func test_demo_instantiates() -> void:
	var d := (load("res://tv/crt_demo.tscn") as PackedScene).instantiate()
	tree().root.add_child(d)
	# The runner executes tests inside _initialize, before the root window is in the tree, so
	# _ready() never fires on its own here. Call it by hand to build the test card.
	d.call("_ready")
	var glass := d.get_node_or_null("Glass") as TextureRect
	ok(glass != null, "demo has a Glass TextureRect")
	if glass != null:
		ok(glass.material is ShaderMaterial, "Glass uses a ShaderMaterial")
	d.free()
