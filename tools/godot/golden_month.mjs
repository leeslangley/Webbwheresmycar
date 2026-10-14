// Golden fixture for godot/sim/month.gd (GDS11): month-end bills, fault rolls, market drift, next auction, bankruptcy.
// Runs src/sim/month.js under macOS jsc -m.
// Run by: sh tools/godot/golden_run.sh month   (writes godot/tests/golden/month.json)

import { monthEnd } from '../../src/sim/month.js';
import { fresh, addCar, stateCase, emitCases } from './golden_sim.mjs';

// Standard month-end set-up: three owned cars (one already broken) and one rented car.
function setup(seed, day) {
	const s = fresh(seed);
	s.day = day;
	addCar(s, 't1_allergy', { condition: 6 });
	addCar(s, 't2_serious', { condition: 3.5, fault: { faultId: 'puncture', label: 'Puncture', cost: 90 } });
	addCar(s, 't3_porshe', { condition: 8 });
	addCar(s, 't1_robbin', { owned: false, owner: 'Big Baz', rentMonthly: 260, rentedAtCondition: 5, condition: 4 });
	return s;
}

const cases = [];

// Seeds 1..6 at the end of January (day 32), no options.
for (let seed = 1; seed <= 6; seed++) {
	cases.push(stateCase('month_end', 'seed ' + seed + ' day 32', setup(seed, 32), [{}],
		(s, o) => monthEnd(s, o)));
}

// Seeds 1..3 at the end of February (day 60) and seeds 1..2 at the end of November (day 335).
for (let seed = 1; seed <= 3; seed++) {
	cases.push(stateCase('month_end', 'seed ' + seed + ' day 60', setup(seed, 60), [{}],
		(s, o) => monthEnd(s, o)));
}
for (let seed = 1; seed <= 2; seed++) {
	cases.push(stateCase('month_end', 'seed ' + seed + ' day 335', setup(seed, 335), [{}],
		(s, o) => monthEnd(s, o)));
}

// Fault rolls skipped.
cases.push(stateCase('month_end', 'seed 4 skipFaults', setup(4, 32), [{ skipFaults: true }],
	(s, o) => monthEnd(s, o)));

// No cars at all: only the lease is charged.
{
	const s = fresh(5);
	s.day = 32;
	cases.push(stateCase('month_end', 'no cars', s, [{}], (st, o) => monthEnd(st, o)));
}

// Bankruptcy: bills push cash below the overdraft limit.
{
	const s = setup(6, 32);
	s.cash = -1500;
	cases.push(stateCase('month_end', 'bankrupt', s, [{}], (st, o) => monthEnd(st, o)));
}

// Not bankrupt: a rich firm.
{
	const s = setup(6, 32);
	s.cash = 100000;
	cases.push(stateCase('month_end', 'not bankrupt', s, [{}], (st, o) => monthEnd(st, o)));
}

// The fixture must show both a month with new faults and a bankrupt run, or it is not testing the port.
const withFaults = cases.filter((k) => k.result.newFaults.length > 0).length;
const bankrupt = cases.filter((k) => k.after.flags.reason === 'bankrupt').length;
if (withFaults === 0) {
	throw new Error('month golden: no run has new faults');
}
if (bankrupt === 0) {
	throw new Error('month golden: no run ends bankrupt');
}

emitCases('month', cases);
