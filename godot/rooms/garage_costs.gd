class_name GarageCosts
extends RefCounted

# Port of the garage money rules in src/ui/scenes/garage.js: tinker, service and restore prices, the dealer's
# 60 percent, the consign reserve (70 percent), the rental damage fee and the consigned check. Pure: no node
# access, no randomness. Market value comes from SimCarStats (src/sim/carstats.js).


# Catalogue entry for a model id; {} when the id is unknown.
static func model_of(model_id: String) -> Dictionary:
	return Data.car_by_id(model_id)


# Treatment costs, exactly as the sim charges them (DESIGN.md 4.5).
static func tinker_cost(model: Dictionary) -> int:
	return roundi(40.0 + float(model.basePrice) * 0.002)


static func service_cost(model: Dictionary) -> int:
	return roundi(150.0 + float(model.basePrice) * 0.008)


static func restore_cost(model: Dictionary) -> int:
	return maxi(1200, roundi(float(model.basePrice) * 0.06))


# The dealer pays 60% of market value, rounded to the nearest tenner.
static func dealer_price(state: Dictionary, model: Dictionary, car: Dictionary) -> float:
	return CoreRng.round_to(float(SimCarStats.market_value(state, model, car)) * 0.6, 10.0)


# The auction reserve for a consigned car: 70% of market value, rounded to the nearest tenner.
static func consign_reserve(state: Dictionary, model: Dictionary, car: Dictionary) -> float:
	return CoreRng.round_to(float(SimCarStats.market_value(state, model, car)) * 0.7, 10.0)


# Damage fee for returning a rental (DESIGN.md 4.4). A null rentedAtCondition counts as 0.
static func damage_fee(model: Dictionary, car: Dictionary) -> int:
	var rented_at: float = 0.0
	if car.get("rentedAtCondition") != null:
		rented_at = float(car.rentedAtCondition)
	return roundi(maxf(0.0, rented_at - float(car.condition)) * 0.02 * float(model.basePrice))


# True when some entry of state.auction.consigned names this car.
static func is_consigned(state: Dictionary, car_id: String) -> bool:
	for entry in state.auction.consigned:
		if entry.carId == car_id:
			return true
	return false
