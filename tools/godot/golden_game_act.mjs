// Golden fixture for godot/autoload/game.gd act (GDS20): one scripted session on fresh(3) through dispatch
// (golden_dispatch.mjs). Each step records the action, its params under the GODOT keys (snake_case, as
// Game.act takes them), the result and the headline numbers after it. Run by:
//   sh tools/godot/golden_run.sh game_act   (writes godot/tests/golden/game_act.json)

import { dispatch } from './golden_dispatch.mjs';
import { fresh, clone, pureCase, emitCases } from './golden_sim.mjs';

const state = fresh(3);
const steps = [];

const first = (arr) => arr.length > 0 ? arr[0] : null;
const carId = () => state.cars.length > 0 ? state.cars[0].id : 'c0';
const ownedCarId = () => {
	const c = state.cars.find(x => x.owned === true);
	return c ? c.id : 'c0';
};
const rentedCarId = () => {
	const c = state.cars.find(x => x.owned === false);
	return c ? c.id : 'c0';
};
const lotId = (i, fallback) => state.auction.lots.length > i ? state.auction.lots[i].lotId : fallback;

// JS camelCase param keys -> Godot snake_case keys (listingId -> listing_id). Other keys are unchanged.
function godotParams(p) {
	const out = {};
	for (const k of Object.keys(p)) {
		out[k.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase())] = p[k];
	}
	return out;
}

// Each intent is a function of the current state returning [action, params] (JS keys).
const intents = [
	() => ['wait_day', {}],
	() => {
		const sales = state.shop.listings.filter(l => l.mode === 'sale' && l.price <= state.cash);
		sales.sort((a, b) => a.price - b.price);
		return ['buy_car', { listingId: sales.length > 0 ? sales[0].listingId : 'L0' }];
	},
	() => ['service_car', { carId: carId(), kind: 'quick' }],
	() => ['service_car', { carId: carId(), kind: 'bogus' }],
	() => ['buy_slot', {}],
	() => ['advertise', { mediaId: 'paper' }],
	() => ['advertise', { mediaId: 'nosuchad' }],
	() => {
		const rents = state.shop.listings.filter(l => l.mode === 'rent');
		return ['rent_car', { listingId: rents.length > 0 ? rents[0].listingId : 'L0' }];
	},
	() => ['accept_job', { requestId: first(state.requests) ? first(state.requests).id : 'Q0', carId: carId() }],
	() => ['fix_fault', { carId: carId() }],
	() => ['restore_car', { carId: carId() }],
	() => ['reveal_stat', { lotId: lotId(0, 'A0'), stat: 'desirability' }],
	() => ['reveal_stat', { lotId: lotId(0, 'A0'), stat: 'desirability' }],
	() => ['consign_car', { carId: ownedCarId(), reserve: 1000 }],
	() => ['unconsign', { carId: ownedCarId() }],
	() => ['place_bid', { lotId: lotId(0, 'A0'), steps: 1 }],
	() => ['sell_to_dealer', { carId: ownedCarId() }],
	() => ['return_rental', { carId: rentedCarId() }],
];

function play(action, params) {
	const r = dispatch(state, action, params);
	steps.push({
		action: action,
		params: godotParams(params),
		result: r === undefined ? null : clone(r),
		day: state.day,
		cash: state.cash,
		reputation: state.reputation,
		buzz: state.buzz,
		cars: state.cars.length,
		gameOver: state.flags.gameOver,
	});
}

for (const intent of intents) {
	const [action, params] = intent();
	play(action, params);
}

while (state.day < 24) {
	play('wait_day', {});
}
play('place_bid', { lotId: lotId(0, 'A0'), steps: 1 });
play('place_bid', { lotId: lotId(1, 'A1'), steps: 3 });
play('attend_auction', {});
for (let i = 0; i < 5; i++) {
	play('wait_day', {});
}

const session = pureCase('session', 'scripted session seed 3', [3], { steps: steps, final: clone(state) });
emitCases('game_act', [session]);
