extends "res://tests/harness.gd"

# CarSheet (GDA17). Tests instantiate the scene and call build() themselves; no SceneTree, no add_child on the test.


func _make() -> CarSheet:
	var sheet := (load("res://art/car_sheet.tscn") as PackedScene).instantiate() as CarSheet
	sheet.build()
	return sheet


func _ids() -> Array:
	var ids: Array = (CarView.manifest().get("cars", {}) as Dictionary).keys()
	ids.sort()
	return ids


func _cars() -> Dictionary:
	return CarView.manifest().get("cars", {}) as Dictionary


func _cell(sheet: CarSheet, k: int) -> CarView:
	return sheet.get_node("Cell_%d" % k) as CarView


func test_tree_and_layout() -> void:
	var sheet := _make()
	var n := _ids().size()
	ok(n > 0, "manifest has cars")
	eq(sheet.get_child_count(), 1 + 2 * n, "Back plus two cells per car")
	ok(sheet.get_node_or_null("Back") != null, "Back exists")
	eq((sheet.get_node("Back") as ColorRect).color, Color("1b1740"), "Back colour")
	ok(sheet.get_node_or_null("Cell_0") != null, "Cell_0 exists")
	ok(sheet.get_node_or_null("Cell_%d" % (2 * n - 1)) != null, "last cell exists")
	var rows := ceili(float(2 * n) / 4.0)
	eq(_cell(sheet, 0).size, Vector2(320, 720.0 / rows), "cell size is (320, 720 / rows)")
	eq(_cell(sheet, 0).custom_minimum_size, Vector2(320, 720.0 / rows), "cell minimum size")
	eq(_cell(sheet, 5).position, Vector2(320, 720.0 / rows), "Cell_5 is column 1 row 1")
	eq(_cell(sheet, 2 * n - 1).position, Vector2(960, 720.0 / rows * float(rows - 1)), "last cell is bottom right")
	sheet.free()


func test_first_cell_is_side_view() -> void:
	var sheet := _make()
	var cell := _cell(sheet, 0)
	ok(cell != null, "Cell_0 is a CarView")
	if cell != null:
		eq(cell.view, "side", "Cell_0 view is side")
		eq(cell.car_id, _ids()[0], "Cell_0 car is the first sorted id")
		eq(cell.wear, 0.0, "Cell_0 wear is 0")
	sheet.free()


func test_wear_and_views_by_index() -> void:
	var sheet := _make()
	var ids := _ids()
	eq(_cell(sheet, 1).view, "three_quarter", "Cell_1 view is three_quarter")
	eq(_cell(sheet, 1).wear, 0.0, "Cell_1 wear is 0")
	eq(_cell(sheet, 2).view, "side", "Cell_2 view is side")
	eq(_cell(sheet, 2).car_id, ids[1], "Cell_2 is car index 1")
	eq(_cell(sheet, 2).wear, 1.0, "Cell_2 wear is 1 (index 1 mod 4)")
	eq(_cell(sheet, 8).car_id, ids[4], "Cell_8 is car index 4")
	eq(_cell(sheet, 8).wear, 0.0, "Cell_8 wear is 0 (index 4 mod 4)")
	sheet.free()


func test_every_cell_has_tag_and_shrink() -> void:
	var sheet := _make()
	var ids := _ids()
	var cars := _cars()
	for k in range(2 * ids.size()):
		var cell := _cell(sheet, k)
		var game_name := str((cars[ids[floori(float(k) / 2.0)]] as Dictionary).get("game_name", ""))
		var tag := cell.get_node_or_null("Tag") as Label
		ok(tag != null, "Cell_%d has a Tag label" % k)
		if tag != null:
			ok(tag.text.contains(" w"), "Cell_%d tag shows wear" % k)
			ok(game_name != "" and tag.text.contains(game_name), "Cell_%d tag shows game name" % k)
		eq((cell.get_node("Box") as SubViewportContainer).stretch_shrink, 2, "Cell_%d stretch_shrink is 2" % k)
	sheet.free()
