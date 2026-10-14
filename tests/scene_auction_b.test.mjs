// Tests for the Auction hall stat reveals (card W65b), run under `jsc -m`.
// The four stats read ??? until the player pays 150 to reveal one; the reveal
// costs no day, so the scene calls the sim directly and toasts its message.
// Every interaction follows the real sequence: draw, pointer down, a redraw
// with a different t, pointer up.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, texts } from './fakectx.js';
import { makeApp } from './fakeapp.js';
import { auctionScene, LAYOUT } from '../src/ui/scenes/auction.js';
import { startGame } from '../src/sim/newgame.js';
import { lotView, revealStat, AUCTION_REVEAL_COST, STATS } from '../src/sim/auction.js';
import { money } from '../src/core/format.js';

// A fresh game on auction day (day 24).
function setup(day) {
	const state = startGame(8);
	state.day = day !== undefined ? day : 24;
	const app = makeApp(state);
	auctionScene.enter(app, null);
	return app;
}

// One initial draw to build the hit list.
function drawOnce(app) {
	auctionScene.draw(makeCtx(), app, 0);
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

// Tap the REVEAL row for stat i.
function tapReveal(app, i) {
	const c = centre(LAYOUT.reveals[i]);
	tap(app, c[0], c[1]);
}

// How many stat rows show ??? this draw. A label draws twice (shadow then fill),
// so count one hidden row per LAYOUT.reveals rect whose ??? label is drawn.
function hiddenCount(app) {
	const ctx = makeCtx();
	auctionScene.draw(ctx, app, 0);
	let n = 0;
	for (let i = 0; i < LAYOUT.reveals.length; i++) {
		const x = LAYOUT.reveals[i].x + 10;
		const y = LAYOUT.reveals[i].y + 30;
		for (let c = 0; c < ctx.calls.length; c++) {
			const call = ctx.calls[c];
			if (call[0] === 'fillText' && call[1][0] === '???' && call[1][1] === x && call[1][2] === y) {
				n++;
				break;
			}
		}
	}
	return n;
}

// What the sim would say about revealing stat i on the current lot, without
// touching the real state (revealStat returns before mutating on a refusal).
function simMsg(state, lotId, stat) {
	return revealStat(state, lotId, stat).msg;
}

test('hidden stats show ??? and the true condition never appears', () => {
	const app = setup();
	const ctx = makeCtx();
	auctionScene.draw(ctx, app, 0);
	const ts = texts(ctx);
	const lot = app.state.auction.lots[0];
	eq(hiddenCount(app), 4, 'all four stats are hidden');
	eq(ts.indexOf('STYLE') !== -1, true, 'STYLE row drawn');
	eq(ts.indexOf('UPKEEP') !== -1, true, 'UPKEEP row drawn');
	eq(ts.indexOf('GRIT') !== -1, true, 'GRIT row drawn');
	eq(ts.indexOf('CONDITION') !== -1, true, 'CONDITION row drawn');
	eq(ts.indexOf('REVEAL ' + money(AUCTION_REVEAL_COST)) !== -1, true, 'a REVEAL button is drawn');
	ok(ts.indexOf(String(lot.condition)) === -1, 'the true condition number is not on screen');
	ok(ts.indexOf(String(lotView(app.state, lot.lotId).values.condition)) === -1, 'no condition value on screen');
});

test('tapping the first REVEAL costs 150 and shows that stat', () => {
	const app = setup();
	const state = app.state;
	const lotId = state.auction.lots[0].lotId;
	const before = state.cash;
	// What the sim reports for this exact reveal, read from a throwaway copy.
	const copy = JSON.parse(JSON.stringify(state));
	const expected = revealStat(copy, lotId, STATS[0]).msg;
	drawOnce(app);
	tapReveal(app, 0);
	eq(state.cash, before - AUCTION_REVEAL_COST, 'cash fell by the reveal cost');
	eq(state.auction.lots[0].revealed[STATS[0]], true, 'the stat is revealed');
	eq(state.auction.lots[0].revealCount, 1, 'the lot counts one reveal');
	eq(app.toasts[app.toasts.length - 1], expected, 'the sim message was toasted');
	eq(hiddenCount(app), 3, 'three stats are still hidden');
	const ctx = makeCtx();
	auctionScene.draw(ctx, app, 0);
	const ts = texts(ctx);
	const value = lotView(state, lotId).values[STATS[0]];
	eq(ts.indexOf(String(value)) !== -1, true, 'the revealed value is shown');
});

test('a third reveal on one lot is refused with the sim message', () => {
	const app = setup();
	const state = app.state;
	const lotId = state.auction.lots[0].lotId;
	const cashAfterTwo = state.cash - 2 * AUCTION_REVEAL_COST;
	drawOnce(app);
	tapReveal(app, 0);
	drawOnce(app);
	tapReveal(app, 1);
	eq(state.auction.lots[0].revealCount, 2, 'two reveals done');
	eq(state.cash, cashAfterTwo, 'two reveals charged');
	// What the sim says about a third reveal, read from the sim itself.
	const expected = simMsg(state, lotId, STATS[2]);
	drawOnce(app);
	tapReveal(app, 2);
	eq(app.toasts[app.toasts.length - 1], expected, 'the refusal was toasted');
	eq(state.auction.lots[0].revealed[STATS[2]], false, 'the third stat stayed hidden');
	eq(state.auction.lots[0].revealCount, 2, 'the allowance did not move');
	eq(state.cash, cashAfterTwo, 'no extra cash was taken');
	eq(hiddenCount(app), 2, 'two stats are still hidden');
});

test('a reveal with cash 100 is refused and changes nothing', () => {
	const app = setup();
	const state = app.state;
	const lotId = state.auction.lots[0].lotId;
	state.cash = 100;
	const expected = simMsg(state, lotId, STATS[0]);
	drawOnce(app);
	tapReveal(app, 0);
	eq(app.toasts[app.toasts.length - 1], expected, 'the sim message was toasted');
	eq(state.cash, 100, 'cash was not touched');
	eq(state.auction.lots[0].revealed[STATS[0]], false, 'the stat stayed hidden');
	eq(state.auction.lots[0].revealCount, 0, 'no reveal was counted');
	eq(hiddenCount(app), 4, 'all four stats are still hidden');
});

test('a revealed stat has no REVEAL hit and tapping its row does nothing', () => {
	const app = setup();
	const state = app.state;
	drawOnce(app);
	tapReveal(app, 0);
	const cashAfter = state.cash;
	const toastsAfter = app.toasts.length;
	drawOnce(app);
	tapReveal(app, 0);
	eq(state.cash, cashAfter, 'a revealed stat cannot be bought again');
	eq(state.auction.lots[0].revealCount, 1, 'the count did not move');
	eq(app.toasts.length, toastsAfter, 'no toast for a dead tap');
});

test('with no lots there are no stat rows and no reveal hits', () => {
	const app = setup();
	app.state.auction.lots = [];
	auctionScene.lotIndex = 0;
	auctionScene.enter(app, null);
	const ctx = makeCtx();
	auctionScene.draw(ctx, app, 0);
	const ts = texts(ctx);
	eq(hiddenCount(app), 0, 'no ??? rows with no lots');
	eq(ts.indexOf('STYLE'), -1, 'no stat names with no lots');
	// A tap where a reveal row would be finds no hit and changes nothing.
	const c = centre(LAYOUT.reveals[0]);
	tap(app, c[0], c[1]);
	eq(app.state.cash, 20000, 'nothing was spent');
	eq(app.toasts.length, 0, 'nothing was toasted');
});

test('a REVEAL pressed on one lot does not spend on another', () => {
	const app = setup();
	const state = app.state;
	drawOnce(app);
	const c = centre(LAYOUT.reveals[0]);
	// Press on lot 1, move the hall to lot 2, then release on the same spot.
	auctionScene.pointer(app, 'down', c[0], c[1]);
	auctionScene.key(app, 'ArrowRight');
	auctionScene.draw(makeCtx(), app, 0.5);
	auctionScene.pointer(app, 'up', c[0], c[1]);
	eq(state.cash, 20000, 'no cash was spent across the lot switch');
	eq(state.auction.lots[0].revealCount, 0, 'lot 1 was not revealed');
	eq(state.auction.lots[1].revealCount, 0, 'lot 2 was not revealed');
	eq(app.toasts.length, 0, 'nothing was toasted');
});

test('the picture wears the revealed condition once it is known', () => {
	const app = setup();
	const state = app.state;
	const lot = state.auction.lots[0];
	drawOnce(app);
	tapReveal(app, 3);
	eq(lot.revealed.condition, true, 'condition revealed');
	const ctx = makeCtx();
	auctionScene.draw(ctx, app, 0);
	const ts = texts(ctx);
	eq(ts.indexOf(String(lot.condition)) !== -1, true, 'the condition value is now shown');
});

done();
