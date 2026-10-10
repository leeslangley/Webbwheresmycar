// Tests for src/data/owners.js and src/data/names.js, run under `jsc -m`.

import { OWNERS, ownerName } from '../src/data/owners.js';
import { FIRST, LAST, PREFIX, customerName } from '../src/data/names.js';
import { seedRng } from '../src/core/rng.js';
import { test, eq, ok, done } from './harness.js';

function state(seed) {
	const s = { rng: 0 };
	seedRng(s, seed);
	return s;
}

function allUnique(arr) {
	for (let i = 0; i < arr.length; i++) {
		for (let j = i + 1; j < arr.length; j++) {
			if (arr[i] === arr[j]) {
				return false;
			}
		}
	}
	return true;
}

test('OWNERS has exactly 24 unique names, each 8-40 characters', () => {
	ok(Array.isArray(OWNERS), 'OWNERS is an array');
	eq(OWNERS.length, 24, 'OWNERS length');
	ok(allUnique(OWNERS), 'OWNERS entries are unique');
	for (let i = 0; i < OWNERS.length; i++) {
		eq(typeof OWNERS[i], 'string', 'owner ' + i + ' is a string');
		ok(OWNERS[i].length >= 8 && OWNERS[i].length <= 40, 'owner "' + OWNERS[i] + '" length ' + OWNERS[i].length + ' is 8-40');
	}
});

test('FIRST has exactly 40 unique names', () => {
	eq(FIRST.length, 40, 'FIRST length');
	ok(allUnique(FIRST), 'FIRST entries are unique');
	for (let i = 0; i < FIRST.length; i++) {
		ok(FIRST[i].length > 0, 'FIRST entry ' + i + ' is non-empty');
	}
});

test('LAST has exactly 40 unique surnames', () => {
	eq(LAST.length, 40, 'LAST length');
	ok(allUnique(LAST), 'LAST entries are unique');
	for (let i = 0; i < LAST.length; i++) {
		ok(LAST[i].length > 0, 'LAST entry ' + i + ' is non-empty');
	}
});

test('PREFIX matches the eight titles from the design', () => {
	eq(PREFIX, ['Mr', 'Mrs', 'Ms', 'Dr', 'Sir', 'Lady', 'Captain', 'Reverend'], 'PREFIX contents');
});

test('same seed gives the same 20 customerName calls', () => {
	const a = state(12345);
	const b = state(12345);
	const seqA = [];
	const seqB = [];
	for (let i = 0; i < 20; i++) {
		seqA.push(customerName(a));
		seqB.push(customerName(b));
	}
	eq(seqA, seqB, 'same seed, same 20 names');
});

test('300 calls with seed 7 produce at least 60 distinct names', () => {
	const s = state(7);
	const seen = [];
	for (let i = 0; i < 300; i++) {
		const n = customerName(s);
		if (seen.indexOf(n) === -1) {
			seen.push(n);
		}
	}
	ok(seen.length >= 60, 'distinct names ' + seen.length + ' < 60');
});

test('every customerName result is non-empty and contains a space', () => {
	const s = state(2024);
	for (let i = 0; i < 500; i++) {
		const n = customerName(s);
		ok(typeof n === 'string' && n.length > 0, 'call ' + i + ' returned non-empty string');
		ok(n.indexOf(' ') !== -1, 'name "' + n + '" has a space');
	}
});

test('ownerName returns a member of OWNERS', () => {
	const s = state(99);
	for (let i = 0; i < 50; i++) {
		const o = ownerName(s);
		ok(OWNERS.indexOf(o) !== -1, 'ownerName returned non-member: ' + o);
	}
});

done();
