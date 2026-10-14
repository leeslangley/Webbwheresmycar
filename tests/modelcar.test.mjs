// Tests for src/art/modelcar.js (CC07): drawModelCar and measureModelCar, the
// one entry point for car drawing, run under `jsc -m`. Sprites are the fakes
// from tests/fakecarart.js; the canvas is tests/fakectx.js.

import { test, eq, ok, near, throws, done } from './harness.js';
import { makeCtx, count, anySet } from './fakectx.js';
import { setDeviceScale } from '../src/art/pixelscale.js';
import { drawModelCar, measureModelCar, LENGTH_M } from '../src/art/modelcar.js';
import { installFakeCarArt, uninstallFakeCarArt } from './fakecarart.js';

// The drawImage calls of a ctx, as their argument lists: [img, x, y, w, h].
function images(ctx) {
	return ctx.calls.filter((c) => c[0] === 'drawImage').map((c) => c[1]);
}

// True when the ctx recorded a call of name with exactly these arguments.
function called(ctx, name, args) {
	return ctx.calls.some((c) => c[0] === name && JSON.stringify(c[1]) === JSON.stringify(args));
}

test('side view at scale 2: one drawImage with the sprite rect, plus the contact shadow', () => {
	setDeviceScale(1);
	installFakeCarArt();
	const ctx = makeCtx();
	const r = drawModelCar(ctx, 't1_chimp', 640, 400, 2, { cond: 9 });
	const imgs = images(ctx);
	eq(imgs.length, 1, 'one drawImage');
	eq(imgs[0][0].id, 't1_chimp|undefined|0', 'image id');
	eq(imgs[0].slice(1), [440, 260, 400, 140], 'rect');
	eq(count(ctx, 'ellipse'), 2, 'two contact shadow ellipses');
	eq(r.kind, 'sprite', 'kind');
	uninstallFakeCarArt();
});

test('baked shadow: drawn first with the same rect, no ellipse', () => {
	setDeviceScale(1);
	installFakeCarArt({ shadow: true });
	const ctx = makeCtx();
	drawModelCar(ctx, 't1_chimp', 640, 400, 2, { cond: 9 });
	const imgs = images(ctx);
	eq(imgs.length, 2, 'two drawImage calls');
	eq(imgs[0][0].id, 'shadow|t1_chimp', 'shadow first');
	eq(imgs[0].slice(1), imgs[1].slice(1), 'same rect');
	eq(count(ctx, 'ellipse'), 0, 'no ellipse');
	uninstallFakeCarArt();
});

test('shadow:false draws neither the baked shadow nor the ellipse', () => {
	setDeviceScale(1);
	installFakeCarArt({ shadow: true });
	const ctx = makeCtx();
	drawModelCar(ctx, 't1_chimp', 640, 400, 2, { shadow: false });
	eq(images(ctx).length, 1, 'only the car');
	eq(count(ctx, 'ellipse'), 0, 'no ellipse');
	uninstallFakeCarArt();
});

test('condition 3 gives wear state 2 in the variant id', () => {
	setDeviceScale(1);
	installFakeCarArt();
	const ctx = makeCtx();
	drawModelCar(ctx, 't1_chimp', 640, 400, 2, { cond: 3 });
	ok(images(ctx)[0][0].id.endsWith('|2'), 'wear 2');
	uninstallFakeCarArt();
});

test('paint is passed to the variant lookup', () => {
	setDeviceScale(1);
	installFakeCarArt();
	const ctx = makeCtx();
	drawModelCar(ctx, 't1_chimp', 640, 400, 2, { cond: 9, paint: '#1E4D2B' });
	ok(images(ctx)[0][0].id.indexOf('#1E4D2B') >= 0, 'paint in id');
	uninstallFakeCarArt();
});

test('smoothing is turned off for the car', () => {
	setDeviceScale(1);
	installFakeCarArt();
	const ctx = makeCtx();
	drawModelCar(ctx, 't1_chimp', 640, 400, 2, { cond: 9 });
	ok(anySet(ctx, 'imageSmoothingEnabled', false), 'imageSmoothingEnabled false');
	uninstallFakeCarArt();
});

test('view q and view f pick the q and f sprites', () => {
	setDeviceScale(1);
	installFakeCarArt();
	const ctxQ = makeCtx();
	drawModelCar(ctxQ, 't1_chimp', 640, 400, 2, { view: 'q' });
	ok(images(ctxQ)[0][0].id.indexOf('t1_chimp_q|') === 0, 'q sprite');
	const ctxF = makeCtx();
	drawModelCar(ctxF, 't1_chimp', 640, 400, 2, { view: 'f' });
	ok(images(ctxF)[0][0].id.indexOf('t1_chimp_f|') === 0, 'f sprite');
	uninstallFakeCarArt();
});

test('sheet S uses the mini sprite only', () => {
	setDeviceScale(1);
	installFakeCarArt();
	const ctx = makeCtx();
	drawModelCar(ctx, 't1_chimp', 640, 400, 1, { sheet: 'S' });
	ok(images(ctx)[0][0].id.indexOf('t1_chimp_m|') === 0, 'mini sprite');
	uninstallFakeCarArt();
});

test('slot 300 x 200: the 400 px side sprite does not fit, the mini sheet does', () => {
	setDeviceScale(1);
	installFakeCarArt();
	const ctx = makeCtx();
	drawModelCar(ctx, 't1_chimp', 640, 400, 2, { cond: 9, slot: { w: 300, h: 200 } });
	const imgs = images(ctx);
	ok(imgs[0][0].id.indexOf('t1_chimp_m|') === 0, 'mini id');
	eq(imgs[0][3], 180, 'mini width');
	uninstallFakeCarArt();
});

