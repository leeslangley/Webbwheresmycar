extends "res://tests/harness.gd"

# GarageRoom behaviour (GDR04): the car list with paging, selection by tap and keys, the detail panel,
# BACK, and the empty garage. The room gets a TestFakeGame before it enters the tree; the runner does
# not fire _ready, so the test calls it by hand. Taps go through TapUtil.


func _room(fake: TestFakeGame) -> GarageRoom:
	var room := (load("res://scenes/garage.tscn") as PackedScene).instantiate() as GarageRoom
	room.game = fake
	tree().root.add_child(room)
	room._ready()
	return room


func _done(room: GarageRoom) -> void:
	tree().root.remove_child(room)
	room.free()


func _ui_label(room: GarageRoom, label_name: String) -> Label:
	return room.get_node("Ui/" + label_name) as Label


func _ui_bar(room: GarageRoom, bar_name: String) -> ColorRect:
	return room.get_node("Ui/" + bar_name) as ColorRect


func _btn(room: GarageRoom, btn_name: String) -> UiButton:
	return room.get_node("Hotspots/Btn_" + btn_name) as UiButton


func _capture_requests(room: GarageRoom) -> Array:
	var got: Array = []
	room.request_scene.connect(func(scene_id: StringName, params: Dictionary) -> void: got.append([scene_id, params]))
	return got


func test_enter_lists_cars() -> void:
	var fake := TestFakeGame.new()
	var room := _room(fake)
	room.enter({})
	eq(room.sel_id, "c1", "the first car is selected by default")

	var row0 := _btn(room, "row0")
	ok(row0.text.contains("Austen Allergy"), "row 0 names the first car")
	ok(row0.text.contains("OWN"), "row 0 says OWN")
	ok(row0.text.contains("COND 6.0"), "row 0 shows the condition")
	var row1 := _btn(room, "row1")
	ok(row1.text.contains("Reliable Robbin"), "row 1 names the second car")
	ok(row1.text.contains("OWN"), "row 1 says OWN")
	ok(row1.text.contains("FAULT"), "row 1 flags the fault")
	ok(not _btn(room, "row2").visible, "row 2 is hidden with two cars")
	ok(not _btn(room, "row3").visible, "row 3 is hidden with two cars")
	ok(not _btn(room, "row4").visible, "row 4 is hidden with two cars")
	ok(row0.hot, "the selected row is lit")

	eq(_ui_label(room, "StableLabel").text, "STABLE 2/3", "stable count")
	eq(_ui_label(room, "NameLabel").text, "Austen Allergy", "detail name")
	var model: Dictionary = Data.car_by_id("t1_allergy")
	eq(_ui_label(room, "QuipLabel").text, String(model.quip), "detail quip")
	eq(_ui_label(room, "EmptyLabel").visible, false, "empty label hidden with cars")
	_done(room)


func test_rental_and_tap_select() -> void:
	var fake := TestFakeGame.new()
	var room := _room(fake)
	var c2: Dictionary = fake.state["cars"][1]
	c2["owned"] = false
	c2["rentMonthly"] = 260
	c2["rentedAtCondition"] = 7.0
	room.refresh()
	ok(_btn(room, "row1").text.contains("RENT"), "a rented car says RENT in its row")

	room.enter({})
	TapUtil.tap(room.hotspots[&"row1"])
	eq(room.sel_id, "c2", "tapping row 1 selects the second car")
	ok(_btn(room, "row1").hot, "row 1 is lit after the tap")
	ok(not _btn(room, "row0").hot, "row 0 is no longer lit")
	eq(_ui_label(room, "NameLabel").text, "Reliable Robbin", "detail follows the selection")
	ok(_ui_label(room, "FaultLabel").text.begins_with("FAULT: Flat tyre"), "fault line names the fault")
	ok(_ui_label(room, "FaultLabel").text.contains(CoreFormat.money(80)), "fault line shows the fix cost")
	eq(_ui_label(room, "CostLabel").text, "Rent/month " + CoreFormat.money(260), "rental shows rent per month")

	TapUtil.tap(room.hotspots[&"row0"])
	ok(_ui_label(room, "CostLabel").text.begins_with("Running cost/month "), "an owned car shows running cost")
	var model: Dictionary = Data.car_by_id("t1_allergy")
	var car: Dictionary = fake.state["cars"][0]
	eq(_ui_label(room, "DesLabel").text, "DESIRABILITY " + CoreFormat.one_dp(SimCarStats.eff_d(model, car)), "desirability line")
	near(_ui_bar(room, "DesBar").size.x, 290.0 * clampf(SimCarStats.eff_d(model, car) / 10.0, 0.0, 1.0), 1e-3, "desirability bar width")

	TapUtil.tap_away(room.hotspots[&"row1"])
	eq(room.sel_id, "c1", "a press released outside the row does not select it")
	_done(room)


