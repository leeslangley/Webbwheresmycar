// Monthly auction: lot generation and paid stat reveals (DESIGN.md section
// 4.10). Six lots are prepared at month-end; their condition, ceilings and
// unrevealed stats stay hidden until the player pays to look. Bidding,
// consigning and the auction-day visit are handled elsewhere (card W38).
// Pure sim module: randomness only through state.rng, no DOM, no dates.

import { rand, weighted, pick, roundTo } from '../core/rng.js';
import { dateOf, isAuctionDay } from '../core/clock.js';
import { money } from '../core/format.js';
import { CARS, CAR_BY_ID } from '../data/cars.js';
import { marketValue } from './carstats.js';
import { advanceDay } from './advance.js';

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

// Find a stable car by its id, or null.
function findCar(state, carId) {
	for (let i = 0; i < state.cars.length; i++) {
		if (state.cars[i].id === carId) {
			return state.cars[i];
		}
	}
	return null;
}

// Take a car out of the stable. Returns true if it was there.
function removeCar(state, carId) {
	for (let i = 0; i < state.cars.length; i++) {
		if (state.cars[i].id === carId) {
			state.cars.splice(i, 1);
			return true;
		}
	}
	return false;
}

// consignCar(state, carId, reserve): put one of your own cars into the
// coming auction. Costs no day, and must happen before auction day.
export function consignCar(state, carId, reserve) {
	if (isAuctionDay(state.day)) {
		return { ok: false, msg: 'Too late: it is auction day.' };
	}
	const car = findCar(state, carId);
	if (!car) {
		return { ok: false, msg: 'No such car in the garage.' };
	}
	if (!car.owned) {
		return { ok: false, msg: 'You cannot consign a car you only rent.' };
	}
	for (let i = 0; i < state.auction.consigned.length; i++) {
		if (state.auction.consigned[i].carId === carId) {
			return { ok: false, msg: 'That car is already consigned.' };
		}
	}
	if (typeof reserve !== 'number' || !isFinite(reserve) || reserve % 1 !== 0 || reserve < 0) {
		return { ok: false, msg: 'The reserve must be a whole amount of £0 or more.' };
	}
	state.auction.consigned.push({ carId: carId, reserve: reserve });
	return { ok: true, msg: 'Consigned the ' + CAR_BY_ID[car.modelId].name + ' with a reserve of ' + money(reserve) + '.' };
}

// unconsign(state, carId): take a consigned car back out. Costs no day.
export function unconsign(state, carId) {
	for (let i = 0; i < state.auction.consigned.length; i++) {
		if (state.auction.consigned[i].carId === carId) {
			state.auction.consigned.splice(i, 1);
			return { ok: true, msg: 'The car is out of the auction.' };
		}
	}
	return { ok: false, msg: 'That car is not consigned.' };
}

// One bid increment: 5% of the reserve, at least £50, rounded to £10.
export function bidStep(lot) {
	return Math.max(50, roundTo(lot.reserve * 0.05, 10));
}

// The smallest bid that makes sense for a lot right now.
export function minBid(lot) {
	return lot.currentBid === 0 ? lot.reserve : lot.currentBid + bidStep(lot);
}

