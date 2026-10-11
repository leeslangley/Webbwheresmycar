// Tests for the TV shop scene, input half (card W59b), run under `jsc -m`.
// Every interaction follows the real sequence: pointer down, a redraw with
// a different t, pointer up. The tap rule (remember the pressed id, never
// reset it inside draw) is exercised directly, drags included.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, texts } from './fakectx.js';
import { makeApp } from './fakeapp.js';
import { tvshopScene, LAYOUT } from '../src/ui/scenes/tvshop.js';
import { startGame } from '../src/sim/newgame.js';
import { makeListing } from '../src/sim/shop.js';

// A fresh app with a real game state behind it, scene entered and drawn
// once, the way the running app would have it before any input.
function makeCtxApp() {
	const app = makeApp(startGame(5));
	tvshopScene.enter(app);
	tvshopScene.draw(makeCtx(), app, 0);
	return app;
}

// The real interaction sequence: down, a redraw, up.
function tap(app, x, y) {
	tvshopScene.pointer(app, 'down', x, y);
	tvshopScene.draw(makeCtx(), app, 1);
	tvshopScene.pointer(app, 'up', x, y);
}

// Centre of row i in the list, at zero scroll offset.
function rowY(i) {
	return LAYOUT.list.y + i * LAYOUT.rowH + LAYOUT.rowH / 2;
}

function rowX() {
	return LAYOUT.list.x + LAYOUT.list.w / 2;
}

// Button centres, from LAYOUT.
const BUY = [LAYOUT.buy.x + LAYOUT.buy.w / 2, LAYOUT.buy.y + LAYOUT.buy.h / 2];
const RENT = [LAYOUT.rent.x + LAYOUT.rent.w / 2, LAYOUT.rent.y + LAYOUT.rent.h / 2];
const BACK = [LAYOUT.back.x + LAYOUT.back.w / 2, LAYOUT.back.y + LAYOUT.back.h / 2];

// Index of the first listing with the given mode, or -1.
function findMode(listings, mode) {
	for (let i = 0; i < listings.length; i++) {
		if (listings[i].mode === mode) {
			return i;
		}
	}
	return -1;
}

test('tapping row 1 selects it', () => {
	const app = makeCtxApp();
	tvshopScene.pointer(app, 'down', rowX(), rowY(1));
	tvshopScene.draw(makeCtx(), app, 1);
	tvshopScene.pointer(app, 'up', rowX(), rowY(1));
	eq(tvshopScene.selected, 1, 'selected is row 1');
});

test('BUY on an affordable sale listing buys the car', () => {
	const app = makeCtxApp();
	const listings = app.state.shop.listings;
	const idx = findMode(listings, 'sale');
	ok(idx !== -1, 'there is a sale listing');
	const listingId = listings[idx].listingId;
	tap(app, rowX(), rowY(idx));
	eq(tvshopScene.selected, idx, 'row selected');
	tap(app, BUY[0], BUY[1]);
	eq(app.state.cars.length, 1, 'one car in the garage');
	eq(app.state.day, 2, 'the day moved on');
	let removed = true;
	for (let i = 0; i < listings.length; i++) {
		if (listings[i].listingId === listingId) removed = false;
	}
	ok(removed, 'the listing is gone');
});

test('BUY with no cash changes nothing and toasts', () => {
	const app = makeCtxApp();
	const listings = app.state.shop.listings;
	const idx = findMode(listings, 'sale');
	tap(app, rowX(), rowY(idx));
	app.state.cash = 0;
	const before = JSON.stringify(app.state);
	tap(app, BUY[0], BUY[1]);
	eq(JSON.stringify(app.state), before, 'state unchanged');
	eq(app.state.day, 1, 'the day did not move');
	ok(app.toasts.indexOf('Not enough money') !== -1, 'toast says Not enough money');
});

