// Tests for the loading scene (card CC09), run under `jsc -m`.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, texts, reset } from './fakectx.js';
import { makeApp } from './fakeapp.js';
import { loadingScene } from '../src/ui/scenes/loading.js';
import { PALETTE } from '../src/ui/theme.js';

// Fake asset loader whose answers can be changed between draws.
function makeAssets(state) {
	return {
		progress: function () {
			return { done: state.done, total: state.total };
		},
		ready: function () {
			return state.ready;
		},
		timedOut: function () {
			return state.timedOut;
		},
	};
}

function freshApp(state) {
	const app = makeApp();
	app.assets = makeAssets(state);
	loadingScene.enter(app);
	return app;
}

// Names of the go() calls made on the app: ['title'] for one call to title.
function goCalls(app) {
	const out = [];
	for (const c of app.calls) {
		if (c[0] === 'go') {
			out.push(c[1]);
		}
	}
	return out;
}

// True if the car was drawn with its ground point at x (+- 1).
function carAt(ctx, x) {
	for (const c of ctx.calls) {
		if (c[0] === 'translate' && Math.abs(c[1][0] - x) <= 1) {
			return true;
		}
	}
	return false;
}

// fillRect calls made in screen space: the car's own rects are drawn in
// the car's scaled coordinate space, so skip everything between the car's
// translate and its matching restore (save/restore nest inside drawCar).
function screenRects(ctx) {
	const out = [];
	let depth = 0;
	for (const c of ctx.calls) {
		const name = c[0];
		if (name === 'translate' && depth === 0) {
			depth = 1;
			continue;
		}
		if (depth > 0) {
			if (name === 'save') {
				depth += 1;
			} else if (name === 'restore') {
				depth -= 1;
			}
			continue;
		}
		if (name === 'fillRect') {
			out.push(c[1]);
		}
	}
	return out;
}

// Number of segment cells filled PALETTE.good before the car is drawn.
function litCells(ctx) {
	let n = 0;
	for (const c of ctx.calls) {
		if (c[0] === 'translate') {
			break;
		}
		if (c[0] === 'set:fillStyle' && c[1][0] === PALETTE.good) {
			n += 1;
		}
	}
	return n;
}

test('loading: draw shows REVVING UP and the car at mid progress, no go yet', () => {
	const state = { done: 2, total: 4, ready: false, timedOut: false };
	const app = freshApp(state);
	const ctx = makeCtx();
	loadingScene.draw(ctx, app, 0);
	loadingScene.draw(ctx, app, 1);
	const got = texts(ctx);
	ok(got.length > 0 && got[got.length - 1].indexOf('REVVING UP') === 0, 'status text starts with REVVING UP');
	eq(goCalls(app), [], 'no go call while not ready');
	ok(carAt(ctx, 640), 'car drawn at x 640 for 2 of 4 assets');
	eq(litCells(ctx), 10, 'half the segment cells are lit at 2 of 4');
});

test('loading: leaves for title once ready and t - start >= 0.6, only once', () => {
	const state = { done: 4, total: 4, ready: true, timedOut: false };
	const app = freshApp(state);
	const ctx = makeCtx();
	loadingScene.draw(ctx, app, 0);
	loadingScene.draw(ctx, app, 1.0);
	loadingScene.draw(ctx, app, 1.5);
	loadingScene.draw(ctx, app, 2.0);
	eq(goCalls(app), ['title'], 'exactly one go to title');
});

test('loading: ready but only 0.3 s in makes no go call', () => {
	const state = { done: 4, total: 4, ready: true, timedOut: false };
	const app = freshApp(state);
	const ctx = makeCtx();
	loadingScene.draw(ctx, app, 0);
	loadingScene.draw(ctx, app, 0.3);
	eq(goCalls(app), [], 'no go before the minimum show time');
});

test('loading: never ready goes to title at 8 s, not before', () => {
	const state = { done: 1, total: 4, ready: false, timedOut: false };
	const app = freshApp(state);
	const ctx = makeCtx();
	loadingScene.draw(ctx, app, 0);
	loadingScene.draw(ctx, app, 7.9);
	eq(goCalls(app), [], 'no go at 7.9 s');
	loadingScene.draw(ctx, app, 8.1);
	eq(goCalls(app), ['title'], 'one go at 8.1 s');
	loadingScene.draw(ctx, app, 9.0);
	loadingScene.draw(ctx, app, 12.0);
	eq(goCalls(app), ['title'], 'still one go after more draws');
});

