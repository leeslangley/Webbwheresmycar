// Tests for the garage actions (DESIGN.md section 4.5), run under `jsc -m`.
//
// Costs (DESIGN.md 4.5) for the two catalogue cars used here:
//   t2_serious  basePrice 22000: quick = round(40 + 44)    = 84,
//                                full  = round(150 + 176)  = 326,
//                                restore = max(1200, 1320) = 1320.
//   t1_allergy  basePrice 3500:  restore = max(1200, 210)  = 1200 (minimum).
//
// Overnight note: every success calls advanceDay, which lets each car rot
// a little (idleDecay). t2_serious (reliability 5) loses 0.02 and
// t1_allergy (reliability 2) loses 0.026 -> 0.03 after rounding, so the
// service gains (+1.0, +2.5, +0.5) are checked with that decay already
// taken off. The full-service clamp is still proven: 8.0 + 2.5 unclamped
// would read 10.48, never 9.98.

import { newGameState } from '../src/core/state.js';
import { initShop } from '../src/sim/shop.js';
import { prepareAuction } from '../src/sim/auction.js';
import { modelOf } from '../src/data/cars.js';
import { idleDecay } from '../src/sim/carstats.js';
import { serviceCar, fixFault, restoreCar } from '../src/sim/garage.js';
import { test, eq, ok, near, done } from './harness.js';

// A fresh state with the shop and the month-one auction already set up,
// as a player's first morning would look.
function freshState() {
	const state = newGameState(7);
	initShop(state);
	prepareAuction(state);
	return state;
}

// Add one stable car and return it.
function addCar(state, modelId, condition, extra) {
	const car = {
		id: 'c1', modelId: modelId, owned: true, owner: '',
		rentMonthly: 0, paid: 0, condition: condition, fault: null,
		lastServiceDay: 0, jobsDone: 0, boughtDay: 1, impoundedUntil: 0,
		rentedAtCondition: 0,
	};
	if (extra) {
		const keys = Object.keys(extra);
		for (let i = 0; i < keys.length; i++) {
			car[keys[i]] = extra[keys[i]];
		}
	}
	state.cars.push(car);
	return car;
}

function hasEvent(state, text) {
	const events = state.today.events;
	for (let i = 0; i < events.length; i++) {
		if (events[i].indexOf(text) !== -1) {
			return true;
		}
	}
	return false;
}

const serious = modelOf('t2_serious');
const allergy = modelOf('t1_allergy');
const SERIOUS_DECAY = idleDecay(serious); // 0.02
const ALLERGY_DECAY = Math.round(idleDecay(allergy) * 100) / 100; // 0.03

// (a) Costs, from the formulas in DESIGN.md 4.5.
test('costs: quick 84, full 326, restore 1320 (t2_serious), restore 1200 (t1_allergy)', () => {
	eq(Math.round(40 + serious.basePrice * 0.002), 84, 'quick cost');
	eq(Math.round(150 + serious.basePrice * 0.008), 326, 'full cost');
	eq(Math.max(1200, Math.round(serious.basePrice * 0.06)), 1320, 'restore serious');
	eq(Math.max(1200, Math.round(allergy.basePrice * 0.06)), 1200, 'restore minimum');
});

// (b) Quick tinker on condition 5: +1.0 (6.0 less the night's decay),
// cash down by exactly 84, one day passes, message in today.events.
test('quick tinker: condition 5 gains +1.0, costs 84, one day', () => {
	const state = freshState();
	const car = addCar(state, 't2_serious', 5);
	const r = serviceCar(state, 'c1', 'quick');
	eq(r.ok, true, 'ok');
	near(car.condition, 6.0 - SERIOUS_DECAY, 1e-9, 'condition 5 -> 6.0 less decay');
	eq(state.cash, 20000 - 84, 'cash down by 84');
	eq(state.day, 2, 'one day passed');
	ok(hasEvent(state, 'Quick tinker'), 'message in today.events');
	eq(car.fault, null, 'no fault invented');
});

// (c) Full service at 8.0: +2.5 clamps to 10, lastServiceDay set, cost 326.
test('full service: 8.0 clamps to 10, lastServiceDay set, costs 326', () => {
	const state = freshState();
	const car = addCar(state, 't2_serious', 8);
	const r = serviceCar(state, 'c1', 'full');
	eq(r.ok, true, 'ok');
	near(car.condition, 10 - SERIOUS_DECAY, 1e-9, '8.0 + 2.5 clamps to 10 (less decay)');
	eq(car.lastServiceDay, 1, 'lastServiceDay set to the service day');
	eq(state.cash, 20000 - 326, 'cash down by 326');
	eq(state.day, 2, 'one day passed');
	ok(hasEvent(state, 'Full service'), 'message in today.events');
});

