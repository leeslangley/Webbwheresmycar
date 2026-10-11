// Tests for the office hub scene (src/ui/scenes/office.js), run under
// macOS `jsc -m`. Uses the fake ctx and the fake app from the harness
// helpers, with startGame(3) as the state.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, texts, count } from './fakectx.js';
import { makeApp } from './fakeapp.js';
import { startGame } from '../src/sim/newgame.js';
import { officeScene, LAYOUT } from '../src/ui/scenes/office.js';
import { chatterFor } from '../src/data/chatter.js';

// A fresh app + state, with the scene already drawn once so the hit list
// exists (the scene rebuilds it at the start of every draw).
function freshApp() {
	const state = startGame(3);
	const app = makeApp(state);
	return { state: state, app: app };
}

// Tap the centre of a rect: down then up on the same spot.
function tap(app, scene, r) {
	const x = r.x + r.w / 2;
	const y = r.y + r.h / 2;
	scene.pointer(app, 'down', x, y);
	scene.pointer(app, 'up', x, y);
}

test('scene shape: id office, draw/pointer/key present, LAYOUT has the hit rects', () => {
	eq(officeScene.id, 'office', 'id is office');
	ok(typeof officeScene.draw === 'function', 'draw exists');
	ok(typeof officeScene.pointer === 'function', 'pointer exists');
	ok(typeof officeScene.key === 'function', 'key exists');
	const hits = LAYOUT.hits;
	const names = ['tv', 'phone', 'garageDoor', 'laptop', 'newspaper', 'ledger', 'workshop', 'kettle', 'calendar', 'poster', 'fatcat', 'stable', 'household', 'hammer'];
	for (let i = 0; i < names.length; i++) {
		const r = hits[names[i]];
		ok(r && typeof r.x === 'number' && typeof r.w === 'number', names[i] + ' rect present');
	}
});

test('draw works and shows the HUD cash and day', () => {
	const f = freshApp();
	const ctx = makeCtx();
	officeScene.draw(ctx, f.app, 0);
	const all = texts(ctx);
	let sawCash = false;
	let sawDay = false;
	for (let i = 0; i < all.length; i++) {
		if (all[i] === '£20,000') sawCash = true;
		if (all[i].indexOf('DAY 1') === 0) sawDay = true;
	}
	ok(sawCash, 'HUD cash £20,000 drawn');
	ok(sawDay, 'HUD day line drawn');
	ok(count(ctx, 'fillText') > 0, 'at least one text drawn');
});

test('tapping each hotspot calls the right push', () => {
	const expected = {
		tv: ['push', 'tvshop', undefined],
		phone: ['push', 'bookings', undefined],
		garageDoor: ['push', 'garage', undefined],
		laptop: ['push', 'adverts', undefined],
		ledger: ['push', 'ledger', undefined],
		newspaper: ['push', 'news', { readOnly: true }],
		workshop: ['push', 'ledger', { tab: 'workshop' }],
	};
	const names = Object.keys(expected);
	for (let i = 0; i < names.length; i++) {
		const f = freshApp();
		const ctx = makeCtx();
		officeScene.draw(ctx, f.app, 0);
		tap(f.app, officeScene, LAYOUT.hits[names[i]]);
		eq(f.app.calls, [expected[names[i]]], names[i] + ' tap opens the right screen');
	}
});

test('taps still fire after redraws: down, redraw, redraw, up on every hotspot', () => {
	const pushExpected = {
		tv: ['push', 'tvshop', undefined],
		phone: ['push', 'bookings', undefined],
		garageDoor: ['push', 'garage', undefined],
		laptop: ['push', 'adverts', undefined],
		newspaper: ['push', 'news', { readOnly: true }],
		ledger: ['push', 'ledger', undefined],
		workshop: ['push', 'ledger', { tab: 'workshop' }],
		poster: ['push', 'auction', undefined],
	};
	const names = Object.keys(LAYOUT.hits);
	for (let i = 0; i < names.length; i++) {
		const name = names[i];
		const f = freshApp();
		if (name === 'poster') {
			f.state.day = 24;
		}
		const r = LAYOUT.hits[name];
		const x = r.x + r.w / 2;
		const y = r.y + r.h / 2;
		officeScene.draw(makeCtx(), f.app, 1);
		officeScene.pointer(f.app, 'down', x, y);
		officeScene.draw(makeCtx(), f.app, 1.5);
		officeScene.draw(makeCtx(), f.app, 1.5);
		officeScene.pointer(f.app, 'up', x, y);
		if (name === 'kettle') {
			eq(f.state.day, 2, name + ' tap after redraws waits a day');
			eq(f.app.calls, [], name + ' tap after redraws pushes nothing');
		} else if (pushExpected[name]) {
			eq(f.app.calls, [pushExpected[name]], name + ' tap after redraws opens the right screen');
		} else {
			eq(f.app.calls, [], name + ' tap after redraws pushes nothing');
			eq(f.app.toasts.length, 1, name + ' tap after redraws toasts exactly once');
		}
	}
});

