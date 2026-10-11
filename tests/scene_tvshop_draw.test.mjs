// Tests for the TV shop scene, drawing half (card W59), run under `jsc -m`.
// W59b owns tapping and keyboard behaviour; here we only prove the layout,
// the texts and the pure-drawing contract.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, texts, count, anySet } from './fakectx.js';
import { makeApp } from './fakeapp.js';
import { tvshopScene, LAYOUT } from '../src/ui/scenes/tvshop.js';
import { PALETTE } from '../src/ui/theme.js';
import { modelOf } from '../src/data/cars.js';
import { money } from '../src/core/format.js';
import { startGame } from '../src/sim/newgame.js';

// A fresh app with a real game state behind it.
function shopApp() {
	const app = makeApp(startGame(5));
	tvshopScene.enter(app);
	return app;
}

// Draw into a fresh fake context and return the text log.
function drawOnce(app, t) {
	const ctx = makeCtx();
	tvshopScene.draw(ctx, app, t === undefined ? 0 : t);
	return ctx;
}

test('enter then draw does not throw and shows the shop', () => {
	const app = shopApp();
	const got = texts(drawOnce(app, 0));
	ok(got.indexOf('WEBB TV SHOPPING') !== -1, 'draw includes the title');
	ok(got.indexOf(modelOf(app.state.shop.listings[0].modelId).name) !== -1, 'draw includes the first car name');
});

test('the price of a sale listing appears as money(price)', () => {
	const app = shopApp();
	const listings = app.state.shop.listings;
	let sale = null;
	for (let i = 0; i < listings.length; i++) {
		if (listings[i].mode === 'sale') {
			sale = listings[i];
			break;
		}
	}
	ok(sale !== null, 'there is a sale listing');
	const got = texts(drawOnce(app, 0));
	ok(got.indexOf(money(sale.price)) !== -1, 'draw includes money(price) of a sale listing');
});

test('the selected-row cursor blinks with t', () => {
	const app = shopApp();
	let cursors = 0;
	const on = texts(drawOnce(app, 0));
	for (let i = 0; i < on.length; i++) {
		if (on[i] === '>') cursors += 1;
	}
	eq(cursors, 1, 'the cursor shows exactly once at t=0');
	const off = texts(drawOnce(app, 0.5));
	cursors = 0;
	for (let i = 0; i < off.length; i++) {
		if (off[i] === '>') cursors += 1;
	}
	eq(cursors, 0, 'the cursor is hidden at t=0.5');
});

test('drawing at several t values never throws and never touches the state', () => {
	const app = shopApp();
	const before = JSON.stringify(app.state);
	for (const t of [0, 0.25, 0.5, 1, 7]) {
		drawOnce(app, t);
	}
	eq(JSON.stringify(app.state), before, 'app.state is unchanged by drawing');
});

test('selecting the second listing shows its car in the detail panel', () => {
	const app = shopApp();
	tvshopScene.selected = 1;
	const got = texts(drawOnce(app, 0));
	const want = modelOf(app.state.shop.listings[1].modelId).name;
	ok(got.indexOf(want) !== -1, 'detail panel shows the second car name');
});

test('the stat labels STYLE, UPKEEP, GRIT and CONDITION appear', () => {
	const app = shopApp();
	const got = texts(drawOnce(app, 0));
	ok(got.indexOf('STYLE') !== -1, 'STYLE label drawn');
	ok(got.indexOf('UPKEEP') !== -1, 'UPKEEP label drawn');
	ok(got.indexOf('GRIT') !== -1, 'GRIT label drawn');
	let condition = false;
	for (let i = 0; i < got.length; i++) {
		if (got[i].indexOf('CONDITION') !== -1) condition = true;
	}
	ok(condition, 'CONDITION text drawn');
});

test('a rent listing shows its owner', () => {
	const app = shopApp();
	const listings = app.state.shop.listings;
	let rentIndex = -1;
	for (let i = 0; i < listings.length; i++) {
		if (listings[i].mode === 'rent') {
			rentIndex = i;
			break;
		}
	}
	ok(rentIndex !== -1, 'there is a rent listing');
	tvshopScene.selected = rentIndex;
	const got = texts(drawOnce(app, 0));
	let owner = false;
	for (let i = 0; i < got.length; i++) {
		if (got[i].indexOf('Owner:') !== -1) owner = true;
	}
	ok(owner, 'Owner: drawn for a rent listing');
});

test('an empty shop says nothing is on the telly', () => {
	const app = shopApp();
	app.state.shop.listings = [];
	tvshopScene.enter(app);
	const got = texts(drawOnce(app, 0));
	ok(got.indexOf('Nothing on the telly. Try again next week.') !== -1, 'empty-shop message drawn');
});

test('BUY is drawn disabled when the cash is gone', () => {
	const app = shopApp();
	const listings = app.state.shop.listings;
	for (let i = 0; i < listings.length; i++) {
		if (listings[i].mode === 'sale') {
			tvshopScene.selected = i;
			break;
		}
	}
	app.state.cash = 0;
	const ctx = drawOnce(app, 0);
	ok(anySet(ctx, 'fillStyle', PALETTE.midgrey), 'disabled BUY is filled with midgrey');
});

test('LAYOUT.buy matches the card layout', () => {
	eq(LAYOUT.buy, { x: 640, y: 600, w: 290, h: 64 }, 'LAYOUT.buy rect');
});

test('save and restore calls are balanced', () => {
	const app = shopApp();
	const ctx = drawOnce(app, 0.5);
	eq(count(ctx, 'save'), count(ctx, 'restore'), 'save/restore balance');
});

done();
