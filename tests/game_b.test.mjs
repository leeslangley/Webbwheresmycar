// Tests for app.act in src/game.js (W68b), run under `jsc -m`.

import { test, eq, ok, done } from './harness.js';
import { createGame } from '../src/game.js';
import { loadFrom } from '../src/save/save.js';
import { waitDay, buyCar } from '../src/sim/actions.js';

// In-memory stand-in for localStorage, same fake as tests/game_a.test.mjs.
function makeStorage() {
	const map = {};
	return {
		setItem(k, v) { map[k] = String(v); },
		getItem(k) { return Object.prototype.hasOwnProperty.call(map, k) ? map[k] : null; },
		removeItem(k) { delete map[k]; },
	};
}

function makeNow(ms) {
	return function () { return ms; };
}

test('a successful act saves, stamps the clock and shows the newspaper', () => {
	const storage = makeStorage();
	const app = createGame({ storage: storage, now: makeNow(5000) });
	app.newGame();
	const r = app.act(function () { return waitDay(app.state); });
	eq(r.ok, true, 'waitDay returns ok');
	eq(app.state.day, 2, 'day moved to 2');
	eq(app.current().id, 'news', 'newspaper scene on top');
	eq(app.dayChangedAt, 5000, 'dayChangedAt stamped');
	eq(loadFrom(storage).day, 2, 'stored save has day 2');
});

test('a successful act plays the cash sound (no-op audio is fine)', () => {
	const app = createGame({ storage: makeStorage(), now: makeNow(0) });
	app.newGame();
	eq(app.audio !== undefined, true, 'audio exists by default');
	const played = [];
	app.audio = { play: function (name) { played.push(name); } };
	app.act(function () { return waitDay(app.state); });
	// The newspaper scene itself plays 'paper' on enter; act must play
	// 'cash' first, before that push.
	eq(played[0], 'cash', 'the cash sound played');
	eq(played.indexOf('cash') !== -1, true, 'cash is among the sounds');
});

test('a failed act only toasts: no save bump, no news push', () => {
	const storage = makeStorage();
	const app = createGame({ storage: storage, now: makeNow(5000) });
	app.newGame();
	eq(app.toasts.length, 0, 'no toasts yet');
	const r = app.act(function () { return buyCar(app.state, 'nope'); });
	eq(r.ok, false, 'buyCar refuses');
	eq(app.state.day, 1, 'day unchanged');
	eq(app.current().id, 'office', 'still the office, no newspaper pushed');
	eq(app.toasts.length, 1, 'one toast added');
	eq(app.toasts[0].text, 'No such car for sale on the telly', 'toast shows the refusal');
});

test('a result without ok is returned untouched', () => {
	const app = createGame({ storage: makeStorage(), now: makeNow(0) });
	app.newGame();
	const plain = { value: 42 };
	const r = app.act(function () { return plain; });
	eq(r, plain, 'the same object comes back');
	eq(app.toasts.length, 0, 'no toast for a plain result');
	eq(app.current().id, 'office', 'no scene pushed');
});

done();
