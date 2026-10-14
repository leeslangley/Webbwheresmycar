class_name SimMonth
extends RefCounted

# Port of src/sim/month.js (DESIGN.md 4.9 and 4.2). Runs when a new month has just started, so the month
# that ENDED is state.day - 1. Charges rent for rented cars and running costs for owned cars plus the
# garage lease, rolls one fault per fault-free car at half chance, drifts the market price multiplier,
# prepares the coming month's auction and checks bankruptcy.
# Pure: randomness only through CoreRng on state.rng, no node access, no dates.

# Garage lease, flat every month ("Webb's Wheels Workshop & Kettle Fund").
const GARAGE_LEASE := 400

# Overdraft limit: end a month below this and the firm is bankrupt.
const OVERDRAFT_LIMIT := -2000


# Run month-end for the month that just ended. Mutates state in place and returns the report
# {month, monthName, rent, running, lease, total, cashAfter, newFaults}. opts["skipFaults"] skips the fault rolls.
static func month_end(state: Dictionary, opts: Dictionary = {}) -> Dictionary:
	var ended: Dictionary = CoreClock.date_of(int(state["day"]) - 1)
	var report: Dictionary = {
		"month": ended["month"],
		"monthName": ended["monthName"],
		"rent": 0,
		"running": 0,
		"lease": GARAGE_LEASE,
		"total": 0,
		"cashAfter": 0,
		"newFaults": [],
	}
	var cars: Array = state["cars"]

	# (1) rent for each rented car; (2) running cost for each owned car.
	for car in cars:
		if car.get("owned") == false:
			var rent_monthly: Variant = car.get("rentMonthly")
			if rent_monthly == null:
				rent_monthly = 0
			report["rent"] += rent_monthly
		elif car.get("owned") == true:
			report["running"] += SimCarStats.running_cost(SimData.model_of(car["modelId"]), car)

	# (3) lease and the bill.
	report["total"] = report["rent"] + report["running"] + report["lease"]
	state["cash"] -= report["total"]

	# (4) one fault roll at half chance per car that has no fault.
	if not opts.get("skipFaults", false):
		for car in cars:
			if car.get("fault") != null:
				continue
			var model: Dictionary = SimData.model_of(car["modelId"])
			var fault: Variant = SimFaultSim.roll_fault(state, model, car, 0.5)
			if fault != null:
				SimFaultSim.apply_fault(car, fault)
				state["stats"]["faults"] += 1
				var new_faults: Array = report["newFaults"]
				new_faults.append(str(model["name"]) + ": " + str(fault["label"]))

	# (5) market price drift, clamped.
	var market: Dictionary = state["market"]
	market["priceMult"] = CoreRng.clamp_value(
		CoreRng.round_to(float(market["priceMult"]) + (CoreRng.rand(state) - 0.5) * 0.06, 0.001),
		0.85,
		1.25
	)

	# (6) auction for the new month.
	SimAuction.prepare_auction(state)

	# (7) record the report.
	report["cashAfter"] = state["cash"]
	state["lastMonthReport"] = report

	# (8) bankruptcy check: below the overdraft limit is game over.
	if state["cash"] < OVERDRAFT_LIMIT:
		var flags: Dictionary = state["flags"]
		flags["gameOver"] = true
		flags["won"] = false
		flags["reason"] = "bankrupt"

	return report
