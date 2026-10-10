// Tests for the W50c wear pass in src/art/cardraw.js: rust blotches and
// the exhaust smoke puff, gated on opts.cond. Run under `jsc -m`.

import { test, ok, done } from './harness.js';
import { makeCtx, count, anySet } from './fakectx.js';
import { drawCar } from '../src/art/cardraw.js';

const ARCHETYPES = ['micro', 'saloon', 'beetle', 'hatch', 'roadster', 'coupe',
	'longnose', 'wedge', 'gullwing', 'tourer', 'limo', 'boxy', 'trike'];

const RUST = '#8a4b1f';
const SMOKE = 'rgba(160,160,160,0.5)';

test('cond 10 (good): no rust colour anywhere', () => {
	for (const a of ARCHETYPES) {
		const ctx = makeCtx();
		drawCar(ctx, a, 400, 300, 1, { cond: 10 });
		ok(!anySet(ctx, 'fillStyle', RUST), a + ': no rust at cond 10');
	}
});

test('cond 3 (poor): rust yes, smoke no', () => {
	for (const a of ARCHETYPES) {
		const ctx = makeCtx();
		drawCar(ctx, a, 400, 300, 1, { cond: 3 });
		ok(anySet(ctx, 'fillStyle', RUST), a + ': rust at cond 3');
		ok(!anySet(ctx, 'fillStyle', SMOKE), a + ': no smoke at cond 3');
	}
});

test('cond 1 (wrecked): rust and smoke both drawn', () => {
	for (const a of ARCHETYPES) {
		const ctx = makeCtx();
		drawCar(ctx, a, 400, 300, 1, { cond: 1 });
		ok(anySet(ctx, 'fillStyle', RUST), a + ': rust at cond 1');
		ok(anySet(ctx, 'fillStyle', SMOKE), a + ': smoke at cond 1');
	}
});

test('cond 4 (boundary): 4 is not poor, neither rust nor smoke', () => {
	for (const a of ARCHETYPES) {
		const ctx = makeCtx();
		drawCar(ctx, a, 400, 300, 1, { cond: 4 });
		ok(!anySet(ctx, 'fillStyle', RUST), a + ': no rust at cond 4');
		ok(!anySet(ctx, 'fillStyle', SMOKE), a + ': no smoke at cond 4');
	}
});

test('cond 2 (boundary): rust yes, smoke needs cond below 2', () => {
	for (const a of ARCHETYPES) {
		const ctx = makeCtx();
		drawCar(ctx, a, 400, 300, 1, { cond: 2 });
		ok(anySet(ctx, 'fillStyle', RUST), a + ': rust at cond 2');
		ok(!anySet(ctx, 'fillStyle', SMOKE), a + ': no smoke at cond 2');
	}
});

test('wear adds arcs: cond 1 draws more arcs than cond 10', () => {
	for (const a of ARCHETYPES) {
		const good = makeCtx();
		drawCar(good, a, 400, 300, 1, { cond: 10 });
		const worn = makeCtx();
		drawCar(worn, a, 400, 300, 1, { cond: 1 });
		ok(count(worn, 'arc') > count(good, 'arc'),
			a + ': rust and smoke circles add arcs');
	}
});

test('save/restore stay balanced at every condition', () => {
	for (const cond of [0, 1, 2, 3, 4, 5, 10]) {
		const ctx = makeCtx();
		drawCar(ctx, 'saloon', 400, 300, 1, { cond: cond });
		ok(count(ctx, 'save') === count(ctx, 'restore'),
			'cond ' + cond + ': save/restore balanced');
	}
});

test('smoke wobbles: cond 1 at t=0 and t=1 give different call logs', () => {
	const at0 = makeCtx();
	drawCar(at0, 'saloon', 400, 300, 1, { cond: 1, t: 0 });
	const at1 = makeCtx();
	drawCar(at1, 'saloon', 400, 300, 1, { cond: 1, t: 1 });
	const logs0 = JSON.stringify(at0.calls);
	const logs1 = JSON.stringify(at1.calls);
	ok(logs0 !== logs1, 'call logs differ between t=0 and t=1');
});

done();
