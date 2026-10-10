// Playbot balance report (card W41): a measuring tool, not a tuning one.
// Runs two bot policies over seeds 1..100 and prints a fixed 17-line
// report block per policy, so the numbers can drive later tuning of
// prices and odds. Run under macOS `jsc -m`: no console, use print().

import { startGame } from '../src/sim/newgame.js';
import { isAuctionDay } from '../src/core/clock.js';
import { modelOf } from '../src/data/cars.js';
import { effD, effR, isAvailable } from '../src/sim/carstats.js';
import { attendAuction } from '../src/sim/auction.js';
import { buyCar, waitDay } from '../src/sim/actions.js';
import { fixFault, serviceCar } from '../src/sim/garage.js';
import { acceptJob } from '../src/sim/jobresolve.js';
import { advertise } from '../src/sim/adsim.js';
import { netWorth } from '../src/sim/endgame.js';

const MAX_ACTIONS = 400;
const SEED_COUNT = 100;

// Try one action; if it is refused (ok:false, nothing changed, no day
// passed) fall back to waitDay, which costs the day instead.
function actOrWait(state, attempt) {
	const r = attempt();
	if (r.ok) {
		return r;
	}
	return waitDay(state);
}

// naiveBot: a verbatim copy of the policy in tests/playthrough.test.mjs.
function naiveBot(state) {
	if (state.flags.gameOver) {
		return null;
	}

	// (2) auction day: settle the whole visit in one action.
	if (isAuctionDay(state.day)) {
		return actOrWait(state, () => attendAuction(state));
	}

	// (3) no cars at all: buy the cheapest sale listing we can afford.
	if (state.cars.length === 0) {
		const listings = state.shop.listings;
		let best = null;
		for (let i = 0; i < listings.length; i++) {
			const l = listings[i];
			if (l.mode === 'sale' && l.price <= state.cash && (best === null || l.price < best.price)) {
				best = l;
			}
		}
		if (best === null) {
			return waitDay(state);
		}
		const listingId = best.listingId;
		return actOrWait(state, () => buyCar(state, listingId));
	}

	// (4) a faulty car we can afford to fix: fix it.
	for (let i = 0; i < state.cars.length; i++) {
		const car = state.cars[i];
		if (car.fault && state.cash >= car.fault.cost) {
			const carId = car.id;
			return actOrWait(state, () => fixFault(state, carId));
		}
	}

	// (5) the highest-fee open booking some available car can legally take.
	let bestReq = null;
	let bestCar = null;
	for (let i = 0; i < state.requests.length; i++) {
		const req = state.requests[i];
		if (req.expiresDay < state.day) {
			continue;
		}
		for (let j = 0; j < state.cars.length; j++) {
			const car = state.cars[j];
			if (!isAvailable(state, car)) {
				continue;
			}
			const model = modelOf(car.modelId);
			if (effD(model, car) >= req.minDesirability &&
				effR(model, car) >= req.minReliability &&
				car.condition >= req.minCondition) {
				if (bestReq === null || req.fee > bestReq.fee) {
					bestReq = req;
					bestCar = car;
				}
				break;
			}
		}
	}
	if (bestReq !== null) {
		const requestId = bestReq.id;
		const carId = bestCar.id;
		return actOrWait(state, () => acceptJob(state, requestId, carId));
	}

	// (6) money to burn and no hype: take out a magazine ad.
	if (state.cash > 6000 && state.buzz < 20) {
		return actOrWait(state, () => advertise(state, 'magazine'));
	}

	// (7) a shabby car and the cash for a full service.
	for (let i = 0; i < state.cars.length; i++) {
		const car = state.cars[i];
		if (car.condition < 4 && state.cash > 400) {
			const carId = car.id;
			return actOrWait(state, () => serviceCar(state, carId, 'full'));
		}
	}

	// (8) nothing worth doing: the kettle goes on.
	return waitDay(state);
}

// Score a sale listing (or stable car) by its effective stats, using the
// object itself as the car argument: both carry a `condition`.
function scoreOf(modelId, car) {
	const model = modelOf(modelId);
	return effD(model, car) + effR(model, car);
}

