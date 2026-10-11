// Settings scene (card W67): a small panel of toggles for the CRT filter,
// sound and music, plus a two-tap erase of the saved game, and BACK.
// Scene interface per DESIGN.md 9.5/9.7: the hit list is rebuilt on every
// draw and the tap rule is obeyed exactly (remember the pressed id on down,
// never reset it inside draw). Pure: no DOM, no Date; ctx is a parameter so
// tests can run it under tests/fakectx.js.

import { PALETTE } from '../theme.js';
import { panel, label, button } from '../kit_draw.js';
import { makeHits } from '../kit_hits.js';

export const LAYOUT = {
	crt: { x: 340, y: 200, w: 600, h: 70 },
	sound: { x: 340, y: 290, w: 600, h: 70 },
	music: { x: 340, y: 380, w: 600, h: 70 },
	erase: { x: 340, y: 470, w: 600, h: 70 },
	back: { x: 340, y: 580, w: 600, h: 60 },
};

// How long the second tap on ERASE stays armed.
const CONFIRM_MS = 3000;

// The clock may be a function or a plain number (test fakes).
function nowMs(app) {
	return typeof app.now === 'function' ? app.now() : (app.now || 0);
}

// The label for one toggle, from the current setting.
function toggleLabel(name, on) {
	return name + ': ' + (on ? 'ON' : 'OFF');
}

export const settingsScene = {
	id: 'settings',
	hits: null,
	pressed: null,
	confirmUntil: null,

	enter: function (app) {
		this.pressed = null;
		this.hits = makeHits();
		this.confirmUntil = null;
		this.buildHits(app, this.hits);
	},

	// True while the erase button is armed for its second tap.
	erasing: function (app) {
		return this.confirmUntil !== null && nowMs(app) < this.confirmUntil;
	},

	// Flip one setting and save. Safe with a missing settings object.
	toggle: function (app, key) {
		const s = app.settings || {};
		s[key] = !s[key];
		if (typeof app.saveSettings === 'function') {
			app.saveSettings();
		}
	},

	// First tap arms the erase for CONFIRM_MS; a tap while armed erases.
	erase: function (app) {
		if (!this.erasing(app)) {
			this.confirmUntil = nowMs(app) + CONFIRM_MS;
			return;
		}
		this.confirmUntil = null;
		if (typeof app.eraseSave === 'function') {
			app.eraseSave();
		}
		app.toast('Save erased');
	},

	// Rebuild a hit list matching what is on screen; buttons are added top
	// to bottom so a tap can only land on one of them.
	buildHits: function (app, hits) {
		const scene = this;
		const names = ['crt', 'sound', 'music'];
		for (let i = 0; i < names.length; i++) {
			const key = names[i];
			const R = LAYOUT[key];
			hits.add(key, R.x, R.y, R.w, R.h, function () {
				scene.toggle(app, key);
			});
		}
		const E = LAYOUT.erase;
		hits.add('erase', E.x, E.y, E.w, E.h, function () {
			scene.erase(app);
		});
		const B = LAYOUT.back;
		hits.add('back', B.x, B.y, B.w, B.h, function () {
			app.pop();
		});
	},

	pointer: function (app, type, x, y) {
		if (type === 'down') {
			// Tap rule: remember the hit's id, never the hit object.
			const h = this.hits ? this.hits.hit(x, y) : null;
			this.pressed = h ? h.id : null;
			return;
		}
		if (type === 'up') {
			const e = this.hits ? this.hits.hit(x, y) : null;
			if (e && this.pressed !== null && e.id === this.pressed && typeof e.onTap === 'function') {
				e.onTap(e);
			}
			this.pressed = null;
		}
	},

	key: function (app, k) {
		if (k === 'Escape') {
			app.pop();
		}
	},

	draw: function (ctx, app, t) {
		// Rebuild the hit list at the start of every draw so it always
		// matches what is on screen (DESIGN.md 9.7). Never reset the pressed
		// state here: it is managed by pointer() between down and up.
		const hits = makeHits();
		this.hits = hits;
		this.buildHits(app, hits);

		const s = app.settings || {};
		const armed = this.erasing(app);

		// Dim the room, then the settings panel.
		panel(ctx, 240, 40, 800, 660, { fill: PALETTE.ink, radius: 12 });
		label(ctx, 'SETTINGS', app.w / 2, 90, {
			size: 32, font: 'title', align: 'center', color: PALETTE.lamp, shadow: true,
		});

		const rows = [
			{ key: 'crt', label: toggleLabel('CRT FILTER', !!s.crt) },
			{ key: 'sound', label: toggleLabel('SOUND', !!s.sound) },
			{ key: 'music', label: toggleLabel('MUSIC', !!s.music) },
		];
		for (let i = 0; i < rows.length; i++) {
			drawRowButton(ctx, app, LAYOUT[rows[i].key], rows[i].key, rows[i].label);
		}
		drawRowButton(ctx, app, LAYOUT.erase, 'erase', armed ? 'TAP AGAIN TO CONFIRM' : 'ERASE SAVED GAME', 'danger');
		drawRowButton(ctx, app, LAYOUT.back, 'back', 'BACK');
	},
};

// One button plus its hit rectangle's pressed highlight.
function drawRowButton(ctx, app, R, id, text, kind) {
	button(ctx, {
		x: R.x, y: R.y, w: R.w, h: R.h,
		label: text,
		kind: kind,
		hot: settingsScene.pressed === id,
	});
}
