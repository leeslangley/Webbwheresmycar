// Tests for ui/panels2.js (GU05): chunky frames, paper grain, wood planks and
// enamel signs. Runs under macOS `jsc -m`.

import { test, eq, ok, done } from './harness.js';
import { makeCtx, count, reset } from './fakectx.js';
import { COLOR } from '../src/ui/tokens.js';
import { chunkyRect, chunkyPanel, grain, paperPanel, woodPanel, enamelSign } from '../src/ui/panels2.js';

// All fillRect calls as [x, y, w, h] arrays, in order.
function rects(ctx) {
	const out = [];
	for (let i = 0; i < ctx.calls.length; i++) {
		if (ctx.calls[i][0] === 'fillRect') {
			out.push(ctx.calls[i][1]);
		}
	}
	return out;
}

// fillRect calls with the fillStyle that was active when they ran.
function rectsWithStyle(ctx) {
	const out = [];
	let style;
	for (let i = 0; i < ctx.calls.length; i++) {
		const c = ctx.calls[i];
		if (c[0] === 'set:fillStyle') {
			style = c[1][0];
		} else if (c[0] === 'fillRect') {
			out.push({ style: style, r: c[1] });
		}
	}
	return out;
}

// True if the rect [x, y, w, h] lies inside [x0, x1] x [y0, y1].
function insideBox(r, x0, y0, x1, y1) {
	return r[0] >= x0 && r[1] >= y0 && r[0] + r[2] <= x1 && r[1] + r[3] <= y1;
}

test('chunkyRect draws three fillRects in order', () => {
	const ctx = makeCtx();
	chunkyRect(ctx, 10, 10, 100, 50, '#f00', 3);
	const r = rects(ctx);
	eq(r.length, 3, 'three fillRects');
	eq(r[0], [13, 10, 94, 50], 'first rect');
	eq(r[1], [10, 13, 100, 44], 'second rect');
	eq(r[2], [11, 11, 98, 48], 'third rect');
});

test('chunkyRect sets fillStyle once to the fill colour', () => {
	const ctx = makeCtx();
	chunkyRect(ctx, 0, 0, 40, 40, '#abcdef', 3);
	eq(count(ctx, 'set:fillStyle'), 1, 'one fillStyle set');
	eq(ctx.props.fillStyle, '#abcdef', 'fill colour');
});

test('chunkyPanel draws 13 fillRects with the shadow first', () => {
	const ctx = makeCtx();
	chunkyPanel(ctx, 10, 20, 100, 60);
	const r = rects(ctx);
	eq(r.length, 13, 'thirteen fillRects');
	eq(r[0], [17, 24, 94, 60], 'shadow first');
});

test('chunkyPanel returns the content rect', () => {
	const ctx = makeCtx();
	const c = chunkyPanel(ctx, 10, 20, 100, 60);
	eq(c, { x: 17, y: 27, w: 86, h: 46 }, 'content rect');
});

test('chunkyPanel with shadow 0 draws 10 fillRects', () => {
	const ctx = makeCtx();
	chunkyPanel(ctx, 10, 20, 100, 60, { shadow: 0 });
	eq(rects(ctx).length, 10, 'ten fillRects');
});

test('chunkyPanel with hi false draws 9 fillRects', () => {
	const ctx = makeCtx();
	chunkyPanel(ctx, 10, 20, 100, 60, { hi: false });
	eq(rects(ctx).length, 9, 'nine fillRects');
});

test('chunkyPanel uses the given fill and edge colours', () => {
	const ctx = makeCtx();
	chunkyPanel(ctx, 0, 0, 60, 60, { fill: '#123456', edge: '#654321' });
	const styles = rectsWithStyle(ctx).map(function (e) { return e.style; });
	ok(styles.indexOf('#654321') >= 0, 'edge colour used');
	ok(styles.indexOf('#123456') >= 0, 'fill colour used');
});

