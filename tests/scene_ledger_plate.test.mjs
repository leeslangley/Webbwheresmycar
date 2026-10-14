// Tests for the ledger scene's desk plate, lamp glow, mug steam and vignette
// (card GE22), run under `jsc -m`. The plate is drawn only when app.rooms has
// loaded the 'ledger' plate; without it the scene draws exactly as before.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, texts, count, anySet } from './fakectx.js';
import { makeApp } from './fakeapp.js';
import { ledgerScene, LAYOUT } from '../src/ui/scenes/ledger.js';
import { startGame } from '../src/sim/newgame.js';

// A fake app.rooms: 'ledger' is loaded. Each draw is recorded in list and, in
// the ctx log, as a 'roomDraw' call so the order against the text can be seen.
function fakeRooms(list) {
	return {
		has: function (id) {
			return id === 'ledger';
		},
		draw: function (ctx, id, opts) {
			list.push(['draw', id, opts]);
			ctx.calls.push(['roomDraw', [id]]);
			return true;
		},
	};
}

// A fake app.rooms in which the ledger plate did not load.
function missingRooms(list) {
	return {
		has: function () {
			return false;
		},
		draw: function (ctx, id, opts) {
			list.push(['draw', id, opts]);
			return false;
		},
	};
}

// Centre of a layout rect: where a tap lands.
function centre(r) {
	return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

// Simulate a tap: pointer down then up at the same point.
function tap(app, x, y) {
	ledgerScene.pointer(app, 'down', x, y);
	ledgerScene.pointer(app, 'up', x, y);
}

// Does any drawn text equal this string?
function has(got, text) {
	for (let i = 0; i < got.length; i++) {
		if (got[i] === text) {
			return true;
		}
	}
	return false;
}

// Number of arc calls whose radius lies in [lo, hi].
function arcsInRange(ctx, lo, hi) {
	let n = 0;
	for (let i = 0; i < ctx.calls.length; i++) {
		const c = ctx.calls[i];
		if (c[0] === 'arc' && c[1][2] >= lo && c[1][2] <= hi) {
			n += 1;
		}
	}
	return n;
}

// Index in ctx.calls of the first call with this name, or -1.
function indexOfCall(ctx, name) {
	for (let i = 0; i < ctx.calls.length; i++) {
		if (ctx.calls[i][0] === name) {
			return i;
		}
	}
	return -1;
}

// Index in ctx.calls of the last fillText call, or -1.
function lastTextIndex(ctx) {
	let at = -1;
	for (let i = 0; i < ctx.calls.length; i++) {
		if (ctx.calls[i][0] === 'fillText') {
			at = i;
		}
	}
	return at;
}

// Index in ctx.calls of the vignette fill: fillRect(-144, 0, 1568, 720).
function vignetteIndex(ctx) {
	for (let i = 0; i < ctx.calls.length; i++) {
		const c = ctx.calls[i];
		if (c[0] === 'fillRect' && c[1][0] === -144 && c[1][1] === 0 && c[1][2] === 1568 && c[1][3] === 720) {
			return i;
		}
	}
	return -1;
}

// A started game with a fake app whose rooms are the given fake, drawn once on
// the chosen tab. rooms defaults to the loaded ledger plate.
function drawn(params, rooms) {
	const state = startGame(1);
	const app = makeApp(state);
	const list = [];
	app.rooms = rooms === undefined ? fakeRooms(list) : rooms(list);
	const ctx = makeCtx();
	ledgerScene.enter(app, params || {});
	ledgerScene.draw(ctx, app, 0);
	return { state: state, app: app, ctx: ctx, list: list };
}

test('plate: the ledger plate is drawn once, before any text', () => {
	const { ctx, list } = drawn({});
	eq(list.length, 1, 'one plate draw per frame');
	eq(list[0][0], 'draw', 'a draw call');
	eq(list[0][1], 'ledger', 'of the ledger plate');
	eq(list[0][2], { look: { x: 0, y: 0 } }, 'look defaults to the centre');
	eq(count(ctx, 'roomDraw'), 1, 'recorded in the ctx log once');
	const at = indexOfCall(ctx, 'roomDraw');
	ok(at >= 0 && at < indexOfCall(ctx, 'fillText'), 'the plate is behind the first text');
});

test('plate: a look from app.look is passed to the plate draw', () => {
	const state = startGame(1);
	const app = makeApp(state);
	const list = [];
	app.rooms = fakeRooms(list);
	app.look = { x: 1, y: -1 };
	ledgerScene.enter(app, {});
	ledgerScene.draw(makeCtx(), app, 0);
	eq(list[0][2], { look: { x: 1, y: -1 } }, 'the look is handed to the plate');
});

test('plate: the lamp glow and four steam puffs are drawn', () => {
	const { ctx } = drawn({});
	ok(anySet(ctx, 'globalCompositeOperation', 'lighter'), 'the lamp glow adds light');
	ok(arcsInRange(ctx, 4, 14) >= 4, 'at least four steam puffs with radius 4 to 14');
});

test('plate: the vignette is drawn last, after the buttons', () => {
	const { ctx } = drawn({});
	const v = vignetteIndex(ctx);
	ok(v >= 0, 'the vignette fill is drawn');
	ok(v > lastTextIndex(ctx), 'the vignette comes after the last text (BACK)');
});

test('no plate: no vignette and no plate draw', () => {
	const { ctx, list } = drawn({}, missingRooms);
	eq(list.length, 0, 'the plate is never asked for when it is not loaded');
	eq(count(ctx, 'roomDraw'), 0, 'nothing was drawn as a plate');
	eq(vignetteIndex(ctx), -1, 'no vignette without a plate');
});

test('no plate: the scene draws without app.rooms at all', () => {
	const state = startGame(1);
	const app = makeApp(state);
	const ctx = makeCtx();
	ledgerScene.enter(app, {});
	ledgerScene.draw(ctx, app, 0);
	const got = texts(ctx);
	ok(has(got, 'Cash £20,000'), 'the books still draw');
	ok(has(got, 'BACK'), 'BACK still draws');
	eq(count(ctx, 'roomDraw'), 0, 'no plate draw');
	eq(vignetteIndex(ctx), -1, 'no vignette');
});

test('both tabs still draw with the plate', () => {
	const ledger = drawn({});
	ok(has(texts(ledger.ctx), 'Cash £20,000'), 'ledger tab shows the books');
	ok(has(texts(ledger.ctx), 'GOLD NUMBER PLATES'), 'ledger tab shows the plates');
	const workshop = drawn({ tab: 'workshop' });
	ok(has(texts(workshop.ctx), 'WORKSHOP BOARD'), 'workshop tab shows the board');
	ok(has(texts(workshop.ctx), 'Garage slots 3/8'), 'workshop tab shows the slots line');
	ok(!has(texts(workshop.ctx), 'GOLD NUMBER PLATES'), 'and not the ledger book');
});

test('plate: BUY EXTRA SLOT still works with the plate drawn', () => {
	const { state, app } = drawn({ tab: 'workshop' });
	const c = centre(LAYOUT.buySlot);
	tap(app, c.x, c.y);
	eq(state.garageSlots, 4, 'slots up to 4');
	eq(state.cash, 17000, 'cash down by 3000');
	eq(state.day, 2, 'a day passes');
});

test('plate: BACK pops after down, redraw, up', () => {
	const { app } = drawn({});
	const b = centre(LAYOUT.back);
	ledgerScene.pointer(app, 'down', b.x, b.y);
	ledgerScene.draw(makeCtx(), app, 0.5);
	ledgerScene.draw(makeCtx(), app, 1.5);
	ledgerScene.pointer(app, 'up', b.x, b.y);
	eq(app.calls, [['pop']], 'back pops exactly once');
	eq(ledgerScene.pressed, null, 'pressed cleared on up');
});

done();
