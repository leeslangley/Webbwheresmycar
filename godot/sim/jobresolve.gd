class_name SimJobResolve
extends RefCounted

# Port of src/sim/jobresolve.js (DESIGN.md sections 4.6 and 4.7): accepting a customer booking and resolving
# the job at once. A refusal changes nothing and costs no day; an acceptance pays out, marks the car up or
# down, and costs exactly one day (advance_day as the very last step). Pure: randomness only through
# state.rng (CoreRng), no node access, no dates.

# Outcome odds for the customer event roll (DESIGN.md section 4.7).
const DISASTER_P := 0.007
const MISHAP_P := 0.057


# Find a booking request by id, or null.
static func _find_request(state: Dictionary, request_id: Variant) -> Variant:
	for req in state["requests"]:
		if req["id"] == request_id:
			return req
	return null


# Find a car in the stable by id, or null.
static func _find_car(state: Dictionary, car_id: Variant) -> Variant:
	for car in state["cars"]:
		if car["id"] == car_id:
			return car
	return null


# Remove one request by id. Returns true if it was on the board.
static func _remove_request(state: Dictionary, request_id: Variant) -> bool:
	for i in range(state["requests"].size()):
		if state["requests"][i]["id"] == request_id:
			state["requests"].remove_at(i)
			return true
	return false


# Reputation stays clamped to 0-100 (DESIGN.md section 4.12).
static func _bump_reputation(state: Dictionary, delta: int) -> void:
	state["reputation"] = CoreRng.clamp_value(float(state["reputation"]) + float(delta), 0.0, 100.0)


# accept_job(state, request_id, car_id) -> {ok, msg, outcome}. Refusals return {ok: false, msg} with the state
# untouched. A real job resolves immediately: outcome is {type, paid, wear, faultLabel}, where `paid` is the net
# cash the job itself brought in (negative when the customer demands money back).
static func accept_job(state: Dictionary, request_id: Variant, car_id: Variant) -> Dictionary:
	var req: Variant = _find_request(state, request_id)
	if req == null:
		return {"ok": false, "msg": "No such booking"}
	var car: Variant = _find_car(state, car_id)
	if car == null:
		return {"ok": false, "msg": "No such car in the garage"}
	if req["expiresDay"] < state["day"]:
		return {"ok": false, "msg": "That booking has expired"}
	if not SimCarStats.is_available(state, car):
		return {"ok": false, "msg": "That car is not fit to go out"}
	var model: Dictionary = SimData.model_of(car["modelId"])
	var car_d: float = SimCarStats.eff_d(model, car)
	var car_r: float = SimCarStats.eff_r(model, car)
	if car_d < float(req["minDesirability"]):
		return {"ok": false, "msg": "The " + str(model["name"]) + " is not desirable enough for this booking (needs " + SimUtil.num_str(float(req["minDesirability"])) + ")."}
	if car_r < float(req["minReliability"]):
		return {"ok": false, "msg": "The " + str(model["name"]) + " is not reliable enough for this booking (needs " + SimUtil.num_str(float(req["minReliability"])) + ")."}
	if car["condition"] < req["minCondition"]:
		return {"ok": false, "msg": "The " + str(model["name"]) + " is in too poor condition for this booking (needs " + SimUtil.num_str(float(req["minCondition"])) + ")."}

	var job: Dictionary = SimData.job_type_of(req["jobTypeId"])
	var customer: String = str(req["customer"])
	var fee: int = int(req["fee"])

	# Resolution order (DESIGN.md section 4.7): the fault roll first, then the customer event roll; a major
	# fault mid-job turns any result into a breakdown.
	var fault: Variant = SimFaultSim.roll_fault(state, model, car, 1.0)
	var roll: float = CoreRng.rand(state)
	var type: String
	if roll < DISASTER_P:
		type = "disaster"
	elif roll < MISHAP_P:
		type = "mishap"
	else:
		type = "success"
	if fault != null and fault["severity"] == "major":
		type = "breakdown"

	# Wear, one decimal, from the job type's range.
	var wear: float = CoreRng.round_to(float(job["wearMin"]) + CoreRng.rand(state) * (float(job["wearMax"]) - float(job["wearMin"])), 0.1)

	var paid: int = 0
	var fault_label: Variant = fault["label"] if fault != null else null
	var text: String = ""

	if type == "success":
		paid = fee
		state["cash"] = int(state["cash"]) + fee
		_bump_reputation(state, 3 if car_d >= float(req["minDesirability"]) + 2.0 else 2)
		SimCarStats.change_condition(car, -wear)
		car["jobsDone"] = int(car["jobsDone"]) + 1
		state["stats"]["jobsDone"] = int(state["stats"]["jobsDone"]) + 1
		text = SimData.fill_text(str(CoreRng.pick(state, job["success"])), {"customer": customer, "car": str(model["name"])})
		if fault != null and (fault["severity"] == "minor" or fault["severity"] == "medium"):
			SimFaultSim.apply_fault(car, fault)
			text += " (Then the " + str(fault["label"]) + " started.)"
	elif type == "mishap":
		paid = SimUtil.jround(float(fee) * 0.6)
		state["cash"] = int(state["cash"]) + paid
		_bump_reputation(state, -1)
		SimCarStats.change_condition(car, -wear * 2.0)
		car["jobsDone"] = int(car["jobsDone"]) + 1
		state["stats"]["jobsDone"] = int(state["stats"]["jobsDone"]) + 1
		text = SimData.fill_text(str(CoreRng.pick(state, job["mishap"])), {"customer": customer, "car": str(model["name"])})
		if fault != null and (fault["severity"] == "minor" or fault["severity"] == "medium"):
			SimFaultSim.apply_fault(car, fault)
	elif type == "breakdown":
		paid = SimUtil.jround(float(fee) * 0.25)
		state["cash"] = int(state["cash"]) + paid
		_bump_reputation(state, -4)
		SimFaultSim.apply_fault(car, fault)
		state["stats"]["jobsFailed"] = int(state["stats"]["jobsFailed"]) + 1
		state["stats"]["faults"] = int(state["stats"]["faults"]) + 1
		state["sit"].append("breakdown")
		text = str(model["name"]) + " broke down: " + str(fault["label"]) + ". " + customer + " is not impressed."
	else:
		# Disaster: no fee, four lots of wear, and one of three ruins (see _apply_disaster).
		var d: Dictionary = _apply_disaster(state, req, car, model, job, fee, wear)
		paid = int(d["paid"])
		fault_label = d["faultLabel"]
		text = str(d["text"])

	# A fat fee on a success or mishap is front-page news (DESIGN.md 9.4).
	if (type == "success" or type == "mishap") and fee >= 2000:
		state["sit"].append("bigwin")

	_remove_request(state, request_id)
	state["pending"].append(text)
	SimAdvance.advance_day(state)
	return {"ok": true, "msg": text, "outcome": {"type": type, "paid": paid, "wear": wear, "faultLabel": fault_label}}


