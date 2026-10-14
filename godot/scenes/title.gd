class_name TitleRoom
extends RoomBase

# Title screen (port of src/ui/scenes/title.js): a painted night high street (moonlit sky, terraces, the
# shop parade, the Webb's Wheels garage with its neon sign, a tower block and the pub; baked by
# tools/art/ui_bake.py), twinkling stars, sodium street lamps that hum and flicker, a wet road with a
# scrolling centre line, a classic car with headlights that drives across every 6 seconds, the bobbing
# glossy logo with a shine sweep, and three chunky buttons. Buttons only emit signals; the Flow decides
# what happens. No HUD or banner is shown here.

signal new_game
signal continue_game
signal open_settings

const R_NEW := Rect2(480, 420, 320, 64)
const R_CONTINUE := Rect2(480, 496, 320, 64)
const R_SETTINGS := Rect2(480, 572, 320, 64)
const CAR_COLORS := [Color("9A2A2A"), Color("1C2E5A"), Color("E8B923"), Color("588D43")]
const STAR_COUNT := 40
const DASH_COUNT := 14
const LAMP_X := [147.0, 497.0, 1137.0]
const LAMP_Y := 418.0
const CAR_ART_OFFSET := Vector2(-50, -9)
const SUB_Y := 304.0
const STAR_Y := 340.0

var _t := 0.0


func _ready() -> void:
	build_layers()
	strip_color = Color("14102A")
	_build_background()
	_build_props()
	_build_logo()
	_build_vignette()
	add_button(&"new_game", R_NEW, "NEW GAME", "primary")
	add_button(&"continue", R_CONTINUE, "CONTINUE")
	add_button(&"settings", R_SETTINGS, "SETTINGS")
	refresh()
	apply_time(0.0)


func _build_background() -> void:
	var bg := placeholder("Background")
	bg.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	var sky := Polygon2D.new()
	sky.name = "Sky"
	sky.polygon = PackedVector2Array([Vector2(0, 0), Vector2(1280, 0), Vector2(1280, 640), Vector2(0, 640)])
	sky.vertex_colors = PackedColorArray([Color("14102A"), Color("14102A"), Color("352879"), Color("352879")])
	bg.add_child(sky)
	_add_sprite(bg, "SkyArt", "title_sky", Vector2.ZERO)
	var stars := Node2D.new()
	stars.name = "Stars"
	bg.add_child(stars)
	for i in range(STAR_COUNT):
		var pos := Vector2((i * 137 + 53) % 1280, (i * 89 + 31) % 600)
		var star := RoomBase.add_box(stars, "Star%d" % i, Rect2(pos, Vector2(2, 2)), Color("FFF6E0"))
		if i % 3 == 0:
			var sparkle := Polygon2D.new()
			sparkle.name = "Sparkle"
			var r := 5.0 + float(i % 4)
			sparkle.polygon = PackedVector2Array([Vector2(1, 1 - r), Vector2(1.6, 0.4), Vector2(1 + r, 1), Vector2(1.6, 1.6), Vector2(1, 1 + r), Vector2(0.4, 1.6), Vector2(1 - r, 1), Vector2(0.4, 0.4)])
			sparkle.color = Color(1, 0.96, 0.85, 0.8)
			star.add_child(sparkle)
	RoomBase.add_box(bg, "Road", Rect2(0, 648, 1280, 72), Color("151226"))
	_add_sprite(bg, "TownArt", "title_town", Vector2.ZERO)
	var dashes := Node2D.new()
	dashes.name = "Dashes"
	bg.add_child(dashes)
	for k in range(DASH_COUNT):
		RoomBase.add_box(dashes, "Dash%d" % k, Rect2(Vector2(k * 100 - 60, 676), Vector2(60, 8)), Color(0.95, 0.9, 0.7, 0.75))
	var glows := Node2D.new()
	glows.name = "LampGlows"
	bg.add_child(glows)
	for i in range(LAMP_X.size()):
		var g := _glow_sprite("Glow%d" % i, Color(1.0, 0.78, 0.45, 0.85), 220.0)
		g.position = Vector2(LAMP_X[i], LAMP_Y)
		glows.add_child(g)
	var sign_label := RoomBase.add_label(bg, "NeonSign", "WEBB'S WHEELS", Vector2(916, 480), 15, Color("FFE3F4"), 128.0, true)
	sign_label.add_theme_font_override("font", UiSkin.display_font(900))
	sign_label.add_theme_constant_override("outline_size", 7)
	sign_label.add_theme_color_override("font_outline_color", Color(1.0, 0.2, 0.55, 0.85))
	var sign_glow := _glow_sprite("NeonGlow", Color(1.0, 0.25, 0.6, 0.7), 150.0)
	sign_glow.position = Vector2(980, 492)
	sign_glow.scale = Vector2(1.0, 0.35)
	bg.add_child(sign_glow)


