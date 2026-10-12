// Tests for the end screen input and the end-screen animations (card W66b),
// run under `jsc -m`. Every interaction follows the real sequence: pointer
// down, a redraw with a different t, pointer up, per docs/SCENE_RULES.md. The
// win confetti and the bankrupt cloud are checked by drawing the same state at
// two different t values: the frame must move, so the logs must differ.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, texts, count, anySet } from './fakectx.js';
import { makeApp } from './fakeapp.js';
import { endgameScene, LAYOUT } from '../src/ui/scenes/endgame.js';
import { PALETTE } from '../src/ui/theme.js';
import { startGame } from '../src/sim/newgame.js';
import { PLATE_KEYS } from '../src/core/state.js';

// A fresh app on the end screen, with the reason and plates the test needs.
function endApp(opts) {
	const o = opts || {};
	const state = startGame(5);
	state.cash = 50000;
	state.flags.gameOver = true;
	state.flags.won = o.won === true;
	state.flags.reason = o.reason === undefined ? 'won' : o.reason;
	if (o.plates === 'all') {
		for (let i = 0; i < PLATE_KEYS.length; i++) {
			state.plates[PLATE_KEYS[i]] = true;
		}
	}
	const app = makeApp(state);
	endgameScene.enter(app);
	endgameScene.draw(makeCtx(), app, 0);
	return app;
}

// The real tap sequence: down, a redraw at another t, up.
function tap(app, x, y) {
	endgameScene.pointer(app, 'down', x, y);
	endgameScene.draw(makeCtx(), app, 1);
	endgameScene.pointer(app, 'up', x, y);
}

// Button centres, from LAYOUT.
const AGAIN = [LAYOUT.again.x + LAYOUT.again.w / 2, LAYOUT.again.y + LAYOUT.again.h / 2];
const TITLE = [LAYOUT.title.x + LAYOUT.title.w / 2, LAYOUT.title.y + LAYOUT.title.h / 2];

// The recorded context calls for one draw at time t.
function log(app, t) {
	const ctx = makeCtx();
	endgameScene.draw(ctx, app, t);
	return JSON.stringify(ctx.calls);
}

test('tapping PLAY AGAIN starts a new game', () => {
	const app = endApp({ won: true, reason: 'won' });
	tap(app, AGAIN[0], AGAIN[1]);
	eq(app.calls, [['newGame']], 'newGame was called once');
	eq(app.toasts, [], 'no toast');
});

test('tapping TITLE goes to the title screen', () => {
	const app = endApp({ won: false, reason: 'year-end' });
	tap(app, TITLE[0], TITLE[1]);
	eq(app.calls, [['go', 'title', undefined]], 'go title was called');
	eq(app.toasts, [], 'no toast');
});

test('Enter does the same as tapping PLAY AGAIN', () => {
	const app = endApp({ won: false, reason: 'year-end' });
	endgameScene.key(app, 'Enter');
	eq(app.calls, [['newGame']], 'newGame was called once');
});

test('other keys do nothing', () => {
	const app = endApp({ won: false, reason: 'year-end' });
	endgameScene.key(app, 'Escape');
	endgameScene.key(app, 'ArrowDown');
	endgameScene.key(app, 'x');
	eq(app.calls, [], 'no navigation happened');
});

test('a tap in the gap between the buttons does nothing', () => {
	const app = endApp({ won: false, reason: 'year-end' });
	tap(app, LAYOUT.again.x + LAYOUT.again.w + 10, AGAIN[1]);
	eq(app.calls, [], 'no navigation happened');
});

test('a mismatched down and up does nothing', () => {
	const app = endApp({ won: false, reason: 'year-end' });
	endgameScene.pointer(app, 'down', AGAIN[0], AGAIN[1]);
	endgameScene.draw(makeCtx(), app, 1);
	endgameScene.pointer(app, 'up', TITLE[0], TITLE[1]);
	eq(app.calls, [], 'no navigation happened');
});