// The cheapest-cost check every buy in smartBot shares: keep a cushion
// behind, and a free slot for the car to sit in.
function canBuy(state, listing, cushion) {
	return listing.mode === 'sale' && listing.price <= state.cash - cushion &&
		state.cars.length < state.garageSlots;
}

// smartBot: a tidier policy, checked in this exact order.
function smartBot(state) {
	if (state.flags.gameOver) {
		return null;
	}

	// (1) auction day: settle the whole visit in one action.
	if (isAuctionDay(state.day)) {
		return actOrWait(state, () => attendAuction(state));
	}

	// (2) empty stable: buy the affordable listing with the best score.
	if (state.cars.length === 0) {
		let best = null;
		for (let i = 0; i < state.shop.listings.length; i++) {
			const l = state.shop.listings[i];
			if (!canBuy(state, l, 1500)) {
				continue;
			}
			const score = scoreOf(l.modelId, l);
			if (best === null || score > best.score || (score === best.score && l.price < best.listing.price)) {
				best = { listing: l, score: score };
			}
		}
		if (best === null) {
			return waitDay(state);
		}
		const listingId = best.listing.listingId;
		return actOrWait(state, () => buyCar(state, listingId));
	}

	// (3) a faulty car with a cash cushion behind the fix: fix it.
	for (let i = 0; i < state.cars.length; i++) {
		const car = state.cars[i];
		if (car.fault && state.cash >= car.fault.cost + 300) {
			const carId = car.id;
			return actOrWait(state, () => fixFault(state, carId));
		}
	}

	// Which open bookings can an available car actually take? Shared by
	// the service check (4) and the job check (5).
	const bestJobs = bestAcceptableJobs(state);
	let bestReq = null;
	let bestCar = null;
	for (let i = 0; i < bestJobs.length; i++) {
		if (bestReq === null || bestJobs[i].req.fee > bestReq.fee) {
			bestReq = bestJobs[i].req;
			bestCar = bestJobs[i].car;
		}
	}

	// (4) a shabby car, cash for a full service and no job worth taking:
	// service the worst car in the stable.
	if (bestReq === null && state.cars.length > 0) {
		let worst = state.cars[0];
		for (let i = 1; i < state.cars.length; i++) {
			if (state.cars[i].condition < worst.condition) {
				worst = state.cars[i];
			}
		}
		if (worst.condition < 8) {
			const model = modelOf(worst.modelId);
			const cost = Math.round(150 + model.basePrice * 0.008);
			if (state.cash >= cost + 600) {
				const carId = worst.id;
				return actOrWait(state, () => serviceCar(state, carId, 'full'));
			}
		}
	}

	// (5) the highest-fee open booking the best qualifying car can take.
	if (bestReq !== null) {
		const requestId = bestReq.id;
		const carId = bestCar.id;
		return actOrWait(state, () => acceptJob(state, requestId, carId));
	}

	// (6) money to burn and no hype: paper while saving, magazine after.
	if (state.cash > 6000 && state.buzz < 15) {
		const media = state.cash < 12000 ? 'paper' : 'magazine';
		return actOrWait(state, () => advertise(state, media));
	}

	// (7) flush with cash and a free slot: another decent car, cheaply.
	if (state.cash > 40000 && state.cars.length < state.garageSlots) {
		let best = null;
		for (let i = 0; i < state.shop.listings.length; i++) {
			const l = state.shop.listings[i];
			if (!canBuy(state, l, 15000)) {
				continue;
			}
			const score = scoreOf(l.modelId, l);
			if (best === null || score > best.score) {
				best = { listing: l, score: score };
			}
		}
		if (best !== null) {
			const listingId = best.listing.listingId;
			return actOrWait(state, () => buyCar(state, listingId));
		}
	}

	// (8) nothing worth doing: the kettle goes on.
	return waitDay(state);
}