test('loading: no assets object goes straight to title on the first draw', () => {
	const app = makeApp();
	loadingScene.enter(app);
	const ctx = makeCtx();
	loadingScene.draw(ctx, app, 0);
	loadingScene.draw(ctx, app, 0.1);
	eq(goCalls(app), ['title'], 'one go on the first draw when app.assets is undefined');
});

test('loading: timed out shows GOING ANYWAY instead of REVVING UP', () => {
	const state = { done: 1, total: 4, ready: false, timedOut: true };
	const app = freshApp(state);
	const ctx = makeCtx();
	loadingScene.draw(ctx, app, 1);
	const got = texts(ctx);
	ok(got.indexOf('STILL REVVING - GOING ANYWAY') !== -1, 'timed-out text is drawn');
	ok(got.indexOf('STILL REVVING - GOING ANYWAY') === got.length - 1, 'timed-out text is the status line');
	for (const s of got) {
		ok(s.indexOf('REVVING UP') !== 0, 'no REVVING UP text when timed out');
	}
});

test('loading: dots cycle with floor(t*3) % 4', () => {
	const state = { done: 0, total: 4, ready: false, timedOut: false };
	const app = freshApp(state);
	const ctx = makeCtx();
	loadingScene.draw(ctx, app, 0);
	eq(texts(ctx).pop(), 'REVVING UP', 'no dots at t=0');
	reset(ctx);
	loadingScene.draw(ctx, app, 0.4);
	eq(texts(ctx).pop(), 'REVVING UP.', 'one dot at t=0.4');
	reset(ctx);
	loadingScene.draw(ctx, app, 1.1);
	eq(texts(ctx).pop(), 'REVVING UP...', 'three dots at t=1.1');
	reset(ctx);
	loadingScene.draw(ctx, app, 1.4);
	eq(texts(ctx).pop(), 'REVVING UP', 'back to none at t=1.4');
});

test('loading: total 0 shows an empty track and the car at the left end', () => {
	const state = { done: 0, total: 0, ready: false, timedOut: false };
	const app = freshApp(state);
	const ctx = makeCtx();
	loadingScene.draw(ctx, app, 0);
	ok(carAt(ctx, 640) === false, 'car is not at the centre with no progress');
	ok(carAt(ctx, 340), 'car is at the left end with no progress');
	ok(texts(ctx).length > 0, 'draws without error');
	eq(litCells(ctx), 0, 'no cells lit with total 0');
});

test('loading: ready puts the car at the right end of the road', () => {
	const state = { done: 0, total: 4, ready: true, timedOut: false };
	const app = freshApp(state);
	const ctx = makeCtx();
	loadingScene.draw(ctx, app, 0);
	loadingScene.draw(ctx, app, 1.0);
	ok(carAt(ctx, 940), 'car at x 940 when ready');
	eq(litCells(ctx), 20, 'all 20 cells lit when ready');
});

test('loading: centre dashes stay inside the road', () => {
	const state = { done: 1, total: 4, ready: false, timedOut: false };
	const app = freshApp(state);
	const ctx = makeCtx();
	loadingScene.draw(ctx, app, 2.345);
	let n = 0;
	for (const r of screenRects(ctx)) {
		if (r[3] === 4) {
			n += 1;
			ok(r[0] >= 340 && r[0] + r[2] <= 940, 'dash ' + JSON.stringify(r) + ' inside road x range');
		}
	}
	ok(n > 0, 'dashes were drawn');
});

test('loading: screen-space fillRects lie within 1280 x 720', () => {
	const state = { done: 3, total: 4, ready: false, timedOut: false };
	const app = freshApp(state);
	const ctx = makeCtx();
	loadingScene.draw(ctx, app, 0.7);
	const rects = screenRects(ctx);
	ok(rects.length > 20, 'screen-space rects were recorded');
	for (const r of rects) {
		const x = r[0];
		const y = r[1];
		const w = r[2];
		const h = r[3];
		ok(x >= 0 && y >= 0 && x + w <= 1280 && y + h <= 720, 'rect ' + JSON.stringify(r) + ' inside 1280x720');
	}
});

done();