# A Sprite2D for a baked texture under res://art/ui/ (skipped when the texture is missing).
func _add_sprite(parent: Node, node_name: String, tex_name: String, pos: Vector2) -> Sprite2D:
	var sp := Sprite2D.new()
	sp.name = node_name
	sp.centered = false
	sp.position = pos
	sp.texture = UiSkin.tex(tex_name)
	sp.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	parent.add_child(sp)
	return sp


# A soft additive radial glow, diameter px.
static func _glow_sprite(node_name: String, col: Color, diameter: float) -> Sprite2D:
	var g := Gradient.new()
	g.set_color(0, Color(col.r, col.g, col.b, col.a))
	g.set_color(1, Color(col.r, col.g, col.b, 0.0))
	g.add_point(0.35, Color(col.r, col.g, col.b, col.a * 0.35))
	var gt := GradientTexture2D.new()
	gt.gradient = g
	gt.fill = GradientTexture2D.FILL_RADIAL
	gt.fill_from = Vector2(0.5, 0.5)
	gt.fill_to = Vector2(1.0, 0.5)
	gt.width = 128
	gt.height = 128
	var sp := Sprite2D.new()
	sp.name = node_name
	sp.texture = gt
	sp.scale = Vector2.ONE * diameter / 128.0
	sp.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	var mat := CanvasItemMaterial.new()
	mat.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
	sp.material = mat
	return sp


func _build_props() -> void:
	var car := Node2D.new()
	car.name = "Car"
	var props := placeholder("Props")
	props.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	props.add_child(car)
	var body := RoomBase.add_box(car, "Body", Rect2(0, 0, 200, 60), CAR_COLORS[0])
	for w in range(2):
		var wheel := Polygon2D.new()
		wheel.name = "Wheel%d" % w
		var centre := Vector2(45 if w == 0 else 155, 60)
		var pts := PackedVector2Array()
		for p in range(16):
			var a := TAU * float(p) / 16.0
			pts.append(centre + Vector2(cos(a), sin(a)) * 16.0)
		wheel.polygon = pts
		wheel.color = Color.BLACK
		car.add_child(wheel)
	if UiSkin.tex("title_car_paint") == null:
		return
	# The painted car replaces the flat box and wheels (kept, hidden, for the colour and the tests).
	body.visible = false
	for w in range(2):
		(car.get_node("Wheel%d" % w) as CanvasItem).visible = false
	var beam := _add_sprite(car, "Beam", "title_beam", CAR_ART_OFFSET + Vector2(282, 6))
	var add := CanvasItemMaterial.new()
	add.blend_mode = CanvasItemMaterial.BLEND_MODE_ADD
	beam.material = add
	_add_sprite(car, "Paint", "title_car_paint", CAR_ART_OFFSET)
	_add_sprite(car, "Detail", "title_car_detail", CAR_ART_OFFSET)
	var tail := _glow_sprite("TailGlow", Color(1.0, 0.15, 0.1, 0.8), 60.0)
	tail.position = CAR_ART_OFFSET + Vector2(12, 66)
	car.add_child(tail)
	var head := _glow_sprite("HeadGlow", Color(1.0, 0.95, 0.75, 0.9), 70.0)
	head.position = CAR_ART_OFFSET + Vector2(286, 66)
	car.add_child(head)