test('BUY with a full garage toasts No free garage slot', () => {
	const app = makeCtxApp();
	const listings = app.state.shop.listings;
	const idx = findMode(listings, 'sale');
	tap(app, rowX(), rowY(idx));
	app.state.cars = [{ id: 'c1' }, { id: 'c2' }, { id: 'c3' }];
	eq(app.state.cars.length, app.state.garageSlots, 'garage is full');
	const before = JSON.stringify(app.state);
	tap(app, BUY[0], BUY[1]);
	eq(JSON.stringify(app.state), before, 'state unchanged');
	ok(app.toasts.indexOf('No free garage slot') !== -1, 'toast says No free garage slot');
});

test('BUY while a rent listing is selected toasts it is not for sale', () => {
	const app = makeCtxApp();
	const idx = findMode(app.state.shop.listings, 'rent');
	ok(idx !== -1, 'there is a rent listing');
	tap(app, rowX(), rowY(idx));
	tap(app, BUY[0], BUY[1]);
	ok(app.toasts.indexOf('That one is not for sale') !== -1, 'toast says not for sale');
	eq(app.state.cars.length, 0, 'no car bought');
});

test('RENT while a sale listing is selected toasts it is not for rent', () => {
	const app = makeCtxApp();
	const idx = findMode(app.state.shop.listings, 'sale');
	ok(idx !== -1, 'there is a sale listing');
	tap(app, rowX(), rowY(idx));
	tap(app, RENT[0], RENT[1]);
	ok(app.toasts.indexOf('That one is not for rent') !== -1, 'toast says not for rent');
	eq(app.state.cars.length, 0, 'no car rented');
});

test('RENT on a rent listing adds an unowned car', () => {
	const app = makeCtxApp();
	const listings = app.state.shop.listings;
	const idx = findMode(listings, 'rent');
	ok(idx !== -1, 'there is a rent listing');
	tap(app, rowX(), rowY(idx));
	tap(app, RENT[0], RENT[1]);
	eq(app.state.cars.length, 1, 'one car in the garage');
	eq(app.state.cars[0].owned, false, 'the car is a rental');
	ok(app.state.cars[0].rentMonthly > 0, 'a monthly rent is set');
});

test('BACK pops the scene', () => {
	const app = makeCtxApp();
	tap(app, BACK[0], BACK[1]);
	eq(app.calls, [['pop']], 'pop recorded');
});

test('mismatched down and up does nothing', () => {
	const app = makeCtxApp();
	const listings = app.state.shop.listings;
	const idx = findMode(listings, 'sale');
	tap(app, rowX(), rowY(idx));
	const before = JSON.stringify(app.state);
	tvshopScene.pointer(app, 'down', BUY[0], BUY[1]);
	tvshopScene.draw(makeCtx(), app, 1);
	tvshopScene.pointer(app, 'up', BACK[0], BACK[1]);
	eq(JSON.stringify(app.state), before, 'state unchanged');
	eq(app.calls, [], 'no navigation');
	eq(app.toasts, [], 'no toast');
});

test('an orphan up does nothing', () => {
	const app = makeCtxApp();
	const before = JSON.stringify(app.state);
	tvshopScene.pointer(app, 'up', BUY[0], BUY[1]);
	tvshopScene.pointer(app, 'up', rowX(), rowY(1));
	eq(JSON.stringify(app.state), before, 'state unchanged');
	eq(app.calls, [], 'no navigation');
	eq(app.toasts, [], 'no toast');
});

test('a drag inside the list scrolls it and does not select a row', () => {
	const app = makeCtxApp();
	// The opening board of eight exactly fills the view: add four more so
	// there is something to scroll to.
	const state = app.state;
	for (let i = 0; i < 4; i++) {
		state.shop.listings.push(makeListing(state, { excludeModelIds: state.shop.listings.map(function (l) { return l.modelId; }) }));
	}
	tvshopScene.enter(app);
	eq(tvshopScene.scroll.max() > 0, true, 'the list can scroll');
	tvshopScene.pointer(app, 'down', rowX(), LAYOUT.list.y + 440);
	tvshopScene.draw(makeCtx(), app, 1);
	tvshopScene.pointer(app, 'move', rowX(), LAYOUT.list.y + 380);
	tvshopScene.pointer(app, 'up', rowX(), LAYOUT.list.y + 380);
	ok(tvshopScene.scroll.offset > 0, 'the list scrolled');
	eq(tvshopScene.selected, 0, 'no row got selected by the drag');
});

