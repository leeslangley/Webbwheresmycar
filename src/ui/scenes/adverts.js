// Advertising scene (card W61, DESIGN.md sections 4.8, 8.1, 9.5, 9.7): Mark
// Webb's laptop, where he picks where to advertise. Seven media as list rows
// (name, cost, PAYS stars and RISK percent), a detail panel with the blurb
// and the numbers, and a RUN ADVERT button that plays the gamble through the
// sim. Pure UI: no DOM, no Math.random, no Date; the sim is touched only
// through app.act.

import { PALETTE } from '../theme.js';
import { makeHits } from '../kit_hits.js';
import { panel, label, paragraph, button, bar, moneyText } from '../kit_draw.js';
import { stars } from '../../core/format.js';
import { ADVERTS } from '../../data/adverts.js';
import { advertise } from '../../sim/adsim.js';

// Rectangles in logical 1280x720 coordinates.
export const LAYOUT = {
	list: { x: 40, y: 110, w: 600, h: 520 },
	rowH: 70,
	detail: { x: 660, y: 110, w: 580, h: 420 },
	run: { x: 660, y: 560, w: 580, h: 70 },
	back: { x: 40, y: 650, w: 200, h: 50 },
};

// The laptop bezel and the screen inside it (desktop-blue background).
const BEZEL = { x: 12, y: 8, w: 1256, h: 704 };
const SCREEN = { x: 32, y: 28, w: 1216, h: 676 };

// Expected buzz for a medium: sum(w*buzz)/100 (weights sum to 100).
function expectedBuzz(medium) {
	let sum = 0;
	for (let i = 0; i < medium.outcomes.length; i++) {
		sum += medium.outcomes[i].w * medium.outcomes[i].buzz;
	}
	return sum / 100;
}

// Flop chance in percent: the weight of every outcome that gains almost
// nothing (buzz <= 5).
function flopChance(medium) {
	let w = 0;
	for (let i = 0; i < medium.outcomes.length; i++) {
		if (medium.outcomes[i].buzz <= 5) {
			w += medium.outcomes[i].w;
		}
	}
	return w;
}

// Best case: the biggest buzz any outcome can give.
function bestBuzz(medium) {
	let best = 0;
	for (let i = 0; i < medium.outcomes.length; i++) {
		if (medium.outcomes[i].buzz > best) {
			best = medium.outcomes[i].buzz;
		}
	}
	return best;
}