func test_condition_colour() -> void:
	var fake := TestFakeGame.new()
	var room := _room(fake)
	room.enter({})
	eq(_ui_bar(room, "CondBar").color, Color("FFD27A"), "condition 6.0 is amber")
	fake.state["cars"][0]["condition"] = 8.0
	room.refresh()
	eq(_ui_bar(room, "CondBar").color, Color("3FAE49"), "condition 8.0 is green")
	fake.state["cars"][0]["condition"] = 3.0
	room.refresh()
	eq(_ui_bar(room, "CondBar").color, Color("D9483B"), "condition 3.0 is red")
	_done(room)


func test_paging() -> void:
	var fake := TestFakeGame.new()
	var room := _room(fake)
	var base: Dictionary = fake.state["cars"][0]
	for n in range(3, 8):
		var copy: Dictionary = base.duplicate(true)
		copy["id"] = "c%d" % n
		fake.state["cars"].append(copy)
	room.enter({})
	eq(room.page_count(), 2, "seven cars make two pages")
	ok(not _btn(room, "page_up").enabled, "UP is disabled on the first page")
	ok(_btn(room, "page_down").enabled, "DOWN is enabled on the first page")
	eq(room.row_car_ids(), ["c1", "c2", "c3", "c4", "c5"], "page 0 holds the first five cars")
	ok(_btn(room, "row4").visible, "row 4 is visible with five cars")

	room.page_move(1)
	eq(room.row_car_ids(), ["c6", "c7"], "page 1 holds the last two cars")
	ok(_btn(room, "row0").text.contains("Austen Allergy"), "row 0 on page 1 is the sixth car")
	ok(not _btn(room, "row2").visible, "rows past the end are hidden on page 1")
	ok(not _btn(room, "page_down").enabled, "DOWN is disabled on the last page")
	room.page_move(1)
	eq(room.page, 1, "moving past the last page stays on it")

	room.select("c1")
	eq(room.page, 0, "selecting a car on page 0 goes back to page 0")
	ok(not _btn(room, "page_up").enabled, "UP is disabled again on page 0")
	_done(room)


func test_keys() -> void:
	var fake := TestFakeGame.new()
	var room := _room(fake)
	room.enter({})
	ok(room.handle_key(KEY_DOWN), "KEY_DOWN is handled")
	eq(room.sel_id, "c2", "KEY_DOWN selects the next car")
	room.handle_key(KEY_DOWN)
	eq(room.sel_id, "c2", "KEY_DOWN stays on the last car")
	ok(room.handle_key(KEY_UP), "KEY_UP is handled")
	eq(room.sel_id, "c1", "KEY_UP selects the previous car")
	room.handle_key(KEY_UP)
	eq(room.sel_id, "c1", "KEY_UP stays on the first car")
	ok(not room.handle_key(KEY_LEFT), "other keys are not handled")
	_done(room)


func test_back() -> void:
	var fake := TestFakeGame.new()
	var room := _room(fake)
	var got := _capture_requests(room)
	room.enter({})
	TapUtil.tap(room.hotspots[&"back"])
	eq(got.size(), 1, "BACK emits one request")
	eq(got[0], [&"office", {}], "BACK asks for the office")
	ok(room.handle_key(KEY_ESCAPE), "ESCAPE is handled")
	eq(got.size(), 2, "ESCAPE emits the same request")
	eq(got[1], [&"office", {}], "ESCAPE asks for the office")
	_done(room)


func test_empty_garage() -> void:
	var fake := TestFakeGame.new()
	var room := _room(fake)
	fake.state["cars"] = []
	room.enter({})
	eq(_ui_label(room, "EmptyLabel").visible, true, "the empty message shows")
	eq(_ui_label(room, "NameLabel").text, "", "no name without a car")
	eq(_ui_label(room, "StableLabel").text, "STABLE 0/3", "stable count is zero")
	eq(room.sel_id, "", "no selection without a car")
	ok(not _btn(room, "row0").visible, "no row without a car")
	_done(room)


func test_enter_with_car_id() -> void:
	var fake := TestFakeGame.new()
	var room := _room(fake)
	room.enter({"carId": "c2"})
	eq(room.sel_id, "c2", "enter with a carId selects that car")
	eq(_ui_label(room, "NameLabel").text, "Reliable Robbin", "detail shows the car from enter")
	room.enter({"carId": "nope"})
	eq(room.sel_id, "c1", "an unknown carId falls back to the first car")
	_done(room)


func test_changed_signal_refreshes() -> void:
	var fake := TestFakeGame.new()
	var room := _room(fake)
	room.enter({})
	fake.state["cars"][0]["condition"] = 2.0
	fake.changed.emit()
	eq(_ui_label(room, "CondLabel").text, "CONDITION 2.0", "a changed signal refreshes the detail")
	_done(room)


func test_impounded_tag() -> void:
	var fake := TestFakeGame.new()
	var room := _room(fake)
	fake.state["cars"][0]["impoundedUntil"] = 20
	room.enter({})
	ok(_btn(room, "row0").text.contains("IMPOUNDED"), "a car impounded past today is tagged")
	_done(room)
