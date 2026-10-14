extends "res://tests/harness.gd"

# The painted chrome helpers (UiSkin, UiLogoText) and the small pure helpers the repainted widgets added.


func test_skin_textures() -> void:
	ok(UiSkin.tex("btn_primary") != null, "baked button texture loads")
	ok(UiSkin.tex("hud_panel") != null, "baked HUD panel loads")
	eq(UiSkin.tex("no_such_texture"), null, "a missing texture is null, not an error")
	eq(UiSkin.box("no_such_texture"), null, "a missing 9-slice is null")
	var sb := UiSkin.box("btn_normal", "btn")
	ok(sb != null, "button 9-slice box")
	if sb != null:
		eq(sb.texture_margin_left, 22.0, "button left margin")
	ok(UiSkin.box("btn_normal", "btn") == sb, "boxes are cached")


func test_display_font() -> void:
	var f := UiSkin.display_font(900)
	ok(f != null, "display font exists")
	ok(f != UiTheme.title_font(), "display font is not the pixel title font")
	ok(UiSkin.display_font(900) == f, "display fonts are cached per weight")


func test_button_face() -> void:
	var b := UiButton.new()
	eq(b.face_name(), "btn_normal", "normal face")
	b.kind = "primary"
	eq(b.face_name(), "btn_primary", "primary face")
	b.down = true
	eq(b.face_name(), "btn_primary_down", "pressed face")
	b.enabled = false
	eq(b.face_name(), "btn_disabled_down", "disabled face")
	b.kind = "weird"
	b.enabled = true
	b.down = false
	eq(b.face_name(), "btn_normal", "unknown kind falls back to normal")
	b.free()


func test_gauge_segments() -> void:
	eq(UiHud.lit_segments(0.0), 0, "0 lights nothing")
	eq(UiHud.lit_segments(46.0), 5, "46 lights 5 of 10")
	eq(UiHud.lit_segments(100.0), 10, "100 lights all")
	eq(UiHud.lit_segments(250.0), 10, "over 100 clamps")
	eq(UiHud.lit_segments(-5.0), 0, "negative clamps")


func test_stamp() -> void:
	eq(EndgameRoom.stamp_for({"reason": "won"}), "LEGEND", "won stamp")
	eq(EndgameRoom.stamp_for({"reason": "bankrupt"}), "SKINT", "bankrupt stamp")
	eq(EndgameRoom.stamp_for({}), "DONE", "other endings")


func test_logo_text() -> void:
	var l := UiLogoText.new()
	l.text = "WEBB,"
	eq(l.get_node("Fill") != null, true, "the fill layer exists")
	ok((l.get_node("Fill") as CanvasItem).material is ShaderMaterial, "fill uses the logo shader")
	l.shine = 120.0
	eq(((l.get_node("Fill") as CanvasItem).material as ShaderMaterial).get_shader_parameter("shine"), 120.0, "shine reaches the shader")
	l.free()


func test_painter() -> void:
	var hits: Array = []
	var p := UiPainter.make("P", func(on: CanvasItem) -> void: hits.append(on))
	eq(p.name, &"P", "painter name")
	p._draw()
	eq(hits.size(), 1, "draw delegates to the callable")
	p.free()
