extends "res://tests/harness.gd"


func _state() -> Dictionary:
	return {
		"day": 3,
		"cash": 5000,
		"reputation": 40,
		"buzz": 12,
		"plates": {"fatcat": true, "stable": false, "household": false, "hammer": false},
		"cars": [
			{"id": "c1", "modelId": "t1_allergy", "owned": false, "condition": 5.0},
			{"id": "c2", "modelId": "t1_robbin", "owned": true, "condition": 10.0},
		],
	}


# The runner does not fire _ready on add_child, so build the HUD by hand. The cash bar makes its
# counter in its own _ready, so that is run by hand too (guarded, as in test_ui_plates_cash).
func _hud() -> UiHud:
	var h := UiHud.new()
	tree().root.add_child(h)
	h.build()
	var cash: UiCashBar = h.get_node("Cash")
	if cash.get_node_or_null("Counter") == null:
		cash._ready()
	return h


func test_layout() -> void:
	var h := _hud()
	eq(h.size, Vector2(1280, 130), "strip size")
	var spots := {"Plates": Vector2(24, 6), "Cash": Vector2(24, 78), "Portrait": Vector2(324, 8), "Calendar": Vector2(640, 8), "Chart": Vector2(786, 8)}
	for child_name in spots:
		var n: Control = h.get_node_or_null(child_name)
		ok(n != null, child_name + " exists")
		if n != null:
			eq(n.position, spots[child_name], child_name + " position")
	h.free()


func test_refresh() -> void:
	UiCashHistory.reset()
	var h := _hud()
	h.refresh(_state())
	var plates: UiPlateRow = h.get_node("Plates")
	eq(plates.is_won("fatcat"), true, "fatcat plate won")
	var calendar: UiCalendarSheet = h.get_node("Calendar")
	eq(calendar.day, 3, "calendar shows day 3")
	var cash: UiCashBar = h.get_node("Cash")
	eq(cash.cash, 5000.0, "cash bar shows 5000")
	eq(h.portrait_car_id(), "t1_robbin", "portrait shows the first owned car")
	var portrait: CarPortrait = h.get_node("Portrait")
	eq(portrait.get_wear(), 0, "pristine car has wear 0")
	eq(UiCashHistory.count(), 1, "one day recorded")
	var chart: UiSalesChart = h.get_node("Chart")
	eq(chart.values, [5000.0], "chart shows the recorded cash")
	UiCashHistory.reset()
	h.free()


func test_selected_car() -> void:
	UiCashHistory.reset()
	var h := _hud()
	h.set_selected_car("c1")
	h.refresh(_state())
	eq(h.portrait_car_id(), "t1_allergy", "selected car c1 is shown")
	var portrait: CarPortrait = h.get_node("Portrait")
	eq(portrait.get_wear(), 2, "condition 5.0 gives wear 2")
	UiCashHistory.reset()
	h.free()


func test_no_cars() -> void:
	UiCashHistory.reset()
	var h := _hud()
	var s := _state()
	s["cars"] = []
	h.refresh(s)
	eq(h.portrait_car_id(), "", "no cars leaves the portrait empty")
	UiCashHistory.reset()
	h.free()


func test_bind() -> void:
	UiCashHistory.reset()
	var h := _hud()
	var script := GDScript.new()
	script.source_code = "extends Node\nsignal changed\nvar state := {}\n"
	script.reload()
	var g = Node.new()
	g.set_script(script)
	g.state = _state()
	h.bind(g)
	var calendar: UiCalendarSheet = h.get_node("Calendar")
	eq(calendar.day, 3, "bind refreshes at once")
	g.state = {"day": 4, "cash": 1.0}
	g.changed.emit()
	eq(calendar.day, 4, "the changed signal refreshes the HUD")
	UiCashHistory.reset()
	g.free()
	h.free()
