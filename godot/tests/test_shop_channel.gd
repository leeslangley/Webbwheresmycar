extends "res://tests/harness.gd"

# Tests for the SHOP channel (tv/shop_channel.gd): the listings list, the selected-car portrait and the detail
# side. _ready does not fire in tests, so each test adds the channel to the tree and calls _ready by hand.


func _make() -> ShopChannel:
	var c := (load("res://tv/shop_channel.tscn") as PackedScene).instantiate() as ShopChannel
	tree().root.add_child(c)
	c.call("_ready")
	return c


func test_enter() -> void:
	var c := _make()
	var g := TestFakeGame.new()
	c.enter(g)
	eq(c.get_node("List").count, 3, "three listings")
	eq(c.get_node("List").selected, 0, "first row selected")
	eq(c.get_node("Portrait").get_car_id(), "t1_chimp", "portrait shows the first car")
	eq(c.selected_listing().get("listingId", ""), "L1", "selected listing is L1")
	eq(c.title, "SHOP", "title is SHOP")
	c.leave()
	c.free()


func test_select() -> void:
	var c := _make()
	c.enter(TestFakeGame.new())
	c.get_node("List").select(1, true)
	eq(c.selected_listing().get("listingId", ""), "L2", "selected listing is L2")
	eq(c.get_node("Portrait").get_car_id(), "t1_maurice", "portrait shows the second car")
	eq(c.get_node("Portrait").get_wear(), ShopChannel.wear_for(5.5), "portrait wear from condition 5.5")
	eq(ShopChannel.wear_for(5.5), 1, "wear_for(5.5) is 1")
	c.leave()
	c.free()


func test_empty() -> void:
	var c := _make()
	var g := TestFakeGame.new()
	c.enter(g)
	g.state["shop"]["listings"] = []
	g.changed.emit()
	eq(c.get_node("List").count, 0, "no rows when there are no listings")
	eq(c.selected_listing(), {}, "no selected listing")
	eq(c.get_node("Portrait").get_car_id(), "", "portrait is cleared")
	c.leave()
	c.free()


func test_changed_refreshes() -> void:
	var c := _make()
	var g := TestFakeGame.new()
	c.enter(g)
	var l3: Dictionary = g.state["shop"]["listings"][2]
	g.state["shop"]["listings"] = [l3]
	g.changed.emit()
	eq(c.get_node("List").count, 1, "one row after the change")
	eq(c.get_node("List").selected, 0, "selection clamps to row 0")
	eq(c.get_node("Portrait").get_car_id(), "t1_cooker", "portrait shows the new car")
	c.leave()
	c.free()


func test_row_painter() -> void:
	var c := _make()
	c.enter(TestFakeGame.new())
	ok(c.get_node("List").row_painter.is_valid(), "list has a row painter")
	c.leave()
	c.free()


func test_leave() -> void:
	var c := _make()
	var g := TestFakeGame.new()
	c.enter(g)
	c.leave()
	g.state["shop"]["listings"] = []
	g.changed.emit()
	eq(c.get_node("List").count, 3, "no refresh after leave")
	c.free()
