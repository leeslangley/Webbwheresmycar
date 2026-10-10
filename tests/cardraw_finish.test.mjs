// Tests for the W50b finish pass in src/art/cardraw.js: paint, glass,
// arches and the rim ring. Run under `jsc -m`.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, count, anySet } from './fakectx.js';
import { drawCar } from '../src/art/cardraw.js';

const ARCHETYPES = ['micro', 'saloon', 'beetle', 'hatch', 'roadster', 'coupe',
	'longnose', 'wedge', 'gullwing', 'tourer', 'limo', 'boxy', 'trike'];

test('default drawing does not throw and stays balanced for every archetype', () => {
	for (const a of ARCHETYPES) {
		const ctx = makeCtx();
		drawCar(ctx, a, 400, 300, 1, {});
		eq(count(ctx, 'save'), count(ctx, 'restore'), a + ': save/restore balanced');
	}
});

test('body and glass paint: at least 2 linear gradients per archetype', () => {
	for (const a of ARCHETYPES) {
		const ctx = makeCtx();
		drawCar(ctx, a, 400, 300, 1, {});
		ok(count(ctx, 'createLinearGradient') >= 2, a + ': body and glass gradients');
	}
});

test('opts.roof repaints the top of the body through a clip', () => {
	for (const a of ARCHETYPES) {
		const base = makeCtx();
		drawCar(base, a, 400, 300, 1, {});
		const ctx = makeCtx();
		drawCar(ctx, a, 400, 300, 1, { roof: '#ffffff' });
		ok(anySet(ctx, 'fillStyle', '#ffffff'), a + ': roof colour assigned');
		ok(count(ctx, 'clip') > count(base, 'clip'), a + ': roof adds a clip');
	}
});

test('opts.stripe draws a clipped stripe', () => {
	for (const a of ARCHETYPES) {
		const base = makeCtx();
		drawCar(base, a, 400, 300, 1, {});
		const ctx = makeCtx();
		drawCar(ctx, a, 400, 300, 1, { stripe: '#ff0000' });
		ok(anySet(ctx, 'fillStyle', '#ff0000'), a + ': stripe colour assigned');
		ok(count(ctx, 'clip') > count(base, 'clip'), a + ': stripe adds a clip');
	}
});

test('wheel arches: dark #101014 fill per wheel (3 for trike)', () => {
	for (const a of ARCHETYPES) {
		const ctx = makeCtx();
		drawCar(ctx, a, 400, 300, 1, {});
		let arches = 0;
		for (const c of ctx.calls) {
			if (c[0] === 'set:fillStyle' && c[1][0] === '#101014') {
				arches += 1;
			}
		}
		ok(arches >= (a === 'trike' ? 3 : 2), a + ': arch fill per wheel');
	}
});

test('opts.wheel colours the rim ring', () => {
	const ctx = makeCtx();
	drawCar(ctx, 'saloon', 400, 300, 1, { wheel: '#abcdef' });
	ok(anySet(ctx, 'strokeStyle', '#abcdef'), 'rim ring stroke colour assigned');
});

test('a custom body colour is baked into a gradient, never a flat fillStyle', () => {
	const ctx = makeCtx();
	drawCar(ctx, 'saloon', 400, 300, 1, { body: '#336699' });
	ok(!anySet(ctx, 'fillStyle', '#336699'), 'raw body colour not assigned to fillStyle');
	ok(count(ctx, 'createLinearGradient') >= 2, 'body gradient built from the colour');
});

done();
