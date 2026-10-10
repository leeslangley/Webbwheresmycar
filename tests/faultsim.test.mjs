// Tests for the fault roll, run under `jsc -m`.

import { seedRng } from '../src/core/rng.js';
import { rollFault, applyFault } from '../src/sim/faultsim.js';
import { test, eq, ok, done } from './harness.js';

function fresh(seed) {
	const state = {};
	seedRng(state, seed);
	return state;
}

const bad = { reliability: 2, tier: 1 };
const great = { reliability: 10, tier: 1 };
const condCar = { condition: 10 };
const wreck = { condition: 0 };

test('determinism: same seed gives the same 50 rolls', () => {
	const a = [];
	const b = [];
	let s1 = fresh(42);
	let s2 = fresh(42);
	for (let i = 0; i < 50; i++) {
		a.push(JSON.stringify(rollFault(s1, bad, wreck)));
		b.push(JSON.stringify(rollFault(s2, bad, wreck)));
	}
	eq(a, b, 'same seed, same results');
});

test('reliability 10 at condition 10 faults rarely (seed 3, 5000 rolls)', () => {
	const state = fresh(3);
	let faults = 0;
	for (let i = 0; i < 5000; i++) {
		if (rollFault(state, great, condCar) !== null) {
			faults++;
		}
	}
	ok(faults >= 60 && faults <= 150, 'expected 60-150 faults, got ' + faults);
});

test('reliability 2 at condition 0 faults often (seed 3, 5000 rolls)', () => {
	const state = fresh(3);
	let faults = 0;
	for (let i = 0; i < 5000; i++) {
		if (rollFault(state, bad, wreck) !== null) {
			faults++;
		}
	}
	ok(faults >= 1600 && faults <= 1900, 'expected 1600-1900 faults, got ' + faults);
});

test('mult 0 means never a fault (500 rolls)', () => {
	const state = fresh(7);
	for (let i = 0; i < 500; i++) {
		eq(rollFault(state, bad, wreck, 0), null, 'no fault with mult 0');
	}
});

function findGearbox(tier) {
	const model = { reliability: 2, tier: tier };
	for (let seed = 1; seed <= 60000; seed++) {
		const state = fresh(seed);
		const f = rollFault(state, model, wreck);
		if (f !== null && f.faultId === 'gearbox') {
			return f;
		}
	}
	return null;
}

test('gearbox costs 3200 for a tier 1 model', () => {
	const f = findGearbox(1);
	ok(f !== null, 'no gearbox found in seeds 1-60000');
	eq(f.cost, 3200, 'tier 1 gearbox cost');
});

test('gearbox costs 11200 for a tier 3 model', () => {
	const f = findGearbox(3);
	ok(f !== null, 'no gearbox found in seeds 1-60000');
	eq(f.cost, 11200, 'tier 3 gearbox cost');
});

function severityMix(condition) {
	const model = { reliability: 1, tier: 1 };
	const car = { condition: condition };
	const counts = { minor: 0, medium: 0, major: 0 };
	const state = fresh(11);
	let faults = 0;
	while (faults < 3000) {
		const f = rollFault(state, model, car);
		if (f !== null) {
			counts[f.severity]++;
			faults++;
		}
	}
	return counts;
}

test('condition 10 keeps major faults below 12%', () => {
	const c = severityMix(10);
	ok(c.major / 3000 < 0.12, 'major share ' + (c.major / 3000) + ' not below 12%');
});

test('condition 0 pushes major faults above 25%', () => {
	const c = severityMix(0);
	ok(c.major / 3000 > 0.25, 'major share ' + (c.major / 3000) + ' not above 25%');
});

test('costs are always multiples of 10 across tiers', () => {
	const state = fresh(99);
	const tiers = [1, 2, 3];
	for (let t = 0; t < tiers.length; t++) {
		const model = { reliability: 1, tier: tiers[t] };
		for (const condition of [0, 5, 10]) {
			const car = { condition: condition };
			for (let i = 0; i < 400; i++) {
				const f = rollFault(state, model, car);
				if (f !== null) {
					ok(f.cost % 10 === 0, 'cost ' + f.cost + ' not a multiple of 10');
				}
			}
		}
	}
});

test('applyFault sets the fields without sharing the object', () => {
	const car = { condition: 3, fault: null };
	const fault = { faultId: 'gearbox', label: 'Gearbox exploded', cost: 3200, severity: 'major' };
	const back = applyFault(car, fault);
	eq(car.fault, { faultId: 'gearbox', label: 'Gearbox exploded', cost: 3200 }, 'fields copied');
	eq(back, car, 'returns the car');
	ok(car.fault !== fault, 'must not share the fault object');
	car.fault.cost = 1;
	eq(fault.cost, 3200, 'mutating the copy must not touch the source');
});

done();