test('tapping the kettle waits a day', () => {
	const f = freshApp();
	const ctx = makeCtx();
	officeScene.draw(ctx, f.app, 0);
	tap(f.app, officeScene, LAYOUT.hits.kettle);
	eq(f.state.day, 2, 'day advanced to 2');
});

test('calendar tap toasts the date and days left', () => {
	const f = freshApp();
	const ctx = makeCtx();
	officeScene.draw(ctx, f.app, 0);
	tap(f.app, officeScene, LAYOUT.hits.calendar);
	eq(f.app.toasts, ['1 January - 364 days left'], 'calendar toast');
});

test('poster tap: day 1 toasts the auction hint, day 24 opens the auction', () => {
	const f = freshApp();
	const ctx = makeCtx();
	officeScene.draw(ctx, f.app, 0);
	tap(f.app, officeScene, LAYOUT.hits.poster);
	eq(f.app.calls, [], 'no push on day 1');
	eq(f.app.toasts.length, 1, 'one toast on day 1');
	ok(f.app.toasts[0].indexOf('24th') !== -1, 'day 1 toast mentions the 24th');

	const f2 = freshApp();
	f2.state.day = 24;
	const ctx2 = makeCtx();
	officeScene.draw(ctx2, f2.app, 0);
	tap(f2.app, officeScene, LAYOUT.hits.poster);
	eq(f2.app.calls, [['push', 'auction', undefined]], 'day 24 tap opens the auction');
});

test('the four plate taps toast their name and text', () => {
	const f = freshApp();
	const ctx = makeCtx();
	officeScene.draw(ctx, f.app, 0);
	tap(f.app, officeScene, LAYOUT.hits.fatcat);
	ok(f.app.toasts[0].indexOf('Fat Cat') === 0, 'fatcat toast names the plate');
	tap(f.app, officeScene, LAYOUT.hits.hammer);
	ok(f.app.toasts[1].indexOf('Hammer Time') === 0, 'hammer toast names the plate');
});

test('Dave keeps one line per day: two draws agree, the next day recomputes', () => {
	const f = freshApp();
	const ctx = makeCtx();
	officeScene.draw(ctx, f.app, 0);
	const day1 = officeScene.dayLine;
	eq(day1.day, 1, 'line cached for day 1');
	ok(typeof day1.line === 'string' && day1.line.length > 0, 'day 1 line is a string');
	const ctx2 = makeCtx();
	officeScene.draw(ctx2, f.app, 0);
	eq(officeScene.dayLine, day1, 'same day, same cached line object');
	eq(officeScene.dayLine.line, chatterFor({ rng: 1 * 7919 + 13 }, 'newmonth'), 'day 1 line matches the fixed-rng pick');

	f.state.day = 2;
	const ctx3 = makeCtx();
	officeScene.draw(ctx3, f.app, 0);
	eq(officeScene.dayLine.day, 2, 'line recomputed for day 2');
	eq(officeScene.dayLine.line, chatterFor({ rng: 2 * 7919 + 13 }, 'emptygarage'), 'day 2 line comes from its own rng');
});

test('Mark\'s mood follows the cash: happy at 40000 differs from worried at 1000', () => {
	const fRich = freshApp();
	fRich.state.cash = 40000;
	const ctxRich = makeCtx();
	officeScene.draw(ctxRich, fRich.app, 0);

	const fBroke = freshApp();
	fBroke.state.cash = 1000;
	const ctxBroke = makeCtx();
	officeScene.draw(ctxBroke, fBroke.app, 0);

	ok(count(ctxRich, 'fill') !== count(ctxBroke, 'fill'), 'happy and worried Mark draw different figures');
});

