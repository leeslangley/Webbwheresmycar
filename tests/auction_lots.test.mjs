// Tests for auction lot generation and stat reveals, run under `jsc -m`.

import { newGameState } from '../src/core/state.js';
import { prepareAuction, lotView, revealStat, AUCTION_REVEAL_COST, STATS } from '../src/sim/auction.js';
import { test, eq, ok, done } from './harness.js';

const REVEAL_COST = 150;

// Condition with at most one decimal place (float-safe check).
function oneDecimal(c) {
	return Math.abs(c * 10 - Math.round(c * 10)) < 1e-9;
}

// A whole month of lots must meet every rule on the card.
function checkLots(state, label) {
	const lots = state.auction.lots;
	ok(lots.length === 6, label + ': 6 lots');
	const lotIds = {};
	const modelIds = {};
	for (let i = 0; i < lots.length; i++) {
		const lot = lots[i];
		ok(!lotIds[lot.lotId], label + ': unique lotIds');
		lotIds[lot.lotId] = true;
		ok(!modelIds[lot.modelId], label + ': unique modelIds');
		modelIds[lot.modelId] = true;
		ok(lot.lotId.charAt(0) === 'A', label + ': lotId starts with A');
		ok(lot.condition >= 2.0 && lot.condition <= 9.0 && oneDecimal(lot.condition), label + ': condition 2.0-9.0, 1 decimal');
		ok(lot.reserve > 0 && Math.abs(lot.reserve / 10 - Math.round(lot.reserve / 10)) < 1e-9, label + ': reserve positive multiple of 10');
		ok(lot.revealCount === 0, label + ': revealCount starts at 0');
		eq(lot.currentBid, 0, label + ': currentBid starts at 0');
		eq(lot.leader, 'house', label + ': leader starts house');
		eq(lot.revealed, { desirability: false, maintenance: false, reliability: false, condition: false }, label + ': all stats hidden');
		ok(Array.isArray(lot.ceilings) && lot.ceilings.length === 3, label + ': three ceilings');
		for (let j = 0; j < 3; j++) {
			ok(Number.isInteger(lot.ceilings[j]) && lot.ceilings[j] > 0, label + ': ceiling is a positive integer');
		}
		// estLow < estHigh on the player-facing view.
		const view = lotView(state, lot.lotId);
		ok(view.estLow < view.estHigh, label + ': estLow < estHigh');
		// The view must not leak hidden facts.
		ok(!('ceilings' in view), label + ': view has no ceilings key');
		ok(!('condition' in view.values), label + ': view has no values.condition before reveal');
		ok(!('ceilings' in JSON.parse(JSON.stringify(view))), label + ': no ceilings even through JSON');
	}
	return lots;
}

test('prepareAuction makes valid lots over seeds 1..30', () => {
	for (let seed = 1; seed <= 30; seed++) {
		const state = newGameState(seed);
		prepareAuction(state);
		checkLots(state, 'seed ' + seed);
	}
});

test('prepareAuction sets month, clears results, keeps consigned', () => {
	const state = newGameState(7);
	state.day = 100; // 10 April: month 4
	state.auction.consigned = [{ carId: 3, reserve: 5000 }];
	prepareAuction(state);
	eq(state.auction.month, 4, 'month from dateOf(state.day)');
	ok(state.auction.lots.length === 6, 'lots generated');
	eq(state.auction.lastResults, [], 'lastResults cleared');
	eq(state.auction.consigned, [{ carId: 3, reserve: 5000 }], 'consigned kept');
});

test('lotView is null for a missing lot', () => {
	const state = newGameState(1);
	prepareAuction(state);
	eq(lotView(state, 'A99999'), null, 'unknown lotId -> null');
	eq(lotView(state, 'nonsense'), null, 'junk lotId -> null');
	eq(lotView(state, undefined), null, 'undefined lotId -> null');
});

test('revealStat condition: cash drops 150, condition appears in values', () => {
	const state = newGameState(3);
	prepareAuction(state);
	const lot = state.auction.lots[0];
	const cashBefore = state.cash;
	const view = lotView(state, lot.lotId);
	ok(!('condition' in view.values), 'condition hidden before reveal');
	const res = revealStat(state, lot.lotId, 'condition');
	eq(res.ok, true, 'reveal succeeds');
	eq(state.cash, cashBefore - REVEAL_COST, 'cash drops by exactly 150');
	const after = lotView(state, lot.lotId);
	eq(after.values.condition, lot.condition, 'view values.condition equals lot condition');
	eq(after.revealed.condition, true, 'revealed.condition true');
	eq(after.revealCount, 1, 'revealCount is 1');
	eq(AUCTION_REVEAL_COST, 150, 'AUCTION_REVEAL_COST is 150');
});