// (d) Full service on a car already at 10 is refused: nothing changes.
test('full service at condition 10 refused: Already perfect, no day', () => {
	const state = freshState();
	addCar(state, 't2_serious', 10);
	const r = serviceCar(state, 'c1', 'full');
	eq(r.ok, false, 'refused');
	eq(r.msg, 'Already perfect', 'message');
	eq(state.day, 1, 'no day passed');
	eq(state.cash, 20000, 'cash untouched');
	eq(state.pending.length, 0, 'nothing queued');
	eq(state.today.events.length, 0, 'no events');
});

// (e) Servicing never touches an existing fault.
test('quick and full leave an existing fault in place', () => {
	const fault = { faultId: 'puncture', label: 'Puncture', severity: 'minor', cost: 90 };
	const state = freshState();
	const car = addCar(state, 't2_serious', 5, { fault: fault });
	serviceCar(state, 'c1', 'quick');
	eq(car.fault, fault, 'quick keeps the fault');
	const state2 = freshState();
	const car2 = addCar(state2, 't2_serious', 5, { fault: fault });
	serviceCar(state2, 'c1', 'full');
	eq(car2.fault, fault, 'full keeps the fault');
});

// (f) A made-up treatment is refused.
test('bad kind refused', () => {
	const state = freshState();
	addCar(state, 't2_serious', 5);
	const r = serviceCar(state, 'c1', 'polish');
	eq(r.ok, false, 'refused');
	eq(state.day, 1, 'no day passed');
	eq(state.cash, 20000, 'cash untouched');
});

// (g) Unknown car ids are refused by all three actions.
test('unknown car refused: No such car', () => {
	const state = freshState();
	eq(serviceCar(state, 'nonesuch', 'quick').msg, 'No such car', 'serviceCar');
	eq(fixFault(state, 'nonesuch').msg, 'No such car', 'fixFault');
	eq(restoreCar(state, 'nonesuch').msg, 'No such car', 'restoreCar');
	eq(state.day, 1, 'no day passed');
});

// (h) Fix fault: costs the fault's cost, clears it, +0.5 condition.
test('fixFault: cost 90, fault cleared, condition +0.5, one day', () => {
	const state = freshState();
	const car = addCar(state, 't2_serious', 5, {
		fault: { faultId: 'puncture', label: 'Puncture', severity: 'minor', cost: 90 },
	});
	const r = fixFault(state, 'c1');
	eq(r.ok, true, 'ok');
	eq(car.fault, null, 'fault cleared');
	eq(state.cash, 20000 - 90, 'cash down by the fault cost');
	near(car.condition, 5.5 - SERIOUS_DECAY, 1e-9, 'condition +0.5');
	eq(state.day, 2, 'one day passed');
	ok(hasEvent(state, 'Puncture'), 'message in today.events');
});

// (i) Fix fault with nothing to fix is refused.
test('fixFault with no fault refused: Nothing to fix, no day', () => {
	const state = freshState();
	addCar(state, 't2_serious', 5);
	const r = fixFault(state, 'c1');
	eq(r.ok, false, 'refused');
	eq(r.msg, 'Nothing to fix', 'message');
	eq(state.day, 1, 'no day passed');
	eq(state.cash, 20000, 'cash untouched');
});

// (j) Full restoration: condition 10, fault cleared, service book signed.
test('restore: t2_serious costs 1320, sets condition 10 and clears the fault', () => {
	const state = freshState();
	const car = addCar(state, 't2_serious', 3, {
		fault: { faultId: 'batterydead', label: 'Flat battery', severity: 'minor', cost: 110 },
	});
	const r = restoreCar(state, 'c1');
	eq(r.ok, true, 'ok');
	near(car.condition, 10 - SERIOUS_DECAY, 1e-9, 'condition set to 10 (less decay)');
	eq(car.fault, null, 'fault cleared');
	eq(car.lastServiceDay, 1, 'lastServiceDay set');
	eq(state.cash, 20000 - 1320, 'cash down by 1320');
	eq(state.day, 2, 'one day passed');
	ok(hasEvent(state, 'restoration'), 'message in today.events');
});

