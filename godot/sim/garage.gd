class_name SimGarage
extends RefCounted

# Port of src/sim/garage.js (DESIGN.md sections 4.5, 9.3): quick tinker, full service, fix a fault and full
# restoration. Each action costs money and one day: on failure nothing changes and no day passes; on success the
# message goes into state.pending and SimAdvance.advance_day runs last, so the night's decay, bills and phone
# calls follow the work. Pure: no node access, no randomness, no dates.


# Find a stable car by id, or null if there is no such car.
static func _find_car(state: Dictionary, car_id: String) -> Variant:
	for car in state["cars"]:
		if car["id"] == car_id:
			return car
	return null


# The success ending: note it in the tray, then let the day pass.
static func _finish(state: Dictionary, msg: String) -> Dictionary:
	state["pending"].append(msg)
	SimAdvance.advance_day(state)
	return {"ok": true, "msg": msg}


# service_car(state, car_id, kind): kind is "quick" (+1.0 condition) or "full" (+2.5 and lastServiceDay).
# Neither touches a fault.
static func service_car(state: Dictionary, car_id: String, kind: String) -> Dictionary:
	var car: Variant = _find_car(state, car_id)
	if car == null:
		return {"ok": false, "msg": "No such car"}
	if kind != "quick" and kind != "full":
		return {"ok": false, "msg": "No such treatment"}
	var quick: bool = kind == "quick"
	var model: Dictionary = SimData.model_of(car["modelId"])
	var base_price: float = float(model["basePrice"])
	var cost: int = SimUtil.jround(40.0 + base_price * 0.002) if quick else SimUtil.jround(150.0 + base_price * 0.008)
	if float(car["condition"]) >= 10.0:
		return {"ok": false, "msg": "Already perfect"}
	if state["cash"] < cost:
		return {"ok": false, "msg": "Not enough money"}
	state["cash"] -= cost
	var before: float = float(car["condition"])
	var after: float = SimCarStats.change_condition(car, 1.0 if quick else 2.5)
	var msg: String
	if quick:
		msg = "Quick tinker on the " + str(model["name"]) + ": condition " + CoreFormat.one_dp(before) \
			+ " -> " + CoreFormat.one_dp(after) + ". Cost " + CoreFormat.money(cost) + "."
	else:
		car["lastServiceDay"] = state["day"]
		msg = "Full service on the " + str(model["name"]) + ": condition " + CoreFormat.one_dp(before) \
			+ " -> " + CoreFormat.one_dp(after) + ". Cost " + CoreFormat.money(cost) + "."
	return _finish(state, msg)


# fix_fault(state, car_id): pay the fault's own cost to clear it, plus a little condition for the car's dignity.
static func fix_fault(state: Dictionary, car_id: String) -> Dictionary:
	var car: Variant = _find_car(state, car_id)
	if car == null:
		return {"ok": false, "msg": "No such car"}
	if car["fault"] == null:
		return {"ok": false, "msg": "Nothing to fix"}
	var fault: Dictionary = car["fault"]
	var cost: int = int(fault["cost"])
	if state["cash"] < cost:
		return {"ok": false, "msg": "Not enough money"}
	state["cash"] -= cost
	var label: String = str(fault["label"])
	var model: Dictionary = SimData.model_of(car["modelId"])
	car["fault"] = null
	var after: float = SimCarStats.change_condition(car, 0.5)
	var msg: String = "Fixed the " + label + " on the " + str(model["name"]) \
		+ " for " + CoreFormat.money(cost) + ". Condition now " + CoreFormat.one_dp(after) + "."
	return _finish(state, msg)


# restore_car(state, car_id): a bare-shell nut-and-bolt job. Condition back to 10, fault gone, service book signed today.
static func restore_car(state: Dictionary, car_id: String) -> Dictionary:
	var car: Variant = _find_car(state, car_id)
	if car == null:
		return {"ok": false, "msg": "No such car"}
	var model: Dictionary = SimData.model_of(car["modelId"])
	var cost: int = maxi(1200, SimUtil.jround(float(model["basePrice"]) * 0.06))
	if float(car["condition"]) >= 10.0 and car["fault"] == null:
		return {"ok": false, "msg": "Already perfect"}
	if state["cash"] < cost:
		return {"ok": false, "msg": "Not enough money"}
	state["cash"] -= cost
	car["fault"] = null
	var after: float = SimCarStats.change_condition(car, 10.0 - float(car["condition"]))
	car["lastServiceDay"] = state["day"]
	var msg: String = "Full restoration of the " + str(model["name"]) + ": good as new, " \
		+ CoreFormat.one_dp(after) + " condition. Cost " + CoreFormat.money(cost) + "."
	return _finish(state, msg)
