// Tests for the end screen drawing (card W66a), run under `jsc -m`. W66b owns
// tapping the two buttons; here we only prove the layout, the texts for each
// reason and the pure-drawing contract.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, texts, anySet } from './fakectx.js';
import { makeApp } from './fakeapp.js';
import { endgameScene, LAYOUT } from '../src/ui/scenes/endgame.js';
import { finalScore, rankOf, netWorth, PLATE_INFO } from '../src/sim/endgame.js';
import { PALETTE } from '../src/ui/theme.js';
import { money } from '../src/core/format.js';
import { PLATE_KEYS } from '../src/core/state.js';
import { startGame } from '../src/sim/newgame.js';

// A fresh game with the card's cash figure, entered into the end screen.
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
	return app;
}

function drawOnce(app, t) {
	const ctx = makeCtx();
	endgameScene.draw(ctx, app, t === undefined ? 0 : t);
	return ctx;
}

// The first text that starts with the given prefix, or null.
function staff(got, prefix) {
	for (let i = 0; i < got.length; i++) {
		if (got[i].indexOf(prefix) === 0) return got[i];
	}
	return null;
}

test('a won game shows the gold heading and a GOLD rank', () => {
	const app = endApp({ won: true, reason: 'won', plates: 'all' });
	const got = texts(drawOnce(app, 0));
	ok(got.indexOf('GOLD! MARK\'S A LEGEND') !== -1, 'won heading drawn');
	const rank = staff(got, 'Rank:');
	ok(rank !== null, 'a rank line is drawn');
	ok(rank.indexOf('Rank: GOLD ') === 0, 'the rank line starts with GOLD');
	ok(rank === 'Rank: GOLD ' + rankOf(finalScore(app.state)), 'the rank matches rankOf(score)');
});

test('a won game draws WON in gold four times', () => {
	const app = endApp({ won: true, reason: 'won', plates: 'all' });
	const ctx = drawOnce(app, 0);
	const got = texts(ctx);
	let wonCount = 0;
	for (let i = 0; i < got.length; i++) {
		if (got[i] === 'WON') wonCount += 1;
	}
	eq(wonCount, PLATE_KEYS.length, 'every plate reads WON');
	ok(anySet(ctx, 'fillStyle', PALETTE.gold), 'gold was used');
});

test("a year-end game shows THE YEAR IS UP", () => {
	const app = endApp({ won: false, reason: 'year-end' });
	const got = texts(drawOnce(app, 0));
	ok(got.indexOf('THE YEAR IS UP') !== -1, 'year-end heading drawn');
	ok(got.indexOf('The bank manager is smiling politely.') !== -1, 'year-end subline drawn');
});

test('a bankrupt game shows BANKRUPT! THE BAILIFFS ARRIVE', () => {
	const app = endApp({ won: false, reason: 'bankrupt' });
	const got = texts(drawOnce(app, 0));
	ok(got.indexOf('BANKRUPT! THE BAILIFFS ARRIVE') !== -1, 'bankrupt heading drawn');
	ok(got.indexOf('Dave takes the kettle. Mark takes the bus.') !== -1, 'bankrupt subline drawn');
});

test('an unknown reason falls back to GAME OVER and still draws', () => {
	const app = endApp({ won: false, reason: '' });
	const got = texts(drawOnce(app, 0));
	ok(got.indexOf('GAME OVER') !== -1, 'fallback heading drawn');
	ok(staff(got, 'Rank: ') !== null, 'the rank line is still drawn');
});

test('every plate a lost game missed reads missed in grey', () => {
	const app = endApp({ won: false, reason: 'year-end' });
	const ctx = drawOnce(app, 0);
	const got = texts(ctx);
	let missed = 0;
	for (let i = 0; i < got.length; i++) {
		if (got[i] === 'missed') missed += 1;
	}
	eq(missed, PLATE_KEYS.length, 'every plate reads missed');
	ok(anySet(ctx, 'fillStyle', PALETTE.lightgrey), 'grey was used for missed');
	for (let i = 0; i < PLATE_KEYS.length; i++) {
		ok(got.indexOf(PLATE_INFO[PLATE_KEYS[i]].name) !== -1, 'plate name drawn: ' + PLATE_KEYS[i]);
	}
	ok(got.indexOf('Rank: ' + rankOf(finalScore(app.state))) !== -1, 'a lost game has no GOLD prefix');
});

test('the score block figures come from the state', () => {
	const app = endApp({ won: false, reason: 'year-end' });
	const state = app.state;
	const got = texts(drawOnce(app, 0));
	ok(got.indexOf('Final score ' + finalScore(state)) !== -1, 'finalScore drawn');
	ok(got.indexOf('Rank: ' + rankOf(finalScore(state))) !== -1, 'rankOf drawn');
	ok(got.indexOf('Net worth ' + money(netWorth(state))) !== -1, 'net worth drawn');
	ok(got.indexOf('Reputation ' + state.reputation) !== -1, 'reputation drawn');
	ok(got.indexOf('Jobs done ' + state.stats.jobsDone) !== -1, 'jobs done drawn');
	ok(got.indexOf('Best auction sale ' + money(state.stats.bestAuctionSale)) !== -1, 'best auction sale drawn');
});

test('the two buttons are drawn at the LAYOUT rectangles', () => {
	const app = endApp({ won: false, reason: 'year-end' });
	const got = texts(drawOnce(app, 0));
	ok(got.indexOf('PLAY AGAIN') !== -1, 'PLAY AGAIN drawn');
	ok(got.indexOf('TITLE') !== -1, 'TITLE drawn');
	eq(LAYOUT.again, { x: 340, y: 610, w: 280, h: 60 }, 'again rectangle');
	eq(LAYOUT.title, { x: 660, y: 610, w: 280, h: 60 }, 'title rectangle');
});

test('drawing at several t values never throws and never touches the state', () => {
	const app = endApp({ won: true, reason: 'won', plates: 'all' });
	const before = JSON.stringify(app.state);
	for (const t of [0, 0.5, 1, 7]) {
		drawOnce(app, t);
	}
	eq(JSON.stringify(app.state), before, 'app.state is unchanged by drawing');
});

test('a tap on either button fires its handler (W66b)', () => {
	const app = endApp({ won: false, reason: 'year-end' });
	drawOnce(app, 0);
	// Down, a redraw with another t, then up: the tap rule remembers the hit's
	// id across the redraw and fires it on release.
	endgameScene.pointer(app, 'down', LAYOUT.again.x + 10, LAYOUT.again.y + 10);
	drawOnce(app, 0.5);
	endgameScene.pointer(app, 'up', LAYOUT.again.x + 10, LAYOUT.again.y + 10);
	eq(app.calls, [['newGame']], 'PLAY AGAIN starts a new game');
	eq(app.toasts, [], 'no toast happened');
});

test('draw survives a state with no flags at all', () => {
	const app = endApp({ won: false, reason: 'year-end' });
	delete app.state.flags;
	const got = texts(drawOnce(app, 0));
	ok(got.indexOf('GAME OVER') !== -1, 'fallback heading drawn without flags');
});

done();
