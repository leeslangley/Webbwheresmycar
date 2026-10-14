extends "res://tests/harness.gd"

# UiParticles (card GDU26): cached square texture and the three one-shot bursts.
# Tests run outside the scene tree; each host node is added to the tree by hand and freed at the end.


func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:
	var ev := InputEventMouseButton.new()
	ev.button_index = MOUSE_BUTTON_LEFT
	ev.pressed = down
	ev.position = pos
	return ev


func _host() -> Node2D:
	var host := Node2D.new()
	tree().root.add_child(host)
	return host


func test_texture() -> void:
	var t := UiParticles.square_texture()
	ok(t != null, "square texture exists")
	if t == null:
		return
	eq(t.get_width(), 4, "square texture is 4 px wide")
	ok(UiParticles.square_texture() == t, "second call returns the cached texture")


func test_cash() -> void:
	var host := _host()
	var p := UiParticles.cash(host, Vector2(10, 20))
	eq(p.position, Vector2(10, 20), "cash position")
	eq(p.amount, 24, "cash amount")
	ok(p.one_shot, "cash is one shot")
	near(p.lifetime, 1.2, 1e-3, "cash lifetime")
	ok(p.process_material is ParticleProcessMaterial, "cash has a ParticleProcessMaterial")
	ok(p.texture != null, "cash has a texture")
	eq(p.get_parent(), host, "cash is added under the host")
	host.free()


func test_confetti() -> void:
	var host := _host()
	var p := UiParticles.confetti(host, Vector2.ZERO)
	eq(p.amount, 60, "confetti amount")
	ok(p.one_shot, "confetti is one shot")
	near(p.lifetime, 1.8, 1e-3, "confetti lifetime")
	var m := p.process_material as ParticleProcessMaterial
	ok(m != null, "confetti has a ParticleProcessMaterial")
	if m != null:
		ok(m.color_initial_ramp != null, "confetti has a colour ramp")
	host.free()


func test_smoke() -> void:
	var host := _host()
	var p := UiParticles.smoke(host, Vector2.ZERO)
	eq(p.amount, 12, "smoke amount")
	ok(p.one_shot, "smoke is one shot")
	near(p.explosiveness, 0.2, 1e-3, "smoke explosiveness")
	var m := p.process_material as ParticleProcessMaterial
	ok(m != null, "smoke has a ParticleProcessMaterial")
	if m != null:
		near(m.gravity.y, -30.0, 1e-3, "smoke gravity y")
	host.free()
