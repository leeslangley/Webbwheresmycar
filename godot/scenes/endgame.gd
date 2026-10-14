class_name EndgameRoom
extends RoomBase

# The end-of-game screen (port of src/ui/scenes/endgame.js). Over the painted night street (dimmed): the
# big outlined heading for how the year ended and its subline, a paper score card, a paper card with the
# four Gold Number Plates as gold (won) or pewter (missed) discs, the best auction sale, and the PLAY AGAIN
# / TITLE buttons. A win adds a slowly turning golden sunburst, glossy confetti and glints on the won
# plates; a bankruptcy turns the night blue-grey and a rain cloud drifts across.
# Built in code in _ready. apply_time(t) places the confetti and the cloud; _process feeds it the time.

signal play_again
signal to_title

const R_BOARD := Rect2(80, 30, 1120, 660)
const R_SCORE := Rect2(140, 200, 520, 380)
const R_PLATES := Rect2(680, 200, 460, 380)
const R_SKY := Rect2(100, 50, 1080, 140)
const R_AGAIN := Rect2(340, 610, 280, 64)
const R_TITLE := Rect2(660, 610, 280, 64)
const ROW_H := 56
const CONFETTI_COUNT := 36
const CONFETTI_SPEED := 160.0
const CLOUD_SPEED := 46.0
const CLOUD_PUFF_RADII := [34.0, 26.0, 30.0]

var _t := 0.0
var _won := false
var _bankrupt := false
var _confetti_colors: Array[Color] = [Color("E8B923"), Color("D9483B"), Color("70A4B2"), Color("9AD284"), Color("6F3D86")]


static func heading_for(flags: Dictionary) -> String:
	var reason: String = str(flags.get("reason", ""))
	if reason == "won":
		return "GOLD! MARK'S A LEGEND"
	if reason == "year-end":
		return "THE YEAR IS UP"
	if reason == "bankrupt":
		return "BANKRUPT! THE BAILIFFS ARRIVE"
	return "GAME OVER"


static func subline_for(flags: Dictionary) -> String:
	var reason: String = str(flags.get("reason", ""))
	if reason == "won":
		return "All four Gold Number Plates in one year. Mark buys a round."
	if reason == "year-end":
		return "The bank manager is smiling politely."
	if reason == "bankrupt":
		return "Dave takes the kettle. Mark takes the bus."
	return "The year at Webb's Wheels is done."


static func score_lines(state: Dictionary, won: bool) -> Array:
	var score: int = SimEndGame.final_score(state)
	return [
		"Final score " + str(score),
		"Rank: " + ("GOLD " if won else "") + SimEndGame.rank_of(score),
		"Net worth " + CoreFormat.money(SimEndGame.net_worth(state)),
		"Reputation " + str(state["reputation"]),
		"Jobs done " + str(state["stats"]["jobsDone"]),
	]


func _ready() -> void:
	_build()
	# Fill the labels now too, so a room shown without enter() (the standalone scene) is never blank.
	refresh()


func enter(_params: Dictionary = {}) -> void:
	refresh()


func _process(delta: float) -> void:
	_t += delta
	apply_time(_t)


func _on_hotspot(id: StringName) -> void:
	if id == &"again":
		play_again.emit()
	elif id == &"title":
		to_title.emit()


# Enter is the same as PLAY AGAIN. Returns true when the key was taken.
func handle_key(keycode: int) -> bool:
	if keycode == KEY_ENTER:
		play_again.emit()
		return true
	return false


