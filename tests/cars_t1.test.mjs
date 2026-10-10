// Tests for the Tier 1 (bangers) car catalogue, run under `jsc -m`.

import { CARS_T1 } from '../src/data/cars_t1.js';
import { test, eq, ok, done } from './harness.js';

const KEYS = ['id', 'name', 'year', 'archetype', 'tier', 'basePrice', 'baseRent', 'desirability', 'maintenance', 'reliability', 'quip'];
const INT_KEYS = ['year', 'tier', 'basePrice', 'baseRent', 'desirability', 'maintenance', 'reliability'];
const STRING_KEYS = ['id', 'name', 'archetype', 'quip'];
const ARCHETYPES = ['micro', 'saloon', 'beetle', 'hatch', 'roadster', 'coupe', 'longnose', 'wedge', 'gullwing', 'tourer', 'limo', 'boxy', 'trike'];

test('CARS_T1 has exactly 10 cars', () => {
	ok(Array.isArray(CARS_T1), 'CARS_T1 is an array');
	eq(CARS_T1.length, 10, 'length');
});

test('ids are present in the exact catalogue order', () => {
	eq(CARS_T1.map(function (c) { return c.id; }), [
		't1_allergy', 't1_robbin', 't1_chimp', 't1_maurice', 't1_volksbeagle',
		't1_trumpet', 't1_cooker', 't1_fjord', 't1_mgbee', 't1_alpaca'
	], 'ids in order');
});

test('every car has all 11 keys with the right types and tier 1', () => {
	for (let i = 0; i < CARS_T1.length; i++) {
		const c = CARS_T1[i];
		eq(Object.keys(c).length, 11, 'car ' + c.id + ' has 11 keys');
		for (let j = 0; j < KEYS.length; j++) {
			ok(Object.prototype.hasOwnProperty.call(c, KEYS[j]), 'car ' + c.id + ' has key ' + KEYS[j]);
		}
		for (let j = 0; j < STRING_KEYS.length; j++) {
			eq(typeof c[STRING_KEYS[j]], 'string', 'car ' + c.id + ' key ' + STRING_KEYS[j] + ' is a string');
		}
		for (let j = 0; j < INT_KEYS.length; j++) {
			eq(typeof c[INT_KEYS[j]], 'number', 'car ' + c.id + ' key ' + INT_KEYS[j] + ' is a number');
			ok(Number.isInteger(c[INT_KEYS[j]]), 'car ' + c.id + ' key ' + INT_KEYS[j] + ' is an integer');
		}
		eq(c.tier, 1, 'car ' + c.id + ' tier is 1');
	}
});

test('D, M and R are integers in 1-10', () => {
	for (let i = 0; i < CARS_T1.length; i++) {
		const c = CARS_T1[i];
		const stats = { D: c.desirability, M: c.maintenance, R: c.reliability };
		for (const k in stats) {
			ok(Number.isInteger(stats[k]), 'car ' + c.id + ' ' + k + ' is an integer');
			ok(stats[k] >= 1 && stats[k] <= 10, 'car ' + c.id + ' ' + k + ' in 1-10');
		}
	}
});

test('archetype is one of the supported drawer archetypes', () => {
	for (let i = 0; i < CARS_T1.length; i++) {
		ok(ARCHETYPES.indexOf(CARS_T1[i].archetype) !== -1, 'car ' + CARS_T1[i].id + ' archetype');
	}
});

test('basePrice is non-decreasing in array order', () => {
	for (let i = 1; i < CARS_T1.length; i++) {
		ok(CARS_T1[i].basePrice >= CARS_T1[i - 1].basePrice, 'basePrice non-decreasing at index ' + i);
	}
});

test('first row matches the DESIGN.md table exactly', () => {
	eq(CARS_T1[0], {
		id: 't1_allergy',
		name: 'Austen Allergy',
		year: 1976,
		archetype: 'saloon',
		tier: 1,
		basePrice: 3500,
		baseRent: 220,
		desirability: 1,
		maintenance: 2,
		reliability: 2,
		quip: 'Makes you sneeze just looking at it.'
	}, 't1_allergy row');
});

test('middle row matches the DESIGN.md table exactly', () => {
	eq(CARS_T1[5], {
		id: 't1_trumpet',
		name: 'Trumpet Spitfarm',
		year: 1972,
		archetype: 'roadster',
		tier: 1,
		basePrice: 8500,
		baseRent: 450,
		desirability: 4,
		maintenance: 3,
		reliability: 3,
		quip: 'Open-top fun until it rains. It will rain.'
	}, 't1_trumpet row');
});

test('last row matches the DESIGN.md table exactly', () => {
	eq(CARS_T1[9], {
		id: 't1_alpaca',
		name: 'Sunbeem Alpaca',
		year: 1965,
		archetype: 'roadster',
		tier: 1,
		basePrice: 11000,
		baseRent: 600,
		desirability: 5,
		maintenance: 3,
		reliability: 4,
		quip: 'Spits a bit. Looks lovely though.'
	}, 't1_alpaca row');
});

done();
