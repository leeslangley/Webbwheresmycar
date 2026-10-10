// Faults table: the things that go wrong with old cars.
// Transcribed exactly from docs/DESIGN.md section 8.3, with texts by this card.
// Keys per fault: id, label, severity ('minor'|'medium'|'major'), baseCost, text.
// Costs are scaled by TIER_MULT (DESIGN.md section 4.6).

export const FAULTS = [
	// Minor (baseCost 40-180)
	{
		id: 'puncture',
		label: 'Puncture',
		severity: 'minor',
		baseCost: 90,
		text: 'The tyre gave up after meeting a rogue nail.'
	},
	{
		id: 'batterydead',
		label: 'Flat battery',
		severity: 'minor',
		baseCost: 110,
		text: 'The battery is deader than a vicar’s social life.'
	},
	{
		id: 'blownbulb',
		label: 'Blown bulb',
		severity: 'minor',
		baseCost: 40,
		text: 'One headlight now serves merely as a decorative feature.'
	},
	{
		id: 'wipers',
		label: 'Wipers snapped',
		severity: 'minor',
		baseCost: 55,
		text: 'The wipers retired mid-storm without giving any notice.'
	},
	{
		id: 'sparkplug',
		label: 'Fouled spark plug',
		severity: 'minor',
		baseCost: 70,
		text: 'A spark plug is fouled and refusing to apologise.'
	},
	{
		id: 'fanbelt',
		label: 'Fan belt snapped',
		severity: 'minor',
		baseCost: 120,
		text: 'The fan belt snapped with a sound like rude applause.'
	},
	{
		id: 'horn',
		label: 'Horn stuck on',
		severity: 'minor',
		baseCost: 45,
		text: 'The horn stuck on and terrified the neighbourhood dogs.'
	},
	{
		id: 'leakyroof',
		label: 'Leaky roof',
		severity: 'minor',
		baseCost: 180,
		text: 'The roof leaks so much the car has opinions on weather.'
	},

	// Medium (baseCost 500-1400)
	{
		id: 'clutch',
		label: 'Clutch burnt out',
		severity: 'medium',
		baseCost: 900,
		text: 'The clutch burnt out and now smells of regret.'
	},
	{
		id: 'radiator',
		label: 'Radiator leak',
		severity: 'medium',
		baseCost: 650,
		text: 'The radiator leaks like a colander full of coolant.'
	},
	{
		id: 'brakes',
		label: 'Brakes gave up',
		severity: 'medium',
		baseCost: 1100,
		text: 'The brakes gave up, citing burnout and poor management.'
	},
	{
		id: 'alternator',
		label: 'Alternator died',
		severity: 'medium',
		baseCost: 700,
		text: 'The alternator died quietly and left everything completely uncharged.'
	},
	{
		id: 'exhaust',
		label: 'Exhaust fell off',
		severity: 'medium',
		baseCost: 800,
		text: 'The exhaust fell off and was claimed by a badger.'
	},
	{
		id: 'suspension',
		label: 'Suspension collapsed',
		severity: 'medium',
		baseCost: 1300,
		text: 'The suspension collapsed like a deckchair at a fete.'
	},
	{
		id: 'carburettor',
		label: 'Carburettor tantrum',
		severity: 'medium',
		baseCost: 950,
		text: 'The carburettor had a tantrum and now sulks at junctions.'
	},
	{
		id: 'fuelpump',
		label: 'Fuel pump packed in',
		severity: 'medium',
		baseCost: 600,
		text: 'The fuel pump packed in and moved back to its mum’s.'
	},

	// Major (baseCost 2400-6500)
	{
		id: 'gearbox',
		label: 'Gearbox exploded',
		severity: 'major',
		baseCost: 3200,
		text: 'The gearbox left the car and joined a circus.'
	},
	{
		id: 'engine',
		label: 'Engine blew up',
		severity: 'major',
		baseCost: 6500,
		text: 'The engine blew up spectacularly, costing the mechanic his lunch.'
	},
	{
		id: 'headgasket',
		label: 'Head gasket gone',
		severity: 'major',
		baseCost: 2400,
		text: 'The head gasket has gone, mayonnaise now fills the engine.'
	},
	{
		id: 'chassisrot',
		label: 'Chassis rot',
		severity: 'major',
		baseCost: 5000,
		text: 'The chassis rot is so advanced it resembles antique lace.'
	},
	{
		id: 'differential',
		label: 'Differential disaster',
		severity: 'major',
		baseCost: 2800,
		text: 'The differential had a disaster and scattered itself down the road.'
	},
	{
		id: 'wiring',
		label: 'Wiring fire',
		severity: 'major',
		baseCost: 3000,
		text: 'The wiring caught fire, providing brief but dramatic interior lighting.'
	},
	{
		id: 'crankshaft',
		label: 'Crankshaft snapped',
		severity: 'major',
		baseCost: 5800,
		text: 'The crankshaft snapped in two, which is never a good sign.'
	},
	{
		id: 'cylinderhead',
		label: 'Cylinder head cracked',
		severity: 'major',
		baseCost: 4200,
		text: 'The cylinder head cracked like a biscuit dunked too long.'
	}
];

// Quick lookup by id.
export const FAULT_BY_ID = (function () {
	const map = {};
	for (let i = 0; i < FAULTS.length; i++) {
		map[FAULTS[i].id] = FAULTS[i];
	}
	return map;
})();

// All faults of one severity; throws on anything but minor/medium/major.
export function faultsOfSeverity(sev) {
	if (sev !== 'minor' && sev !== 'medium' && sev !== 'major') {
		throw new Error('bad severity');
	}
	const out = [];
	for (let i = 0; i < FAULTS.length; i++) {
		if (FAULTS[i].severity === sev) {
			out.push(FAULTS[i]);
		}
	}
	return out;
}

// Cost multiplier per car tier (DESIGN.md section 4.6).
export const TIER_MULT = { 1: 1.0, 2: 1.8, 3: 3.5 };