# Re-reads the game state and sets every label, panel and cloud/confetti visibility from it.
func refresh() -> void:
	_build()
	var state: Dictionary = _current_state()
	var flags: Dictionary = state.get("flags", {})
	var won: bool = flags.get("won", false) == true
	var ink := UiTheme.color("ink")

	_won = won
	_bankrupt = flags.get("reason", "") == "bankrupt"
	var heading := ui().get_node("Heading") as Label
	heading.text = heading_for(flags)
	heading.add_theme_color_override("font_color", UiTheme.color("gold") if won else ink)
	heading.add_theme_color_override("font_outline_color", ink if won else Color("FFF7DC"))
	(ui().get_node("Subline") as Label).text = subline_for(flags)

	var lines: Array = score_lines(state, won)
	for i in range(lines.size()):
		(ui().get_node("Score%d" % i) as Label).text = str(lines[i])

	var info: Dictionary = SimEndGame.plate_info()
	var plates: Dictionary = state.get("plates", {})
	for i in range(CoreState.PLATE_KEYS.size()):
		var key: String = CoreState.PLATE_KEYS[i]
		var got: bool = plates.get(key, false) == true
		(ui().get_node("PlateName%d" % i) as Label).text = str(info[key]["name"])
		var state_label := ui().get_node("PlateState%d" % i) as Label
		state_label.text = "WON" if got else "missed"
		state_label.add_theme_font_override("font", UiSkin.display_font(900 if got else 600))
		state_label.add_theme_font_size_override("font_size", 24 if got else 22)
		state_label.add_theme_color_override("font_color", UiTheme.color("gold") if got else Color("9A9384"))
		state_label.add_theme_constant_override("outline_size", 8 if got else 0)
		state_label.add_theme_color_override("font_outline_color", UiTheme.INK)
		var icon := ui().get_node_or_null("PlateIcon%d" % i) as TextureRect
		if icon != null:
			icon.texture = UiSkin.tex("plate_%s_%s" % [key, "gold" if got else "dull"])

	var stats: Dictionary = state.get("stats", {})
	(ui().get_node("BestSale") as Label).text = "Best auction sale " + CoreFormat.money(float(stats.get("bestAuctionSale", 0)))

	(ui().get_node("Confetti") as Control).visible = won
	(ui().get_node("Cloud") as Node2D).visible = flags.get("reason", "") == "bankrupt"
	var rays := placeholder("Background").get_node_or_null("Rays") as CanvasItem
	if rays != null:
		rays.visible = won
	var dim := placeholder("Background").get_node_or_null("Dim") as ColorRect
	if dim != null:
		dim.color = Color(0.05, 0.07, 0.14, 0.62) if _bankrupt else Color(0.04, 0.02, 0.1, 0.42)


# Places every confetti piece and the cloud for time t (seconds). Same t gives the same frame.
func apply_time(t: float) -> void:
	_build()
	var col_w: float = R_SKY.size.x / 6.0
	var confetti := ui().get_node("Confetti") as Control
	for i in range(CONFETTI_COUNT):
		var box := confetti.get_node("Confetti%d" % i) as ColorRect
		var col: int = i % 6
		var lane: int = floori(float(i) / 6.0)
		var x: float = R_SKY.position.x + round(float(col) * col_w) + float((lane * 11) % 24)
		var y: float = R_SKY.position.y + fposmod(float(i) * 41.0 + t * CONFETTI_SPEED, R_SKY.size.y)
		box.position = Vector2(x, y)
	var cloud := ui().get_node("Cloud") as Node2D
	var span: float = R_BOARD.size.x + 240.0
	cloud.position = Vector2(R_BOARD.position.x - 130.0 + fposmod(t * CLOUD_SPEED, span), R_BOARD.position.y + 120.0)
	for i in range(CONFETTI_COUNT):
		var chip := confetti.get_node("Confetti%d" % i) as Control
		chip.rotation = t * (2.0 + float(i % 5)) + float(i)
		chip.scale.x = 0.35 + 0.65 * absf(cos(t * 4.0 + float(i) * 0.7))
	var rays := placeholder("Background").get_node_or_null("Rays") as Node2D
	if rays != null:
		rays.rotation = t * 0.12
	var rain := cloud.get_node_or_null("Rain") as CanvasItem
	if rain != null:
		rain.set_meta("t", t)
		rain.queue_redraw()
	var stamp := ui().get_node_or_null("Stamp") as CanvasItem
	if stamp != null:
		stamp.queue_redraw()
	var glints := ui().get_node_or_null("Glints") as CanvasItem
	if glints != null:
		glints.set_meta("t", t)
		glints.queue_redraw()


