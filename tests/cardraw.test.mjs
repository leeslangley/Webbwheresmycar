// Tests for src/art/cardraw.js, run under `jsc -m`.

import { test, eq, ok, throws, near, done } from './harness.js';
import { makeCtx, count, anySet } from './fakectx.js';
import { shade } from '../src/ui/theme.js';
import { drawCar, carBounds } from '../src/art/cardraw.js';
import { PROFILE_KEYS } from '../src/art/profiles.js';

const ARCHETYPES = ['micro', 'saloon', 'beetle', 'hatch', 'roadster', 'coupe',
	'longnose', 'wedge', 'gullwing', 'tourer', 'limo', 'boxy', 'trike'];

test('all 13 archetypes are covered', () => {
	eq(ARCHETYPES.length, 13, '13 archetypes in the list');
	for (const a of ARCHETYPES) {
		ok(PROFILE_KEYS.indexOf(a) !== -1, a + ' is a real profile');
	}
	eq(PROFILE_KEYS.length, 13, '13 profiles in profiles.js');
});

test('drawCar does not throw and balances save/restore for every archetype', () => {
	for (const a of ARCHETYPES) {
		const ctx = makeCtx();
		drawCar(ctx, a, 400, 300, 1, {});
		eq(count(ctx, 'save'), count(ctx, 'restore'), a + ': save/restore balanced');
	}
});

test('drawCar translates to (x, y) first, then scales by lengthPx/100', () => {
	const ctx = makeCtx();
	drawCar(ctx, 'saloon', 400, 300, 1, {});
	const tr = ctx.calls.filter(function (c) { return c[0] === 'translate'; })[0];
	eq(tr[1], [400, 300], 'first translate is (400, 300)');
	const sc = ctx.calls.filter(function (c) { return c[0] === 'scale'; })[0];
	near(sc[1][0], 4.2, 1e-9, 'saloon x scale is 4.2');
	near(sc[1][1], -4.2, 1e-9, 'saloon y scale is -4.2');
});

test('each archetype scales by its own lengthPx/100', () => {
	const lengths = { micro: 300, saloon: 420, beetle: 340, hatch: 320,
		roadster: 380, coupe: 400, longnose: 450, wedge: 420, gullwing: 410,
		tourer: 480, limo: 500, boxy: 380, trike: 280 };
	for (const a of ARCHETYPES) {
		const ctx = makeCtx();
		drawCar(ctx, a, 0, 0, 1, {});
		const sc = ctx.calls.filter(function (c) { return c[0] === 'scale'; })[0];
		const k = lengths[a] / 100;
		near(sc[1][0], k, 1e-9, a + ' x scale');
		near(sc[1][1], -k, 1e-9, a + ' y scale');
	}
});

test('one tyre fill per wheel (3 for trike with its dim wheel, 2 for the rest)', () => {
	// The tyre colour is shade('#15151a', dark): plain '#15151a' when lit,
	// a darkened shade for a dim wheel (trike's middle wheel), so count both.
	const dimTyre = shade('#15151a', -0.4);
	for (const a of ARCHETYPES) {
		const ctx = makeCtx();
		drawCar(ctx, a, 400, 300, 1, {});
		let tyres = 0;
		for (const c of ctx.calls) {
			if (c[0] === 'set:fillStyle' && (c[1][0] === '#15151a' || c[1][0] === dimTyre)) {
				tyres += 1;
			}
		}
		eq(tyres, a === 'trike' ? 3 : 2, a + ': tyre fills match wheel count');
	}
});

test('body defaults to #9a2a2a and honours opts.body', () => {
	const ctx = makeCtx();
	drawCar(ctx, 'saloon', 400, 300, 1, {});
	ok(anySet(ctx, 'fillStyle', '#9a2a2a'), 'default body colour used');
	const ctx2 = makeCtx();
	drawCar(ctx2, 'saloon', 400, 300, 1, { body: '#112233' });
	ok(anySet(ctx2, 'fillStyle', '#112233'), 'opts.body colour used');
	ok(!anySet(ctx2, 'fillStyle', '#9a2a2a'), 'default body colour replaced');
});

test('unknown archetype throws', () => {
	const ctx = makeCtx();
	throws(function () { drawCar(ctx, 'lorry', 400, 300, 1, {}); }, 'unknown archetype');
	throws(function () { drawCar(ctx, undefined, 400, 300, 1, {}); }, 'undefined archetype');
});

test('carBounds widths from lengthPx', () => {
	eq(carBounds('micro', 1).w, 300, 'micro width at scale 1');
	eq(carBounds('saloon', 2).w, 840, 'saloon width at scale 2');
});

test('carBounds height covers the tallest part plus 2 units', () => {
	const h = carBounds('saloon', 1).h;
	ok(h >= 120 && h <= 200, 'saloon height ' + h + ' is between 120 and 200');
	// saloon: tallest part y is 31, so h = (31 + 2) * 4.2 = 138.6
	near(h, 138.6, 1e-9, 'saloon height formula');
});

test('carBounds throws for an unknown archetype too', () => {
	throws(function () { carBounds('lorry', 1); }, 'unknown archetype');
});

test('scale 0.5 keeps (x, y) and halves the scale', () => {
	const ctx = makeCtx();
	drawCar(ctx, 'saloon', 400, 300, 0.5, {});
	const tr = ctx.calls.filter(function (c) { return c[0] === 'translate'; })[0];
	eq(tr[1], [400, 300], 'same translate at half scale');
	const sc = ctx.calls.filter(function (c) { return c[0] === 'scale'; })[0];
	near(sc[1][0], 2.1, 1e-9, 'half x scale');
	near(sc[1][1], -2.1, 1e-9, 'half y scale');
});

test('odd opts do not break drawing: extra keys, t, null opts, scale 0', () => {
	const ctx = makeCtx();
	drawCar(ctx, 'trike', 0, 0, 1, { t: 5, cond: 2, roof: '#ffffff', stripe: '#000000', extra: 1 });
	eq(count(ctx, 'save'), count(ctx, 'restore'), 'save/restore still balanced');
	drawCar(makeCtx(), 'saloon', 1, 1, 1, null);
	drawCar(makeCtx(), 'saloon', 1, 1, 0, {});
	ok(true, 'null opts and scale 0 do not throw');
});

test('flat colours only: no gradients and no clips', () => {
	for (const a of ARCHETYPES) {
		const ctx = makeCtx();
		drawCar(ctx, a, 400, 300, 1, {});
		eq(count(ctx, 'createLinearGradient'), 0, a + ': no linear gradients');
		eq(count(ctx, 'createRadialGradient'), 0, a + ': no radial gradients');
		eq(count(ctx, 'clip'), 0, a + ': no clip');
	}
});

done();
