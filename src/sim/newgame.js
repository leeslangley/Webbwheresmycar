// New game bootstrap (DESIGN.md 9.3). Builds a fresh state for one seed:
// fills the telly shop, prepares the first auction, hangs day 1's paper
// and rings in the opening booking requests. Pure sim module: randomness
// only through state.rng, no DOM, no dates.

import { newGameState } from '../core/state.js';
import { initShop } from './shop.js';
import { prepareAuction } from './auction.js';
import { chooseHeadline } from './news.js';
import { generateRequests } from './jobsim.js';

// startGame(seed) -> state. Everything a new year at Webb's Wheels needs,
// before the player's first action.
export function startGame(seed = 1) {
	const state = newGameState(seed);
	initShop(state);
	prepareAuction(state);
	state.today = {
		day: 1,
		headline: chooseHeadline(state, [], {}),
		events: ['Welcome to Webb\'s Wheels, Mark!'],
		monthReport: null,
	};
	generateRequests(state);
	return state;
}