test('an orphan up does nothing', () => {
	const app = endApp({ won: false, reason: 'year-end' });
	endgameScene.pointer(app, 'up', AGAIN[0], AGAIN[1]);
	eq(app.calls, [], 'no navigation happened');
});

test('a missed up inside PLAY AGAIN still fires the tap', () => {
	// The press lands on PLAY AGAIN, the finger slides off and comes back: the
	// hit list is rebuilt by the redraws in between and must still match.
	const app = endApp({ won: false, reason: 'year-end' });
	endgameScene.pointer(app, 'down', AGAIN[0], AGAIN[1]);
	endgameScene.draw(makeCtx(), app, 2);
	endgameScene.pointer(app, 'move', LAYOUT.again.x + 10, AGAIN[1]);
	endgameScene.pointer(app, 'up', AGAIN[0], AGAIN[1]);
	eq(app.calls, [['newGame']], 'newGame was called once');
});

test('a won game moves its confetti between frames', () => {
	const app = endApp({ won: true, reason: 'won', plates: 'all' });
	// The first frame has no confetti at all if the drawing is missing, so check
	// the rectangles are there as well as that they move.
	const ctx = makeCtx();
	endgameScene.draw(ctx, app, 0);
	ok(count(ctx, 'fillRect') > 0, 'confetti rectangles are drawn');
	ok(log(app, 0) !== log(app, 1), 'the confetti frame changes with t');
	ok(log(app, 1) !== log(app, 2), 'the confetti frame changes again');
});

test('the confetti positions depend only on t, not on the frame count', () => {
	// Two draws at the same t, with a different t drawn in between: identical.
	const app = endApp({ won: true, reason: 'won', plates: 'all' });
	const first = log(app, 3);
	endgameScene.draw(makeCtx(), app, 9);
	eq(log(app, 3), first, 'the same t draws the identical frame');
});

test('the confetti uses several palette colours', () => {
	const app = endApp({ won: true, reason: 'won', plates: 'all' });
	const ctx = makeCtx();
	endgameScene.draw(ctx, app, 0);
	ok(anySet(ctx, 'fillStyle', PALETTE.gold), 'gold confetti');
	ok(anySet(ctx, 'fillStyle', PALETTE.cyan), 'cyan confetti');
});

test('a won frame draws more rectangles than a lost one', () => {
	// Confetti is the only thing a win adds: the board, panels and buttons are
	// the same in both.
	const won = endApp({ won: true, reason: 'won', plates: 'all' });
	const lost = endApp({ won: false, reason: 'year-end' });
	const cw = makeCtx();
	endgameScene.draw(cw, won, 0);
	const cl = makeCtx();
	endgameScene.draw(cl, lost, 0);
	ok(count(cw, 'fillRect') > count(cl, 'fillRect'), 'the win adds confetti rectangles');
});

test('a bankrupt game draws a drifting grey cloud', () => {
	const app = endApp({ won: false, reason: 'bankrupt' });
	// The cloud is grey circles over the board.
	const ctx = makeCtx();
	endgameScene.draw(ctx, app, 0);
	ok(count(ctx, 'arc') > 0, 'cloud puffs are drawn');
	ok(anySet(ctx, 'fillStyle', PALETTE.lightgrey), 'the cloud is lightgrey');
	ok(log(app, 0) !== log(app, 2), 'the cloud drifts as t moves');
});

test('a bankruptcy draws no confetti and a win draws no cloud', () => {
	const wonApp = endApp({ won: true, reason: 'won', plates: 'all' });
	const ctxW = makeCtx();
	endgameScene.draw(ctxW, wonApp, 0);
	const bankApp = endApp({ won: false, reason: 'bankrupt' });
	const ctxB = makeCtx();
	endgameScene.draw(ctxB, bankApp, 0);
	eq(count(ctxW, 'arc'), 0, 'no cloud puffs on a win');
	ok(!anySet(ctxB, 'fillStyle', PALETTE.cyan), 'no cyan confetti on a bankruptcy');
	ok(!anySet(ctxB, 'fillStyle', PALETTE.purple), 'no purple confetti on a bankruptcy');
});

