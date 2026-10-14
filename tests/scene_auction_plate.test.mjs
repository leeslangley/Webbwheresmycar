// Tests for the Auction hall with the Blender plate (card GE21), run under
// `jsc -m`. When app.rooms has the 'auction' plate the hall draws that plate,
// the spotlight light, the code-drawn crowd and a vignette; without it the old
// plank hall is drawn. The lot picture, buttons and hit areas never move.

import { test, eq, ok, done } from './harness.js';
import { makeCtx } from './fakectx.js';
import { makeApp } from './fakeapp.js';
import { auctionScene, LAYOUT } from '../src/ui/scenes/auction.js';
import { startGame } from '../src/sim/newgame.js';

// A fresh game on auction day (day 24 of January) with the six lots in place.
function setup() {
	const state = startGame(8);
	state.day = 24;
	const app = makeApp(state);
	auctionScene.enter(app, null);
	return app;
}

// A fake app.rooms that has the 'auction' plate and records each draw.
function withPlate(app) {
	app.rooms = {
		has: function (id) {
			return id === 'auction';
		},
		draw: function (ctx, id, opts) {
			app.calls.push(['draw', id, opts]);
			return true;
		},
	};
	return app;
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

// Recorded calls on a fake ctx with the given method name.
function callsNamed(ctx, name) {
	const out = [];
	for (let i = 0; i < ctx.calls.length; i++) {
		if (ctx.calls[i][0] === name) {
			out.push(ctx.calls[i][1]);
		}
	}
	return out;
}

test('LAYOUT.picture is unchanged by the plate work', () => {
	eq(LAYOUT.picture, { x: 120, y: 100, w: 1040, h: 260 }, 'picture rect');
});

test('with the plate loaded the plate is drawn once and the plank stage is not', () => {
	const app = withPlate(setup());
	const ctx = makeCtx();
	auctionScene.draw(ctx, app, 0);
	const draws = app.calls.filter(function (c) {
		return c[0] === 'draw';
	});
	eq(draws.length, 1, 'one plate draw per frame');
	eq(draws[0][1], 'auction', 'the auction plate is drawn');
	eq(draws[0][2], { look: { x: 0, y: 0 } }, 'default look when app.look is unset');
	const stage = callsNamed(ctx, 'fillRect').filter(function (a) {
		return JSON.stringify(a) === JSON.stringify([120, 100, 1040, 260]);
	});
	eq(stage.length, 0, 'no plank stage rect');
});

test('with the plate loaded the crowd is still drawn (16 silhouette heads)', () => {
	const app = withPlate(setup());
	const ctx = makeCtx();
	auctionScene.draw(ctx, app, 0);
	const heads = callsNamed(ctx, 'arc').filter(function (a) {
		return a[2] === 13;
	});
	ok(heads.length >= 16, 'at least 16 crowd heads, got ' + heads.length);
});

test('without the plate the old plank hall is drawn exactly once', () => {
	const app = setup();
	ok(app.rooms === undefined, 'the fake app has no rooms');
	const ctx = makeCtx();
	auctionScene.draw(ctx, app, 0);
	const stage = callsNamed(ctx, 'fillRect').filter(function (a) {
		return JSON.stringify(a) === JSON.stringify([120, 100, 1040, 260]);
	});
	eq(stage.length, 1, 'exactly one plank stage rect');
	eq(app.calls.length, 0, 'no plate draw without rooms');
});

test('an app.rooms that does not have the auction plate falls back to the plank hall', () => {
	const app = setup();
	app.rooms = {
		has: function () {
			return false;
		},
		draw: function () {
			app.calls.push(['draw']);
			return false;
		},
	};
	const ctx = makeCtx();
	auctionScene.draw(ctx, app, 0);
	eq(app.calls.length, 0, 'the plate is not drawn when it has not loaded');
	const stage = callsNamed(ctx, 'fillRect').filter(function (a) {
		return JSON.stringify(a) === JSON.stringify([120, 100, 1040, 260]);
	});
	eq(stage.length, 1, 'the plank stage is drawn instead');
});

test('NEXT still advances a lot with the plate loaded', () => {
	const app = withPlate(setup());
	auctionScene.draw(makeCtx(), app, 0);
	eq(auctionScene.lotIndex, 0, 'starts on the first lot');
	tap(app, centre(LAYOUT.next)[0], centre(LAYOUT.next)[1]);
	eq(auctionScene.lotIndex, 1, 'NEXT advanced one lot');
});

done();
