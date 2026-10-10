// Initial game state module (DESIGN.md 9.4). Returns a plain, JSON-safe
// object with an exact set of keys so every other module can rely on its
// shape. Pure: no DOM, no host RNG, no clock.

import { seedRng } from './rng.js';

// The four Gold Number Plates (DESIGN.md 4.11), in win-check order.
export const PLATE_KEYS = ['fatcat', 'stable', 'household', 'hammer'];

export function newGameState(seed = 1) {
	const state = {
		v: 1,
		seed: seed,
		rng: 0,
		day: 1,
		cash: 20000,
		reputation: 40,
		buzz: 0,
		garageSlots: 3,
		nextId: 1,
		market: { priceMult: 1 },
		cars: [],
		shop: { listings: [], refreshedDay: 1 },
		requests: [],
		auction: { month: 1, lots: [], consigned: [], lastResults: [] },
		stats: { jobsDone: 0, jobsFailed: 0, adsRun: 0, carsBought: 0, carsSold: 0, bestAuctionSale: 0, faults: 0 },
		plates: { fatcat: false, stable: false, household: false, hammer: false },
		headlines: [],
		pending: [],
		sit: [],
		today: { day: 1, headline: '', events: [], monthReport: null },
		lastMonthReport: null,
		flags: { gameOver: false, won: false, reason: '' },
		log: [],
	};
	seedRng(state, seed);
	return state;
}