# The game state, or a fresh one when no game is running (the standalone scene, a screenshot).
func _current_state() -> Dictionary:
	var g = get_game()
	if g != null and g.state is Dictionary and not (g.state as Dictionary).is_empty():
		return g.state
	return CoreState.new_game_state()


# Builds the nodes once. Safe to call again.
func _build() -> void:
	build_layers()
	strip_color = Color("14102A")
	if ui().has_node("Board"):
		return
	var ui_node := ui()
	var paper := UiTheme.color("paper")
	var ink := UiTheme.color("ink")
	var grey := UiTheme.color("lightgrey")

	var bg := placeholder("Background")
	bg.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	ui_node.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	add_box(bg, "Backdrop", Rect2(0, 0, 1280, 720), strip_color)
	for art in [["SkyArt", "title_sky"], ["TownArt", "title_town"]]:
		if UiSkin.tex(art[1]) != null:
			var sp := Sprite2D.new()
			sp.name = art[0]
			sp.texture = UiSkin.tex(art[1])
			sp.centered = false
			bg.add_child(sp)
	add_box(bg, "Dim", Rect2(0, 0, 1280, 720), Color(0.04, 0.02, 0.1, 0.42))
	var rays := UiPainter.make("Rays", _draw_rays)
	rays.position = Vector2(640, 110)
	bg.add_child(rays)
	var board := add_panel(ui_node, "Board", R_BOARD, paper)
	board.add_theme_stylebox_override("panel", StyleBoxEmpty.new())

	var confetti := Control.new()
	confetti.name = "Confetti"
	confetti.size = STAGE_SIZE
	confetti.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ui_node.add_child(confetti)
	var chip_mat: ShaderMaterial = null
	if ResourceLoader.exists("res://art/ui/pill.gdshader"):
		chip_mat = ShaderMaterial.new()
		chip_mat.shader = load("res://art/ui/pill.gdshader") as Shader
		chip_mat.set_shader_parameter("size", Vector2(10, 16))
		chip_mat.set_shader_parameter("radius", 3.0)
		chip_mat.set_shader_parameter("rim", 1.2)
	for i in range(CONFETTI_COUNT):
		var chip := add_box(confetti, "Confetti%d" % i, Rect2(0, 0, 10, 16), _confetti_colors[i % _confetti_colors.size()])
		chip.pivot_offset = Vector2(5, 8)
		chip.material = chip_mat

	var cloud := Node2D.new()
	cloud.name = "Cloud"
	cloud.scale = Vector2(1.5, 1.5)
	ui_node.add_child(cloud)
	cloud.add_child(UiPainter.make("Rain", _draw_rain))
	var puff_centres: Array[Vector2] = [Vector2(0, 0), Vector2(44, -16), Vector2(84, 4)]
	for i in range(puff_centres.size()):
		var rim := Polygon2D.new()
		rim.name = "PuffRim%d" % i
		rim.polygon = _circle_points(puff_centres[i], CLOUD_PUFF_RADII[i] + 3.0)
		rim.color = UiTheme.INK
		cloud.add_child(rim)
	for i in range(puff_centres.size()):
		var puff := Polygon2D.new()
		puff.name = "Puff%d" % i
		puff.polygon = _circle_points(puff_centres[i], CLOUD_PUFF_RADII[i])
		puff.color = Color("8C8AA8")
		var cols := PackedColorArray()
		for p in puff.polygon:
			cols.append(Color("B9B7D2") if p.y < puff_centres[i].y else Color("6E6C8C"))
		puff.vertex_colors = cols
		cloud.add_child(puff)
	var base := Polygon2D.new()
	base.name = "Base"
	var bpts := PackedVector2Array()
	for k in range(24):
		var a: float = PI * float(k) / 23.0
		bpts.append(Vector2(46.0 - cos(a) * 66.0, 20.0 + sin(a) * 14.0))
	base.polygon = bpts
	base.color = Color("5E5C7C")
	cloud.add_child(base)

	var heading := add_label(ui_node, "Heading", "", Vector2(100, 56), 34, ink, 1080.0, true)
	heading.add_theme_font_override("font", UiSkin.display_font(900))
	heading.add_theme_font_size_override("font_size", 54)
	heading.add_theme_constant_override("outline_size", 16)
	heading.add_theme_color_override("font_outline_color", ink)
	heading.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.5))
	heading.add_theme_constant_override("shadow_offset_y", 6)
	heading.add_theme_constant_override("shadow_offset_x", 0)
	heading.add_theme_constant_override("shadow_outline_size", 16)
	heading.size.y = 80.0
	var subline := add_label(ui_node, "Subline", "", Vector2(100, 140), 28, ink, 1080.0, true)
	subline.add_theme_font_override("font", UiSkin.display_font(700))
	subline.add_theme_font_size_override("font_size", 24)
	subline.add_theme_color_override("font_color", Color("FFF7DC"))
	subline.add_theme_constant_override("outline_size", 8)
	subline.add_theme_color_override("font_outline_color", ink)

	_card(ui_node, "ScorePanel", R_SCORE)
	for i in range(5):
		var line := add_label(ui_node, "Score%d" % i, "", Vector2(176, 232 + i * ROW_H), 30, ink, 460.0)
		line.add_theme_font_override("font", UiSkin.display_font(800 if i < 2 else 600))
		line.add_theme_font_size_override("font_size", 30 if i == 0 else 24)
		if i == 1:
			line.add_theme_color_override("font_color", Color("B3282D"))

	_card(ui_node, "PlatesPanel", R_PLATES)
	var plates_title := add_label(ui_node, "PlatesTitle", "GOLD NUMBER PLATES", Vector2(704, 222), 18, ink)
	plates_title.add_theme_font_override("font", UiSkin.display_font(900))
	plates_title.add_theme_font_size_override("font_size", 22)
	for i in range(CoreState.PLATE_KEYS.size()):
		var icon := TextureRect.new()
		icon.name = "PlateIcon%d" % i
		icon.position = Vector2(700, 256 + i * ROW_H)
		icon.size = Vector2(48, 48)
		icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
		ui_node.add_child(icon)
		var nm := add_label(ui_node, "PlateName%d" % i, "", Vector2(760, 264 + i * ROW_H), 28, ink, 220.0)
		nm.add_theme_font_override("font", UiSkin.display_font(700))
		nm.add_theme_font_size_override("font_size", 24)
		var state_label := add_label(ui_node, "PlateState%d" % i, "", Vector2(944, 264 + i * ROW_H), 26, grey, 172.0)
		state_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	var best := add_label(ui_node, "BestSale", "", Vector2(704, 490), 28, ink, 420.0)
	best.add_theme_font_override("font", UiSkin.display_font(700))
	best.add_theme_font_size_override("font_size", 22)
	ui_node.add_child(UiPainter.make("Glints", _draw_glints))
	var stamp := UiPainter.make("Stamp", _draw_stamp)
	stamp.position = Vector2(R_SCORE.end.x - 130.0, R_SCORE.end.y - 66.0)
	stamp.rotation = -0.18
	ui_node.add_child(stamp)

	add_button(&"again", R_AGAIN, "PLAY AGAIN", "primary")
	add_button(&"title", R_TITLE, "TITLE")


