// The Garage scene (card W60): the stable. See every car you own or rent
// with its true condition, then tinker, service, fix, restore, sell,
// return or consign it to the auction (DESIGN.md sections 4.3, 4.5, 4.10).
// Scene interface per DESIGN.md 9.5/9.7: sim actions only through app.act,
// hit list rebuilt on every draw, and the tap rule (remember the pressed
// id on down, never reset it inside draw). Pure: no DOM, no dates; ctx is
// a parameter so tests can run it under tests/fakectx.js.

import { PALETTE, shade, rgba } from '../theme.js';
import { panel, label, button, bar } from '../kit_draw.js';
import { makeHits, ScrollList } from '../kit_hits.js';
import { drawCar, carBounds } from '../../art/cardraw.js';
import { paintOf } from '../../data/paint.js';
import { modelOf } from '../../data/cars.js';
import { money, oneDp } from '../../core/format.js';
import { roundTo } from '../../core/rng.js';
import { isAuctionDay } from '../../core/clock.js';
import { effD, effR, marketValue, runningCost } from '../../sim/carstats.js';
import { serviceCar, fixFault, restoreCar } from '../../sim/garage.js';
import { sellToDealer, returnRental } from '../../sim/actions.js';
import { consignCar, unconsign } from '../../sim/auction.js';
import { glow, flicker, vignette } from '../../art/roomfx_light.js';
import { drawDust } from '../../art/roomfx_world.js';

export const LAYOUT = {
	list: { x: 40, y: 100, w: 420, h: 520 },
	rowH: 70,
	detail: { x: 480, y: 100, w: 760, h: 520 },
	tinker: { x: 480, y: 560, w: 240, h: 56 },
	service: { x: 730, y: 560, w: 240, h: 56 },
	fix: { x: 980, y: 560, w: 260, h: 56 },
	restore: { x: 480, y: 626, w: 240, h: 56 },
	sell: { x: 730, y: 626, w: 240, h: 56 },
	consign: { x: 980, y: 626, w: 260, h: 56 },
	back: { x: 40, y: 640, w: 200, h: 56 },
};

// Treatment costs, exactly as the sim charges them (DESIGN.md 4.5).
function tinkerCost(model) {
	return Math.round(40 + model.basePrice * 0.002);
}
function serviceCost(model) {
	return Math.round(150 + model.basePrice * 0.008);
}
function restoreCost(model) {
	return Math.max(1200, Math.round(model.basePrice * 0.06));
}
// The dealer pays 60% of market value, rounded to the nearest tenner.
function dealerPrice(state, model, car) {
	return roundTo(marketValue(state, model, car) * 0.6, 10);
}
// Damage fee for returning a rental (DESIGN.md 4.4).
function damageFee(model, car) {
	return Math.round(Math.max(0, car.rentedAtCondition - car.condition) * 0.02 * model.basePrice);
}
function isConsigned(state, carId) {
	const c = state.auction.consigned;
	for (let i = 0; i < c.length; i++) {
		if (c[i].carId === carId) {
			return true;
		}
	}
	return false;
}

// Run one sim action through app.act; toast the refusal message if the
// action did nothing (this is how a disabled button explains itself).
function runAct(app, fn) {
	const res = app.act(fn);
	if (res && res.ok === false) {
		app.toast(res.msg);
	}
	return res;
}

// The garage interior: concrete wall, painted floor and one strip light.
function drawRoom(ctx, app) {
	const wall = ctx.createLinearGradient(0, 0, 0, 460);
	wall.addColorStop(0, shade(PALETTE.midgrey, 0.15));
	wall.addColorStop(1, shade(PALETTE.darkgrey, 0.05));
	ctx.fillStyle = wall;
	ctx.fillRect(0, 0, app.w, 460);
	const floor = ctx.createLinearGradient(0, 460, 0, app.h);
	floor.addColorStop(0, shade(PALETTE.orange, 0.25));
	floor.addColorStop(1, shade(PALETTE.brown, -0.1));
	ctx.fillStyle = floor;
	ctx.fillRect(0, 460, app.w, app.h - 460);
	ctx.fillStyle = rgba(PALETTE.lamp, 0.25);
	ctx.fillRect(app.w / 2 - 90, 16, 180, 28);
	ctx.fillStyle = PALETTE.lamp;
	ctx.fillRect(app.w / 2 - 70, 24, 140, 12);
}

