// The Bookings scene (DESIGN.md sections 4.7, 8.2, 9.5, 9.7): the phone.
// A list of customers wanting a car; the player picks a request, picks a
// car that meets its needs and accepts. Pure UI: no DOM, no Math.random,
// no Date; the job is accepted only through app.act around acceptJob.

import { PALETTE } from '../theme.js';
import { makeHits, ScrollList } from '../kit_hits.js';
import { panel, label, button, paragraph } from '../kit_draw.js';
import { drawCar } from '../../art/cardraw.js';
import { drawPhone } from '../../art/props.js';
import { lampGlow, vignette } from '../../art/roomfx_light.js';
import { money, oneDp, plural } from '../../core/format.js';
import { CAR_BY_ID } from '../../data/cars.js';
import { jobTypeOf } from '../../data/jobtypes.js';
import { effD, effR, isAvailable } from '../../sim/carstats.js';
import { acceptJob } from '../../sim/jobresolve.js';

// Screen layout (DESIGN.md 9.5): 1280x720 logical pixels.
export const LAYOUT = {
	requests: { x: 40, y: 110, w: 560, h: 360 },
	rowH: 90,
	cars: { x: 40, y: 490, w: 560, h: 150 },
	carW: 180,
	detail: { x: 620, y: 110, w: 620, h: 420 },
	accept: { x: 620, y: 550, w: 620, h: 70 },
	back: { x: 40, y: 650, w: 200, h: 50 },
};

const PHONE_RECT = { x: 1150, y: 10, w: 80, h: 86 };
const EMPTY_REQUESTS = 'No bookings. The phone is suspiciously quiet. Try advertising.';
const EMPTY_CARS = 'You need a car first.';

function inRect(r, x, y) {
	return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
}

// A car's catalogue model, or null when the car carries an id the catalogue
// does not know (corrupt or future save). Nothing here may throw on such a
// car: it is left out of the strip and never accepted.
function modelOrNull(car) {
	return Object.prototype.hasOwnProperty.call(CAR_BY_ID, car.modelId) ? CAR_BY_ID[car.modelId] : null;
}

// The clock may be a function (real app) or a plain number (test fakes).
function nowMs(app) {
	return typeof app.now === 'function' ? app.now() : app.now;
}

function findReq(state, id) {
	if (id === null) return null;
	for (let i = 0; i < state.requests.length; i++) {
		if (state.requests[i].id === id) return state.requests[i];
	}
	return null;
}

function findCar(state, id) {
	if (id === null) return null;
	for (let i = 0; i < state.cars.length; i++) {
		if (state.cars[i].id === id) return state.cars[i];
	}
	return null;
}

// The player's own cars; rented cars are not ours to send out, and a car with
// an unknown model is not something we can show or send.
function ownedCars(state) {
	const out = [];
	for (let i = 0; i < state.cars.length; i++) {
		const car = state.cars[i];
		if (car.owned === true && modelOrNull(car) !== null) out.push(car);
	}
	return out;
}

// Why a car cannot take the selected booking right now, or null when it
// can. FAULT and IMPOUNDED apply always; the TOO reasons need a request.
function carBlock(state, car, req) {
	if (car.fault) return 'FAULT';
	if ((car.impoundedUntil || 0) > state.day) return 'IMPOUNDED';
	const model = modelOrNull(car);
	if (model === null) return 'FAULT';
	if (req) {
		if (effD(model, car) < req.minDesirability) return 'TOO PLAIN';
		if (effR(model, car) < req.minReliability) return 'TOO FLAKY';
		if (car.condition < req.minCondition) return 'TOO SCRUFFY';
	}
	return null;
}

// True when the picked pair can be accepted as it stands.
function canAccept(state, selReq, selCar) {
	const req = findReq(state, selReq);
	const car = findCar(state, selCar);
	if (!req || !car) return false;
	return carBlock(state, car, req) === null;
}

