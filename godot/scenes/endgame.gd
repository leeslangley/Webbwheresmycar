class_name EndgameRoom
extends RoomBase

# The end-of-game screen (port of src/ui/scenes/endgame.js). A cream board with the heading for how the
# year ended and its subline, the score block, the four Gold Number Plates, the best auction sale,
# confetti for a win or a drifting cloud for a bankruptcy, and the PLAY AGAIN / TITLE buttons.
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

	var heading := ui().get_node("Heading") as Label
	heading.text = heading_for(flags)
	heading.add_theme_color_override("font_color", UiTheme.color("gold") if won else ink)
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
		state_label.add_theme_font_override("font", pixel_font("title" if got else "body"))
		state_label.add_theme_font_size_override("font_size", 18 if got else 26)
		state_label.add_theme_color_override("font_color", UiTheme.color("gold") if got else UiTheme.color("lightgrey"))

	var stats: Dictionary = state.get("stats", {})
	(ui().get_node("BestSale") as Label).text = "Best auction sale " + CoreFormat.money(float(stats.get("bestAuctionSale", 0)))

	(ui().get_node("Confetti") as Control).visible = won
	(ui().get_node("Cloud") as Node2D).visible = flags.get("reason", "") == "bankrupt"


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

	add_box(placeholder("Background"), "Backdrop", Rect2(0, 0, 1280, 720), strip_color)
	add_panel(ui_node, "Board", R_BOARD, paper)

	var confetti := Control.new()
	confetti.name = "Confetti"
	confetti.size = STAGE_SIZE
	confetti.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ui_node.add_child(confetti)
	for i in range(CONFETTI_COUNT):
		add_box(confetti, "Confetti%d" % i, Rect2(0, 0, 10, 16), _confetti_colors[i % _confetti_colors.size()])

	var cloud := Node2D.new()
	cloud.name = "Cloud"
	ui_node.add_child(cloud)
	var puff_centres: Array[Vector2] = [Vector2(0, 0), Vector2(44, -16), Vector2(84, 4)]
	for i in range(puff_centres.size()):
		var puff := Polygon2D.new()
		puff.name = "Puff%d" % i
		puff.polygon = _circle_points(puff_centres[i], CLOUD_PUFF_RADII[i])
		puff.color = Color("959595")
		cloud.add_child(puff)
	var base := Polygon2D.new()
	base.name = "Base"
	base.polygon = PackedVector2Array([Vector2(-24, 24), Vector2(116, 24), Vector2(116, 36), Vector2(-24, 36)])
	base.color = Color("6C6C6C")
	cloud.add_child(base)

	var heading := add_label(ui_node, "Heading", "", Vector2(100, 70), 34, ink, 1080.0, true)
	heading.add_theme_font_override("font", pixel_font("title"))
	add_label(ui_node, "Subline", "", Vector2(100, 140), 28, ink, 1080.0, true)

	add_panel(ui_node, "ScorePanel", R_SCORE, paper)
	for i in range(5):
		add_label(ui_node, "Score%d" % i, "", Vector2(164, 236 + i * ROW_H), 30, ink, 470.0)

	add_panel(ui_node, "PlatesPanel", R_PLATES, paper)
	var plates_title := add_label(ui_node, "PlatesTitle", "GOLD NUMBER PLATES", Vector2(704, 220), 18, ink)
	plates_title.add_theme_font_override("font", pixel_font("title"))
	for i in range(CoreState.PLATE_KEYS.size()):
		add_label(ui_node, "PlateName%d" % i, "", Vector2(704, 262 + i * ROW_H), 28, ink, 270.0)
		var state_label := add_label(ui_node, "PlateState%d" % i, "", Vector2(944, 262 + i * ROW_H), 26, grey, 172.0)
		state_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	add_label(ui_node, "BestSale", "", Vector2(704, 498), 28, ink, 420.0)

	add_button(&"again", R_AGAIN, "PLAY AGAIN", "primary")
	add_button(&"title", R_TITLE, "TITLE")


# Points of a circle (24 sides) about centre.
static func _circle_points(centre: Vector2, radius: float) -> PackedVector2Array:
	var pts := PackedVector2Array()
	for k in range(24):
		var a: float = TAU * float(k) / 24.0
		pts.append(centre + Vector2(cos(a), sin(a)) * radius)
	return pts
