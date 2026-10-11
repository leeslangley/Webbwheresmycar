// Tests for the Garage scene (card W60), run under `jsc -m`.
// Every interaction follows the real sequence: draw, pointer down, a redraw
// with a different t, pointer up. The tap rule (remember the pressed id,
// never reset it inside draw) is exercised directly.

import { test, eq, ok, near, done } from './harness.js';
import { makeCtx, texts } from './fakectx.js';
import { makeApp } from './fakeapp.js';
import { garageScene, LAYOUT } from '../src/ui/scenes/garage.js';
import { startGame } from '../src/sim/newgame.js';
import { marketValue, runningCost } from '../src/sim/carstats.js';
import { consignCar } from '../src/sim/auction.js';
import { modelOf } from '../src/data/cars.js';
import { money, oneDp } from '../src/core/format.js';
import { roundTo } from '../src/core/rng.js';

// The catalogue entry for a car.
function carModel(car) {
	return modelOf(car.modelId);
}

// A stable car instance with every field DESIGN.md 4.3 requires.
function makeCar(id, modelId, opts) {
	const o = opts || {};
	return {
		id: id,
		modelId: modelId,
		owned: o.owned !== false,
		owner: o.owner !== undefined ? o.owner : 'you',
		rentMonthly: o.rentMonthly !== undefined ? o.rentMonthly : 0,
		paid: o.paid !== undefined ? o.paid : 6500,
		condition: o.condition !== undefined ? o.condition : 5,
		fault: o.fault !== undefined ? o.fault : null,
		lastServiceDay: 0,
		jobsDone: 0,
		boughtDay: 1,
		impoundedUntil: o.impoundedUntil !== undefined ? o.impoundedUntil : 0,
		rentedAtCondition: o.rentedAtCondition !== undefined ? o.rentedAtCondition : null,
	};
}

// Set up the scene over a fresh game with the given cars.
function setup(cars, day) {
	const state = startGame(2);
	state.cars = cars || [];
	if (day !== undefined) {
		state.day = day;
	}
	const app = makeApp(state);
	garageScene.enter(app, null);
	return app;
}

// One initial draw to build the hit list.
function drawOnce(app) {
	garageScene.draw(makeCtx(), app, 0);
}

// The real interaction sequence: down, redraw with a different t, up.
function tap(app, x, y) {
	garageScene.pointer(app, 'down', x, y);
	garageScene.draw(makeCtx(), app, 0.5);
	garageScene.pointer(app, 'up', x, y);
}

// Button centres, from LAYOUT.
const TINKER = [LAYOUT.tinker.x + 120, LAYOUT.tinker.y + 28];
const SERVICE = [LAYOUT.service.x + 120, LAYOUT.service.y + 28];
const SELL = [LAYOUT.sell.x + 120, LAYOUT.sell.y + 28];
const CONSIGN = [LAYOUT.consign.x + 130, LAYOUT.consign.y + 28];
function rowY(i) {
	return LAYOUT.list.y + i * LAYOUT.rowH + 33;
}

const FAULTY = { faultId: 'puncture', label: 'Puncture', cost: 90 };

test('LAYOUT matches the card exactly', () => {
	eq(LAYOUT, {
		list: { x: 40, y: 100, w: 420, h: 520 },
		rowH: 70,
		detail: { x: 480, y: 100, w: 760, h: 520 },
		tinker: { x: 480, y: 560, w: 240, h: 56 },
		service: { x: 730, y: 560, w: 240, h: 56 },
		fix: { x: 980, y: 560, w: 260, h: 56 },
		restore: { x: 480, y: 626, w: 240, h: 56 },
		sell: { x: 730, y: 626, w: 240, h: 56 },
		consign: { x: 980, y: 626, w: 260, h: 56 },
		back: { x: 40, y: 640, w: 200, h: 56 },
	}, 'LAYOUT rects');
	eq(garageScene.id, 'garage', 'scene id');
});

