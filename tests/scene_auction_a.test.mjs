// Tests for the Auction hall scene (card W65a), run under `jsc -m`.
// Every interaction follows the real sequence: draw, pointer down, a redraw
// with a different t, pointer up. The tap rule (remember the pressed id,
// never reset it inside draw) is exercised directly.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, texts } from './fakectx.js';
import { makeApp } from './fakeapp.js';
import { auctionScene, LAYOUT } from '../src/ui/scenes/auction.js';
import { startGame } from '../src/sim/newgame.js';
import { lotView } from '../src/sim/auction.js';
import { money } from '../src/core/format.js';

// A fresh game on auction day (day 24 of January). startGame already calls
// prepareAuction, so the six lots are there.
function setup(day) {
	const state = startGame(8);
	state.day = day !== undefined ? day : 24;
	const app = makeApp(state);
	auctionScene.enter(app, null);
	return app;
}

// One initial draw to build the hit list.
function drawOnce(app) {
	auctionScene.draw(makeCtx(), app, 0);
}

// The real interaction sequence: down, redraw with a different t, up.
function tap(app, x, y) {
	auctionScene.pointer(app, 'down', x, y);
	auctionScene.draw(makeCtx(), app, 0.5);
	auctionScene.pointer(app, 'up', x, y);
}

// The name of lot i in the current auction.
function lotName(state, i) {
	return lotView(state, state.auction.lots[i].lotId).name;
}

// The centre of a LAYOUT rect.
function centre(r) {
	return [r.x + r.w / 2, r.y + r.h / 2];
}

test('LAYOUT matches the card exactly and the scene id is auction', () => {
	eq(LAYOUT, {
		prev: { x: 40, y: 300, w: 60, h: 80 },
		next: { x: 1180, y: 300, w: 60, h: 80 },
		picture: { x: 120, y: 100, w: 1040, h: 260 },
		reveals: [
			{ x: 60, y: 390, w: 280, h: 50 },
			{ x: 60, y: 446, w: 280, h: 50 },
			{ x: 60, y: 502, w: 280, h: 50 },
			{ x: 60, y: 558, w: 280, h: 50 },
		],
		bid1: { x: 700, y: 520, w: 260, h: 64 },
		bid3: { x: 980, y: 520, w: 260, h: 64 },
		leave: { x: 700, y: 600, w: 540, h: 70 },
		back: { x: 40, y: 650, w: 200, h: 50 },
	}, 'LAYOUT rects');
	eq(auctionScene.id, 'auction', 'scene id');
});

test('enter on auction day starts on lot 1 and draws its header', () => {
	const app = setup();
	eq(auctionScene.lotIndex, 0, 'starts on the first lot');
	eq(app.toasts.length, 0, 'no toast on auction day');
	const state = app.state;
	const ctx = makeCtx();
	auctionScene.draw(ctx, app, 0);
	const ts = texts(ctx);
	const view = lotView(state, state.auction.lots[0].lotId);
	ok(ts.indexOf(view.name) !== -1, 'the first lot name appears');
	ok(ts.indexOf('LOT 1/6') !== -1, 'lot counter shows 1 of 6');
	ok(ts.indexOf(String(view.year)) !== -1, 'the year appears');
	ok(ts.indexOf('Estimate ' + money(view.estLow) + ' to ' + money(view.estHigh)) !== -1, 'the estimate range appears');
	ok(ts.indexOf('PREV') !== -1, 'PREV button drawn');
	ok(ts.indexOf('NEXT') !== -1, 'NEXT button drawn');
});

test('NEXT moves on to the second lot', () => {
	const app = setup();
	drawOnce(app);
	tap(app, centre(LAYOUT.next)[0], centre(LAYOUT.next)[1]);
	eq(auctionScene.lotIndex, 1, 'NEXT advanced one lot');
	const ctx = makeCtx();
	auctionScene.draw(ctx, app, 0);
	const ts = texts(ctx);
	ok(ts.indexOf(lotName(app.state, 1)) !== -1, 'the second lot name appears');
	ok(ts.indexOf('LOT 2/6') !== -1, 'lot counter shows 2 of 6');
});

