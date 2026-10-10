// Tests for month-end bills (DESIGN.md sections 4.9 and 4.2), run under
// `jsc -m`.

import { newGameState } from '../src/core/state.js';
import { monthEnd } from '../src/sim/month.js';
import { test, eq, ok, near, done } from './harness.js';

// A hand-made stable car with every field from DESIGN.md section 4.3.
function makeCar(id, modelId, owned, extra) {
	const car = {
		id: id,
		modelId: modelId,
		owned: owned,
		owner: owned ? '' : 'A Nother',
		rentMonthly: owned ? 0 : 1000,
		paid: owned ? 22000 : 0,
		condition: 10,
		fault: null,
		lastServiceDay: 0,
		jobsDone: 0,
		boughtDay: 1,
		impoundedUntil: 0,
		rentedAtCondition: owned ? 0 : 10,
	};
	if (extra) {
		for (const k in extra) {
			car[k] = extra[k];
		}
	}
	return car;
}

// The auction lots JSON after a monthEnd on a fresh state, for seed checks.
function lotsAfterMonthEnd(seed) {
	const state = newGameState(seed);
	state.day = 32;
	state.cars.push(makeCar('c1', 't2_serious', true, { condition: 0 }));
	state.cars.push(makeCar('c2', 't1_allergy', false, { rentMonthly: 900 }));
	monthEnd(state);
	return JSON.stringify(state.auction.lots);
}

// One owned Land Roamer Serious One (basePrice 22000, maintenance 4) at
// condition 10: running = round(4 * (60 + 55) * 1.0) = 460.
function seriousOwned(state, extra) {
	state.cars.push(makeCar('c1', 't2_serious', true, extra));
	return state.cars[0];
}

function rented(state, rent) {
	state.cars.push(makeCar('c2', 't1_allergy', false, { rentMonthly: rent }));
	return state.cars[state.cars.length - 1];
}

test('bills: rent 1000 + running 460 + lease 400 = 1860, cash 20000 -> 18140', () => {
	const state = newGameState(1);
	state.day = 32; // month-end after January
	seriousOwned(state, { condition: 10 });
	rented(state, 1000);
	const report = monthEnd(state, { skipFaults: true });
	eq(report.rent, 1000, 'rent is the rented car monthly rent');
	eq(report.running, 460, 'running cost of the owned car at condition 10');
	eq(report.lease, 400, 'garage lease is 400');
	eq(report.total, 1860, 'total is rent + running + lease');
	eq(report.cashAfter, 18140, 'cash 20000 minus 1860');
	eq(state.cash, 18140, 'state.cash matches');
	eq(report.month, 1, 'ended month is January (1)');
	eq(report.monthName, 'January', 'ended month name');
	eq(state.lastMonthReport, report, 'report stored on state.lastMonthReport');
	eq(state.flags.gameOver, false, 'not bankrupt');
});

test('empty stable: total is just the 400 lease', () => {
	const state = newGameState(2);
	state.day = 32;
	const report = monthEnd(state, { skipFaults: true });
	eq(report.rent, 0, 'no rent');
	eq(report.running, 0, 'no running cost');
	eq(report.lease, 400, 'lease still charged');
	eq(report.total, 400, 'total is lease only');
	eq(report.cashAfter, 19600, 'cash 20000 minus 400');
});

test('rented cars pay rent only, owned cars pay running only', () => {
	const state = newGameState(3);
	state.day = 32;
	rented(state, 1234);
	const report = monthEnd(state, { skipFaults: true });
	eq(report.rent, 1234, 'rent uses the car rentMonthly, only the rented car');
	eq(report.running, 0, 'rented car pays no running cost');
	eq(report.total, 1634, 'rent + lease only');

	const state2 = newGameState(4);
	state2.day = 32;
	seriousOwned(state2, { condition: 10 });
	const report2 = monthEnd(state2, { skipFaults: true });
	eq(report2.rent, 0, 'owned car pays no rent');
	eq(report2.running, 460, 'owned car pays running cost');
	eq(report2.total, 860, 'running + lease only');
});

