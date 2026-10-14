class_name SimCarStats
extends RefCounted

# Port of src/sim/carstats.js (DESIGN.md 4.3): effective stats, values, running costs and condition changes.
# A model is a catalogue Dictionary (data/cars.json); a car is a stable instance Dictionary with a numeric
# "condition" (0-10). Pure: no node access, no randomness, no dates.


# Effective desirability: condition 10 -> D, condition 0 -> 0.4 * D.
static func eff_d(model: Dictionary, car: Dictionary) -> float:
	return float(model["desirability"]) * (0.40 + 0.06 * float(car["condition"]))


# Effective reliability: condition 10 -> R, condition 0 -> 0.3 * R.
static func eff_r(model: Dictionary, car: Dictionary) -> float:
	return float(model["reliability"]) * (0.30 + 0.07 * float(car["condition"]))


# Maintenance multiplier: condition 10 -> x1.0, condition 0 -> x1.8.
static func maint_mult(car: Dictionary) -> float:
	return 1.0 + (10.0 - float(car["condition"])) * 0.08


# Value factor: condition 10 -> x1.0, condition 0 -> x0.5. Works on any
# Dictionary carrying a "condition" (a stable car or a shop listing).
static func value_factor(car: Dictionary) -> float:
	return 0.50 + 0.05 * float(car["condition"])


# Market value of a car, rounded to the nearest pound.
static func market_value(state: Dictionary, model: Dictionary, car: Dictionary) -> int:
	return SimUtil.jround(float(model["basePrice"]) * value_factor(car) * float(state["market"]["priceMult"]))


# Monthly running cost of an owned car, rounded to the nearest pound.
static func running_cost(model: Dictionary, car: Dictionary) -> int:
	return SimUtil.jround(float(model["maintenance"]) * (60.0 + float(model["basePrice"]) * 0.0025) * maint_mult(car))


# Daily condition loss for an idle car, driven by the model's reliability.
static func idle_decay(model: Dictionary) -> float:
	return 0.01 + (10.0 - float(model["reliability"])) * 0.002


# Apply a condition delta, rounded to 0.01 and clamped to 0-10. Mutates
# the car and returns the new condition.
static func change_condition(car: Dictionary, delta: float) -> float:
	var condition: float = CoreRng.clamp_value(CoreRng.round_to(float(car["condition"]) + delta, 0.01), 0.0, 10.0)
	car["condition"] = condition
	return condition


# A car is available when it has no fault and is not impounded. A missing or null
# impoundedUntil counts as 0.
static func is_available(state: Dictionary, car: Dictionary) -> bool:
	var impounded_until: Variant = car.get("impoundedUntil")
	if impounded_until == null:
		impounded_until = 0
	return car["fault"] == null and impounded_until <= state["day"]
