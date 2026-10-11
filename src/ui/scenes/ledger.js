// The ledger and workshop scene (card W64, DESIGN.md sections 4.2, 4.3, 4.9,
// 4.11, 9.5, 9.7): the filing cabinet, where Mark Webb looks at the books
// (cash, net worth, stable value, the month-end bills he is heading for, his
// reputation, buzz and lifetime stats) and at the four Gold Number Plates.
// The workshop tab is the garage board: bays in use and BUY EXTRA SLOT.
// Pure UI: no DOM, no Math.random, no Date; the sim is touched only through
// app.act. draw() never mutates state.

import { PALETTE } from '../theme.js';
import { panel, label, button } from '../kit_draw.js';
import { makeHits } from '../kit_hits.js';
import { money } from '../../core/format.js';
import { modelOf } from '../../data/cars.js';
import { marketValue, runningCost } from '../../sim/carstats.js';
import { netWorth, PLATE_INFO } from '../../sim/endgame.js';
import { buySlot } from '../../sim/actions.js';

// Rectangles in logical 1280x720 coordinates.
export const LAYOUT = {
	tabLedger: { x: 40, y: 90, w: 260, h: 50 },
	tabWorkshop: { x: 310, y: 90, w: 260, h: 50 },
	buySlot: { x: 340, y: 520, w: 360, h: 70 },
	back: { x: 40, y: 650, w: 200, h: 50 },
};

// The ledger book panel and the plates column beside it.
const BOOK = { x: 40, y: 160, w: 620, h: 480 };
const PLATES = { x: 680, y: 160, w: 560, h: 480 };

// The workshop board panel.
const BOARD = { x: 40, y: 160, w: 1200, h: 340 };

// The garage bays picture: 8 bays across one row inside the board.
const BAYS = { x: 80, y: 330, w: 96, h: 90, gap: 10 };
const MAX_SLOTS = 8;
const SLOT_COST = 3000;

// The four plates, in win-check order (state.plates keys).
const PLATE_KEYS = ['fatcat', 'stable', 'household', 'hammer'];

// A car's model, or null when the id is unknown (never throw while drawing).
function safeModel(car) {
	try {
		return modelOf(car.modelId);
	} catch (e) {
		return null;
	}
}

// Number of cars sitting in the garage (owned and rented both take a slot).
function carsInGarage(state) {
	return state.cars.length;
}

// Number of owned cars.
function ownedCount(state) {
	let n = 0;
	for (let i = 0; i < state.cars.length; i++) {
		if (state.cars[i].owned === true) {
			n += 1;
		}
	}
	return n;
}

// Net worth with a fallback: the sim's netWorth throws on a car whose model id
// is not in the catalogue, and a broken save must not crash the books. The
// fallback is the same sum (cash plus the market value of owned cars) built
// from the safe model lookup below.
function safeNetWorth(state) {
	try {
		return netWorth(state);
	} catch (e) {
		return state.cash + stableValue(state);
	}
}

// Market value of every owned car (rented cars count 0), rounded pounds.
function stableValue(state) {
	let total = 0;
	const cars = state.cars;
	for (let i = 0; i < cars.length; i++) {
		const car = cars[i];
		if (car.owned !== true) {
			continue;
		}
		const model = safeModel(car);
		if (model) {
			total += marketValue(state, model, car);
		}
	}
	return total;
}

// Expected next bills (DESIGN.md 4.9): rent of rented cars + running costs of
// owned cars + the flat £400 garage lease.
function expectedBills(state) {
	let total = 400;
	const cars = state.cars;
	for (let i = 0; i < cars.length; i++) {
		const car = cars[i];
		if (car.owned === true) {
			const model = safeModel(car);
			if (model) {
				total += runningCost(model, car);
			}
		} else {
			total += car.rentMonthly || 0;
		}
	}
	return total;
}

// Progress text for one plate: 'WON' once held, else the current figure.
function plateProgress(state, key) {
	const won = state.plates && state.plates[key] === true;
	if (won) {
		return 'WON';
	}
	if (key === 'fatcat') {
		return money(safeNetWorth(state)) + '/£100,000';
	}
	if (key === 'stable') {
		return ownedCount(state) + '/6 cars';
	}
	if (key === 'household') {
		return state.reputation + '/85';
	}
	return 'best ' + money(state.stats.bestAuctionSale) + '/£100,000';
}

