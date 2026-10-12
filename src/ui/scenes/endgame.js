// The end-of-game screen (cards W66a and W66b, DESIGN.md section 4.11): the
// heading for how the year ended, its subline and the score block - final
// score, rank, net worth, reputation, jobs done, the four Gold Number Plates
// and the best auction sale - over the two buttons PLAY AGAIN and TITLE. W66b
// makes the buttons work (PLAY AGAIN starts a new game, TITLE goes to the
// title, Enter is the same as PLAY AGAIN) and adds the celebration confetti
// for a win and the drifting cloud for a bankruptcy. Scene interface per
// DESIGN.md 9.5/9.7. Pure: no DOM, no Date, no randomness - every animated
// position comes from the frame time t; ctx is a parameter so tests can run it
// under tests/fakectx.js.

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

// The strip between the heading and the two panels, where the confetti falls
// and the bankrupt cloud drifts.
const SKY = { x: BOARD.x + 20, y: BOARD.y + 20, w: BOARD.w - 40, h: 140 };

// Falling confetti (a win): CONFETTI.count rectangles in six columns, each one
// falling at the same speed on a different offset, so the strip never empties.
// Positions come only from the piece index and t: the same t is the same frame.
const CONFETTI = { count: 36, speed: 160, w: 10, h: 16 };
const CONFETTI_COLORS = [PALETTE.gold, PALETTE.red, PALETTE.cyan, PALETTE.lightgreen, PALETTE.purple];

function drawConfetti(ctx, t) {
	const colW = SKY.w / 6;
	for (let i = 0; i < CONFETTI.count; i++) {
		const col = i % 6;
		const lane = Math.floor(i / 6);
		const x = SKY.x + Math.round(col * colW) + ((lane * 11) % 24);
		const y = SKY.y + ((i * 41 + t * CONFETTI.speed) % SKY.h);
		ctx.fillStyle = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
		ctx.fillRect(x, y, CONFETTI.w, CONFETTI.h);
	}
}

// The bankrupt cloud: three grey puffs and a flat base, drifting left to right
// and wrapping round. Behind the heading, so the words stay readable.
const CLOUD = { speed: 46, y: BOARD.y + 120, puffs: [34, 26, 30] };

function drawCloud(ctx, t) {
	const span = BOARD.w + 240;
	const x = BOARD.x - 130 + ((t * CLOUD.speed) % span);
	ctx.fillStyle = PALETTE.lightgrey;
	ctx.beginPath();
	ctx.arc(x, CLOUD.y, CLOUD.puffs[0], 0, Math.PI * 2);
	ctx.arc(x + 44, CLOUD.y - 16, CLOUD.puffs[1], 0, Math.PI * 2);
	ctx.arc(x + 84, CLOUD.y + 4, CLOUD.puffs[2], 0, Math.PI * 2);
	ctx.fill();
	ctx.fillStyle = PALETTE.midgrey;
	ctx.fillRect(x - 24, CLOUD.y + 24, 140, 12);
}

// The hit list: the two buttons, added last so they win any overlap. Rebuilt
// from the layout every draw, per the tap rule in docs/SCENE_RULES.md.
function buildHits(app, hits) {
	hits.add('again', LAYOUT.again.x, LAYOUT.again.y, LAYOUT.again.w, LAYOUT.again.h, function () {
		app.newGame();
	});
	hits.add('title', LAYOUT.title.x, LAYOUT.title.y, LAYOUT.title.w, LAYOUT.title.h, function () {
		app.go('title');
	});
}

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
		// Seed the hit list here too, so a tap that lands before the very
		// first draw still works (tvshop.js does the same).
		buildHits(app, this.hits);
	},

	draw: function (ctx, app, t) {
		// Rebuild the hit list at the start of every draw so it always matches
		// what is on screen. Never touch the pressed state here: pointer()
		// owns it between the finger-down and its finger-up.
		const hits = makeHits();
		this.hits = hits;
		buildHits(app, hits);

		const state = app.state;
		const flags = state && state.flags ? state.flags : {};
		const won = flags.won === true;

		// 1) The board itself.
		panel(ctx, BOARD.x, BOARD.y, BOARD.w, BOARD.h, { fill: PALETTE.paper });

		// 2) The celebration or the gloom, drawn straight onto the board behind
		// the heading: confetti for a win, the drifting cloud for bankruptcy.
		if (won) {
			drawConfetti(ctx, t);
		} else if (flags.reason === 'bankrupt') {
			drawCloud(ctx, t);
		}

		// 3) The heading and its subline.
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

		// 4) The score block: five lines down the left panel.
		panel(ctx, SCORE_PANEL.x, SCORE_PANEL.y, SCORE_PANEL.w, SCORE_PANEL.h);
		const lines = scoreLines(state, won);
		for (let i = 0; i < lines.length; i++) {
			label(ctx, lines[i], SCORE_PANEL.x + 24, 236 + i * ROW_H, {
				size: 30,
				color: PALETTE.ink,
				maxW: SCORE_PANEL.w - 48,
			});
		}

		// 5) The four Gold Number Plates: name on the left, WON in gold or
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

		// 6) The two buttons, drawn last so nothing overlaps them.
		button(ctx, {
			x: LAYOUT.again.x, y: LAYOUT.again.y, w: LAYOUT.again.w, h: LAYOUT.again.h,
			label: 'PLAY AGAIN', kind: 'primary', enabled: true,
		});
		button(ctx, {
			x: LAYOUT.title.x, y: LAYOUT.title.y, w: LAYOUT.title.w, h: LAYOUT.title.h,
			label: 'TITLE', enabled: true,
		});
	},

	// Pointer input. The tap rule: remember the hit's id on down (never the
	// object), fire only when the same id is still under the finger on up.
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

	// Enter is the same as tapping PLAY AGAIN. Any other key is ignored.
	key: function (app, key) {
		if (key === 'Enter') {
			app.newGame();
		}
	},
};
