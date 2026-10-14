extends "res://tests/harness.gd"


func test_tinker_service_restore() -> void:
	eq(GarageCosts.tinker_cost({"basePrice": 3500}), 47, "tinker 3500")
	eq(GarageCosts.service_cost({"basePrice": 3500}), 178, "service 3500")
	eq(GarageCosts.restore_cost({"basePrice": 3500}), 1200, "restore 3500 hits the floor")
	eq(GarageCosts.tinker_cost({"basePrice": 45000}), 130, "tinker 45000")
	eq(GarageCosts.service_cost({"basePrice": 45000}), 510, "service 45000")
	eq(GarageCosts.restore_cost({"basePrice": 45000}), 2700, "restore 45000")
	eq(GarageCosts.tinker_cost({"basePrice": 4500}), 49, "tinker 4500")
	eq(GarageCosts.service_cost({"basePrice": 4500}), 186, "service 4500")


func test_damage_fee() -> void:
	var model := {"basePrice": 4500}
	eq(GarageCosts.damage_fee(model, {"rentedAtCondition": 7.0, "condition": 6.0}), 90, "one point lost")
	eq(GarageCosts.damage_fee(model, {"rentedAtCondition": 7.0, "condition": 6.5}), 45, "half a point lost")
	eq(GarageCosts.damage_fee(model, {"rentedAtCondition": 7.0, "condition": 8.0}), 0, "condition went up: no fee")
	eq(GarageCosts.damage_fee(model, {"rentedAtCondition": null, "condition": 6.0}), 0, "null rentedAtCondition: no fee")


func test_is_consigned() -> void:
	var state := {"auction": {"consigned": [{"carId": "c1", "reserve": 100}]}}
	ok(GarageCosts.is_consigned(state, "c1"), "c1 is consigned")
	ok(not GarageCosts.is_consigned(state, "c2"), "c2 is not consigned")
	ok(not GarageCosts.is_consigned({"auction": {"consigned": []}}, "c1"), "empty consigned list")


func test_model_of() -> void:
	eq(GarageCosts.model_of("t1_allergy").name, "Austen Allergy", "model name")
	ok(GarageCosts.model_of("nope").is_empty(), "unknown model id gives an empty dictionary")


func test_dealer_and_reserve_on_sample_state() -> void:
	var state := TestFakeGame.sample_state()
	var model := GarageCosts.model_of("t1_allergy")
	var car: Dictionary = state.cars[0]
	eq(GarageCosts.dealer_price(state, model, car), CoreRng.round_to(float(SimCarStats.market_value(state, model, car)) * 0.6, 10.0), "dealer price")
	eq(GarageCosts.consign_reserve(state, model, car), CoreRng.round_to(float(SimCarStats.market_value(state, model, car)) * 0.7, 10.0), "consign reserve")
	eq(GarageCosts.dealer_price(state, model, car), 1680.0, "dealer price for sample car c1")
	eq(GarageCosts.consign_reserve(state, model, car), 1960.0, "consign reserve for sample car c1")
	ok(GarageCosts.dealer_price(state, model, car) < GarageCosts.consign_reserve(state, model, car), "dealer pays less than the reserve")