export const ledgerScene = {
	id: 'ledger',

	// Which tab is showing: 'ledger' or 'workshop'.
	tab: 'ledger',

	// Hit list, rebuilt at the start of every draw so it always matches what
	// is on screen (DESIGN.md 9.7).
	hits: null,

	// Id of the hit pressed on 'down'. An id, never the entry object: draw
	// rebuilds the hit list every frame, so the up lands on a fresh object
	// that must match by id (the tap rule).
	pressed: null,

	enter: function (app, params) {
		this.tab = params && params.tab === 'workshop' ? 'workshop' : 'ledger';
		this.pressed = null;
		this.hits = null;
	},

	draw: function (ctx, app, t) {
		const state = app.state;

		// Hit list first: every tap below must match what this draw shows.
		const hits = makeHits();
		const scene = this;

		// The two tab buttons, and the BACK button.
		const onLedger = this.tab === 'ledger';
		button(ctx, {
			x: LAYOUT.tabLedger.x, y: LAYOUT.tabLedger.y, w: LAYOUT.tabLedger.w, h: LAYOUT.tabLedger.h,
			label: 'LEDGER', enabled: true, hot: onLedger,
		});
		hits.add('tabLedger', LAYOUT.tabLedger.x, LAYOUT.tabLedger.y, LAYOUT.tabLedger.w, LAYOUT.tabLedger.h, function () {
			scene.tab = 'ledger';
		});
		button(ctx, {
			x: LAYOUT.tabWorkshop.x, y: LAYOUT.tabWorkshop.y, w: LAYOUT.tabWorkshop.w, h: LAYOUT.tabWorkshop.h,
			label: 'WORKSHOP', enabled: true, hot: !onLedger,
		});
		hits.add('tabWorkshop', LAYOUT.tabWorkshop.x, LAYOUT.tabWorkshop.y, LAYOUT.tabWorkshop.w, LAYOUT.tabWorkshop.h, function () {
			scene.tab = 'workshop';
		});

		if (onLedger) {
			this.drawLedger(ctx, app);
		} else {
			this.drawWorkshop(ctx, app, hits);
		}

		button(ctx, {
			x: LAYOUT.back.x, y: LAYOUT.back.y, w: LAYOUT.back.w, h: LAYOUT.back.h,
			label: 'BACK',
		});
		hits.add('back', LAYOUT.back.x, LAYOUT.back.y, LAYOUT.back.w, LAYOUT.back.h, function () {
			app.pop();
		});
		this.hits = hits;
	},

	// The ledger tab: the cream book of accounts on the left, the four Gold
	// Number Plates on the right.
	drawLedger: function (ctx, app) {
		const state = app.state;

		panel(ctx, BOOK.x, BOOK.y, BOOK.w, BOOK.h, { fill: PALETTE.paper });
		label(ctx, 'THE BOOKS', BOOK.x + 24, BOOK.y + 16, { size: 20, font: 'title' });

		// Rows: money first, then reputation and buzz.
		const rows = [
			'Cash ' + money(state.cash),
			'Net worth ' + money(safeNetWorth(state)),
			'Stable value ' + money(stableValue(state)),
			'Expected next bills ' + money(expectedBills(state)),
			'Reputation ' + state.reputation + '/100',
			'Buzz ' + state.buzz,
		];
		let y = BOOK.y + 52;
		for (let i = 0; i < rows.length; i++) {
			label(ctx, rows[i], BOOK.x + 24, y, { size: 24 });
			y += 36;
		}

		// Stats block, in two columns so it fits the book.
		y += 12;
		label(ctx, 'STATS', BOOK.x + 24, y, { size: 18, font: 'title' });
		y += 28;
		const stats = state.stats;
		const left = [
			'Jobs done ' + stats.jobsDone,
			'Jobs failed ' + stats.jobsFailed,
			'Adverts run ' + stats.adsRun,
			'Cars bought ' + stats.carsBought,
		];
		const right = [
			'Cars sold ' + stats.carsSold,
			'Best auction sale ' + money(stats.bestAuctionSale),
			'Faults so far ' + stats.faults,
		];
		for (let i = 0; i < left.length; i++) {
			label(ctx, left[i], BOOK.x + 24, y + i * 30, { size: 22 });
		}
		for (let i = 0; i < right.length; i++) {
			label(ctx, right[i], BOOK.x + 340, y + i * 30, { size: 22 });
		}

		// The Gold Number Plates column.
		panel(ctx, PLATES.x, PLATES.y, PLATES.w, PLATES.h);
		label(ctx, 'GOLD NUMBER PLATES', PLATES.x + 24, PLATES.y + 16, {
			size: 20, font: 'title', color: PALETTE.brown,
		});
		let py = PLATES.y + 60;
		for (let i = 0; i < PLATE_KEYS.length; i++) {
			const key = PLATE_KEYS[i];
			const info = PLATE_INFO[key];
			const won = state.plates && state.plates[key] === true;
			label(ctx, info.name, PLATES.x + 24, py, {
				size: 24, font: 'title', color: won ? PALETTE.gold : PALETTE.ink,
			});
			label(ctx, plateProgress(state, key), PLATES.x + PLATES.w - 24, py, {
				size: 24, align: 'right', color: won ? PALETTE.gold : PALETTE.ink,
			});
			label(ctx, info.text, PLATES.x + 24, py + 30, { size: 20, color: PALETTE.darkgrey });
			py += 68;
		}
	},

	// The workshop tab: the garage board, the bays in use and BUY EXTRA SLOT.
	drawWorkshop: function (ctx, app, hits) {
		const state = app.state;
		const slots = state.garageSlots;
		const inUse = carsInGarage(state);

		panel(ctx, BOARD.x, BOARD.y, BOARD.w, BOARD.h, { fill: PALETTE.paper });
		label(ctx, 'WORKSHOP BOARD', BOARD.x + 24, BOARD.y + 16, { size: 22, font: 'title' });
		label(ctx, 'Garage slots ' + slots + '/' + MAX_SLOTS, BOARD.x + BOARD.w - 24, BOARD.y + 16, {
			size: 22, align: 'right',
		});

		// The bays: one rectangle per slot, filled when a car is in it.
		label(ctx, 'Garage bays', BAYS.x, BAYS.y - 32, { size: 20, color: PALETTE.darkgrey });
		for (let i = 0; i < slots; i++) {
			const bx = BAYS.x + i * (BAYS.w + BAYS.gap);
			const filled = i < inUse;
			panel(ctx, bx, BAYS.y, BAYS.w, BAYS.h, {
				fill: filled ? PALETTE.good : PALETTE.cream,
				shadow: false,
			});
			label(ctx, String(i + 1), bx + BAYS.w / 2, BAYS.y + 34, {
				size: 20, align: 'center', font: 'title',
				color: filled ? PALETTE.white : PALETTE.darkgrey,
			});
		}

		const full = slots >= MAX_SLOTS;
		const canAfford = state.cash >= SLOT_COST;
		button(ctx, {
			x: LAYOUT.buySlot.x, y: LAYOUT.buySlot.y, w: LAYOUT.buySlot.w, h: LAYOUT.buySlot.h,
			label: 'BUY EXTRA SLOT ' + money(SLOT_COST),
			kind: 'primary',
			enabled: !full && canAfford,
		});
		hits.add('buySlot', LAYOUT.buySlot.x, LAYOUT.buySlot.y, LAYOUT.buySlot.w, LAYOUT.buySlot.h, function () {
			if (state.garageSlots >= MAX_SLOTS) {
				app.toast('Garage is full-size already');
				return;
			}
			if (state.cash < SLOT_COST) {
				app.toast('Not enough money');
				return;
			}
			app.act(function () { return buySlot(state); });
		});
	},

	// 'down' presses a hit, 'up' commits the tap when it lands on the same hit
	// as the down. The pressed state remembers the hit ID, not the entry object,
	// and is never reset inside draw.
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

	key: function (app, k) {
		if (k === 'Escape') {
			app.pop();
		}
	},
};
