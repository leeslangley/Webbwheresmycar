// Tests for src/core/state.js, run under `jsc -m`.

import { test, eq, ok, done } from './harness.js';
import { newGameState, PLATE_KEYS } from '../src/core/state.js';

const EXPECTED_KEYS = [
	'v', 'seed', 'rng', 'day', 'cash', 'reputation', 'buzz', 'garageSlots', 'nextId',
	'market', 'cars', 'shop', 'requests', 'auction', 'stats', 'plates',
	'headlines', 'pending', 'sit', 'today', 'lastMonthReport', 'flags', 'log',
];

test('state has exactly the 23 specified keys in order', () => {
	const s = newGameState(7);
	eq(Object.keys(s).length, 23, 'top-level key count');
	eq(Object.keys(s), EXPECTED_KEYS, 'top-level keys');
});

test('starting values: cash 20000, day 1, garageSlots 3, reputation 40', () => {
	const s = newGameState(7);
	eq(s.cash, 20000, 'cash');
	eq(s.day, 1, 'day');
	eq(s.garageSlots, 3, 'garageSlots');
	eq(s.reputation, 40, 'reputation');
});

test('two calls with the same seed are deep-equal', () => {
	const a = newGameState(123);
	const b = newGameState(123);
	eq(JSON.stringify(a), JSON.stringify(b), 'same seed, same state');
});

test('different seeds give different rng', () => {
	const a = newGameState(1);
	const b = newGameState(2);
	ok(a.rng !== b.rng, 'rng differs between seeds: ' + a.rng + ' vs ' + b.rng);
	eq(a.seed, 1, 'seed stored on first state');
	eq(b.seed, 2, 'seed stored on second state');
});

test('state is JSON-safe: a round trip deep-equals the original', () => {
	const s = newGameState(9);
	eq(JSON.parse(JSON.stringify(s)), s, 'JSON round trip');
});

test('mutating one state\'s cars does not affect another state', () => {
	const a = newGameState(5);
	const b = newGameState(5);
	a.cars.push({ id: 1 });
	a.market.priceMult = 2;
	a.shop.listings.push({ id: 'x' });
	a.requests.push({ id: 'y' });
	a.stats.jobsDone = 9;
	a.plates.fatcat = true;
	a.today.events.push('event');
	a.flags.gameOver = true;
	eq(b.cars.length, 0, 'other state cars still empty');
	eq(b.market.priceMult, 1, 'other state market untouched');
	eq(b.shop.listings.length, 0, 'other state shop untouched');
	eq(b.requests.length, 0, 'other state requests untouched');
	eq(b.stats.jobsDone, 0, 'other state stats untouched');
	eq(b.plates.fatcat, false, 'other state plates untouched');
	eq(b.today.events.length, 0, 'other state today untouched');
	eq(b.flags.gameOver, false, 'other state flags untouched');
});

test('default seed is 1', () => {
	const s = newGameState();
	eq(s.seed, 1, 'seed defaults to 1');
	eq(s.rng, 1, 'rng seeded from default');
	eq(JSON.stringify(s), JSON.stringify(newGameState(1)), 'default matches explicit seed 1');
});

test('PLATE_KEYS equals the keys of state.plates', () => {
	const s = newGameState(3);
	eq(PLATE_KEYS, Object.keys(s.plates), 'plate keys match');
	for (let i = 0; i < PLATE_KEYS.length; i++) {
		eq(s.plates[PLATE_KEYS[i]], false, PLATE_KEYS[i] + ' starts false');
	}
});

done();