// (k) The £1,200 minimum: a cheap car's 6% is only £210, so £1,200 applies.
test('restore: t1_allergy costs the 1200 minimum', () => {
	const state = freshState();
	const car = addCar(state, 't1_allergy', 4);
	const r = restoreCar(state, 'c1');
	eq(r.ok, true, 'ok');
	eq(state.cash, 20000 - 1200, 'cash down by the 1200 minimum');
	near(car.condition, 10 - ALLERGY_DECAY, 1e-9, 'condition set to 10 (less decay)');
	eq(state.day, 2, 'one day passed');
});

// (l) A restoration of an already perfect car is refused.
test('restore at condition 10 with no fault refused', () => {
	const state = freshState();
	addCar(state, 't2_serious', 10);
	const r = restoreCar(state, 'c1');
	eq(r.ok, false, 'refused');
	eq(state.day, 1, 'no day passed');
	eq(state.cash, 20000, 'cash untouched');
});

// (m) Short of money: every action refuses and nothing changes.
test('insufficient cash refused: Not enough money, no day, no change', () => {
	const state = freshState();
	const car = addCar(state, 't2_serious', 5);
	state.cash = 50;
	let r = serviceCar(state, 'c1', 'quick');
	eq(r.msg, 'Not enough money', 'quick refused');
	r = serviceCar(state, 'c1', 'full');
	eq(r.msg, 'Not enough money', 'full refused');
	car.fault = { faultId: 'puncture', label: 'Puncture', severity: 'minor', cost: 90 };
	r = fixFault(state, 'c1');
	eq(r.msg, 'Not enough money', 'fixFault refused');
	eq(car.fault && car.fault.cost, 90, 'fault still there');
	state.cash = 1199;
	r = restoreCar(state, 'c1');
	eq(r.msg, 'Not enough money', 'restore refused');
	eq(state.day, 1, 'no day passed');
	eq(state.cash, 1199, 'cash untouched');
	near(car.condition, 5, 1e-9, 'condition untouched');
});

// (n) Every success adds exactly one day, checked across all three actions.
test('every success adds exactly 1 day', () => {
	const state = freshState();
	addCar(state, 't2_serious', 5);
	eq(serviceCar(state, 'c1', 'quick').ok && state.day, 2, 'quick: day 1 -> 2');
	eq(serviceCar(state, 'c1', 'full').ok && state.day, 3, 'full: day 2 -> 3');
	const state2 = freshState();
	addCar(state2, 't2_serious', 5, {
		fault: { faultId: 'puncture', label: 'Puncture', severity: 'minor', cost: 90 },
	});
	fixFault(state2, 'c1');
	eq(state2.day, 2, 'fixFault: day 1 -> 2');
	const state3 = freshState();
	addCar(state3, 't2_serious', 3);
	restoreCar(state3, 'c1');
	eq(state3.day, 2, 'restore: day 1 -> 2');
});

// (o) A made-up treatment is refused whatever the kind: undefined, empty.
test('missing or empty kind refused, no day', () => {
	const state = freshState();
	addCar(state, 't2_serious', 5);
	eq(serviceCar(state, 'c1').ok, false, 'kind undefined refused');
	eq(serviceCar(state, 'c1', '').ok, false, 'empty kind refused');
	eq(state.day, 1, 'no day passed');
});

// (p) Cash exactly equal to the cost still buys the work.
test('cash exactly equal to the cost is enough', () => {
	const state = freshState();
	addCar(state, 't2_serious', 5);
	state.cash = 84;
	eq(serviceCar(state, 'c1', 'quick').ok, true, 'exact cash allowed');
	eq(state.cash, 0, 'cash emptied');
});

// (q) A perfect car that still has a fault can be restored.
test('restore at condition 10 with a fault is allowed', () => {
	const state = freshState();
	const car = addCar(state, 't2_serious', 10, {
		fault: { faultId: 'puncture', label: 'Puncture', severity: 'minor', cost: 90 },
	});
	eq(restoreCar(state, 'c1').ok, true, 'allowed: the fault needs seeing to');
	eq(car.fault, null, 'fault cleared');
	near(car.condition, 10 - SERIOUS_DECAY, 1e-9, 'condition stays 10 (less decay)');
});

// (r) The advanceDay tray is emptied: nothing stays in pending.
test('success drains the pending tray', () => {
	const state = freshState();
	addCar(state, 't2_serious', 5);
	serviceCar(state, 'c1', 'quick');
	eq(state.pending.length, 0, 'pending emptied');
	ok(hasEvent(state, 'Quick tinker'), 'message landed in today.events');
});

done();
