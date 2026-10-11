// The Daily Sprocket newspaper overlay (card W63): after every action the
// day's paper slides in with the headline and what happened, and on the
// first day of a month a second page lists the bills (DESIGN.md 4.9, 8.4).
// Scene interface per DESIGN.md 9.5/9.7: hit list rebuilt on every draw and
// the tap rule obeyed exactly (remember the pressed id on down, never reset
// it inside draw). Pure: no DOM, no Date; ctx is a parameter so tests can
// run it under tests/fakectx.js.

import { PALETTE, font, rgba } from '../theme.js';
import { panel, label, button, wrapLines } from '../kit_draw.js';
import { makeHits } from '../kit_hits.js';
import { money, dateText } from '../../core/format.js';

export const LAYOUT = {
	paper: { x: 240, y: 40, w: 800, h: 640 },
	button: { x: 480, y: 610, w: 320, h: 56 },
};

const GOLD_TAG = 'GOLD NUMBER PLATE';
const MAX_EVENTS = 6;
const ANIM_MS = 350;

// The clock may be a function or a plain number (test fakes).
function nowMs(app) {
	return typeof app.now === 'function' ? app.now() : (app.now || 0);
}

export const newsScene = {
	id: 'news',
	overlay: true,
	hits: null,
	pressed: null,
	page: 1,
	readOnly: false,
	enteredAt: 0,

	enter: function (app, params) {
		this.page = 1;
		this.readOnly = !!(params && params.readOnly);
		this.pressed = null;
		this.hits = makeHits();
		this.enteredAt = nowMs(app);
		if (app.audio && typeof app.audio.play === 'function') {
			app.audio.play('paper');
		}
	},

	// Tap or key: page 1 -> page 2 when there is a month report to show,
	// otherwise pop. readOnly always pops on the first advance.
	advance: function (app) {
		const today = app.state && app.state.today ? app.state.today : null;
		if (!this.readOnly && this.page === 1 && today && today.monthReport) {
			this.page = 2;
			return;
		}
		app.pop();
	},

	pointer: function (app, type, x, y) {
		if (type === 'down') {
			// Tap rule: remember the hit's id, never the hit object.
			const h = this.hits ? this.hits.hit(x, y) : null;
			this.pressed = h ? h.id : null;
			return;
		}
		if (type === 'up') {
			const e = this.hits ? this.hits.hit(x, y) : null;
			if (e && this.pressed !== null && e.id === this.pressed && typeof e.onTap === 'function') {
				e.onTap(e);
			}
			this.pressed = null;
		}
	},

	key: function (app, k) {
		if (k === 'Enter' || k === ' ' || k === 'Space' || k === 'Escape') {
			this.advance(app);
		}
	},

	draw: function (ctx, app, t) {
		const state = app.state;
		if (!state || !state.today) {
			return;
		}
		// Rebuild the hit list at the start of every draw so it always
		// matches what is on screen (DESIGN.md 9.7). The whole screen is
		// one tap target: any tap advances the paper.
		const hits = makeHits();
		this.hits = hits;
		const scene = this;
		hits.add('anywhere', 0, 0, app.w, app.h, function () {
			scene.advance(app);
		});

		// Dim the room behind the paper.
		ctx.fillStyle = rgba('#000000', 0.6);
		ctx.fillRect(0, 0, app.w, app.h);

		// Entrance: 0.35s of scale 0.6 -> 1 and rotation -20 -> -2 degrees
		// about the paper's centre.
		const P = LAYOUT.paper;
		const cx = P.x + P.w / 2;
		const cy = P.y + P.h / 2;
		const k = Math.max(0, Math.min(1, (nowMs(app) - this.enteredAt) / ANIM_MS));
		const deg = -20 + 18 * k;
		const scale = 0.6 + 0.4 * k;

		ctx.save();
		ctx.translate(cx, cy);
		ctx.rotate(deg * Math.PI / 180);
		ctx.scale(scale, scale);
		panel(ctx, -P.w / 2, -P.h / 2, P.w, P.h, {
			fill: PALETTE.paper, border: PALETTE.ink, radius: 0, bw: 4, shadow: false,
		});
		if (this.page === 2 && !this.readOnly) {
			drawMonthReport(ctx, state.today.monthReport);
		} else {
			drawPaper(ctx, state);
		}
		const bl = this.readOnly ? 'BACK' : 'CONTINUE';
		button(ctx, {
			x: LAYOUT.button.x - cx, y: LAYOUT.button.y - cy, w: LAYOUT.button.w, h: LAYOUT.button.h, label: bl,
		});
		ctx.restore();
	},
};

