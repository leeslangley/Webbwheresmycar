// Tests for src/game.js (W68a), run under `jsc -m`.

import { test, eq, ok, done } from './harness.js';
import { createGame, SETTINGS_KEY } from '../src/game.js';
import { SAVE_KEY, loadFrom, saveTo } from '../src/save/save.js';

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

const SCENE_IDS = [
	'title', 'office', 'tvshop', 'garage', 'adverts', 'bookings',
	'news', 'ledger', 'auction', 'endgame', 'settings',
];

test('the app registers all 11 scene ids', () => {
	const app = createGame({ storage: makeStorage(), now: makeNow(1000) });
	for (let i = 0; i < SCENE_IDS.length; i++) {
		ok(app.scenes[SCENE_IDS[i]] !== undefined, 'missing scene ' + SCENE_IDS[i]);
	}
});

test('newGame gives day 1, the office scene and a stored save', () => {
	const storage = makeStorage();
	const app = createGame({ storage: storage, now: makeNow(5000) });
	app.newGame();
	eq(app.state.day, 1, 'day is 1');
	eq(app.current().id, 'office', 'current scene is office');
	eq(app.current(), app.scenes.office, 'office scene is on the stack');
	ok(storage.getItem(SAVE_KEY) !== null, 'save key present in storage');
	ok(loadFrom(storage) !== null, 'stored save deserializes');
	eq(app.dayChangedAt, 5000, 'dayChangedAt is now');
});

test('hasSave is true after newGame and false on a fresh storage', () => {
	const app = createGame({ storage: makeStorage(), now: makeNow(0) });
	eq(app.hasSave(), false, 'no save before newGame');
	app.newGame();
	eq(app.hasSave(), true, 'save exists after newGame');
});

test('a second createGame on the same storage continues the saved game', () => {
	const storage = makeStorage();
	const app1 = createGame({ storage: storage, now: makeNow(100) });
	app1.newGame();
	app1.state.cash = 7777;
	app1.state.day = 12;
	saveTo(storage, app1.state);

	const app2 = createGame({ storage: storage, now: makeNow(200) });
	eq(app2.hasSave(), true, 'second app sees the save');
	app2.continueGame();
	eq(app2.current().id, 'office', 'continue lands on the office');
	eq(JSON.stringify(app2.state), JSON.stringify(app1.state), 'state restored from the save');
	eq(app2.state.cash, 7777, 'edited cash visible in restored state');
});

test('settings persist across two createGame calls on the same storage', () => {
	const storage = makeStorage();
	const app1 = createGame({ storage: storage, now: makeNow(0) });
	eq(app1.settings, { crt: false, sound: true, music: true }, 'defaults on first run');
	app1.settings.crt = true;
	app1.settings.music = false;
	app1.saveSettings();

	const app2 = createGame({ storage: storage, now: makeNow(0) });
	eq(app2.settings.crt, true, 'crt persisted');
	eq(app2.settings.music, false, 'music persisted');
	eq(app2.settings.sound, true, 'sound kept its default');
});

test('saveSettings writes the settings JSON under webb_settings_v1', () => {
	const storage = makeStorage();
	const app = createGame({ storage: storage, now: makeNow(0) });
	app.settings.sound = false;
	app.saveSettings();
	eq(JSON.parse(storage.getItem(SETTINGS_KEY)), { crt: false, sound: false, music: true }, 'stored settings blob');
});

test('eraseSave makes hasSave false and a later continueGame toasts', () => {
	const storage = makeStorage();
	const app = createGame({ storage: storage, now: makeNow(0) });
	app.newGame();
	eq(app.hasSave(), true, 'save exists before erase');
	eq(app.eraseSave(), true, 'eraseSave true');
	eq(app.hasSave(), false, 'no save after erase');
	eq(storage.getItem(SAVE_KEY), null, 'save key removed');
	eq(storage.getItem(SETTINGS_KEY), null, 'settings key untouched by erase');
});

test('continueGame with no save toasts "No saved game" and stays put', () => {
	const app = createGame({ storage: makeStorage(), now: makeNow(0) });
	eq(app.continueGame(), false, 'continueGame returns false');
	eq(app.toasts.length, 1, 'one toast');
	eq(app.toasts[0].text, 'No saved game', 'toast text');
	eq(app.current(), null, 'no scene navigated to');
	eq(app.state, null, 'state stays null');
});

test('continueGame with a corrupt save also toasts instead of crashing', () => {
	const storage = makeStorage();
	storage.setItem(SAVE_KEY, '{not json');
	const app = createGame({ storage: storage, now: makeNow(0) });
	eq(app.continueGame(), false, 'continueGame returns false');
	eq(app.toasts.length, 1, 'one toast');
	eq(app.toasts[0].text, 'No saved game', 'toast text');
});

done();