export const advertsScene = {
	id: 'adverts',

	// Index of the selected media row.
	sel: 0,

	// Hit list, rebuilt at the start of every draw so it always matches
	// what is on screen (DESIGN.md 9.7).
	hits: null,

	// Id of the hit pressed on 'down', for tap = same hit on down and up.
	// An id, never the entry object: draw rebuilds the hit list every
	// frame, so the up lands on a fresh object that must match by id.
	pressed: null,

	enter: function () {
		this.sel = 0;
		this.pressed = null;
		this.hits = null;
	},

	draw: function (ctx, app, t) {
		const state = app.state;
		const list = LAYOUT.list;

		// Hit list first: every tap below must match what this draw shows.
		const hits = makeHits();

		// The laptop: dark bezel, desktop-blue screen.
		panel(ctx, BEZEL.x, BEZEL.y, BEZEL.w, BEZEL.h, { fill: PALETTE.darkgrey, radius: 18, bw: 6 });
		ctx.fillStyle = PALETTE.blue;
		ctx.fillRect(SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h);

		// Title and buzz meter.
		label(ctx, 'ADVERTISING', list.x, 46, { size: 24, font: 'title', color: PALETTE.cream, shadow: true });
		label(ctx, 'BUZZ ' + Math.round(state.buzz), LAYOUT.detail.x, 52, { size: 28, color: PALETTE.yellow });
		bar(ctx, LAYOUT.detail.x, 84, 300, 18, state.buzz, 100, PALETTE.good);

		// One row per medium: name, cost, and the two indicator lines.
		const scene = this;
		for (let i = 0; i < ADVERTS.length; i++) {
			const medium = ADVERTS[i];
			const rowY = list.y + i * LAYOUT.rowH;
			const eb = expectedBuzz(medium);
			label(ctx, medium.name, list.x + 16, rowY + 4, { size: 30, color: PALETTE.white });
			label(ctx, moneyText(medium.cost), list.x + list.w - 16, rowY + 8, {
				size: 26, align: 'right', color: PALETTE.yellow,
			});
			label(ctx, 'PAYS ' + stars(Math.round(eb / 10)), list.x + 16, rowY + 38, {
				size: 16, color: PALETTE.cream,
			});
			label(ctx, 'RISK ' + Math.round(flopChance(medium)) + '%', list.x + 16, rowY + 54, {
				size: 16, color: PALETTE.lightgrey,
			});
			const selected = i === this.sel;
			if (selected) {
				ctx.lineWidth = 3;
				ctx.strokeStyle = PALETTE.lamp;
				ctx.strokeRect(list.x + 2, rowY + 2, list.w - 4, LAYOUT.rowH - 4);
			}
			hits.add('row:' + medium.id, list.x, rowY, list.w, LAYOUT.rowH, function () {
				scene.sel = i;
			});
		}

		// Detail panel for the selected medium.
		const medium = ADVERTS[this.sel];
		const d = LAYOUT.detail;
		panel(ctx, d.x, d.y, d.w, d.h);
		label(ctx, medium.name, d.x + 20, d.y + 18, { size: 32, color: PALETTE.ink });
		let y = paragraph(ctx, medium.blurb, d.x + 20, d.y + 64, d.w - 40, { size: 24 });
		y += 26;
		label(ctx, 'Cost ' + moneyText(medium.cost), d.x + 20, y, { size: 26 });
		label(ctx, 'Typical buzz +' + Math.round(expectedBuzz(medium)), d.x + 20, y + 36, { size: 26 });
		label(ctx, 'Chance of a flop ' + Math.round(flopChance(medium)) + '%', d.x + 20, y + 72, { size: 26 });
		label(ctx, 'Best case +' + bestBuzz(medium) + ' buzz', d.x + 20, y + 108, { size: 26 });

		// RUN ADVERT: primary; grey when the cash cannot cover the cost,
		// and tapping it then explains why.
		const canAfford = state.cash >= medium.cost;
		button(ctx, {
			x: LAYOUT.run.x, y: LAYOUT.run.y, w: LAYOUT.run.w, h: LAYOUT.run.h,
			label: 'RUN ADVERT ' + moneyText(medium.cost),
			kind: 'primary',
			enabled: canAfford,
		});
		hits.add('run', LAYOUT.run.x, LAYOUT.run.y, LAYOUT.run.w, LAYOUT.run.h, function () {
			const m = ADVERTS[scene.sel];
			if (state.cash < m.cost) {
				app.toast('Not enough money');
				return;
			}
			app.act(function () { return advertise(state, m.id); });
		});

		// BACK pops back to the office.
		button(ctx, {
			x: LAYOUT.back.x, y: LAYOUT.back.y, w: LAYOUT.back.w, h: LAYOUT.back.h,
			label: 'BACK',
		});
		hits.add('back', LAYOUT.back.x, LAYOUT.back.y, LAYOUT.back.w, LAYOUT.back.h, function () {
			app.pop();
		});

		this.hits = hits;
	},

	// 'down' presses a hit, 'up' commits the tap when it lands on the same
	// hit as the down. The pressed state remembers the hit ID, not the
	// entry object, and is never reset inside draw.
	pointer: function (app, type, x, y) {
		if (!this.hits) {
			return;
		}
		if (type === 'down') {
			const h = this.hits.hit(x, y);
			this.pressed = h ? h.id : null;
			return;
		}
		if (type === 'up') {
			const e = this.hits.hit(x, y);
			if (e && this.pressed !== null && e.id === this.pressed && typeof e.onTap === 'function') {
				e.onTap(e);
			}
			this.pressed = null;
		}
	},

	key: function (app, key) {
		const n = ADVERTS.length;
		if (key === 'Up' || key === 'ArrowUp') {
			this.sel = (this.sel + n - 1) % n;
		} else if (key === 'Down' || key === 'ArrowDown') {
			this.sel = (this.sel + 1) % n;
		} else if (key === 'Enter') {
			const medium = ADVERTS[this.sel];
			if (app.state.cash < medium.cost) {
				app.toast('Not enough money');
				return;
			}
			app.act(function () { return advertise(app.state, medium.id); });
		} else if (key === 'Escape') {
			app.pop();
		}
	},
};
