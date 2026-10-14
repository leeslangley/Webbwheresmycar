// Golden fixture for godot/sim/news.gd (GDS07): runs the src/sim/news.js headline chooser under macOS jsc -m.
// Run by: sh tools/godot/golden_run.sh news   (writes godot/tests/golden/news.json)

import { chooseHeadline } from '../../src/sim/news.js';
import { GENERIC } from '../../src/data/headlines.js';
import { stateCase, emitCases } from './golden_sim.mjs';

const cases = [];

// (a) no situations, no ctx: seeds 1..10
for (let seed = 1; seed <= 10; seed++) {
	cases.push(stateCase('choose_headline', 'no situation seed ' + seed, { rng: seed, headlines: [] }, [[], {}],
		(s, sits, ctx) => chooseHeadline(s, sits, ctx)));
}

// (b) situation and ctx pairs: seeds 1..6 each (30 cases)
const PAIRS = [
	[['broke'], { cash: 420 }],
	[['monthend', 'rich'], { cash: 75000, car: 'Austen Allergy' }],
	[['bigwin', 'viral'], { customer: 'Brian Prong' }],
	[['nonsense'], {}],
	[['breakdown'], { car: '', customer: '', cash: 'lots' }],
];
for (const [sits, ctx] of PAIRS) {
	for (let seed = 1; seed <= 6; seed++) {
		cases.push(stateCase('choose_headline', sits.join('+') + ' seed ' + seed, { rng: seed, headlines: [] }, [sits, ctx],
			(s, a, c) => chooseHeadline(s, a, c)));
	}
}

// (c) pre-filled history: 29 entries, then 30 entries (seeds 1..5 each)
for (let seed = 1; seed <= 5; seed++) {
	cases.push(stateCase('choose_headline', 'history 29 s' + seed, { rng: seed, headlines: GENERIC.slice(0, 29) }, [[], {}],
		(s, sits, ctx) => chooseHeadline(s, sits, ctx)));
}
for (let seed = 1; seed <= 5; seed++) {
	cases.push(stateCase('choose_headline', 'history 30 s' + seed, { rng: seed, headlines: GENERIC.slice(0, 30) }, [[], {}],
		(s, sits, ctx) => chooseHeadline(s, sits, ctx)));
}

// (d) a sequence of forty calls with rotating situations and ctx
cases.push(stateCase('choose_headline_seq', 'forty calls seed 3', { rng: 3, headlines: [] }, [40], (s, n) => {
	const out = [];
	const SITS = [[], ['broke'], ['rich', 'monthend'], ['viral', 'bigwin', 'zzz']];
	for (let i = 0; i < n; i++) {
		out.push(chooseHeadline(s, SITS[i % 4], i % 2 === 0 ? { cash: 1000 * i } : { cash: 1000 * i, car: 'Fjord Capri', customer: 'Kevin Pumphrey' }));
	}
	return out;
}));

emitCases('news', cases);
