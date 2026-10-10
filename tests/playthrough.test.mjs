// Playthrough test (card W40): a simple scripted bot plays whole years on
// seeds 1..25, one action per call, with invariants checked after every
// action, so nothing crashes and no value ever leaves its range. Also
// proves determinism: the same seed twice gives the identical final state.
// Run under macOS `jsc -m`: no console, use print().

import { startGame } from '../src/sim/newgame.js';
import { isAuctionDay } from '../src/core/clock.js';
import { modelOf } from '../src/data/cars.js';
import { effD, effR, isAvailable } from '../src/sim/carstats.js';
import { attendAuction } from '../src/sim/auction.js';
import { buyCar, waitDay } from '../src/sim/actions.js';
import { fixFault, serviceCar } from '../src/sim/garage.js';
import { acceptJob } from '../src/sim/jobresolve.js';
import { advertise } from '../src/sim/adsim.js';
import { test, ok, eq, done } from './harness.js';

const MAX_ACTIONS = 400;
const REASONS = ['won', 'year-end', 'bankrupt'];

// Recursive check: visit every object/array member and assert every
// number is finite. JSON.stringify would quietly turn NaN and Infinity
// into null, so we walk the live state instead.
function walk(value, path) {
	if (typeof value === 'number') {
		ok(Number.isFinite(value), path + ' must be a finite number, got ' + value);
	} else if (Array.isArray(value)) {
		for (let i = 0; i < value.length; i++) {
			walk(value[i], path + '[' + i + ']');
		}
	} else if (value !== null && typeof value === 'object') {
		for (const key in value) {
			walk(value[key], path + '.' + key);
		}
	}
}

// The invariants, asserted after every single action of every seed.
function checkInvariants(state, label) {
	ok(Number.isInteger(state.cash), label + ': cash is an integer, got ' + state.cash);
	ok(state.cars.length <= state.garageSlots, label + ': cars fit in the garage');
	for (let i = 0; i < state.cars.length; i++) {
		const c = state.cars[i].condition;
		ok(typeof c === 'number' && Number.isFinite(c) && c >= 0 && c <= 10,
			label + ': car condition 0-10, got ' + c);
	}
	ok(state.buzz >= 0 && state.buzz <= 100, label + ': buzz 0-100, got ' + state.buzz);
	ok(state.reputation >= 0 && state.reputation <= 100, label + ': reputation 0-100, got ' + state.reputation);
	ok(state.requests.length <= 6, label + ': at most 6 requests');
	ok(state.shop.listings.length <= 8, label + ': at most 8 listings');
	ok(state.day >= 1 && state.day <= 366, label + ': day within 1-366, got ' + state.day);
	walk(state, 'state');
}

// Try one action; if it is refused (ok:false, nothing changed, no day
// passed) fall back to waitDay, which costs the day instead. Every bot
// call therefore performs exactly one day's worth of play.
function actOrWait(state, attempt) {
	const r = attempt();
	if (r.ok) {
		return r;
	}
	return waitDay(state);
}

// One bot call = exactly one action, chosen by this priority order.
function bot(state) {
	if (state.flags.gameOver) {
		return null;
	}

	// (2) auction day: settle the whole visit in one action.
	if (isAuctionDay(state.day)) {
		return actOrWait(state, () => attendAuction(state));
	}

	// (3) no cars at all: buy the cheapest sale listing we can afford.
	if (state.cars.length === 0) {
		const listings = state.shop.listings;
		let best = null;
		for (let i = 0; i < listings.length; i++) {
			const l = listings[i];
			if (l.mode === 'sale' && l.price <= state.cash && (best === null || l.price < best.price)) {
				best = l;
			}
		}
		if (best === null) {
			return waitDay(state);
		}
		const listingId = best.listingId;
		return actOrWait(state, () => buyCar(state, listingId));
	}

	// (4) a faulty car we can afford to fix: fix it.
	for (let i = 0; i < state.cars.length; i++) {
		const car = state.cars[i];
		if (car.fault && state.cash >= car.fault.cost) {
			const carId = car.id;
			return actOrWait(state, () => fixFault(state, carId));
		}
	}

	// (5) the highest-fee open booking some available car can legally take.
	let bestReq = null;
	let bestCar = null;
	for (let i = 0; i < state.requests.length; i++) {
		const req = state.requests[i];
		if (req.expiresDay < state.day) {
			continue;
		}
		for (let j = 0; j < state.cars.length; j++) {
			const car = state.cars[j];
			if (!isAvailable(state, car)) {
				continue;
			}
			const model = modelOf(car.modelId);
			if (effD(model, car) >= req.minDesirability &&
				effR(model, car) >= req.minReliability &&
				car.condition >= req.minCondition) {
				if (bestReq === null || req.fee > bestReq.fee) {
					bestReq = req;
					bestCar = car;
				}
				break;
			}
		}
	}
	if (bestReq !== null) {
		const requestId = bestReq.id;
		const carId = bestCar.id;
		return actOrWait(state, () => acceptJob(state, requestId, carId));
	}

	// (6) money to burn and no hype: take out a magazine ad.
	if (state.cash > 6000 && state.buzz < 20) {
		return actOrWait(state, () => advertise(state, 'magazine'));
	}

	// (7) a shabby car and the cash for a full service.
	for (let i = 0; i < state.cars.length; i++) {
		const car = state.cars[i];
		if (car.condition < 4 && state.cash > 400) {
			const carId = car.id;
			return actOrWait(state, () => serviceCar(state, carId, 'full'));
		}
	}

	// (8) nothing worth doing: the kettle goes on.
	return waitDay(state);
}

// Play one whole year for a seed: start the game, call the bot until the
// game ends or MAX_ACTIONS actions are spent, checking invariants after
// every action. Returns the final state.
function playout(seed) {
	const state = startGame(seed);
	checkInvariants(state, 'seed ' + seed + ' start');
	let actions = 0;
	while (!state.flags.gameOver && actions < MAX_ACTIONS) {
		if (bot(state) === null) {
			break;
		}
		actions += 1;
		checkInvariants(state, 'seed ' + seed + ' action ' + actions);
	}
	return { state: state, actions: actions };
}

test('the bot plays whole years on seeds 1..25 without breaking invariants', function () {
	for (let seed = 1; seed <= 25; seed++) {
		const run = playout(seed);
		const state = run.state;
		ok(state.flags.gameOver, 'seed ' + seed + ': game ended within ' + MAX_ACTIONS + ' actions (took ' + run.actions + ')');
		ok(REASONS.indexOf(state.flags.reason) !== -1,
			'seed ' + seed + ': reason is one of won/year-end/bankrupt, got "' + state.flags.reason + '"');
		print('seed ' + seed + ' ' + state.flags.reason + ' day ' + state.day + ' cash ' + state.cash);
	}
});

test('determinism: seed 4 plays identically twice', function () {
	const a = playout(4).state;
	const b = playout(4).state;
	eq(JSON.stringify(a), JSON.stringify(b), 'seed 4 twice gives the identical final state');
});

done();
