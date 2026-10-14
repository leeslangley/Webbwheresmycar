extends "res://tests/harness.gd"

# GarageRoom action buttons (GDR27): labels, greyed rules, the Game.act calls, the refusal toast, the keys.
# The room gets a TestFakeGame before it enters the tree; the runner does not fire _ready, so the test
# calls it by hand. Taps go through TapUtil. Game.act takes snake_case keys (car_id), as game.gd dispatches.


func _room(fake: TestFakeGame) -> GarageRoom:
	var room := (load("res://scenes/garage.tscn") as PackedScene).instantiate() as GarageRoom
	room.game = fake
	tree().root.add_child(room)
	room._ready()
	return room


func _done(room: GarageRoom) -> void:
	tree().root.remove_child(room)
	room.free()


func _btn(room: GarageRoom, id: StringName) -> UiButton:
	return room.hotspots[id] as UiButton


func _capture_toasts(room: GarageRoom) -> Array:
	var got: Array = []
	room.toast.connect(func(text: String) -> void: got.append(text))
	return got


func test_owned_car_labels_and_rules() -> void:
	var fake := TestFakeGame.new()
	var room := _room(fake)
	room.enter({})
	var model: Dictionary = Data.car_by_id("t1_allergy")
	var car: Dictionary = fake.state["cars"][0]

	var tinker := _btn(room, &"tinker")
	eq(tinker.text, "TINKER " + CoreFormat.money(GarageCosts.tinker_cost(model)), "tinker label")
	ok(tinker.visible, "tinker is shown for a selected car")
	ok(tinker.enabled, "tinker is on for condition 6.0 with cash")
	ok(_btn(room, &"service").text == "SERVICE " + CoreFormat.money(GarageCosts.service_cost(model)), "service label")
	ok(_btn(room, &"service").enabled, "service is on for condition 6.0 with cash")
	eq(_btn(room, &"fix").text, "FIX FAULT", "fix label with no fault")
	ok(not _btn(room, &"fix").enabled, "fix is greyed with no fault")
	eq(_btn(room, &"restore").text, "RESTORE " + CoreFormat.money(GarageCosts.restore_cost(model)), "restore label")
	ok(_btn(room, &"restore").enabled, "restore is on for condition 6.0 with cash")
	ok(_btn(room, &"sell").text.begins_with("SELL "), "sell label starts with SELL")
	eq(_btn(room, &"sell").text, "SELL " + CoreFormat.money(GarageCosts.dealer_price(fake.state, model, car)), "sell price is the dealer price")
	ok(_btn(room, &"sell").enabled, "sell is on for an unconsigned owned car")
	eq(_btn(room, &"consign").text, "CONSIGN", "consign label on a non-auction day")
	ok(_btn(room, &"consign").enabled, "consign is on on a non-auction day")
	ok(_btn(room, &"consign").visible, "consign is shown for an owned car")
	_done(room)


func test_taps_call_game_act() -> void:
	var fake := TestFakeGame.new()
	var room := _room(fake)
	room.enter({})

	TapUtil.tap(_btn(room, &"tinker"))
	eq(fake.acts.back(), {"action": "service_car", "params": {"car_id": "c1", "kind": "quick"}}, "tinker is a quick service")
	TapUtil.tap(_btn(room, &"service"))
	eq(fake.acts.back(), {"action": "service_car", "params": {"car_id": "c1", "kind": "full"}}, "service is a full service")
	TapUtil.tap(_btn(room, &"restore"))
	eq(fake.acts.back(), {"action": "restore_car", "params": {"car_id": "c1"}}, "restore calls restore_car")
	TapUtil.tap(_btn(room, &"sell"))
	eq(fake.acts.back(), {"action": "sell_to_dealer", "params": {"car_id": "c1"}}, "sell of an owned car calls sell_to_dealer")
	_done(room)


func test_greyed_fix_still_calls_game() -> void:
	var fake := TestFakeGame.new()
	var room := _room(fake)
	room.enter({})
	var fix := _btn(room, &"fix")
	ok(not fix.enabled, "fix is greyed for c1")
	TapUtil.tap(fix)
	eq(fake.acts.back(), {"action": "fix_fault", "params": {"car_id": "c1"}}, "a tap on a greyed fix still calls fix_fault")
	_done(room)


func test_refusal_toast_comes_from_game_only() -> void:
	var fake := TestFakeGame.new()
	var room := _room(fake)
	var toasts := _capture_toasts(room)
	room.enter({})
	fake.next_result = {"ok": false, "msg": "Not enough money"}
	TapUtil.tap(_btn(room, &"tinker"))
	eq(fake.toasts, ["Not enough money"], "the Game toasts the refusal")
	eq(toasts.size(), 0, "the room adds no toast of its own for a refusal")
	fake.next_result = {"ok": true, "msg": "Done"}
	_done(room)


