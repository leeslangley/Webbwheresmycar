class_name UiParticles
extends RefCounted

# One-shot GPUParticles2D bursts built in code (no texture files): falling cash, confetti and smoke.
# Each burst is added under the given parent and frees itself when it finishes.
# Static only. Colours come from UiTheme.color() where the palette has them.

static var _tex: ImageTexture


static func square_texture() -> ImageTexture:
	if _tex == null:
		var img := Image.create(4, 4, false, Image.FORMAT_RGBA8)
		img.fill(Color.WHITE)
		_tex = ImageTexture.create_from_image(img)
	return _tex


static func _base(parent: Node, pos: Vector2, amount: int, lifetime: float) -> GPUParticles2D:
	var p := GPUParticles2D.new()
	p.position = pos
	p.amount = amount
	p.lifetime = lifetime
	p.one_shot = true
	p.explosiveness = 0.9
	p.texture = square_texture()
	p.emitting = true
	p.finished.connect(p.queue_free)
	parent.add_child(p)
	return p


static func cash(parent: Node, pos: Vector2) -> GPUParticles2D:
	var p := _base(parent, pos, 24, 1.2)
	var m := ParticleProcessMaterial.new()
	m.direction = Vector3(0, -1, 0)
	m.spread = 60.0
	m.initial_velocity_min = 180.0
	m.initial_velocity_max = 320.0
	m.gravity = Vector3(0, 600, 0)
	m.scale_min = 2.0
	m.scale_max = 3.0
	m.color = UiTheme.color("cashGreen")
	p.process_material = m
	return p


static func confetti(parent: Node, pos: Vector2) -> GPUParticles2D:
	var p := _base(parent, pos, 60, 1.8)
	var m := ParticleProcessMaterial.new()
	m.direction = Vector3(0, -1, 0)
	m.spread = 80.0
	m.initial_velocity_min = 200.0
	m.initial_velocity_max = 420.0
	m.gravity = Vector3(0, 500, 0)
	m.scale_min = 1.5
	m.scale_max = 3.0
	var g := Gradient.new()
	g.colors = PackedColorArray([
		Color("#E8B923"),
		Color("#D9483B"),
		Color("#3FAE49"),
		Color("#70A4B2"),
	])
	g.offsets = PackedFloat32Array([0.0, 0.33, 0.66, 1.0])
	var ramp := GradientTexture1D.new()
	ramp.gradient = g
	m.color_initial_ramp = ramp
	p.process_material = m
	return p


static func smoke(parent: Node, pos: Vector2) -> GPUParticles2D:
	var p := _base(parent, pos, 12, 1.6)
	p.explosiveness = 0.2
	var m := ParticleProcessMaterial.new()
	m.direction = Vector3(0, -1, 0)
	m.spread = 20.0
	m.initial_velocity_min = 20.0
	m.initial_velocity_max = 50.0
	m.gravity = Vector3(0, -30, 0)
	m.scale_min = 4.0
	m.scale_max = 7.0
	m.color = Color(0.6, 0.6, 0.6, 0.5)
	p.process_material = m
	return p
