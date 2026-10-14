class_name SimJobResolve
extends RefCounted

# Port of src/sim/jobresolve.js (DESIGN.md sections 4.6 and 4.7): accepting a customer booking and resolving
# the job at once. A refusal changes nothing and costs no day; an acceptance pays out, marks the car up or
# down, and costs exactly one day (advance_day as the very last step). Pure: randomness only through
# state.rng (CoreRng), no node access, no dates.
# The disaster branch is a stub here; it is finished by card GDS16.

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
		# Disaster: stub until GDS16 ports the branch (no fee, four lots of wear, one of three ruins).
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


# Disaster branch (DESIGN.md 4.7). STUB: finished by card GDS16. Returns {paid, faultLabel, text}.
static func _apply_disaster(state: Dictionary, req: Dictionary, car: Dictionary, model: Dictionary, job: Dictionary, fee: int, wear: float) -> Dictionary:
	push_error("disaster branch not ported yet (card GDS16)")
	return {"paid": 0, "faultLabel": null, "text": ""}