# A paper card (baked 9-slice) with a soft shadow; falls back to the flat panel.
func _card(parent: Control, node_name: String, rect: Rect2) -> void:
	if UiSkin.box("panel_paper9") == null:
		add_panel(parent, node_name, rect, UiTheme.color("paper"))
		return
	var sh := add_panel(parent, node_name + "Shadow", Rect2(rect.position + Vector2(-14, -6), rect.size + Vector2(28, 30)))
	sh.add_theme_stylebox_override("panel", UiSkin.box("shadow9"))
	var card := add_panel(parent, node_name, rect)
	card.add_theme_stylebox_override("panel", UiSkin.box("panel_paper9"))


# Golden sunburst behind the heading (won only); the node turns slowly in apply_time.
func _draw_rays(on: CanvasItem) -> void:
	var n := 18
	for k in range(n):
		var a0 := TAU * float(k) / float(n)
		var a1 := a0 + TAU / float(n) * 0.5
		var pts := PackedVector2Array([Vector2.ZERO, Vector2(cos(a0), sin(a0)) * 900.0, Vector2(cos(a1), sin(a1)) * 900.0])
		var cols := PackedColorArray([Color(1.0, 0.85, 0.4, 0.32), Color(1.0, 0.7, 0.2, 0.0), Color(1.0, 0.7, 0.2, 0.0)])
		on.draw_polygon(pts, cols)
	for k in range(6):
		on.draw_circle(Vector2.ZERO, 260.0 - float(k) * 40.0, Color(1.0, 0.8, 0.35, 0.05))


