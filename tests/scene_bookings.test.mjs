// Tests for the bookings scene (src/ui/scenes/bookings.js, card W62), run
// under macOS `jsc -m`. Uses the fake ctx and fake app, with startGame(6)
// as the base state and hand-made requests and cars on top.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, texts } from './fakectx.js';
import { makeApp } from './fakeapp.js';
import { startGame } from '../src/sim/newgame.js';
import { bookingsScene, LAYOUT } from '../src/ui/scenes/bookings.js';

// Tap points, derived from LAYOUT so the tests do not hard-code pixels.
const ROW = { x: LAYOUT.requests.x + 280, y: LAYOUT.requests.y + LAYOUT.rowH / 2 };
const ZED = { x: LAYOUT.cars.x + LAYOUT.carW / 2, y: LAYOUT.cars.y + LAYOUT.cars.h / 2 };
const ALLERGY = { x: LAYOUT.cars.x + LAYOUT.carW + LAYOUT.carW / 2, y: LAYOUT.cars.y + LAYOUT.cars.h / 2 };
const ACCEPT = { x: LAYOUT.accept.x + LAYOUT.accept.w / 2, y: LAYOUT.accept.y + LAYOUT.accept.h / 2 };

// A hand-made wedding request: minD 6, minR 5, minCond 6, fee 1,000,
// expires on day 8 (DESIGN.md 8.2 wedding row, eased away on purpose).
function makeWedding() {
	return {
		id: 'Q900',
		jobTypeId: 'wedding',
		customer: 'Nerys Bucket',
		fee: 1000,
		minDesirability: 6,
		minReliability: 5,
		minCondition: 6,
		expiresDay: 8,
		blurb: 'Nerys Bucket needs something posh for the big day, and the vicar is already tapping the watch.'
	};
}

// A hand-made stable car with the fields the sim and the scene both read.
function makeCar(id, modelId, condition) {
	return {
		id: id,
		modelId: modelId,
		owned: true,
		owner: null,
		rentMonthly: 0,
		paid: 0,
		condition: condition,
		fault: null,
		lastServiceDay: 1,
		jobsDone: 0,
		boughtDay: 1,
		impoundedUntil: 0,
		rentedAtCondition: null
	};
}

// A fresh app and state: the opening requests and shop are replaced with
// the hand-made wedding booking and two cars, one good and one too plain.
function freshApp() {
	const state = startGame(6);
	state.requests = [makeWedding()];
	state.cars = [makeCar('c1', 't2_zed', 10), makeCar('c2', 't1_allergy', 10)];
	const app = makeApp(state);
	bookingsScene.enter(app);
	return { state: state, app: app };
}

// Tap the centre of a rect: down then up on the same spot.
function tap(app, p) {
	bookingsScene.pointer(app, 'down', p.x, p.y);
	bookingsScene.pointer(app, 'up', p.x, p.y);
}

function has(all, want) {
	return all.indexOf(want) !== -1;
}

test('scene shape: id bookings and the LAYOUT matches the card', () => {
	eq(bookingsScene.id, 'bookings', 'id is bookings');
	ok(typeof bookingsScene.enter === 'function', 'enter exists');
	ok(typeof bookingsScene.draw === 'function', 'draw exists');
	ok(typeof bookingsScene.pointer === 'function', 'pointer exists');
	ok(typeof bookingsScene.key === 'function', 'key exists');
	eq(LAYOUT.requests, { x: 40, y: 110, w: 560, h: 360 }, 'requests rect');
	eq(LAYOUT.rowH, 90, 'row height');
	eq(LAYOUT.cars, { x: 40, y: 490, w: 560, h: 150 }, 'cars rect');
	eq(LAYOUT.carW, 180, 'card width');
	eq(LAYOUT.detail, { x: 620, y: 110, w: 620, h: 420 }, 'detail rect');
	eq(LAYOUT.accept, { x: 620, y: 550, w: 620, h: 70 }, 'accept rect');
	eq(LAYOUT.back, { x: 40, y: 650, w: 200, h: 50 }, 'back rect');
});

test('first draw shows header, job, customer, fee, days left and both cars', () => {
	const f = freshApp();
	const ctx = makeCtx();
	bookingsScene.draw(ctx, f.app, 0);
	const got = texts(ctx);
	ok(has(got, 'BOOKINGS'), 'header drawn');
	ok(has(got, 'Wedding'), 'job name drawn');
	ok(has(got, 'Nerys Bucket'), 'customer name drawn');
	ok(has(got, '£1,000'), 'fee drawn with thousands separator');
	ok(has(got, '7 days left'), 'days left drawn (8 - day 1)');
	ok(has(got, 'Dutsun 24-Zed'), 'good car card drawn');
	ok(has(got, 'Austen Allergy'), 'plain car card drawn');
});

test('tapping a request shows the blurb and the three requirement lines', () => {
	const f = freshApp();
	const ctx = makeCtx();
	bookingsScene.draw(ctx, f.app, 0);
	tap(f.app, ROW);
	bookingsScene.draw(ctx, f.app, 0);
	const got = texts(ctx);
	ok(has(got, 'Nerys Bucket needs something posh'), 'blurb drawn (first wrapped line)');
	ok(has(got, 'Style needed 6'), 'style line drawn');
	ok(has(got, 'Reliability needed 5'), 'reliability line drawn');
	ok(has(got, 'Condition needed 6'), 'condition line drawn');
	ok(!has(got, 'OK'), 'no OK verdict without a car picked');
});

