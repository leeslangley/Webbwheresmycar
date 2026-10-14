extends "res://tests/harness.gd"

# CarPortrait with the real CarView inside (GDA06). Tests build the node themselves; no SceneTree, no add_child on the test.


func test_set_car_shows_car_view() -> void:
	var p := CarPortrait.new()
	ok(p.set_car("t1_chimp", Color("c96f32"), 2.0), "t1_chimp is shown")
	var cv := p.get_view()
	ok(cv != null, "get_view is not null after set_car")
	if cv != null:
		eq(cv.car_id, "t1_chimp", "view car id")
		eq(cv.view, "front", "view is front by default")
		near(cv.wear, 2.0, 1e-6, "view wear is 2.0")
		ok(cv.visible, "view is visible for a known car")
	p.free()


func test_string_paint_reaches_materials() -> void:
	var p := CarPortrait.new()
	p.set_car("t1_chimp", "#3b4a2f", 0.0)
	eq(p.get_paint(), Color("3b4a2f"), "string paint parsed to Color")
	var cv := p.get_view()
	ok(cv != null, "get_view is not null")
	if cv != null:
		var mats := cv.paint_materials()
		ok(mats.size() > 0, "paint materials exist")
		for m in mats:
			ok(m is ShaderMaterial, "paint material is a ShaderMaterial")
			if m is ShaderMaterial:
				eq((m as ShaderMaterial).get_shader_parameter("base_color"), Color("3b4a2f"), "paint base_color from string")
	p.free()


func test_unknown_car_hides_view() -> void:
	var p := CarPortrait.new()
	ok(not p.set_car("nope", Color.WHITE, 0.0), "unknown car id is false")
	ok(p.get_view() != null, "get_view exists after unknown id")
	if p.get_view() != null:
		ok(not p.get_view().visible, "view hidden for unknown car")
	p.set_car("t1_chimp", Color.RED, 0.0)
	ok(not p.set_car("nope", Color.WHITE, 0.0), "unknown car after a known one is false")
	if p.get_view() != null:
		ok(not p.get_view().visible, "view hidden again for unknown car")
	p.free()


func test_clear_hides_view() -> void:
	var p := CarPortrait.new()
	p.set_car("t1_chimp", Color.RED, 0.0)
	p.clear()
	eq(p.get_car_id(), "", "clear empties id")
	if p.get_view() != null:
		ok(not p.get_view().visible, "clear hides the view")
	p.free()


func test_portrait_view() -> void:
	var p := CarPortrait.new()
	p.set_car("t1_chimp", Color.RED, 0.0)
	ok(p.set_portrait_view("mini"), "mini is a known view")
	eq(p.view_name, "mini", "view_name is mini")
	if p.get_view() != null:
		eq(p.get_view().view, "mini", "CarView view is mini")
	ok(not p.set_portrait_view("zzz"), "zzz is an unknown view")
	eq(p.view_name, "mini", "view_name stays mini after unknown view")
	if p.get_view() != null:
		eq(p.get_view().view, "mini", "CarView view stays mini")
	p.free()
