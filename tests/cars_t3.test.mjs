// Tests for src/data/cars_t3.js, run under `jsc -m`.

import { test, eq, ok, done } from './harness.js';
import { CARS_T3 } from '../src/data/cars_t3.js';

const KEYS = ['id', 'name', 'year', 'archetype', 'tier', 'basePrice', 'baseRent',
	'desirability', 'maintenance', 'reliability', 'quip'];
const ARCHETYPES = ['micro', 'saloon', 'beetle', 'hatch', 'roadster', 'coupe',
	'longnose', 'wedge', 'gullwing', 'tourer', 'limo', 'boxy', 'trike'];

function isInt(x) {
	return typeof x === 'number' && isFinite(x) && Math.floor(x) === x;
}

test('tier 3 has exactly 11 cars', () => {
	eq(CARS_T3.length, 11, 'length');
});

test('ids are present in the exact catalogue order', () => {
	eq(CARS_T3.map(c => c.id), [
		't3_mercedez', 't3_porshe', 't3_delorean', 't3_jagwar', 't3_cloudy',
		't3_cobbra', 't3_dinosore', 't3_lamborgonzo', 't3_gtforty',
		't3_blowhard', 't3_aston'
	], 'ids in order');
});

test('every car has the 11 keys with the right types', () => {
	for (let i = 0; i < CARS_T3.length; i++) {
		const c = CARS_T3[i];
		eq(Object.keys(c).length, 11, 'key count of ' + c.id);
		for (let k = 0; k < KEYS.length; k++) {
			ok(Object.prototype.hasOwnProperty.call(c, KEYS[k]),
				'car ' + i + ' missing key ' + KEYS[k]);
		}
		ok(typeof c.id === 'string' && c.id.length > 0, 'id string (' + c.id + ')');
		ok(typeof c.name === 'string' && c.name.length > 0, 'name string (' + c.id + ')');
		ok(typeof c.archetype === 'string', 'archetype string (' + c.id + ')');
		ok(typeof c.quip === 'string' && c.quip.length > 0, 'quip string (' + c.id + ')');
		ok(isInt(c.year), 'year integer (' + c.id + ')');
		ok(isInt(c.basePrice) && c.basePrice > 0, 'basePrice integer (' + c.id + ')');
		ok(isInt(c.baseRent) && c.baseRent > 0, 'baseRent integer (' + c.id + ')');
		ok(c.tier === 3, 'tier === 3 (' + c.id + ')');
	}
});

test('D, M, R are integers 1-10', () => {
	for (let i = 0; i < CARS_T3.length; i++) {
		const c = CARS_T3[i];
		for (const stat of ['desirability', 'maintenance', 'reliability']) {
			ok(isInt(c[stat]) && c[stat] >= 1 && c[stat] <= 10,
				c.id + ' ' + stat + ' = ' + c[stat] + ' not an integer 1-10');
		}
	}
});

test('archetype is one of the allowed set', () => {
	for (let i = 0; i < CARS_T3.length; i++) {
		ok(ARCHETYPES.indexOf(CARS_T3[i].archetype) !== -1,
			'archetype of ' + CARS_T3[i].id);
	}
});

test('basePrice is non-decreasing in array order', () => {
	for (let i = 1; i < CARS_T3.length; i++) {
		ok(CARS_T3[i].basePrice >= CARS_T3[i - 1].basePrice,
			'basePrice decreases at index ' + i);
	}
});

test('spot-check first row: t3_mercedez', () => {
	eq(CARS_T3[0], {
		id: 't3_mercedez',
		name: 'Mercedez Pagoda SL',
		year: 1967,
		archetype: 'roadster',
		tier: 3,
		basePrice: 42000,
		baseRent: 1900,
		desirability: 8,
		maintenance: 6,
		reliability: 6,
		quip: 'A temple on wheels. Priests not included.'
	}, 'first row');
});

test('spot-check middle row: t3_cobbra', () => {
	eq(CARS_T3[5], {
		id: 't3_cobbra',
		name: 'Shellby Cobbra',
		year: 1965,
		archetype: 'longnose',
		tier: 3,
		basePrice: 150000,
		baseRent: 4500,
		desirability: 9,
		maintenance: 7,
		reliability: 4,
		quip: 'Hisses. Bites. Insurance company hates it.'
	}, 'middle row');
});

test('spot-check last row: t3_aston', () => {
	eq(CARS_T3[10], {
		id: 't3_aston',
		name: 'Aston Martian DB-Fiver',
		year: 1964,
		archetype: 'coupe',
		tier: 3,
		basePrice: 320000,
		baseRent: 8000,
		desirability: 10,
		maintenance: 8,
		reliability: 5,
		quip: 'Ejector seat button is strictly decorative. Probably.'
	}, 'last row');
});

done();
