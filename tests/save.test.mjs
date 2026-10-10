// Tests for src/save/save.js, run under `jsc -m`.

import { test, eq, ok, done } from './harness.js';
import { newGameState } from '../src/core/state.js';
import { SAVE_KEY, serialize, deserialize, saveTo, loadFrom, clearSave } from '../src/save/save.js';

// In-memory stand-in for localStorage: getItem returns null for missing keys,
// exactly like the browser API.
function makeStorage() {
	const map = {};
	return {
		setItem(k, v) { map[k] = String(v); },
		getItem(k) { return Object.prototype.hasOwnProperty.call(map, k) ? map[k] : null; },
		removeItem(k) { delete map[k]; },
	};
}

test('SAVE_KEY is webb_save_v1', () => {
	eq(SAVE_KEY, 'webb_save_v1', 'save key');
});

test('serialize produces JSON.stringify of the state', () => {
	const s = newGameState(3);
	eq(serialize(s), JSON.stringify(s), 'serialize equals JSON.stringify');
});

test('round trip of newGameState(3) is deep-equal', () => {
	const s = newGameState(3);
	const back = deserialize(serialize(s));
	ok(back !== null, 'deserialize returned a state');
	eq(JSON.stringify(back), JSON.stringify(s), 'round trip deep-equal');
});

test('garbage strings deserialize to null', () => {
	const garbage = ['', 'nope', '{}', '[]', '{"v":2}', null, undefined, 42];
	for (let i = 0; i < garbage.length; i++) {
		eq(deserialize(garbage[i]), null, 'garbage at index ' + i + ' (' + JSON.stringify(garbage[i]) + ')');
	}
});

test('a state missing cars deserializes to null', () => {
	const s = newGameState(3);
	const copy = JSON.parse(JSON.stringify(s));
	delete copy.cars;
	eq(deserialize(JSON.stringify(copy)), null, 'missing cars rejected');
});

test('a state missing each other required key deserializes to null', () => {
	const keys = ['day', 'cash', 'reputation', 'buzz', 'garageSlots', 'shop', 'requests', 'auction', 'stats', 'plates', 'flags', 'rng'];
	for (let i = 0; i < keys.length; i++) {
		const copy = JSON.parse(JSON.stringify(newGameState(3)));
		delete copy[keys[i]];
		eq(deserialize(JSON.stringify(copy)), null, 'missing ' + keys[i] + ' rejected');
	}
});

test('loadFrom on an empty storage returns null', () => {
	eq(loadFrom(makeStorage()), null, 'empty storage');
});

test('saveTo returns true and stores the string; loadFrom returns it back', () => {
	const storage = makeStorage();
	const s = newGameState(3);
	ok(saveTo(storage, s) === true, 'saveTo true');
	eq(storage.getItem(SAVE_KEY), serialize(s), 'stored string');
	const back = loadFrom(storage);
	ok(back !== null, 'loadFrom found a state');
	eq(JSON.stringify(back), JSON.stringify(s), 'loaded state matches');
});

test('saveTo on a storage whose setItem throws returns false and does not throw', () => {
	const storage = {
		setItem() { throw new Error('quota exceeded'); },
		getItem() { return null; },
		removeItem() {},
	};
	let result;
	try {
		result = saveTo(storage, newGameState(3));
	} catch (e) {
		ok(false, 'saveTo threw: ' + e.message);
	}
	eq(result, false, 'saveTo false on throwing storage');
});

test('loadFrom on a storage whose getItem throws returns null', () => {
	const storage = {
		setItem() {},
		getItem() { throw new Error('storage broken'); },
		removeItem() {},
	};
	let result;
	try {
		result = loadFrom(storage);
	} catch (e) {
		ok(false, 'loadFrom threw: ' + e.message);
	}
	eq(result, null, 'loadFrom null on throwing storage');
});

test('clearSave removes the key and returns true', () => {
	const storage = makeStorage();
	saveTo(storage, newGameState(3));
	ok(storage.getItem(SAVE_KEY) !== null, 'key present before clear');
	ok(clearSave(storage) === true, 'clearSave true');
	eq(storage.getItem(SAVE_KEY), null, 'key gone after clear');
	eq(loadFrom(storage), null, 'loadFrom null after clear');
});

test('clearSave on a storage whose removeItem throws returns false', () => {
	const storage = {
		setItem() {},
		getItem() { return null; },
		removeItem() { throw new Error('storage broken'); },
	};
	eq(clearSave(storage), false, 'clearSave false on throwing storage');
});

test('a modified state after saving does not alter the stored string', () => {
	const storage = makeStorage();
	const s = newGameState(3);
	const before = serialize(s);
	ok(saveTo(storage, s) === true, 'saveTo true');
	s.cash = 1;
	s.day = 99;
	s.flags.gameOver = true;
	eq(storage.getItem(SAVE_KEY), before, 'stored string unchanged');
});

test('saved state is a copy: mutating the loaded state does not touch storage', () => {
	const storage = makeStorage();
	const s = newGameState(3);
	saveTo(storage, s);
	const back = loadFrom(storage);
	back.cash = 123456;
	eq(JSON.parse(storage.getItem(SAVE_KEY)).cash, 20000, 'stored cash unchanged');
});

done();