test('picking the good car turns the requirement lines OK', () => {
	const f = freshApp();
	const ctx = makeCtx();
	bookingsScene.draw(ctx, f.app, 0);
	tap(f.app, ROW);
	tap(f.app, ZED);
	bookingsScene.draw(ctx, f.app, 0);
	const got = texts(ctx);
	ok(has(got, 'OK'), 'OK verdicts drawn for the good car');
	ok(has(got, '6.0'), 'effective style value printed to one decimal');
	ok(has(got, '10.0'), 'effective condition printed to one decimal');
	ok(!has(got, 'NO'), 'no NO verdict for the good car');
});

test('ACCEPT before picking a car toasts Pick a car first and changes nothing', () => {
	const f = freshApp();
	const ctx = makeCtx();
	const cash = f.state.cash;
	bookingsScene.draw(ctx, f.app, 0);
	tap(f.app, ACCEPT);
	eq(f.app.toasts, ['Pick a car first'], 'toast recorded');
	eq(f.state.day, 1, 'day unchanged');
	eq(f.state.cash, cash, 'cash unchanged');
	eq(f.state.requests.length, 1, 'request still on the board');
});

test('a too-plain car greys out with TOO PLAIN and ACCEPT explains itself', () => {
	const f = freshApp();
	const ctx = makeCtx();
	const cash = f.state.cash;
	bookingsScene.draw(ctx, f.app, 0);
	tap(f.app, ROW);
	bookingsScene.draw(ctx, f.app, 0);
	ok(has(texts(ctx), 'TOO PLAIN'), 'the allergy car shows TOO PLAIN');
	tap(f.app, ALLERGY);
	bookingsScene.draw(ctx, f.app, 0);
	tap(f.app, ACCEPT);
	eq(f.app.toasts.length, 1, 'exactly one reason toast');
	ok(f.app.toasts[0].indexOf('plain') !== -1, 'toast names the failing need: ' + f.app.toasts[0]);
	eq(f.state.day, 1, 'day unchanged');
	eq(f.state.cash, cash, 'cash unchanged');
	eq(f.state.requests.length, 1, 'request still on the board');
	eq(f.state.cars[1].condition, 10, 'car condition untouched');
});

test('down, redraw at a different t, up: ACCEPT fires exactly once', () => {
	const f = freshApp();
	const ctx = makeCtx();
	bookingsScene.draw(ctx, f.app, 0);
	tap(f.app, ROW);
	tap(f.app, ZED);
	bookingsScene.draw(ctx, f.app, 0);
	const pending = f.state.pending.length;
	bookingsScene.pointer(f.app, 'down', ACCEPT.x, ACCEPT.y);
	bookingsScene.draw(ctx, f.app, 5);
	bookingsScene.pointer(f.app, 'up', ACCEPT.x, ACCEPT.y);
	eq(f.state.day, 2, 'the job cost exactly one day');
	// advanceDay sweeps pending into the new day's events and may append its
	// own phone-rings note, so the exactly-once signal is the refusals: the
	// scene clears the selection after an accept, so a second fire would
	// have toasted 'Pick a car first' and a re-hit 'No such booking'.
	eq(f.state.pending.length, 0, 'the tray was swept');
	ok(f.state.today.events.length >= pending + 1, 'the job resolution text landed in today\'s events');
	eq(f.app.toasts.length, 0, 'no refusal toast, so the tap did not fire twice');
	eq(f.app.toasts.length, 0, 'no refusal toast, so the tap did not fire twice');
	let gone = true;
	for (let i = 0; i < f.state.requests.length; i++) {
		if (f.state.requests[i].id === 'Q900') gone = false;
	}
	ok(gone, 'the accepted request is off the board');
});

test('empty states: quiet phone and empty stable', () => {
	const f = freshApp();
	f.state.requests = [];
	f.state.cars = [];
	const ctx = makeCtx();
	bookingsScene.draw(ctx, f.app, 0);
	const got = texts(ctx);
	ok(has(got, 'suspiciously quiet. Try'), 'quiet phone message (wrapped)');
	ok(has(got, 'You need a car first.'), 'empty stable message');
});

test('Escape pops and the BACK button pops', () => {
	const f = freshApp();
	bookingsScene.key(f.app, 'Escape');
	eq(f.app.calls, [['pop']], 'Escape recorded a pop');
	const ctx = makeCtx();
	bookingsScene.draw(ctx, f.app, 0);
	tap(f.app, { x: LAYOUT.back.x + LAYOUT.back.w / 2, y: LAYOUT.back.y + LAYOUT.back.h / 2 });
	eq(f.app.calls, [['pop'], ['pop']], 'BACK recorded a second pop');
});

test('a tap that lands nowhere changes nothing', () => {
	const f = freshApp();
	const ctx = makeCtx();
	bookingsScene.draw(ctx, f.app, 0);
	tap(f.app, { x: 610, y: 400 });
	eq(f.app.toasts, [], 'no toast');
	eq(f.app.calls, [], 'no navigation');
	eq(bookingsScene.selReq, null, 'no request selected');
	eq(bookingsScene.selCar, null, 'no car selected');
});

done();
