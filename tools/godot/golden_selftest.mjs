// Self-test golden: proves the golden pipeline (jsc -> JSON -> GoldenUtil) works. Not a sim port.
// Run by: sh tools/godot/golden_run.sh selftest

import { pureCase, stateCase, emitCases } from './golden_sim.mjs';

const cases = [];

cases.push(pureCase('add', 'two plus three', [2, 3], 5));

cases.push(stateCase('bump', 'bump a state', { n: 1, list: [1, 2] }, [5], function (s, k) {
	s.n += k;
	s.list.push(k);
	return s.n;
}));

cases.push(pureCase('float', 'floats and text', [0.1, 0.2], { sum: 0.1 + 0.2, text: 'Price £ 5', flag: true, none: null }));

emitCases('selftest', cases);
