// Tests for car stats and condition maths, run under `jsc -m`.

import { modelOf } from '../src/data/cars.js';
import {
	effD, effR, maintMult, valueFactor, marketValue, runningCost,
	idleDecay, changeCondition, isAvailable
} from '../src/sim/carstats.js';
import { test, eq, ok, near, done } from './harness.js';

const serious = modelOf('t2_serious'); // D5 M4 R5, basePrice 22000
const maurice = modelOf('t1_maurice'); // D3 M2 R4
const aston = modelOf('t3_aston'); // D10 R5

function car(condition, extra) {
	const c = { condition: condition, fault: null, impoundedUntil: 0 };
	if (extra) {
		const keys = Object.keys(extra);
		for (let i = 0; i < keys.length; i++) {
			c[keys[i]] = extra[keys[i]];
		}
	}
	return c;
}

test('t2_serious runningCost at conditions 10, 5 and 0', () => {
	near(runningCost(serious, car(10)), 460, 1e-9, 'cond 10');
	near(runningCost(serious, car(5)), 644, 1e-9, 'cond 5');
	near(runningCost(serious, car(0)), 828, 1e-9, 'cond 0');
});

test('t2_serious marketValue at conditions 10, 5 and 0 with priceMult 1', () => {
	const state = { market: { priceMult: 1 } };
	near(marketValue(state, serious, car(10)), 22000, 1e-9, 'cond 10');
	near(marketValue(state, serious, car(5)), 16500, 1e-9, 'cond 5');
	near(marketValue(state, serious, car(0)), 11000, 1e-9, 'cond 0');
});

test('t2_serious marketValue with priceMult 1.2 at condition 10', () => {
	const state = { market: { priceMult: 1.2 } };
	near(marketValue(state, serious, car(10)), 26400, 1e-9, 'cond 10, mult 1.2');
});

test('t1_maurice effD at conditions 10 and 0', () => {
	near(effD(maurice, car(10)), 3, 1e-9, 'cond 10');
	near(effD(maurice, car(0)), 1.2, 1e-9, 'cond 0');
});

test('t1_maurice effR at conditions 10 and 5', () => {
	near(effR(maurice, car(10)), 4, 1e-9, 'cond 10');
	near(effR(maurice, car(5)), 2.6, 1e-9, 'cond 5');
});

test('t1_maurice idleDecay is 0.022', () => {
	near(idleDecay(maurice), 0.022, 1e-9, 'idleDecay');
});

test('t3_aston effD at condition 5 is 7', () => {
	near(effD(aston, car(5)), 7, 1e-9, 'effD cond 5');
});

test('t3_aston effR at condition 10 is 5', () => {
	near(effR(aston, car(10)), 5, 1e-9, 'effR cond 10');
});

test('maintMult at conditions 10 and 0', () => {
	near(maintMult(car(10)), 1, 1e-9, 'cond 10');
	near(maintMult(car(0)), 1.8, 1e-9, 'cond 0');
});

test('valueFactor works on any object with a condition', () => {
	near(valueFactor({ condition: 4 }), 0.7, 1e-9, 'listing-like object');
});

test('changeCondition clamps high and low and rounds to 0.01', () => {
	eq(changeCondition(car(9.5), 2), 10, '9.5 + 2 clamps to 10');
	eq(changeCondition(car(0.3), -1), 0, '0.3 - 1 clamps to 0');
	near(changeCondition(car(5), 0.123), 5.12, 1e-9, '5 + 0.123 rounds to 5.12');
});

test('changeCondition mutates the car and stays within 0-10', () => {
	const c = car(7);
	eq(changeCondition(c, -2.5), 4.5, 'returns new condition');
	eq(c.condition, 4.5, 'car.condition updated');
});

test('isAvailable with no fault and no impound', () => {
	ok(isAvailable({ day: 100 }, car(5)), 'clean car is available');
});

test('isAvailable with a fault', () => {
	ok(!isAvailable({ day: 100 }, car(5, { fault: { faultId: 'clutch', label: 'Clutch', cost: 900 } })), 'faulty car is not available');
});

test('isAvailable with impoundedUntil in the future and today', () => {
	ok(!isAvailable({ day: 100 }, car(5, { impoundedUntil: 101 })), 'impounded tomorrow is not available');
	ok(isAvailable({ day: 100 }, car(5, { impoundedUntil: 100 })), 'impound ending today is available');
});

test('isAvailable treats a missing impoundedUntil as 0', () => {
	ok(isAvailable({ day: 1 }, { condition: 5, fault: null }), 'missing impoundedUntil is available');
});

done();