test('a slot that holds the side sprite keeps the side sprite', () => {
	setDeviceScale(1);
	installFakeCarArt({ L: { w: 276, h: 80 } });
	const ctx = makeCtx();
	drawModelCar(ctx, 't1_chimp', 640, 400, 2, { slot: { w: 572, h: 300 } });
	const imgs = images(ctx);
	ok(imgs[0][0].id.indexOf('t1_chimp|') === 0, 'side sprite id');
	eq(imgs[0][3], 552, 'width 552');
	uninstallFakeCarArt();
});

test('no slot fit: the smallest loaded candidate (mini) is used', () => {
	setDeviceScale(1);
	installFakeCarArt();
	const m = measureModelCar('t1_chimp', 2, { slot: { w: 50, h: 20 } });
	eq(m.kind, 'sprite', 'sprite kind');
	eq(m.key, 't1_chimp_m', 'mini key');
	eq(m.w, 90, 'mini width at p 1');
	uninstallFakeCarArt();
});

test('missing f sprite: view f falls back to the mini sprite', () => {
	setDeviceScale(1);
	installFakeCarArt({ missing: ['t1_chimp_f'] });
	const ctx = makeCtx();
	drawModelCar(ctx, 't1_chimp', 640, 400, 2, { view: 'f' });
	ok(images(ctx)[0][0].id.indexOf('t1_chimp_m|') === 0, 'mini fallback');
	uninstallFakeCarArt();
});

test('device scale 1.6375: whole device pixels, width 200 * 3 / 1.6375, left on a device pixel', () => {
	setDeviceScale(1.6375);
	installFakeCarArt();
	const ctx = makeCtx();
	drawModelCar(ctx, 't1_chimp', 640, 400, 2, { cond: 9 });
	const img = images(ctx)[0];
	near(img[3], (200 * 3) / 1.6375, 1e-6, 'width');
	near(img[1] * 1.6375, Math.round(img[1] * 1.6375), 1e-6, 'left on a device pixel');
	uninstallFakeCarArt();
	setDeviceScale(1);
});

test('no sprites loaded: code-drawn car, no drawImage, width of the micro length', () => {
	setDeviceScale(1);
	installFakeCarArt({ missing: ['t1_chimp', 't1_chimp_m'] });
	const ctx = makeCtx();
	const r = drawModelCar(ctx, 't1_chimp', 640, 400, 2, { cond: 9 });
	eq(images(ctx).length, 0, 'no drawImage');
	eq(r.kind, 'code', 'kind code');
	ok(count(ctx, 'arc') > 0, 'drawn with arc calls');
	near(r.w, LENGTH_M.micro * 48 * 2, 1, 'width');
	uninstallFakeCarArt();
});

test('art uninstalled: code-drawn car at the same size as the measured code size', () => {
	setDeviceScale(1);
	uninstallFakeCarArt();
	const ctx = makeCtx();
	const r = drawModelCar(ctx, 't1_chimp', 640, 400, 2, {});
	eq(images(ctx).length, 0, 'no drawImage');
	eq(r.kind, 'code', 'kind code');
	near(r.w, LENGTH_M.micro * 48 * 2, 1, 'width');
	const m = measureModelCar('t1_chimp', 2, {});
	eq(m.kind, 'code', 'measure kind');
	near(m.w, r.w, 1e-9, 'measure width equals draw width');
});

test('measureModelCar draws nothing and matches the sprite size', () => {
	setDeviceScale(1);
	installFakeCarArt();
	const m = measureModelCar('t1_chimp', 2, {});
	eq(m.kind, 'sprite', 'kind');
	eq(m.key, 't1_chimp', 'key');
	eq(m.w, 400, 'w');
	eq(m.h, 140, 'h');
	eq(m.p, 2, 'p');
	uninstallFakeCarArt();
});

test('bob moves the car by exactly p between t=0 and t=0.5', () => {
	setDeviceScale(1);
	installFakeCarArt();
	const c0 = makeCtx();
	drawModelCar(c0, 't1_chimp', 640, 400, 2, { cond: 9, bob: true, t: 0 });
	const c1 = makeCtx();
	drawModelCar(c1, 't1_chimp', 640, 400, 2, { cond: 9, bob: true, t: 0.5 });
	const y0 = images(c0)[0][2];
	const y1 = images(c1)[0][2];
	eq(Math.abs(y0 - y1), 2, 'moved by p');
	uninstallFakeCarArt();
});

test('flip mirrors the car about its ground point', () => {
	setDeviceScale(1);
	installFakeCarArt();
	const ctx = makeCtx();
	drawModelCar(ctx, 't1_chimp', 640, 400, 2, { cond: 9, flip: true });
	ok(called(ctx, 'scale', [-1, 1]), 'scale(-1, 1)');
	// The anchor is ax * p = 100 * 2 = 200 px from the sprite's left edge, so
	// the mirrored rect runs from -200 to +200 around the ground point.
	ok(called(ctx, 'drawImage', [images(ctx)[0][0], -200, -140, 400, 140]), 'mirrored rect');
	uninstallFakeCarArt();
});

test('an unknown model id throws, with or without sprites', () => {
	setDeviceScale(1);
	installFakeCarArt();
	throws(() => drawModelCar(makeCtx(), 'no_such_car', 0, 0, 2, {}), 'unknown id with sprites');
	uninstallFakeCarArt();
	throws(() => drawModelCar(makeCtx(), 'no_such_car', 0, 0, 2, {}), 'unknown id without sprites');
	throws(() => measureModelCar('no_such_car', 2, {}), 'unknown id in measure');
});

setDeviceScale(1);
uninstallFakeCarArt();
done();
