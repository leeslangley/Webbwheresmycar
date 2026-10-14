extends "res://tests/harness.gd"

# CarView (GDA03). Tests build the scene and call build() themselves; no SceneTree, no add_child on the test.


func _make() -> CarView:
	var cv := (load("res://art/carview.tscn") as PackedScene).instantiate() as CarView
	cv.build()
	return cv


func test_build_tree() -> void:
	var cv := _make()
	var cam := cv.get_node_or_null("Box/VP/Rig/Cam") as Camera3D
	ok(cam != null, "Box/VP/Rig/Cam exists")
	ok(cam != null and cam.projection == Camera3D.PROJECTION_ORTHOGONAL, "Cam is orthogonal")
	var box := cv.get_node_or_null("Box") as SubViewportContainer
	ok(box != null, "Box exists")
	if box != null:
		eq(box.stretch_shrink, 3, "Box stretch_shrink is 3")
		eq(box.texture_filter, CanvasItem.TEXTURE_FILTER_NEAREST, "Box texture_filter is nearest")
	ok(cv.get_node_or_null("Box/VP/Pivot/Blob") != null, "Box/VP/Pivot/Blob exists")
	cv.free()


func test_set_car_unknown_and_chimp() -> void:
	var cv := _make()
	ok(not cv.set_car("nope"), "unknown car id is false")
	eq(cv.car_id, "", "car_id stays empty after unknown id")
	ok(cv.set_car("t1_chimp"), "t1_chimp loads")
	eq(cv.car_id, "t1_chimp", "car_id is t1_chimp")
	var car := cv.car_node()
	ok(car != null, "car_node is not null")
	if car != null:
		near(car.scale.x, 0.3556, 1e-4, "car scale is len_mm / 10000")
		var entry: Dictionary = CarView.manifest()["cars"]["t1_chimp"]
		var bmin: Array = entry["bbox_min"]
		near(car.position.y, -float(bmin[1]) * 0.3556, 1e-4, "car position.y lifts bbox_min to the ground")
	var classes := cv.surface_classes()
	ok(int(classes.get("paint", 0)) >= 1, "paint surfaces >= 1")
	ok(int(classes.get("tyre", 0)) >= 4, "tyre surfaces >= 4")
	ok(int(classes.get("glass", 0)) >= 1, "glass surfaces >= 1")
	cv.free()


func test_paint_and_wear() -> void:
	var cv := _make()
	cv.set_car("t1_chimp")
	cv.set_paint(Color(1, 0, 0))
	var mats := cv.paint_materials()
	ok(mats.size() > 0, "paint materials exist")
	for m in mats:
		ok(m is ShaderMaterial, "paint material is a ShaderMaterial")
		if m is ShaderMaterial:
			eq((m as ShaderMaterial).get_shader_parameter("base_color"), Color(1, 0, 0), "paint base_color is red")
	cv.set_wear(5.0)
	eq(cv.wear, 3.0, "wear 5.0 clamps to 3.0")
	# set_wear rebuilds the surface materials, so read them again.
	for m in cv.paint_materials():
		if m is ShaderMaterial:
			near(float((m as ShaderMaterial).get_shader_parameter("wear")), 3.0, 1e-6, "paint wear param is 3.0")
	cv.set_wear(-2.0)
	eq(cv.wear, 0.0, "wear -2.0 clamps to 0.0")
	cv.free()


func test_views() -> void:
	var cv := _make()
	var box := cv.get_node("Box") as SubViewportContainer
	var rig := cv.get_node("Box/VP/Rig") as Node3D
	var cam := cv.get_node("Box/VP/Rig/Cam") as Camera3D
	ok(cv.set_view("front"), "front view is known")
	near(rig.rotation_degrees.y, 90.0, 1e-4, "front view yaw is 90")
	near(cam.size, 2.4, 1e-4, "front view size is 2.4")
	ok(cv.set_view("mini"), "mini view is known")
	eq(box.stretch_shrink, 2, "mini view shrink is 2")
	ok(not cv.set_view("zzz"), "unknown view is false")
	eq(cv.view, "mini", "view stays mini after unknown name")
	cv.free()


func test_turntable() -> void:
	var cv := _make()
	var pivot := cv.get_node("Box/VP/Pivot") as Node3D
	cv.turntable(true)
	ok(cv.is_processing(), "turntable(true) enables processing")
	near(pivot.rotation.y, 0.0, 1e-9, "pivot starts at 0")
	cv._process(1.0)
	near(pivot.rotation.y, 0.6, 1e-6, "one second turns 0.6 rad")
	cv.turntable(false)
	ok(not cv.is_processing(), "turntable(false) disables processing")
	cv.free()


func test_texture_and_ground_px() -> void:
	var cv := _make()
	ok(cv.get_texture() != null, "get_texture is not null")
	cv.size = Vector2(480, 240)
	cv.set_view("side")
	near(cv.ground_y_px(), 176.2, 0.5, "ground row for side view at 480x240")
	cv.free()
