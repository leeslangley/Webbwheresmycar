extends "res://tests/harness.gd"


func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:
	var ev := InputEventMouseButton.new()
	ev.button_index = MOUSE_BUTTON_LEFT
	ev.pressed = down
	ev.position = pos
	return ev


func test_offsets() -> void:
	var offs: Array[Vector2] = UiFx.shake_offsets(10.0, 5)
	eq(offs.size(), 5, "step count")
	near(offs[0].x, 0.0, 1e-6, "first offset x")
	near(offs[0].y, 6.0, 1e-6, "first offset y")
	for o in offs:
		ok(o.length() <= 10.0 + 0.001, "offset within strength")
	eq(UiFx.shake_offsets(10.0, 0).size(), 0, "zero steps gives no offsets")
	var again: Array[Vector2] = UiFx.shake_offsets(10.0, 5)
	for i in range(offs.size()):
		ok(offs[i] == again[i], "same call, same offsets")


func test_shake_returns_home() -> void:
	var c := Control.new()
	c.position = Vector2(100, 50)
	tree().root.add_child(c)
	var tw: Tween = UiFx.shake(c, 8.0, 0.3)
	tw.custom_step(0.1)
	ok(c.position != Vector2(100, 50), "node moves during the shake")
	tw.custom_step(5.0)
	ok(c.position == Vector2(100, 50), "back home after the shake")
	c.free()


func test_zero_strength_stays_home() -> void:
	var c := Control.new()
	c.position = Vector2(7, 9)
	tree().root.add_child(c)
	var tw: Tween = UiFx.shake(c, 0.0, 0.3)
	tw.custom_step(5.0)
	ok(c.position == Vector2(7, 9), "zero strength leaves node at home")
	c.free()


func test_flash() -> void:
	var host := Control.new()
	tree().root.add_child(host)
	var tw: Tween = UiFx.flash(host)
	var fx: ColorRect = host.get_node_or_null("FxFlash") as ColorRect
	ok(fx != null, "flash rect added to host")
	tw.custom_step(0.05)
	ok(fx != null and fx.color.a > 0.0, "flash is visible mid-way")
	tw.custom_step(5.0)
	ok(fx != null and fx.is_queued_for_deletion(), "flash rect freed after the flash")
	host.free()


func test_pop() -> void:
	var c := Control.new()
	c.size = Vector2(40, 40)
	tree().root.add_child(c)
	var tw: Tween = UiFx.pop(c)
	ok(c.pivot_offset == Vector2(20, 20), "pivot at centre")
	tw.custom_step(0.08)
	ok(c.scale.x > 1.0, "pop grows the node")
	tw.custom_step(5.0)
	ok(c.scale == Vector2.ONE, "scale back to one")
	c.free()
