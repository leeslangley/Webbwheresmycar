// Draw tests for the ledger tab of the ledger scene (card W64a), run under
// macOS `jsc -m`. These only exercise drawing: startGame(1) puts Mark at cash
// 20000, reputation 40, buzz 0, day 1 and an empty garage, so the books read
// Cash £20,000 and the £400 garage lease is the only bill. One owned
// t2_serious (basePrice 22000, maintenance 4) at condition 10 is worth
// £22,000 and runs at round(4 * (60 + 22000 * 0.0025) * 1) = £460 a month,
// so the expected bills become £860.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, texts } from './fakectx.js';
import { makeApp } from './fakeapp.js';
import { ledgerScene, LAYOUT } from '../src/ui/scenes/ledger.js';
import { money } from '../src/core/format.js';
import { startGame } from '../src/sim/newgame.js';

// Draw the ledger tab once on a fresh recording context and return the ctx.
function drawn(state, params) {
	const app = makeApp(state);
	const ctx = makeCtx();
	ledgerScene.enter(app, params || {});
	ledgerScene.draw(ctx, app, 0);
	return ctx;
}

// Is this exact string among the drawn texts?
function has(got, text) {
	for (let i = 0; i < got.length; i++) {
		if (got[i] === text) {
			return true;
		}
	}
	return false;
}

// How many drawn texts contain this string (rows carry a label and a value in
// one string, so the money text of the starting cash appears more than once).
function countContains(got, text) {
	let n = 0;
	for (let i = 0; i < got.length; i++) {
		if (got[i].indexOf(text) !== -1) {
			n += 1;
		}
	}
	return n;
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

test('ledger tab draws the key rows and the plates column', () => {
	const got = texts(drawn(startGame(1)));
	ok(has(got, 'Reputation 40/100'), 'Reputation 40/100 is drawn');
	ok(has(got, 'GOLD NUMBER PLATES'), 'GOLD NUMBER PLATES heading is drawn');
	ok(has(got, 'Fat Cat'), 'the Fat Cat plate is drawn');
	ok(has(got, '0/6 cars'), 'the Stable Boy progress is 0/6 cars');
	ok(countContains(got, money(20000)) >= 2, 'the starting cash text appears twice or more');
});

test('an owned t2_serious at condition 10 is worth £22,000 and bills £860', () => {
	const state = startGame(1);
	addOwnedCar(state, 't2_serious', 10);
	const got = texts(drawn(state));
	ok(has(got, 'Stable value ' + money(22000)), 'Stable value is money(22000)');
	ok(has(got, 'Expected next bills ' + money(460 + 400)), 'bills are running 460 + lease 400');
});

test('ledgerScene is the ledger scene and defaults to the ledger tab', () => {
	eq(ledgerScene.id, 'ledger', 'id is ledger');
	eq(typeof ledgerScene.draw, 'function', 'draw exists');
	const state = startGame(1);
	const app = makeApp(state);
	ledgerScene.enter(app, {});
	eq(ledgerScene.tab, 'ledger', 'ledger tab by default');
	ledgerScene.enter(app, { tab: 'workshop' });
	eq(ledgerScene.tab, 'workshop', 'workshop tab from params');
	ledgerScene.enter(app, { tab: 'nonsense' });
	eq(ledgerScene.tab, 'ledger', 'an unknown tab falls back to the ledger');
});

test('the named LAYOUT rects sit inside the 1280x720 screen', () => {
	const rects = [LAYOUT.tabLedger, LAYOUT.tabWorkshop, LAYOUT.buySlot, LAYOUT.back];
	for (let i = 0; i < rects.length; i++) {
		const r = rects[i];
		ok(r.x >= 0 && r.x + r.w <= 1280, 'rect ' + i + ' x range');
		ok(r.y >= 0 && r.y + r.h <= 720, 'rect ' + i + ' y range');
	}
});

test('an empty garage draws the £400 lease and £0 stable value', () => {
	const got = texts(drawn(startGame(1)));
	ok(has(got, 'Stable value ' + money(0)), 'an empty garage is worth nothing');
	ok(has(got, 'Expected next bills ' + money(400)), 'the lease alone is owed');
});

test('drawing twice in a row shows the same books', () => {
	const state = startGame(1);
	const app = makeApp(state);
	ledgerScene.enter(app, {});
	const first = makeCtx();
	ledgerScene.draw(first, app, 0);
	const second = makeCtx();
	ledgerScene.draw(second, app, 1.5);
	eq(texts(first), texts(second), 'a redraw changes nothing');
});

done();
