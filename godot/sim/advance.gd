class_name SimAdvance
extends RefCounted

# Port of src/sim/advance.js (DESIGN.md sections 4.1, 4.7, 4.8, 4.9). Every player action ends with advance_day:
# the calendar moves one day and everything overnight runs: decay, buzz fade, month-end bills, the phone,
# the TV shop, the plates, situations, tomorrow's headline and the end check.
# Pure: randomness only through CoreRng on state.rng, no node access, no dates.


# advance_day(state) -> void. Mutates state in place: one day passes.
static func advance_day(state: Dictionary) -> void:
	# A finished game never moves.
	if state["flags"]["gameOver"]:
		return

	# (1) every car in the stable rots a little overnight.
	for car in state["cars"]:
		SimCarStats.change_condition(car, -SimCarStats.idle_decay(SimData.model_of(car["modelId"])))

	# (2) yesterday's hype fades by a tenth.
	state["buzz"] = maxf(0.0, CoreRng.round_to(state["buzz"] * 0.9, 0.1))

	# (3) tear the page off the calendar.
	state["day"] += 1

	# (4) the actions' notes and situations move out of the tray.
	var events: Array = state["pending"].duplicate()
	var sit: Array = state["sit"].duplicate()
	state["pending"] = []
	state["sit"] = []
	var month_report: Variant = null

	# (5) past day 365 the year is over: no bills, no phone, no paper.
	if int(state["day"]) > CoreClock.DAYS_IN_YEAR:
		state["today"] = {"day": state["day"], "headline": "", "events": events, "monthReport": null}
		SimEndGame.check_end(state)
		return

	# (6) the first of a month: last month's bills come in.
	if CoreClock.is_month_start(state["day"]):
		month_report = SimMonth.month_end(state)
		events.append("Month end: bills of " + CoreFormat.money(month_report["total"]))
		for fault_text in month_report["newFaults"]:
			events.append(fault_text)
		sit.append("monthend")

	# (7) the phone: stale requests go, fresh ones ring in.
	SimJobSim.expire_requests(state)
	if SimJobSim.generate_requests(state) > 0:
		events.append("The phone rings: new booking request(s)!")

	# (8) the telly gets a new batch of motors every seven days.
	if SimShop.should_refresh(int(state["day"])):
		SimShop.refresh_shop(state)
		events.append("New cars on the TV!")

	# (9) any Gold Number Plates newly within reach.
	var new_plates: Array = SimEndGame.evaluate_plates(state)
	for key in new_plates:
		events.append("GOLD NUMBER PLATE won: " + SimEndGame.plate_info()[key]["name"] + "!")

	# (10) today's situations, for the reactive front page.
	if state["cash"] < 1000:
		sit.append("broke")
	if state["cash"] > 50000:
		sit.append("rich")
	if state["cars"].size() >= int(state["garageSlots"]):
		sit.append("fullgarage")
	if state["cars"].size() == 0:
		sit.append("emptygarage")
	if CoreClock.is_auction_day(state["day"]):
		sit.append("auctionday")

	# (11) fill in the {car} and {customer} gossip, if there is any.
	var ctx: Dictionary = {"cash": state["cash"]}
	if state["cars"].size() > 0:
		var picked_car: Dictionary = CoreRng.pick(state, state["cars"])
		ctx["car"] = SimData.model_of(picked_car["modelId"])["name"]
	if state["requests"].size() > 0:
		var picked_request: Dictionary = CoreRng.pick(state, state["requests"])
		ctx["customer"] = picked_request["customer"]
	var headline: String = SimNews.choose_headline(state, sit, ctx)

	# (12) today's paper goes up on the wall.
	state["today"] = {"day": state["day"], "headline": headline, "events": events, "monthReport": month_report}

	# (13) did we just win or lose?
	SimEndGame.check_end(state)


# start_of_day_flags(state) -> Dictionary: a read-only helper for the UI.
static func start_of_day_flags(state: Dictionary) -> Dictionary:
	return {
		"isAuctionDay": CoreClock.is_auction_day(state["day"]),
		"isMonthStart": CoreClock.is_month_start(state["day"]),
		"daysLeftInYear": CoreClock.DAYS_IN_YEAR - int(state["day"]),
	}