test('rows show name, OWN/RENT, condition, FAULT and IMPOUNDED', () => {
	const app = setup([
		makeCar('c1', 't1_maurice'),
		makeCar('c2', 't1_fjord', { owned: false, owner: 'Mrs Batt', rentMonthly: 500, rentedAtCondition: 5 }),
		makeCar('c3', 't1_robbin', { fault: FAULTY, impoundedUntil: 5 }),
	]);
	drawOnce(app);
	const ctx = makeCtx();
	garageScene.draw(ctx, app, 0);
	const t2 = texts(ctx);
	ok(t2.indexOf('Maurice Minor') !== -1, 'owned car name drawn');
	ok(t2.indexOf('Fjord Escorte') !== -1, 'rented car name drawn');
	ok(t2.indexOf('OWN') !== -1, 'OWN tag drawn');
	ok(t2.indexOf('RENT') !== -1, 'RENT tag drawn');
	ok(t2.indexOf('COND 5.0') !== -1, 'condition shown to one decimal');
	ok(t2.indexOf('FAULT') !== -1, 'FAULT tag drawn');
	ok(t2.indexOf('IMPOUNDED') !== -1, 'IMPOUNDED tag drawn');
	ok(t2.indexOf('THE STABLE  3/3') !== -1, 'title shows count over slots');
});

test('detail panel shows name, quip, value and running cost for an owned car', () => {
	const car = makeCar('c1', 't1_maurice');
	const app = setup([car]);
	const ctx = makeCtx();
	garageScene.draw(ctx, app, 0);
	const ts = texts(ctx);
	ok(ts.indexOf('Maurice Minor') !== -1, 'model name drawn');
	ok(ts.indexOf('Humble, wobbly, secretly beloved.') !== -1, 'quip drawn');
	ok(ts.indexOf('Value ' + money(marketValue(app.state, carModel(car), car))) !== -1, 'value drawn');
	ok(ts.indexOf('Running cost/month ' + money(runningCost(carModel(car), car))) !== -1, 'running cost drawn');
});

test('detail panel shows rent for a rented car and the fault line', () => {
	const car = makeCar('c1', 't1_fjord', { owned: false, owner: 'Mrs Batt', rentMonthly: 500, rentedAtCondition: 5, fault: FAULTY });
	const app = setup([car]);
	const ctx = makeCtx();
	garageScene.draw(ctx, app, 0);
	const ts = texts(ctx);
	ok(ts.indexOf('Rent/month ' + money(500)) !== -1, 'rent drawn');
	ok(ts.indexOf('FAULT: Puncture (fix ' + money(90) + ')') !== -1, 'fault line with fix price drawn');
});

test('tap rule: down, redraw with a different t, up fires the action exactly once', () => {
	const car = makeCar('c1', 't1_maurice', { condition: 5 });
	const app = setup([car]);
	drawOnce(app);
	tap(app, TINKER[0], TINKER[1]);
	eq(app.state.day, 2, 'one day passed, so the action ran exactly once');
	near(app.state.cars[0].condition, 5.98, 0.03, 'condition up by about 1.0 (treatment, then overnight decay)');
	eq(oneDp(app.state.cars[0].condition), '6.0', 'displays as 6.0');
});

test('mismatched down/up does nothing', () => {
	const car = makeCar('c1', 't1_maurice', { condition: 5 });
	const app = setup([car]);
	drawOnce(app);
	// Down on TINKER, up on SERVICE: different ids, so no action.
	garageScene.pointer(app, 'down', TINKER[0], TINKER[1]);
	garageScene.draw(makeCtx(), app, 0.5);
	garageScene.pointer(app, 'up', SERVICE[0], SERVICE[1]);
	eq(app.state.day, 1, 'no day passed');
	eq(app.state.cars[0].condition, 5, 'condition untouched');
	// Down on TINKER, up in dead space: no hit there, so no action.
	garageScene.pointer(app, 'down', TINKER[0], TINKER[1]);
	garageScene.draw(makeCtx(), app, 0.75);
	garageScene.pointer(app, 'up', 10, 10);
	eq(app.state.day, 1, 'still no day passed');
	eq(app.state.cars[0].condition, 5, 'condition still untouched');
});

test('orphan up (no down first) does nothing', () => {
	const car = makeCar('c1', 't1_maurice', { condition: 5 });
	const app = setup([car]);
	drawOnce(app);
	garageScene.pointer(app, 'up', TINKER[0], TINKER[1]);
	eq(app.state.day, 1, 'no day passed');
	eq(app.state.cars[0].condition, 5, 'condition untouched');
	eq(app.state.cash, 20000, 'cash untouched');
});

