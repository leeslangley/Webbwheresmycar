class_name SimShop
extends RefCounted

# Port of src/sim/shop.js (DESIGN.md 4.4): the TV shop listings (eight motors for sale or rent,
# refreshed every seven days). Pure: randomness only through CoreRng on state.rng, no node access, no dates.

# Sales patter shown under each listing (same ten lines, same order as the JS).
const BLURBS := [
	"One careful owner and four careless ones.",
	"Starts first time. Every other time is the problem.",
	"Smells faintly of chips and victory.",
	"Drives beautifully downhill.",
	"Only driven to church by a nun. Allegedly.",
	"The radio only gets one station. You will grow to love it.",
	"Passed its last test with a note from its mum.",
	"Goes from nought to sixty eventually.",
	'Handy little runabout. "Handy" being generous.',
	"For sale because the taxi rank said no.",
]


# Catalogue models of one tier that are not excluded, in file order.
static func _tier_candidates(tier: int, exclude_model_ids: Array) -> Array:
	var out: Array = []
	for car in SimData.cars():
		if int(car["tier"]) == tier and not exclude_model_ids.has(car["id"]):
			out.append(car)
	return out


# Build one listing. opts keys: mode ("sale"/"rent", drawn when absent), tier (drawn when absent or 0),
# excludeModelIds (Array), maxPrice (int, null when absent). Up to 20 attempts; {} with push_error if none fits.
static func make_listing(state: Dictionary, opts: Dictionary = {}) -> Dictionary:
	var mode: Variant = opts.get("mode")
	if mode == null or mode == "":
		mode = "sale" if CoreRng.chance(state, 0.6) else "rent"
	var exclude_model_ids: Array = opts.get("excludeModelIds", [])
	var max_price: Variant = opts.get("maxPrice")

	for _attempt in range(20):
		var tier: Variant = opts.get("tier")
		if tier == null or int(tier) == 0:
			tier = int(CoreRng.weighted(state, [
				{"tier": 1, "w": 50},
				{"tier": 2, "w": 35},
				{"tier": 3, "w": 15},
			])["tier"])
		var candidates := _tier_candidates(int(tier), exclude_model_ids)
		if candidates.is_empty():
			continue
		var model: Dictionary = CoreRng.pick(state, candidates)
		var top := 7.0 if int(tier) == 3 else 8.0
		var condition := CoreRng.round_to(3.0 + CoreRng.rand(state) * (top - 3.0), 0.1)
		var price: int
		if mode == "sale":
			price = SimUtil.jround(float(model["basePrice"]) * SimCarStats.value_factor({"condition": condition}) * float(state["market"]["priceMult"]) * (0.9 + 0.2 * CoreRng.rand(state)))
		else:
			price = SimUtil.jround(float(model["baseRent"]) * (0.9 + 0.2 * CoreRng.rand(state)))
		if max_price != null and price > int(max_price):
			continue

		var listing_id := "L" + str(state["nextId"])
		state["nextId"] = int(state["nextId"]) + 1
		var owner: Variant = null
		if mode == "rent":
			owner = SimData.owner_name(state)
		return {
			"listingId": listing_id,
			"modelId": model["id"],
			"mode": mode,
			"price": price,
			"condition": condition,
			"owner": owner,
			"blurb": CoreRng.pick(state, BLURBS),
		}
	push_error("makeListing: no car fits")
	return {}


# Opening board: three cheap sales, two posh rentals, then three anything-goes. No two share a model.
static func init_shop(state: Dictionary) -> void:
	state["shop"]["listings"] = []
	var exclude_model_ids: Array = []
	for _i in range(3):
		var listing := make_listing(state, {"mode": "sale", "tier": 1, "maxPrice": 14000, "excludeModelIds": exclude_model_ids})
		exclude_model_ids.append(listing["modelId"])
		state["shop"]["listings"].append(listing)
	for _i in range(2):
		var rent_listing := make_listing(state, {"mode": "rent", "tier": CoreRng.rand_int(state, 2, 3), "excludeModelIds": exclude_model_ids})
		exclude_model_ids.append(rent_listing["modelId"])
		state["shop"]["listings"].append(rent_listing)
	for _i in range(3):
		var any_listing := make_listing(state, {"excludeModelIds": exclude_model_ids})
		exclude_model_ids.append(any_listing["modelId"])
		state["shop"]["listings"].append(any_listing)
	state["shop"]["refreshedDay"] = state["day"]


# Listings refresh every 7 days (day % 7 == 1, but never on day 1).
static func should_refresh(day: int) -> bool:
	return day > 1 and day % 7 == 1


# Swap 1-3 random listings for the same number of fresh ones (never more than the board holds).
static func refresh_shop(state: Dictionary) -> void:
	var listings: Array = state["shop"]["listings"]
	var n := mini(CoreRng.rand_int(state, 1, 3), listings.size())
	for _i in range(n):
		listings.remove_at(CoreRng.rand_int(state, 0, listings.size() - 1))
	var exclude_model_ids: Array = []
	for kept in listings:
		exclude_model_ids.append(kept["modelId"])
	for _i in range(n):
		var listing := make_listing(state, {"excludeModelIds": exclude_model_ids})
		exclude_model_ids.append(listing["modelId"])
		listings.append(listing)
	state["shop"]["refreshedDay"] = state["day"]
