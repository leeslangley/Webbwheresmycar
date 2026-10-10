// Browser entry point (DESIGN.md 9.2): boots the game on the page, with a
// safe storage handle for the save card to use later.

import { bootGame } from './boot.js';

// window.localStorage can throw (Safari with cookies blocked) or be missing;
// fall back to an in-memory stand-in so the game still runs.
function safeStorage() {
	try {
		if (window.localStorage) {
			return window.localStorage;
		}
	} catch (e) {}
	const store = {};
	return {
		getItem: function (k) {
			return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null;
		},
		setItem: function (k, v) {
			store[k] = String(v);
		},
		removeItem: function (k) {
			delete store[k];
		},
	};
}

bootGame({ window: window, document: document, storage: safeStorage() });