test('FIX FAULT with no fault shows no price and toasts the refusal', () => {
	const app = setup([makeCar('c1', 't1_maurice')]);
	const ctx = makeCtx();
	garageScene.draw(ctx, app, 0);
	const ts = texts(ctx);
	ok(ts.indexOf('FIX FAULT') !== -1, 'bare FIX FAULT label drawn');
	ok(ts.indexOf('FIX FAULT ' + money(90)) === -1, 'no price on the label with no fault');
	tap(app, LAYOUT.fix.x + 130, LAYOUT.fix.y + 28);
	eq(app.toasts.indexOf('Nothing to fix') !== -1, true, 'refusal toasted');
	eq(app.state.day, 1, 'no day passed');
});

test('FIX FAULT with a fault and enough cash clears the fault', () => {
	const car = makeCar('c1', 't1_maurice', { fault: FAULTY });
	const app = setup([car]);
	drawOnce(app);
	tap(app, LAYOUT.fix.x + 130, LAYOUT.fix.y + 28);
	eq(app.state.cars[0].fault, null, 'fault cleared');
	eq(app.state.day, 2, 'a day passed');
	eq(app.state.cash, 20000 - 90, 'fix charged');
});

test('SELL removes an owned car and pays the dealer price', () => {
	const car = makeCar('c1', 't1_maurice', { condition: 5 });
	const app = setup([car]);
	drawOnce(app);
	const price = roundTo(marketValue(app.state, carModel(car), car) * 0.6, 10);
	tap(app, SELL[0], SELL[1]);
	eq(app.state.cars.length, 0, 'car gone');
	eq(app.state.cash, 20000 + price, 'dealer price paid');
	eq(app.state.day, 2, 'a day passed');
});

test('SELL is refused while the car is consigned', () => {
	const car = makeCar('c1', 't1_maurice', { condition: 5 });
	const app = setup([car]);
	eq(consignCar(app.state, 'c1', 3000).ok, true, 'consigned in the sim first');
	drawOnce(app);
	tap(app, SELL[0], SELL[1]);
	eq(app.state.cars.length, 1, 'car still there');
	eq(app.state.cash, 20000, 'no money moved');
	eq(app.toasts.indexOf('Withdraw it from the auction first') !== -1, true, 'refusal toasted');
});

test('RETURN removes a rented car, charging any damage fee', () => {
	// Returned in the same condition it went out: no fee.
	const clean = makeCar('c1', 't1_fjord', { owned: false, owner: 'Mrs Batt', rentMonthly: 500, rentedAtCondition: 5, condition: 5 });
	const app = setup([clean]);
	drawOnce(app);
	tap(app, SELL[0], SELL[1]);
	eq(app.state.cars.length, 0, 'rented car returned');
	eq(app.state.cash, 20000, 'no fee when condition is unchanged');
	eq(app.state.day, 2, 'a day passed');

	// Returned two points down: the damage fee comes off.
	const scruffy = makeCar('c1', 't1_fjord', { owned: false, owner: 'Mrs Batt', rentMonthly: 500, rentedAtCondition: 5, condition: 3 });
	const app2 = setup([scruffy]);
	const preCtx = makeCtx();
	garageScene.draw(preCtx, app2, 0);
	const fee = Math.round(2 * 0.02 * carModel(scruffy).basePrice);
	ok(texts(preCtx).indexOf('RETURN ' + money(fee)) !== -1, 'button shows the fee before the return');
	drawOnce(app2);
	tap(app2, SELL[0], SELL[1]);
	eq(app2.state.cars.length, 0, 'scruffy rental returned');
	eq(app2.state.cash, 20000 - fee, 'damage fee charged');
});

test('CONSIGN adds the lot with its reserve and the button becomes WITHDRAW', () => {
	const car = makeCar('c1', 't1_maurice', { condition: 5 });
	const app = setup([car]);
	drawOnce(app);
	const reserve = roundTo(marketValue(app.state, carModel(car), car) * 0.7, 10);
	tap(app, CONSIGN[0], CONSIGN[1]);
	eq(app.state.auction.consigned, [{ carId: 'c1', reserve: reserve }], 'consignment recorded with the reserve');
	eq(app.state.day, 1, 'consigning costs no day');
	eq(app.toasts.indexOf('Consigned. Reserve ' + money(reserve)) !== -1, true, 'reserve toasted');
	const ctx = makeCtx();
	garageScene.draw(ctx, app, 0);
	ok(texts(ctx).indexOf('WITHDRAW') !== -1, 'button now reads WITHDRAW');
	// Withdrawing takes the entry back off.
	tap(app, CONSIGN[0], CONSIGN[1]);
	eq(app.state.auction.consigned, [], 'withdrawal clears the list');
});