test('grain draws exactly 30 specks for 200x90 at density 1/600', () => {
	const ctx = makeCtx();
	grain(ctx, 0, 0, 200, 90, '#000', 1 / 600, 5);
	const r = rects(ctx);
	eq(r.length, 30, 'thirty specks');
	for (let i = 0; i < r.length; i++) {
		ok(r[i][2] === 2 && r[i][3] === 2, 'speck is 2x2');
		ok(r[i][0] >= 0 && r[i][0] <= 198, 'px in range');
		ok(r[i][1] >= 0 && r[i][1] <= 88, 'py in range');
	}
});

test('grain is deterministic for the same seed', () => {
	const a = makeCtx();
	const b = makeCtx();
	grain(a, 0, 0, 200, 90, '#000', 1 / 600, 5);
	grain(b, 0, 0, 200, 90, '#000', 1 / 600, 5);
	eq(a.calls, b.calls, 'identical call lists');
});

test('paperPanel draws 13 + 7 fillRects for 100x60', () => {
	const ctx = makeCtx();
	const c = paperPanel(ctx, 10, 20, 100, 60);
	eq(rects(ctx).length, 13 + Math.floor(86 * 46 / 500), 'panel plus grain');
	eq(c, { x: 17, y: 27, w: 86, h: 46 }, 'content rect');
});

test('woodPanel draws 28 fillRects: frame, 3 seams, 12 streaks', () => {
	const ctx = makeCtx();
	woodPanel(ctx, 10, 20, 100, 100);
	const r = rectsWithStyle(ctx);
	eq(r.length, 28, 'twenty-eight fillRects');
	const seams = r.filter(function (e) { return e.style === COLOR.woodDark; });
	eq(seams.length, 3, 'three plank lines');
	const streaks = r.filter(function (e) { return e.style === COLOR.woodGrain; });
	eq(streaks.length, 12, 'twelve streaks');
});

test('enamelSign draws 4 arcs, one fillText, one closePath', () => {
	const ctx = makeCtx();
	enamelSign(ctx, 0, 0, 200, 80, { text: 'GARAGE' });
	eq(count(ctx, 'arc'), 4, 'four rivets');
	eq(count(ctx, 'fillText'), 1, 'one label');
	eq(count(ctx, 'closePath'), 1, 'gloss closed');
	const t = ctx.calls.filter(function (c) { return c[0] === 'fillText'; });
	eq(t[0][1], ['GARAGE', 100, 40], 'label at centre');
});

test('enamelSign with no text draws no fillText', () => {
	const ctx = makeCtx();
	enamelSign(ctx, 0, 0, 200, 80, {});
	eq(count(ctx, 'fillText'), 0, 'no label');
});

test('every panel draws inside its bounds plus the shadow margin', () => {
	const x = 10;
	const y = 20;
	const w = 100;
	const h = 60;
	const x0 = x - 1;
	const y0 = y - 1;
	const x1 = x + w + 5;
	const y1 = y + h + 5;
	const panels = [
		function (c) { chunkyPanel(c, x, y, w, h); },
		function (c) { paperPanel(c, x, y, w, h); },
		function (c) { woodPanel(c, x, y, w, h); },
		function (c) { enamelSign(c, x, y, w, h, { text: 'GARAGE' }); },
	];
	for (let p = 0; p < panels.length; p++) {
		const ctx = makeCtx();
		panels[p](ctx);
		const r = rects(ctx);
		for (let i = 0; i < r.length; i++) {
			ok(insideBox(r[i], x0, y0, x1, y1), 'panel ' + p + ' rect ' + JSON.stringify(r[i]));
		}
		for (let i = 0; i < ctx.calls.length; i++) {
			if (ctx.calls[i][0] === 'arc') {
				const a = ctx.calls[i][1];
				ok(a[0] >= x0 && a[0] <= x1 && a[1] >= y0 && a[1] <= y1, 'panel ' + p + ' arc');
			}
		}
	}
});

done();