# The words on the rubber stamp in the corner of the score card.
static func stamp_for(flags: Dictionary) -> String:
	var reason: String = str(flags.get("reason", ""))
	if reason == "won":
		return "LEGEND"
	if reason == "bankrupt":
		return "SKINT"
	return "DONE"


# A rubber stamp, slightly rotated, in the corner of the score card.
func _draw_stamp(on: CanvasItem) -> void:
	var flags: Dictionary = _current_state().get("flags", {})
	var col := Color("D4A017") if _won else Color("C8323A")
	var word := stamp_for(flags)
	var f := UiSkin.display_font(900)
	var w := f.get_string_size(word, HORIZONTAL_ALIGNMENT_LEFT, -1, 34).x + 36.0
	var r := Rect2(-w * 0.5, -28, w, 56)
	var sb := StyleBoxFlat.new()
	sb.draw_center = false
	sb.set_border_width_all(5)
	sb.border_color = UiSkin.fade(col, 0.85)
	sb.set_corner_radius_all(10)
	sb.anti_aliasing = true
	on.draw_style_box(sb, r)
	on.draw_style_box(sb, r.grow(-8))
	on.draw_string(f, Vector2(r.position.x, 13), word, HORIZONTAL_ALIGNMENT_CENTER, w, 34, UiSkin.fade(col, 0.85))


# Rain falling from the cloud (bankrupt only).
func _draw_rain(on: CanvasItem) -> void:
	var t: float = on.get_meta("t", 0.0)
	for i in range(18):
		var x := -20.0 + float(i) * 8.0
		var y := 36.0 + fposmod(float(i) * 37.0 + t * 260.0, 160.0)
		on.draw_line(Vector2(x, y), Vector2(x - 3.0, y + 10.0), Color(0.7, 0.78, 1.0, 0.7 * (1.0 - (y - 36.0) / 160.0)), 2.0, true)


# A glint travelling over each won plate disc.
func _draw_glints(on: CanvasItem) -> void:
	if not _won:
		return
	var t: float = on.get_meta("t", 0.0)
	var plates: Dictionary = _current_state().get("plates", {})
	for i in range(CoreState.PLATE_KEYS.size()):
		if plates.get(CoreState.PLATE_KEYS[i], false) != true:
			continue
		var u := fposmod(t * 0.6 - float(i) * 0.3, 1.6)
		if u > 1.0:
			continue
		var a := sin(u * PI)
		var p := Vector2(712, 266 + i * ROW_H) + Vector2(18, 8) * u
		var r := 3.0 + 7.0 * a
		on.draw_colored_polygon(PackedVector2Array([p + Vector2(0, -r), p + Vector2(r * 0.2, -r * 0.2), p + Vector2(r, 0), p + Vector2(r * 0.2, r * 0.2), p + Vector2(0, r), p + Vector2(-r * 0.2, r * 0.2), p + Vector2(-r, 0), p + Vector2(-r * 0.2, -r * 0.2)]), Color(1, 1, 1, a))


# Points of a circle (24 sides) about centre.
static func _circle_points(centre: Vector2, radius: float) -> PackedVector2Array:
	var pts := PackedVector2Array()
	for k in range(24):
		var a: float = TAU * float(k) / 24.0
		pts.append(centre + Vector2(cos(a), sin(a)) * radius)
	return pts
