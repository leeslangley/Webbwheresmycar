// Tests for boot.js (DESIGN.md 9.5, 9.7): boot wires the fake window and
// canvas to the app, draws the placeholder title, routes pointer/key input
// and re-applies layout on resize. Runs under macOS `jsc -m`.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, texts } from './fakectx.js';
import { bootGame } from '../src/boot.js';

function makeWindow(innerWidth, innerHeight) {
	return {
		innerWidth: innerWidth,
		innerHeight: innerHeight,
		devicePixelRatio: 1,
		handlers: {},
		raf: [],
		addEventListener: function (name, fn) {
			(this.handlers[name] = this.handlers[name] || []).push(fn);
		},
		requestAnimationFrame: function (fn) {
			this.raf.push(fn);
			return this.raf.length;
		},
		performance: { now: function () { return 0; } },
	};
}

function makeCanvas() {
	const ctx = makeCtx();
	return {
		style: {},
		width: 0,
		height: 0,
		handlers: {},
		addEventListener: function (name, fn) {
			(this.handlers[name] = this.handlers[name] || []).push(fn);
		},
		getContext: function () { return ctx; },
		ctx: ctx,
	};
}

function makeDocument(canvas, extra) {
	const doc = {
		getElementById: function (id) {
			return id === 'game' ? canvas : null;
		},
	};
	if (arguments.length > 1) {
		doc.fonts = arguments[1];
	}
	return doc;
}

function makeEvent(clientX, clientY) {
	let prevented = false;
	return {
		clientX: clientX,
		clientY: clientY,
		prevented: function () { return prevented; },
		preventDefault: function () { prevented = true; },
	};
}

// Boot once with a 1280x720 fake window and reuse it in several tests.
const win = makeWindow(1280, 720);
const canvas = makeCanvas();
const boot = bootGame({ window: win, document: makeDocument(canvas), storage: null });

test('bootGame returns an object with app and getLayout', () => {
	ok(boot && typeof boot === 'object', 'boot is an object');
	ok(boot.app, 'boot.app exists');
	ok(typeof boot.getLayout === 'function', 'getLayout is a function');
	eq(boot.getLayout().layout.scale, 1, 'layout scale at 1280x720');
});

test('the title scene is registered and current', () => {
	ok(boot.app.scenes.title, 'title scene registered');
	eq(boot.app.current().id, 'title', 'current scene id');
});

test('the first RAF callback draws the title texts and schedules the next frame', () => {
	eq(win.raf.length, 1, 'one frame scheduled at boot');
	win.raf[0](16);
	const t = texts(canvas.ctx);
	ok(t.indexOf('WEBB,') >= 0, 'title text drawn');
	ok(t.indexOf("WHERE'S MY CAR?") >= 0, 'subtitle text drawn');
	ok(t.indexOf("A WEBB'S WHEELS PRODUCTION") >= 0, 'production line drawn');
	eq(win.raf.length, 2, 'next frame scheduled');
});

test('canvas pointer events reach app.pointer with logical coords and types', () => {
	const got = [];
	boot.app.scenes.title.pointer = function (app, type, x, y) {
		got.push([type, x, y]);
	};
	const e = makeEvent(640, 360);
	canvas.handlers.pointerdown[0](e);
	eq(JSON.stringify(got), JSON.stringify([['down', 640, 360]]), 'down at 640,360');
	ok(e.prevented(), 'preventDefault called');
	canvas.handlers.pointermove[0](makeEvent(100, 100));
	canvas.handlers.pointerup[0](makeEvent(100, 100));
	canvas.handlers.pointercancel[0](makeEvent(100, 100));
	eq(JSON.stringify(got), JSON.stringify([
		['down', 640, 360], ['move', 100, 100], ['up', 100, 100], ['up', 100, 100],
	]), 'move/up then cancel-as-up');
});

test('a pointer event in the letterbox area is ignored', () => {
	const win2 = makeWindow(2000, 720);
	const canvas2 = makeCanvas();
	const boot2 = bootGame({ window: win2, document: makeDocument(canvas2), storage: null });
	const got = [];
	boot2.app.scenes.title.pointer = function (app, type, x, y) {
		got.push([type, x, y]);
	};
	// 2000x720 is height-limited: scale 1, a 1280px view centred at offX 360,
	// so x 10 is deep in the left bar.
	canvas2.handlers.pointerdown[0](makeEvent(10, 360));
	eq(got.length, 0, 'letterbox pointer ignored');
	// A point inside the view still gets through.
	canvas2.handlers.pointerdown[0](makeEvent(1000, 360));
	eq(JSON.stringify(got), JSON.stringify([['down', 640, 360]]), 'in-view pointer routed');
});

test('window keydown routes the key to the current scene', () => {
	const got = [];
	boot.app.scenes.title.key = function (app, k) {
		got.push(k);
	};
	win.handlers.keydown[0]({ key: 'Enter' });
	eq(JSON.stringify(got), JSON.stringify(['Enter']), 'key routed');
});

test('resize re-applies the layout from the new window size', () => {
	eq(canvas.style.width, '1280px', 'width before resize');
	win.innerWidth = 2000;
	win.handlers.resize[0]();
	eq(canvas.style.width, '1280px', '2000x720 is height-limited, view stays 1280px');
	eq(boot.getLayout().layout.offX, 360, 'new offX via getLayout');
	win.innerWidth = 640;
	win.handlers.resize[0]();
	eq(canvas.style.width, '640px', 'width shrinks when innerWidth shrinks');
	eq(boot.getLayout().layout.offX, 0, 'no side bars at 640x720');
	// The frame loop now draws through the refreshed layout context.
	win.raf[1](32);
	eq(win.raf.length, 3, 'loop keeps running after resize');
	win.innerWidth = 1280;
	win.handlers.resize[0]();
	eq(canvas.style.width, '1280px', 'width restored');
});

test('orientationchange re-applies the layout too', () => {
	ok(win.handlers.orientationchange.length >= 1, 'orientationchange listener registered');
	win.innerWidth = 844;
	win.innerHeight = 390;
	win.handlers.orientationchange[0]();
	eq(canvas.style.width, String(1280 * (390 / 720)) + 'px', 'iPhone landscape width');
	win.innerWidth = 1280;
	win.innerHeight = 720;
	win.handlers.orientationchange[0]();
});

test('booting is tolerant of every fonts shape', () => {
	const cases = [undefined, {}, {
		load: function () {
			throw new Error('font load blew up');
		},
	}];
	for (let i = 0; i < cases.length; i++) {
		const w = makeWindow(1280, 720);
		const c = makeCanvas();
		const b = bootGame({ window: w, document: makeDocument(c, cases[i]), storage: null });
		eq(b.app.current().id, 'title', 'case ' + i + ' booted');
		w.raf[0](16);
		ok(texts(c.ctx).indexOf('WEBB,') >= 0, 'case ' + i + ' still draws');
	}
});

done();
