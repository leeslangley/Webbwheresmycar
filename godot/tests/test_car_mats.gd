extends "res://tests/harness.gd"


func test_paint_is_paint_shader_with_base_and_wear() -> void:
	var m := CarMats.make("paint", Color.RED, 2.0)
	ok(m is ShaderMaterial, "paint is a ShaderMaterial")
	var sm := m as ShaderMaterial
	eq(sm.get_shader_parameter("base_color"), Color.RED, "paint base_color is the paint colour")
	near(float(sm.get_shader_parameter("wear")), 2.0, 1e-9, "paint wear is 2.0")
	ok(sm.shader.resource_path.ends_with("car_paint.gdshader"), "paint uses car_paint.gdshader")
	eq(m.resource_name, "paint", "paint resource_name is the class")


func test_paint2_is_paint_shader() -> void:
	var m := CarMats.make("paint2", Color.RED, 2.0)
	ok(m is ShaderMaterial, "paint2 is a ShaderMaterial")
	var sm := m as ShaderMaterial
	ok(sm.shader.resource_path.ends_with("car_paint.gdshader"), "paint2 uses car_paint.gdshader")
	eq(m.resource_name, "paint2", "paint2 resource_name is the class")


func test_paint_wear_is_clamped_to_three() -> void:
	var m := CarMats.make("paint", Color.RED, 9.0)
	near(float((m as ShaderMaterial).get_shader_parameter("wear")), 3.0, 1e-9, "wear 9.0 clamps to 3.0")


func test_chrome_env_ramp_is_cached_instance() -> void:
	var m := CarMats.make("chrome", Color.WHITE, 0.0)
	ok(m is ShaderMaterial, "chrome is a ShaderMaterial")
	var ramp = (m as ShaderMaterial).get_shader_parameter("env_ramp")
	ok(ramp == CarMats.env_ramp(), "chrome env_ramp is the env_ramp() object")
	ok(CarMats.env_ramp() == CarMats.env_ramp(), "env_ramp() returns the same instance on a second call")
	eq(m.resource_name, "chrome", "chrome resource_name is the class")


func test_glass_is_shader_material() -> void:
	var m := CarMats.make("glass", Color.WHITE, 0.0)
	ok(m is ShaderMaterial, "glass is a ShaderMaterial")
	ok((m as ShaderMaterial).shader.resource_path.ends_with("glass.gdshader"), "glass uses glass.gdshader")
	eq(m.resource_name, "glass", "glass resource_name is the class")


func test_plain_classes_are_standard_materials() -> void:
	for cls in ["lamp", "tail", "trim", "tyre", "wall"]:
		var m := CarMats.make(cls, Color.WHITE, 0.0)
		ok(m is StandardMaterial3D, cls + " is a StandardMaterial3D")
		eq(m.resource_name, cls, cls + " resource_name is the class")


func test_lamp_emits() -> void:
	var m := CarMats.make("lamp", Color.WHITE, 0.0) as StandardMaterial3D
	ok(m != null and m.emission_enabled, "lamp has emission enabled")


func test_unknown_class_gets_trim_albedo() -> void:
	var m := CarMats.make("zzz", Color.WHITE, 0.0) as StandardMaterial3D
	ok(m != null, "unknown class is a StandardMaterial3D")
	var trim := CarMats.make("trim", Color.WHITE, 0.0) as StandardMaterial3D
	eq(m.albedo_color, trim.albedo_color, "unknown class albedo equals trim albedo")


func test_make_returns_non_null_for_every_class() -> void:
	var classes: PackedStringArray = CarMats.CLASSES
	eq(classes.size(), 9, "nine part classes")
	for cls in classes:
		ok(CarMats.make(cls, Color.WHITE, 0.0) != null, cls + " make is non-null")


func test_env_ramp_has_five_points() -> void:
	eq(CarMats.env_ramp().gradient.get_point_count(), 5, "env_ramp gradient has 5 points")


func test_set_wear_on_shader_material() -> void:
	var m := CarMats.make("paint", Color.RED, 0.0)
	CarMats.set_wear(m, 1.5)
	near(float((m as ShaderMaterial).get_shader_parameter("wear")), 1.5, 1e-9, "set_wear sets 1.5")


func test_set_wear_on_standard_material_is_harmless() -> void:
	var m := CarMats.make("trim", Color.WHITE, 0.0)
	CarMats.set_wear(m, 1.5)
	ok(m is StandardMaterial3D, "trim is still a StandardMaterial3D after set_wear")