// placeBid(state, lotId, steps): bid one or three steps up on a lot. The
// three AI bidders answer at once: if the keenest ceiling can still top
// you, they do, otherwise you lead. Costs no day; you pay only if you
// win, at the auction visit.
export function placeBid(state, lotId, steps) {
	if (!isAuctionDay(state.day)) {
		return { ok: false, msg: 'Bidding only happens on auction day.' };
	}
	if (steps !== 1 && steps !== 3) {
		return { ok: false, msg: 'Bid one step or three steps.' };
	}
	const lot = findLot(state, lotId);
	if (!lot) {
		return { ok: false, msg: 'No such lot.' };
	}
	if (lot.leader === 'player') {
		return { ok: false, msg: 'You are already winning' };
	}
	const step = bidStep(lot);
	const bid = minBid(lot) + (steps - 1) * step;
	if (state.cash < bid) {
		return { ok: false, msg: 'Not enough cash for that bid.' };
	}
	let leading = 0;
	for (let i = 0; i < state.auction.lots.length; i++) {
		if (state.auction.lots[i].leader === 'player') {
			leading++;
		}
	}
	if (state.cars.length + leading >= state.garageSlots) {
		return { ok: false, msg: 'No free garage slot to win another car.' };
	}
	const best = Math.max.apply(null, lot.ceilings);
	if (best >= bid + step) {
		lot.currentBid = bid + step;
		lot.leader = 'ai';
		return { ok: true, msg: 'Outbid! The bid is now ' + money(lot.currentBid) + '.', outbid: true };
	}
	lot.currentBid = bid;
	lot.leader = 'player';
	return { ok: true, msg: 'You lead at ' + money(bid) + '.', outbid: false };
}

// attendAuction(state): the auction-day visit. Settles everything in one
// go -- consigned cars under the hammer, then lots you lead -- and costs
// the day. Returns {ok, msg, results}.
export function attendAuction(state) {
	if (!isAuctionDay(state.day)) {
		return { ok: false, msg: 'The auction is only on day 24 of the month.' };
	}
	if (state.auction.attendedDay === state.day) {
		return { ok: false, msg: 'You have already been to this auction.' };
	}
	const results = [];

	// (1) your own consigned cars go under the hammer first.
	const consigned = state.auction.consigned.slice();
	for (let i = 0; i < consigned.length; i++) {
		const entry = consigned[i];
		const at = state.auction.consigned.indexOf(entry);
		if (at !== -1) {
			state.auction.consigned.splice(at, 1);
		}
		const car = findCar(state, entry.carId);
		if (!car) {
			continue;
		}
		const model = CAR_BY_ID[car.modelId];
		const price = Math.round(marketValue(state, model, car) * (0.85 + 0.40 * rand(state)));
		if (price >= entry.reserve) {
			const fee = Math.round(price * 0.08);
			state.cash += price - fee;
			removeCar(state, entry.carId);
			state.stats.carsSold++;
			state.stats.bestAuctionSale = Math.max(state.stats.bestAuctionSale, price);
			results.push('Sold the ' + model.name + ' for ' + money(price) + ' (fee ' + money(fee) + ')');
		} else {
			results.push('The ' + model.name + ' failed to meet its reserve');
		}
	}

	// (2) lots you lead: pay up or lose face.
	const lots = state.auction.lots;
	for (let i = 0; i < lots.length; i++) {
		const lot = lots[i];
		if (lot.leader !== 'player') {
			continue;
		}
		const model = CAR_BY_ID[lot.modelId];
		if (state.cash >= lot.currentBid && state.cars.length < state.garageSlots) {
			state.cash -= lot.currentBid;
			state.cars.push({
				id: 'c' + state.nextId++,
				modelId: lot.modelId,
				owned: true,
				owner: null,
				rentMonthly: 0,
				paid: lot.currentBid,
				condition: lot.condition,
				fault: null,
				lastServiceDay: state.day,
				jobsDone: 0,
				boughtDay: state.day,
				impoundedUntil: 0,
				rentedAtCondition: null,
			});
			state.stats.carsBought++;
			results.push('You won the ' + model.name + ' for ' + money(lot.currentBid) + '.');
		} else {
			state.reputation = Math.max(0, state.reputation - 2);
			results.push('You could not pay for the ' + model.name + '.');
		}
	}

	// (3) tidy up: the lots go home, the results go in the paper.
	state.auction.lots = [];
	state.auction.lastResults = results;
	for (let i = 0; i < results.length; i++) {
		state.pending.push(results[i]);
	}
	state.auction.attendedDay = state.day;
	const msg = results.length > 0 ? results.join(' ') : 'The gavel fell on nothing at all.';
	advanceDay(state);
	return { ok: true, msg: msg, results: results };
}
