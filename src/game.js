// Game object (DESIGN.md sections 9.3, 9.5): the real app entry point.
// Wires every scene into a createApp instance, loads and saves settings,
// and owns new game / continue / erase. Pure: storage is passed in, time
// comes from env.now; nothing here touches the DOM.

import { createApp } from './ui/scenes.js';
import { saveTo, loadFrom, clearSave } from './save/save.js';
import { startGame } from './sim/newgame.js';
import { titleScene } from './ui/scenes/title.js';
import { officeScene } from './ui/scenes/office.js';
import { tvshopScene } from './ui/scenes/tvshop.js';
import { garageScene } from './ui/scenes/garage.js';
import { advertsScene } from './ui/scenes/adverts.js';
import { bookingsScene } from './ui/scenes/bookings.js';
import { newsScene } from './ui/scenes/news.js';
import { ledgerScene } from './ui/scenes/ledger.js';
import { auctionScene } from './ui/scenes/auction.js';
import { endgameScene } from './ui/scenes/endgame.js';
import { settingsScene } from './ui/scenes/settings.js';

export const SETTINGS_KEY = 'webb_settings_v1';

const DEFAULT_SETTINGS = { crt: false, sound: true, music: true };

// Reads the settings blob out of storage, falling back to the defaults for
// anything missing, corrupt or of the wrong type. Never throws.
function loadSettings(storage) {
	try {
		const raw = storage.getItem(SETTINGS_KEY);
		const parsed = raw === null ? null : JSON.parse(raw);
		if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
			return { crt: DEFAULT_SETTINGS.crt, sound: DEFAULT_SETTINGS.sound, music: DEFAULT_SETTINGS.music };
		}
		return {
			crt: parsed.crt === true,
			sound: parsed.sound !== false,
			music: parsed.music !== false,
		};
	} catch (e) {
		return { crt: DEFAULT_SETTINGS.crt, sound: DEFAULT_SETTINGS.sound, music: DEFAULT_SETTINGS.music };
	}
}

// createGame(env) -> app. env = {storage, now} where now is a function
// returning milliseconds (the browser boot passes performance.now).
export function createGame(env) {
	env = env || {};
	const storage = env.storage;
	const app = createApp({ now: env.now });
	app.settings = loadSettings(storage);
	app.dayChangedAt = null;

	// The action runner (DESIGN.md 9.7): a successful action costs a day,
	// so save, stamp the clock, play the cash sound and show the newspaper.
	// A failed action only toasts. Anything without an ok field passes
	// straight through untouched.
	app.act = function (fn) {
		const r = fn();
		if (r && r.ok === true) {
			saveTo(storage, app.state);
			app.dayChangedAt = app.now();
			if (!app.audio) {
				app.audio = { play: function () {} };
			}
			app.audio.play('cash');
			app.push('news');
		} else if (r && r.ok === false && r.msg) {
			app.toast(r.msg);
		}
		return r;
	};

	app.saveSettings = function () {
		try {
			storage.setItem(SETTINGS_KEY, JSON.stringify(app.settings));
		} catch (e) {}
		return true;
	};

	app.hasSave = function () {
		return loadFrom(storage) !== null;
	};

	app.newGame = function () {
		app.state = startGame(Math.floor(app.now()) + 1);
		saveTo(storage, app.state);
		app.dayChangedAt = app.now();
		app.go('office');
	};

	app.continueGame = function () {
		const loaded = loadFrom(storage);
		if (loaded === null) {
			app.toast('No saved game');
			return false;
		}
		app.state = loaded;
		app.go('office');
		return true;
	};

	app.eraseSave = function () {
		return clearSave(storage);
	};

	app
		.register(titleScene)
		.register(officeScene)
		.register(tvshopScene)
		.register(garageScene)
		.register(advertsScene)
		.register(bookingsScene)
		.register(newsScene)
		.register(ledgerScene)
		.register(auctionScene)
		.register(endgameScene)
		.register(settingsScene);

	// After the newspaper closes, a finished game goes to the end screen.
	// Every other pop behaves as before.
	const originalPop = app.pop;
	app.pop = function () {
		const top = app.current();
		const poppedId = top ? top.id : null;
		originalPop();
		if (poppedId === 'news' && app.state && app.state.flags && app.state.flags.gameOver === true) {
			saveTo(storage, app.state);
			app.go('endgame');
		}
	};

	return app;
}
