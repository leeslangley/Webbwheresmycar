class_name SimEndGame
extends RefCounted

# Port of src/sim/endgame.js (DESIGN.md 4.11): net worth, the four Gold Number Plates, final score,
# ranks and the end-of-game check. Pure static helpers over the state Dictionary; no rng, no clock.

const PLATE_KEYS := ["fatcat", "stable", "household", "hammer"]


# The four Gold Number Plates, for the HUD and the year-end screen.
static func plate_info() -> Dictionary:
	return {
		"fatcat": {"name": "Fat Cat", "text": "Net worth " + CoreFormat.money(100000)},
		"stable": {"name": "Stable Boy", "text": "Own 6 cars at once"},
		"household": {"name": "Household Name", "text": "Reputation 85"},
		"hammer": {"name": "Hammer Time", "text": "Sell a car at auction for " + CoreFormat.money(100000)},
	}


# Cash plus the market value of every owned car (rented cars count 0).
static func net_worth(state: Dictionary) -> int:
	var total: int = int(state["cash"])
	for car: Dictionary in state["cars"]:
		if car.get("owned") == true:
			total += SimCarStats.market_value(state, SimData.model_of(car["modelId"]), car)
	return total


# Number of owned cars (rented cars do not count).
static func _owned_count(state: Dictionary) -> int:
	var n: int = 0
	for car: Dictionary in state["cars"]:
		if car.get("owned") == true:
			n += 1
	return n


# The condition one plate is checked against (the JS PLATE_CONDITIONS table).
static func _plate_condition(state: Dictionary, key: String) -> bool:
	if key == "fatcat":
		return net_worth(state) >= 100000
	if key == "stable":
		return _owned_count(state) >= 6
	if key == "household":
		return state["reputation"] >= 85
	if key == "hammer":
		return state["stats"]["bestAuctionSale"] >= 100000
	return false


# Award every plate whose condition holds, but never take one away.
# Returns the plate keys newly won in this call, in win-check order.
static func evaluate_plates(state: Dictionary) -> Array:
	var won: Dictionary = state["plates"]
	var newly: Array = []
	for key in PLATE_KEYS:
		if not won[key] and _plate_condition(state, key):
			won[key] = true
			newly.append(key)
	return newly


# Final score: net worth plus a bonus per plate plus reputation, rounded to the nearest pound.
static func final_score(state: Dictionary) -> int:
	var plates: int = 0
	var won: Dictionary = state["plates"]
	for key in PLATE_KEYS:
		if won[key]:
			plates += 1
	var total: float = float(net_worth(state) + 5000 * plates)
	total += 100.0 * float(state["reputation"])
	return SimUtil.jround(total)


# Rank title for a final score (DESIGN.md section 4.11).
static func rank_of(score: float) -> String:
	if score < 0.0:
		return "Pavement Pete"
	if score < 30000.0:
		return "Learner Driver"
	if score < 80000.0:
		return "Weekend Mechanic"
	if score < 150000.0:
		return "Gearbox Guru"
	if score < 300000.0:
		return "Concours Champion"
	return "Legend of the Lay-by"


# End-of-game check: all four plates wins at any time, otherwise the year ends with a loss once
# day 365 has been completed. Does nothing if the game is already over.
static func check_end(state: Dictionary) -> void:
	var flags: Dictionary = state["flags"]
	if flags["gameOver"]:
		return
	var all_won := true
	var won: Dictionary = state["plates"]
	for key in PLATE_KEYS:
		if not won[key]:
			all_won = false
			break
	if all_won:
		flags["gameOver"] = true
		flags["won"] = true
		flags["reason"] = "won"
	elif int(state["day"]) > 365:
		flags["gameOver"] = true
		flags["won"] = false
		flags["reason"] = "year-end"
