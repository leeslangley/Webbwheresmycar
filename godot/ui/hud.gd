class_name UiHud
extends Control

# The permanent bottom HUD strip (stage y 590-720, 1280x130): the four Gold Number Plate slots, the CASH bar,
# the selected-car portrait, the torn-off calendar day, the small SALES chart, and the REP and BUZZ bars.
# It only READS the game state: bind(game) listens to game.changed and refresh(state) pushes the values
# into the child widgets.

signal plate_tapped(key: String)

var _game: Object = null
var _rep: float = 0.0
var _buzz: float = 0.0
var _selected_id: String = ""


func _init() -> void:
	size = Vector2(1280, 130)
	mouse_filter = MOUSE_FILTER_PASS
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR


func _ready() -> void:
	build()


# Creates the child widgets once. Does nothing when they already exist.
func build() -> void:
	if get_node_or_null("Plates") != null:
		return
	var plates := UiPlateRow.new()
	plates.name = "Plates"
	plates.position = Vector2(24, 6)
	plates.size = Vector2(280, 64)
	add_child(plates)
	plates.plate_tapped.connect(func(k: String) -> void: plate_tapped.emit(k))

	var cash := UiCashBar.new()
	cash.name = "Cash"
	cash.position = Vector2(24, 78)
	cash.size = Vector2(280, 44)
	add_child(cash)

	var portrait := CarPortrait.new()
	portrait.name = "Portrait"
	portrait.position = Vector2(324, 8)
	portrait.size = Vector2(300, 114)
	add_child(portrait)

	var calendar := UiCalendarSheet.new()
	calendar.name = "Calendar"
	calendar.position = Vector2(640, 8)
	calendar.size = Vector2(130, 114)
	add_child(calendar)

	var chart := UiSalesChart.new()
	chart.name = "Chart"
	chart.position = Vector2(786, 8)
	chart.size = Vector2(320, 114)
	add_child(chart)


# Listens to the game's changed signal and shows its state now.
func bind(game: Object) -> void:
	_game = game
	if not game.is_connected("changed", _on_changed):
		game.connect("changed", _on_changed)
	refresh(game.get("state"))


func _on_changed() -> void:
	if _game != null:
		refresh(_game.get("state"))


func set_selected_car(car_id: String) -> void:
	_selected_id = car_id
	if _game != null:
		refresh(_game.get("state"))


func refresh(state: Dictionary) -> void:
	build()
	var plates: UiPlateRow = get_node("Plates")
	plates.set_plates(state.get("plates", {}))
	var cash_value := float(state.get("cash", 0))
	var cash: UiCashBar = get_node("Cash")
	cash.set_cash(cash_value)
	var day := int(state.get("day", 1))
	var calendar: UiCalendarSheet = get_node("Calendar")
	calendar.set_day(day)
	UiCashHistory.record(day, cash_value)
	var chart: UiSalesChart = get_node("Chart")
	chart.set_values(UiCashHistory.values(14))
	_rep = float(state.get("reputation", 0))
	_buzz = float(state.get("buzz", 0))
	_refresh_portrait(state.get("cars", []))
	queue_redraw()


func portrait_car_id() -> String:
	var portrait: CarPortrait = get_node("Portrait")
	return portrait.get_car_id()


func _refresh_portrait(cars: Array) -> void:
	var portrait: CarPortrait = get_node("Portrait")
	var car := _pick_car(cars)
	if car.is_empty():
		portrait.clear()
		return
	var model := str(car.get("modelId", ""))
	var wear := CarPortrait.wear_for(float(car.get("condition", 10.0)))
	portrait.set_car(model, Color(Data.paint_of(model)), wear)


# The car the portrait shows: the selected one, else the first owned car, else the first car.
func _pick_car(cars: Array) -> Dictionary:
	if _selected_id != "":
		for c in cars:
			if c is Dictionary and c.get("id") == _selected_id:
				return c
	for c in cars:
		if c is Dictionary and c.get("owned") == true:
			return c
	for c in cars:
		if c is Dictionary:
			return c
	return {}


# The walnut-and-brass control panel (baked, with a soft shadow cast 16 px up onto the room) and the
# REP / BUZZ LED gauges in their brass-bezelled well.
func _draw() -> void:
	if UiSkin.tex("hud_panel") != null:
		UiSkin.blit(self, "hud_panel", Vector2(0, -16))
	else:
		draw_rect(Rect2(Vector2.ZERO, size), UiTheme.color("hudBg"))
	_gauge("REP", _rep, 20.0, UiTheme.color("phosphor"), Color("1E5A2C"))
	_gauge("BUZZ", _buzz, 70.0, UiTheme.color("amber"), Color("5A3A10"))


const GAUGE_X := 1124.0
const GAUGE_W := 134.0
const SEGMENTS := 10


static func lit_segments(v: float) -> int:
	return clampi(int(round(v / 100.0 * SEGMENTS)), 0, SEGMENTS)


func _gauge(label: String, v: float, y: float, on: Color, off: Color) -> void:
	UiSkin.role_text(self, label, Vector2(GAUGE_X, y), "h3", UiTheme.color("cream"), UiTheme.INK, 4)
	UiSkin.role_text(self, str(int(round(v))), Vector2(GAUGE_X, y), "h3", on, UiTheme.INK, 4, GAUGE_W, HORIZONTAL_ALIGNMENT_RIGHT)
	var n := lit_segments(v)
	var seg_w := (GAUGE_W - float(SEGMENTS - 1) * 3.0) / float(SEGMENTS)
	for i in range(SEGMENTS):
		var r := Rect2(GAUGE_X + float(i) * (seg_w + 3.0), y + 24.0, seg_w, 14.0)
		if i < n:
			UiSkin.rrect(self, r.grow(2.0), UiSkin.fade(on, 0.25), 5)
			UiSkin.rrect(self, r, on.lerp(Color.WHITE, 0.15), 3, UiTheme.INK, 1)
			draw_rect(Rect2(r.position + Vector2(2, 2), Vector2(r.size.x - 4, 3)), Color(1, 1, 1, 0.55))
		else:
			UiSkin.rrect(self, r, off, 3, UiTheme.INK, 1)
