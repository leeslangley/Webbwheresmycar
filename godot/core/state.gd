class_name CoreState
extends RefCounted

# Exact port of src/core/state.js (DESIGN.md 9.4). Keys keep the JS camelCase names because saves,
# golden fixtures and the sim ports all use them. Pure: no node access, no host RNG, no clock.

# The four Gold Number Plates (DESIGN.md 4.11), in win-check order.
const PLATE_KEYS: Array[String] = ["fatcat", "stable", "household", "hammer"]


# A fresh state with every container newly built, so two states never share an Array or Dictionary.
static func new_game_state(seed_value: int = 1) -> Dictionary:
	var state: Dictionary = {
		"v": 1,
		"seed": seed_value,
		"rng": 0,
		"day": 1,
		"cash": 20000,
		"reputation": 40,
		"buzz": 0,
		"garageSlots": 3,
		"nextId": 1,
		"market": {"priceMult": 1},
		"cars": [],
		"shop": {"listings": [], "refreshedDay": 1},
		"requests": [],
		"auction": {"month": 1, "lots": [], "consigned": [], "lastResults": []},
		"stats": {
			"jobsDone": 0,
			"jobsFailed": 0,
			"adsRun": 0,
			"carsBought": 0,
			"carsSold": 0,
			"bestAuctionSale": 0,
			"faults": 0,
		},
		"plates": {"fatcat": false, "stable": false, "household": false, "hammer": false},
		"headlines": [],
		"pending": [],
		"sit": [],
		"today": {"day": 1, "headline": "", "events": [], "monthReport": null},
		"lastMonthReport": null,
		"flags": {"gameOver": false, "won": false, "reason": ""},
		"log": [],
	}
	CoreRng.seed_rng(state, seed_value)
	return state
