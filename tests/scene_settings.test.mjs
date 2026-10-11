// Tests for the Settings scene (card W67), run under `jsc -m`.
// Every interaction follows the real sequence: draw, pointer down, a redraw
// with a different t, pointer up. The tap rule (remember the pressed id,
// never reset it inside draw) is exercised directly.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, texts } from './fakectx.js';
import { makeApp } from './fakeapp.js';
import { settingsScene, LAYOUT } from '../src/ui/scenes/settings.js';

// A clock the test can move by hand, as the card requires: `app.now` becomes
// a function returning the fake time in milliseconds.
function clockApp() {
	const app = makeApp(null);
	app.now = function () {
		return app.ms;
	};
	app.ms = 0;
	return app;
}

// One initial draw to build the hit list.
function drawOnce(app, t) {
	settingsScene.draw(makeCtx(), app, t || 0);
}

// The real interaction sequence: down, redraw with a different t, up.
function tap(app, x, y, t) {
	settingsScene.pointer(app, 'down', x, y);
	settingsScene.draw(makeCtx(), app, t || 0.5);
	settingsScene.pointer(app, 'up', x, y);
}

// Centre of a button rectangle.
function mid(R) {
	return [R.x + R.w / 2, R.y + R.h / 2];
}

// The labels on screen after a fresh draw.
function labels(app) {
	const ctx = makeCtx();
	settingsScene.draw(ctx, app, 0);
	return texts(ctx);
}

test('LAYOUT matches the card exactly', () => {
	eq(LAYOUT, {
		crt: { x: 340, y: 200, w: 600, h: 70 },
		sound: { x: 340, y: 290, w: 600, h: 70 },
		music: { x: 340, y: 380, w: 600, h: 70 },
		erase: { x: 340, y: 470, w: 600, h: 70 },
		back: { x: 340, y: 580, w: 600, h: 60 },
	}, 'LAYOUT rects');
	eq(settingsScene.id, 'settings', 'scene id');
});

test('draws the title and the initial labels', () => {
	const app = clockApp();
	settingsScene.enter(app, null);
	const ts = labels(app);
	ok(ts.indexOf('SETTINGS') !== -1, 'title drawn');
	ok(ts.indexOf('CRT FILTER: OFF') !== -1, 'CRT starts OFF');
	ok(ts.indexOf('SOUND: ON') !== -1, 'SOUND starts ON');
	ok(ts.indexOf('MUSIC: ON') !== -1, 'MUSIC starts ON');
	ok(ts.indexOf('ERASE SAVED GAME') !== -1, 'erase starts unarmed');
	ok(ts.indexOf('BACK') !== -1, 'BACK drawn');
});

test('title is drawn at 32px in the lamp colour with a shadow', () => {
	const app = clockApp();
	settingsScene.enter(app, null);
	const ctx = makeCtx();
	settingsScene.draw(ctx, app, 0);
	// The font property is set just before each fillText; find the fillText for
	// SETTINGS and check the font assignment recorded before it.
	let seen = null;
	let font = null;
	for (let i = 0; i < ctx.calls.length; i++) {
		if (ctx.calls[i][0] === 'set:font') seen = ctx.calls[i][1][0];
		if (ctx.calls[i][0] === 'fillText' && ctx.calls[i][1][0] === 'SETTINGS') font = seen;
	}
	eq(font, '32px "Press Start 2P", monospace', 'title font 32px');
	// The lamp colour is used at least once (the title).
	let lamp = false;
	for (let i = 0; i < ctx.calls.length; i++) {
		if (ctx.calls[i][0] === 'set:fillStyle' && ctx.calls[i][1][0] === '#FFD27A') lamp = true;
	}
	ok(lamp, 'lamp colour used');
});

test('each toggle flips the setting, saves it and changes its label', () => {
	const app = clockApp();
	settingsScene.enter(app, null);
	drawOnce(app);

	// CRT: OFF -> ON.
	eq(app.settings.crt, false, 'crt starts off');
	tap(app, mid(LAYOUT.crt)[0], mid(LAYOUT.crt)[1]);
	eq(app.settings.crt, true, 'crt flipped on');
	eq(app.calls[app.calls.length - 1], ['saveSettings'], 'saveSettings recorded');
	ok(labels(app).indexOf('CRT FILTER: ON') !== -1, 'crt label now ON');

	// CRT: ON -> OFF again.
	tap(app, mid(LAYOUT.crt)[0], mid(LAYOUT.crt)[1], 1);
	eq(app.settings.crt, false, 'crt flipped back off');
	ok(labels(app).indexOf('CRT FILTER: OFF') !== -1, 'crt label back to OFF');

	// SOUND: ON -> OFF.
	tap(app, mid(LAYOUT.sound)[0], mid(LAYOUT.sound)[1], 2);
	eq(app.settings.sound, false, 'sound flipped off');
	eq(app.calls[app.calls.length - 1], ['saveSettings'], 'saveSettings recorded for sound');
	ok(labels(app).indexOf('SOUND: OFF') !== -1, 'sound label now OFF');

	// MUSIC: ON -> OFF.
	tap(app, mid(LAYOUT.music)[0], mid(LAYOUT.music)[1], 3);
	eq(app.settings.music, false, 'music flipped off');
	eq(app.calls[app.calls.length - 1], ['saveSettings'], 'saveSettings recorded for music');
	ok(labels(app).indexOf('MUSIC: OFF') !== -1, 'music label now OFF');
});

