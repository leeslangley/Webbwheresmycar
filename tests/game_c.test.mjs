// Tests for src/game.js (W68c: game over goes to the end screen), run under `jsc -m`.

import { test, eq, ok, done } from './harness.js';
import { createGame } from '../src/game.js';
import { SAVE_KEY, loadFrom } from '../src/save/save.js';

// In-memory stand-in for localStorage, same fake as tests/save.test.mjs.
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

function gameOverFlags() {
	return { gameOver: true, won: false, reason: 'year-end' };
}

test('pop from news returns to the office', () => {
	const app = createGame({ storage: makeStorage(), now: makeNow(0) });
	app.newGame();
	app.push('news');
	eq(app.current().id, 'news', 'news is on top');
	app.pop();
	eq(app.current().id, 'office', 'back on the office');
});

test('pop from news with gameOver set lands on endgame', () => {
	const app = createGame({ storage: makeStorage(), now: makeNow(0) });
	app.newGame();
	app.state.flags = gameOverFlags();
	app.push('news');
	app.pop();
	eq(app.current().id, 'endgame', 'endgame is on top');
});

test('popping other scenes never redirects, even with gameOver set', () => {
	const app = createGame({ storage: makeStorage(), now: makeNow(0) });
	app.newGame();
	app.state.flags = gameOverFlags();
	const others = ['ledger', 'settings', 'garage'];
	for (let i = 0; i < others.length; i++) {
		app.push(others[i]);
		eq(app.current().id, others[i], others[i] + ' is on top');
		app.pop();
		eq(app.current().id, 'office', 'pop of ' + others[i] + ' returns to the office');
	}
});

test('the redirect stores the save with gameOver set', () => {
	const storage = makeStorage();
	const app = createGame({ storage: storage, now: makeNow(0) });
	app.newGame();
	storage.removeItem(SAVE_KEY);
	app.state.flags = gameOverFlags();
	app.push('news');
	app.pop();
	ok(storage.getItem(SAVE_KEY) !== null, 'save key present after the redirect');
	const saved = loadFrom(storage);
	ok(saved !== null, 'stored save deserializes');
	eq(saved.flags.gameOver, true, 'stored save has gameOver set');
	eq(saved.flags.reason, 'year-end', 'stored save keeps the reason');
});

done();
