// Endgame maths: net worth, the four Gold Number Plates, final score, ranks
// and the end-of-game check (DESIGN.md section 4.11). Pure: no DOM, no
// randomness, no dates. Mutates state in place where the API says so.

import { modelOf } from '../data/cars.js';
import { marketValue } from './carstats.js';
import { PLATE_KEYS } from '../core/state.js';

// The four Gold Number Plates, for the HUD and the year-end screen.
export const PLATE_INFO = {
	fatcat: { name: 'Fat Cat', text: 'Net worth £100,000' },
	stable: { name: 'Stable Boy', text: 'Own 6 cars at once' },
	household: { name: 'Household Name', text: 'Reputation 85' },
	hammer: { name: 'Hammer Time', text: 'Sell a car at auction for £100,000' },
};

// Cash plus the market value of every owned car (rented cars count 0).
export function netWorth(state) {
	let total = state.cash;
	const cars = state.cars;
	for (let i = 0; i < cars.length; i++) {
		const c = cars[i];
		if (c.owned === true) {
			total += marketValue(state, modelOf(c.modelId), c);
		}
	}
	return total;
}

// The condition each plate is checked against, in win-check order. Each
// entry mutates nothing outside state.plates.
const PLATE_CONDITIONS = {
	fatcat: function (state) { return netWorth(state) >= 100000; },
	stable: function (state) {
		let n = 0;
		const cars = state.cars;
		for (let i = 0; i < cars.length; i++) {
			if (cars[i].owned === true) {
				n++;
			}
		}
		return n >= 6;
	},
	household: function (state) { return state.reputation >= 85; },
	hammer: function (state) { return state.stats.bestAuctionSale >= 100000; },
};

// Award every plate whose condition holds, but never take one away.
// Returns the plate keys newly won in this call, in win-check order.
export function evaluatePlates(state) {
	const won = state.plates;
	const newly = [];
	for (let i = 0; i < PLATE_KEYS.length; i++) {
		const key = PLATE_KEYS[i];
		if (!won[key] && PLATE_CONDITIONS[key](state)) {
			won[key] = true;
			newly.push(key);
		}
	}
	return newly;
}

// Final score: net worth plus a bonus per plate plus reputation.
export function finalScore(state) {
	let plates = 0;
	const won = state.plates;
	for (let i = 0; i < PLATE_KEYS.length; i++) {
		if (won[PLATE_KEYS[i]]) {
			plates++;
		}
	}
	return Math.round(netWorth(state) + 5000 * plates + 100 * state.reputation);
}

// Rank title for a final score (DESIGN.md section 4.11).
export function rankOf(score) {
	if (score < 0) {
		return 'Pavement Pete';
	}
	if (score < 30000) {
		return 'Learner Driver';
	}
	if (score < 80000) {
		return 'Weekend Mechanic';
	}
	if (score < 150000) {
		return 'Gearbox Guru';
	}
	if (score < 300000) {
		return 'Concours Champion';
	}
	return 'Legend of the Lay-by';
}

// End-of-game check: all four plates wins at any time, otherwise the year
// ends with a loss once day 365 has been completed. Does nothing if the
// game is already over.
export function checkEnd(state) {
	if (state.flags.gameOver) {
		return;
	}
	let all = true;
	const won = state.plates;
	for (let i = 0; i < PLATE_KEYS.length; i++) {
		if (!won[PLATE_KEYS[i]]) {
			all = false;
			break;
		}
	}
	if (all) {
		state.flags.gameOver = true;
		state.flags.won = true;
		state.flags.reason = 'won';
	} else if (state.day > 365) {
		state.flags.gameOver = true;
		state.flags.won = false;
		state.flags.reason = 'year-end';
	}
}
