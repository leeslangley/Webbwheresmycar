// Deterministic particle engine (docs/art/GU.md, card GU13): confetti, exhaust
// smoke, breakdown sparks, cash showers and rust flakes. Pure simulation plus
// canvas drawing, with no DOM access and no wall-clock reads. Time comes in as
// dtMs and randomness comes from a seeded integer generator, so the same seed
// and the same calls always give the same particles.

export const MAX_PARTICLES = 300;

// Data table for each kind. life in ms, vx/vy in px per second, g in px/s^2.
export const KINDS = {
	confetti: {
		colors: ['#E8B923', '#D9483B', '#3FAE49', '#70A4B2', '#6F3D86', '#FFFFFF'],
		life: [1800, 2600],
		vx: [-160, 160],
		vy: [-420, -180],
		g: 420,
	},
	smoke: {
		life: [1200, 1900],
		vx: [-14, 14],
		vy: [-70, -30],
		g: -6,
		r0: 6,
		r1: 22,
	},
	sparks: {
		colors: ['#FFD27A', '#FFFFFF'],
		life: [300, 550],
		speed: [200, 420],
		g: 600,
	},
	cash: {
		life: [1100, 1600],
		vx: [-90, 90],
		vy: [-380, -220],
		g: 700,
	},
	rust: {
		colors: ['#8A4B26', '#5A2E14'],
		life: [900, 1400],
		vx: [-50, 50],
		vy: [-80, 0],
		g: 500,
	},
};

// Seeded generator (mulberry32 style, integer maths only).
function next(ps) {
	ps.seed = (ps.seed + 0x6D2B79F5) | 0;
	let z = Math.imul(ps.seed ^ (ps.seed >>> 15), 1 | ps.seed);
	z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z;
	return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
}

// Uniform random number in [lo, hi) from the engine's seeded generator.
function rr(ps, lo, hi) {
	return lo + (hi - lo) * next(ps);
}

export function makeParticles(seed = 1) {
	return { seed, list: [] };
}

export function liveCount(ps) {
	return ps.list.length;
}

// Emit n particles of one kind at (x, y). Stops silently at MAX_PARTICLES.
export function emit(ps, kind, x, y, n) {
	const k = KINDS[kind];
	for (let i = 0; i < n; i++) {
		if (liveCount(ps) >= MAX_PARTICLES) {
			return;
		}
		const life = rr(ps, k.life[0], k.life[1]);
		let vx;
		let vy;
		if (kind === 'sparks') {
			const angle = rr(ps, 0, 2 * Math.PI);
			const speed = rr(ps, k.speed[0], k.speed[1]);
			vx = Math.cos(angle) * speed;
			vy = Math.sin(angle) * speed;
		} else {
			vx = rr(ps, k.vx[0], k.vx[1]);
			vy = rr(ps, k.vy[0], k.vy[1]);
		}
		let color = null;
		if (k.colors) {
			color = k.colors[Math.floor(next(ps) * k.colors.length)];
		}
		const phase = rr(ps, 0, 6.28);
		ps.list.push({ kind, x, y, vx, vy, age: 0, life, color, phase });
	}
}

// Advance every particle by dtMs, then drop the ones that have expired.
// Survivors keep their order.
export function updateParticles(ps, dtMs) {
	const list = ps.list;
	for (let i = 0; i < list.length; i++) {
		const p = list[i];
		const k = KINDS[p.kind];
		p.age += dtMs;
		p.vy += k.g * dtMs / 1000;
		p.x += p.vx * dtMs / 1000;
		p.y += p.vy * dtMs / 1000;
	}
	let w = 0;
	for (let i = 0; i < list.length; i++) {
		if (list[i].age < list[i].life) {
			list[w] = list[i];
			w += 1;
		}
	}
	list.length = w;
}

// Fade out over the last 20% of a particle's life (confetti, sparks, cash, rust).
function fadeWrap(ctx, u, draw) {
	if (u > 0.8) {
		ctx.save();
		ctx.globalAlpha = (1 - u) / 0.2;
		draw();
		ctx.restore();
	} else {
		draw();
	}
}

// Draw every live particle. Shapes are simple rects and circles, so the
// whole effect costs a handful of canvas calls per particle.
export function drawParticles(ctx, ps) {
	for (let i = 0; i < ps.list.length; i++) {
		const p = ps.list[i];
		const u = p.age / p.life;
		if (p.kind === 'confetti') {
			const w = 2 + 4 * Math.abs(Math.cos(p.age * 0.02 + p.phase));
			fadeWrap(ctx, u, function () {
				ctx.fillStyle = p.color;
				ctx.fillRect(p.x, p.y, w, 6);
			});
		} else if (p.kind === 'smoke') {
			const radius = KINDS.smoke.r0 + (KINDS.smoke.r1 - KINDS.smoke.r0) * u;
			ctx.fillStyle = 'rgba(200,200,210,' + (0.5 * (1 - u)).toFixed(3) + ')';
			ctx.beginPath();
			ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI);
			ctx.fill();
		} else if (p.kind === 'sparks') {
			fadeWrap(ctx, u, function () {
				ctx.fillStyle = p.color;
				ctx.fillRect(p.x, p.y, 3, 3);
			});
		} else if (p.kind === 'cash') {
			fadeWrap(ctx, u, function () {
				ctx.fillStyle = '#14102A';
				ctx.fillRect(p.x - 4, p.y - 4, 8, 8);
				ctx.fillStyle = '#E8B923';
				ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
			});
		} else if (p.kind === 'rust') {
			fadeWrap(ctx, u, function () {
				ctx.fillStyle = p.color;
				ctx.fillRect(p.x, p.y, 4, 4);
			});
		}
	}
}