test('PREV from the first lot wraps round to lot 6', () => {
	const app = setup();
	drawOnce(app);
	tap(app, centre(LAYOUT.prev)[0], centre(LAYOUT.prev)[1]);
	eq(auctionScene.lotIndex, 5, 'PREV wrapped back to the last lot');
	const ctx = makeCtx();
	auctionScene.draw(ctx, app, 0);
	const ts = texts(ctx);
	ok(ts.indexOf(lotName(app.state, 5)) !== -1, 'the sixth lot name appears');
	ok(ts.indexOf('LOT 6/6') !== -1, 'lot counter shows 6 of 6');
});

test('NEXT past the last lot wraps round to lot 1', () => {
	const app = setup();
	auctionScene.lotIndex = 5;
	drawOnce(app);
	tap(app, centre(LAYOUT.next)[0], centre(LAYOUT.next)[1]);
	eq(auctionScene.lotIndex, 0, 'NEXT wrapped forward to the first lot');
});

test('Left and Right keys browse the lots', () => {
	const app = setup();
	auctionScene.key(app, 'ArrowRight');
	eq(auctionScene.lotIndex, 1, 'Right goes forward');
	auctionScene.key(app, 'Right');
	eq(auctionScene.lotIndex, 2, 'the bare Right key also goes forward');
	auctionScene.key(app, 'ArrowLeft');
	eq(auctionScene.lotIndex, 1, 'Left goes back');
	auctionScene.key(app, 'Left');
	auctionScene.key(app, 'Left');
	eq(auctionScene.lotIndex, 5, 'Left wraps round past the first lot');
});

test('enter on a day that is not the 24th toasts and pops', () => {
	const app = setup(10);
	eq(app.toasts.indexOf('The auction is only on the 24th') !== -1, true, 'refusal toasted');
	eq(app.calls[app.calls.length - 1], ['pop'], 'the scene popped off');
});

test('tap rule: down, redraw with a different t, up fires NEXT exactly once', () => {
	const app = setup();
	drawOnce(app);
	const x = centre(LAYOUT.next)[0];
	const y = centre(LAYOUT.next)[1];
	auctionScene.pointer(app, 'down', x, y);
	// Several redraws between down and up: the pressed id must survive them.
	auctionScene.draw(makeCtx(), app, 0.25);
	auctionScene.draw(makeCtx(), app, 0.5);
	auctionScene.pointer(app, 'up', x, y);
	eq(auctionScene.lotIndex, 1, 'the action ran exactly once');
	eq(auctionScene.pressed, null, 'pressed cleared on up');
});

test('mismatched down/up and an orphan up do nothing', () => {
	const app = setup();
	drawOnce(app);
	// Down on NEXT, up on PREV: different ids, so no move.
	const nx = centre(LAYOUT.next)[0];
	auctionScene.pointer(app, 'down', nx, centre(LAYOUT.next)[1]);
	auctionScene.draw(makeCtx(), app, 0.5);
	auctionScene.pointer(app, 'up', centre(LAYOUT.prev)[0], centre(LAYOUT.prev)[1]);
	eq(auctionScene.lotIndex, 0, 'no move for a mismatched tap');
	// An up with no down before it does nothing either.
	auctionScene.pointer(app, 'up', nx, centre(LAYOUT.next)[1]);
	eq(auctionScene.lotIndex, 0, 'no move for an orphan up');
});

test('BACK and Escape pop the scene', () => {
	const app = setup();
	drawOnce(app);
	tap(app, centre(LAYOUT.back)[0], centre(LAYOUT.back)[1]);
	eq(app.calls[app.calls.length - 1], ['pop'], 'BACK pops');
	auctionScene.key(app, 'Escape');
	eq(app.calls[app.calls.length - 1], ['pop'], 'Escape pops');
});

test('draw with no state does nothing and does not throw', () => {
	const app = makeApp(null);
	auctionScene.enter(app, null);
	auctionScene.draw(makeCtx(), app, 0);
	ok(true, 'no throw with a null state');
});

done();
