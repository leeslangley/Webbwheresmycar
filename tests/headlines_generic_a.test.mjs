// Tests for the generic_a headline pool, run under `jsc -m`.

import { HEADLINES_GENERIC_A } from '../src/data/headlines_generic_a.js';
import { test, eq, ok, done } from './harness.js';

test('HEADLINES_GENERIC_A is an array of exactly 40 strings', () => {
	ok(Array.isArray(HEADLINES_GENERIC_A), 'HEADLINES_GENERIC_A is an array');
	eq(HEADLINES_GENERIC_A.length, 40, 'exactly 40 headlines');
	for (let i = 0; i < HEADLINES_GENERIC_A.length; i++) {
		eq(typeof HEADLINES_GENERIC_A[i], 'string', 'headline ' + i + ' is a string');
	}
});

test('all headlines are unique, case-insensitively', () => {
	const seen = {};
	for (let i = 0; i < HEADLINES_GENERIC_A.length; i++) {
		const key = HEADLINES_GENERIC_A[i].toLowerCase();
		ok(!Object.prototype.hasOwnProperty.call(seen, key),
			'headline ' + i + ' is unique: "' + HEADLINES_GENERIC_A[i] + '"');
		seen[key] = true;
	}
});

test('every headline is 20-110 characters', () => {
	for (let i = 0; i < HEADLINES_GENERIC_A.length; i++) {
		const len = HEADLINES_GENERIC_A[i].length;
		ok(len >= 20 && len <= 110,
			'headline ' + i + ' length ' + len + ' in [20,110]: "' + HEADLINES_GENERIC_A[i] + '"');
	}
});

test('no headline contains { or }', () => {
	for (let i = 0; i < HEADLINES_GENERIC_A.length; i++) {
		ok(HEADLINES_GENERIC_A[i].indexOf('{') === -1 && HEADLINES_GENERIC_A[i].indexOf('}') === -1,
			'headline ' + i + ' has no braces: "' + HEADLINES_GENERIC_A[i] + '"');
	}
});

test('no headline is purely upper case', () => {
	for (let i = 0; i < HEADLINES_GENERIC_A.length; i++) {
		ok(HEADLINES_GENERIC_A[i] !== HEADLINES_GENERIC_A[i].toUpperCase(),
			'headline ' + i + ' is not all caps: "' + HEADLINES_GENERIC_A[i] + '"');
	}
});

test('no headline ends with a space', () => {
	for (let i = 0; i < HEADLINES_GENERIC_A.length; i++) {
		ok(HEADLINES_GENERIC_A[i].slice(-1) !== ' ',
			'headline ' + i + ' does not end with a space');
	}
});

done();
