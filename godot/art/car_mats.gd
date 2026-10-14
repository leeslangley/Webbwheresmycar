class_name CarMats
extends RefCounted

# Material per car part class (GDA18). Paint and paint2 use car_paint.gdshader, chrome and glass use their
# shaders, and lamp, tail, trim, tyre and wall are plain StandardMaterial3D. Pure factory, no node access.

# A PackedStringArray is not a constant expression in Godot 4.7, so this is a static var rather than a const.
static var CLASSES := PackedStringArray(["paint", "paint2", "chrome", "glass", "lamp", "tail", "trim", "tyre", "wall"])

static var _ramp: GradientTexture1D


# The studio sky ramp used as the chrome environment. Built once and cached.
static func env_ramp() -> GradientTexture1D:
	if _ramp == null:
		var g := Gradient.new()
		g.offsets = PackedFloat32Array([0.0, 0.45, 0.5, 0.6, 1.0])
		g.colors = PackedColorArray([Color("2a2432"), Color("2a2432"), Color("e9dcc4"), Color("b4c8e6"), Color("2b4a86")])
		_ramp = GradientTexture1D.new()
		_ramp.gradient = g
		_ramp.width = 64
	return _ramp


# The material for one part class. wear is clamped to 0..3. Any unknown class gets the trim material.
static func make(cls: String, paint: Color, wear: float, ground_y: float = 0.0, body_h: float = 3.8) -> Material:
	var w: float = Wear.clamp_level(wear)
	var m: Material
	match cls:
		"paint", "paint2":
			var paint_mat := _shader_mat("res://art/car_paint.gdshader")
			paint_mat.set_shader_parameter("base_color", paint)
			paint_mat.set_shader_parameter("flop_color", paint.lightened(0.1))
			paint_mat.set_shader_parameter("wear", w)
			paint_mat.set_shader_parameter("ground_y", ground_y)
			paint_mat.set_shader_parameter("body_height", body_h)
			m = paint_mat
		"chrome":
			var chrome_mat := _shader_mat("res://art/chrome.gdshader")
			chrome_mat.set_shader_parameter("env_ramp", env_ramp())
			chrome_mat.set_shader_parameter("wear", w)
			m = chrome_mat
		"glass":
			var glass_mat := _shader_mat("res://art/glass.gdshader")
			glass_mat.set_shader_parameter("wear", w)
			m = glass_mat
		"lamp":
			var lamp_mat := _std(Color("fff1c0"), 0.1)
			lamp_mat.emission_enabled = true
			lamp_mat.emission = Color("ffe9a8")
			lamp_mat.emission_energy_multiplier = 2.0
			m = lamp_mat
		"tail":
			var tail_mat := _std(Color("c01818"), 0.2)
			tail_mat.emission_enabled = true
			tail_mat.emission = Color("ff2010")
			tail_mat.emission_energy_multiplier = 1.0
			m = tail_mat
		"wall":
			m = _std(Color("e8e2d0"), 0.7)
		"tyre":
			m = _std(Color("16161a"), 0.85)
		_:
			m = _std(Color("0e0e10"), 0.55)
	m.resource_name = cls
	return m


# Sets the wear parameter on a shader material. Other materials are left alone.
static func set_wear(m: Material, wear: float) -> void:
	if m is ShaderMaterial:
		(m as ShaderMaterial).set_shader_parameter("wear", Wear.clamp_level(wear))


static func _shader_mat(path: String) -> ShaderMaterial:
	var sm := ShaderMaterial.new()
	sm.shader = load(path) as Shader
	return sm


static func _std(albedo: Color, roughness: float) -> StandardMaterial3D:
	var std := StandardMaterial3D.new()
	std.albedo_color = albedo
	std.roughness = roughness
	return std
