// Tests for the generic_b headlines pool, run under `jsc -m`.

import { HEADLINES_GENERIC_B } from '../src/data/headlines_generic_b.js';
import { test, eq, ok, done } from './harness.js';

test('HEADLINES_GENERIC_B is an array of exactly 40 headlines', () => {
	ok(Array.isArray(HEADLINES_GENERIC_B), 'HEADLINES_GENERIC_B is an array');
	eq(HEADLINES_GENERIC_B.length, 40, 'length');
});

test('every headline is 20-110 characters long', () => {
	for (let i = 0; i < HEADLINES_GENERIC_B.length; i++) {
		const len = HEADLINES_GENERIC_B[i].length;
		ok(len >= 20 && len <= 110, 'headline ' + i + ' has length ' + len + ': ' + HEADLINES_GENERIC_B[i]);
	}
});

test('every headline is unique (case-insensitive)', () => {
	const seen = {};
	for (let i = 0; i < HEADLINES_GENERIC_B.length; i++) {
		const key = HEADLINES_GENERIC_B[i].toLowerCase();
		ok(!seen[key], 'headline ' + i + ' is unique: ' + HEADLINES_GENERIC_B[i]);
		seen[key] = true;
	}
});

test('no headline contains { or }', () => {
	for (let i = 0; i < HEADLINES_GENERIC_B.length; i++) {
		const h = HEADLINES_GENERIC_B[i];
		ok(h.indexOf('{') === -1 && h.indexOf('}') === -1, 'headline ' + i + ' has no braces');
	}
});

test('no headline is purely upper case', () => {
	for (let i = 0; i < HEADLINES_GENERIC_B.length; i++) {
		const h = HEADLINES_GENERIC_B[i];
		ok(h !== h.toUpperCase(), 'headline ' + i + ' is not all upper case');
	}
});

test('no headline ends with a space', () => {
	for (let i = 0; i < HEADLINES_GENERIC_B.length; i++) {
		ok(HEADLINES_GENERIC_B[i].slice(-1) !== ' ', 'headline ' + i + ' does not end with a space');
	}
});

test('every headline is 6-14 words', () => {
	for (let i = 0; i < HEADLINES_GENERIC_B.length; i++) {
		const words = HEADLINES_GENERIC_B[i].split(/\s+/).length;
		ok(words >= 6 && words <= 14, 'headline ' + i + ' has ' + words + ' words');
	}
});

test('every headline is printable ASCII only', () => {
	for (let i = 0; i < HEADLINES_GENERIC_B.length; i++) {
		ok(/^[ -~]+$/.test(HEADLINES_GENERIC_B[i]), 'headline ' + i + ' is printable ASCII');
	}
});

done();
