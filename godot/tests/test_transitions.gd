extends "res://tests/harness.gd"

# Runs outside the scene tree, so _ready is called by hand. Headless play() swaps and emits at once.


func _make() -> Transitions:
	var t := Transitions.new()
	t._ready()
	return t


func test_ready_sets_layout() -> void:
	var t := _make()
	near(t.anchor_right, 1.0, 1e-9, "full rect anchor right")
	near(t.anchor_bottom, 1.0, 1e-9, "full rect anchor bottom")
	eq(t.mouse_filter, Control.MOUSE_FILTER_IGNORE, "ignores mouse when idle")
	t.free()


func test_headless_known_kind_swaps_at_once() -> void:
	var t := _make()
	var n := [0]
	var got: Array = []
	t.finished.connect(func(k: String) -> void: got.append(k))
	var swap := func() -> void: n[0] += 1
	t.play("fade", swap)
	eq(n[0], 1, "swap called at once")
	eq(got, ["fade"], "finished emitted once with fade")
	ok(not t.running, "not running after headless play")
	t.free()


func test_unknown_and_empty_kind_swap_at_once() -> void:
	var t := _make()
	var n := [0]
	var got: Array = []
	t.finished.connect(func(k: String) -> void: got.append(k))
	var swap := func() -> void: n[0] += 1
	t.play("wipe", swap)
	eq(n[0], 1, "unknown kind swaps once")
	t.play("", swap)
	eq(n[0], 2, "empty kind swaps once")
	eq(got, ["wipe", ""], "finished emitted for each call")
	t.free()


func test_fx_off_swaps_at_once() -> void:
	var t := _make()
	t.fx_enabled = false
	var n := [0]
	var swap := func() -> void: n[0] += 1
	var sh := Control.new()
	t.play("slide-left", swap, sh)
	eq(n[0], 1, "swap called once with fx off")
	ok(not t.running, "not running with fx off")
	sh.free()
	t.free()


func test_running_swaps_at_once() -> void:
	var t := _make()
	t.running = true
	var n := [0]
	var got: Array = []
	t.finished.connect(func(k: String) -> void: got.append(k))
	var swap := func() -> void: n[0] += 1
	t.play("fade", swap)
	eq(n[0], 1, "swap called once while already running")
	eq(got, ["fade"], "finished emitted while already running")
	t.free()


func test_apply_progress_fade() -> void:
	var t := _make()
	t._from = TextureRect.new()
	t.add_child(t._from)
	t.apply_progress(0.5, "fade", Vector2(1280, 720), null)
	near(t._from.modulate.a, 0.5, 1e-6, "fade: outgoing half faded at u=0.5")
	t.apply_progress(0.25, "fade", Vector2(1280, 720), null)
	near(t._from.modulate.a, 0.875, 1e-6, "fade: outgoing still mostly visible at u=0.25")
	t.free()


func test_apply_progress_slide_left() -> void:
	var t := _make()
	t._from = TextureRect.new()
	t.add_child(t._from)
	var sh := Control.new()
	t.apply_progress(0.5, "slide-left", Vector2(1280, 720), sh)
	near(t._from.position.x, -1120.0, 1e-6, "slide-left: outgoing x")
	near(sh.position.x, 160.0, 1e-6, "slide-left: incoming shifter x")
	sh.free()
	t.free()


func test_apply_progress_pageturn() -> void:
	var t := _make()
	t._from = TextureRect.new()
	t.add_child(t._from)
	t._edge = ColorRect.new()
	t.add_child(t._edge)
	t._light = ColorRect.new()
	t.add_child(t._light)
	t.apply_progress(0.5, "pageturn", Vector2(1280, 720), null)
	near(t._from.scale.x, 0.5, 1e-6, "pageturn: page squashed to half")
	near(t._edge.position.x, 640.0, 1e-6, "pageturn: edge at half width")
	near(t._light.position.x, 637.0, 1e-6, "pageturn: light edge 3px left of edge")
	t.free()


func test_cleanup_resets_shifter_and_state() -> void:
	var t := _make()
	t.running = true
	t._from = TextureRect.new()
	t.add_child(t._from)
	var sh := Control.new()
	sh.position = Vector2(160, 0)
	t._cleanup(sh)
	eq(sh.position, Vector2.ZERO, "shifter back at zero")
	ok(not t.running, "running cleared")
	ok(t._from == null, "snapshot cleared")
	sh.free()
	t.free()