// The garage as a Blender plate (card GE19): the room plate, three flickering
// strip lights, floating dust and a vignette on top.
function drawGaragePlate(ctx, app, t) {
	app.rooms.draw(ctx, 'garage', {look: app.look || {x: 0, y: 0}});
	const lights = [290, 640, 990];
	for (let i = 0; i < lights.length; i++) {
		glow(ctx, lights[i], 18, 150, '#dff1ff', 0.22 * flicker(t, i * 2.1, 0.18));
	}
	drawDust(ctx, {x: 0, y: 100, w: 1280, h: 400}, t, 24);
	vignette(ctx, 1280, 720, 0.3);
}

// One list row: name, OWN/RENT tag, condition, FAULT and IMPOUNDED tags.
function drawRow(ctx, scene, state, car, i) {
	const L = LAYOUT.list;
	const model = modelOf(car.modelId);
	const y = L.y + i * LAYOUT.rowH - scene.scroll.offset;
	ctx.fillStyle = car.id === scene.selId ? PALETTE.lightblue : PALETTE.cream;
	ctx.fillRect(L.x, y, L.w, LAYOUT.rowH - 4);
	label(ctx, model.name, L.x + 10, y + 6, { size: 24, font: 'body', color: PALETTE.ink, maxW: L.w - 140 });
	label(ctx, car.owned ? 'OWN' : 'RENT', L.x + L.w - 10, y + 10, {
		size: 16, font: 'title', align: 'right',
		color: car.owned ? PALETTE.good : PALETTE.purple,
	});
	label(ctx, 'COND ' + oneDp(car.condition), L.x + 10, y + 40, { size: 20, font: 'body', color: PALETTE.darkgrey });
	if (car.fault) {
		label(ctx, 'FAULT', L.x + 130, y + 42, { size: 16, font: 'title', color: PALETTE.bad });
	}
	if ((car.impoundedUntil || 0) > state.day) {
		label(ctx, 'IMPOUNDED', L.x + 240, y + 42, { size: 16, font: 'title', color: PALETTE.purple });
	}
	// Hit rect clipped to the visible part of the row.
	const hy = Math.max(y, L.y);
	const hb = Math.min(y + LAYOUT.rowH, L.y + L.h);
	if (hb > hy) {
		scene.hits.add('row:' + car.id, L.x, hy, L.w, hb - hy, function () {
			scene.selId = car.id;
		});
	}
}

// The detail panel: the big car, its quip, effective stats against the
// model's base, condition, value, running cost or rent, and any fault.
function drawDetail(ctx, state, car, t) {
	const D = LAYOUT.detail;
	panel(ctx, D.x, D.y, D.w, D.h, { fill: PALETTE.paper, bw: 3 });
	if (!car) {
		return;
	}
	const model = modelOf(car.modelId);
	label(ctx, model.name, D.x + 20, D.y + 14, { size: 28, font: 'title', color: PALETTE.ink, maxW: D.w - 40 });
	label(ctx, model.quip, D.x + 20, D.y + 56, { size: 24, font: 'body', color: PALETTE.darkgrey, maxW: D.w - 40 });
	const scale = 440 / carBounds(model.archetype, 1).w;
	drawCar(ctx, model.archetype, D.x + 220, D.y + 230, scale, {
		body: paintOf(model.id),
		cond: car.condition,
		t: t,
	});
	// Stat bars: the fill is the effective stat, the marker is the base.
	const bx = D.x + 20;
	const bw = 320;
	let by = D.y + 290;
	label(ctx, 'DESIRABILITY ' + oneDp(effD(model, car)), bx, by, { size: 16, font: 'title', color: PALETTE.ink });
	bar(ctx, bx, by + 22, bw, 14, effD(model, car), 10, PALETTE.lightblue);
	ctx.fillStyle = PALETTE.ink;
	ctx.fillRect(bx + 1 + (bw - 2) * (model.desirability / 10), by + 20, 2, 18);
	by += 60;
	label(ctx, 'RELIABILITY ' + oneDp(effR(model, car)), bx, by, { size: 16, font: 'title', color: PALETTE.ink });
	bar(ctx, bx, by + 22, bw, 14, effR(model, car), 10, PALETTE.good);
	ctx.fillStyle = PALETTE.ink;
	ctx.fillRect(bx + 1 + (bw - 2) * (model.reliability / 10), by + 20, 2, 18);
	by += 60;
	const condColor = car.condition >= 7 ? PALETTE.good : car.condition >= 4 ? PALETTE.lamp : PALETTE.bad;
	label(ctx, 'CONDITION ' + oneDp(car.condition), bx, by, { size: 16, font: 'title', color: PALETTE.ink });
	bar(ctx, bx, by + 22, bw, 14, car.condition, 10, condColor);
	// Money and fault lines, right of the bars.
	const rx = D.x + 380;
	let ty = D.y + 290;
	label(ctx, 'Value ' + money(marketValue(state, model, car)), rx, ty, { size: 26, font: 'body', color: PALETTE.ink });
	ty += 34;
	if (car.owned) {
		label(ctx, 'Running cost/month ' + money(runningCost(model, car)), rx, ty, { size: 26, font: 'body', color: PALETTE.ink });
	} else {
		label(ctx, 'Rent/month ' + money(car.rentMonthly), rx, ty, { size: 26, font: 'body', color: PALETTE.ink });
	}
	ty += 34;
	if (car.fault) {
		label(ctx, 'FAULT: ' + car.fault.label + ' (fix ' + money(car.fault.cost) + ')', rx, ty, {
			size: 24, font: 'body', color: PALETTE.bad, maxW: D.w - 400,
		});
	}
}