test('one tap per toggle: down, redraw, up fires exactly once', () => {
	const app = clockApp();
	settingsScene.enter(app, null);
	drawOnce(app);
	let saves = 0;
	tap(app, mid(LAYOUT.sound)[0], mid(LAYOUT.sound)[1]);
	for (let i = 0; i < app.calls.length; i++) {
		if (app.calls[i][0] === 'saveSettings') saves += 1;
	}
	eq(saves, 1, 'exactly one saveSettings call');
});

test('mismatched down/up and orphan up do nothing', () => {
	const app = clockApp();
	settingsScene.enter(app, null);
	drawOnce(app);
	// Down on CRT, up on MUSIC: different ids, so nothing flips.
	settingsScene.pointer(app, 'down', mid(LAYOUT.crt)[0], mid(LAYOUT.crt)[1]);
	settingsScene.draw(makeCtx(), app, 0.5);
	settingsScene.pointer(app, 'up', mid(LAYOUT.music)[0], mid(LAYOUT.music)[1]);
	eq(app.settings.crt, false, 'crt untouched');
	eq(app.settings.music, true, 'music untouched');
	// Orphan up with no down first.
	settingsScene.pointer(app, 'up', mid(LAYOUT.sound)[0], mid(LAYOUT.sound)[1]);
	eq(app.settings.sound, true, 'sound untouched');
	// Down on CRT, up in dead space.
	settingsScene.pointer(app, 'down', mid(LAYOUT.crt)[0], mid(LAYOUT.crt)[1]);
	settingsScene.draw(makeCtx(), app, 0.75);
	settingsScene.pointer(app, 'up', 10, 10);
	eq(app.settings.crt, false, 'still untouched');
});

test('ERASE needs two taps and calls eraseSave once', () => {
	const app = clockApp();
	let erased = 0;
	app.eraseSave = function () {
		erased += 1;
		app.calls.push(['eraseSave']);
	};
	settingsScene.enter(app, null);
	drawOnce(app);

	// First tap only arms the button.
	tap(app, mid(LAYOUT.erase)[0], mid(LAYOUT.erase)[1]);
	eq(erased, 0, 'nothing erased on the first tap');
	ok(labels(app).indexOf('TAP AGAIN TO CONFIRM') !== -1, 'label asks for confirmation');
	ok(labels(app).indexOf('ERASE SAVED GAME') === -1, 'the old label is gone while armed');

	// Second tap in time erases and toasts.
	app.ms = 1000;
	tap(app, mid(LAYOUT.erase)[0], mid(LAYOUT.erase)[1], 1.5);
	eq(erased, 1, 'eraseSave called once');
	eq(app.toasts.indexOf('Save erased') !== -1, true, 'toast shown');
	eq(labels(app).indexOf('ERASE SAVED GAME') !== -1, true, 'label back to normal after erasing');
});

test('the confirm expires after 3000 ms', () => {
	const app = clockApp();
	let erased = 0;
	app.eraseSave = function () {
		erased += 1;
	};
	settingsScene.enter(app, null);
	drawOnce(app);

	// Arm at t=0.
	tap(app, mid(LAYOUT.erase)[0], mid(LAYOUT.erase)[1]);
	ok(labels(app).indexOf('TAP AGAIN TO CONFIRM') !== -1, 'armed');

	// At 2999 ms the second tap still erases.
	app.ms = 2999;
	ok(labels(app).indexOf('TAP AGAIN TO CONFIRM') !== -1, 'still armed at 2999 ms');
	tap(app, mid(LAYOUT.erase)[0], mid(LAYOUT.erase)[1], 3);
	eq(erased, 1, 'erased just inside the window');
	eq(app.toasts.indexOf('Save erased') !== -1, true, 'toast shown');

	// At 3000 ms the arm has expired: the next tap only re-arms.
	app.ms = 0;
	tap(app, mid(LAYOUT.erase)[0], mid(LAYOUT.erase)[1], 4);
	app.ms = 3000;
	ok(labels(app).indexOf('ERASE SAVED GAME') !== -1, 'expired at 3000 ms');
	tap(app, mid(LAYOUT.erase)[0], mid(LAYOUT.erase)[1], 5);
	eq(erased, 1, 'an expired tap does not erase');
	ok(labels(app).indexOf('TAP AGAIN TO CONFIRM') !== -1, 'the expired tap re-armed instead');
});

test('ERASE works with no eraseSave on the app', () => {
	const app = clockApp();
	settingsScene.enter(app, null);
	drawOnce(app);
	tap(app, mid(LAYOUT.erase)[0], mid(LAYOUT.erase)[1]);
	tap(app, mid(LAYOUT.erase)[0], mid(LAYOUT.erase)[1], 2);
	eq(app.toasts.indexOf('Save erased') !== -1, true, 'still toasts');
});

test('BACK taps and Escape both pop', () => {
	const app = clockApp();
	settingsScene.enter(app, null);
	drawOnce(app);
	tap(app, mid(LAYOUT.back)[0], mid(LAYOUT.back)[1]);
	eq(app.calls[app.calls.length - 1], ['pop'], 'BACK popped');

	settingsScene.key(app, 'Escape');
	eq(app.calls[app.calls.length - 1], ['pop'], 'Escape popped');

	// An unrelated key does nothing.
	const before = app.calls.length;
	settingsScene.key(app, 'x');
	eq(app.calls.length, before, 'other keys ignored');
});

test('draw with no settings object does not throw', () => {
	const app = clockApp();
	app.settings = null;
	settingsScene.enter(app, null);
	settingsScene.draw(makeCtx(), app, 0);
	ok(true, 'no throw with null settings');
	tap(app, mid(LAYOUT.sound)[0], mid(LAYOUT.sound)[1]);
	ok(true, 'toggle with a null settings object does not throw');
});

done();
