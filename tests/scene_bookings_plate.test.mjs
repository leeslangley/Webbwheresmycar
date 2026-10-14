// Tests for the bookings scene desk plate and lamp glow (card GE20). A fake
// app.rooms records the plate draw; the fake ctx records the additive glow.
// Run under macOS `jsc -m` with tests/fakectx.js and tests/fakeapp.js.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, count, anySet } from './fakectx.js';
import { makeApp } from './fakeapp.js';
import { startGame } from '../src/sim/newgame.js';
import { bookingsScene, LAYOUT } from '../src/ui/scenes/bookings.js';

// Tap point: the centre of the BACK button.
const BACK = { x: LAYOUT.back.x + LAYOUT.back.w / 2, y: LAYOUT.back.y + LAYOUT.back.h / 2 };

// A rooms stand-in: has('bookings') is true when plate is set; draw records
// every call and reports the plate as drawn.
function fakeRooms(plate) {
	const rooms = {
		calls: [],
		has: function (id) {
			return plate && id === 'bookings';
		},
		draw: function (ctx, id, opts) {
			rooms.calls.push(['draw', id, opts]);
			return true;
		},
	};
	return rooms;
}

// A fresh app on the opening state. rooms may be undefined (no plate system).
function freshApp(rooms) {
	const state = startGame(6);
	const app = makeApp(state);
	if (rooms !== undefined) {
		app.rooms = rooms;
	}
	bookingsScene.enter(app);
	return app;
}

// Tap the centre of a rect: down then up on the same spot.
function tap(app, p) {
	bookingsScene.pointer(app, 'down', p.x, p.y);
	bookingsScene.pointer(app, 'up', p.x, p.y);
}

test('plate mode: one draw calls app.rooms.draw once with bookings', () => {
	const rooms = fakeRooms(true);
	const app = freshApp(rooms);
	const ctx = makeCtx();
	bookingsScene.draw(ctx, app, 0);
	eq(rooms.calls.length, 1, 'rooms.draw called exactly once');
	eq(rooms.calls[0][0], 'draw', 'call is draw');
	eq(rooms.calls[0][1], 'bookings', 'plate id is bookings');
	eq(rooms.calls[0][2], { look: { x: 0, y: 0 } }, 'look defaults to the centre');
});

test('plate mode: the lamp glow is additive (lighter) at least once', () => {
	const app = freshApp(fakeRooms(true));
	const ctx = makeCtx();
	bookingsScene.draw(ctx, app, 0);
	ok(anySet(ctx, 'globalCompositeOperation', 'lighter'), 'lighter composite set during plate draw');
});

test('plate mode adds the glow and vignette gradients on top of the plain draw', () => {
	const plainCtx = makeCtx();
	bookingsScene.draw(plainCtx, freshApp(undefined), 0);
	const plateCtx = makeCtx();
	bookingsScene.draw(plateCtx, freshApp(fakeRooms(true)), 0);
	const extra = count(plateCtx, 'createRadialGradient') - count(plainCtx, 'createRadialGradient');
	ok(extra >= 2, 'lamp glow and vignette each add a radial gradient, extra: ' + extra);
});

test('without app.rooms the draw still works and draws no plate', () => {
	const app = freshApp(undefined);
	const ctx = makeCtx();
	let threw = false;
	try {
		bookingsScene.draw(ctx, app, 0);
	} catch (e) {
		threw = true;
	}
	ok(!threw, 'draw works with no rooms system');
	ok(!anySet(ctx, 'globalCompositeOperation', 'lighter'), 'no lamp glow without a plate');
});

test('rooms present but no bookings plate: nothing is drawn from it', () => {
	const rooms = fakeRooms(false);
	const app = freshApp(rooms);
	const ctx = makeCtx();
	let threw = false;
	try {
		bookingsScene.draw(ctx, app, 0);
	} catch (e) {
		threw = true;
	}
	ok(!threw, 'draw works when the plate did not load');
	eq(rooms.calls.length, 0, 'rooms.draw not called');
});

test('BACK still pops after a down, redraw at another t, and up', () => {
	const app = freshApp(fakeRooms(true));
	const ctx = makeCtx();
	bookingsScene.draw(ctx, app, 0);
	bookingsScene.pointer(app, 'down', BACK.x, BACK.y);
	bookingsScene.draw(ctx, app, 5);
	bookingsScene.pointer(app, 'up', BACK.x, BACK.y);
	eq(app.calls, [['pop']], 'BACK pops exactly once');
});

test('BACK still pops without a plate', () => {
	const app = freshApp(undefined);
	const ctx = makeCtx();
	bookingsScene.draw(ctx, app, 0);
	tap(app, BACK);
	eq(app.calls, [['pop']], 'BACK pops exactly once');
});

done();
