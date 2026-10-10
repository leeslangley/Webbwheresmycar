// Tests for src/art/speech.js, run under `jsc -m`.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, texts, count, lastSet } from './fakectx.js';
import { speechBubble } from '../src/art/speech.js';
import { PALETTE, font } from '../src/ui/theme.js';

// fakectx measureText: width = chars * 0.6 * px of the current font. With
// the 26px body font that is 15.6px per character, so a rect.w of 300 gives
// an inner width of 276px and 17 characters fit per line (15.6 * 17 = 265.2).
const RECT = { x: 100, y: 200, w: 300, h: 120 };

// styleAtStroke(ctx, i): the strokeStyle in force at the i-th 'stroke' call.
function styleAtStroke(ctx, i) {
	let style;
	let seen = 0;
	for (let k = 0; k < ctx.calls.length; k++) {
		const c = ctx.calls[k];
		if (c[0] === 'set:strokeStyle') {
			style = c[1][0];
		} else if (c[0] === 'stroke') {
			if (seen === i) {
				return style;
			}
			seen += 1;
		}
	}
	return undefined;
}

test('short text draws exactly one text line containing it', () => {
	const ctx = makeCtx();
	speechBubble(ctx, RECT, 'Boss, tea?', 0);
	const out = texts(ctx);
	eq(out, ['Boss, tea?'], 'one line with the whole text');
});

test('single line is drawn at the inner top-left of the bubble', () => {
	const ctx = makeCtx();
	speechBubble(ctx, RECT, 'Boss, tea?', 0);
	const ft = ctx.calls.filter(function (c) { return c[0] === 'fillText'; })[0];
	eq(ft[1], ['Boss, tea?', RECT.x + 12, RECT.y + 10], 'x + 12, y + 10 at t = 0');
});

test('body 26px font, ink colour, left/top alignment', () => {
	const ctx = makeCtx();
	speechBubble(ctx, RECT, 'Boss, tea?', 0);
	eq(lastSet(ctx, 'font'), font('body', 26), 'body font at 26px');
	eq(lastSet(ctx, 'textAlign'), 'left', 'left aligned');
	eq(lastSet(ctx, 'textBaseline'), 'top', 'top baseline');
	ok(lastSet(ctx, 'fillStyle') === PALETTE.ink, 'text filled ink');
});

test('long text wraps to at most 3 lines and the last ends with ...', () => {
	const ctx = makeCtx();
	const long = 'car '.repeat(50); // 200 characters of repeated words
	speechBubble(ctx, RECT, long, 0);
	const out = texts(ctx);
	ok(out.length <= 3, 'at most 3 lines, got ' + out.length);
	ok(out.length > 0, 'some text drawn');
	ok(out[out.length - 1].slice(-3) === '...', 'last line ends with ...');
});

test('text wrapping into exactly 3 lines is not truncated', () => {
	const ctx = makeCtx();
	// Three 15-character words: 15 chars fit alone (234px <= 276px) but two
	// words plus the space do not (31 chars = 483.6px > 276px), so the text
	// wraps into exactly 3 lines.
	const words = ['a'.repeat(15), 'b'.repeat(15), 'c'.repeat(15)];
	speechBubble(ctx, RECT, words.join(' '), 0);
	const out = texts(ctx);
	eq(out, words, 'three full lines, no truncation');
	for (let i = 0; i < out.length; i++) {
		ok(out[i].indexOf('...') === -1, 'line ' + i + ' has no ellipsis');
	}
});

test('save and restore are balanced', () => {
	const ctx = makeCtx();
	speechBubble(ctx, RECT, 'Boss, tea?', 0);
	eq(count(ctx, 'save'), count(ctx, 'restore'), 'save/restore balanced');
});

test('the first stroke uses the ink colour', () => {
	const ctx = makeCtx();
	speechBubble(ctx, RECT, 'Boss, tea?', 0);
	ok(count(ctx, 'stroke') > 0, 'at least one stroke');
	eq(styleAtStroke(ctx, 0), PALETTE.ink, 'first stroke is ink');
});

test('bubble is filled white and stroked ink, lineWidth 3', () => {
	const ctx = makeCtx();
	speechBubble(ctx, RECT, 'Boss, tea?', 0);
	eq(count(ctx, 'fill'), 2, 'bubble and tail fills');
	eq(count(ctx, 'stroke'), 2, 'bubble outline plus the two tail edges in one path');
	ok(lastSet(ctx, 'lineWidth') === 3, 'lineWidth 3');
});

test('bubble bobs with t but the text content is identical', () => {
	const a = makeCtx();
	speechBubble(a, RECT, 'Boss, tea?', 0);
	const b = makeCtx();
	speechBubble(b, RECT, 'Boss, tea?', 0.4);
	ok(JSON.stringify(a.calls) !== JSON.stringify(b.calls), 'logs differ at t = 0 vs 0.4');
	eq(texts(a), texts(b), 'same text content');
});

test('empty text still draws the bubble and no text lines', () => {
	const ctx = makeCtx();
	speechBubble(ctx, RECT, '', 0);
	eq(texts(ctx).length, 0, 'no fillText/strokeText calls');
	eq(count(ctx, 'fill'), 2, 'bubble and tail still filled');
	eq(count(ctx, 'stroke'), 2, 'outline and tail edges still stroked');
	eq(count(ctx, 'save'), count(ctx, 'restore'), 'save/restore balanced');
});

test('whitespace-only text draws no lines', () => {
	const ctx = makeCtx();
	speechBubble(ctx, { x: 0, y: 0, w: 300, h: 120 }, '   ', 0);
	eq(texts(ctx).length, 0, 'no lines for whitespace-only text');
});

test('tiny rect (inner width 0) terminates and still draws the bubble', () => {
	const ctx = makeCtx();
	speechBubble(ctx, { x: 0, y: 0, w: 24, h: 120 }, 'a b c', 0);
	eq(count(ctx, 'fill'), 2, 'bubble drawn');
	ok(texts(ctx).length >= 1, 'hard-broken lines drawn');
});

test('one very long word stays one line, no hang', () => {
	const ctx = makeCtx();
	speechBubble(ctx, RECT, 'w'.repeat(200), 0);
	eq(texts(ctx).length, 1, 'single word is hard-broken onto one line');
});

test('null text does not crash', () => {
	const ctx = makeCtx();
	speechBubble(ctx, RECT, null, 0);
	eq(count(ctx, 'fill'), 2, 'bubble still drawn');
});

done();
