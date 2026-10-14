class_name SimActions
extends RefCounted

# Port of src/sim/actions.js (DESIGN.md sections 4.1, 4.2, 4.3, 4.4): buying, renting, returning a rental,
# selling to a dealer, buying a garage slot and waiting a day. Every action returns {ok, msg}: on failure
# nothing changes at all; on success a note goes into state.pending and the day clock moves on exactly once,
# as the very last step. Pure: randomness only through state.rng, no node access, no dates.

const SLOT_COST := 3000
const MAX_SLOTS := 8
const DEALER_CUT := 0.6

# Ids are typed Variant on purpose: Game.act passes untyped params, so an id of the wrong type must come back
# as a plain refusal ({ok: false}), not a call error. A non-matching id never matches a listing or car.


# Find a shop listing by id, or null.
static func _find_listing(state: Dictionary, listing_id: Variant) -> Variant:
	if typeof(listing_id) != TYPE_STRING:
		return null
	for listing in state["shop"]["listings"]:
		if listing["listingId"] == listing_id:
			return listing
	return null


# Find a car in the stable by id, or null.
static func _find_car(state: Dictionary, car_id: Variant) -> Variant:
	if typeof(car_id) != TYPE_STRING:
		return null
	for car in state["cars"]:
		if car["id"] == car_id:
			return car
	return null


# Remove one listing by id. Returns true if it was there.
static func _remove_listing(state: Dictionary, listing_id: Variant) -> bool:
	var listings: Array = state["shop"]["listings"]
	for i in range(listings.size()):
		if listings[i]["listingId"] == listing_id:
			listings.remove_at(i)
			return true
	return false


# Remove one car by id. Returns true if it was there.
static func _remove_car(state: Dictionary, car_id: Variant) -> bool:
	var cars: Array = state["cars"]
	for i in range(cars.size()):
		if cars[i]["id"] == car_id:
			cars.remove_at(i)
			return true
	return false


# The shared refusals for taking a car on: no slot, no money. "" when there is no refusal.
static func _slot_and_cash_refusal(state: Dictionary, cost: int) -> String:
	if state["cars"].size() >= int(state["garageSlots"]):
		return "No free garage slot"
	if state["cash"] < cost:
		return "Not enough money"
	return ""


# Push the note into the tray and move the clock on, as the last step of every successful action.
# Returns the {ok: true, msg} reply.
static func _succeed(state: Dictionary, msg: String) -> Dictionary:
	state["pending"].append(msg)
	SimAdvance.advance_day(state)
	return {"ok": true, "msg": msg}


# buy_car(state, listing_id): pay the ticket price, the car is yours.
static func buy_car(state: Dictionary, listing_id: Variant) -> Dictionary:
	var listing: Variant = _find_listing(state, listing_id)
	if listing == null or listing["mode"] != "sale":
		return {"ok": false, "msg": "No such car for sale on the telly"}
	var refusal := _slot_and_cash_refusal(state, int(listing["price"]))
	if refusal != "":
		return {"ok": false, "msg": refusal}
	var model: Dictionary = SimData.model_of(listing["modelId"])
	var car := {
		"id": "c" + str(int(state["nextId"])),
		"modelId": listing["modelId"],
		"owned": true,
		"owner": null,
		"rentMonthly": 0,
		"paid": listing["price"],
		"condition": listing["condition"],
		"fault": null,
		"lastServiceDay": state["day"],
		"jobsDone": 0,
		"boughtDay": state["day"],
		"impoundedUntil": 0,
		"rentedAtCondition": null,
	}
	state["nextId"] = int(state["nextId"]) + 1
	state["cars"].append(car)
	state["cash"] -= int(listing["price"])
	_remove_listing(state, listing_id)
	state["stats"]["carsBought"] += 1
	return _succeed(state, "Bought the " + str(model["name"]) + " for " + CoreFormat.money(listing["price"]))


