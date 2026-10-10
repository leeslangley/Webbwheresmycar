// Tests for the faults table, run under `jsc -m`.

import { FAULTS, FAULT_BY_ID, faultsOfSeverity, TIER_MULT } from '../src/data/faults.js';
import { test, eq, ok, throws, done } from './harness.js';

test('FAULTS has exactly 24 faults', () => {
	ok(Array.isArray(FAULTS), 'FAULTS is an array');
	eq(FAULTS.length, 24, 'length');
});

test('8 faults of each severity', () => {
	const counts = { minor: 0, medium: 0, major: 0 };
	for (let i = 0; i < FAULTS.length; i++) {
		counts[FAULTS[i].severity] += 1;
	}
	eq(counts, { minor: 8, medium: 8, major: 8 }, 'severity counts');
});

test('ids are unique and present for every fault', () => {
	const seen = {};
	for (let i = 0; i < FAULTS.length; i++) {
		const id = FAULTS[i].id;
		ok(typeof id === 'string' && id.length > 0, 'fault ' + i + ' has an id');
		ok(!seen[id], 'id ' + id + ' is unique');
		seen[id] = true;
	}
});

test('FAULT_BY_ID.gearbox.baseCost is 3200', () => {
	eq(FAULT_BY_ID.gearbox.baseCost, 3200, 'gearbox baseCost');
});

test('FAULT_BY_ID.puncture.severity is minor', () => {
	eq(FAULT_BY_ID.puncture.severity, 'minor', 'puncture severity');
});

test('FAULT_BY_ID covers every fault and no extra keys', () => {
	eq(Object.keys(FAULT_BY_ID).length, 24, 'FAULT_BY_ID key count');
	for (let i = 0; i < FAULTS.length; i++) {
		eq(FAULT_BY_ID[FAULTS[i].id], FAULTS[i], 'FAULT_BY_ID[' + FAULTS[i].id + ']');
	}
});

test('faultsOfSeverity returns the 8 faults of that severity', () => {
	eq(faultsOfSeverity('major').length, 8, 'major count');
	eq(faultsOfSeverity('minor').length, 8, 'minor count');
	eq(faultsOfSeverity('medium').length, 8, 'medium count');
});

test('faultsOfSeverity with a bad severity throws', () => {
	throws(function () { faultsOfSeverity('x'); }, 'bad severity');
	throws(function () { faultsOfSeverity(''); }, 'empty severity');
});

test('texts are unique', () => {
	const seen = {};
	for (let i = 0; i < FAULTS.length; i++) {
		ok(!seen[FAULTS[i].text], 'text is unique: ' + FAULTS[i].text);
		seen[FAULTS[i].text] = true;
	}
});

test('each text has 5-20 words', () => {
	for (let i = 0; i < FAULTS.length; i++) {
		const words = FAULTS[i].text.split(/\s+/).filter(function (w) { return w.length > 0; });
		ok(words.length >= 5 && words.length <= 20, 'text word count 5-20 for ' + FAULTS[i].id);
	}
});

test('TIER_MULT[3] is 3.5', () => {
	eq(TIER_MULT[3], 3.5, 'tier 3 multiplier');
	eq(TIER_MULT[1], 1.0, 'tier 1 multiplier');
	eq(TIER_MULT[2], 1.8, 'tier 2 multiplier');
});

done();