// Buttons for the selected car. Disabled buttons still take the tap: the
// sim refuses politely and the refusal becomes the toast.
function drawButtons(ctx, app, state, car) {
	const L = LAYOUT;
	const model = modelOf(car.modelId);
	const consigned = isConsigned(state, car.id);
	const tc = tinkerCost(model);
	button(ctx, { x: L.tinker.x, y: L.tinker.y, w: L.tinker.w, h: L.tinker.h, label: 'TINKER ' + money(tc), enabled: car.condition < 10 && state.cash >= tc });
	this.hits.add('tinker', L.tinker.x, L.tinker.y, L.tinker.w, L.tinker.h, function () {
		runAct(app, function () { return serviceCar(state, car.id, 'quick'); });
	});
	const sc = serviceCost(model);
	button(ctx, { x: L.service.x, y: L.service.y, w: L.service.w, h: L.service.h, label: 'SERVICE ' + money(sc), enabled: car.condition < 10 && state.cash >= sc });
	this.hits.add('service', L.service.x, L.service.y, L.service.w, L.service.h, function () {
		runAct(app, function () { return serviceCar(state, car.id, 'full'); });
	});
	const hasFault = car.fault !== null;
	const fc = hasFault ? car.fault.cost : 0;
	button(ctx, { x: L.fix.x, y: L.fix.y, w: L.fix.w, h: L.fix.h, label: hasFault ? 'FIX FAULT ' + money(fc) : 'FIX FAULT', enabled: hasFault && state.cash >= fc });
	this.hits.add('fix', L.fix.x, L.fix.y, L.fix.w, L.fix.h, function () {
		runAct(app, function () { return fixFault(state, car.id); });
	});
	const rc = restoreCost(model);
	const perfect = car.condition >= 10 && car.fault === null;
	button(ctx, { x: L.restore.x, y: L.restore.y, w: L.restore.w, h: L.restore.h, label: 'RESTORE ' + money(rc), enabled: !perfect && state.cash >= rc });
	this.hits.add('restore', L.restore.x, L.restore.y, L.restore.w, L.restore.h, function () {
		runAct(app, function () { return restoreCar(state, car.id); });
	});
	if (car.owned) {
		const price = dealerPrice(state, model, car);
		button(ctx, { x: L.sell.x, y: L.sell.y, w: L.sell.w, h: L.sell.h, label: 'SELL ' + money(price), enabled: !consigned });
		this.hits.add('sell', L.sell.x, L.sell.y, L.sell.w, L.sell.h, function () {
			runAct(app, function () { return sellToDealer(state, car.id); });
		});
		button(ctx, { x: L.consign.x, y: L.consign.y, w: L.consign.w, h: L.consign.h, label: consigned ? 'WITHDRAW' : 'CONSIGN', enabled: consigned || !isAuctionDay(state.day) });
		this.hits.add('consign', L.consign.x, L.consign.y, L.consign.w, L.consign.h, function () {
			if (consigned) {
				runAct(app, function () { return unconsign(state, car.id); });
				return;
			}
			if (isAuctionDay(state.day)) {
				app.toast('Too late, the auction is today');
				return;
			}
			const reserve = roundTo(marketValue(state, model, car) * 0.7, 10);
			const res = app.act(function () { return consignCar(state, car.id, reserve); });
			if (res.ok) {
				app.toast('Consigned. Reserve ' + money(reserve));
			} else {
				app.toast(res.msg);
			}
		});
	} else {
		const fee = damageFee(model, car);
		button(ctx, { x: L.sell.x, y: L.sell.y, w: L.sell.w, h: L.sell.h, label: 'RETURN ' + money(fee), enabled: state.cash >= fee });
		this.hits.add('return', L.sell.x, L.sell.y, L.sell.w, L.sell.h, function () {
			runAct(app, function () { return returnRental(state, car.id); });
		});
	}
}

