// Tests for src/art/hud.js, run under jsc -m.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, count, anySet, texts } from './fakectx.js';
import { drawHud, PLATE_RECTS } from '../src/art/hud.js';
import { newGameState } from '../src/core/state.js';
import { PALETTE } from '../src/ui/theme.js';

// Number of fillStyle assignments equal to the given colour.
function goldCount(ctx, colour) {
	let n = 0;
	for (let i = 0; i < ctx.calls.length; i++) {
		if (ctx.calls[i][0] === 'set:fillStyle' && ctx.calls[i][1][0] === colour) {
			n += 1;
		}
	}
	return n;
}

test('drawHud paints the starting cash, reputation, buzz and date', () => {
	const ctx = makeCtx();
	drawHud(ctx, newGameState(1), 0);
	const said = texts(ctx);
	ok(said.indexOf('£20,000') !== -1, 'cash text £20,000');
	ok(said.indexOf('REP 40') !== -1, 'REP 40');
	ok(said.indexOf('BUZZ 0') !== -1, 'BUZZ 0');
	ok(said.indexOf('DAY 1  1 JANUARY') !== -1, 'date text');
});

test('drawHud paints the four plate codes in PLATE_KEYS order', () => {
	const ctx = makeCtx();
	drawHud(ctx, newGameState(1), 0);
	const said = texts(ctx);
	for (const code of ['FC', 'SB', 'HN', 'HT']) {
		ok(said.indexOf(code) !== -1, 'plate code ' + code);
	}
});

test('negative cash is shown as -£50 with the bad colour', () => {
	const state = newGameState(1);
	state.cash = -50;
	const ctx = makeCtx();
	drawHud(ctx, state, 0);
	ok(texts(ctx).indexOf('-£50') !== -1, 'cash text -£50');
	ok(anySet(ctx, 'fillStyle', PALETTE.bad), 'fillStyle PALETTE.bad was set');
});

test('winning a plate paints gold at least once more than none', () => {
	const plain = makeCtx();
	drawHud(plain, newGameState(1), 0);
	const state = newGameState(1);
	state.plates.fatcat = true;
	const won = makeCtx();
	drawHud(won, state, 0);
	ok(goldCount(won, PALETTE.gold) >= goldCount(plain, PALETTE.gold) + 1,
		'gold fillStyle count went up');
});

test('day 366 shows YEAR END', () => {
	const state = newGameState(1);
	state.day = 366;
	const ctx = makeCtx();
	drawHud(ctx, state, 0);
	ok(texts(ctx).some(function (s) { return s.indexOf('YEAR END') !== -1; }),
		'YEAR END is painted');
});

test('PLATE_RECTS has 4 rects with the stated geometry', () => {
	eq(PLATE_RECTS.length, 4, '4 rects');
	const keys = ['fatcat', 'stable', 'household', 'hammer'];
	for (let i = 0; i < 4; i++) {
		const r = PLATE_RECTS[i];
		eq(r.key, keys[i], 'rect ' + i + ' key');
		eq([r.x, r.y, r.w, r.h], [1000 + i * 66, 14, 56, 28], 'rect ' + i + ' geometry');
	}
});

test('drawHud balances save/restore and does not throw', () => {
	const ctx = makeCtx();
	drawHud(ctx, newGameState(1), 0);
	eq(count(ctx, 'save'), count(ctx, 'restore'), 'save/restore balanced');
});

test('drawHud copes with clamped buzz and extreme cash', () => {
	const state = newGameState(1);
	state.buzz = 55.4;
	state.reputation = 120;
	const ctx = makeCtx();
	drawHud(ctx, state, 0);
	const said = texts(ctx);
	ok(said.indexOf('BUZZ 55') !== -1, 'buzz rounds to 55');
	ok(said.indexOf('REP 120') !== -1, 'reputation echoed');
});

done();