# Darkens the corners a little, for a cinematic frame.
func _build_vignette() -> void:
	var g := Gradient.new()
	g.set_color(0, Color(0, 0, 0, 0))
	g.set_color(1, Color(0.02, 0.0, 0.08, 0.55))
	g.add_point(0.55, Color(0, 0, 0, 0))
	var gt := GradientTexture2D.new()
	gt.gradient = g
	gt.fill = GradientTexture2D.FILL_RADIAL
	gt.fill_from = Vector2(0.5, 0.45)
	gt.fill_to = Vector2(1.05, 0.45)
	gt.width = 256
	gt.height = 144
	var v := Sprite2D.new()
	v.name = "Vignette"
	v.texture = gt
	v.centered = false
	v.scale = Vector2(1280.0 / 256.0, 720.0 / 144.0)
	v.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	placeholder("Front").add_child(v)


func _build_logo() -> void:
	var ui_node := ui()
	var logo_webb := RoomBase.add_label(ui_node, "LogoWebb", "WEBB,", Vector2(0, 100), 64, Color("FFD27A"), 1280.0, true)
	logo_webb.add_theme_font_override("font", UiTheme.title_font())
	var logo_title := RoomBase.add_label(ui_node, "LogoTitle", "WHERE'S MY CAR?", Vector2(0, 190), 48, Color("F4E9C8"), 1280.0, true)
	logo_title.add_theme_font_override("font", UiTheme.title_font())
	var sub := RoomBase.add_label(ui_node, "LogoSub", "A WEBB'S WHEELS PRODUCTION", Vector2(0, 280), 30, Color("959595"), 1280.0, true)
	var star := RoomBase.add_label(ui_node, "LogoStar", "Starring Mark Webb", Vector2(0, STAR_Y), 28, Color("B8C76F"), 1280.0, true)
	# The two big lines are painted by UiLogoText children; the labels keep their text but draw nothing.
	_logo_art(logo_webb, "WEBB,", 132, 98.0, Color("FFF6C0"), Color("FF9C1A"), Color("E8304A"))
	_logo_art(logo_title, "WHERE'S MY CAR?", 70, 82.0, Color("FFFFFF"), Color("BFE6FF"), Color("2E6FD8"))
	var fv := FontVariation.new()
	fv.base_font = UiSkin.display_font(800)
	fv.spacing_glyph = 3
	for l in [sub, star]:
		var lab := l as Label
		lab.add_theme_font_override("font", fv)
		lab.add_theme_constant_override("outline_size", 8)
		lab.add_theme_color_override("font_outline_color", UiTheme.INK)
	sub.add_theme_font_size_override("font_size", 20)
	sub.add_theme_color_override("font_color", Color("F4E9C8"))
	sub.position.y = SUB_Y
	star.add_theme_font_size_override("font_size", 22)
	star.add_theme_color_override("font_color", Color("FFD27A"))


func _logo_art(label: Label, text: String, px: int, baseline: float, top: Color, bottom: Color, rim: Color) -> void:
	label.add_theme_color_override("font_color", Color(0, 0, 0, 0))
	var art := UiLogoText.new()
	art.name = "Art"
	art.size = Vector2(1280, 160)
	art.position = Vector2(0, baseline - float(px) * 0.82 - 10.0)
	art.font_px = px
	art.baseline = float(px) * 0.82 + 10.0
	art.fill_top = top
	art.fill_bottom = bottom
	art.rim = rim
	art.rim_px = 30 if px > 100 else 24
	art.outline_px = 16 if px > 100 else 12
	art.text = text
	label.add_child(art)