# rent_car(state, listing_id): one month's rent up front, the car stays the owner's. rentMonthly is what
# month-end will take from you.
static func rent_car(state: Dictionary, listing_id: Variant) -> Dictionary:
	var listing: Variant = _find_listing(state, listing_id)
	if listing == null or listing["mode"] != "rent":
		return {"ok": false, "msg": "No such car for rent on the telly"}
	var refusal := _slot_and_cash_refusal(state, int(listing["price"]))
	if refusal != "":
		return {"ok": false, "msg": refusal}
	var model: Dictionary = SimData.model_of(listing["modelId"])
	var car := {
		"id": "c" + str(int(state["nextId"])),
		"modelId": listing["modelId"],
		"owned": false,
		"owner": listing["owner"],
		"rentMonthly": listing["price"],
		"paid": 0,
		"condition": listing["condition"],
		"fault": null,
		"lastServiceDay": state["day"],
		"jobsDone": 0,
		"boughtDay": state["day"],
		"impoundedUntil": 0,
		"rentedAtCondition": listing["condition"],
	}
	state["nextId"] = int(state["nextId"]) + 1
	state["cars"].append(car)
	state["cash"] -= int(listing["price"])
	_remove_listing(state, listing_id)
	return _succeed(state, "Rented the " + str(model["name"]) + " from " + str(listing["owner"]))


# return_rental(state, car_id): hand the rented car back. The owner bills you for the condition it lost since
# you took it: 2% of basePrice per point of damage.
static func return_rental(state: Dictionary, car_id: Variant) -> Dictionary:
	var car: Variant = _find_car(state, car_id)
	if car == null or car["owned"] != false:
		return {"ok": false, "msg": "That car is not one of your rentals"}
	var model: Dictionary = SimData.model_of(car["modelId"])
	var damage: float = maxf(0.0, float(car["rentedAtCondition"]) - float(car["condition"]))
	var fee: int = SimUtil.jround(damage * 0.02 * float(model["basePrice"]))
	if state["cash"] < fee:
		return {"ok": false, "msg": "Cannot afford the damage fee"}
	state["cash"] -= fee
	_remove_car(state, car_id)
	return _succeed(state, "Returned the " + str(model["name"]) + " to " + str(car["owner"]) + ". Damage fee: " + CoreFormat.money(fee) + ".")


# sell_to_dealer(state, car_id): the dealer offers 60% of market value, rounded to the nearest tenner.
# Rentals and consigned cars must not slip out through this door.
static func sell_to_dealer(state: Dictionary, car_id: Variant) -> Dictionary:
	var car: Variant = _find_car(state, car_id)
	if car == null or car["owned"] != true:
		return {"ok": false, "msg": "You do not own that car"}
	for consigned in state["auction"]["consigned"]:
		if consigned["carId"] == car_id:
			return {"ok": false, "msg": "Withdraw it from the auction first"}
	var model: Dictionary = SimData.model_of(car["modelId"])
	var price: int = int(CoreRng.round_to(float(SimCarStats.market_value(state, model, car)) * DEALER_CUT, 10.0))
	_remove_car(state, car_id)
	state["cash"] += price
	state["stats"]["carsSold"] += 1
	return _succeed(state, "Sold the " + str(model["name"]) + " to the dealer for " + CoreFormat.money(price) + ".")


# buy_slot(state): knock a wall down, another car fits. Up to 8 slots.
static func buy_slot(state: Dictionary) -> Dictionary:
	if state["garageSlots"] >= MAX_SLOTS:
		return {"ok": false, "msg": "Garage is full-size already"}
	if state["cash"] < SLOT_COST:
		return {"ok": false, "msg": "Not enough money"}
	state["cash"] -= SLOT_COST
	state["garageSlots"] += 1
	return _succeed(state, "Bought another garage slot for " + CoreFormat.money(SLOT_COST) + ".")


# wait_day(state): the honest do-nothing. Still costs a day.
static func wait_day(state: Dictionary) -> Dictionary:
	return _succeed(state, "You put the kettle on. Nothing happens. Lovely.")