test('CONSIGN on auction day is refused with a toast', () => {
	const car = makeCar('c1', 't1_maurice', { condition: 5 });
	const app = setup([car], 24);
	drawOnce(app);
	tap(app, CONSIGN[0], CONSIGN[1]);
	eq(app.state.auction.consigned, [], 'nothing consigned');
	eq(app.state.day, 24, 'no day passed');
	eq(app.toasts.indexOf('Too late, the auction is today') !== -1, true, 'auction day toast');
});

test('empty stable message', () => {
	const app = setup([]);
	const ctx = makeCtx();
	garageScene.draw(ctx, app, 0);
	const ts = texts(ctx);
	ok(ts.indexOf('The garage is empty. Mark weeps quietly.') !== -1, 'empty message drawn');
	ok(ts.indexOf('THE STABLE  0/3') !== -1, 'title shows 0 of 3');
});

test('tapping a row selects that car and the detail follows', () => {
	const app = setup([
		makeCar('c1', 't1_maurice'),
		makeCar('c2', 't1_fjord'),
	]);
	drawOnce(app);
	tap(app, LAYOUT.list.x + 220, rowY(1));
	eq(garageScene.selId, 'c2', 'second row selected');
	const ctx = makeCtx();
	garageScene.draw(ctx, app, 0);
	ok(texts(ctx).indexOf('Fjord Escorte') !== -1, 'detail now shows the second car');
});

test('enter accepts params.carId and draw falls back when it is gone', () => {
	const app = setup([makeCar('c1', 't1_maurice'), makeCar('c2', 't1_fjord')]);
	garageScene.enter(app, { carId: 'c2' });
	eq(garageScene.selId, 'c2', 'params.carId honoured');
	// A stale id (car sold elsewhere) falls back to the first car.
	garageScene.enter(app, { carId: 'nope' });
	garageScene.draw(makeCtx(), app, 0);
	eq(garageScene.selId, 'c1', 'falls back to the first car');
});

test('keyboard: arrows select, t tinkers, f toasts, Escape pops', () => {
	const app = setup([makeCar('c1', 't1_maurice'), makeCar('c2', 't1_fjord')]);
	garageScene.key(app, 'Down');
	eq(garageScene.selId, 'c2', 'Down selects the next car');
	garageScene.key(app, 'Up');
	eq(garageScene.selId, 'c1', 'Up selects the previous car');
	garageScene.key(app, 't');
	eq(app.state.day, 2, 't tinkers (a day passed)');
	garageScene.key(app, 'f');
	eq(app.toasts.indexOf('Nothing to fix') !== -1, true, 'f with no fault toasts the refusal');
	garageScene.key(app, 'Escape');
	eq(app.calls[app.calls.length - 1], ['pop'], 'Escape pops the scene');
});

test('dragging scrolls the list without selecting a row', () => {
	const cars = [];
	for (let i = 0; i < 10; i++) {
		cars.push(makeCar('k' + i, 't1_maurice', { condition: 4 + (i % 3) }));
	}
	const app = setup(cars);
	drawOnce(app);
	// Drag well past the 8px threshold: down, move, up.
	garageScene.pointer(app, 'down', LAYOUT.list.x + 220, 500);
	garageScene.pointer(app, 'move', LAYOUT.list.x + 220, 400);
	garageScene.draw(makeCtx(), app, 0.5);
	garageScene.pointer(app, 'up', LAYOUT.list.x + 220, 400);
	ok(garageScene.scroll.offset > 0, 'the list scrolled');
	eq(garageScene.selId, 'k0', 'no row was selected by the drag');
});

test('a button the cash cannot afford still toasts the reason', () => {
	const car = makeCar('c1', 't1_maurice', { condition: 5 });
	const app = setup([car]);
	app.state.cash = 10;
	drawOnce(app);
	tap(app, TINKER[0], TINKER[1]);
	eq(app.toasts.indexOf('Not enough money') !== -1, true, 'refusal toasted');
	eq(app.state.day, 1, 'no day passed');
	eq(app.state.cars[0].condition, 5, 'condition untouched');
});

test('draw with no state does nothing and does not throw', () => {
	const app = makeApp(null);
	garageScene.enter(app, null);
	garageScene.draw(makeCtx(), app, 0);
	ok(true, 'no throw with a null state');
});

done();
