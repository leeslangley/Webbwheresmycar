// Tests for the advertising scene (card W61), run under `jsc -m`.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, texts, reset, anySet } from './fakectx.js';
import { makeApp } from './fakeapp.js';
import { advertsScene, LAYOUT } from '../src/ui/scenes/adverts.js';
import { ADVERTS } from '../src/data/adverts.js';
import { startGame } from '../src/sim/newgame.js';
import { PALETTE } from '../src/ui/theme.js';

// Index of a media id in the ADVERTS table.
function indexOf(id) {
	for (let i = 0; i < ADVERTS.length; i++) {
		if (ADVERTS[i].id === id) {
			return i;
		}
	}
	return -1;
}

// Centre of a layout rect: where a tap lands.
function centre(r) {
	return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

// Centre of list row i.
function rowCentre(i) {
	return {
		x: LAYOUT.list.x + LAYOUT.list.w / 2,
		y: LAYOUT.list.y + i * LAYOUT.rowH + LAYOUT.rowH / 2,
	};
}

// Simulate a tap: pointer down then up at the same point.
function tap(app, x, y) {
	advertsScene.pointer(app, 'down', x, y);
	advertsScene.pointer(app, 'up', x, y);
}

// A drawn scene with a fresh game and context.
function drawn(seed) {
	const state = startGame(seed);
	const app = makeApp(state);
	const ctx = makeCtx();
	advertsScene.enter(app, {});
	advertsScene.draw(ctx, app, 0);
	return { state: state, app: app, ctx: ctx };
}

test('draw shows the title and all seven media names', () => {
	const { ctx } = drawn(4);
	const got = texts(ctx);
	ok(got.indexOf('ADVERTISING') !== -1, 'title ADVERTISING shown');
	for (let i = 0; i < ADVERTS.length; i++) {
		ok(got.indexOf(ADVERTS[i].name) !== -1, 'shows ' + ADVERTS[i].name);
	}
});

test('draw shows PAYS and RISK indicator lines and the buzz meter', () => {
	const { ctx } = drawn(4);
	const got = texts(ctx);
	ok(got.indexOf('PAYS ' + String.fromCharCode(0x2605)) !== -1 || got.some(t => t.indexOf('PAYS ') === 0), 'a PAYS line is shown');
	ok(got.some(t => t.indexOf('RISK ') === 0 && t.indexOf('%') !== -1), 'a RISK percent line is shown');
	ok(got.some(t => t.indexOf('BUZZ ') === 0), 'a BUZZ readout is shown');
});

test('LAYOUT rects sit inside the 1280x720 screen', () => {
	const rects = [LAYOUT.list, LAYOUT.detail, LAYOUT.run, LAYOUT.back];
	for (let i = 0; i < rects.length; i++) {
		const r = rects[i];
		ok(r.x >= 0 && r.x + r.w <= 1280, 'rect ' + i + ' x range');
		ok(r.y >= 0 && r.y + r.h <= 720, 'rect ' + i + ' y range');
	}
	ok(LAYOUT.rowH === 70, 'rowH is 70');
});

test('selecting tv shows Cost GBP 4,000 in the detail panel', () => {
	const { app, ctx } = drawn(4);
	const c = rowCentre(indexOf('tv'));
	tap(app, c.x, c.y);
	reset(ctx);
	advertsScene.draw(ctx, app, 0);
	const got = texts(ctx);
	ok(got.indexOf('Cost £4,000') !== -1, 'detail shows Cost £4,000');
	ok(got.indexOf('Typical buzz +55') !== -1, 'tv typical buzz is +55 (54.5 rounds up)');
});

test('the RISK shown for youtube is 55 percent', () => {
	const { app, ctx } = drawn(4);
	const c = rowCentre(indexOf('youtube'));
	tap(app, c.x, c.y);
	reset(ctx);
	advertsScene.draw(ctx, app, 0);
	const got = texts(ctx);
	ok(got.indexOf('RISK 55%') !== -1, 'youtube row shows RISK 55%');
	ok(got.indexOf('Chance of a flop 55%') !== -1, 'youtube detail shows a flop chance of 55%');
});

test('running paper advertising costs 150, one day and one ad', () => {
	const { state, app, ctx } = drawn(4);
	const cashBefore = state.cash;
	const c = rowCentre(indexOf('paper'));
	tap(app, c.x, c.y);
	reset(ctx);
	advertsScene.draw(ctx, app, 0);
	tap(app, centre(LAYOUT.run).x, centre(LAYOUT.run).y);
	eq(state.day, 2, 'the day advanced to 2');
	eq(state.stats.adsRun, 1, 'one advert was run');
	eq(state.cash, cashBefore - 150, 'the paper cost 150');
});

test('running tv with too little cash toasts and changes nothing', () => {
	const { state, app, ctx } = drawn(4);
	state.cash = 100;
	reset(ctx);
	advertsScene.draw(ctx, app, 0);
	ok(anySet(ctx, 'fillStyle', PALETTE.midgrey), 'the RUN button draws disabled grey');
	tap(app, centre(LAYOUT.run).x, centre(LAYOUT.run).y);
	eq(app.toasts, ['Not enough money'], 'the toast explains the button is out of reach');
	eq(state.day, 1, 'the day did not advance');
	eq(state.stats.adsRun, 0, 'no advert was run');
	eq(state.cash, 100, 'the cash is untouched');
	eq(app.calls, [], 'no navigation happened');
});

test('BACK pops back to the office', () => {
	const { app } = drawn(4);
	tap(app, centre(LAYOUT.back).x, centre(LAYOUT.back).y);
	eq(app.calls, [['pop']], 'BACK records a pop');
});

test('Escape pops back to the office', () => {
	const { app } = drawn(4);
	advertsScene.key(app, 'Escape');
	eq(app.calls, [['pop']], 'Escape records a pop');
});

test('arrow keys move the selection and Enter runs it', () => {
	const { state, app } = drawn(4);
	const cashBefore = state.cash;
	advertsScene.key(app, 'Down');
	advertsScene.key(app, 'Down');
	advertsScene.key(app, 'Down');
	advertsScene.key(app, 'Down');
	advertsScene.key(app, 'Down');
	advertsScene.key(app, 'Down');
	advertsScene.key(app, 'Down'); // wraps back to row 0 (paper)
	eq(advertsScene.sel, 0, 'Down wraps around the seven rows');
	advertsScene.key(app, 'Up'); // back to the last row (tv)
	eq(advertsScene.sel, ADVERTS.length - 1, 'Up moves to the last row');
	// tv costs 4000 and the cash covers it, so Enter runs the advert.
	advertsScene.key(app, 'Enter');
	eq(state.stats.adsRun, 1, 'Enter ran the selected advert');
	eq(state.cash, cashBefore - ADVERTS[advertsScene.sel].cost, 'Enter paid the tv cost');
});

test('a tap fires exactly once when draw runs between down and up', () => {
	const { state, app, ctx } = drawn(4);
	const c = rowCentre(indexOf('paper'));
	advertsScene.pointer(app, 'down', c.x, c.y);
	advertsScene.draw(ctx, app, 0.5); // a redraw between finger-down and up
	advertsScene.pointer(app, 'up', c.x, c.y);
	eq(advertsScene.sel, 0, 'the selection landed on paper');
	eq(state.day, 1, 'no side effect yet');
	// ...and the same gesture on RUN fires exactly once.
	reset(ctx);
	advertsScene.draw(ctx, app, 0);
	advertsScene.pointer(app, 'down', centre(LAYOUT.run).x, centre(LAYOUT.run).y);
	advertsScene.draw(ctx, app, 0.5);
	advertsScene.pointer(app, 'up', centre(LAYOUT.run).x, centre(LAYOUT.run).y);
	eq(state.day, 2, 'the day advanced exactly once');
	eq(state.stats.adsRun, 1, 'exactly one advert was run');
});

test('a down on one row and an up on another selects nothing', () => {
	const { app } = drawn(4);
	const paper = rowCentre(indexOf('paper'));
	const tv = rowCentre(indexOf('tv'));
	advertsScene.pointer(app, 'down', paper.x, paper.y);
	advertsScene.pointer(app, 'up', tv.x, tv.y);
	eq(advertsScene.sel, 0, 'mismatched down and up is a no-op');
});

test('an up with no earlier down does nothing', () => {
	const { app } = drawn(4);
	const c = centre(LAYOUT.run);
	advertsScene.pointer(app, 'up', c.x, c.y);
	eq(app.calls, [], 'orphan up is a no-op');
	eq(advertsScene.pressed, null, 'no pressed state lingers');
});

test('draw works at t=0 and t=7 and both produce output', () => {
	const { app } = drawn(4);
	const ctx = makeCtx();
	advertsScene.draw(ctx, app, 0);
	const log0 = JSON.stringify(ctx.calls);
	reset(ctx);
	advertsScene.draw(ctx, app, 7);
	const log7 = JSON.stringify(ctx.calls);
	ok(log0.length > 0, 't=0 draw produced calls');
	ok(log7.length > 0, 't=7 draw produced calls');
});

done();
