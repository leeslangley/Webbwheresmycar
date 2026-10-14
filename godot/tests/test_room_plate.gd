extends "res://tests/harness.gd"

const RoomPlateScript = preload("res://art/room_plate.gd")


func _fake_doc() -> Dictionary:
	return {
		"version": 1,
		"room": "office",
		"scale": 2,
		"size": [640, 360],
		"sky": {"rect": [30, 150, 160, 170]},
		"layers": [
			{"name": "mid", "file": "office_mid.png", "parallax": [0, 0]},
			{"name": "front", "file": "office_front.png", "parallax": [6, 3]},
		],
		"lights": [
			{"id": "lamp", "kind": "lamp", "pos": [388, 328], "color": "#ffab55", "energy": 0.45, "radius": 170, "flicker": 0.12, "seed": 1.3},
			{"id": "window", "kind": "window", "pos": [110, 235], "color": "#b4c8e6", "energy": 0.35, "radius": 200, "flicker": 0.0, "seed": 0.0},
			{"id": "tv", "kind": "tv", "pos": [625, 301], "color": "#78b4ff", "energy": 0.30, "radius": 230, "flicker": 0.25, "seed": 4.1},
		],
	}


func _loader() -> Callable:
	var img := Image.create(4, 4, false, Image.FORMAT_RGBA8)
	var tex := ImageTexture.create_from_image(img)
	return func(_f: String) -> Texture2D: return tex


func test_flicker_values() -> void:
	near(RoomPlateScript.flicker(0.0, 1.3, 0.12), 0.895710, 1e-5, "flicker at t=0")
	near(RoomPlateScript.flicker(1.0, 1.3, 0.12), 0.890087, 1e-5, "flicker at t=1")
	var lo := 1.0
	var hi := 0.0
	for i in range(201):
		var v: float = RoomPlateScript.flicker(i * 0.1, 1.3, 0.12)
		lo = minf(lo, v)
		hi = maxf(hi, v)
	ok(lo >= 0.88 - 1e-9 and hi <= 1.0 + 1e-9, "flicker stays in [0.88, 1.0] for depth 0.12 (got %f..%f)" % [lo, hi])


func test_sky_colors() -> void:
	eq(RoomPlateScript.sky_colors(12)["top"], Color("6fb4ee"), "day top")
	eq(RoomPlateScript.sky_colors(7)["bottom"], Color("f2a65a"), "dawn bottom")
	eq(RoomPlateScript.sky_colors(18)["top"], Color("4a3a7a"), "dusk top")
	eq(RoomPlateScript.sky_colors(2)["top"], Color("0b0d24"), "night top")


func test_build_from_children_and_layers() -> void:
	var n = RoomPlateScript.new()
	ok(n.build_from(_fake_doc(), _loader()), "build_from returns true")
	var names: Array = []
	for c in n.get_children():
		names.append(str(c.name))
	eq(names, ["Sky", "mid", "front", "lamp", "window", "tv"], "child order")
	eq(n.layer_node("mid").scale, Vector2(2, 2), "mid scale")
	eq(n.sky_node() != null, true, "sky node exists")
	n.free()


func test_parallax_and_clamp() -> void:
	var n = RoomPlateScript.new()
	n.build_from(_fake_doc(), _loader())
	n.set_look(Vector2(1, -1))
	eq(n.layer_node("front").position, Vector2(-6, 3), "front at full look")
	eq(n.layer_node("mid").position, Vector2.ZERO, "mid never moves")
	n.set_look(Vector2(9, 0))
	eq(n.layer_node("front").position.x, -6.0, "look clamped to -1..1 in x")
	n.free()


func test_lights_colour_and_hour() -> void:
	var n = RoomPlateScript.new()
	n.build_from(_fake_doc(), _loader())
	var lamp = n.light_node("lamp")
	var win = n.light_node("window")
	ok(lamp.color.r > lamp.color.b, "lamp is warm")
	n.set_hour(12)
	ok(win.color.b > win.color.r, "window is cold at noon")
	n.set_hour(23)
	near(win.energy, 0.35 * 0.35, 1e-6, "window energy at night")
	eq(win.color, Color("#9db4ff"), "window colour at night")
	n.set_hour(7)
	eq(win.color, Color("#f2a65a"), "window colour at dawn")
	n.free()


func test_process_flickers_only_flickering_lights() -> void:
	var n = RoomPlateScript.new()
	n.build_from(_fake_doc(), _loader())
	n.set_hour(7)
	var lamp = n.light_node("lamp")
	var win = n.light_node("window")
	var win_before: float = win.energy
	n._process(0.5)
	near(lamp.energy, 0.45 * RoomPlateScript.flicker(0.5, 1.3, 0.12), 1e-6, "lamp flickers")
	near(win.energy, win_before, 1e-9, "window light does not flicker")
	n.free()


func test_sky_gradient_follows_hour() -> void:
	var n = RoomPlateScript.new()
	n.build_from(_fake_doc(), _loader())
	n.set_hour(12)
	var grad: Gradient = n.sky_node().texture.gradient
	eq(grad.get_color(0), Color("6fb4ee"), "sky top at noon")
	n.free()


func test_build_from_without_layers_is_false() -> void:
	var n = RoomPlateScript.new()
	ok(not n.build_from({}, _loader()), "empty doc gives false")
	n.free()
