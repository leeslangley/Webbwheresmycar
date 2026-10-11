// Tests for the ledger and workshop scene (card W64), run under `jsc -m`.
//
// startGame(1) gives cash 20000, reputation 40, buzz 0, garageSlots 3, day 1
// and no cars, so the ledger reads Cash £20,000 and Net worth £20,000, the
// stable value is £0 and the expected bills are the £400 garage lease alone.
// One owned t2_serious (basePrice 22000, maintenance 4) at condition 10 is
// worth £22,000 and costs round(4 * (60 + 22000 * 0.0025) * 1) = £460 a
// month, so the bills become £860.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, texts } from './fakectx.js';
import { makeApp } from './fakeapp.js';
import { ledgerScene, LAYOUT } from '../src/ui/scenes/ledger.js';
import { startGame } from '../src/sim/newgame.js';

// Centre of a layout rect: where a tap lands.
function centre(r) {
	return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

// Simulate a tap: pointer down then up at the same point.
function tap(app, x, y) {
	ledgerScene.pointer(app, 'down', x, y);
	ledgerScene.pointer(app, 'up', x, y);
}

// A drawn scene with a fresh game and recording context. params chooses the
// tab, exactly as office's workshop hotspot does.
function drawn(seed, params) {
	const state = startGame(seed);
	const app = makeApp(state);
	const ctx = makeCtx();
	ledgerScene.enter(app, params || {});
	ledgerScene.draw(ctx, app, 0);
	return { state: state, app: app, ctx: ctx };
}

// Redraw an existing state on a clean context, so a later assertion sees only
// this frame's text.
function show(state, params) {
	const app = makeApp(state);
	const ctx = makeCtx();
	ledgerScene.enter(app, params || {});
	ledgerScene.draw(ctx, app, 0);
	return { app: app, ctx: ctx };
}

// Does any drawn text start with this prefix? Label rows carry their value in
// one string ('Cash £20,000'), so prefixes are how rows are found.
function has(got, text) {
	for (let i = 0; i < got.length; i++) {
		if (got[i] === text) {
			return true;
		}
	}
	return false;
}

// A stable car as the garage would hold it.
function addOwnedCar(state, modelId, condition) {
	const car = {
		id: 'c' + state.nextId++, modelId: modelId, owned: true, owner: null,
		rentMonthly: 0, paid: 0, condition: condition, fault: null,
		lastServiceDay: 0, jobsDone: 0, boughtDay: state.day, impoundedUntil: 0,
		rentedAtCondition: 0,
	};
	state.cars.push(car);
	return car;
}

test('ledger: cash, net worth, reputation, plates and stable progress', () => {
	const { ctx } = drawn(1);
	const got = texts(ctx);
	ok(has(got, 'Cash £20,000'), 'Cash £20,000 shown');
	ok(has(got, 'Net worth £20,000'), 'Net worth £20,000 shown');
	ok(has(got, 'Stable value £0'), 'Stable value £0 shown');
	ok(has(got, 'Expected next bills £400'), 'bills are the £400 lease alone');
	ok(has(got, 'Reputation 40/100'), 'Reputation 40/100 shown');
	ok(has(got, 'Buzz 0'), 'Buzz 0 shown');
	ok(has(got, 'Jobs done 0'), 'Jobs done shown');
	ok(has(got, 'Jobs failed 0'), 'Jobs failed shown');
	ok(has(got, 'Adverts run 0'), 'Adverts run shown');
	ok(has(got, 'Cars bought 0'), 'Cars bought shown');
	ok(has(got, 'Cars sold 0'), 'Cars sold shown');
	ok(has(got, 'Best auction sale £0'), 'Best auction sale shown');
	ok(has(got, 'Faults so far 0'), 'Faults so far shown');
	ok(has(got, 'GOLD NUMBER PLATES'), 'plates heading shown');
	ok(has(got, 'Fat Cat'), 'Fat Cat plate shown');
	ok(has(got, '0/6 cars'), 'Stable Boy progress 0/6 cars');
	ok(has(got, '£20,000/£100,000'), 'Fat Cat progress shown');
	ok(has(got, '40/85'), 'Household Name progress shown');
	ok(has(got, 'best £0/£100,000'), 'Hammer Time progress shown');
});

test('ledger: an owned t2_serious at condition 10 makes £22,000 and £860 bills', () => {
	const { state } = drawn(1);
	addOwnedCar(state, 't2_serious', 10);
	const { ctx } = show(state);
	const got = texts(ctx);
	ok(has(got, 'Stable value £22,000'), 'stable value £22,000');
	ok(has(got, 'Expected next bills £860'), 'running 460 + lease 400 = £860');
	ok(has(got, 'Net worth £42,000'), 'net worth cash plus the car');
	ok(has(got, '£42,000/£100,000'), 'Fat Cat progress follows net worth');
});

test('ledger: a rented car adds its rent to the expected bills', () => {
	const { state } = drawn(1);
	const car = addOwnedCar(state, 't2_serious', 10);
	car.owned = false;
	car.rentMonthly = 950;
	const { ctx } = show(state);
	const got = texts(ctx);
	ok(has(got, 'Expected next bills £1,350'), 'rent 950 + lease 400 = £1,350');
	ok(has(got, 'Stable value £0'), 'rented cars are not stable value');
});

test('ledger: a won plate reads WON', () => {
	const { state } = drawn(1);
	state.plates.stable = true;
	const { ctx } = show(state);
	const got = texts(ctx);
	ok(has(got, 'WON'), 'a won plate reads WON');
	ok(!has(got, '0/6 cars'), 'and drops the progress text');
});

test('workshop tab: bays, slots line and BUY EXTRA SLOT', () => {
	const { ctx } = drawn(1, { tab: 'workshop' });
	const got = texts(ctx);
	ok(has(got, 'WORKSHOP BOARD'), 'board heading shown');
	ok(has(got, 'Garage slots 3/8'), 'Garage slots 3/8 shown');
	ok(has(got, 'BUY EXTRA SLOT £3,000'), 'buy button label shown');
	ok(!has(got, 'GOLD NUMBER PLATES'), 'the ledger book is not drawn on this tab');
});

test('BUY EXTRA SLOT: slots 4, cash 17000, day 2', () => {
	const { state, app } = drawn(1, { tab: 'workshop' });
	const c = centre(LAYOUT.buySlot);
	tap(app, c.x, c.y);
	eq(state.garageSlots, 4, 'slots up to 4');
	eq(state.cash, 17000, 'cash down by £3,000');
	eq(state.day, 2, 'a day passes');
});

test('BUY EXTRA SLOT with cash 100 toasts Not enough money', () => {
	const { state, app } = drawn(1, { tab: 'workshop' });
	state.cash = 100;
	ledgerScene.draw(makeCtx(), app, 0);
	const c = centre(LAYOUT.buySlot);
	tap(app, c.x, c.y);
	eq(app.toasts, ['Not enough money'], 'toast explains the refusal');
	eq(state.day, 1, 'a refused buy costs no day');
});

test('BUY EXTRA SLOT at 8 slots toasts Garage is full-size already', () => {
	const { state, app } = drawn(1, { tab: 'workshop' });
	state.garageSlots = 8;
	ledgerScene.draw(makeCtx(), app, 0);
	const c = centre(LAYOUT.buySlot);
	tap(app, c.x, c.y);
	eq(app.toasts, ['Garage is full-size already'], 'toast says the garage is full');
	eq(state.cash, 20000, 'cash untouched');
	eq(state.day, 1, 'no day passes');
});

test('tab buttons switch tabs, without any sim action', () => {
	const { app } = drawn(1);
	eq(ledgerScene.tab, 'ledger', 'starts on the ledger');
	const w = centre(LAYOUT.tabWorkshop);
	tap(app, w.x, w.y);
	eq(ledgerScene.tab, 'workshop', 'WORKSHOP tab selected');
	const l = centre(LAYOUT.tabLedger);
	tap(app, l.x, l.y);
	eq(ledgerScene.tab, 'ledger', 'LEDGER tab selected back');
	eq(app.calls.length, 0, 'switching tabs calls no sim action');
});

test('enter picks the workshop tab from params', () => {
	const state = startGame(1);
	const app = makeApp(state);
	ledgerScene.enter(app, { tab: 'workshop' });
	eq(ledgerScene.tab, 'workshop', 'workshop from params');
	ledgerScene.enter(app, {});
	eq(ledgerScene.tab, 'ledger', 'ledger by default');
	ledgerScene.enter(app, null);
	eq(ledgerScene.tab, 'ledger', 'ledger with no params at all');
	ledgerScene.enter(app, { tab: 'nonsense' });
	eq(ledgerScene.tab, 'ledger', 'an unknown tab falls back to the ledger');
});

test('tap rule: down, redraw, then up fires the action exactly once', () => {
	const { state, app } = drawn(1, { tab: 'workshop' });
	const c = centre(LAYOUT.buySlot);
	const mine = makeCtx();
	ledgerScene.pointer(app, 'down', c.x, c.y);
	// The screen is redrawn between finger-down and finger-up: the hit list is
	// rebuilt, and the pressed state must survive it.
	ledgerScene.draw(mine, app, 0.5);
	ledgerScene.draw(mine, app, 1.5);
	ledgerScene.pointer(app, 'up', c.x, c.y);
	eq(state.garageSlots, 4, 'the tap fired once');
	eq(state.cash, 17000, 'paid once, not twice');
	eq(state.day, 2, 'the day advanced once');
	eq(ledgerScene.pressed, null, 'the pressed state is cleared on up');
});

test('tap rule: a down on one hit then an up on another fires nothing', () => {
	const { state, app } = drawn(1, { tab: 'workshop' });
	const b = centre(LAYOUT.buySlot);
	const back = centre(LAYOUT.back);
	ledgerScene.pointer(app, 'down', b.x, b.y);
	ledgerScene.draw(makeCtx(), app, 0.5);
	ledgerScene.pointer(app, 'up', back.x, back.y);
	eq(state.garageSlots, 3, 'nothing bought');
	eq(state.day, 1, 'no day passed');
	eq(app.calls.length, 0, 'no pop either');
});

test('tap rule: a down on empty space then an up does nothing', () => {
	const { state, app } = drawn(1);
	ledgerScene.pointer(app, 'down', 1200, 20);
	ledgerScene.draw(makeCtx(), app, 0.5);
	ledgerScene.pointer(app, 'up', 1200, 20);
	eq(state.day, 1, 'no day passed');
	eq(app.calls.length, 0, 'no navigation');
	eq(ledgerScene.pressed, null, 'pressed cleared on up');
});

test('BACK pops to the office', () => {
	const { app } = drawn(1);
	const b = centre(LAYOUT.back);
	tap(app, b.x, b.y);
	eq(app.calls, [['pop']], 'back records a pop');
});

test('Escape pops', () => {
	const { app } = drawn(1);
	ledgerScene.key(app, 'Escape');
	eq(app.calls, [['pop']], 'Escape records a pop');
});

test('an unknown model id in the garage does not throw', () => {
	const { state, ctx } = drawn(1);
	addOwnedCar(state, 't2_serious', 10);
	state.cars.push({
		id: 'c99', modelId: 'not_a_model', owned: true, owner: null,
		rentMonthly: 0, paid: 0, condition: 5, fault: null,
		lastServiceDay: 0, jobsDone: 0, boughtDay: 1, impoundedUntil: 0,
		rentedAtCondition: 0,
	});
	ledgerScene.draw(ctx, makeApp(state), 0);
	const got = texts(ctx);
	ok(has(got, 'Stable value £22,000'), 'the good car still counts');
	ok(has(got, 'Expected next bills £860'), 'the bad car adds nothing');
});

test('BUY EXTRA SLOT: exactly £3,000 cash is enough', () => {
	const { state, app } = drawn(1, { tab: 'workshop' });
	state.cash = 3000;
	ledgerScene.draw(makeCtx(), app, 0);
	const c = centre(LAYOUT.buySlot);
	tap(app, c.x, c.y);
	eq(state.garageSlots, 4, 'the boundary case buys');
	eq(state.cash, 0, 'cash drops to zero');
	eq(app.toasts, [], 'no toast at the boundary');
});

test('BUY EXTRA SLOT: a penny short refuses at £2,999', () => {
	const { state, app } = drawn(1, { tab: 'workshop' });
	state.cash = 2999;
	ledgerScene.draw(makeCtx(), app, 0);
	const c = centre(LAYOUT.buySlot);
	tap(app, c.x, c.y);
	eq(state.garageSlots, 3, 'nothing bought');
	eq(app.toasts, ['Not enough money'], 'toast explains the refusal');
});

test('the buy-slot hot spot is dead on the ledger tab', () => {
	const { state, app } = drawn(1);
	const c = centre(LAYOUT.buySlot);
	tap(app, c.x, c.y);
	eq(state.garageSlots, 3, 'no slot bought from the ledger tab');
	eq(state.day, 1, 'no day passed');
});

test('a pointer event before the first draw is harmless', () => {
	const state = startGame(1);
	const app = makeApp(state);
	ledgerScene.enter(app, {});
	ledgerScene.pointer(app, 'down', 640, 360);
	ledgerScene.pointer(app, 'up', 640, 360);
	eq(state.day, 1, 'nothing happened');
	eq(app.calls.length, 0, 'no navigation');
	eq(ledgerScene.pressed, null, 'pressed stays clear');
});

test('a garage with no cars draws bays and £400 bills', () => {
	const { state } = drawn(1, { tab: 'workshop' });
	const { ctx } = show(state, { tab: 'ledger' });
	ok(has(texts(ctx), 'Expected next bills £400'), 'the empty garage still owes the lease');
});

test('LAYOUT rects sit inside the 1280x720 screen', () => {
	const rects = [LAYOUT.tabLedger, LAYOUT.tabWorkshop, LAYOUT.buySlot, LAYOUT.back];
	for (let i = 0; i < rects.length; i++) {
		const r = rects[i];
		ok(r.x >= 0 && r.x + r.w <= 1280, 'rect ' + i + ' x range');
		ok(r.y >= 0 && r.y + r.h <= 720, 'rect ' + i + ' y range');
	}
});

done();
