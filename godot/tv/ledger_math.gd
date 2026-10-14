class_name LedgerMath
extends RefCounted

# Display maths for the LEDGER channel: copies of the JS formulas (src/sim/carstats.js, src/sim/endgame.js,
# src/ui/scenes/ledger.js). Figures only; the real rules stay in the sim. Pure static helpers, no nodes.

const PLATE_KEYS: Array[String] = ["fatcat", "stable", "household", "hammer"]
const PLATE_NAMES := {"fatcat": "Fat Cat", "stable": "Stable Boy", "household": "Household Name", "hammer": "Hammer Time"}
const LEASE := 400


static func value_factor(condition: float) -> float:
	return 0.5 + 0.05 * condition


static func maint_mult(condition: float) -> float:
	return 1.0 + (10.0 - condition) * 0.08


static func market_value(st: Dictionary, model: Dictionary, car: Dictionary) -> int:
	return int(floor(float(model.basePrice) * value_factor(float(car.condition)) * float(st.market.priceMult) + 0.5))


static func running_cost(model: Dictionary, car: Dictionary) -> int:
	return int(floor(float(model.maintenance) * (60.0 + float(model.basePrice) * 0.0025) * maint_mult(float(car.condition)) + 0.5))


# Market value of every owned car whose model is known (rented cars and unknown models count 0).
static func stable_value(st: Dictionary, models: Dictionary) -> int:
	var total := 0
	for car in st.get("cars", []):
		if car.get("owned") != true:
			continue
		var mid := str(car.get("modelId", ""))
		if models.has(mid):
			total += market_value(st, models[mid], car)
	return total


static func net_worth(st: Dictionary, models: Dictionary) -> int:
	return int(floor(float(st.cash) + 0.5)) + stable_value(st, models)


# Flat garage lease, running costs of owned cars with a known model, and the rent of rented cars.
static func expected_bills(st: Dictionary, models: Dictionary) -> int:
	var total := LEASE
	for car in st.get("cars", []):
		if car.get("owned") == true:
			var mid := str(car.get("modelId", ""))
			if models.has(mid):
				total += running_cost(models[mid], car)
		elif car.get("owned") == false:
			total += int(car.get("rentMonthly", 0))
	return total


static func owned_count(st: Dictionary) -> int:
	var n := 0
	for car in st.get("cars", []):
		if car.get("owned") == true:
			n += 1
	return n


static func plate_progress(st: Dictionary, key: String, models: Dictionary) -> String:
	var plates: Dictionary = st.get("plates", {})
	if plates.get(key, false) == true:
		return "WON"
	var stats: Dictionary = st.stats
	if key == "fatcat":
		return CoreFormat.money(net_worth(st, models)) + "/" + CoreFormat.money(100000)
	if key == "stable":
		return "%d/6 cars" % owned_count(st)
	if key == "household":
		return "%d/85" % int(st.reputation)
	return "best " + CoreFormat.money(float(stats.bestAuctionSale)) + "/" + CoreFormat.money(100000)


static func stat_lines(st: Dictionary) -> Array[String]:
	var s: Dictionary = st.stats
	var out: Array[String] = []
	out.append("Jobs done %d / failed %d" % [int(s.jobsDone), int(s.jobsFailed)])
	out.append("Adverts run %d" % int(s.adsRun))
	out.append("Cars bought %d / sold %d" % [int(s.carsBought), int(s.carsSold)])
	out.append("Best sale %s  Faults %d" % [CoreFormat.money(float(s.bestAuctionSale)), int(s.faults)])
	return out
