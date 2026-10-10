// Daily customer booking requests (DESIGN.md sections 4.7 and 9.3).
// advanceDay calls generateRequests each morning; expireRequests drops the
// requests that ran out of days. Pure sim module: randomness only through
// state.rng, no DOM, no dates.

import { rand, randInt, chance, pick } from '../core/rng.js';
import { JOB_TYPES, fillText } from '../data/jobtypes.js';
import { customerName } from '../data/names.js';

// Maximum number of requests the board holds at once (DESIGN.md 4.7).
const MAX_REQUESTS = 6;

// Balance v1 (DESIGN.md section 10, card B01): job fees come out 40% fatter
// and request requirements are one point easier on style and reliability, so
// a starter car can actually earn money.
export const FEE_MULT = 1.4;
export const EASE_DESIRABILITY = 1;
export const EASE_RELIABILITY = 1;

// Remove requests whose time on the board is up: anything with
// expiresDay < today goes; one expiring today still shows. Returns the
// number removed.
export function expireRequests(state) {
	let removed = 0;
	let keep = 0;
	for (let i = 0; i < state.requests.length; i++) {
		const req = state.requests[i];
		if (req.expiresDay < state.day) {
			removed += 1;
		} else {
			state.requests[keep] = req;
			keep += 1;
		}
	}
	state.requests.length = keep;
	return removed;
}

// Roll up today's booking requests against the expected count
// (0.20 + 0.006*reputation + 0.015*buzz): floor(expected) for certain plus
// one more with probability of the fractional part. The board caps at 6, so
// later draws are dropped. Returns the number of requests added.
export function generateRequests(state) {
	const expected = 0.20 + 0.006 * state.reputation + 0.015 * state.buzz;
	const whole = Math.floor(expected);
	let n = whole;
	if (chance(state, expected - whole)) {
		n += 1;
	}
	let added = 0;
	for (let i = 0; i < n; i++) {
		if (state.requests.length >= MAX_REQUESTS) {
			break;
		}
		const job = pick(state, JOB_TYPES);
		const customer = customerName(state);
		const fee = Math.round(
			(job.feeMin + rand(state) * (job.feeMax - job.feeMin)) *
			(0.85 + 0.30 * state.reputation / 100) * FEE_MULT
		);
		state.requests.push({
			id: 'Q' + state.nextId++,
			jobTypeId: job.id,
			customer: customer,
			fee: fee,
			minDesirability: Math.max(0, job.minD - EASE_DESIRABILITY),
			minReliability: Math.max(0, job.minR - EASE_RELIABILITY),
			minCondition: job.minCond,
			expiresDay: state.day + randInt(state, 4, 9),
			blurb: fillText(pick(state, job.blurbs), { customer: customer })
		});
		added += 1;
	}
	return added;
}