// Every open request that some available car can legally take, paired
// with that car's best-scoring qualifying candidate. Ordered as found;
// the caller picks the highest fee.
function bestAcceptableJobs(state) {
	const jobs = [];
	for (let i = 0; i < state.requests.length; i++) {
		const req = state.requests[i];
		if (req.expiresDay < state.day) {
			continue;
		}
		let best = null;
		for (let j = 0; j < state.cars.length; j++) {
			const car = state.cars[j];
			if (!isAvailable(state, car)) {
				continue;
			}
			const model = modelOf(car.modelId);
			if (effD(model, car) >= req.minDesirability &&
				effR(model, car) >= req.minReliability &&
				car.condition >= req.minCondition) {
				const score = scoreOf(car.modelId, car);
				if (best === null || score > best.score) {
					best = { req: req, car: car, score: score };
				}
			}
		}
		if (best !== null) {
			jobs.push(best);
		}
	}
	return jobs;
}

// Play one whole year for a seed with the given policy: start the game,
// call the bot until the game ends or MAX_ACTIONS actions are spent.
function playout(seed, bot) {
	const state = startGame(seed);
	let actions = 0;
	while (!state.flags.gameOver && actions < MAX_ACTIONS) {
		if (bot(state) === null) {
			break;
		}
		actions += 1;
	}
	return state;
}

// Run one policy over seeds 1..SEED_COUNT and print its 17-line block.
function report(name, bot) {
	let won = 0;
	let yearEnd = 0;
	let bankrupt = 0;
	let sumNetWorth = 0;
	let sumJobsDone = 0;
	let sumJobsFailed = 0;
	let sumAds = 0;
	let sumFaults = 0;
	let sumCarsBought = 0;
	let sumRep = 0;
	let sumBankruptDay = 0;
	const plates = { fatcat: 0, stable: 0, household: 0, hammer: 0 };

	for (let seed = 1; seed <= SEED_COUNT; seed++) {
		const state = playout(seed, bot);
		if (state.flags.won) {
			won++;
		}
		if (state.flags.reason === 'year-end') {
			yearEnd++;
		}
		if (state.flags.reason === 'bankrupt') {
			bankrupt++;
			sumBankruptDay += state.day;
		}
		sumNetWorth += netWorth(state);
		sumJobsDone += state.stats.jobsDone;
		sumJobsFailed += state.stats.jobsFailed;
		sumAds += state.stats.adsRun;
		sumFaults += state.stats.faults;
		sumCarsBought += state.stats.carsBought;
		sumRep += state.reputation;
		plates.fatcat += state.plates.fatcat ? 1 : 0;
		plates.stable += state.plates.stable ? 1 : 0;
		plates.household += state.plates.household ? 1 : 0;
		plates.hammer += state.plates.hammer ? 1 : 0;
	}

	print('POLICY ' + name);
	print('SEEDS ' + SEED_COUNT);
	print('WON ' + won);
	print('YEAR_END ' + yearEnd);
	print('BANKRUPT ' + bankrupt);
	print('AVG_NETWORTH ' + (sumNetWorth / SEED_COUNT).toFixed(1));
	print('AVG_JOBS_DONE ' + (sumJobsDone / SEED_COUNT).toFixed(1));
	print('AVG_JOBS_FAILED ' + (sumJobsFailed / SEED_COUNT).toFixed(1));
	print('AVG_ADS ' + (sumAds / SEED_COUNT).toFixed(1));
	print('AVG_FAULTS ' + (sumFaults / SEED_COUNT).toFixed(1));
	print('AVG_CARS_BOUGHT ' + (sumCarsBought / SEED_COUNT).toFixed(1));
	print('AVG_FINAL_REP ' + (sumRep / SEED_COUNT).toFixed(1));
	print('PLATES_FATCAT ' + plates.fatcat);
	print('PLATES_STABLE ' + plates.stable);
	print('PLATES_HOUSEHOLD ' + plates.household);
	print('PLATES_HAMMER ' + plates.hammer);
	print('FIRST_BANKRUPT_DAY_AVG ' + (bankrupt > 0 ? (sumBankruptDay / bankrupt).toFixed(1) : '0.0'));
}

report('naive', naiveBot);
report('smart', smartBot);
