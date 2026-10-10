// Tests for the headlines aggregator, run under `jsc -m`.

import { GENERIC, CARWORLD, REACTIVE } from '../src/data/headlines.js';
import { test, eq, ok, done } from './harness.js';

test('GENERIC is an array of exactly 80 strings', () => {
	ok(Array.isArray(GENERIC), 'GENERIC is an array');
	eq(GENERIC.length, 80, 'exactly 80 generic headlines');
	for (let i = 0; i < GENERIC.length; i++) {
		eq(typeof GENERIC[i], 'string', 'generic headline ' + i + ' is a string');
	}
});

test('CARWORLD is an array of exactly 60 strings', () => {
	ok(Array.isArray(CARWORLD), 'CARWORLD is an array');
	eq(CARWORLD.length, 60, 'exactly 60 carworld headlines');
	for (let i = 0; i < CARWORLD.length; i++) {
		eq(typeof CARWORLD[i], 'string', 'carworld headline ' + i + ' is a string');
	}
});

test('the 140 strings have no duplicates case-insensitively', () => {
	const seen = {};
	const all = GENERIC.concat(CARWORLD);
	for (let i = 0; i < all.length; i++) {
		const key = all[i].toLowerCase();
		ok(!Object.prototype.hasOwnProperty.call(seen, key),
			'headline ' + i + ' is unique: "' + all[i] + '"');
		seen[key] = true;
	}
});

test('REACTIVE has exactly 9 situations', () => {
	ok(REACTIVE !== null && typeof REACTIVE === 'object', 'REACTIVE is an object');
	eq(Object.keys(REACTIVE).length, 9, 'exactly 9 reactive situations');
});

done();
