// Fake car sprites for scene and art tests (CC07). Not a test file: import it
// from a test. installFakeCarArt(opts) makes modelcar.js draw sprite-like
// drawImage calls under tests/fakectx.js; uninstallFakeCarArt() goes back to
// the code-drawn cars.

import { configureCarArt } from '../src/art/modelcar.js';

// installFakeCarArt(opts): opts = {L, S, F, missing, shadow} (all optional).
// L is the side sprite size, S the mini size, F the face size, in sprite px.
// missing lists sprite keys that are not loaded. shadow: true gives every
// sprite a baked shadow image.
export function installFakeCarArt(opts) {
	const o = opts || {};
	const L = o.L || { w: 200, h: 70 };
	const S = o.S || { w: 90, h: 30 };
	const F = o.F || { w: 70, h: 56 };
	const missing = o.missing || [];
	const shadow = o.shadow === true;

	function sizeOf(key) {
		if (key.slice(-2) === '_m') {
			return S;
		}
		if (key.slice(-2) === '_f') {
			return F;
		}
		return L;
	}

	const sprites = {
		has: function (key) {
			return missing.indexOf(key) < 0;
		},
		size: function (key) {
			const s = sizeOf(key);
			return { w: s.w, h: s.h };
		},
		meta: function (key) {
			const s = sizeOf(key);
			return { paint: '#c8102e', ax: Math.round(s.w / 2), ay: s.h };
		},
		shadowImage: function (key) {
			return shadow ? { id: 'shadow|' + key } : null;
		},
	};

	const variants = {
		get: function (key, paint, wear) {
			const s = sizeOf(key);
			return {
				img: { id: key + '|' + paint + '|' + wear, width: s.w, height: s.h },
				w: s.w,
				h: s.h,
			};
		},
		light: function (key) {
			return { id: 'light|' + key };
		},
	};

	configureCarArt({ sprites: sprites, variants: variants });
}

// uninstallFakeCarArt(): remove the fake sprites (code-drawn cars again).
export function uninstallFakeCarArt() {
	configureCarArt(null);
}
