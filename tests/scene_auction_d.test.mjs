// Tests for the Auction hall's YOUR LOTS panel and leaving to settle
// (card W65d), run under `jsc -m`. Every interaction follows the real
// sequence: draw, pointer down, a redraw with a different t, pointer up.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, texts } from './fakectx.js';
import { makeApp } from './fakeapp.js';
import { auctionScene, LAYOUT } from '../src/ui/scenes/auction.js';
import { startGame } from '../src/sim/newgame.js';
import { placeBid, consignCar } from '../src/sim/auction.js';
import { money } from '../src/core/format.js';
import { modelOf, CARS } from '../src/data/cars.js';

// A fresh game on auction day (day 24) whose AI ceilings are so low they can
// never answer a bid, so the player always leads, with cash to spare.
function setup() {
	const state = startGame(8);
	state.day = 24;
	for (let i = 0; i < state.auction.lots.length; i++) {
		state.auction.lots[i].ceilings = [1, 1, 1];
	}
	state.cash = 500000;
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

// The centre of a LAYOUT rect.
function centre(r) {
	return [r.x + r.w / 2, r.y + r.h / 2];
}

// True when the app recorded a pop.
function popped(app) {
	for (let i = 0; i < app.calls.length; i++) {
		if (app.calls[i][0] === 'pop') {
			return true;
		}
	}
	return false;
}

test('LEAVE & SETTLE wins the led lot into the stable and advances to day 25', () => {
	const app = setup();
	const state = app.state;
	const lot = state.auction.lots[0];
	eq(placeBid(state, lot.lotId, 1).ok, true, 'the player leads lot 1');
	const before = state.cars.length;
	drawOnce(app);
	tap(app, centre(LAYOUT.leave)[0], centre(LAYOUT.leave)[1]);
	let won = null;
	for (let i = 0; i < state.cars.length; i++) {
		if (state.cars[i].modelId === lot.modelId && state.cars[i].paid === lot.currentBid) {
			won = state.cars[i];
		}
	}
	ok(won !== null, 'the won car is in state.cars');
	eq(won.owned, true, 'the won car is owned');
	eq(state.cars.length, before + 1, 'exactly one car was added');
	eq(state.day, 25, 'the day advanced to 25');
	eq(state.auction.lots.length, 0, 'the lots are gone');
});

test('BACK while leading a lot toasts and does not pop; Escape too', () => {
	const app = setup();
	const state = app.state;
	const lot = state.auction.lots[0];
	eq(placeBid(state, lot.lotId, 1).ok, true, 'the player leads lot 1');
	drawOnce(app);
	tap(app, centre(LAYOUT.back)[0], centre(LAYOUT.back)[1]);
	eq(app.toasts[app.toasts.length - 1], 'You are winning a lot. Settle first', 'the guard was toasted');
	eq(popped(app), false, 'the hall did not pop');
	eq(state.day, 24, 'the day did not advance');
	auctionScene.key(app, 'Escape');
	eq(app.toasts[app.toasts.length - 1], 'You are winning a lot. Settle first', 'Escape toasts the same guard');
	eq(popped(app), false, 'Escape did not pop either');
});

test('BACK with no lead pops the hall', () => {
	const app = setup();
	drawOnce(app);
	tap(app, centre(LAYOUT.back)[0], centre(LAYOUT.back)[1]);
	eq(popped(app), true, 'the hall popped');
});

test('a consigned car shows in YOUR LOTS with its reserve', () => {
	const app = setup();
	const state = app.state;
	// A synthetic owned car, so the test does not depend on what the
	// starting garage happens to hold.
	let owned = {
		id: 'ctest1',
		modelId: CARS[0].id,
		owned: true,
		owner: null,
		rentMonthly: 0,
		paid: 1000,
		condition: 6,
		fault: null,
		lastServiceDay: state.day,
		jobsDone: 0,
		boughtDay: state.day,
		impoundedUntil: 0,
		rentedAtCondition: null,
	};
	state.cars.push(owned);
	const ctx0 = makeCtx();
	auctionScene.draw(ctx0, app, 0);
	const ts0 = texts(ctx0);
	eq(ts0.indexOf('Nothing consigned') !== -1, true, 'the empty line shows');
	eq(ts0.indexOf('LEAVE & SETTLE') !== -1, true, 'the settle button is drawn');
	// Consigning is only allowed before auction day, so do it on day 23
	// and put the hall back on day 24 afterwards.
	state.day = 23;
	eq(consignCar(state, owned.id, 1000).ok, true, 'the car was consigned');
	state.day = 24;
	const ctx1 = makeCtx();
	auctionScene.draw(ctx1, app, 0);
	const ts1 = texts(ctx1);
	eq(ts1.indexOf('YOUR LOTS') !== -1, true, 'the panel title shows');
	eq(ts1.indexOf('Nothing consigned'), -1, 'the empty line is gone');
	eq(ts1.indexOf(money(1000)) !== -1, true, 'the reserve appears');
	const name = modelOf(owned.modelId).name;
	let nameSeen = false;
	for (let i = 0; i < ts1.length; i++) {
		if (ts1[i] === name) {
			nameSeen = true;
		}
	}
	eq(nameSeen, true, 'the consigned car name is listed');
});

done();
