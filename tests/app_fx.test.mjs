// Tests for the screen effects wired into createApp (GU22): transitions,
// screen shake and flash, and particles. Run under `jsc -m`.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, count } from './fakectx.js';
import { createApp } from '../src/ui/scenes.js';

// A scene that logs its draw, pointer and key calls.
function fxScene(log, id) {
	return {
		id: id,
		draw: function () {
			log.push('draw ' + id);
		},
		pointer: function () {
			log.push('pointer ' + id);
		},
		key: function () {
			log.push('key ' + id);
		},
	};
}

// A test app with a mutable clock (clock.n is the time in ms).
function setup(settings) {
	const clock = { n: 0 };
	const log = [];
	const app = createApp({ now: () => clock.n, settings: settings });
	app.register(fxScene(log, 'a'));
	app.register(fxScene(log, 'b'));
	return { app: app, clock: clock, log: log };
}

// True if the ctx recorded a call with this name and exactly these args.
function hasCall(ctx, name, args) {
	for (let i = 0; i < ctx.calls.length; i++) {
		const c = ctx.calls[i];
		if (c[0] === name && JSON.stringify(c[1]) === JSON.stringify(args)) {
			return true;
		}
	}
	return false;
}

// Number of fillRect calls with the given height.
function rectsOfHeight(ctx, h) {
	let n = 0;
	for (let i = 0; i < ctx.calls.length; i++) {
		const c = ctx.calls[i];
		if (c[0] === 'fillRect' && c[1][3] === h) {
			n += 1;
		}
	}
	return n;
}

test('without a transition option go draws only the new scene, with no translate or clip', () => {
	const s = setup();
	s.app.go('a');
	const ctx = makeCtx();
	s.app.draw(ctx, 0);
	eq(s.log, ['draw a'], 'scene a drawn once');
	eq(count(ctx, 'translate'), 0, 'no translate');
	eq(count(ctx, 'clip'), 0, 'no clip');
	eq(s.app.transition, null, 'no transition set');
});

test('push with slide-left draws both scenes mid-way with translate -1120 and 160', () => {
	const s = setup();
	s.app.go('a');
	s.app.push('b', null, { transition: 'slide-left' });
	const ctx = makeCtx();
	s.clock.n = 175;
	s.app.draw(ctx, 0);
	eq(s.log, ['draw a', 'draw b'], 'a and b each drawn once');
	ok(hasCall(ctx, 'translate', [-1120, 0]), 'outgoing screen at -1120');
	ok(hasCall(ctx, 'translate', [160, 0]), 'incoming screen at 160');
});

test('slide-left is done at 400 ms: only b is drawn and transition is cleared', () => {
	const s = setup();
	s.app.go('a');
	s.app.push('b', null, { transition: 'slide-left' });
	s.clock.n = 400;
	s.log.length = 0;
	s.app.draw(makeCtx(), 0);
	eq(s.log, ['draw b'], 'only b drawn after the transition');
	eq(s.app.transition, null, 'transition cleared');
});

test('pointer during a transition does not reach the scene; after it does', () => {
	const s = setup();
	s.app.go('a');
	s.app.push('b', null, { transition: 'slide-left' });
	s.clock.n = 175;
	s.app.pointer('down', 1, 1);
	ok(s.log.indexOf('pointer b') === -1, 'b.pointer not called during transition');
	s.clock.n = 400;
	s.app.pointer('down', 1, 1);
	ok(s.log.indexOf('pointer b') !== -1, 'b.pointer called after transition');
});

test('key during a transition is ignored too', () => {
	const s = setup();
	s.app.go('a');
	s.app.push('b', null, { transition: 'fade' });
	s.clock.n = 100;
	s.app.key('Enter');
	ok(s.log.indexOf('key b') === -1, 'b.key not called during transition');
});

test('scene enterTransition is used when no opts are given', () => {
	const s = setup();
	s.app.scenes.b.enterTransition = 'fade';
	s.app.go('a');
	s.app.push('b');
	ok(s.app.transition !== null, 'transition started');
	eq(s.app.transition.tr.kind, 'fade', 'fade from the scene');
});

test('go with a transition keeps the old stack as the outgoing screen', () => {
	const s = setup();
	s.app.go('a');
	s.app.go('b', null, { transition: 'fade' });
	eq(s.app.stack.length, 1, 'only b is on the stack');
	eq(s.app.transition.from.length, 1, 'from has the old stack');
	eq(s.app.transition.from[0].scene.id, 'a', 'from holds a');
});

test('with settings.fx === false no transition starts', () => {
	const s = setup({ crt: false, sound: true, music: true, fx: false });
	s.app.go('a');
	s.app.push('b', null, { transition: 'slide-left' });
	eq(s.app.transition, null, 'no transition');
	eq(s.app.current().id, 'b', 'b is still pushed');
});

test('static transition goes through drawStaticWipe: 32x32 cells at u 0.25', () => {
	const s = setup();
	s.app.go('a');
	s.app.push('b', null, { transition: 'static' });
	const ctx = makeCtx();
	s.clock.n = 100;
	s.app.draw(ctx, 0);
	let cells = 0;
	for (let i = 0; i < ctx.calls.length; i++) {
		const c = ctx.calls[i];
		if (c[0] === 'fillRect' && c[1][2] === 32 && c[1][3] === 32) {
			cells += 1;
		}
	}
	ok(cells > 0, 'static cells drawn');
	eq(s.log, ['draw a'], 'before the midpoint only the outgoing scene is drawn');
});

test('pageturn transition goes through drawPageTurn: one scale call at u 0.25', () => {
	const s = setup();
	s.app.go('a');
	s.app.push('b', null, { transition: 'pageturn' });
	const ctx = makeCtx();
	s.clock.n = 80;
	s.app.draw(ctx, 0);
	eq(count(ctx, 'scale'), 1, 'one scale call for the turning page');
});

test('disaster flashes red over the whole screen including the overdraw', () => {
	const s = setup();
	s.app.go('a');
	s.app.disaster();
	const ctx = makeCtx();
	s.app.draw(ctx, 0);
	let fill = null;
	let found = false;
	for (let i = 0; i < ctx.calls.length; i++) {
		const c = ctx.calls[i];
		if (c[0] === 'set:fillStyle') {
			fill = c[1][0];
		}
		if (c[0] === 'fillRect' && JSON.stringify(c[1]) === '[-144,0,1568,720]') {
			found = true;
			ok(String(fill).indexOf('rgba(217,72,59,') === 0, 'flash colour is red, got ' + fill);
			break;
		}
	}
	ok(found, 'flash fillRect [-144,0,1568,720] drawn');
});

test('burst confetti draws 5 confetti rects at n 0 and again at n 100', () => {
	const s = setup();
	s.app.go('a');
	s.app.burst('confetti', 100, 100, 5);
	const ctx = makeCtx();
	s.app.draw(ctx, 0);
	eq(rectsOfHeight(ctx, 6), 5, 'five confetti rects at n 0');
	const ctx2 = makeCtx();
	s.clock.n = 100;
	s.app.draw(ctx2, 0);
	eq(rectsOfHeight(ctx2, 6), 5, 'five confetti rects at n 100');
});

test('particle physics per draw is capped at 100 ms', () => {
	const s = setup();
	s.app.go('a');
	s.app.burst('smoke', 100, 100, 1);
	s.app.draw(makeCtx(), 0);
	s.clock.n = 5000;
	s.app.draw(makeCtx(), 0);
	eq(s.app.particles.list.length, 1, 'particle still alive');
	eq(s.app.particles.list[0].age, 100, 'age advanced by the 100 ms cap only');
});

done();
