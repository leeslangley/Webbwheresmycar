// Tests for the Daily Sprocket newspaper scene (card W63), run under `jsc -m`.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, texts, reset, anySet } from './fakectx.js';
import { makeApp } from './fakeapp.js';
import { newsScene, LAYOUT } from '../src/ui/scenes/news.js';
import { PALETTE } from '../src/ui/theme.js';

// Hand-made state per the card: day 5, one event, no month report.
function baseState() {
	return {
		day: 5,
		today: {
			headline: 'VICAR VANISHES: VERGER VEXED',
			events: ['Bought the Mini for £9,000'],
			monthReport: null,
		},
		flags: { gameOver: false },
	};
}

function monthReport() {
	return {
		month: 1,
		monthName: 'January',
		rent: 1000,
		running: 460,
		lease: 400,
		total: 1860,
		cashAfter: 18140,
		newFaults: ['Mini: Flat battery'],
	};
}

// A fresh app with the scene entered (which plays the paper sound).
function freshApp(state, params) {
	const app = makeApp(state);
	newsScene.enter(app, params || {});
	return app;
}

// Draw once so the hit list exists, matching what is on screen.
function drawOnce(app, t) {
	const ctx = makeCtx();
	newsScene.draw(ctx, app, t === undefined ? 0 : t);
	return ctx;
}

// A tap anywhere: down then up at the same point.
function tap(app, x, y) {
	newsScene.pointer(app, 'down', x, y);
	newsScene.pointer(app, 'up', x, y);
}

// True when the recorded texts contain text, either whole or as wrapped
// pieces drawn on consecutive lines (joined with spaces they equal text).
function hasText(got, text) {
	if (got.indexOf(text) !== -1) {
		return true;
	}
	const words = text.split(' ');
	for (let i = 0; i <= got.length - words.length; i++) {
		if (got.slice(i, i + words.length).join(' ') === text) {
			return true;
		}
	}
	return false;
}

// Number of pops recorded so far.
function pops(app) {
	let n = 0;
	for (let i = 0; i < app.calls.length; i++) {
		if (app.calls[i][0] === 'pop') {
			n += 1;
		}
	}
	return n;
}

test('scene shape: id news, overlay true, LAYOUT rects are on screen', () => {
	eq(newsScene.id, 'news', 'id is news');
	eq(newsScene.overlay, true, 'news is an overlay scene');
	eq(LAYOUT.paper, { x: 240, y: 40, w: 800, h: 640 }, 'paper rect');
	eq(LAYOUT.button, { x: 480, y: 610, w: 320, h: 56 }, 'button rect');
	ok(LAYOUT.button.x >= LAYOUT.paper.x && LAYOUT.button.x + LAYOUT.button.w <= LAYOUT.paper.x + LAYOUT.paper.w, 'button sits inside the paper');
});

test('page 1 shows masthead, dateline, headline and the event line', () => {
	const app = freshApp(baseState());
	const ctx = drawOnce(app);
	const got = texts(ctx);
	ok(hasText(got, 'THE DAILY SPROCKET'), 'masthead present');
	ok(hasText(got, '5 January'), 'dateline present');
	ok(hasText(got, 'VICAR VANISHES: VERGER VEXED'), 'headline present (whole or wrapped)');
	ok(hasText(got, '* Bought the Mini for £9,000'), 'event line present');
	ok(hasText(got, 'CONTINUE'), 'continue button present');
});

test('enter plays the paper sound', () => {
	const app = freshApp(baseState());
	ok(app.calls.some(function (c) {
		return c[0] === 'play' && c[1] === 'paper';
	}), "['play','paper'] recorded on enter");
});

test('one tap pops the scene', () => {
	const app = freshApp(baseState());
	drawOnce(app);
	tap(app, 640, 360);
	eq(pops(app), 1, 'one pop recorded');
});

test('a tap fires when draw runs between down and up', () => {
	const app = freshApp(baseState());
	drawOnce(app, 0);
	newsScene.pointer(app, 'down', 640, 360);
	drawOnce(app, 0.5);
	newsScene.pointer(app, 'up', 640, 360);
	eq(pops(app), 1, 'tap fires exactly once across a redraw');
});

test('with a month report the first tap shows page 2 and the second pops', () => {
	const state = baseState();
	state.today.monthReport = monthReport();
	const app = freshApp(state);
	const ctx1 = drawOnce(app);
	tap(app, 640, 360);
	eq(pops(app), 0, 'first tap does not pop');
	const ctx2 = drawOnce(app);
	const got = texts(ctx2);
	ok(hasText(got, 'MONTH END: JANUARY'), 'month heading present');
	ok(hasText(got, '£1,860'), 'total present');
	ok(hasText(got, '£18,140'), 'cash after present');
	ok(hasText(got, 'Fault: Mini: Flat battery'), 'fault line present');
	ok(hasText(got, 'Rent £1,000'), 'rent line present');
	ok(hasText(got, 'Running costs £460'), 'running line present');
	ok(hasText(got, 'Garage lease £400'), 'lease line present');
	tap(app, 640, 360);
	eq(pops(app), 1, 'second tap pops');
});

