extends "res://tests/harness.gd"

# Tests for the SHOP BUY and RENT actions (tv/shop_channel.gd, GDU23). _ready does not fire in tests, so each
# test adds the channel to the tree and calls _ready by hand. Taps go through the buttons' handle_event.


func _make() -> ShopChannel:
	var c := (load("res://tv/shop_channel.tscn") as PackedScene).instantiate() as ShopChannel
	tree().root.add_child(c)
	c.call("_ready")
	return c


func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:
	var ev := InputEventMouseButton.new()
	ev.button_index = MOUSE_BUTTON_LEFT
	ev.pressed = down
	ev.position = pos
	return ev


func _tap(btn: Object) -> void:
	btn.call("handle_event", _mb(Vector2(10, 10), true))
	btn.call("handle_event", _mb(Vector2(12, 12), false))


func test_refusal() -> void:
	var st: Dictionary = TestFakeGame.sample_state()
	var l1: Dictionary = st["shop"]["listings"][0]
	var l2: Dictionary = st["shop"]["listings"][1]
	eq(ShopChannel.refusal(st, l1, "sale"), "", "a sale with money and a slot is fine")
	eq(ShopChannel.refusal(st, l1, "rent"), "That one is not for rent", "a sale is not for rent")
	eq(ShopChannel.refusal(st, l2, "sale"), "That one is not for sale", "a rental is not for sale")
	eq(ShopChannel.refusal(st, {}, "sale"), "That one is not for sale", "no listing is not for sale")
	eq(ShopChannel.refusal(st, {}, "rent"), "That one is not for rent", "no listing is not for rent")
	st["cash"] = 100
	eq(ShopChannel.refusal(st, l1, "sale"), "Not enough money", "too poor to buy")
	st["cars"].append(st["cars"][0].duplicate())
	eq(ShopChannel.refusal(st, l1, "sale"), "No free garage slot", "a full garage is checked before money")


func test_buy() -> void:
	var c := _make()
	var g := TestFakeGame.new()
	c.enter(g)
	_tap(c.get_node("BuyBtn"))
	eq(g.acts, [{"action": "buy_car", "params": {"listing_id": "L1"}}], "BUY sends buy_car for the selected listing")
	eq(g.toasts, ["Done"], "the success text is toasted")
	c.leave()
	c.free()


func test_rent_selected_buy_refused() -> void:
	var c := _make()
	var g := TestFakeGame.new()
	c.enter(g)
	c.get_node("List").select(1, true)
	_tap(c.get_node("BuyBtn"))
	eq(g.acts, [], "a refused BUY sends nothing")
	eq(g.toasts, ["That one is not for sale"], "the refusal is toasted")
	_tap(c.get_node("RentBtn"))
	eq(g.acts, [{"action": "rent_car", "params": {"listing_id": "L2"}}], "RENT sends rent_car for L2")
	c.leave()
	c.free()


func test_failure_not_toasted_twice() -> void:
	var c := _make()
	var g := TestFakeGame.new()
	c.enter(g)
	g.next_result = {"ok": false, "msg": "No way"}
	_tap(c.get_node("BuyBtn"))
	eq(g.toasts, ["No way"], "a failed action is toasted once, by Game (the fake here)")
	c.leave()
	c.free()


func test_enabled_flags() -> void:
	var c := _make()
	var g := TestFakeGame.new()
	c.enter(g)
	ok(c.get_node("BuyBtn").enabled, "BUY is on for a sale with money and a slot")
	ok(not c.get_node("RentBtn").enabled, "RENT is off for a sale")
	c.get_node("List").select(1, true)
	ok(not c.get_node("BuyBtn").enabled, "BUY is off for a rental")
	ok(c.get_node("RentBtn").enabled, "RENT is on for a rental")
	g.state["cash"] = 100
	g.changed.emit()
	ok(not c.get_node("BuyBtn").enabled, "BUY is off when broke")
	ok(not c.get_node("RentBtn").enabled, "RENT is off when broke")
	c.leave()
	c.free()


func test_disabled_tap_explains() -> void:
	var c := _make()
	var g := TestFakeGame.new()
	c.enter(g)
	g.state["cash"] = 100
	g.changed.emit()
	_tap(c.get_node("BuyBtn"))
	eq(g.acts, [], "a blocked BUY sends nothing")
	eq(g.toasts, ["Not enough money"], "a blocked BUY explains why")
	c.leave()
	c.free()


func test_ok_button() -> void:
	var c := _make()
	var g := TestFakeGame.new()
	c.enter(g)
	c.on_ok()
	eq(g.acts, [{"action": "buy_car", "params": {"listing_id": "L1"}}], "OK on a sale buys it")
	c.get_node("List").select(1, true)
	c.on_ok()
	eq(g.acts[1], {"action": "rent_car", "params": {"listing_id": "L2"}}, "OK on a rental rents it")
	g.state["shop"]["listings"] = []
	g.changed.emit()
	c.on_ok()
	eq(g.acts.size(), 2, "OK on an empty board sends nothing")
	c.leave()
	c.free()
