// Tests for src/ui/particles.js (GU13), run under `jsc -m`.

import { test, eq, ok, near, done } from './harness.js';
import { makeCtx, count, lastSet } from './fakectx.js';
import {
	MAX_PARTICLES, KINDS, makeParticles, liveCount, emit, updateParticles, drawParticles,
} from '../src/ui/particles.js';

const CONFETTI_COLORS = ['#E8B923', '#D9483B', '#3FAE49', '#70A4B2', '#6F3D86', '#FFFFFF'];

// Index of the first recorded call with the given name at or after from, or -1.
function indexFrom(ctx, name, from) {
	for (let i = from; i < ctx.calls.length; i++) {
		if (ctx.calls[i][0] === name) {
			return i;
		}
	}
	return -1;
}

test('makeParticles starts empty', () => {
	const ps = makeParticles(1);
	eq(liveCount(ps), 0, 'empty');
	eq(ps.seed, 1, 'seed kept');
});

test('makeParticles defaults seed to 1', () => {
	eq(makeParticles().seed, 1, 'default seed');
});

test('emit adds n confetti particles', () => {
	const ps = makeParticles(1);
	emit(ps, 'confetti', 100, 100, 10);
	eq(liveCount(ps), 10, 'ten confetti');
	eq(ps.list[0].kind, 'confetti', 'kind stored');
	eq(ps.list[0].age, 0, 'age starts at 0');
});

test('updateParticles past every life removes all confetti', () => {
	const ps = makeParticles(1);
	emit(ps, 'confetti', 100, 100, 10);
	updateParticles(ps, 3000);
	eq(liveCount(ps), 0, 'all expired');
});

test('same seed and same calls give identical lists', () => {
	const a = makeParticles(42);
	const b = makeParticles(42);
	emit(a, 'confetti', 10, 20, 15);
	emit(b, 'confetti', 10, 20, 15);
	emit(a, 'smoke', 5, 5, 4);
	emit(b, 'smoke', 5, 5, 4);
	eq(a.list, b.list, 'lists equal after emit');
	updateParticles(a, 100);
	updateParticles(b, 100);
	eq(a.list, b.list, 'lists equal after update');
});

test('different seeds give different particles', () => {
	const a = makeParticles(1);
	const b = makeParticles(2);
	emit(a, 'confetti', 0, 0, 5);
	emit(b, 'confetti', 0, 0, 5);
	ok(JSON.stringify(a.list) !== JSON.stringify(b.list), 'seeds 1 and 2 differ');
});

test('emit stops at MAX_PARTICLES', () => {
	eq(MAX_PARTICLES, 300, 'cap value');
	const ps = makeParticles(1);
	emit(ps, 'sparks', 0, 0, 500);
	eq(liveCount(ps), 300, 'capped at 300');
	emit(ps, 'smoke', 0, 0, 5);
	eq(liveCount(ps), 300, 'still capped');
});

test('confetti colours are from the six listed', () => {
	const ps = makeParticles(7);
	emit(ps, 'confetti', 0, 0, 60);
	for (let i = 0; i < ps.list.length; i++) {
		ok(CONFETTI_COLORS.indexOf(ps.list[i].color) >= 0, 'colour ' + ps.list[i].color);
	}
});

test('sparks speed is between 200 and 420', () => {
	const ps = makeParticles(3);
	emit(ps, 'sparks', 0, 0, 100);
	for (let i = 0; i < ps.list.length; i++) {
		const s = Math.hypot(ps.list[i].vx, ps.list[i].vy);
		ok(s >= 200 - 1e-6 && s <= 420 + 1e-6, 'speed ' + s);
	}
});

test('sparks lifetime is between 300 and 550', () => {
	const ps = makeParticles(5);
	emit(ps, 'sparks', 0, 0, 50);
	for (let i = 0; i < ps.list.length; i++) {
		ok(ps.list[i].life >= 300 && ps.list[i].life <= 550, 'life ' + ps.list[i].life);
	}
});

