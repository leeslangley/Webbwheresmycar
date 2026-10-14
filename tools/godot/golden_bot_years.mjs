// Golden fixture for the Godot parity bot years (GDS22): the scripted bot (golden_bot.mjs, the GDS21 priority
// rules) plays a whole game year on seeds 1..10 through the dispatch table. Each seed must end the year
// (flags.gameOver true) within 400 bot calls. The GDScript SimBot (godot/tests/sim_bot.gd) replays the same
// rules through Game.act and must end each game with the same headline numbers (test_bot_years.gd).
// Run by:
//   sh tools/godot/golden_run.sh bot_years   (writes godot/tests/golden/bot_years.json)

import { chooseAction } from './golden_bot.mjs';
import { dispatch } from './golden_dispatch.mjs';
import { fresh, pureCase, emitCases } from './golden_sim.mjs';

const MAX_CALLS = 400;
const cases = [];

for (let seed = 1; seed <= 10; seed++) {
	const s = fresh(seed);
	let calls = 0;
	while (calls < MAX_CALLS) {
		const a = chooseAction(s);
		if (a === null) {
			break;
		}
		const r = dispatch(s, a[0], a[1]);
		if (!r.ok) {
			dispatch(s, 'wait_day', {});
		}
		calls++;
	}
	if (s.flags.gameOver !== true) {
		throw new Error('bot_years: seed ' + seed + ' did not end the year within ' + MAX_CALLS + ' calls');
	}
	cases.push(pureCase('bot_year', 'seed ' + seed, [seed], {
		calls: calls,
		reason: s.flags.reason,
		won: s.flags.won,
		day: s.day,
		cash: s.cash,
		reputation: s.reputation,
		buzz: s.buzz,
		cars: s.cars.length,
		rng: s.rng,
	}));
}

emitCases('bot_years', cases);
