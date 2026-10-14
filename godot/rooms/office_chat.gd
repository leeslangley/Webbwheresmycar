class_name OfficeChat
extends RefCounted

# Port of the pure helpers in src/ui/scenes/office.js: daveSit (sit_for), daveLine (line_for),
# ownedCount (owned_count) and Mark's mood from the cash (mood_for). Static, no state.
# line_for uses a throwaway rng dictionary, so the game's own state.rng is never touched.


static func owned_count(state: Dictionary) -> int:
	var n: int = 0
	for car in state.cars:
		if car.owned == true:
			n += 1
	return n


# The office situation Dave comments on: the first tag that applies.
static func sit_for(state: Dictionary) -> String:
	var cash: float = float(state.cash)
	if cash < 1000.0:
		return "broke"
	if cash > 50000.0:
		return "rich"
	var today: Variant = state.get("today")
	if today is Dictionary:
		var events: Variant = today.get("events", [])
		if events is Array and not events.is_empty():
			var last: Variant = events[events.size() - 1]
			if last is String and String(last).contains("broke down"):
				return "breakdown"
	var day: int = int(state.day)
	if CoreClock.is_month_start(day):
		return "newmonth"
	if CoreClock.is_auction_day(day):
		return "auctionday"
	var owned: int = owned_count(state)
	if owned >= state.garageSlots:
		return "fullgarage"
	if owned == 0:
		return "emptygarage"
	return "idle"


# Dave's one line for the day. Same day gives the same line; state.rng is left alone.
static func line_for(state: Dictionary) -> String:
	var table: Dictionary = Data.chatter()
	var lines: Array = table.get(sit_for(state), table["idle"])
	return str(CoreRng.pick({"rng": int(state.day) * 7919 + 13}, lines))


# Mark's mood follows the cash.
static func mood_for(state: Dictionary) -> String:
	var cash: float = float(state.cash)
	if cash > 30000.0:
		return "happy"
	if cash < 1500.0:
		return "worried"
	return "normal"