export const bookingsScene = {
	id: 'bookings',

	hits: null,
	_pressed: null,
	dragArea: null,
	selReq: null,
	selCar: null,
	reqScroll: null,
	carScroll: null,

	enter: function (app, params) {
		this._pressed = null;
		this.hits = null;
		this.dragArea = null;
		this.selReq = params && params.requestId ? params.requestId : null;
		this.selCar = null;
		this.reqScroll = null;
		this.carScroll = null;
	},

	// Lazily made scroll models, then resized to the current counts.
	scrolls: function (state) {
		if (!this.reqScroll) {
			this.reqScroll = new ScrollList({ viewH: LAYOUT.requests.h, rowH: LAYOUT.rowH, count: state.requests.length });
		}
		if (!this.carScroll) {
			this.carScroll = new ScrollList({ viewH: LAYOUT.cars.w, rowH: LAYOUT.carW, count: ownedCars(state).length });
		}
		this.reqScroll.setCount(state.requests.length);
		this.carScroll.setCount(ownedCars(state).length);
	},

	// The accept button's tap: a disabled button still explains itself.
	onAccept: function (app) {
		const state = app.state;
		const car = findCar(state, this.selCar);
		if (!car) {
			app.toast('Pick a car first');
			return;
		}
		if (!isAvailable(state, car)) {
			app.toast('That car is not fit to go out');
			return;
		}
		const req = findReq(state, this.selReq);
		if (!req) {
			app.toast('Pick a booking first');
			return;
		}
		const model = modelOrNull(car);
		if (model === null) {
			app.toast('That car is not fit to go out');
			return;
		}
		if (effD(model, car) < req.minDesirability) {
			app.toast('That car is too plain for this booking');
			return;
		}
		if (effR(model, car) < req.minReliability) {
			app.toast('That car is too flaky for this booking');
			return;
		}
		if (car.condition < req.minCondition) {
			app.toast('That car is too scruffy for this booking');
			return;
		}
		const res = app.act(function () {
			return acceptJob(state, req.id, car.id);
		});
		if (!res.ok) {
			app.toast(res.msg);
			return;
		}
		this.selReq = null;
		this.selCar = null;
	},

	draw: function (ctx, app, t) {
		const state = app.state;
		const L = LAYOUT;
		this.scrolls(state);

		// Hit list first: every tap below must match what this draw shows.
		const hits = makeHits();
		hits.add('back', L.back.x, L.back.y, L.back.w, L.back.h, function () {
			app.pop();
		});
		hits.add('accept', L.accept.x, L.accept.y, L.accept.w, L.accept.h, () => {
			this.onAccept(app);
		});

		// Desk plate with its lamp glow (plate mode only), behind the panels.
		const plate = !!(app.rooms && app.rooms.has('bookings'));
		if (plate) {
			app.rooms.draw(ctx, 'bookings', { look: app.look || { x: 0, y: 0 } });
			lampGlow(ctx, 190, 135, t);
		}

		// Header: the phone, ringing when there is business on the line.
		label(ctx, 'BOOKINGS', L.requests.x, 24, { size: 28, font: 'title', color: PALETTE.cream });
		drawPhone(ctx, PHONE_RECT, t, state.requests.length > 0);

		// Requests list: up to 6 rows of 90px, scrollable.
		panel(ctx, L.requests.x, L.requests.y, L.requests.w, L.requests.h);
		const reqs = state.requests;
		if (reqs.length === 0) {
			paragraph(ctx, EMPTY_REQUESTS, L.requests.x + 24, L.requests.y + 40, L.requests.w - 48, { size: 30 });
		} else {
			ctx.save();
			ctx.beginPath();
			ctx.rect(L.requests.x, L.requests.y, L.requests.w, L.requests.h);
			ctx.clip();
			const range = this.reqScroll.visibleRange();
			for (let i = range.first; i <= range.last; i++) {
				const req = reqs[i];
				const y = L.requests.y + i * L.rowH - this.reqScroll.offset;
				panel(ctx, L.requests.x + 8, y + 4, L.requests.w - 16, L.rowH - 8, { shadow: false });
				const job = jobTypeOf(req.jobTypeId);
				label(ctx, job.name, L.requests.x + 24, y + 12, { size: 12, font: 'title' });
				label(ctx, req.customer, L.requests.x + 24, y + 32, { size: 26 });
				label(ctx, money(req.fee), L.requests.x + 24, y + 60, { size: 26, color: PALETTE.good });
				const left = req.expiresDay - state.day;
				label(ctx, plural(left, 'day left', 'days left'), L.requests.x + L.requests.w - 24, y + 12, {
					size: 26,
					align: 'right',
					color: left <= 1 ? PALETTE.bad : PALETTE.ink,
				});
				if (req.id === this.selReq) {
					ctx.lineWidth = 3;
					ctx.strokeStyle = PALETTE.lamp;
					ctx.strokeRect(L.requests.x + 8, y + 4, L.requests.w - 16, L.rowH - 8);
				}
				const ty = Math.max(y + 4, L.requests.y);
				const by = Math.min(y + L.rowH, L.requests.y + L.requests.h);
				if (by > ty) {
					hits.add('req:' + req.id, L.requests.x, ty, L.requests.w, by - ty, () => {
						this.selReq = req.id;
					});
				}
			}
			ctx.restore();
		}

		// The player's cars as a horizontally scrollable strip of cards.
		panel(ctx, L.cars.x, L.cars.y, L.cars.w, L.cars.h);
		const cars = ownedCars(state);
		if (cars.length === 0) {
			paragraph(ctx, EMPTY_CARS, L.cars.x + 24, L.cars.y + 30, L.cars.w - 48, { size: 30 });
		} else {
			ctx.save();
			ctx.beginPath();
			ctx.rect(L.cars.x, L.cars.y, L.cars.w, L.cars.h);
			ctx.clip();
			const range = this.carScroll.visibleRange();
			for (let i = range.first; i <= range.last; i++) {
				const car = cars[i];
				const model = modelOrNull(car);
				if (model === null) continue;
				const x = L.cars.x + i * L.carW + 6 - this.carScroll.offset;
				const y = L.cars.y + 6;
				const w = L.carW - 12;
				const h = L.cars.h - 12;
				panel(ctx, x, y, w, h, { shadow: false });
				label(ctx, model.name, x + 10, y + 10, { size: 10, font: 'title', maxW: w - 20 });
				drawCar(ctx, model.archetype, x + w / 2, y + h - 40, 0.4, { cond: car.condition });
				const block = carBlock(state, car, findReq(state, this.selReq));
				const bottom = block !== null ? block : 'Cond ' + oneDp(car.condition);
				label(ctx, bottom, x + w / 2, y + h - 30, {
					size: 14,
					font: 'title',
					align: 'center',
					color: block !== null ? PALETTE.bad : PALETTE.ink,
					maxW: w - 16,
				});
				if (block !== null) {
					// Grey the whole card out: this car is not going anywhere.
					ctx.fillStyle = 'rgba(244,233,200,0.55)';
					ctx.fillRect(x, y, w, h);
					label(ctx, block, x + w / 2, y + h / 2 - 10, {
						size: 14,
						font: 'title',
						align: 'center',
						color: PALETTE.bad,
					});
				} else if (car.id === this.selCar) {
					ctx.lineWidth = 3;
					ctx.strokeStyle = PALETTE.lamp;
					ctx.strokeRect(x, y, w, h);
				}
				const lx = Math.max(x, L.cars.x);
				const rx = Math.min(x + w, L.cars.x + L.cars.w);
				if (rx > lx) {
					hits.add('car:' + car.id, lx, y, rx - lx, h, () => {
						this.selCar = car.id;
					});
				}
			}
			ctx.restore();
		}

		// Detail panel: the chosen booking, its money and its needs.
		panel(ctx, L.detail.x, L.detail.y, L.detail.w, L.detail.h);
		const dx = L.detail.x + 24;
		const dw = L.detail.w - 48;
		const req = findReq(state, this.selReq);
		if (!req) {
			paragraph(ctx, 'Pick a booking on the left, then pick a car for the job.', dx, L.detail.y + 30, dw, { size: 32 });
		} else {
			const job = jobTypeOf(req.jobTypeId);
			label(ctx, job.name, dx, L.detail.y + 20, { size: 16, font: 'title' });
			paragraph(ctx, req.blurb, dx, L.detail.y + 60, dw, { size: 28 });
			label(ctx, 'Fee', dx, L.detail.y + 210, { size: 30 });
			label(ctx, money(req.fee), dx + 90, L.detail.y + 210, { size: 30, color: PALETTE.good });
			const car = findCar(state, this.selCar);
			const cmodel = car ? modelOrNull(car) : null;
			const lines = [
				['Style needed', req.minDesirability, cmodel ? effD(cmodel, car) : null],
				['Reliability needed', req.minReliability, cmodel ? effR(cmodel, car) : null],
				['Condition needed', req.minCondition, cmodel ? car.condition : null],
			];
			for (let i = 0; i < lines.length; i++) {
				const y = L.detail.y + 260 + i * 40;
				label(ctx, lines[i][0] + ' ' + lines[i][1], dx, y, { size: 28 });
				if (lines[i][2] !== null) {
					const pass = lines[i][2] >= lines[i][1];
					label(ctx, pass ? 'OK' : 'NO', dx + 340, y, { size: 20, font: 'title', color: pass ? PALETTE.good : PALETTE.bad });
					label(ctx, oneDp(lines[i][2]), dx + 430, y, { size: 28 });
				}
			}
		}

		// Accept and Back. The accept hit stays tappable while disabled so
		// the tap can toast the reason instead of dying silently.
		const ready = canAccept(state, this.selReq, this.selCar);
		button(ctx, {
			x: L.accept.x, y: L.accept.y, w: L.accept.w, h: L.accept.h,
			label: 'ACCEPT JOB ' + (req ? money(req.fee) : ''),
			enabled: ready,
			kind: 'primary',
		});
		button(ctx, { x: L.back.x, y: L.back.y, w: L.back.w, h: L.back.h, label: 'BACK' });
		this.hits = hits;
		if (plate) {
			vignette(ctx, 1280, 720, 0.25);
		}
	},

	pointer: function (app, type, x, y) {
		if (this.hits === null) {
			return;
		}
		if (type === 'down') {
			const h = this.hits.hit(x, y);
			this._pressed = h ? h.id : null;
			this.dragArea = null;
			if (inRect(LAYOUT.requests, x, y)) {
				this.dragArea = 'requests';
				this.reqScroll.beginDrag(y - LAYOUT.requests.y, nowMs(app));
			} else if (inRect(LAYOUT.cars, x, y)) {
				this.dragArea = 'cars';
				this.carScroll.beginDrag(x - LAYOUT.cars.x, nowMs(app));
			}
			return;
		}
		if (type === 'move') {
			if (this.dragArea === 'requests') {
				this.reqScroll.dragTo(y - LAYOUT.requests.y, nowMs(app));
			} else if (this.dragArea === 'cars') {
				this.carScroll.dragTo(x - LAYOUT.cars.x, nowMs(app));
			}
			return;
		}
		if (type === 'up') {
			// A drag is not a tap: endDrag decides.
			let allowTap = true;
			if (this.dragArea === 'requests') {
				allowTap = this.reqScroll.endDrag().tapped;
				this.dragArea = null;
			} else if (this.dragArea === 'cars') {
				allowTap = this.carScroll.endDrag().tapped;
				this.dragArea = null;
			}
			const e = allowTap ? this.hits.hit(x, y) : null;
			const pressed = this._pressed;
			this._pressed = null;
			if (e && pressed !== null && e.id === pressed && typeof e.onTap === 'function') {
				e.onTap(e);
			}
		}
	},

	key: function (app, k) {
		if (k === 'Escape') {
			app.pop();
		}
	},
};
