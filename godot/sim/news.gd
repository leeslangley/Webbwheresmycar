class_name SimNews
extends RefCounted

# Port of src/sim/news.js (DESIGN.md 8.4, 9.3): the Daily Sprocket headline chooser.
# Picks the front page for the day: sometimes a reactive template for the player's situation,
# otherwise a fresh story from the generic or carworld pool. Randomness only through CoreRng on state.rng.

# The newspaper never keeps more than this many back issues.
const MAX_HEADLINES := 30

# A pool headline may not repeat inside the latest 20; retry this many times before accepting whatever came out.
const POOL_RETRY := 10


# Fill {car}, {customer} and {cash} placeholders in a template (same order as the JS).
static func _fill(text: String, ctx: Dictionary) -> String:
	var car: String = "a mystery car"
	if typeof(ctx.get("car")) == TYPE_STRING and ctx["car"] != "":
		car = ctx["car"]
	var customer: String = "a mystery customer"
	if typeof(ctx.get("customer")) == TYPE_STRING and ctx["customer"] != "":
		customer = ctx["customer"]
	var cash: String = "some money"
	if typeof(ctx.get("cash")) == TYPE_INT or typeof(ctx.get("cash")) == TYPE_FLOAT:
		cash = CoreFormat.money(float(ctx["cash"]))
	return text.replace("{car}", car).replace("{customer}", customer).replace("{cash}", cash)


# True when the text already appears in the newest 20 headlines.
static func _seen_recently(state: Dictionary, text: Variant) -> bool:
	var recent: int = mini(20, state["headlines"].size())
	for i in range(recent):
		if state["headlines"][i] == text:
			return true
	return false


# Records the chosen headline at the front of state["headlines"] (at most 30 kept) and returns it.
static func choose_headline(state: Dictionary, situations: Array = [], ctx: Dictionary = {}) -> String:
	if typeof(state.get("headlines")) != TYPE_ARRAY:
		state["headlines"] = []
	var text: Variant = null

	# Reactive path: only situations the paper actually covers.
	var reactive: Dictionary = SimData.headline_reactive()
	var known: Array = []
	for s in situations:
		if reactive.has(s):
			known.append(s)
	if known.size() > 0 and CoreRng.chance(state, 0.6):
		var sit: Variant = CoreRng.pick(state, known)
		text = CoreRng.pick(state, reactive[sit])

	# Otherwise draw a pool story, avoiding anything in the latest 20 issues.
	if text == null:
		for attempt in range(POOL_RETRY):
			var story: Dictionary = CoreRng.weighted(state, [
				{"w": 55, "pool": SimData.headline_generic()},
				{"w": 45, "pool": SimData.headline_carworld()},
			])
			text = CoreRng.pick(state, story["pool"])
			if not _seen_recently(state, text):
				break

	text = _fill(str(text), ctx)
	state["headlines"].insert(0, text)
	if state["headlines"].size() > MAX_HEADLINES:
		state["headlines"].resize(MAX_HEADLINES)
	return text
