// The advertising gamble (DESIGN.md sections 4.8, 8.1). Pay a medium's
// cost, roll its outcome table, gain buzz (and sometimes lose reputation),
// and read a funny result. One advert costs one day, like every action.
// Pure sim module: randomness only through state.rng, no DOM, no dates.

import { weighted, pick, clamp } from '../core/rng.js';
import { advanceDay } from './advance.js';
import { ADVERT_BY_ID } from '../data/adverts.js';

// advertise(state, mediaId) -> {ok, msg, outcome?}. Mutates state in place.
// ok:true means a day has passed; ok:false means nothing changed and no
// day passed.
export function advertise(state, mediaId) {
	const medium = ADVERT_BY_ID[mediaId];
	if (!medium) {
		return { ok: false, msg: 'No such advert' };
	}
	if (state.cash < medium.cost) {
		return { ok: false, msg: 'Not enough money' };
	}

	// Pay up front, then roll the gamble.
	state.cash -= medium.cost;
	const outcome = weighted(state, medium.outcomes);

	// Buzz and reputation move, both held inside 0-100.
	state.buzz = clamp(state.buzz + outcome.buzz, 0, 100);
	state.reputation = clamp(state.reputation + outcome.rep, 0, 100);
	state.stats.adsRun += 1;

	// The result note goes in the tray; {medium} becomes the medium's name.
	const text = pick(state, outcome.texts).split('{medium}').join(medium.name);
	state.pending.push(text);

	// A huge buzz gain is worth reacting to on the front page tomorrow.
	if (outcome.buzz >= 80) {
		state.sit.push('viral');
	}

	advanceDay(state);
	return {
		ok: true,
		msg: text,
		outcome: { id: outcome.id, buzz: outcome.buzz, rep: outcome.rep, mediaId: mediaId },
	};
}