test('cash moves by vx*dt then by the new vy*dt, with gravity 700 first', () => {
	const ps = makeParticles(9);
	emit(ps, 'cash', 100, 100, 1);
	const p = ps.list[0];
	const vx0 = p.vx;
	const vy0 = p.vy;
	updateParticles(ps, 100);
	near(p.vy, vy0 + 70, 1e-9, 'vy gains 70');
	near(p.x, 100 + vx0 * 0.1, 1e-9, 'x moved by vx*0.1');
	near(p.y, 100 + (vy0 + 70) * 0.1, 1e-9, 'y moved by new vy*0.1');
});

test('smoke gravity is -6 per second, so vy drifts further up', () => {
	eq(KINDS.smoke.g, -6, 'smoke gravity');
	const ps = makeParticles(11);
	emit(ps, 'smoke', 0, 0, 1);
	const vy0 = ps.list[0].vy;
	updateParticles(ps, 1000);
	near(ps.list[0].vy, vy0 - 6, 1e-9, 'vy minus 6 after 1 s');
});

test('drawParticles for 10 confetti makes 10 fillRects of height 6, width 2 to 6', () => {
	const ps = makeParticles(1);
	emit(ps, 'confetti', 100, 100, 10);
	const ctx = makeCtx();
	drawParticles(ctx, ps);
	eq(count(ctx, 'fillRect'), 10, 'ten fillRects');
	for (let i = 0; i < ctx.calls.length; i++) {
		if (ctx.calls[i][0] === 'fillRect') {
			const a = ctx.calls[i][1];
			eq(a[3], 6, 'height');
			ok(a[2] >= 2 && a[2] <= 6, 'width ' + a[2]);
		}
	}
});

test('4 cash particles make 8 fillRects, 4 of them 8x8', () => {
	const ps = makeParticles(1);
	emit(ps, 'cash', 50, 50, 4);
	const ctx = makeCtx();
	drawParticles(ctx, ps);
	eq(count(ctx, 'fillRect'), 8, 'eight fillRects');
	let big = 0;
	for (let i = 0; i < ctx.calls.length; i++) {
		const c = ctx.calls[i];
		if (c[0] === 'fillRect' && c[1][2] === 8 && c[1][3] === 8) {
			big += 1;
		}
	}
	eq(big, 4, 'four 8x8 rects');
});

test('3 smoke particles make 3 arcs', () => {
	const ps = makeParticles(1);
	emit(ps, 'smoke', 30, 30, 3);
	const ctx = makeCtx();
	drawParticles(ctx, ps);
	eq(count(ctx, 'arc'), 3, 'three arcs');
	eq(count(ctx, 'fill'), 3, 'three fills');
});

test('particle at 0.9 of its life draws inside save/restore with globalAlpha 0.5', () => {
	const ps = makeParticles(1);
	emit(ps, 'sparks', 10, 10, 1);
	const p = ps.list[0];
	p.age = 0.9 * p.life;
	const ctx = makeCtx();
	drawParticles(ctx, ps);
	const s = indexFrom(ctx, 'save', 0);
	const r = indexFrom(ctx, 'restore', s + 1);
	const f = indexFrom(ctx, 'fillRect', s + 1);
	ok(s >= 0 && r > s && f > s && f < r, 'fillRect sits between save and restore');
	near(lastSet(ctx, 'globalAlpha'), 0.5, 1e-9, 'globalAlpha');
});

test('particle below 0.8 of its life is not alpha-wrapped', () => {
	const ps = makeParticles(1);
	emit(ps, 'rust', 10, 10, 1);
	const ctx = makeCtx();
	drawParticles(ctx, ps);
	eq(count(ctx, 'save'), 0, 'no save');
	eq(count(ctx, 'fillRect'), 1, 'one fillRect');
});

done();