test('third reveal refused, cash unchanged', () => {
	const state = newGameState(5);
	prepareAuction(state);
	const lot = state.auction.lots[0];
	eq(revealStat(state, lot.lotId, 'desirability').ok, true, 'first reveal ok');
	eq(revealStat(state, lot.lotId, 'maintenance').ok, true, 'second reveal ok');
	const cash = state.cash;
	const res = revealStat(state, lot.lotId, 'reliability');
	eq(res.ok, false, 'third reveal refused');
	ok(res.msg === 'Max 2 reveals per lot.', 'max-reveals message: ' + res.msg);
	eq(state.cash, cash, 'cash unchanged after refusal');
});

test('repeated reveal of the same stat refused, cash unchanged', () => {
	const state = newGameState(6);
	prepareAuction(state);
	const lot = state.auction.lots[1];
	eq(revealStat(state, lot.lotId, 'desirability').ok, true, 'first reveal ok');
	const cash = state.cash;
	const res = revealStat(state, lot.lotId, 'desirability');
	eq(res.ok, false, 'repeat reveal refused');
	eq(state.cash, cash, 'cash unchanged');
});

test('invalid stat refused, cash unchanged', () => {
	const state = newGameState(8);
	prepareAuction(state);
	const lot = state.auction.lots[2];
	const cash = state.cash;
	for (const bad of ['colour', 'condition ', 'Condition', 'desirable', '', null, undefined, 3]) {
		eq(revealStat(state, lot.lotId, bad).ok, false, 'invalid stat refused: ' + String(bad));
	}
	eq(state.cash, cash, 'cash unchanged by invalid stats');
});

test('missing lot refused', () => {
	const state = newGameState(9);
	prepareAuction(state);
	const cash = state.cash;
	eq(revealStat(state, 'A99999', 'condition').ok, false, 'unknown lot refused');
	eq(state.cash, cash, 'cash unchanged');
});

test('reveal refused when cash is short', () => {
	const state = newGameState(10);
	prepareAuction(state);
	const lot = state.auction.lots[3];
	state.cash = 100;
	const res = revealStat(state, lot.lotId, 'condition');
	eq(res.ok, false, 'cash 100 refused');
	eq(state.cash, 100, 'cash still 100');
	eq(lot.revealCount, 0, 'revealCount still 0');
});

test('revealed stats show in values only when paid for', () => {
	const state = newGameState(11);
	prepareAuction(state);
	const lot = state.auction.lots[4];
	eq(revealStat(state, lot.lotId, 'desirability').ok, true, 'reveal desirability');
	eq(revealStat(state, lot.lotId, 'reliability').ok, true, 'reveal reliability');
	const view = lotView(state, lot.lotId);
	ok('desirability' in view.values, 'desirability present');
	ok('reliability' in view.values, 'reliability present');
	ok(!('maintenance' in view.values), 'maintenance still hidden');
	ok(!('condition' in view.values), 'condition still hidden');
	eq(view.revealCount, 2, 'revealCount is 2');
});

test('STATS holds exactly the four revealable stats', () => {
	eq(STATS, ['desirability', 'maintenance', 'reliability', 'condition'], 'STATS contents');
});

test('two states with the same seed produce identical lots', () => {
	const a = newGameState(13);
	const b = newGameState(13);
	prepareAuction(a);
	prepareAuction(b);
	eq(JSON.stringify(a.auction.lots), JSON.stringify(b.auction.lots), 'identical lots');
	const viewsA = a.auction.lots.map(l => lotView(a, l.lotId));
	const viewsB = b.auction.lots.map(l => lotView(b, l.lotId));
	eq(JSON.stringify(viewsA), JSON.stringify(viewsB), 'identical views');
});

test('different seeds give different lots', () => {
	const a = newGameState(1);
	const b = newGameState(2);
	prepareAuction(a);
	prepareAuction(b);
	ok(JSON.stringify(a.auction.lots) !== JSON.stringify(b.auction.lots), 'seeds differ, lots differ');
});

done();
