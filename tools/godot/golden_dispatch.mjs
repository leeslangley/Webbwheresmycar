// Action dispatch for the golden session (GDS20): one JS sim call per action name of the Game.act table
// (godot/autoload/game.gd). Params use the JS keys (listingId, carId, ...); golden_game_act.mjs maps them.
// Imported by golden_game_act.mjs only (no output of its own).

import { buyCar, rentCar, returnRental, sellToDealer, buySlot, waitDay } from '../../src/sim/actions.js';
import { serviceCar, fixFault, restoreCar } from '../../src/sim/garage.js';
import { acceptJob } from '../../src/sim/jobresolve.js';
import { advertise } from '../../src/sim/adsim.js';
import { revealStat, consignCar, unconsign, placeBid, attendAuction } from '../../src/sim/auction.js';

export const ACTIONS = {
	buy_car: (s, p) => buyCar(s, p.listingId),
	rent_car: (s, p) => rentCar(s, p.listingId),
	return_rental: (s, p) => returnRental(s, p.carId),
	sell_to_dealer: (s, p) => sellToDealer(s, p.carId),
	buy_slot: (s) => buySlot(s),
	wait_day: (s) => waitDay(s),
	service_car: (s, p) => serviceCar(s, p.carId, p.kind),
	fix_fault: (s, p) => fixFault(s, p.carId),
	restore_car: (s, p) => restoreCar(s, p.carId),
	accept_job: (s, p) => acceptJob(s, p.requestId, p.carId),
	advertise: (s, p) => advertise(s, p.mediaId),
	reveal_stat: (s, p) => revealStat(s, p.lotId, p.stat),
	consign_car: (s, p) => consignCar(s, p.carId, p.reserve),
	unconsign: (s, p) => unconsign(s, p.carId),
	place_bid: (s, p) => placeBid(s, p.lotId, p.steps),
	attend_auction: (s) => attendAuction(s),
};

export function dispatch(state, action, params) {
	if (!Object.prototype.hasOwnProperty.call(ACTIONS, action)) {
		return { ok: false, msg: 'Unknown action: ' + action };
	}
	return ACTIONS[action](state, params);
}
