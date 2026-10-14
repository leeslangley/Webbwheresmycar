class_name BookingsMath
extends RefCounted

# Pure maths for the BOOKINGS channel (port of the car checks in src/ui/scenes/bookings.js and
# src/sim/carstats.js). Static only, no nodes. A model is a catalogue entry, a car is a stable
# instance with a numeric condition (0-10), a req is a booking request.


static func eff_d(model: Dictionary, car: Dictionary) -> float:
	return float(model.desirability) * (0.40 + 0.06 * float(car.condition))


static func eff_r(model: Dictionary, car: Dictionary) -> float:
	return float(model.reliability) * (0.30 + 0.07 * float(car.condition))


# "" when the car can take the job; otherwise the reason it cannot. The TOO reasons only apply
# when a request is given (an empty req means no booking is picked yet).
static func block_reason(st: Dictionary, car: Dictionary, req: Dictionary, model: Dictionary) -> String:
	if car.fault != null:
		return "FAULT"
	if int(car.impoundedUntil) > int(st.day):
		return "IMPOUNDED"
	if model.is_empty():
		return "FAULT"
	if not req.is_empty():
		if eff_d(model, car) < float(req.minDesirability):
			return "TOO PLAIN"
		if eff_r(model, car) < float(req.minReliability):
			return "TOO FLAKY"
		if float(car.condition) < float(req.minCondition):
			return "TOO SCRUFFY"
	return ""


# The cars the player owns whose model is in the catalogue (order kept). Rented cars are not ours
# to send out, and a car with an unknown model cannot be shown.
static func owned_cars(st: Dictionary, models: Dictionary) -> Array:
	var out: Array = []
	for car in st.get("cars", []):
		if car.get("owned", false) == true and models.has(str(car.get("modelId", ""))):
			out.append(car)
	return out


static func days_left(st: Dictionary, req: Dictionary) -> int:
	return int(req.expiresDay) - int(st.day)