test('page 2 shows at most 4 faults', () => {
	const state = baseState();
	state.today.monthReport = monthReport();
	state.today.monthReport.newFaults = ['A', 'B', 'C', 'D', 'E'];
	const app = freshApp(state);
	drawOnce(app);
	tap(app, 640, 360);
	const ctx = drawOnce(app);
	const got = texts(ctx);
	ok(hasText(got, 'Fault: A') && hasText(got, 'Fault: D'), 'first four faults shown');
	ok(!hasText(got, 'Fault: E'), 'fifth fault is not shown');
});

test('readOnly pops on the first tap and the button says BACK', () => {
	const state = baseState();
	state.today.monthReport = monthReport();
	const app = freshApp(state, { readOnly: true });
	const ctx = drawOnce(app);
	ok(hasText(texts(ctx), 'BACK'), 'readOnly button says BACK');
	ok(!hasText(texts(ctx), 'MONTH END:'), 'readOnly never shows the month report');
	tap(app, 640, 360);
	eq(pops(app), 1, 'readOnly pops on the first tap');
});

test('GOLD NUMBER PLATE events are drawn in gold', () => {
	const state = baseState();
	state.today.events = ['GOLD NUMBER PLATE won: Fat Cat!', 'Bought the Mini for £9,000'];
	const app = freshApp(state);
	const ctx = drawOnce(app);
	ok(anySet(ctx, 'fillStyle', PALETTE.gold), 'gold fill used for the plate event');
});

test('more than 6 events are cut with ...and more', () => {
	const state = baseState();
	state.today.events = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];
	const app = freshApp(state);
	const ctx = drawOnce(app);
	const got = texts(ctx);
	ok(hasText(got, '* One') && hasText(got, '* Six'), 'first six events shown');
	ok(!hasText(got, 'Seven') && !hasText(got, 'Eight'), 'events past six are not shown');
	ok(hasText(got, '...and more'), 'the more line is appended');
});

test('the entrance animation: draw at now 0 and now 1000 differ', () => {
	const app = freshApp(baseState());
	eq(app.now, 0, 'fake app starts at now 0');
	const ctx1 = makeCtx();
	newsScene.draw(ctx1, app, 0);
	const log0 = JSON.stringify(ctx1.calls);
	app.now = 1000;
	reset(ctx1);
	newsScene.draw(ctx1, app, 0);
	const log1 = JSON.stringify(ctx1.calls);
	ok(log0.length > 0 && log1.length > 0, 'both draws produced calls');
	ok(log0 !== log1, 'the entrance animation changes the drawing');
});

test('keys Enter, Space and Escape advance like a tap', () => {
	const app = freshApp(baseState());
	newsScene.key(app, 'Enter');
	eq(pops(app), 1, 'Enter pops');
	const app2 = freshApp(baseState());
	newsScene.key(app2, ' ');
	eq(pops(app2), 1, 'Space pops');
	const app3 = freshApp(baseState());
	newsScene.key(app3, 'Escape');
	eq(pops(app3), 1, 'Escape pops');
});

test('with a month report Enter shows page 2 and the next Enter pops', () => {
	const state = baseState();
	state.today.monthReport = monthReport();
	const app = freshApp(state);
	newsScene.key(app, 'Enter');
	eq(pops(app), 0, 'first Enter does not pop');
	newsScene.key(app, 'Enter');
	eq(pops(app), 1, 'second Enter pops');
});

test('a tap that lands outside the screen does nothing', () => {
	const app = freshApp(baseState());
	drawOnce(app);
	newsScene.pointer(app, 'down', 2000, 2000);
	newsScene.pointer(app, 'up', 2000, 2000);
	eq(pops(app), 0, 'off-screen tap is a no-op');
});

test('a down without an up does not advance', () => {
	const app = freshApp(baseState());
	drawOnce(app);
	newsScene.pointer(app, 'down', 640, 360);
	eq(pops(app), 0, 'a lone down does nothing');
});

test('drawing twice does not double-fire or corrupt the hit list', () => {
	const app = freshApp(baseState());
	drawOnce(app);
	drawOnce(app);
	tap(app, 640, 360);
	eq(pops(app), 1, 'still exactly one pop after two draws');
});

done();
