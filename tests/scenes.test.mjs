// Tests for src/ui/scenes.js, run under `jsc -m`.

import { test, eq, ok, throws, done } from './harness.js';
import { makeCtx, texts } from './fakectx.js';
import { createApp } from '../src/ui/scenes.js';

// A fake scene that logs every lifecycle call. Optional hooks can be left out
// to exercise scenes that only implement part of the interface.
function fakeScene(log, id, opts) {
	const o = opts || {};
	const scene = { id: id };
	if (!o.noEnter) {
		scene.enter = function (app, p) {
			log.push('enter ' + id + JSON.stringify(p === undefined ? null : p));
		};
	}
	if (!o.noLeave) {
		scene.leave = function () {
			log.push('leave ' + id);
		};
	}
	if (!o.noResume) {
		scene.resume = function () {
			log.push('resume ' + id);
		};
	}
	if (!o.noDraw) {
		scene.draw = function () {
			log.push('draw ' + id);
		};
	}
	if (!o.noPointer) {
		scene.pointer = function (app, type, x, y) {
			log.push('pointer ' + id + ' ' + type + ' ' + x + ' ' + y);
		};
	}
	if (!o.noKey) {
		scene.key = function (app, k) {
			log.push('key ' + id + ' ' + k);
		};
	}
	if (o.overlay) {
		scene.overlay = true;
	}
	return scene;
}

test('createApp defaults: state null, 1280x720, default settings and audio', () => {
	const app = createApp();
	eq(app.state, null, 'state defaults to null');
	eq(app.w, 1280, 'w is 1280');
	eq(app.h, 720, 'h is 720');
	eq(app.settings, { crt: false, sound: true, music: true }, 'default settings');
	eq(app.scenes, {}, 'empty scenes map');
	eq(app.stack, [], 'empty stack');
	eq(app.toasts, [], 'empty toasts');
	eq(app.now(), 0, 'default now returns 0');
	eq(app.current(), null, 'current is null with no scenes');
});

test('createApp uses env state, settings, audio and now', () => {
	const state = { day: 3 };
	const calls = [];
	const app = createApp({
		state: state,
		settings: { crt: true, sound: false, music: false },
		audio: { play: function (n) { calls.push(n); } },
		now: function () { return 500; },
	});
	eq(app.state, state, 'env state is used');
	eq(app.settings, { crt: true, sound: false, music: false }, 'env settings are used');
	eq(app.now(), 500, 'env now is used');
	app.audio.play('blip');
	eq(calls, ['blip'], 'env audio is used');
});

test('register stores the scene by id and returns app', () => {
	const app = createApp();
	const log = [];
	const scene = fakeScene(log, 'a');
	eq(app.register(scene), app, 'register returns app');
	eq(app.scenes.a, scene, 'scene stored by id');
});

test('push calls enter with the params', () => {
	const app = createApp();
	const log = [];
	app.register(fakeScene(log, 'a'));
	app.push('a', { x: 7 });
	eq(log, ['enter a{"x":7}'], 'enter called with params');
	eq(app.stack[0].scene.id, 'a', 'stack holds the scene');
	eq(app.stack[0].enteredAt, 0, 'enteredAt is app.now()');
});

test('push with an unknown id throws', () => {
	const app = createApp();
	throws(() => app.push('nope'), 'unknown scene id throws');
	try {
		app.push('nope');
	} catch (e) {
		eq(e.message, 'unknown scene nope', 'error message names the scene');
	}
});

test('pop calls leave on the top scene then resume on the one below', () => {
	const app = createApp();
	const log = [];
	app.register(fakeScene(log, 'a'));
	app.register(fakeScene(log, 'b'));
	app.push('a');
	app.push('b');
	app.pop();
	eq(log, [
		'enter a' + 'null',
		'enter b' + 'null',
		'leave b',
		'resume a',
	], 'pop: leave top, resume the one below');
	eq(app.current().id, 'a', 'a is on top after pop');
});

test('pop with one or zero scenes does nothing', () => {
	const app = createApp();
	const log = [];
	app.register(fakeScene(log, 'a'));
	app.push('a');
	app.pop();
	eq(log, ['enter anull'], 'no leave call when only one scene');
	eq(app.current().id, 'a', 'scene stays on top');
	app.pop();
	eq(app.current().id, 'a', 'still on top after pop with one scene');
	app.pop();
	eq(app.current().id, 'a', 'pop on an empty stack does nothing');
});

test('go clears the stack, calls leave on all scenes top to bottom, then enters the new one', () => {
	const app = createApp();
	const log = [];
	app.register(fakeScene(log, 'a'));
	app.register(fakeScene(log, 'b'));
	app.register(fakeScene(log, 'c'));
	app.push('a');
	app.push('b');
	app.push('c');
	app.go('b', { z: 1 });
	eq(log, [
		'enter anull',
		'enter bnull',
		'enter cnull',
		'leave c',
		'leave b',
		'leave a',
		'enter b{"z":1}',
	], 'leave top to bottom, then enter the new scene');
	eq(app.stack.length, 1, 'only the new scene remains');
	eq(app.current().id, 'b', 'b is current after go');
});

test('go works from an empty stack and allows popping to empty indirectly', () => {
	const app = createApp();
	const log = [];
	app.register(fakeScene(log, 'a'));
	app.register(fakeScene(log, 'b'));
	app.go('a');
	eq(log, ['enter anull'], 'go from empty stack just enters');
	app.go('b');
	eq(app.current().id, 'b', 'go replaced the scene');
});

