// Shared helpers for building golden test cases from the JS reference (run under macOS `jsc -m`).
// Each golden_<name>.mjs imports these, builds cases and calls emitCases(name, cases), which prints one JSON document.
//
// clone(x)                         deep copy through JSON (drops undefined, so keep state JSON-safe)
// fresh(seed)                      a full new game: startGame(seed)
// bare(seed)                       an empty state: newGameState(seed)
// addCar(state, modelId, fields)   push a default owned car (id 'c<n>') with optional field overrides; returns the car
// pureCase(fn, name, args, result) one case for a pure function: { fn, name, args, result }
// stateCase(fn, name, state, args, call) runs call(work, ...args) on a copy of state; returns { fn, name, state, args, result, after }
// sweepSeeds(base, lo, hi, run, classify, perKind) finds seeds per outcome kind; returns { kind: [seed, ...] }
// emitCases(name, cases)           prints { cases: cases } as JSON

import { startGame } from '../../src/sim/newgame.js';
import { newGameState } from '../../src/core/state.js';

export function clone(x) {
	return JSON.parse(JSON.stringify(x));
}

export function fresh(seed) {
	return startGame(seed);
}

export function bare(seed) {
	return newGameState(seed);
}

export function addCar(state, modelId, fields = {}) {
	const car = Object.assign({
		id: 'c' + state.nextId++,
		modelId: modelId,
		owned: true,
		owner: null,
		rentMonthly: 0,
		paid: 0,
		condition: 5,
		fault: null,
		lastServiceDay: state.day,
		jobsDone: 0,
		boughtDay: state.day,
		impoundedUntil: 0,
		rentedAtCondition: null,
	}, fields);
	state.cars.push(car);
	return car;
}

export function pureCase(fn, name, args, result) {
	return { fn: fn, name: name, args: clone(args), result: result === undefined ? null : clone(result) };
}

export function stateCase(fn, name, state, args, call) {
	const input = clone(state);
	const work = clone(state);
	const a = clone(args);
	const r = call(work, ...a);
	return {
		fn: fn,
		name: name,
		state: input,
		args: clone(args),
		result: r === undefined ? null : clone(r),
		after: work,
	};
}

export function sweepSeeds(base, lo, hi, run, classify, perKind = 2) {
	const found = {};
	for (let seed = lo; seed <= hi; seed++) {
		const w = clone(base);
		w.rng = seed;
		const r = run(w);
		const k = classify(w, r);
		if (k === null) {
			continue;
		}
		if (!found[k]) {
			found[k] = [];
		}
		if (found[k].length < perKind) {
			found[k].push(seed);
		}
	}
	return found;
}

export function emitCases(name, cases) {
	print(JSON.stringify({ cases: cases }));
}
