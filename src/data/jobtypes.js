// Job type aggregator: joins the four customer job sets into one lookup.
// Pure data module: no DOM, no randomness, no dates (DESIGN.md section 9.1).

import { JOBS_A } from './jobs_a.js';
import { JOBS_B } from './jobs_b.js';
import { JOBS_C } from './jobs_c.js';
import { JOBS_D } from './jobs_d.js';

// All 16 customer job types, set A then B then C then D (DESIGN.md section 8.2).
export const JOB_TYPES = JOBS_A.concat(JOBS_B, JOBS_C, JOBS_D);

// Quick lookup by id. Built once here so callers never re-scan the array.
export const JOB_BY_ID = {};
for (let i = 0; i < JOB_TYPES.length; i++) {
	JOB_BY_ID[JOB_TYPES[i].id] = JOB_TYPES[i];
}

// Returns the job type object for an id, or throws on an unknown id.
export function jobTypeOf(id) {
	if (!Object.prototype.hasOwnProperty.call(JOB_BY_ID, id)) {
		throw new Error('unknown job ' + id);
	}
	return JOB_BY_ID[id];
}

// Fills {customer} and {car} placeholders (all occurrences) in a text template.
// A placeholder is left untouched when its var is undefined; a single pass, so
// a substituted value is never itself re-substituted.
export function fillText(template, vars) {
	const src = vars || {};
	return template.replace(/\{customer\}|\{car\}/g, function (m) {
		const v = m === '{customer}' ? src.customer : src.car;
		return v === undefined ? m : v;
	});
}
