// Month-end processing (DESIGN.md sections 4.9 and 4.2). Runs when a new
// month has just started, so the month that ENDED is the previous one:
// `ended = dateOf(state.day - 1)`. Charges rent for rented cars and
// running costs for owned cars plus the garage lease, rolls one fault per
// fault-free car at half chance, drifts the market price multiplier,
// prepares the coming month's auction and checks bankruptcy. Pure sim
// module: randomness only through state.rng, no DOM, no dates.

import { rand, roundTo, clamp } from '../core/rng.js';
import { dateOf } from '../core/clock.js';
import { CAR_BY_ID } from '../data/cars.js';
import { runningCost } from './carstats.js';
import { rollFault, applyFault } from './faultsim.js';
import { prepareAuction } from './auction.js';

// Garage lease, flat every month ("Webb's Wheels Workshop & Kettle Fund").
export const GARAGE_LEASE = 400;

// Overdraft limit: end a month below this and the firm is bankrupt.
export const OVERDRAFT_LIMIT = -2000;

// Run month-end for the month that just ended. Mutates state in place and
// returns the report {month, monthName, rent, running, lease, total,
// cashAfter, newFaults}. `opts.skipFaults` skips the fault rolls.
export function monthEnd(state, opts = {}) {
	const ended = dateOf(state.day - 1);
	const report = {
		month: ended.month,
		monthName: ended.monthName,
		rent: 0,
		running: 0,
		lease: GARAGE_LEASE,
		total: 0,
		cashAfter: 0,
		newFaults: [],
	};

	// (1) rent for each rented car; (2) running cost for each owned car.
	for (let i = 0; i < state.cars.length; i++) {
		const car = state.cars[i];
		if (car.owned === false) {
			report.rent += car.rentMonthly || 0;
		} else if (car.owned === true) {
			report.running += runningCost(CAR_BY_ID[car.modelId], car);
		}
	}

	// (3) lease and the bill.
	report.total = report.rent + report.running + report.lease;
	state.cash -= report.total;

	// (4) one fault roll at half chance per car that has no fault.
	if (!opts.skipFaults) {
		for (let i = 0; i < state.cars.length; i++) {
			const car = state.cars[i];
			if (car.fault) {
				continue;
			}
			const model = CAR_BY_ID[car.modelId];
			const fault = rollFault(state, model, car, 0.5);
			if (fault) {
				applyFault(car, fault);
				state.stats.faults++;
				report.newFaults.push(model.name + ': ' + fault.label);
			}
		}
	}

	// (5) market price drift, clamped.
	state.market.priceMult = clamp(
		roundTo(state.market.priceMult + (rand(state) - 0.5) * 0.06, 0.001),
		0.85,
		1.25
	);

	// (6) auction for the new month.
	prepareAuction(state);

	// (7) record the report.
	report.cashAfter = state.cash;
	state.lastMonthReport = report;

	// (8) bankruptcy check: below the overdraft limit is game over.
	if (state.cash < OVERDRAFT_LIMIT) {
		state.flags.gameOver = true;
		state.flags.won = false;
		state.flags.reason = 'bankrupt';
	}

	return report;
}
