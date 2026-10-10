// Tests for the Tier 2 car catalogue (card W07).
// Data must match docs/DESIGN.md section 6, table "Tier 2: Proper Classics", exactly.

import { test, eq, ok, done } from './harness.js';
import { CARS_T2 } from '../src/data/cars_t2.js';

const EXPECTED_IDS = [
	't2_fjordcapri',
	't2_trsixish',
	't2_spyder',
	't2_serious',
	't2_zed',
	't2_eclair',
	't2_lancer',
	't2_healthy',
	't2_morganish',
	't2_dees',
];

const KEYS = ['id', 'name', 'year', 'archetype', 'tier', 'basePrice', 'baseRent', 'desirability', 'maintenance', 'reliability', 'quip'];

const ARCHETYPES = ['micro', 'saloon', 'beetle', 'hatch', 'roadster', 'coupe', 'longnose', 'wedge', 'gullwing', 'tourer', 'limo', 'boxy', 'trike'];

const isInt = (x) => typeof x === 'number' && isFinite(x) && Math.floor(x) === x;

test('length is 10', () => {
	eq(CARS_T2.length, 10, 'CARS_T2 length');
});

test('ids in order', () => {
	eq(CARS_T2.map((c) => c.id), EXPECTED_IDS, 'ids in order');
});

test('every car has all 11 keys with correct types', () => {
	for (let i = 0; i < CARS_T2.length; i++) {
		const car = CARS_T2[i];
		const keys = Object.keys(car);
		eq(keys.length, KEYS.length, 'key count for ' + car.id);
		for (let k = 0; k < KEYS.length; k++) {
			ok(keys.indexOf(KEYS[k]) !== -1, 'car ' + i + ' missing key ' + KEYS[k]);
		}
		ok(typeof car.id === 'string' && car.id.length > 0, 'id string for ' + car.id);
		ok(typeof car.name === 'string' && car.name.length > 0, 'name string for ' + car.id);
		ok(typeof car.archetype === 'string', 'archetype string for ' + car.id);
		ok(typeof car.quip === 'string' && car.quip.length > 0, 'quip string for ' + car.id);
		ok(isInt(car.year), 'year integer for ' + car.id);
		ok(isInt(car.basePrice), 'basePrice integer for ' + car.id);
		ok(isInt(car.baseRent), 'baseRent integer for ' + car.id);
		ok(isInt(car.desirability), 'desirability integer for ' + car.id);
		ok(isInt(car.maintenance), 'maintenance integer for ' + car.id);
		ok(isInt(car.reliability), 'reliability integer for ' + car.id);
		eq(car.tier, 2, 'tier is 2 for ' + car.id);
	}
});

test('D, M and R are integers 1-10', () => {
	for (let i = 0; i < CARS_T2.length; i++) {
		const car = CARS_T2[i];
		for (const key of ['desirability', 'maintenance', 'reliability']) {
			const v = car[key];
			ok(isInt(v) && v >= 1 && v <= 10, car.id + ' ' + key + ' in 1-10, got ' + v);
		}
	}
});

test('archetype is a known one', () => {
	for (let i = 0; i < CARS_T2.length; i++) {
		ok(ARCHETYPES.indexOf(CARS_T2[i].archetype) !== -1, 'archetype of ' + CARS_T2[i].id);
	}
});

test('basePrice is non-decreasing', () => {
	for (let i = 1; i < CARS_T2.length; i++) {
		ok(CARS_T2[i].basePrice >= CARS_T2[i - 1].basePrice, 'basePrice non-decreasing at ' + CARS_T2[i].id);
	}
});

test('spot-check first row (t2_fjordcapri)', () => {
	eq(CARS_T2[0], {
		id: 't2_fjordcapri',
		name: 'Fjord Capriccio 3.0',
		year: 1973,
		archetype: 'coupe',
		tier: 2,
		basePrice: 16500,
		baseRent: 800,
		desirability: 6,
		maintenance: 4,
		reliability: 4,
		quip: "The car every bloke called Kev was born to own.",
	}, 'first row');
});

test('spot-check middle row (t2_eclair)', () => {
	eq(CARS_T2[5], {
		id: 't2_eclair',
		name: 'Lotos Eclair',
		year: 1966,
		archetype: 'roadster',
		tier: 2,
		basePrice: 24000,
		baseRent: 1100,
		desirability: 7,
		maintenance: 5,
		reliability: 4,
		quip: "Weighs the same as a handbag. Handles like one on ice.",
	}, 'middle row');
});

test('spot-check last row (t2_dees)', () => {
	eq(CARS_T2[9], {
		id: 't2_dees',
		name: 'Citron Dees-Ess',
		year: 1970,
		archetype: 'limo',
		tier: 2,
		basePrice: 38000,
		baseRent: 1600,
		desirability: 8,
		maintenance: 7,
		reliability: 3,
		quip: "Rises up like a startled cat. Space-age, bonkers.",
	}, 'last row');
});

done();
