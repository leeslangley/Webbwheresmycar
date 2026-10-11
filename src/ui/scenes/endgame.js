// The end-of-game screen (card W66a, DESIGN.md section 4.11): the heading for
// how the year ended, its subline and the score block - final score, rank, net
// worth, reputation, jobs done, the four Gold Number Plates and the best auction
// sale - over the two buttons PLAY AGAIN and TITLE. Scene interface per
// DESIGN.md 9.5/9.7; the buttons do not take taps yet, so the hit list stays
// empty. Pure: no DOM, no Date, no randomness; ctx is a parameter so tests can
// run it under tests/fakectx.js.

import { PALETTE } from '../theme.js';
import { panel, label, button } from '../kit_draw.js';
import { makeHits } from '../kit_hits.js';
import { money } from '../../core/format.js';
import { PLATE_KEYS } from '../../core/state.js';
import { PLATE_INFO, finalScore, rankOf, netWorth } from '../../sim/endgame.js';

// The two buttons, in logical 1280x720 coordinates.
export const LAYOUT = {
	again: { x: 340, y: 610, w: 280, h: 60 },
	title: { x: 660, y: 610, w: 280, h: 60 },
};

// The cream board and its two panels.
const BOARD = { x: 80, y: 30, w: 1120, h: 660 };
const SCORE_PANEL = { x: 140, y: 200, w: 520, h: 380 };
const PLATE_PANEL = { x: 680, y: 200, w: 460, h: 380 };
const ROW_H = 56;

const HEADING = {
	won: 'GOLD! MARK\'S A LEGEND',
	'year-end': 'THE YEAR IS UP',
	bankrupt: 'BANKRUPT! THE BAILIFFS ARRIVE',
};

const SUBLINE = {
	won: 'All four Gold Number Plates in one year. Mark buys a round.',
	'year-end': 'The bank manager is smiling politely.',
	bankrupt: 'Dave takes the kettle. Mark takes the bus.',
};

// Heading and subline for the reason the year ended. An unknown or missing
// reason (a hand-edited save, say) gets a plain fallback rather than a crash.
function endText(flags) {
	const reason = flags ? flags.reason : '';
	return {
		heading: HEADING[reason] !== undefined ? HEADING[reason] : 'GAME OVER',
		subline: SUBLINE[reason] !== undefined ? SUBLINE[reason] : 'The year at Webb\'s Wheels is done.',
	};
}

// The five score lines, every figure computed from the state.
function scoreLines(state, won) {
	const score = finalScore(state);
	return [
		'Final score ' + score,
		'Rank: ' + (won ? 'GOLD ' : '') + rankOf(score),
		'Net worth ' + money(netWorth(state)),
		'Reputation ' + state.reputation,
		'Jobs done ' + state.stats.jobsDone,
	];
}

export const endgameScene = {
	id: 'endgame',
	hits: null,
	pressed: null,

	enter: function (app) {
		this.pressed = null;
		this.hits = makeHits();
	},

	draw: function (ctx, app, t) {
		const state = app.state;
		const flags = state && state.flags ? state.flags : {};
		const won = flags.won === true;

		// 1) The board itself, then the heading and its subline.
		panel(ctx, BOARD.x, BOARD.y, BOARD.w, BOARD.h, { fill: PALETTE.paper });
		const words = endText(flags);
		label(ctx, words.heading, app.w / 2, 70, {
			size: 34,
			align: 'center',
			font: 'title',
			color: won ? PALETTE.gold : PALETTE.ink,
			shadow: true,
			maxW: BOARD.w - 80,
		});
		label(ctx, words.subline, app.w / 2, 140, {
			size: 28,
			align: 'center',
			color: PALETTE.ink,
			maxW: BOARD.w - 160,
		});

		// 2) The score block: five lines down the left panel.
		panel(ctx, SCORE_PANEL.x, SCORE_PANEL.y, SCORE_PANEL.w, SCORE_PANEL.h);
		const lines = scoreLines(state, won);
		for (let i = 0; i < lines.length; i++) {
			label(ctx, lines[i], SCORE_PANEL.x + 24, 236 + i * ROW_H, {
				size: 30,
				color: PALETTE.ink,
				maxW: SCORE_PANEL.w - 48,
			});
		}

		// 3) The four Gold Number Plates: name on the left, WON in gold or
		// missed in grey on the right. Then the best auction sale.
		panel(ctx, PLATE_PANEL.x, PLATE_PANEL.y, PLATE_PANEL.w, PLATE_PANEL.h);
		label(ctx, 'GOLD NUMBER PLATES', PLATE_PANEL.x + 24, 220, {
			size: 18,
			font: 'title',
			color: PALETTE.ink,
			maxW: PLATE_PANEL.w - 48,
		});
		for (let i = 0; i < PLATE_KEYS.length; i++) {
			const key = PLATE_KEYS[i];
			const info = PLATE_INFO[key];
			const got = !!(state.plates && state.plates[key]);
			const y = 262 + i * ROW_H;
			label(ctx, info ? info.name : key, PLATE_PANEL.x + 24, y, {
				size: 28,
				color: PALETTE.ink,
				maxW: 260,
			});
			label(ctx, got ? 'WON' : 'missed', PLATE_PANEL.x + PLATE_PANEL.w - 24, y, {
				size: 26,
				align: 'right',
				font: got ? 'title' : 'body',
				color: got ? PALETTE.gold : PALETTE.lightgrey,
			});
		}
		label(ctx, 'Best auction sale ' + money(state.stats.bestAuctionSale), PLATE_PANEL.x + 24, 498, {
			size: 28,
			color: PALETTE.ink,
			maxW: PLATE_PANEL.w - 48,
		});

		// 4) The two buttons. Tapping is card W66b's job: the hit list stays
		// empty here, so a tap on either does nothing yet.
		button(ctx, {
			x: LAYOUT.again.x, y: LAYOUT.again.y, w: LAYOUT.again.w, h: LAYOUT.again.h,
			label: 'PLAY AGAIN', kind: 'primary', enabled: true,
		});
		button(ctx, {
			x: LAYOUT.title.x, y: LAYOUT.title.y, w: LAYOUT.title.w, h: LAYOUT.title.h,
			label: 'TITLE', enabled: true,
		});
	},

	// No taps yet: rebuild the empty hit list so the tap rule still holds.
	pointer: function (app, type, x, y) {
		if (type === 'down') {
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
};
