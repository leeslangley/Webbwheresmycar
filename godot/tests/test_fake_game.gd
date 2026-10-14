extends "res://tests/harness.gd"


func test_sample_state() -> void:
	var g := TestFakeGame.new()
	eq(g.state.cash, 12345, "cash")
	eq(g.state.day, 12, "day")
	eq(g.state.cars.size(), 2, "two cars")
	eq(g.state.cars[1].fault.label, "Flat tyre", "c2 fault label")
	eq(g.state.cars[0].fault, null, "c1 has no fault")
	eq(g.state.shop.listings.size(), 3, "three shop listings")
	eq(g.state.shop.listings[1].mode, "rent", "L2 is a rental")
	eq(g.state.requests.size(), 2, "two requests")
	eq(g.state.today.monthReport, null, "no month report yet")
	eq(g.state.plates.fatcat, false, "fatcat plate not won")
	for id in ["t1_allergy", "t1_robbin", "t1_chimp", "t1_maurice", "t1_cooker"]:
		ok(Data.car_by_id(id) != {}, "car model exists: " + id)
	ok(Data.job_type_by_id("wedding") != {}, "job type wedding exists")


func test_act_records() -> void:
	var g := TestFakeGame.new()
	var changes: Array = [0]
	g.changed.connect(func() -> void: changes[0] += 1)
	var r: Dictionary = g.act("buy_car", {"listing_id": "L1"})
	eq(r, {"ok": true, "msg": "Done"}, "act returns the result")
	eq(g.acts, [{"action": "buy_car", "params": {"listing_id": "L1"}}], "act is recorded")
	eq(changes[0], 1, "changed emitted once on success")


func test_act_failure() -> void:
	var g := TestFakeGame.new()
	var changes: Array = [0]
	g.changed.connect(func() -> void: changes[0] += 1)
	g.next_result = {"ok": false, "msg": "No way"}
	var r: Dictionary = g.act("x")
	eq(r, {"ok": false, "msg": "No way"}, "act returns the failure")
	eq(g.toasts, ["No way"], "failure message becomes a toast")
	eq(changes[0], 0, "changed not emitted on failure")


func test_independent() -> void:
	var a := TestFakeGame.new()
	var b := TestFakeGame.new()
	a.state.cash = 1
	eq(a.state.cash, 1, "first instance changed")
	eq(b.state.cash, 12345, "second instance untouched")
