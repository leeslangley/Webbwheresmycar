extends "res://tests/harness.gd"

# Tests for the LEDGER channel: the display maths (tv/ledger_math.gd) and the channel scene
# (tv/ledger_channel.tscn). _ready does not fire under the runner, so the scene tests call it by hand.


func _tiny_models() -> Dictionary:
	return {"m": {"basePrice": 4000, "maintenance": 2}}


func _tiny_state() -> Dictionary:
	return {
		"cash": 1000,
		"market": {"priceMult": 1},
		"reputation": 60,
		"plates": {"fatcat": false, "stable": false, "household": false, "hammer": true},
		"stats": {"jobsDone": 2, "jobsFailed": 1, "adsRun": 3, "carsBought": 1, "carsSold": 0, "bestAuctionSale": 5000, "faults": 1},
		"cars": [
			{"modelId": "m", "owned": true, "condition": 10.0, "rentMonthly": 0},
			{"modelId": "m", "owned": false, "condition": 5.0, "rentMonthly": 200},
			{"modelId": "unknown", "owned": true, "condition": 10.0, "rentMonthly": 0},
		],
	}


func test_math() -> void:
	var models := _tiny_models()
	var st := _tiny_state()
	near(LedgerMath.value_factor(10.0), 1.0, 1e-9, "value factor at condition 10")
	near(LedgerMath.maint_mult(10.0), 1.0, 1e-9, "maint mult at condition 10")
	eq(LedgerMath.market_value(st, models.m, st.cars[0]), 4000, "market value of the owned car")
	eq(LedgerMath.running_cost(models.m, st.cars[0]), 140, "running cost is 2 * (60 + 10) * 1")
	eq(LedgerMath.stable_value(st, models), 4000, "stable value skips rented cars and unknown models")
	eq(LedgerMath.net_worth(st, models), 5000, "net worth is cash plus stable value")
	eq(LedgerMath.expected_bills(st, models), 740, "bills are 400 + 140 + 200")
	eq(LedgerMath.owned_count(st), 2, "owned count")


func test_plate_progress() -> void:
	var models := _tiny_models()
	var st := _tiny_state()
	eq(LedgerMath.plate_progress(st, "stable", models), "2/6 cars", "stable progress")
	eq(LedgerMath.plate_progress(st, "household", models), "60/85", "household progress")
	eq(LedgerMath.plate_progress(st, "fatcat", models), CoreFormat.money(5000) + "/" + CoreFormat.money(100000), "fat cat progress")
	eq(LedgerMath.plate_progress(st, "hammer", models), "WON", "hammer is won")
	st.plates.hammer = false
	eq(LedgerMath.plate_progress(st, "hammer", models), "best " + CoreFormat.money(5000) + "/" + CoreFormat.money(100000), "hammer progress when not won")


func test_stat_lines() -> void:
	var st := _tiny_state()
	eq(LedgerMath.stat_lines(st), [
		"Jobs done 2 / failed 1",
		"Adverts run 3",
		"Cars bought 1 / sold 0",
		"Best sale " + CoreFormat.money(5000) + "  Faults 1",
	], "four stat lines")


func test_sample_state_with_real_data() -> void:
	var st := TestFakeGame.sample_state()
	var models := ChannelBase.models_by_id()
	var c1: Dictionary = st.cars[0]
	var c2: Dictionary = st.cars[1]
	var expect: int = 12345 + LedgerMath.market_value(st, ChannelBase.model_of(c1.modelId), c1) + LedgerMath.market_value(st, ChannelBase.model_of(c2.modelId), c2)
	eq(LedgerMath.net_worth(st, models), expect, "net worth of the sample state")
	ok(LedgerMath.net_worth(st, models) > 12345, "net worth is above the cash")


func test_enter() -> void:
	UiCashHistory.reset()
	var ch := (load("res://tv/ledger_channel.tscn") as PackedScene).instantiate() as LedgerChannel
	tree().root.add_child(ch)
	if ch.Chart == null:
		ch.call("_ready")
	var g := TestFakeGame.new()
	ch.enter(g)
	eq(ch.title, "LEDGER", "channel title")
	ok(ch.Chart != null, "the sales chart exists")
	ok(ch.Chart.values.size() >= 1, "the chart has at least one value after enter")
	UiCashHistory.record(13, 20000.0)
	g.changed.emit()
	eq(ch.Chart.values.size(), 2, "the chart has two values after a new day is recorded")
	UiCashHistory.reset()
	ch.leave()
	ch.free()
