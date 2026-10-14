class_name SimBot
extends RefCounted

# Scripted bot for the Godot parity years (GDS22): a port of chooseAction in tools/godot/golden_bot.mjs (GDS21).
# choose() picks one action by priority; play() runs bot calls through Game.act. Params use the GODOT keys
# (snake_case: listing_id, car_id, request_id), as Game.act takes them. No node access beyond the Game it is given.


# [action, params] for the next bot call, or [] once the year is over (JS null).
static func choose(state: Dictionary) -> Array:
	if state["flags"].get("gameOver") == true:
		return []

	# (2) auction day: settle the whole visit in one action.
	if CoreClock.is_auction_day(state["day"]):
		return ["attend_auction", {}]

	# (3) no cars at all: buy the cheapest sale listing we can afford.
	if state["cars"].is_empty():
		var best: Variant = null
		for l in state["shop"]["listings"]:
			if l["mode"] == "sale" and l["price"] <= state["cash"] and (best == null or l["price"] < best["price"]):
				best = l
		if best == null:
			return ["wait_day", {}]
		return ["buy_car", {"listing_id": best["listingId"]}]

	# (4) a faulty car we can afford to fix: fix it.
	for car in state["cars"]:
		if car.get("fault") != null and state["cash"] >= car["fault"]["cost"]:
			return ["fix_fault", {"car_id": car["id"]}]

	# (5) the highest-fee open booking some available car can legally take.
	var best_req: Variant = null
	var best_car: Variant = null
	for req in state["requests"]:
		if req["expiresDay"] < state["day"]:
			continue
		for car in state["cars"]:
			if not SimCarStats.is_available(state, car):
				continue
			var model: Dictionary = SimData.model_of(car["modelId"])
			if SimCarStats.eff_d(model, car) >= req["minDesirability"] and SimCarStats.eff_r(model, car) >= req["minReliability"] and car["condition"] >= req["minCondition"]:
				if best_req == null or req["fee"] > best_req["fee"]:
					best_req = req
					best_car = car
				break
	if best_req != null:
		return ["accept_job", {"request_id": best_req["id"], "car_id": best_car["id"]}]

	# (6) money to burn and no hype: take out a magazine ad.
	if state["cash"] > 6000 and state["buzz"] < 20:
		return ["advertise", {"media_id": "magazine"}]

	# (7) a shabby car and the cash for a full service.
	for car in state["cars"]:
		if car["condition"] < 4 and state["cash"] > 400:
			return ["service_car", {"car_id": car["id"], "kind": "full"}]

	# (8) nothing worth doing: the kettle goes on.
	return ["wait_day", {}]


# Runs up to max_calls bot calls on the Game g (a refused action is followed by wait_day, as in runBot).
# Returns the number of bot calls made.
static func play(g, max_calls: int = 400) -> int:
	var calls := 0
	while calls < max_calls:
		var d: Array = choose(g.state)
		if d.is_empty():
			break
		var r: Variant = g.act(d[0], d[1])
		if typeof(r) != TYPE_DICTIONARY or r.get("ok") != true:
			g.act("wait_day", {})
		calls += 1
	return calls
