class_name SimNewGame
extends RefCounted

# Port of src/sim/newgame.js (DESIGN.md 9.3): the new-game bootstrap. Builds a fresh year state for one seed:
# fills the telly shop, prepares the first auction, hangs day 1's paper and rings in the opening booking
# requests. Pure: randomness only through state.rng (CoreRng), no node access, no dates.


# startGame(seed) -> state. Everything a new year at Webb's Wheels needs, before the player's first action.
# The order of the five calls below is the parity test: each one draws from state.rng in turn.
static func start_game(seed_value: int = 1) -> Dictionary:
	var state: Dictionary = CoreState.new_game_state(seed_value)
	SimShop.init_shop(state)
	SimAuction.prepare_auction(state)
	# The headline is drawn first, as an argument evaluated before the dictionary is stored.
	state["today"] = {
		"day": 1,
		"headline": SimNews.choose_headline(state, [], {}),
		"events": ["Welcome to Webb's Wheels, Mark!"],
		"monthReport": null,
	}
	SimJobSim.generate_requests(state)
	return state
