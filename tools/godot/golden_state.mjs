// Golden fixture for godot/core/state.gd (GDF08): runs src/core/state.js under macOS jsc -m.
// Run by: sh tools/godot/golden.sh state   (writes godot/tests/golden/state.json)

import { emit } from './golden_common.mjs';
import { newGameState, PLATE_KEYS } from '../../src/core/state.js';

const SEEDS = [1, 0, 42, 4294967295];

emit({
	plateKeys: PLATE_KEYS,
	states: SEEDS.map((s) => ({ seed: s, state: newGameState(s) })),
	defaultSeed: newGameState(),
});