// Page 1: the front page. Masthead, rule, dateline, headline, divider and
// up to six of today's events.
function drawPaper(ctx, state) {
	const P = LAYOUT.paper;
	const x = -P.w / 2 + 30;
	const w = P.w - 60;

	label(ctx, 'THE DAILY SPROCKET', 0, -300, { size: 30, font: 'title', align: 'center', color: PALETTE.ink });
	ctx.fillStyle = PALETTE.ink;
	ctx.fillRect(-P.w / 2 + 20, -256, P.w - 40, 3);
	label(ctx, dateText(state.day) + '  -  Price: one pound fifty', 0, -242, {
		size: 24, font: 'body', align: 'center', color: PALETTE.darkgrey,
	});

	const today = state.today;
	const headline = String(today.headline || '');
	const hl = wrapLines(ctx, headline.toUpperCase(), w, font('title', 24));
	let y = -204;
	for (let i = 0; i < hl.length; i++) {
		label(ctx, hl[i], x, y + i * 30, { size: 24, font: 'title', color: PALETTE.ink });
	}
	y += hl.length * 30 + 14;
	ctx.fillStyle = PALETTE.ink;
	ctx.fillRect(x, y, w, 2);
	y += 16;

	label(ctx, "TODAY IN WEBB'S WHEELS:", x, y, { size: 16, font: 'title', color: PALETTE.ink });
	y += 30;

	const events = today.events || [];
	const shown = events.slice(0, MAX_EVENTS);
	for (let i = 0; i < shown.length; i++) {
		const ev = String(shown[i]);
		const gold = ev.indexOf(GOLD_TAG) !== -1;
		label(ctx, '* ' + ev, x, y + i * 32, {
			size: 26, font: 'body', color: gold ? PALETTE.gold : PALETTE.ink, shadow: gold, maxW: w,
		});
	}
	if (events.length > MAX_EVENTS) {
		label(ctx, '...and more', x, y + shown.length * 32, { size: 26, font: 'body', color: PALETTE.darkgrey });
	}
}

// Page 2: the month-end bills (DESIGN.md 4.9).
function drawMonthReport(ctx, r) {
	const P = LAYOUT.paper;
	const x = -P.w / 2 + 30;
	const w = P.w - 60;
	const rep = r || {};

	label(ctx, 'MONTH END: ' + String(rep.monthName || '').toUpperCase(), 0, -300, {
		size: 22, font: 'title', align: 'center', color: PALETTE.ink,
	});
	ctx.fillStyle = PALETTE.ink;
	ctx.fillRect(-P.w / 2 + 20, -260, P.w - 40, 3);

	let y = -226;
	label(ctx, 'Rent ' + money(rep.rent || 0), x, y, { size: 26, font: 'body', color: PALETTE.ink });
	y += 36;
	label(ctx, 'Running costs ' + money(rep.running || 0), x, y, { size: 26, font: 'body', color: PALETTE.ink });
	y += 36;
	label(ctx, 'Garage lease ' + money(rep.lease || 0), x, y, { size: 26, font: 'body', color: PALETTE.ink });
	y += 40;
	label(ctx, 'TOTAL ' + money(rep.total || 0), x, y, { size: 20, font: 'title', color: PALETTE.ink });
	y += 40;
	label(ctx, 'Cash now ' + money(rep.cashAfter || 0), x, y, { size: 26, font: 'body', color: PALETTE.ink });
	y += 44;

	const faults = rep.newFaults || [];
	const shown = faults.slice(0, 4);
	for (let i = 0; i < shown.length; i++) {
		label(ctx, 'Fault: ' + shown[i], x, y + i * 32, {
			size: 26, font: 'body', color: PALETTE.bad, maxW: w,
		});
	}
}
