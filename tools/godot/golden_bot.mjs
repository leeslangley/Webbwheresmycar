// Scripted bot for the Godot parity playthrough (GDS21): a port of the bot() priority rules in
// tests/playthrough.test.mjs, plus runBot. Each call picks one action by priority and runs it through
// dispatch (golden_dispatch.mjs, the Game.act table). Recorded params use the GODOT keys (snake_case),
// as Game.act takes them. Imported by golden_playthrough.mjs only (no output of its own).

import { isAuctionDay } from '../../src/core/clock.js';
import { modelOf } from '../../src/data/cars.js';
import { effD, effR, isAvailable } from '../../src/sim/carstats.js';
import { dispatch } from './golden_dispatch.mjs';
import { clone } from './golden_sim.mjs';

// JS camelCase param keys -> Godot snake_case keys (listingId -> listing_id). Other keys are unchanged.
function godotParams(p) {
	const out = {};
	for (const k of Object.keys(p)) {
		out[k.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase())] = p[k];
	}
	return out;
}

// [action, params (JS keys)] for the next bot call, or null once the year is over.
export function chooseAction(state) {
	if (state.flags.gameOver) {
		return null;
	}

	// (2) auction day: settle the whole visit in one action.
	if (isAuctionDay(state.day)) {
		return ['attend_auction', {}];
	}

	// (3) no cars at all: buy the cheapest sale listing we can afford.
	if (state.cars.length === 0) {
		let best = null;
		for (const l of state.shop.listings) {
			if (l.mode === 'sale' && l.price <= state.cash && (best === null || l.price < best.price)) {
				best = l;
			}
		}
		if (best === null) {
			return ['wait_day', {}];
		}
		return ['buy_car', { listingId: best.listingId }];
	}

	// (4) a faulty car we can afford to fix: fix it.
	for (const car of state.cars) {
		if (car.fault && state.cash >= car.fault.cost) {
			return ['fix_fault', { carId: car.id }];
		}
	}

	// (5) the highest-fee open booking some available car can legally take.
	let bestReq = null;
	let bestCar = null;
	for (const req of state.requests) {
		if (req.expiresDay < state.day) {
			continue;
		}
		for (const car of state.cars) {
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
		return ['accept_job', { requestId: bestReq.id, carId: bestCar.id }];
	}

	// (6) money to burn and no hype: take out a magazine ad.
	if (state.cash > 6000 && state.buzz < 20) {
		return ['advertise', { mediaId: 'magazine' }];
	}

	// (7) a shabby car and the cash for a full service.
	for (const car of state.cars) {
		if (car.condition < 4 && state.cash > 400) {
			return ['service_car', { carId: car.id, kind: 'full' }];
		}
	}

	// (8) nothing worth doing: the kettle goes on.
	return ['wait_day', {}];
}

// Runs up to maxCalls bot calls on state. Each call is one dispatch; a refused dispatch (ok false) is
// followed by a wait_day dispatch, so one bot call costs one day. Returns the recorded steps:
// { action, params (Godot keys), result, day, cash, reputation, buzz, cars, gameOver } taken after each dispatch.
export function runBot(state, maxCalls) {
	const steps = [];
	const record = (action, params, r) => {
		steps.push({
			action: action,
			params: godotParams(params),
			result: r === undefined ? null : clone(r),
			day: state.day,
			cash: state.cash,
			reputation: state.reputation,
			buzz: state.buzz,
			cars: state.cars.length,
			gameOver: state.flags.gameOver,
		});
	};
	for (let call = 0; call < maxCalls; call++) {
		const a = chooseAction(state);
		if (a === null) {
			break;
		}
		const r = dispatch(state, a[0], a[1]);
		record(a[0], a[1], r);
		if (!r.ok) {
			const w = dispatch(state, 'wait_day', {});
			record('wait_day', {}, w);
		}
	}
	return steps;
}
