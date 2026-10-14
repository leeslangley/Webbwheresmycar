// Tests for the title scene night shop row plate (card GE23), run under `jsc -m`.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, count, anySet, reset } from './fakectx.js';
import { makeApp } from './fakeapp.js';
import { titleScene, LAYOUT } from '../src/ui/scenes/title.js';
import { PALETTE } from '../src/ui/theme.js';

// Centre of a layout rect: where a tap lands.
function centre(r) {
	return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

// Simulate a tap: pointer down then up at the same point.
function tap(app, x, y) {
	titleScene.pointer(app, 'down', x, y);
	titleScene.pointer(app, 'up', x, y);
}

// A fake app.rooms: has('title') is true and every draw is recorded in
// rooms.calls, separately from the ctx log and app.calls.
function makePlateApp(loaded) {
	const app = makeApp();
	app.rooms = {
		calls: [],
		has: function (id) {
			return loaded !== false && id === 'title';
		},
		draw: function (ctx, id, opts) {
			this.calls.push(['draw', id, opts]);
			return true;
		},
	};
	return app;
}

// True when the ctx log has a call with this name and these exact args.
function hasCall(ctx, name, args) {
	for (let i = 0; i < ctx.calls.length; i++) {
		const c = ctx.calls[i];
		if (c[0] === name && JSON.stringify(c[1]) === JSON.stringify(args)) {
			return true;
		}
	}
	return false;
}

test('plate mode draws the title room plate once', () => {
	const app = makePlateApp();
	const ctx = makeCtx();
	titleScene.draw(ctx, app, 0);
	eq(app.rooms.calls.length, 1, 'rooms.draw called once');
	eq(app.rooms.calls[0][0], 'draw', 'call is draw');
	eq(app.rooms.calls[0][1], 'title', 'plate id is title');
	eq(app.rooms.calls[0][2], { look: { x: 0, y: 0 } }, 'default look is passed');
});

test('plate mode passes app.look through to the plate', () => {
	const app = makePlateApp();
	app.look = { x: 1, y: -1 };
	const ctx = makeCtx();
	titleScene.draw(ctx, app, 0);
	eq(app.rooms.calls[0][2], { look: { x: 1, y: -1 } }, 'app.look is passed');
});

test('plate mode draws three warm lamp glows over the lamp posts', () => {
	const app = makePlateApp();
	const ctx = makeCtx();
	titleScene.draw(ctx, app, 0);
	ok(count(ctx, 'set:globalCompositeOperation') >= 3, 'at least three additive composites');
	ok(anySet(ctx, 'globalCompositeOperation', 'lighter'), 'additive lighter composite');
	for (const x of [250, 700, 1180]) {
		// glow() fills a 2*170 square centred on the lamp at y 296.
		ok(hasCall(ctx, 'fillRect', [x - 170, 296 - 170, 340, 340]), 'lamp glow at x ' + x);
	}
});

test('plate mode still draws the car and the scrolling dashes', () => {
	const app = makePlateApp();
	const ctx = makeCtx();
	titleScene.draw(ctx, app, 0);
	// At t=0 the car is at x = -300 on the road line y = 660.
	ok(hasCall(ctx, 'translate', [-300, 660]), 'car is drawn at its road position');
	ok(hasCall(ctx, 'fillRect', [0, 676, 60, 8]), 'first road dash is drawn');
	ok(anySet(ctx, 'fillStyle', PALETTE.yellow), 'dashes use the yellow centre line');
});

test('plate mode skips the darkgrey road fill', () => {
	const app = makePlateApp();
	const ctx = makeCtx();
	titleScene.draw(ctx, app, 0);
	ok(!hasCall(ctx, 'fillRect', [0, 640, 1280, 80]), 'no road fill rectangle in plate mode');
});

test('plate mode applies the vignette over the plate', () => {
	const app = makePlateApp();
	const ctx = makeCtx();
	titleScene.draw(ctx, app, 0);
	ok(count(ctx, 'createRadialGradient') >= 4, 'lamp glows and the vignette create gradients');
	// vignette() fills the plate width plus 144 px each side, full height.
	ok(hasCall(ctx, 'fillRect', [-144, 0, 1280 + 288, 720]), 'vignette fill covers the plate');
});

test('without a plate the old darkgrey road strip is drawn', () => {
	const app = makeApp();
	const ctx = makeCtx();
	titleScene.draw(ctx, app, 0);
	ok(anySet(ctx, 'fillStyle', PALETTE.darkgrey), 'darkgrey fill set');
	ok(hasCall(ctx, 'fillRect', [0, 640, 1280, 80]), 'road fill rectangle drawn');
	eq(count(ctx, 'createRadialGradient'), 0, 'no lamp glows or vignette without a plate');
	ok(!hasCall(ctx, 'fillRect', [250 - 170, 296 - 170, 340, 340]), 'no lamp glow without a plate');
});

test('a rooms object without the title plate falls back to the road strip', () => {
	const app = makePlateApp(false);
	const ctx = makeCtx();
	titleScene.draw(ctx, app, 0);
	eq(app.rooms.calls.length, 0, 'rooms.draw not called when title is not loaded');
	ok(hasCall(ctx, 'fillRect', [0, 640, 1280, 80]), 'road fill rectangle drawn');
});

test('plate mode still draws the logo and button texts', () => {
	const app = makePlateApp();
	const ctx = makeCtx();
	titleScene.draw(ctx, app, 0);
	ok(anySet(ctx, 'fillStyle', PALETTE.lamp), 'logo colour set');
	const cs = [];
	for (let i = 0; i < ctx.calls.length; i++) {
		if (ctx.calls[i][0] === 'fillText') {
			cs.push(ctx.calls[i][1][0]);
		}
	}
	ok(cs.indexOf('NEW GAME') !== -1, 'NEW GAME label drawn');
	ok(cs.indexOf('SETTINGS') !== -1, 'SETTINGS label drawn');
});

test('tapping NEW GAME in plate mode still starts a new game', () => {
	const app = makePlateApp();
	const ctx = makeCtx();
	titleScene.draw(ctx, app, 0);
	const c = centre(LAYOUT.newGame);
	tap(app, c.x, c.y);
	eq(app.calls, [['newGame']], 'newGame call recorded in plate mode');
});

test('a plate-mode tap survives a redraw between down and up', () => {
	const app = makePlateApp();
	const ctx = makeCtx();
	titleScene.draw(ctx, app, 0);
	const c = centre(LAYOUT.newGame);
	titleScene.pointer(app, 'down', c.x, c.y);
	reset(ctx);
	titleScene.draw(ctx, app, 0.5);
	titleScene.pointer(app, 'up', c.x, c.y);
	eq(app.calls, [['newGame']], 'tap fires across a plate-mode redraw');
});

done();