func test_low_cash_greys_buttons() -> void:
	var fake := TestFakeGame.new()
	var room := _room(fake)
	room.enter({})
	fake.state["cash"] = 10
	room.refresh()
	ok(not _btn(room, &"tinker").enabled, "tinker is greyed with cash 10")
	ok(not _btn(room, &"service").enabled, "service is greyed with cash 10")
	ok(not _btn(room, &"restore").enabled, "restore is greyed with cash 10")
	TapUtil.tap(_btn(room, &"restore"))
	eq(fake.acts.back(), {"action": "restore_car", "params": {"car_id": "c1"}}, "a greyed restore still calls restore_car")
	_done(room)


func test_rented_car_buttons() -> void:
	var fake := TestFakeGame.new()
	var room := _room(fake)
	var c2: Dictionary = fake.state["cars"][1]
	c2["owned"] = false
	c2["rentMonthly"] = 260
	c2["rentedAtCondition"] = 7.0
	c2["condition"] = 6.0
	room.enter({})
	room.select("c2")
	var model: Dictionary = Data.car_by_id("t1_robbin")
	var fee := GarageCosts.damage_fee(model, c2)
	eq(fee, 90, "damage fee for a 1.0 drop on basePrice 4500")

	var sell := _btn(room, &"sell")
	eq(sell.text, "RETURN " + CoreFormat.money(90), "rented sell says RETURN with the damage fee")
	ok(sell.enabled, "return is on with cash")
	TapUtil.tap(sell)
	eq(fake.acts.back(), {"action": "return_rental", "params": {"car_id": "c2"}}, "RETURN calls return_rental")
	ok(not _btn(room, &"consign").visible, "consign is hidden for a rented car")
	eq(_btn(room, &"fix").text, "FIX FAULT " + CoreFormat.money(80), "fix shows the fault cost")
	ok(_btn(room, &"fix").enabled, "fix is on for the rented car with a fault and cash")
	TapUtil.tap(_btn(room, &"fix"))
	eq(fake.acts.back(), {"action": "fix_fault", "params": {"car_id": "c2"}}, "fix calls fix_fault for c2")
	_done(room)


func test_consign_withdraw_and_auction_day() -> void:
	var fake := TestFakeGame.new()
	var room := _room(fake)
	var toasts := _capture_toasts(room)
	room.enter({})
	var model: Dictionary = Data.car_by_id("t1_allergy")
	var car: Dictionary = fake.state["cars"][0]
	var reserve := GarageCosts.consign_reserve(fake.state, model, car)

	TapUtil.tap(_btn(room, &"consign"))
	eq(fake.acts.back()["action"], "consign_car", "CONSIGN calls consign_car")
	eq(fake.acts.back()["params"], {"car_id": "c1", "reserve": reserve}, "consign passes the 70 percent reserve")
	eq(toasts, ["Consigned. Reserve " + CoreFormat.money(reserve)], "a successful consign toasts the reserve")

	fake.state["auction"]["consigned"].append({"carId": "c1", "reserve": 100})
	room.refresh()
	eq(_btn(room, &"consign").text, "WITHDRAW", "a consigned car offers WITHDRAW")
	ok(_btn(room, &"consign").enabled, "WITHDRAW is on")
	ok(not _btn(room, &"sell").enabled, "SELL is greyed while the car is consigned")
	TapUtil.tap(_btn(room, &"consign"))
	eq(fake.acts.back(), {"action": "unconsign", "params": {"car_id": "c1"}}, "WITHDRAW calls unconsign")

	fake.state["day"] = 24
	fake.state["auction"]["consigned"] = []
	room.refresh()
	ok(CoreClock.is_auction_day(24), "day 24 is an auction day")
	eq(_btn(room, &"consign").text, "CONSIGN", "CONSIGN on an auction day")
	ok(not _btn(room, &"consign").enabled, "CONSIGN is greyed on an auction day")
	var calls := fake.acts.size()
	TapUtil.tap(_btn(room, &"consign"))
	eq(fake.acts.size(), calls, "a tap on the greyed CONSIGN makes no call")
	eq(toasts.back(), "Too late, the auction is today", "the room explains the auction day")
	_done(room)


func test_keys() -> void:
	var fake := TestFakeGame.new()
	var room := _room(fake)
	room.enter({})
	ok(room.handle_key(KEY_S), "KEY_S is handled")
	eq(fake.acts.back(), {"action": "service_car", "params": {"car_id": "c1", "kind": "full"}}, "KEY_S is a full service")
	ok(room.handle_key(KEY_T), "KEY_T is handled")
	eq(fake.acts.back(), {"action": "service_car", "params": {"car_id": "c1", "kind": "quick"}}, "KEY_T is a quick service")
	ok(room.handle_key(KEY_F), "KEY_F is handled")
	eq(fake.acts.back(), {"action": "fix_fault", "params": {"car_id": "c1"}}, "KEY_F calls fix_fault")

	fake.state["cars"] = []
	room.enter({})
	ok(not room.handle_key(KEY_S), "KEY_S is not handled with no car selected")
	_done(room)