test('dayChangedAt unset still draws (no cross-out animation in progress)', () => {
	const f = freshApp();
	ok(f.app.dayChangedAt === undefined, 'fake app has no dayChangedAt');
	const ctx = makeCtx();
	officeScene.draw(ctx, f.app, 0);
	ok(count(ctx, 'fillRect') > 0, 'draw completed with the calendar at rest');
});

test('dayChangedAt set drives the cross-out animation argument', () => {
	const f = freshApp();
	f.app.dayChangedAt = 5000;
	// The fake app's clock is a plain number (real app: a function); both
	// must draw without throwing.
	ok(typeof f.app.now === 'number', 'fake app clock is a number');
	let ctx = makeCtx();
	officeScene.draw(ctx, f.app, 0);
	ok(count(ctx, 'fillRect') > 0, 'draw works with a numeric clock');
	f.app.now = function () { return 5200; };
	ctx = makeCtx();
	officeScene.draw(ctx, f.app, 0);
	ok(count(ctx, 'fillRect') > 0, 'draw works mid-animation');

	f.app.now = function () { return 9000; };
	const ctx2 = makeCtx();
	officeScene.draw(ctx2, f.app, 0);
	ok(count(ctx2, 'fillRect') > 0, 'draw works after the animation window');
});

test('glows: phone rings with requests, TV glows with an empty stable', () => {
	const f = freshApp();
	const ctx = makeCtx();
	officeScene.draw(ctx, f.app, 0);
	ok(f.state.requests.length > 0, 'a fresh game has open requests');
	// Baseline strokes include the room art, the 2 phone-glow strokes and
	// the 2 ringing arcs drawPhone adds while requests are open.
	const all = count(ctx, 'stroke');

	f.state.requests = [];
	const ctx2 = makeCtx();
	officeScene.draw(ctx2, f.app, 0);
	eq(count(ctx2, 'stroke'), all - 3, 'no phone glow or ring arcs without requests');

	f.state.cars.push({ owned: true, modelId: 't1_maurice' });
	const ctx3 = makeCtx();
	officeScene.draw(ctx3, f.app, 0);
	eq(count(ctx3, 'stroke'), all - 4, 'no TV glow once a car is owned');
});

test('keyboard shortcuts push the right screens', () => {
	const f = freshApp();
	officeScene.key(f.app, 't');
	officeScene.key(f.app, 'p');
	officeScene.key(f.app, 'g');
	officeScene.key(f.app, 'l');
	officeScene.key(f.app, 'n');
	eq(f.app.calls, [
		['push', 'tvshop', undefined],
		['push', 'bookings', undefined],
		['push', 'garage', undefined],
		['push', 'adverts', undefined],
		['push', 'news', { readOnly: true }],
	], 't p g l n shortcuts');

	const f2 = freshApp();
	officeScene.key(f2.app, 'k');
	eq(f2.state.day, 2, 'k waits a day');
	eq(f2.app.calls, [], 'k pushes nothing');

	const f3 = freshApp();
	officeScene.key(f3.app, 'a');
	eq(f3.app.calls, [], 'a does nothing outside auction day');
	f3.state.day = 24;
	officeScene.key(f3.app, 'a');
	eq(f3.app.calls, [['push', 'auction', undefined]], 'a opens the auction on day 24');
});

test('an up without a matching down does not tap', () => {
	const f = freshApp();
	const ctx = makeCtx();
	officeScene.draw(ctx, f.app, 0);
	officeScene.pointer(f.app, 'up', LAYOUT.hits.tv.x + 10, LAYOUT.hits.tv.y + 10);
	eq(f.app.calls, [], 'stray up is ignored');
});

test('pointer down and up on different props does not tap', () => {
	const f = freshApp();
	const ctx = makeCtx();
	officeScene.draw(ctx, f.app, 0);
	officeScene.pointer(f.app, 'down', LAYOUT.hits.tv.x + 10, LAYOUT.hits.tv.y + 10);
	officeScene.pointer(f.app, 'up', LAYOUT.hits.kettle.x + 10, LAYOUT.hits.kettle.y + 10);
	eq(f.app.calls, [], 'down on one prop and up on another is not a tap');
});

done();
