// Tests for src/data/headlines_carworld_a.js, run under `jsc -m`.

import { HEADLINES_CARWORLD_A } from '../src/data/headlines_carworld_a.js';
import { test, eq, ok, done } from './harness.js';

test('HEADLINES_CARWORLD_A is an array of exactly 30 strings', () => {
	ok(Array.isArray(HEADLINES_CARWORLD_A), 'HEADLINES_CARWORLD_A is an array');
	eq(HEADLINES_CARWORLD_A.length, 30, 'HEADLINES_CARWORLD_A length');
	for (let i = 0; i < HEADLINES_CARWORLD_A.length; i++) {
		eq(typeof HEADLINES_CARWORLD_A[i], 'string', 'entry ' + i + ' is a string');
	}
});

test('entries are unique, ignoring case', () => {
	for (let i = 0; i < HEADLINES_CARWORLD_A.length; i++) {
		for (let j = i + 1; j < HEADLINES_CARWORLD_A.length; j++) {
			const a = HEADLINES_CARWORLD_A[i].toLowerCase();
			const b = HEADLINES_CARWORLD_A[j].toLowerCase();
			ok(a !== b, 'entries ' + i + ' and ' + j + ' collide ignoring case');
		}
	}
});

test('each entry is 20-110 characters', () => {
	for (let i = 0; i < HEADLINES_CARWORLD_A.length; i++) {
		const len = HEADLINES_CARWORLD_A[i].length;
		ok(len >= 20 && len <= 110, 'entry ' + i + ' length ' + len + ' is 20-110: "' + HEADLINES_CARWORLD_A[i] + '"');
	}
});

test('no entry contains { or }', () => {
	for (let i = 0; i < HEADLINES_CARWORLD_A.length; i++) {
		ok(HEADLINES_CARWORLD_A[i].indexOf('{') === -1, 'entry ' + i + ' has no {');
		ok(HEADLINES_CARWORLD_A[i].indexOf('}') === -1, 'entry ' + i + ' has no }');
	}
});

test('no entry is purely upper case', () => {
	for (let i = 0; i < HEADLINES_CARWORLD_A.length; i++) {
		ok(HEADLINES_CARWORLD_A[i] !== HEADLINES_CARWORLD_A[i].toUpperCase(), 'entry ' + i + ' is not all caps');
	}
});

test('no entry ends with a space', () => {
	for (let i = 0; i < HEADLINES_CARWORLD_A.length; i++) {
		ok(HEADLINES_CARWORLD_A[i].slice(-1) !== ' ', 'entry ' + i + ' does not end with a space');
	}
});

test('every entry is printable ASCII only', () => {
	const re = /^[ -~]+$/;
	for (let i = 0; i < HEADLINES_CARWORLD_A.length; i++) {
		ok(re.test(HEADLINES_CARWORLD_A[i]), 'entry ' + i + ' is printable ASCII: "' + HEADLINES_CARWORLD_A[i] + '"');
	}
});

done();
