// Monthly auction: lot generation and paid stat reveals (DESIGN.md section
// 4.10). Six lots are prepared at month-end; their condition, ceilings and
// unrevealed stats stay hidden until the player pays to look. Bidding,
// consigning and the auction-day visit are handled elsewhere (card W38).
// Pure sim module: randomness only through state.rng, no DOM, no dates.

import { rand, weighted, pick, roundTo } from '../core/rng.js';
import { dateOf } from '../core/clock.js';
import { CARS, CAR_BY_ID } from '../data/cars.js';
import { marketValue } from './carstats.js';

// Cost of one paid stat reveal, and the stats it can uncover.
export const AUCTION_REVEAL_COST = 150;

export const STATS = ['desirability', 'maintenance', 'reliability', 'condition'];

// Lot ids are 'A' plus the running id, like shop listings use 'L'.
function findLot(state, lotId) {
	const lots = state.auction.lots;
	for (let i = 0; i < lots.length; i++) {
		if (lots[i].lotId === lotId) {
			return lots[i];
		}
	}
	return null;
}

// Build one auction lot, drawing in order: tier, model, condition, then
// the three bidder ceilings. No two lots in a month share a model.
function makeLot(state, excludeModelIds) {
	const tier = weighted(state, [
		{ tier: 1, w: 40 },
		{ tier: 2, w: 40 },
		{ tier: 3, w: 20 },
	]).tier;
	const tierModels = [];
	for (let i = 0; i < CARS.length; i++) {
		if (CARS[i].tier === tier && excludeModelIds.indexOf(CARS[i].id) === -1) {
			tierModels.push(CARS[i]);
		}
	}
	const model = pick(state, tierModels);
	const condition = roundTo(2 + 7 * rand(state), 0.1);
	const value = marketValue(state, model, { condition: condition });
	const ceilings = [];
	for (let i = 0; i < 3; i++) {
		ceilings.push(Math.round(value * (0.70 + 0.50 * rand(state))));
	}
	excludeModelIds.push(model.id);
	return {
		lotId: 'A' + state.nextId++,
		modelId: model.id,
		condition: condition,
		reserve: roundTo(value * 0.7, 10),
		revealCount: 0,
		revealed: { desirability: false, maintenance: false, reliability: false, condition: false },
		currentBid: 0,
		leader: 'house',
		ceilings: ceilings,
	};
}

// Prepare the auction for the coming auction day. Keeps any consigned
// cars; replaces lots and results. Mutates state, returns nothing.
export function prepareAuction(state) {
	state.auction.month = dateOf(state.day).month;
	state.auction.lastResults = [];
	const lots = [];
	const excludeModelIds = [];
	for (let i = 0; i < 6; i++) {
		lots.push(makeLot(state, excludeModelIds));
	}
	state.auction.lots = lots;
}

// The safe, player-facing view of a lot: model details and an estimate
// based on a notional condition 5.0, plus only the stats already paid
// for. Never exposes ceilings, and condition only once revealed.
export function lotView(state, lotId) {
	const lot = findLot(state, lotId);
	if (!lot) {
		return null;
	}
	const model = CAR_BY_ID[lot.modelId];
	const est = marketValue(state, model, { condition: 5.0 });
	const values = {};
	if (lot.revealed.desirability) {
		values.desirability = model.desirability;
	}
	if (lot.revealed.maintenance) {
		values.maintenance = model.maintenance;
	}
	if (lot.revealed.reliability) {
		values.reliability = model.reliability;
	}
	if (lot.revealed.condition) {
		values.condition = lot.condition;
	}
	return {
		lotId: lot.lotId,
		modelId: lot.modelId,
		name: model.name,
		year: model.year,
		archetype: model.archetype,
		estLow: roundTo(est * 0.65, 10),
		estHigh: roundTo(est * 1.35, 10),
		revealed: {
			desirability: lot.revealed.desirability,
			maintenance: lot.revealed.maintenance,
			reliability: lot.revealed.reliability,
			condition: lot.revealed.condition,
		},
		values: values,
		reserve: lot.reserve,
		currentBid: lot.currentBid,
		leader: lot.leader,
		revealCount: lot.revealCount,
	};
}

// Pay to reveal one hidden stat of a lot. Costs no day; at most two
// reveals per lot. Returns {ok, msg}; on ok:false nothing changes.
export function revealStat(state, lotId, stat) {
	const lot = findLot(state, lotId);
	if (!lot) {
		return { ok: false, msg: 'No such lot.' };
	}
	if (STATS.indexOf(stat) === -1) {
		return { ok: false, msg: 'That is not a stat you can reveal.' };
	}
	if (lot.revealed[stat]) {
		return { ok: false, msg: 'Already revealed that one.' };
	}
	if (lot.revealCount >= 2) {
		return { ok: false, msg: 'Max 2 reveals per lot.' };
	}
	if (state.cash < AUCTION_REVEAL_COST) {
		return { ok: false, msg: 'Not enough cash for a peek.' };
	}
	state.cash -= AUCTION_REVEAL_COST;
	lot.revealed[stat] = true;
	lot.revealCount++;
	return { ok: true, msg: 'Stat revealed.' };
}
