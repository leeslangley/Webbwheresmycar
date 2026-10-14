class_name TitleRoom
extends RoomBase

# Title screen (port of src/ui/scenes/title.js): night sky with twinkling stars, a road with a
# scrolling centre line, a car that drives across every 6 seconds, the bobbing logo and three buttons.
# Buttons only emit signals; the Flow decides what happens. No HUD or banner is shown here.

signal new_game
signal continue_game
signal open_settings

const R_NEW := Rect2(480, 420, 320, 64)
const R_CONTINUE := Rect2(480, 496, 320, 64)
const R_SETTINGS := Rect2(480, 572, 320, 64)
const CAR_COLORS := [Color("9A2A2A"), Color("1C2E5A"), Color("E8B923"), Color("588D43")]
const STAR_COUNT := 40
const DASH_COUNT := 14

var _t := 0.0


func _ready() -> void:
	build_layers()
	strip_color = Color("14102A")
	_build_background()
	_build_props()
	_build_logo()
	add_button(&"new_game", R_NEW, "NEW GAME", "primary")
	add_button(&"continue", R_CONTINUE, "CONTINUE")
	add_button(&"settings", R_SETTINGS, "SETTINGS")
	refresh()
	apply_time(0.0)


func _build_background() -> void:
	var bg := placeholder("Background")
	var sky := Polygon2D.new()
	sky.name = "Sky"
	sky.polygon = PackedVector2Array([Vector2(0, 0), Vector2(1280, 0), Vector2(1280, 640), Vector2(0, 640)])
	sky.vertex_colors = PackedColorArray([Color("14102A"), Color("14102A"), Color("352879"), Color("352879")])
	bg.add_child(sky)
	RoomBase.add_box(bg, "Road", Rect2(0, 640, 1280, 80), Color("444444"))
	var stars := Node2D.new()
	stars.name = "Stars"
	bg.add_child(stars)
	for i in range(STAR_COUNT):
		var pos := Vector2((i * 137 + 53) % 1280, (i * 89 + 31) % 600)
		RoomBase.add_box(stars, "Star%d" % i, Rect2(pos, Vector2(2, 2)), Color.WHITE)
	var dashes := Node2D.new()
	dashes.name = "Dashes"
	bg.add_child(dashes)
	for k in range(DASH_COUNT):
		RoomBase.add_box(dashes, "Dash%d" % k, Rect2(Vector2(k * 100 - 60, 676), Vector2(60, 8)), Color("B8C76F"))


func _build_props() -> void:
	var car := Node2D.new()
	car.name = "Car"
	placeholder("Props").add_child(car)
	RoomBase.add_box(car, "Body", Rect2(0, 0, 200, 60), CAR_COLORS[0])
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


func _build_logo() -> void:
	var ui_node := ui()
	var logo_webb := RoomBase.add_label(ui_node, "LogoWebb", "WEBB,", Vector2(0, 100), 64, Color("FFD27A"), 1280.0, true)
	logo_webb.add_theme_font_override("font", UiTheme.title_font())
	var logo_title := RoomBase.add_label(ui_node, "LogoTitle", "WHERE'S MY CAR?", Vector2(0, 190), 48, Color("F4E9C8"), 1280.0, true)
	logo_title.add_theme_font_override("font", UiTheme.title_font())
	RoomBase.add_label(ui_node, "LogoSub", "A WEBB'S WHEELS PRODUCTION", Vector2(0, 280), 30, Color("959595"), 1280.0, true)
	RoomBase.add_label(ui_node, "LogoStar", "Starring Mark Webb", Vector2(0, 320), 28, Color("B8C76F"), 1280.0, true)


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
	var bob := sin(t * 1.5) * 4.0
	var base_ys := {"LogoWebb": 100.0, "LogoTitle": 190.0, "LogoSub": 280.0, "LogoStar": 320.0}
	for logo_name in base_ys:
		var logo := ui().get_node(logo_name) as Control
		logo.position.y = float(base_ys[logo_name]) + bob
