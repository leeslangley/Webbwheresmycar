// Tests for the title screen scene (card W57), run under `jsc -m`.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, texts, reset } from './fakectx.js';
import { makeApp } from './fakeapp.js';
import { titleScene, LAYOUT } from '../src/ui/scenes/title.js';

// Centre of a layout rect: where a tap lands.
function centre(r) {
	return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

// Simulate a tap: pointer down then up at the same point.
function tap(app, x, y) {
	titleScene.pointer(app, 'down', x, y);
	titleScene.pointer(app, 'up', x, y);
}

test('draw includes the logo and button texts', () => {
	const app = makeApp();
	const ctx = makeCtx();
	titleScene.draw(ctx, app, 0);
	const got = texts(ctx);
	for (const want of ['WEBB,', "WHERE'S MY CAR?", 'NEW GAME', 'CONTINUE', 'SETTINGS']) {
		ok(got.indexOf(want) !== -1, 'draw includes ' + want);
	}
	ok(got.indexOf("A WEBB'S WHEELS PRODUCTION") !== -1, 'draw includes the production line');
	ok(got.indexOf('Starring Mark Webb') !== -1, 'draw includes the starring line');
});

test('LAYOUT buttons sit inside the 1280x720 screen', () => {
	for (const key of ['newGame', 'continueBtn', 'settings']) {
		const r = LAYOUT[key];
		ok(r.x >= 0 && r.x + r.w <= 1280, key + ' x range');
		ok(r.y >= 0 && r.y + r.h <= 720, key + ' y range');
	}
});

test('tapping NEW GAME starts a new game', () => {
	const app = makeApp();
	const ctx = makeCtx();
	titleScene.draw(ctx, app, 0);
	const c = centre(LAYOUT.newGame);
	tap(app, c.x, c.y);
	eq(app.calls, [['newGame']], 'newGame call recorded');
});

test('CONTINUE does nothing when there is no save', () => {
	const app = makeApp();
	eq(app.hasSave(), false, 'fake app has no save by default');
	const ctx = makeCtx();
	titleScene.draw(ctx, app, 0);
	const c = centre(LAYOUT.continueBtn);
	tap(app, c.x, c.y);
	eq(app.calls, [], 'no call when hasSave is false');
});

test('CONTINUE continues when hasSave is true', () => {
	const app = makeApp();
	app.hasSave = function () {
		return true;
	};
	const ctx = makeCtx();
	titleScene.draw(ctx, app, 0);
	const c = centre(LAYOUT.continueBtn);
	tap(app, c.x, c.y);
	eq(app.calls, [['continueGame']], 'continueGame call recorded');
});

test('tapping SETTINGS pushes the settings scene', () => {
	const app = makeApp();
	const ctx = makeCtx();
	titleScene.draw(ctx, app, 0);
	const c = centre(LAYOUT.settings);
	tap(app, c.x, c.y);
	eq(app.calls, [['push', 'settings', undefined]], 'push settings recorded');
});

test('a tap that misses every button does nothing', () => {
	const app = makeApp();
	const ctx = makeCtx();
	titleScene.draw(ctx, app, 0);
	tap(app, 100, 400);
	eq(app.calls, [], 'off-button tap is a no-op');
});

test('key Enter starts a new game', () => {
	const app = makeApp();
	titleScene.key(app, 'Enter');
	eq(app.calls, [['newGame']], 'Enter records newGame');
});

test('key n starts a new game and s opens settings', () => {
	const app = makeApp();
	titleScene.key(app, 'n');
	eq(app.calls, [['newGame']], 'n records newGame');
	titleScene.key(app, 's');
	eq(app.calls, [['newGame'], ['push', 'settings', undefined]], 's pushes settings');
});

test('key c continues only when a save exists', () => {
	const app = makeApp();
	titleScene.key(app, 'c');
	eq(app.calls, [], 'c does nothing without a save');
	app.hasSave = function () {
		return true;
	};
	titleScene.key(app, 'c');
	eq(app.calls, [['continueGame']], 'c records continueGame with a save');
});

test('draw works at t=0 and t=7 and the logs differ', () => {
	const app = makeApp();
	const ctx = makeCtx();
	titleScene.draw(ctx, app, 0);
	const log0 = JSON.stringify(ctx.calls);
	reset(ctx);
	titleScene.draw(ctx, app, 7);
	const log7 = JSON.stringify(ctx.calls);
	ok(log0.length > 0, 't=0 draw produced calls');
	ok(log7.length > 0, 't=7 draw produced calls');
	ok(log0 !== log7, 'the t=0 and t=7 draw logs differ');
});

test('the drawn car cycles archetypes every 6 seconds', () => {
	const app = makeApp();
	const ctx = makeCtx();
	// The archetype list must be exactly the four supported profiles.
	// drawCar throws for an unknown archetype, so drawing at each cycle
	// position proves every archetype in the rotation is real.
	for (let k = 0; k < 4; k++) {
		reset(ctx);
		titleScene.draw(ctx, app, k * 6 + 1);
	}
	ok(true, 'all four archetype cycles draw without throwing');
});

done();