# Enables CONTINUE only when a save exists. A greyed CONTINUE still emits continue_game when tapped
# (see _on_button_blocked): the Flow asks the Game, which toasts "No saved game".
func refresh() -> void:
	hotspots[&"continue"].enabled = get_game().has_save()


func enter(_params: Dictionary = {}) -> void:
	refresh()


func _on_hotspot(id: StringName) -> void:
	match id:
		&"new_game":
			new_game.emit()
		&"continue":
			continue_game.emit()
		&"settings":
			open_settings.emit()


func _on_button_blocked(id: StringName) -> void:
	if id == &"continue":
		continue_game.emit()


# Keyboard path. Returns true when the key was handled.
func handle_key(keycode: int) -> bool:
	if keycode == KEY_ENTER or keycode == KEY_N:
		new_game.emit()
		return true
	if keycode == KEY_C and get_game().has_save():
		continue_game.emit()
		return true
	if keycode == KEY_S:
		open_settings.emit()
		return true
	return false


func _process(delta: float) -> void:
	_t += delta
	apply_time(_t)


# Public and deterministic: draws the scene for time t (seconds).
func apply_time(t: float) -> void:
	var stars := placeholder("Background").get_node("Stars") as Node2D
	for i in range(STAR_COUNT):
		var star := stars.get_node("Star%d" % i) as CanvasItem
		star.modulate.a = 0.5 + 0.5 * sin(t + float(i))
	var dashes := placeholder("Background").get_node("Dashes") as Node2D
	for k in range(DASH_COUNT):
		var dash := dashes.get_node("Dash%d" % k) as Control
		dash.position.x = fposmod(float(k) * 100.0 - t * 120.0, 1400.0) - 60.0
	var car := placeholder("Props").get_node("Car") as Node2D
	car.position = Vector2(-300.0 + (fmod(t, 6.0) / 6.0) * 1900.0, 596.0)
	var body := car.get_node("Body") as ColorRect
	body.color = CAR_COLORS[int(floor(t / 6.0)) % 4]
	var paint := car.get_node_or_null("Paint") as CanvasItem
	if paint != null:
		paint.modulate = body.color.lightened(0.15)
		car.position.y = 596.0 + (1.0 if fmod(t * 7.0, 1.0) < 0.5 else 0.0)
	var bob := sin(t * 1.5) * 4.0
	var base_ys := {"LogoWebb": 100.0, "LogoTitle": 190.0, "LogoSub": SUB_Y, "LogoStar": STAR_Y}
	for logo_name in base_ys:
		var logo := ui().get_node(logo_name) as Control
		logo.position.y = float(base_ys[logo_name]) + bob
	# shine sweeps across the logo every 4 s; lamps hum; the neon sign stutters now and then
	var sweep := fposmod(t, 4.0) / 1.2
	for logo_name in ["LogoWebb", "LogoTitle"]:
		var art := ui().get_node_or_null(logo_name + "/Art") as UiLogoText
		if art != null:
			art.shine = lerpf(-200.0, 1500.0, sweep) if sweep <= 1.0 else -1000.0
	var glows := placeholder("Background").get_node_or_null("LampGlows")
	if glows != null:
		for i in range(glows.get_child_count()):
			(glows.get_child(i) as CanvasItem).modulate.a = 0.85 + 0.15 * sin(t * 13.0 + float(i) * 2.1)
	var sign_label := placeholder("Background").get_node_or_null("NeonSign") as CanvasItem
	if sign_label != null:
		var on := 0.0 if fposmod(t, 5.3) > 5.0 and fposmod(t * 20.0, 2.0) < 1.0 else 1.0
		sign_label.modulate.a = 0.35 + 0.65 * on
		(placeholder("Background").get_node("NeonGlow") as CanvasItem).modulate.a = on
