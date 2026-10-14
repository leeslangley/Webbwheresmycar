extends "res://tests/harness.gd"

# CarView outline pass (GDA22). Tests build the scene and call build() themselves; no SceneTree, no add_child on the test.


func _make() -> CarView:
	var cv := (load("res://art/carview.tscn") as PackedScene).instantiate() as CarView
	cv.build()
	return cv


func test_shader_loads_with_uniforms() -> void:
	var sh := load("res://art/car_outline.gdshader") as Shader
	ok(sh != null, "car_outline.gdshader loads as a Shader")
	if sh == null:
		return
	var names: Array = []
	for u in sh.get_shader_uniform_list():
		names.append(u["name"])
	ok(names.has("outline_color"), "has outline_color uniform")
	ok(names.has("edge_threshold"), "has edge_threshold uniform")


func test_outline_material_on_box() -> void:
	var cv := _make()
	ok(cv.outline, "outline is on by default")
	var box := cv.get_node("Box") as SubViewportContainer
	ok(box.material is ShaderMaterial, "Box has a ShaderMaterial when outline is on")
	if box.material is ShaderMaterial:
		var sh := (box.material as ShaderMaterial).shader
		ok(sh != null and sh.resource_path == "res://art/car_outline.gdshader", "Box material uses car_outline.gdshader")
	ok(box.stretch, "Box stretch stays on with outline")
	eq(box.texture_filter, CanvasItem.TEXTURE_FILTER_NEAREST, "Box texture_filter stays nearest with outline")
	cv.set_outline(false)
	ok(not cv.outline, "set_outline(false) clears the flag")
	ok(box.material == null, "Box has no material after set_outline(false)")
	cv.set_outline(true)
	ok(box.material is ShaderMaterial, "set_outline(true) puts the material back")
	cv.free()


func test_view_shrinks() -> void:
	eq(int(CarView.VIEWS["side"]["shrink"]), 2, "side view shrink is 2")
	eq(int(CarView.VIEWS["three_quarter"]["shrink"]), 2, "three_quarter view shrink is 2")
	eq(int(CarView.VIEWS["front"]["shrink"]), 3, "front view shrink is 3")
	eq(int(CarView.VIEWS["mini"]["shrink"]), 2, "mini view shrink is 2")
	eq(float(CarView.VIEWS["side"]["size"]), 3.2, "side view size unchanged at 3.2")
