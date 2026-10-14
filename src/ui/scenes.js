// Scene stack and app object (DESIGN.md sections 9.5, 9.7): owns the current
// screen as a stack of scenes, routes pointer/key input to the top scene,
// keeps toast messages, and is the entry point of the draw loop.
// Pure: no DOM; time comes from env.now and ctx/env are parameters.

import { PALETTE } from './theme.js';
import { panel, label } from './kit_draw.js';
import { MOTION } from './tokens.js';
import { makeTransition, transDone, drawTransition } from './transitions.js';
import { drawStaticWipe, drawPageTurn } from './transitions2.js';
import { makeScreenFx, fxBegin, fxEnd, fxShake, fxFlash, fxDisaster, fxGood } from './screenfx.js';
import { makeParticles, emit, updateParticles, drawParticles } from './particles.js';

// Transition kinds from transitions2.js. makeTransition does not know them,
// so their timing is built here from MOTION (static 400 ms, page 320 ms).
function newTransition(kind, nowMs) {
	if (kind === 'static') {
		return { kind: kind, start: nowMs, dur: MOTION.static };
	}
	if (kind === 'pageturn') {
		return { kind: kind, start: nowMs, dur: MOTION.page };
	}
	return makeTransition(kind, nowMs);
}

// Transition kind for a push or go: opts.transition wins when it is given,
// otherwise the scene's enterTransition (undefined for most scenes).
function pickKind(scene, opts) {
	if (opts && opts.transition !== undefined) {
		return opts.transition;
	}
	return scene ? scene.enterTransition : undefined;
}

