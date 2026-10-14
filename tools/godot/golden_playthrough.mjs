// Golden fixture for the Godot parity playthrough (GDS21): the scripted bot (golden_bot.mjs) plays 60 calls on
// seed 11 through the dispatch table. The GDScript Game replays the recorded steps (test_playthrough.gd).
// Run by:
//   sh tools/godot/golden_run.sh playthrough   (writes godot/tests/golden/playthrough.json)

import { runBot } from './golden_bot.mjs';
import { fresh, pureCase, emitCases } from './golden_sim.mjs';

const s = fresh(11);
const steps = runBot(s, 60);

const kinds = new Set(steps.map(x => x.action));
if (kinds.size < 6) {
	throw new Error('playthrough: only ' + kinds.size + ' distinct actions in ' + steps.length + ' steps');
}

const play = pureCase('playthrough', 'seed 11, 60 bot calls', [11], { steps: steps, final: s });
emitCases('playthrough', [play]);
