// Tests for src/art/characters.js (the re-export module), run under macOS
// `jsc -m`.

import { test, eq, ok } from './harness.js';
import { makeCtx, count } from './fakectx.js';
import {
	drawMark,
	drawMarkBody,
	drawMarkHead,
	drawDave,
	speechBubble,
} from '../src/art/characters.js';

test('all five exports are functions', () => {
	eq(typeof drawMark, 'function', 'drawMark is a function');
	eq(typeof drawMarkBody, 'function', 'drawMarkBody is a function');
	eq(typeof drawMarkHead, 'function', 'drawMarkHead is a function');
	eq(typeof drawDave, 'function', 'drawDave is a function');
	eq(typeof speechBubble, 'function', 'speechBubble is a function');
});

test('combined scene on one ctx: no throw, save/restore balanced', () => {
	const ctx = makeCtx();
	let threw = null;
	try {
		drawMark(ctx, 740, 440, 1, 1.0, 'happy', 'hoodie');
		drawDave(ctx, 1048, 510, 1, 1.0);
		speechBubble(ctx, { x: 900, y: 200, w: 300, h: 90 }, 'Boss, the kettle has a plan.', 1.0);
	} catch (e) {
		threw = e;
	}
	eq(threw, null, 'combined scene does not throw');
	eq(count(ctx, 'save'), count(ctx, 'restore'), 'save/restore balanced');
	ok(ctx.calls.length > 0, 'something was drawn');
});
