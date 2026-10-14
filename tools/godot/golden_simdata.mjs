// Golden fixture for godot/sim/simdata.gd and godot/sim/simutil.gd (GDS02): runs the src/data/*.js
// lookups and the customer/owner name builders under macOS jsc -m.
// Run by: sh tools/godot/golden_run.sh simdata   (writes godot/tests/golden/simdata.json)

import { CARS, modelOf } from '../../src/data/cars.js';
import { JOB_TYPES, jobTypeOf, fillText } from '../../src/data/jobtypes.js';
import { ADVERTS, ADVERT_BY_ID } from '../../src/data/adverts.js';
import { FAULTS, faultsOfSeverity, TIER_MULT } from '../../src/data/faults.js';
import { GENERIC, CARWORLD, REACTIVE } from '../../src/data/headlines.js';
import { FIRST, LAST, PREFIX, customerName } from '../../src/data/names.js';
import { OWNERS, ownerName } from '../../src/data/owners.js';
import { pureCase, stateCase, emitCases } from './golden_sim.mjs';

const cases = [];

cases.push(pureCase('counts', 'data counts', [], {
	cars: CARS.length,
	job_types: JOB_TYPES.length,
	faults: FAULTS.length,
	adverts: ADVERTS.length,
	first: FIRST.length,
	last: LAST.length,
	prefix: PREFIX.length,
	owners: OWNERS.length,
	generic: GENERIC.length,
	carworld: CARWORLD.length,
	reactive_keys: Object.keys(REACTIVE).sort(),
}));

for (const id of ['t1_allergy', 't2_serious', 't3_porshe']) {
	cases.push(pureCase('model_of', id, [id], modelOf(id)));
}

for (const id of ['wedding', 'chef']) {
	cases.push(pureCase('job_type_of', id, [id], jobTypeOf(id)));
}

for (const id of ['paper', 'tv']) {
	cases.push(pureCase('advert_by_id', id, [id], ADVERT_BY_ID[id]));
}

for (const sev of ['minor', 'medium', 'major']) {
	cases.push(pureCase('faults_of_severity', sev, [sev], faultsOfSeverity(sev).map((f) => f.id)));
}

for (const t of [1, 2, 3]) {
	cases.push(pureCase('tier_mult', 'tier ' + t, [t], TIER_MULT[t]));
}

const FILL_CASES = [
	['fill car and customer', ['{customer} drives {car}.', { customer: 'Nigel', car: 'Austen Allergy' }]],
	['repeat customer token', ['{customer} and {customer} again', { customer: 'A' }]],
	['missing car stays', ['{car} only', { customer: 'B' }]],
	['no tokens', ['no tokens here', {}]],
	['single pass', ['{customer}{car}', { customer: '{car}', car: 'X' }]],
];
for (const [name, args] of FILL_CASES) {
	cases.push(pureCase('fill_text', name, args, fillText(args[0], args[1])));
}

function customerNames(s, n) {
	const out = [];
	for (let i = 0; i < n; i++) {
		out.push(customerName(s));
	}
	return out;
}

function ownerNames(s, n) {
	const out = [];
	for (let i = 0; i < n; i++) {
		out.push(ownerName(s));
	}
	return out;
}

cases.push(stateCase('customer_name_seq', 'seed 5 twelve names', { rng: 5 }, [12], (s, n) => customerNames(s, n)));
cases.push(stateCase('customer_name_seq', 'seed 77 thirty names', { rng: 77 }, [30], (s, n) => customerNames(s, n)));
cases.push(stateCase('owner_name_seq', 'seed 9 eight owners', { rng: 9 }, [8], (s, n) => ownerNames(s, n)));

emitCases('simdata', cases);