export function createApp(env = {}) {
	env = env || {};
	const nowFn = env.now !== undefined ? env.now : function () { return 0; };
	const app = {
		state: env.state !== undefined ? env.state : null,
		w: 1280,
		h: 720,
		settings: env.settings !== undefined ? env.settings : { crt: false, sound: true, music: true },
		audio: env.audio !== undefined ? env.audio : { play: function () {} },
		scenes: {},
		stack: [],
		toasts: [],
		fx: makeScreenFx(),
		particles: makeParticles(1),
		// { tr, from } while a transition runs: tr is the timing, from the
		// stack that is leaving. null when no transition is running.
		transition: null,
		_lastDraw: null,
		now: function () {
			return nowFn();
		},
		// The game flow card replaces this; default just runs the function.
		act: function (fn) {
			return fn();
		},
		register: function (scene) {
			app.scenes[scene.id] = scene;
			return app;
		},
		push: function (id, params, opts) {
			const scene = app.scenes[id];
			if (!scene) {
				throw new Error('unknown scene ' + id);
			}
			const tr = transitionFor(pickKind(scene, opts));
			const from = tr !== null ? app.stack.slice() : null;
			app.stack.push({ scene: scene, enteredAt: app.now() });
			if (typeof scene.enter === 'function') {
				scene.enter(app, params);
			}
			if (tr !== null) {
				app.transition = { tr: tr, from: from };
			}
		},
		pop: function () {
			// Only `go` may empty the stack; pop needs a scene left underneath.
			if (app.stack.length < 2) {
				return;
			}
			const top = app.stack.pop();
			if (typeof top.scene.leave === 'function') {
				top.scene.leave(app);
			}
			const under = app.stack[app.stack.length - 1];
			if (under && typeof under.scene.resume === 'function') {
				under.scene.resume(app);
			}
		},
		go: function (id, params, opts) {
			const tr = transitionFor(pickKind(app.scenes[id], opts));
			const from = tr !== null ? app.stack.slice() : null;
			for (let i = app.stack.length - 1; i >= 0; i--) {
				const scene = app.stack[i].scene;
				if (typeof scene.leave === 'function') {
					scene.leave(app);
				}
			}
			app.stack.length = 0;
			// Null means no transition here; go sets it below from the copy.
			app.push(id, params, { transition: null });
			if (tr !== null) {
				app.transition = { tr: tr, from: from };
			}
		},
		current: function () {
			return app.stack.length > 0 ? app.stack[app.stack.length - 1].scene : null;
		},
		toast: function (text, ms) {
			const dur = ms !== undefined ? ms : 2500;
			app.toasts.push({ text: text, until: app.now() + dur });
		},
		pointer: function (type, x, y) {
			if (transitionRunning()) {
				return;
			}
			const scene = app.current();
			if (scene && typeof scene.pointer === 'function') {
				scene.pointer(app, type, x, y);
			}
		},
		key: function (k) {
			if (transitionRunning()) {
				return;
			}
			const scene = app.current();
			if (scene && typeof scene.key === 'function') {
				scene.key(app, k);
			}
		},
		shake: function (mag, ms) {
			fxShake(app.fx, mag, ms, app.now());
		},
		flash: function (color, ms) {
			fxFlash(app.fx, color, ms, app.now());
		},
		disaster: function () {
			fxDisaster(app.fx, app.now());
		},
		good: function () {
			fxGood(app.fx, app.now());
		},
		burst: function (kind, x, y, n) {
			emit(app.particles, kind, x, y, n);
		},
		draw: function (ctx, t) {
			ctx.fillStyle = PALETTE.ink;
			ctx.fillRect(0, 0, app.w, app.h);
			const now = app.now();
			// Simulation step for particles: time since the last draw, at most 100 ms.
			const dt = app._lastDraw === null ? 0 : Math.min(100, now - app._lastDraw);
			app._lastDraw = now;
			fxBegin(ctx, app.fx, now);
			if (app.transition !== null && transDone(app.transition.tr, now)) {
				app.transition = null;
			}
			if (app.transition !== null) {
				const run = app.transition;
				const drawFrom = function () {
					drawStack(run.from, ctx, t);
				};
				const drawTo = function () {
					drawStack(app.stack, ctx, t);
				};
				if (run.tr.kind === 'static') {
					drawStaticWipe(ctx, run.tr, now, drawFrom, drawTo, app.w, app.h);
				} else if (run.tr.kind === 'pageturn') {
					drawPageTurn(ctx, run.tr, now, drawFrom, drawTo, app.w, app.h);
				} else {
					drawTransition(ctx, run.tr, now, drawFrom, drawTo, app.w, app.h);
				}
			} else {
				drawStack(app.stack, ctx, t);
			}
			updateParticles(app.particles, dt);
			drawParticles(ctx, app.particles);
			fxEnd(ctx, app.fx, now);
			// Drop expired toasts, then draw the rest stacked upward from y 640.
			const nowMs = app.now();
			const live = [];
			for (let i = 0; i < app.toasts.length; i++) {
				if (app.toasts[i].until > nowMs) {
					live.push(app.toasts[i]);
				}
			}
			app.toasts = live;
			for (let i = 0; i < live.length; i++) {
				const y = 640 - i * 44;
				panel(ctx, (app.w - 560) / 2, y, 560, 36);
				label(ctx, live[i].text, app.w / 2, y + 4, { size: 28, align: 'center' });
			}
		},
	};

	// A transition starts only for a string kind, and not when settings.fx is false.
	function transitionFor(kind) {
		if (typeof kind !== 'string' || (app.settings && app.settings.fx === false)) {
			return null;
		}
		return newTransition(kind, app.now());
	}

	// True while a transition is set and its time has not run out yet.
	function transitionRunning() {
		return app.transition !== null && !transDone(app.transition.tr, app.now());
	}

	// Draw a stack array. Start at the top-most scene that is not an overlay,
	// so a scene under an overlay stays visible behind it. 0 when all are overlays.
	function drawStack(list, ctx, t) {
		let start = 0;
		for (let i = list.length - 1; i >= 0; i--) {
			if (list[i].scene.overlay !== true) {
				start = i;
				break;
			}
		}
		for (let i = start; i < list.length; i++) {
			const scene = list[i].scene;
			if (typeof scene.draw === 'function') {
				scene.draw(ctx, app, t);
			}
		}
	}

	return app;
}
