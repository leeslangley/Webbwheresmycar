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


func _draw() -> void:
	draw_rect(Rect2(Vector2.ZERO, size), UiTheme.color("hudBg"))
	draw_rect(Rect2(Vector2.ZERO, Vector2(size.x, 4.0)), UiTheme.color("hudEdge"))
	UiTheme.draw_text(self, "REP %d" % int(round(_rep)), Vector2(1122, 12), "h3", UiTheme.color("white"))
	UiTheme.draw_bar(self, Rect2(1122, 36, 134, 14), _rep / 100.0, UiTheme.color("good"))
	UiTheme.draw_text(self, "BUZZ %d" % int(round(_buzz)), Vector2(1122, 62), "h3", UiTheme.color("white"))
	UiTheme.draw_bar(self, Rect2(1122, 86, 134, 14), _buzz / 100.0, UiTheme.color("warn"))
