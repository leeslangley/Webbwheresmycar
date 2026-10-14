// UI audit helper (test code only, not game code). It replays a fakectx call
// log and reports every text box with its size, so tests can assert numerically
// that no text is below the phone-safe minimum, off the canvas, or overlapping
// another text (docs/art/GU.md). Pure: no DOM, no Date, no Math.random.

import { FLOOR } from '../src/ui/tokens.js';

const DEFAULT_FONT = '10px sans-serif';

// First number before 'px' in a CSS font string, as tests/fakectx.js does.
// Falls back to 10 when nothing matches.
function pxOf(font) {
	const m = String(font).match(/(\d+(?:\.\d+)?)px/);
	return m ? parseFloat(m[1]) : 10;
}

function kindOf(font) {
	const f = String(font);
	if (f.indexOf('Press Start 2P') !== -1) {
		return 'title';
	}
	if (f.indexOf('VT323') !== -1) {
		return 'body';
	}
	return 'other';
}

function copyState(s) {
	return {
		font: s.font,
		align: s.align,
		baseline: s.baseline,
		tx: s.tx,
		ty: s.ty,
		transformed: s.transformed,
	};
}

// Builds one text entry from a fillText or strokeText call and the state in force.
function textEntry(text, x, y, s) {
	const px = pxOf(s.font);
	const w = text.length * 0.6 * px;
	const h = px;
	let x0;
	if (s.align === 'center') {
		x0 = x - w / 2;
	} else if (s.align === 'right' || s.align === 'end') {
		x0 = x - w;
	} else {
		x0 = x;
	}
	let y0;
	if (s.baseline === 'top') {
		y0 = y;
	} else if (s.baseline === 'middle') {
		y0 = y - h / 2;
	} else if (s.baseline === 'bottom') {
		y0 = y - h;
	} else {
		y0 = y - 0.8 * h;
	}
	x0 += s.tx;
	y0 += s.ty;
	return {
		text: text,
		x0: x0,
		y0: y0,
		x1: x0 + w,
		y1: y0 + h,
		px: px,
		kind: kindOf(s.font),
		align: s.align,
		baseline: s.baseline,
		transformed: s.transformed,
	};
}

// Area of the intersection of two entries (or any {x0,y0,x1,y1} boxes); 0 if none.
function interArea(a, b) {
	const ix = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
	const iy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
	return ix > 0 && iy > 0 ? ix * iy : 0;
}

// Replays ctx.calls in order and returns one entry per fillText or strokeText:
// {text, x0, y0, x1, y1, px, kind, align, baseline, transformed}.
// Font, textAlign and textBaseline come from the set:<prop> records; save and
// restore keep a stack of that state plus the translate offset and the
// transformed flag (set by scale, rotate, transform and setTransform).
export function replayTexts(ctx) {
	let state = {
		font: DEFAULT_FONT,
		align: 'left',
		baseline: 'alphabetic',
		tx: 0,
		ty: 0,
		transformed: false,
	};
	const stack = [];
	const out = [];
	for (let i = 0; i < ctx.calls.length; i++) {
		const name = ctx.calls[i][0];
		const args = ctx.calls[i][1];
		if (name === 'set:font') {
			state.font = args[0];
		} else if (name === 'set:textAlign') {
			state.align = args[0];
		} else if (name === 'set:textBaseline') {
			state.baseline = args[0];
		} else if (name === 'save') {
			stack.push(copyState(state));
		} else if (name === 'restore') {
			if (stack.length > 0) {
				state = stack.pop();
			}
		} else if (name === 'translate') {
			state.tx += Number(args[0]);
			state.ty += Number(args[1]);
		} else if (name === 'scale' || name === 'rotate' || name === 'transform' || name === 'setTransform') {
			state.transformed = true;
		} else if (name === 'fillText' || name === 'strokeText') {
			out.push(textEntry(String(args[0]), args[1], args[2], state));
		}
	}
	return out;
}

// Audits the texts drawn on ctx (ignoring any drawn under a transform):
// entries, belowFloor (title or body text under FLOOR px), offCanvas (any part
// outside 0..w by 0..h), and overlaps (pairs [a, b], a drawn before b, whose
// boxes share more than 4 px^2). Identical strings whose x0 and y0 each differ
// by at most ignoreShadowOffset are a shadow or outline, not an overlap.
export function auditCtx(ctx, opts) {
	const o = opts || {};
	const w = o.w === undefined ? 1280 : o.w;
	const h = o.h === undefined ? 720 : o.h;
	const shadow = o.ignoreShadowOffset === undefined ? 4 : o.ignoreShadowOffset;
	const all = replayTexts(ctx);
	const entries = [];
	for (let i = 0; i < all.length; i++) {
		if (!all[i].transformed) {
			entries.push(all[i]);
		}
	}
	const belowFloor = entries.filter(function (e) {
		return (e.kind === 'title' || e.kind === 'body') && e.px < FLOOR[e.kind];
	});
	const offCanvas = entries.filter(function (e) {
		return e.x0 < 0 || e.y0 < 0 || e.x1 > w || e.y1 > h;
	});
	const overlaps = [];
	for (let i = 0; i < entries.length; i++) {
		for (let j = i + 1; j < entries.length; j++) {
			const a = entries[i];
			const b = entries[j];
			if (a.text === b.text && Math.abs(a.x0 - b.x0) <= shadow && Math.abs(a.y0 - b.y0) <= shadow) {
				continue;
			}
			if (interArea(a, b) > 4) {
				overlaps.push([a, b]);
			}
		}
	}
	return { entries: entries, belowFloor: belowFloor, offCanvas: offCanvas, overlaps: overlaps };
}

// True when the {x, y, w, h} rectangles share an area greater than 0.
// Rectangles that only touch along an edge do not overlap.
export function rectsOverlap(a, b) {
	return interArea(
		{ x0: a.x, y0: a.y, x1: a.x + a.w, y1: a.y + a.h },
		{ x0: b.x, y0: b.y, x1: b.x + b.w, y1: b.y + b.h }
	) > 0;
}

// Short readable label for failure messages, e.g. 'ABCD@10,20 16px'.
export function describe(entry) {
	return entry.text + '@' + entry.x0 + ',' + entry.y0 + ' ' + entry.px + 'px';
}