test('owned car at condition 0 pays more running cost (maintMult 1.8)', () => {
	const state = newGameState(5);
	state.day = 32;
	seriousOwned(state, { condition: 0 });
	// round(4 * (60 + 55) * 1.8) = round(828) = 828
	const report = monthEnd(state, { skipFaults: true });
	eq(report.running, 828, 'running cost scaled by maintMult');
});

test('day handling: ended month comes from day - 1', () => {
	const state = newGameState(6);
	state.day = 32; // 1 February, so January ended
	eq(monthEnd(state, { skipFaults: true }).month, 1, 'day 32 -> month 1');
	eq(state.lastMonthReport.monthName, 'January', 'day 32 -> January');

	const state2 = newGameState(6);
	state2.day = 60; // 1 March, so February ended
	const r2 = monthEnd(state2, { skipFaults: true });
	eq(r2.month, 2, 'day 60 -> month 2');

	const state3 = newGameState(6);
	state3.day = 335; // 1 December, so November ended
	const r3 = monthEnd(state3, { skipFaults: true });
	eq(r3.month, 11, 'day 335 -> month 11');
	eq(r3.monthName, 'November', 'day 335 -> November');
});

test('bankrupt when cash ends below -2000', () => {
	const state = newGameState(7);
	state.day = 32;
	state.cash = 1000;
	// Bentlee Blowhard: basePrice 300000, maintenance 9, condition 0 ->
	// running = round(9 * (60 + 750) * 1.8) = 13122; total 13522.
	state.cars.push(makeCar('c1', 't3_blowhard', true, { condition: 0 }));
	const report = monthEnd(state, { skipFaults: true });
	eq(report.total, 13522, 'heavy stable bill');
	ok(report.cashAfter < -2000, 'cash ends below -2000');
	eq(state.flags.gameOver, true, 'game over');
	eq(state.flags.won, false, 'not won');
	eq(state.flags.reason, 'bankrupt', 'reason is bankrupt');
});

test('cash ending at exactly -2000 is NOT bankrupt', () => {
	const state = newGameState(8);
	state.day = 32;
	state.cash = -1600; // empty stable: -1600 - 400 lease = -2000 exactly
	const report = monthEnd(state, { skipFaults: true });
	eq(report.cashAfter, -2000, 'cash ends at exactly -2000');
	eq(state.flags.gameOver, false, 'not bankrupt at exactly -2000');
	eq(state.flags.reason, '', 'no reason set');
});

test('cash ending just below -2000 IS bankrupt', () => {
	const state = newGameState(9);
	state.day = 32;
	state.cash = -1601; // empty stable: -1601 - 400 = -2001
	const report = monthEnd(state, { skipFaults: true });
	eq(report.cashAfter, -2001, 'cash ends at -2001');
	eq(state.flags.gameOver, true, 'bankrupt just below the limit');
});

test('over seeds 1..200 at least 20 seeds produce a month-end fault', () => {
	let seedsWithFault = 0;
	let totalFaults = 0;
	for (let seed = 1; seed <= 200; seed++) {
		const state = newGameState(seed);
		state.day = 32;
		// Austen Allergy: reliability 2, at condition 0 -> effR 0.6.
		state.cars.push(makeCar('c1', 't1_allergy', true, { condition: 0 }));
		const report = monthEnd(state);
		eq(state.stats.faults, report.newFaults.length, 'seed ' + seed + ': stats.faults matches newFaults');
		totalFaults += report.newFaults.length;
		if (report.newFaults.length > 0) {
			seedsWithFault++;
		}
	}
	ok(seedsWithFault >= 20, 'at least 20 of 200 seeds produce a fault, got ' + seedsWithFault);
	ok(totalFaults >= seedsWithFault, 'every fault recorded');
});

test('a faulted car gets car.fault set and is listed in newFaults', () => {
	// Find a seed where the roll fires, then check the car state.
	for (let seed = 1; seed <= 200; seed++) {
		const state = newGameState(seed);
		state.day = 32;
		state.cars.push(makeCar('c1', 't1_allergy', true, { condition: 0 }));
		const report = monthEnd(state);
		if (report.newFaults.length > 0) {
			ok(state.cars[0].fault !== null, 'car.fault set');
			ok(state.cars[0].fault.cost > 0, 'fault has a cost');
			ok(report.newFaults[0].indexOf('Austen Allergy: ') === 0, 'newFaults entry starts with model name');
			eq(state.stats.faults, 1, 'stats.faults incremented');
			return;
		}
	}
	ok(false, 'no fault found in seeds 1..200 (should be impossible)');
});

