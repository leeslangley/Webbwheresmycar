// Headline chooser (DESIGN.md 8.4, 9.3). Picks the Daily Sprocket
// front page for the day: sometimes a reactive template for the player's
// situation, otherwise a fresh story from the generic or carworld pool.
// Pure sim: randomness only through src/core/rng.js using state.rng.

import { chance, pick, weighted } from '../core/rng.js';
import { money } from '../core/format.js';
import { GENERIC, CARWORLD, REACTIVE } from '../data/headlines.js';

// The newspaper never keeps more than this many back issues.
const MAX_HEADLINES = 30;

// A pool headline may not repeat inside the latest 20; retry this many
// times before accepting whatever came out of the hat.
const POOL_RETRY = 10;

// Weights for the two story pools when no reactive situation applies.
const POOLS = [
	{ w: 55, pool: GENERIC },
	{ w: 45, pool: CARWORLD },
];

// Fill {car}, {customer} and {cash} placeholders in a template.
function fill(text, ctx) {
	return text
		.split('{car}').join(ctx.car || 'a mystery car')
		.split('{customer}').join(ctx.customer || 'a mystery customer')
		.split('{cash}').join(typeof ctx.cash === 'number' ? money(ctx.cash) : 'some money');
}

// True when the text already appears in the newest 20 headlines.
function seenRecently(state, text) {
	const recent = Math.min(20, state.headlines.length);
	for (let i = 0; i < recent; i++) {
		if (state.headlines[i] === text) {
			return true;
		}
	}
	return false;
}

// chooseHeadline(state, situations, ctx) -> string. Records the chosen
// headline at the front of state.headlines (at most 30 kept).
export function chooseHeadline(state, situations = [], ctx = {}) {
	if (!Array.isArray(state.headlines)) {
		state.headlines = [];
	}
	let text = null;

	// Reactive path: only situations the paper actually covers.
	const list = Array.isArray(situations) ? situations : [];
	const known = list.filter((s) => Object.prototype.hasOwnProperty.call(REACTIVE, s));
	if (known.length > 0 && chance(state, 0.6)) {
		const sit = pick(state, known);
		text = pick(state, REACTIVE[sit]);
	}

	// Otherwise draw a pool story, avoiding anything printed in the
	// latest 20 issues (retry a few times, then accept what we have).
	if (text === null) {
		for (let attempt = 0; attempt < POOL_RETRY; attempt++) {
			const story = weighted(state, POOLS);
			text = pick(state, story.pool);
			if (!seenRecently(state, text)) {
				break;
			}
		}
	}

	text = fill(text, ctx || {});
	state.headlines.unshift(text);
	if (state.headlines.length > MAX_HEADLINES) {
		state.headlines.length = MAX_HEADLINES;
	}
	return text;
}