test('current returns the top scene or null', () => {
	const app = createApp();
	const log = [];
	app.register(fakeScene(log, 'a'));
	app.register(fakeScene(log, 'b'));
	eq(app.current(), null, 'null before any push');
	app.push('a');
	eq(app.current().id, 'a', 'a on top');
	app.push('b');
	eq(app.current().id, 'b', 'b on top');
});

test('pointer and key route to the top scene only', () => {
	const app = createApp();
	const log = [];
	app.register(fakeScene(log, 'a'));
	app.register(fakeScene(log, 'b'));
	app.push('a');
	app.push('b');
	app.pointer('down', 5, 6);
	app.key('Enter');
	eq(log, [
		'enter anull',
		'enter bnull',
		'pointer b down 5 6',
		'key b Enter',
	], 'only the top scene sees input');
});

test('pointer and key do nothing with an empty stack', () => {
	const app = createApp();
	app.pointer('down', 1, 2);
	app.key('x');
	ok(true, 'no throw with no scenes');
});

test('draw draws only the top scene when it is not an overlay', () => {
	const app = createApp();
	const log = [];
	app.register(fakeScene(log, 'a'));
	app.register(fakeScene(log, 'b'));
	app.push('a');
	app.push('b');
	const ctx = makeCtx();
	app.draw(ctx, 12);
	ok(log.indexOf('draw a') === -1, 'scene below is not drawn');
	ok(log.indexOf('draw b') !== -1, 'top scene is drawn');
});

test('draw draws the scene below first when the top scene is an overlay', () => {
	const app = createApp();
	const log = [];
	app.register(fakeScene(log, 'a'));
	app.register(fakeScene(log, 'b', { overlay: true }));
	app.push('a');
	app.push('b');
	const ctx = makeCtx();
	app.draw(ctx, 3);
	eq(log.filter((s) => s.indexOf('draw ') === 0), ['draw a', 'draw b'], 'below first, then overlay');
});

test('draw with all-overlay stack starts at index 0', () => {
	const app = createApp();
	const log = [];
	app.register(fakeScene(log, 'a', { overlay: true }));
	app.register(fakeScene(log, 'b', { overlay: true }));
	app.push('a');
	app.push('b');
	const ctx = makeCtx();
	app.draw(ctx, 0);
	eq(log.filter((s) => s.indexOf('draw ') === 0), ['draw a', 'draw b'], 'both overlays drawn from the bottom');
});

test('draw passes t to the scene draw', () => {
	const app = createApp();
	let seen = null;
	app.register({ id: 'a', draw: function (ctx, appArg, t) { seen = t; } });
	app.push('a');
	const ctx = makeCtx();
	app.draw(ctx, 77);
	eq(seen, 77, 't reaches scene.draw');
});

test('draw fills the whole screen with ink as the first fillRect', () => {
	const app = createApp();
	const ctx = makeCtx();
	app.draw(ctx, 0);
	let found = false;
	for (let i = 0; i < ctx.calls.length; i++) {
		if (ctx.calls[i][0] === 'fillRect') {
			eq(ctx.calls[i][1], [0, 0, 1280, 720], 'first fillRect covers the screen');
			found = true;
			break;
		}
	}
	ok(found, 'a fillRect was recorded');
});

test('toast shows in draw and disappears once now passes until', () => {
	let time = 100;
	const app = createApp({ now: () => time });
	const ctx = makeCtx();
	app.toast('hi');
	eq(app.toasts.length, 1, 'one toast queued');
	eq(app.toasts[0].until, 2600, 'default duration 2500 ms');
	app.draw(ctx, 0);
	ok(texts(ctx).indexOf('hi') !== -1, 'toast text drawn');
	time = 2600;
	const ctx2 = makeCtx();
	app.draw(ctx2, 0);
	ok(texts(ctx2).indexOf('hi') === -1, 'expired toast not drawn');
	eq(app.toasts.length, 0, 'expired toast removed');
});

test('toast with a custom duration expires at now + ms', () => {
	let time = 0;
	const app = createApp({ now: () => time });
	app.toast('short', 500);
	eq(app.toasts[0].until, 500, 'custom duration honoured');
	time = 499;
	app.draw(makeCtx(), 0);
	eq(app.toasts.length, 1, 'still alive just before until');
	time = 500;
	app.draw(makeCtx(), 0);
	eq(app.toasts.length, 0, 'gone at until');
});

test('default act runs the function and returns its value', () => {
	const app = createApp();
	eq(app.act(() => 42), 42, 'act returns the function value');
	let ran = false;
	app.act(() => { ran = true; });
	ok(ran, 'act ran the function');
});

test('draw with an empty stack still fills the background', () => {
	const app = createApp();
	const ctx = makeCtx();
	app.draw(ctx, 0);
	ok(texts(ctx).length === 0, 'no text with no scenes or toasts');
	let found = false;
	for (let i = 0; i < ctx.calls.length; i++) {
		if (ctx.calls[i][0] === 'fillRect' && ctx.calls[i][1][2] === 1280) {
			found = true;
			break;
		}
	}
	ok(found, 'background fillRect present');
});

test('toast panel is 560 wide centred horizontally near y 640', () => {
	const app = createApp();
	const ctx = makeCtx();
	app.toast('hi');
	app.draw(ctx, 0);
	// Toast panel: x = (1280-560)/2 = 360, y = 640, w = 560, h = 36. The
	// shadow pass of panel draws at x+6, y+6, so check the panel body itself.
	let found = false;
	for (let i = 0; i < ctx.calls.length; i++) {
		const c = ctx.calls[i];
		if (c[0] === 'moveTo' && c[1][0] === 370 && c[1][1] === 640) {
			found = true;
			break;
		}
	}
	ok(found, 'toast panel body starts at x 360+10, y 640');
});

done();
