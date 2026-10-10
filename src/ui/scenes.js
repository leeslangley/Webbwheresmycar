// Scene stack and app object (DESIGN.md sections 9.5, 9.7): owns the current
// screen as a stack of scenes, routes pointer/key input to the top scene,
// keeps toast messages, and is the entry point of the draw loop.
// Pure: no DOM; time comes from env.now and ctx/env are parameters.

import { PALETTE } from './theme.js';
import { panel, label } from './kit_draw.js';

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
		push: function (id, params) {
			const scene = app.scenes[id];
			if (!scene) {
				throw new Error('unknown scene ' + id);
			}
			app.stack.push({ scene: scene, enteredAt: app.now() });
			if (typeof scene.enter === 'function') {
				scene.enter(app, params);
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
		go: function (id, params) {
			for (let i = app.stack.length - 1; i >= 0; i--) {
				const scene = app.stack[i].scene;
				if (typeof scene.leave === 'function') {
					scene.leave(app);
				}
			}
			app.stack.length = 0;
			app.push(id, params);
		},
		current: function () {
			return app.stack.length > 0 ? app.stack[app.stack.length - 1].scene : null;
		},
		toast: function (text, ms) {
			const dur = ms !== undefined ? ms : 2500;
			app.toasts.push({ text: text, until: app.now() + dur });
		},
		pointer: function (type, x, y) {
			const scene = app.current();
			if (scene && typeof scene.pointer === 'function') {
				scene.pointer(app, type, x, y);
			}
		},
		key: function (k) {
			const scene = app.current();
			if (scene && typeof scene.key === 'function') {
				scene.key(app, k);
			}
		},
		draw: function (ctx, t) {
			ctx.fillStyle = PALETTE.ink;
			ctx.fillRect(0, 0, app.w, app.h);
			// Start at the top-most scene that is not an overlay, so a scene
			// under an overlay stays visible behind it. 0 when all are overlays.
			let start = 0;
			for (let i = app.stack.length - 1; i >= 0; i--) {
				if (app.stack[i].scene.overlay !== true) {
					start = i;
					break;
				}
			}
			for (let i = start; i < app.stack.length; i++) {
				const scene = app.stack[i].scene;
				if (typeof scene.draw === 'function') {
					scene.draw(ctx, app, t);
				}
			}
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
	return app;
}