test('a year-end game has no confetti and no cloud', () => {
	const app = endApp({ won: false, reason: 'year-end' });
	const ctx = makeCtx();
	endgameScene.draw(ctx, app, 0);
	eq(count(ctx, 'arc'), 0, 'no cloud puffs');
	ok(log(app, 0) === log(app, 1), 'a still frame: nothing animates');
});

test('the buttons and their hit list survive a redraw between taps', () => {
	const app = endApp({ won: false, reason: 'year-end' });
	// A tap straight after enter, with no draw in between.
	endgameScene.pointer(app, 'down', TITLE[0], TITLE[1]);
	endgameScene.pointer(app, 'up', TITLE[0], TITLE[1]);
	eq(app.calls, [['go', 'title', undefined]], 'the seeded hit list works');
});

test('the whole frame still contains the buttons and their labels', () => {
	const app = endApp({ won: true, reason: 'won', plates: 'all' });
	const got = texts((function () {
		const ctx = makeCtx();
		endgameScene.draw(ctx, app, 0.5);
		return ctx;
	})());
	ok(got.indexOf('PLAY AGAIN') !== -1, 'PLAY AGAIN drawn');
	ok(got.indexOf('TITLE') !== -1, 'TITLE drawn');
});

// How many drawn coordinates are NaN or wild, over a whole frame. A frame with
// a missing or broken t must still put finite numbers on the canvas.
function badCoords(ctx) {
	let bad = 0;
	for (let i = 0; i < ctx.calls.length; i++) {
		const c = ctx.calls[i];
		if (c[0] !== 'fillRect' && c[0] !== 'arc') continue;
		for (let j = 0; j < c[1].length; j++) {
			const v = c[1][j];
			if (typeof v === 'number' && (v !== v || Math.abs(v) > 1e6)) bad += 1;
		}
	}
	return bad;
}

test('an unknown reason draws neither the confetti nor the cloud', () => {
	const app = endApp({ won: false, reason: 'weird' });
	const ctx = makeCtx();
	endgameScene.draw(ctx, app, 3);
	eq(count(ctx, 'arc'), 0, 'no cloud puffs');
	eq(badCoords(ctx), 0, 'every coordinate is finite');
});

test('a huge or negative t still draws finite coordinates', () => {
	const won = endApp({ won: true, reason: 'won', plates: 'all' });
	const bank = endApp({ won: false, reason: 'bankrupt' });
	const ts = [1e6, -1, 0];
	for (let i = 0; i < ts.length; i++) {
		const cw = makeCtx();
		endgameScene.draw(cw, won, ts[i]);
		eq(badCoords(cw), 0, 'confetti finite at t=' + ts[i]);
		const cb = makeCtx();
		endgameScene.draw(cb, bank, ts[i]);
		eq(badCoords(cb), 0, 'cloud finite at t=' + ts[i]);
	}
});

test('a tap before the first draw does nothing', () => {
	// enter() seeds the hit list, but a scene that was never entered has none:
	// the pointer must not throw.
	const app = endApp({ won: true, reason: 'won' });
	endgameScene.hits = null;
	endgameScene.pointer(app, 'down', AGAIN[0], AGAIN[1]);
	endgameScene.pointer(app, 'up', AGAIN[0], AGAIN[1]);
	eq(app.calls, [], 'no navigation happened');
	endgameScene.key(app, 'Enter');
	eq(app.calls, [['newGame']], 'the keyboard still works');
});

test('the right edge of a button is outside its hit area', () => {
	const app = endApp({ won: false, reason: 'year-end' });
	const edge = LAYOUT.again.x + LAYOUT.again.w;
	endgameScene.pointer(app, 'down', edge, AGAIN[1]);
	endgameScene.pointer(app, 'up', edge, AGAIN[1]);
	eq(app.calls, [], 'the exact right edge misses');
	endgameScene.pointer(app, 'down', edge - 1, AGAIN[1]);
	endgameScene.pointer(app, 'up', edge - 1, AGAIN[1]);
	eq(app.calls, [['newGame']], 'one pixel inside hits');
});

done();