# Disaster branch (DESIGN.md 4.7, JS acceptJob disaster else-branch). Four lots of wear, reputation -6,
# one failed job, then one of three flavours: 1 = truck (a major fault), 2 = compensation (cash back out),
# 3 = police (impounded for three days). Returns {paid, faultLabel, text}.
static func _apply_disaster(state: Dictionary, req: Dictionary, car: Dictionary, model: Dictionary, job: Dictionary, fee: int, wear: float) -> Dictionary:
	SimCarStats.change_condition(car, -wear * 4.0)
	_bump_reputation(state, -6)
	state["stats"]["jobsFailed"] = int(state["stats"]["jobsFailed"]) + 1
	state["sit"].append("breakdown")
	var customer: String = str(req["customer"])
	var model_name: String = str(model["name"])
	var flavour: int = CoreRng.rand_int(state, 1, 3)
	var paid: int = 0
	var fault_label: Variant = null
	var text: String = ""
	if flavour == 1:
		var major: Dictionary = CoreRng.pick(state, SimData.faults_of_severity("major"))
		var major_fault := {
			"faultId": major["id"],
			"label": major["label"],
			"cost": int(CoreRng.round_to(float(major["baseCost"]) * SimData.tier_mult(model["tier"]), 10.0)),
			"severity": "major",
		}
		SimFaultSim.apply_fault(car, major_fault)
		fault_label = major_fault["label"]
		text = SimData.fill_text(str(CoreRng.pick(state, job["disaster"])), {"customer": customer, "car": model_name}) + " The " + model_name + " went home on the back of a truck: " + str(major_fault["label"]) + "."
	elif flavour == 2:
		var compensation: int = SimUtil.jround(float(fee) * 0.5)
		state["cash"] = int(state["cash"]) - compensation
		paid = -compensation
		text = SimData.fill_text(str(CoreRng.pick(state, job["disaster"])), {"customer": customer, "car": model_name}) + " " + customer + " demanded " + CoreFormat.money(float(compensation)) + " in compensation before the kettle boiled."
	else:
		car["impoundedUntil"] = int(state["day"]) + 3
		text = SimData.fill_text(str(CoreRng.pick(state, job["disaster"])), {"customer": customer, "car": model_name}) + " The police impounded the " + model_name + " for three days."
	return {"paid": paid, "faultLabel": fault_label, "text": text}
