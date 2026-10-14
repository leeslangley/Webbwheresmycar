// Golden fixture for godot/sim/adsim.gd (GDS17): runs src/sim/adsim.js under macOS jsc -m.
// Run by: sh tools/godot/golden_run.sh adsim   (writes godot/tests/golden/adsim.json)

import { advertise } from '../../src/sim/adsim.js';
import { fresh, clone, stateCase, sweepSeeds, emitCases } from './golden_sim.mjs';

const cases = [];
const MEDIA = ['paper', 'internet', 'magazine', 'youtube', 'radio', 'billboard', 'tv'];

// A1-A35: every medium, seeds 1..5, with a fat wallet.
for (const media of MEDIA) {
	for (let seed = 1; seed <= 5; seed++) {
		const st = fresh(seed);
		st.cash = 100000;
		cases.push(stateCase('advertise', 'A ' + media + ' seed ' + seed, st, [media], (s, m) => advertise(s, m)));
	}
}

// R1: unknown medium refuses, nothing changes.
{
	const st = fresh(8);
	st.cash = 100000;
	cases.push(stateCase('advertise', 'R1 unknown medium nosuchad', st, ['nosuchad'], (s, m) => advertise(s, m)));
}

// R2: tv with not enough money refuses, nothing changes.
{
	const st = fresh(9);
	st.cash = 100;
	cases.push(stateCase('advertise', 'R2 tv with cash 100 refuses', st, ['tv'], (s, m) => advertise(s, m)));
}

// C1: clamps at the top: buzz 98 plus magazine gain, reputation 99 plus rep gain.
{
	const st = fresh(2);
	st.cash = 100000;
	st.buzz = 98;
	st.reputation = 99;
	cases.push(stateCase('advertise', 'C1 buzz and reputation clamp at 100', st, ['magazine'], (s, m) => advertise(s, m)));
}

// V1, V2: a viral outcome (buzz >= 80), found by sweeping seeds 1..5000.
for (const media of ['youtube', 'tv']) {
	const base = fresh(1);
	base.cash = 100000;
	const found = sweepSeeds(base, 1, 5000, w => advertise(w, media), (w, r) => (r.ok && r.outcome.buzz >= 80 ? 'viral' : null), 1);
	if (!found['viral'] || found['viral'].length === 0) {
		throw new Error('adsim golden: no viral seed found for ' + media);
	}
	const st = clone(base);
	st.rng = found['viral'][0];
	cases.push(stateCase('advertise', 'viral ' + media, st, [media], (s, m) => advertise(s, m)));
}

emitCases('adsim', cases);
