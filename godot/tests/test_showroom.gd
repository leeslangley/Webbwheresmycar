extends "res://tests/harness.gd"

# Showroom (GDA07). Tests build the scene and call build() themselves; no SceneTree, no add_child on the test.


func _make() -> Showroom:
	var s := (load("res://art/showroom.tscn") as PackedScene).instantiate() as Showroom
	s.build()
	return s


# Same scene with no default car, so the test loads its own car once.
func _make_bare() -> Showroom:
	var s := (load("res://art/showroom.tscn") as PackedScene).instantiate() as Showroom
	s.default_car = ""
	s.build()
	return s


func test_child_order() -> void:
	var s := _make()
	var names: Array[String] = []
	for c in s.get_children():
		names.append(str(c.name))
	eq(names, ["Wall", "Seams", "Dado", "Floor", "Cone", "Pool", "View", "ReflectClip"], "child order")
	eq(s.size, Vector2(596, 420), "stage size is 596x420")
	s.free()


func test_seams() -> void:
	var s := _make()
	var seams := s.get_node_or_null("Seams")
	ok(seams != null, "Seams exists")
	if seams != null:
		# Same loop as src/art/showroom.js: x = 64, 128, ... while x < 596, so 64 .. 576 (nine seams).
		eq(seams.get_child_count(), 9, "nine seams")
		var xs: Array[int] = []
		for c in seams.get_children():
			xs.append(int((c as ColorRect).position.x))
		eq(xs, [64, 128, 192, 256, 320, 384, 448, 512, 576], "seam x positions")
		var first := seams.get_child(0) as ColorRect
		eq(first.size, Vector2(2, 300), "seam is 2 px wide, floor high")
	s.free()


func test_cone_is_additive() -> void:
	var s := _make()
	var cone := s.get_node("Cone") as Polygon2D
	ok(cone.material is CanvasItemMaterial, "Cone material is a CanvasItemMaterial")
	if cone.material is CanvasItemMaterial:
		eq((cone.material as CanvasItemMaterial).blend_mode, CanvasItemMaterial.BLEND_MODE_ADD, "Cone blend is ADD")
	var pool := s.get_node("Pool") as Polygon2D
	eq(pool.polygon.size(), 32, "Pool is a 32 point ellipse")
	s.free()


func test_default_car() -> void:
	var s := _make()
	eq(s.get_view().car_id, "t1_chimp", "scene shows the default car t1_chimp")
	ok(s.get_view().car_node() != null, "default car node exists")
	s.free()


func test_car_set_and_paint() -> void:
	var s := _make_bare()
	eq(s.get_view().car_id, "", "no car before set_car")
	ok(s.set_car("t1_chimp"), "set_car t1_chimp is true")
	eq(s.get_view().car_id, "t1_chimp", "view car_id is t1_chimp")
	s.set_paint(Color("3b4a2f"))
	eq(s.get_view().car_id, "t1_chimp", "car stays set after set_paint")
	ok(not s.set_car("nope"), "unknown car id is false")
	s.free()


func test_spin() -> void:
	var s := _make()
	s.spin(false)
	ok(not s.get_view().is_processing(), "spin(false) stops the turntable")
	s.spin(true)
	ok(s.get_view().is_processing(), "spin(true) starts the turntable")
	s.free()


func test_spot() -> void:
	var s := _make()
	var cone := s.get_node("Cone") as Polygon2D
	var pool := s.get_node("Pool") as Polygon2D
	s.spot_on(false)
	ok(not cone.visible and not pool.visible, "spot_on(false) hides Cone and Pool")
	s.spot_on(true)
	ok(cone.visible and pool.visible, "spot_on(true) shows Cone and Pool")
	s.free()


func test_reflection() -> void:
	var s := _make()
	var clip := s.get_node("ReflectClip") as Control
	ok(clip.clip_contents, "ReflectClip clips its contents")
	var reflect := s.get_node("ReflectClip/Reflect") as TextureRect
	ok(reflect.flip_v, "Reflect is flipped vertically")
	ok(reflect.texture == s.get_view().get_texture(), "Reflect shows the view texture")
	var view := s.get_view()
	var g := view.position.y + view.ground_y_px()
	near(clip.position.y, g, 1e-3, "ReflectClip starts at the ground row")
	near(reflect.position.y, (2.0 * g - (view.position.y + view.size.y)) - g, 1e-3, "Reflect is mirrored about the ground row")
	s.free()


func test_view_mode() -> void:
	var s := _make()
	eq(s.get_view().view, "three_quarter", "view is three_quarter")
	s.free()
