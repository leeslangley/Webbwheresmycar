class_name SimAuction
extends RefCounted

# Port of src/sim/auction.js (DESIGN.md 4.10), first third: lot generation, the safe lot view, paid stat
# reveals, consigning and unconsigning. Bidding (GDS10) and attend_auction (GDS13) are appended later.
# Pure: randomness only through CoreRng on state.rng, no node access, no dates.

# Cost of one paid stat reveal, and the stats it can uncover.
const AUCTION_REVEAL_COST := 150

const STATS := ["desirability", "maintenance", "reliability", "condition"]


# Lot ids are 'A' plus the running id, like shop listings use 'L'. Null when not found.
static func _find_lot(state: Dictionary, lot_id: Variant) -> Variant:
	var lots: Array = state["auction"]["lots"]
	for lot in lots:
		if lot["lotId"] == lot_id:
			return lot
	return null


# Find a stable car by its id, or null.
static func _find_car(state: Dictionary, car_id: Variant) -> Variant:
	for car in state["cars"]:
		if car["id"] == car_id:
			return car
	return null


# Take a car out of the stable. Returns true if it was there.
static func _remove_car(state: Dictionary, car_id: Variant) -> bool:
	var cars: Array = state["cars"]
	for i in range(cars.size()):
		if cars[i]["id"] == car_id:
			cars.remove_at(i)
			return true
	return false


# Build one auction lot, drawing in order: tier, model, condition, then the three bidder ceilings.
# No two lots in a month share a model (exclude_model_ids is shared by the caller and grows).
static func _make_lot(state: Dictionary, exclude_model_ids: Array) -> Dictionary:
	var tier_pick: Dictionary = CoreRng.weighted(state, [
		{"tier": 1, "w": 40},
		{"tier": 2, "w": 40},
		{"tier": 3, "w": 20},
	])
	var tier: int = int(tier_pick["tier"])
	var tier_models: Array = []
	for car in SimData.cars():
		if int(car["tier"]) == tier and exclude_model_ids.find(car["id"]) == -1:
			tier_models.append(car)
	var model: Dictionary = CoreRng.pick(state, tier_models)
	var condition: float = CoreRng.round_to(2.0 + 7.0 * CoreRng.rand(state), 0.1)
	var value: int = SimCarStats.market_value(state, model, {"condition": condition})
	var ceilings: Array = []
	for i in range(3):
		ceilings.append(SimUtil.jround(float(value) * (0.70 + 0.50 * CoreRng.rand(state))))
	exclude_model_ids.append(model["id"])
	var lot_id := "A" + str(state["nextId"])
	state["nextId"] = int(state["nextId"]) + 1
	return {
		"lotId": lot_id,
		"modelId": model["id"],
		"condition": condition,
		"reserve": int(CoreRng.round_to(float(value) * 0.7, 10)),
		"revealCount": 0,
		"revealed": {"desirability": false, "maintenance": false, "reliability": false, "condition": false},
		"currentBid": 0,
		"leader": "house",
		"ceilings": ceilings,
	}


# Prepare the auction for the coming auction day. Keeps any consigned cars; replaces lots and results.
# Mutates state, returns nothing.
static func prepare_auction(state: Dictionary) -> void:
	state["auction"]["month"] = CoreClock.date_of(state["day"])["month"]
	state["auction"]["lastResults"] = []
	var lots: Array = []
	var exclude_model_ids: Array = []
	for i in range(6):
		lots.append(_make_lot(state, exclude_model_ids))
	state["auction"]["lots"] = lots


