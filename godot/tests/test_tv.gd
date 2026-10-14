extends "res://tests/harness.gd"

# Tests for the Webb TV node (tv/tv.tscn, tv/tv.gd). _ready does not fire in tests, so each test
# adds the node to the tree and calls _ready by hand.


func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:
	var ev := InputEventMouseButton.new()
	ev.button_index = MOUSE_BUTTON_LEFT
	ev.pressed = down
	ev.position = pos
	return ev


func _make() -> Tv:
	var tv := (load("res://tv/tv.tscn") as PackedScene).instantiate() as Tv
	tree().root.add_child(tv)
	tv.call("_ready")
	return tv


func _glass(tv: Tv) -> TextureRect:
	return tv.get_node("Glass") as TextureRect


func test_size_and_tree() -> void:
	var tv := _make()
	eq(tv.size, Vector2(760, 560), "tv size")
	eq(Tv.GLASS, Rect2(60, 50, 600, 420), "glass rect")
	ok(tv.get_node_or_null("Viewport") != null, "Viewport node exists")
	ok(tv.get_node_or_null("Viewport/Screen") != null, "Viewport/Screen node exists")
	ok(tv.get_node_or_null("Glass") != null, "Glass node exists")
	eq((tv.get_node("Viewport") as SubViewport).size, Vector2i(640, 448), "viewport size")
	eq(tv.host().size, Vector2(640, 448), "host size")
	ok(_glass(tv).texture != null, "glass shows the viewport texture")
	near(600.0 / 420.0, 640.0 / 448.0, 1e-9, "glass aspect equals screen aspect")
	tv.free()


func test_crt_toggle() -> void:
	var tv := _make()
	ok(tv.crt_on(), "crt is on after _ready")
	tv.set_crt(false)
	ok(_glass(tv).material == null, "crt off clears the glass material")
	ok(not tv.crt_on(), "crt_on is false when off")
	tv.set_crt(true)
	ok(_glass(tv).material is ShaderMaterial, "crt on sets a ShaderMaterial")
	ok(tv.crt_on(), "crt_on is true again")
	tv.free()


func test_mapping() -> void:
	var tv := _make()
	tv.curvature = 0.0
	eq(tv.glass_to_screen(Vector2(300, 210)), Vector2(320, 224), "centre with no curvature")
	eq(tv.glass_to_screen(Vector2(600, 420)), Vector2(640, 448), "bottom right corner with no curvature")
	tv.curvature = CrtMath.DEFAULT_CURVATURE
	var c: Vector2 = tv.glass_to_screen(Vector2(300, 210))
	near(c.x, 320.0, 1e-3, "centre x with default curvature")
	near(c.y, 224.0, 1e-3, "centre y with default curvature")
	ok(tv.glass_to_screen(Vector2(0, 210)).x < 0.0, "default curvature pushes the left edge outside")
	tv.free()


func test_convert_event() -> void:
	var tv := _make()
	tv.curvature = 0.0
	var ev := _mb(Vector2(150, 105), true)
	var c := tv.convert_event(ev) as InputEventMouseButton
	ok(c != null, "mouse button converts")
	if c != null:
		eq(c.position, Vector2(160, 112), "converted button position")
	eq(ev.position, Vector2(150, 105), "original event is untouched")
	var mm := InputEventMouseMotion.new()
	mm.position = Vector2(150, 105)
	var cm := tv.convert_event(mm) as InputEventMouseMotion
	ok(cm != null, "mouse motion converts")
	if cm != null:
		eq(cm.position, Vector2(160, 112), "converted motion position")
	ok(tv.convert_event(InputEventKey.new()) == null, "key event gives null")
	tv.free()
