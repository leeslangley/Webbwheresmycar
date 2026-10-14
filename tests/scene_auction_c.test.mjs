// Tests for the Auction hall bidding (card W65c), run under `jsc -m`.
// The Bid: line, the leader and the two bid buttons; a bid calls the sim
// directly and toasts its message. Every interaction follows the real
// sequence: draw, pointer down, a redraw with a different t, pointer up.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, texts, count } from './fakectx.js';
import { makeApp } from './fakeapp.js';
import { auctionScene, LAYOUT } from '../src/ui/scenes/auction.js';
import { startGame } from '../src/sim/newgame.js';
import { placeBid, minBid, bidStep } from '../src/sim/auction.js';
import { money } from '../src/core/format.js';

// A fresh game on auction day (day 24) whose AI ceilings are so low they can
// never answer a bid, so the player always leads, with cash to spare.
function setup() {
	const state = startGame(8);
	state.day = 24;
	for (let i = 0; i < state.auction.lots.length; i++) {
		state.auction.lots[i].ceilings = [1, 1, 1];
	}
	state.cash = 500000;
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

// Tap one of the bid buttons: which is 1 or 3.
function tapBid(app, which) {
	const c = centre(which === 1 ? LAYOUT.bid1 : LAYOUT.bid3);
	tap(app, c[0], c[1]);
}

test('BID +1 makes the player the leader and moves the Bid: text', () => {
	const app = setup();
	const state = app.state;
	const lot = state.auction.lots[0];
	const ctx0 = makeCtx();
	auctionScene.draw(ctx0, app, 0);
	const ts0 = texts(ctx0);
	eq(ts0.indexOf('Bid: none') !== -1, true, 'no bid yet');
	eq(ts0.indexOf('Nobody') !== -1, true, 'nobody leads yet');
	eq(ts0.indexOf('You') === -1, true, 'the player does not lead yet');
	drawOnce(app);
	tapBid(app, 1);
	eq(lot.leader, 'player', 'the player leads the lot');
	eq(lot.currentBid, lot.reserve, 'the bid is the first minimum');
	eq(state.cash, 500000, 'bidding costs nothing up front');
	const ctx1 = makeCtx();
	auctionScene.draw(ctx1, app, 0);
	const ts1 = texts(ctx1);
	eq(ts1.indexOf('Bid: ' + money(lot.currentBid)) !== -1, true, 'the Bid: text shows the new bid');
	eq(ts1.indexOf('Bid: none'), -1, 'the old Bid: none is gone');
	eq(ts1.indexOf('You') !== -1, true, 'the leader text is You');
	eq(ts1.indexOf('Min next ' + money(minBid(lot))) !== -1, true, 'the next minimum is shown');
});

test('BID +3 raises the bid by three steps and toasts the sim message', () => {
	const app = setup();
	const state = app.state;
	const lot = state.auction.lots[0];
	// What the sim will say, read from a throwaway copy before the real bid.
	const copy = JSON.parse(JSON.stringify(state));
	const expected = placeBid(copy, lot.lotId, 3).msg;
	drawOnce(app);
	tapBid(app, 3);
	const step = bidStep(lot);
	eq(lot.leader, 'player', 'the player leads the lot');
	eq(lot.currentBid, lot.reserve + 2 * step, 'the bid rose three steps from the reserve');
	eq(app.toasts[app.toasts.length - 1], expected, 'the sim message was toasted');
});

test('a bid with too little cash toasts the sim message and changes nothing', () => {
	const app = setup();
	const state = app.state;
	const lotId = state.auction.lots[0].lotId;
	state.cash = 10;
	const copy = JSON.parse(JSON.stringify(state));
	const expected = placeBid(copy, lotId, 1).msg;
	drawOnce(app);
	tapBid(app, 1);
	eq(app.toasts[app.toasts.length - 1], expected, 'the sim refusal was toasted');
	eq(state.cash, 10, 'no cash was taken');
	eq(state.auction.lots[0].leader, 'house', 'the leader did not change');
	eq(state.auction.lots[0].currentBid, 0, 'the bid did not move');
});

test('the crowd waves paddles only while the player leads', () => {
	const app = setup();
	const state = app.state;
	const lot = state.auction.lots[0];
	const ctx0 = makeCtx();
	auctionScene.draw(ctx0, app, 0);
	eq(count(ctx0, 'rotate'), 0, 'no paddles before the player leads');
	drawOnce(app);
	tapBid(app, 1);
	eq(lot.leader, 'player', 'the player now leads');
	const ctx1 = makeCtx();
	auctionScene.draw(ctx1, app, 0);
	ok(count(ctx1, 'rotate') > 0, 'paddles wave once the player leads');
	const ctx2 = makeCtx();
	auctionScene.draw(ctx2, app, 1.25);
	ok(count(ctx2, 'rotate') > 0, 'the paddles are still there at another t');
});

done();
