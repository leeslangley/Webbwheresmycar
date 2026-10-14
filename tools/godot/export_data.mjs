// Export every src/data/*.js table for the Godot Data autoload (GDF03).
// Run from the repo root: jsc -m tools/godot/export_data.mjs
// jsc has no console, so this prints through print(): for each table one "@@<stem>" line
// and one JSON line. tools/godot/export_data.sh turns that into godot/data/*.json.

import { ADVERTS } from '../../src/data/adverts.js';
import { CARS, ARCHETYPES } from '../../src/data/cars.js';
import { CHATTER } from '../../src/data/chatter.js';
import { FAULTS, TIER_MULT } from '../../src/data/faults.js';
import { GENERIC, CARWORLD, REACTIVE } from '../../src/data/headlines.js';
import { JOB_TYPES } from '../../src/data/jobtypes.js';
import { FIRST, LAST, PREFIX } from '../../src/data/names.js';
import { OWNERS } from '../../src/data/owners.js';
import { PAINT } from '../../src/data/paint.js';

const OUT = [
	['adverts', ADVERTS],
	['archetypes', ARCHETYPES],
	['cars', CARS],
	['chatter', CHATTER],
	['faults', { faults: FAULTS, tier_mult: TIER_MULT }],
	['headlines', { generic: GENERIC, carworld: CARWORLD, reactive: REACTIVE }],
	['jobtypes', JOB_TYPES],
	['names', { first: FIRST, last: LAST, prefix: PREFIX }],
	['owners', OWNERS],
	['paint', PAINT]
];

function count(x) {
	return Array.isArray(x) ? x.length : Object.keys(x).length;
}

for (const [stem, value] of OUT) {
	print('@@' + stem);
	print(JSON.stringify(value));
}

const counts = {
	adverts: count(ADVERTS),
	archetypes: count(ARCHETYPES),
	cars: count(CARS),
	chatter: count(CHATTER),
	faults: count(FAULTS),
	faults_tier_mult: count(TIER_MULT),
	headlines_generic: count(GENERIC),
	headlines_carworld: count(CARWORLD),
	headlines_reactive: count(REACTIVE),
	jobtypes: count(JOB_TYPES),
	names_first: count(FIRST),
	names_last: count(LAST),
	names_prefix: count(PREFIX),
	owners: count(OWNERS),
	paint: count(PAINT)
};
print('@@_counts');
print(JSON.stringify(counts));