test('ArrowDown and ArrowUp move the selection and clamp at the ends', () => {
	const app = makeCtxApp();
	tvshopScene.key(app, 'ArrowUp');
	eq(tvshopScene.selected, 0, 'ArrowUp clamps at the top');
	for (let i = 0; i < 20; i++) {
		tvshopScene.key(app, 'ArrowDown');
	}
	eq(tvshopScene.selected, app.state.shop.listings.length - 1, 'ArrowDown clamps at the bottom');
	tvshopScene.key(app, 'ArrowUp');
	eq(tvshopScene.selected, app.state.shop.listings.length - 2, 'ArrowUp steps back one');
});

test('arrow keys keep the selected row inside the view', () => {
	const app = makeCtxApp();
	for (let i = 0; i < 4; i++) {
		state_add(app, makeListing(app.state, {}));
	}
	tvshopScene.enter(app);
	for (let i = 0; i < 11; i++) {
		tvshopScene.key(app, 'ArrowDown');
	}
	eq(tvshopScene.selected, 11, 'selection at the last row');
	ok(tvshopScene.scroll.offset > 0, 'the list scrolled to follow');
	const top = tvshopScene.selected * LAYOUT.rowH;
	ok(top >= tvshopScene.scroll.offset, 'selected row top is in view');
	ok(top + LAYOUT.rowH <= tvshopScene.scroll.offset + LAYOUT.list.h, 'selected row bottom is in view');
});

function state_add(app, listing) {
	app.state.shop.listings.push(listing);
}

test('Enter buys the selected sale listing', () => {
	const app = makeCtxApp();
	const idx = findMode(app.state.shop.listings, 'sale');
	ok(idx !== -1, 'there is a sale listing');
	for (let i = 0; i < idx; i++) {
		tvshopScene.key(app, 'ArrowDown');
	}
	tvshopScene.key(app, 'Enter');
	eq(app.state.cars.length, 1, 'the car was bought');
	eq(app.state.day, 2, 'the day moved on');
});

test('Enter rents the selected rent listing', () => {
	const app = makeCtxApp();
	const idx = findMode(app.state.shop.listings, 'rent');
	ok(idx !== -1, 'there is a rent listing');
	for (let i = 0; i < idx; i++) {
		tvshopScene.key(app, 'ArrowDown');
	}
	tvshopScene.key(app, 'Enter');
	eq(app.state.cars.length, 1, 'the car was rented');
	eq(app.state.cars[0].owned, false, 'the car is unowned');
});

test('Escape pops the scene', () => {
	const app = makeCtxApp();
	tvshopScene.key(app, 'Escape');
	eq(app.calls, [['pop']], 'pop recorded');
});

test('buying the last listing leaves an empty telly, without crashing', () => {
	const app = makeCtxApp();
	const idx = findMode(app.state.shop.listings, 'sale');
	ok(idx !== -1, 'there is a sale listing');
	// Keep just that one listing so buying it empties the board.
	app.state.shop.listings = [app.state.shop.listings[idx]];
	tvshopScene.enter(app);
	tap(app, rowX(), rowY(0));
	tap(app, BUY[0], BUY[1]);
	eq(app.state.shop.listings.length, 0, 'the board is empty');
	eq(tvshopScene.selected, 0, 'selection stayed in range');
	const got = texts(tvshopScene.draw(makeCtx(), app, 1));
	ok(got.indexOf('Nothing on the telly. Try again next week.') !== -1, 'empty-shop message drawn');
});

done();
