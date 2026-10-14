extends "res://tests/harness.gd"

# Particle scenes (card GDA14). Each test instantiates a scene, calls Fx.setup itself (the scene's
# _ready does not run out of tree) and frees the node.


func test_each_kind_scene_matches_table() -> void:
	for kind in Fx.KINDS:
		_check_kind(kind)


func _check_kind(kind: String) -> void:
	var t: Dictionary = Fx.TABLE[kind]
	var scene = load("res://art/fx/%s.tscn" % kind)
	ok(scene is PackedScene, kind + " scene loads as PackedScene")
	if not (scene is PackedScene):
		return
	var node := (scene as PackedScene).instantiate() as GPUParticles2D
	ok(node != null, kind + " instantiates as GPUParticles2D")
	if node == null:
		return
	ok(Fx.setup(node, kind), kind + " setup returns true")
	eq(node.amount, t["amount"], kind + " amount")
	near(node.lifetime, t["lifetime"], 1e-6, kind + " lifetime")
	eq(node.one_shot, t["one_shot"], kind + " one_shot")
	eq(node.emitting, not t["one_shot"], kind + " emitting")
	var m := node.process_material as ParticleProcessMaterial
	ok(m != null, kind + " process_material is ParticleProcessMaterial")
	if m != null:
		near(m.initial_velocity_max, t["vmax"], 1e-6, kind + " initial_velocity_max")
	eq(node.texture_filter, CanvasItem.TEXTURE_FILTER_NEAREST, kind + " texture_filter")
	node.free()


func test_cash_burst_numbers() -> void:
	var node := (load("res://art/fx/cash.tscn") as PackedScene).instantiate() as GPUParticles2D
	Fx.setup(node, "cash")
	eq(node.amount, 24, "cash amount")
	near(node.explosiveness, 0.95, 1e-6, "cash explosiveness")
	node.free()


func test_confetti_colour_ramp_has_six_points() -> void:
	var node := (load("res://art/fx/confetti.tscn") as PackedScene).instantiate() as GPUParticles2D
	Fx.setup(node, "confetti")
	var m := node.process_material as ParticleProcessMaterial
	ok(m != null, "confetti process_material")
	if m != null:
		ok(m.color_initial_ramp is GradientTexture1D, "confetti color_initial_ramp is GradientTexture1D")
		if m.color_initial_ramp is GradientTexture1D:
			var gt := m.color_initial_ramp as GradientTexture1D
			eq(gt.gradient.get_point_count(), 6, "confetti gradient point count")
	node.free()


func test_dust_emission_box() -> void:
	var node := (load("res://art/fx/dust.tscn") as PackedScene).instantiate() as GPUParticles2D
	Fx.setup(node, "dust")
	var m := node.process_material as ParticleProcessMaterial
	ok(m != null, "dust process_material")
	if m != null:
		eq(m.emission_shape, ParticleProcessMaterial.EMISSION_SHAPE_BOX, "dust emission_shape")
		near(m.emission_box_extents.x, 200.0, 1e-6, "dust emission_box_extents.x")
	node.free()


func test_steam_gravity_is_rising() -> void:
	var node := (load("res://art/fx/steam.tscn") as PackedScene).instantiate() as GPUParticles2D
	Fx.setup(node, "steam")
	var m := node.process_material as ParticleProcessMaterial
	ok(m != null, "steam process_material")
	if m != null:
		near(m.gravity.y, -8.0, 1e-6, "steam gravity.y")
	node.free()


func test_unknown_kind_is_refused() -> void:
	var node := GPUParticles2D.new()
	ok(Fx.setup(node, "zzz") == false, "setup with unknown kind is false")
	node.free()
	ok(Fx.burst(null, "zzz", Vector2.ZERO) == null, "burst with unknown kind is null")


func test_kinds_and_texture() -> void:
	eq(Fx.KINDS.size(), 5, "five kinds")
	eq(Fx.tex().get_width(), 4, "texture width")
	ok(is_same(Fx.tex(), Fx.tex()), "tex() returns the cached object")