test('cars that already have a fault are not rolled again', () => {
	const state = newGameState(11);
	state.day = 32;
	state.cars.push(makeCar('c1', 't1_allergy', true, { condition: 0, fault: { faultId: 'puncture', label: 'Puncture', cost: 90 } }));
	const before = JSON.stringify(state.cars[0].fault);
	const report = monthEnd(state);
	eq(report.newFaults.length, 0, 'no new faults for already-faulted car');
	eq(state.stats.faults, 0, 'stats.faults unchanged');
	eq(JSON.stringify(state.cars[0].fault), before, 'existing fault untouched');
});

test('skipFaults: true never rolls faults', () => {
	for (let seed = 1; seed <= 50; seed++) {
		const state = newGameState(seed);
		state.day = 32;
		state.cars.push(makeCar('c1', 't1_allergy', true, { condition: 0 }));
		const report = monthEnd(state, { skipFaults: true });
		eq(report.newFaults.length, 0, 'seed ' + seed + ': no faults with skipFaults');
		eq(state.stats.faults, 0, 'seed ' + seed + ': stats.faults untouched');
		eq(state.cars[0].fault, null, 'seed ' + seed + ': car has no fault');
	}
});

test('priceMult drifts and stays within 0.85..1.25 over 200 calls', () => {
	const state = newGameState(12);
	state.day = 32;
	eq(state.market.priceMult, 1, 'starts at 1');
	for (let i = 0; i < 200; i++) {
		monthEnd(state, { skipFaults: true });
		const p = state.market.priceMult;
		ok(p >= 0.85 && p <= 1.25, 'priceMult in range after call ' + i + ': ' + p);
	}
});

test('priceMult actually moves and is rounded to 0.001', () => {
	let moved = false;
	for (let seed = 1; seed <= 30; seed++) {
		const state = newGameState(seed);
		state.day = 32;
		const before = state.market.priceMult;
		monthEnd(state, { skipFaults: true });
		const after = state.market.priceMult;
		if (after !== before) {
			moved = true;
		}
		near(after * 1000, Math.round(after * 1000), 1e-9, 'seed ' + seed + ': priceMult rounded to 0.001');
	}
	ok(moved, 'priceMult moved at least once over 30 seeds');
});

test('auction prepared: 6 lots and month set for the new month', () => {
	const state = newGameState(13);
	state.day = 32; // 1 February
	monthEnd(state, { skipFaults: true });
	eq(state.auction.lots.length, 6, '6 lots prepared');
	eq(state.auction.month, 2, 'auction month is the NEW month (2)');
	eq(state.auction.lastResults, [], 'lastResults cleared');
});

test('same seed gives the same report', () => {
	function run(seed) {
		const state = newGameState(seed);
		state.day = 32;
		state.cars.push(makeCar('c1', 't2_serious', true, { condition: 0 }));
		state.cars.push(makeCar('c2', 't1_allergy', false, { rentMonthly: 900 }));
		return monthEnd(state);
	}
	const a = run(42);
	const b = run(42);
	eq(JSON.stringify(a), JSON.stringify(b), 'identical reports for the same seed');
	// The prepared lots must match between same-seed runs too (a run with
	// faults firing leaves the stable dirty, so a fresh state is used).
	const lotsA = lotsAfterMonthEnd(42);
	const lotsB = lotsAfterMonthEnd(42);
	eq(lotsA, lotsB, 'identical auction lots for the same seed');
});

test('cash going below zero only happens at month-end bills (no rounding drift)', () => {
	const state = newGameState(14);
	state.day = 32;
	state.cars.push(makeCar('c1', 't2_serious', true, { condition: 10 }));
	rented(state, 333);
	const report = monthEnd(state, { skipFaults: true });
	ok(Number.isInteger(report.total), 'total is an integer');
	ok(Number.isInteger(report.cashAfter), 'cashAfter is an integer');
	eq(report.rent, 333, 'rent uses the car rentMonthly as given');
	eq(report.cashAfter, 20000 - 333 - 460 - 400, 'cash adds up');
});

done();
