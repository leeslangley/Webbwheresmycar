class_name SimFaultSim
extends RefCounted

# Port of src/sim/faultsim.js (DESIGN.md 4.6): the fault roll and applying a fault to a car.
# roll_fault does NOT modify the car; the caller applies the result with apply_fault.
# Pure apart from the seeded rng in state.


# Roll for a fault. mult scales the chance (month-end uses 0.5). Returns null when no fault, else
# {faultId, label, cost, severity}.
static func roll_fault(state: Dictionary, model: Dictionary, car: Dictionary, mult: float = 1.0) -> Variant:
	var p: float = CoreRng.clamp_value(0.02 + (1.0 - SimCarStats.eff_r(model, car) / 10.0) * 0.35, 0.02, 0.60) * mult
	if not CoreRng.chance(state, p):
		return null
	var c: float = float(car["condition"])
	var severity: String = CoreRng.weighted(state, [
		{"w": maxf(20.0, 70.0 - (10.0 - c) * 5.0), "s": "minor"},
		{"w": 25.0 + (10.0 - c) * 2.0, "s": "medium"},
		{"w": 5.0 + (10.0 - c) * 3.0, "s": "major"},
	])["s"]
	var fault = CoreRng.pick(state, SimData.faults_of_severity(severity))
	var cost: int = int(CoreRng.round_to(float(fault["baseCost"]) * SimData.tier_mult(model["tier"]), 10.0))
	return {"faultId": fault["id"], "label": fault["label"], "cost": cost, "severity": severity}


# Attach a rolled fault to a car. Copies the fields into a fresh object so the car never shares
# an object with the fault table or the roll result.
static func apply_fault(car: Dictionary, fault: Dictionary) -> Dictionary:
	car["fault"] = {"faultId": fault["faultId"], "label": fault["label"], "cost": fault["cost"]}
	return car