export const garageScene = {
	id: 'garage',
	enter: function (app, params) {
		const cars = app.state ? app.state.cars : [];
		this.selId = params && params.carId ? params.carId : (cars.length > 0 ? cars[0].id : null);
		this.pressed = null;
		this.scroll = new ScrollList({ viewH: LAYOUT.list.h, rowH: LAYOUT.rowH, count: cars.length });
		this.hits = makeHits();
	},
	pointer: function (app, type, x, y) {
		const nowMs = typeof app.now === 'function' ? app.now() : (app.now || 0);
		if (type === 'down') {
			// Tap rule: remember the hit's id, never the hit object.
			const h = this.hits.hit(x, y);
			this.pressed = h ? h.id : null;
			this.scroll.beginDrag(y, nowMs);
			return;
		}
		if (type === 'move') {
			this.scroll.dragTo(y, nowMs);
			return;
		}
		if (type === 'up') {
			const res = this.scroll.endDrag();
			if (res.tapped) {
				const e = this.hits.hit(x, y);
				if (e && this.pressed !== null && e.id === this.pressed && typeof e.onTap === 'function') {
					e.onTap(e);
				}
			}
			this.pressed = null;
		}
	},
	key: function (app, k) {
		const state = app.state;
		if (!state) {
			return;
		}
		if (k === 'Escape') {
			app.pop();
			return;
		}
		const cars = state.cars;
		if (cars.length === 0) {
			return;
		}
		let idx = 0;
		for (let i = 0; i < cars.length; i++) {
			if (cars[i].id === this.selId) {
				idx = i;
			}
		}
		if (k === 'ArrowUp' || k === 'Up') {
			this.selId = cars[Math.max(0, idx - 1)].id;
		} else if (k === 'ArrowDown' || k === 'Down') {
			this.selId = cars[Math.min(cars.length - 1, idx + 1)].id;
		} else if (k === 's') {
			runAct(app, function () { return serviceCar(state, cars[idx].id, 'full'); });
		} else if (k === 't') {
			runAct(app, function () { return serviceCar(state, cars[idx].id, 'quick'); });
		} else if (k === 'f') {
			runAct(app, function () { return fixFault(state, cars[idx].id); });
		}
	},
	draw: function (ctx, app, t) {
		const state = app.state;
		if (!state) {
			return;
		}
		const cars = state.cars;
		this.scroll.setCount(cars.length);
		this.hits.clear();
		if (app.rooms && app.rooms.has('garage')) {
			drawGaragePlate(ctx, app, t);
		} else {
			drawRoom(ctx, app);
		}
		label(ctx, 'THE STABLE  ' + cars.length + '/' + state.garageSlots, 40, 40, {
			size: 22, font: 'title', color: PALETTE.cream, shadow: true,
		});
		// The car list (left), scrolling inside its panel.
		const L = LAYOUT.list;
		panel(ctx, L.x - 6, L.y - 6, L.w + 12, L.h + 12, { fill: PALETTE.ink, bw: 2 });
		if (cars.length === 0) {
			label(ctx, 'The garage is empty. Mark weeps quietly.', L.x + L.w / 2, L.y + 40, {
				size: 26, font: 'body', align: 'center', color: PALETTE.cream,
			});
		} else {
			ctx.save();
			ctx.beginPath();
			ctx.rect(L.x, L.y, L.w, L.h);
			ctx.clip();
			const range = this.scroll.visibleRange();
			for (let i = range.first; i <= range.last; i++) {
				if (cars[i]) {
					drawRow(ctx, this, state, cars[i], i);
				}
			}
			ctx.restore();
		}
		// The selected car (right). Buttons always follow a selection.
		let sel = null;
		for (let i = 0; i < cars.length; i++) {
			if (cars[i].id === this.selId) {
				sel = cars[i];
			}
		}
		if (!sel && cars.length > 0) {
			sel = cars[0];
			this.selId = sel.id;
		}
		drawDetail(ctx, state, sel, t);
		if (sel) {
			drawButtons.call(this, ctx, app, state, sel);
		}
		button(ctx, { x: LAYOUT.back.x, y: LAYOUT.back.y, w: LAYOUT.back.w, h: LAYOUT.back.h, label: 'BACK' });
		this.hits.add('back', LAYOUT.back.x, LAYOUT.back.y, LAYOUT.back.w, LAYOUT.back.h, function () {
			app.pop();
		});
	},
};
