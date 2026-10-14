// Golden fixture for godot/sim/newgame.gd (GDS19): runs the src/sim/newgame.js startGame bootstrap under macOS jsc -m.
// Run by: sh tools/godot/golden_run.sh newgame   (writes godot/tests/golden/newgame.json)

import { startGame } from '../../src/sim/newgame.js';
import { pureCase, emitCases } from './golden_sim.mjs';

const SEEDS = [0, 1, 2, 3, 7, 42, 12345, 987654321, 4294967301, 1700000000001];
const cases = [];

// (a) a full new game per seed; the two largest seeds exceed uint32 (state.seed keeps the raw value)
for (const seed of SEEDS) {
	cases.push(pureCase('start_game', 'seed ' + seed, [seed], startGame(seed)));
}

emitCases('newgame', cases);