# The safe, player-facing view of a lot: model details and an estimate based on a notional condition 5.0,
# plus only the stats already paid for. Never exposes ceilings, and condition only once revealed.
# Null for an unknown lot.
static func lot_view(state: Dictionary, lot_id: Variant) -> Variant:
	var lot: Variant = _find_lot(state, lot_id)
	if lot == null:
		return null
	var model: Dictionary = SimData.model_of(str(lot["modelId"]))
	var est: int = SimCarStats.market_value(state, model, {"condition": 5.0})
	var revealed: Dictionary = lot["revealed"]
	var values: Dictionary = {}
	if revealed["desirability"]:
		values["desirability"] = model["desirability"]
	if revealed["maintenance"]:
		values["maintenance"] = model["maintenance"]
	if revealed["reliability"]:
		values["reliability"] = model["reliability"]
	if revealed["condition"]:
		values["condition"] = lot["condition"]
	return {
		"lotId": lot["lotId"],
		"modelId": lot["modelId"],
		"name": model["name"],
		"year": model["year"],
		"archetype": model["archetype"],
		"estLow": int(CoreRng.round_to(float(est) * 0.65, 10)),
		"estHigh": int(CoreRng.round_to(float(est) * 1.35, 10)),
		"revealed": {
			"desirability": revealed["desirability"],
			"maintenance": revealed["maintenance"],
			"reliability": revealed["reliability"],
			"condition": revealed["condition"],
		},
		"values": values,
		"reserve": lot["reserve"],
		"currentBid": lot["currentBid"],
		"leader": lot["leader"],
		"revealCount": lot["revealCount"],
	}


# Pay to reveal one hidden stat of a lot. Costs no day; at most two reveals per lot.
# Returns {ok, msg}; on ok false nothing changes.
static func reveal_stat(state: Dictionary, lot_id: Variant, stat: Variant) -> Dictionary:
	var lot: Variant = _find_lot(state, lot_id)
	if lot == null:
		return {"ok": false, "msg": "No such lot."}
	if STATS.find(stat) == -1:
		return {"ok": false, "msg": "That is not a stat you can reveal."}
	var revealed: Dictionary = lot["revealed"]
	if revealed[stat]:
		return {"ok": false, "msg": "Already revealed that one."}
	if int(lot["revealCount"]) >= 2:
		return {"ok": false, "msg": "Max 2 reveals per lot."}
	if int(state["cash"]) < AUCTION_REVEAL_COST:
		return {"ok": false, "msg": "Not enough cash for a peek."}
	state["cash"] = int(state["cash"]) - AUCTION_REVEAL_COST
	revealed[stat] = true
	lot["revealCount"] = int(lot["revealCount"]) + 1
	return {"ok": true, "msg": "Stat revealed."}


# A reserve must be a number that is finite, whole and not negative (ints and whole floats pass).
static func _is_whole_amount(v: Variant) -> bool:
	if typeof(v) != TYPE_INT and typeof(v) != TYPE_FLOAT:
		return false
	var f: float = float(v)
	if not is_finite(f):
		return false
	return f == floor(f) and f >= 0.0


# consign_car(state, car_id, reserve): put one of your own cars into the coming auction. Costs no day, and
# must happen before auction day.
static func consign_car(state: Dictionary, car_id: Variant, reserve: Variant) -> Dictionary:
	if CoreClock.is_auction_day(state["day"]):
		return {"ok": false, "msg": "Too late: it is auction day."}
	var car: Variant = _find_car(state, car_id)
	if car == null:
		return {"ok": false, "msg": "No such car in the garage."}
	if not bool(car.get("owned")):
		return {"ok": false, "msg": "You cannot consign a car you only rent."}
	for entry in state["auction"]["consigned"]:
		if entry["carId"] == car_id:
			return {"ok": false, "msg": "That car is already consigned."}
	if not _is_whole_amount(reserve):
		return {"ok": false, "msg": "The reserve must be a whole amount of " + CoreFormat.money(0) + " or more."}
	state["auction"]["consigned"].append({"carId": car_id, "reserve": int(reserve)})
	var model: Dictionary = SimData.model_of(str(car["modelId"]))
	return {"ok": true, "msg": "Consigned the " + str(model["name"]) + " with a reserve of " + CoreFormat.money(float(reserve)) + "."}


# unconsign(state, car_id): take a consigned car back out. Costs no day.
static func unconsign(state: Dictionary, car_id: Variant) -> Dictionary:
	var consigned: Array = state["auction"]["consigned"]
	for i in range(consigned.size()):
		if consigned[i]["carId"] == car_id:
			consigned.remove_at(i)
			return {"ok": true, "msg": "The car is out of the auction."}
	return {"ok": false, "msg": "That car is not consigned."}
