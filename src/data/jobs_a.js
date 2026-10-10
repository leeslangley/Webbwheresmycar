// Customer job types, set A: the posh end of the market.
// Transcribed exactly from docs/DESIGN.md section 8.2, with texts by this card.
// Keys per job: id, name, feeMin, feeMax, minD, minR, minCond, wearMin, wearMax,
// blurbs (3), success (3), mishap (3), disaster (2).
// Placeholders: {customer} and {car}.

export const JOBS_A = [
	{
		id: 'wedding',
		name: 'Wedding',
		feeMin: 600,
		feeMax: 1400,
		minD: 6,
		minR: 5,
		minCond: 6,
		wearMin: 0.2,
		wearMax: 0.5,
		blurbs: [
			'{customer} needs something posh for a wedding, and the bride is forty minutes late already.',
			'{customer} has booked the church, the cake and the band, but the wedding car firm has folded.',
			'{customer} wants a grand arrival that will make Aunt Jean put her tea down.'
		],
		success: [
			'{car} swept up to the church as the bells rang, and {customer} wept into a very good hankie.',
			'The photographs came out beautifully; even the photographer admitted {car} was the best-dressed thing present.',
			'{customer} arrived in style, and two separate guests asked for the number of whoever owns it.'
		],
		mishap: [
			'{customer} reversed {car} into the manor hedge while rehearsing the speech, and the topiary has opinions.',
			'The best man was sick in the boot of {car}, and it was the confetti-covered corner, too.',
			'{car} lost a hubcap down the lane, and {customer} led a wedding party search for it.'
		],
		disaster: [
			'A startled flock of churchyard pigeons used {car} as a confetti cannon, and {customer} has cancelled the reception.',
			'{customer}\'s Uncle Nigel hitched the trailer to {car} and the bull has now seen the world.'
		]
	},
	{
		id: 'photoshoot',
		name: 'Magazine photo shoot',
		feeMin: 400,
		feeMax: 1000,
		minD: 6,
		minR: 4,
		minCond: 5,
		wearMin: 0.1,
		wearMax: 0.3,
		blurbs: [
			'{customer} is styling a magazine shoot and needs a classic that photographs well by eleven o\'clock.',
			'{customer} needs a motor for a magazine spread, and the art director hates everything sensible.',
			'{customer} is shooting a fashion editorial at a stately home and insists only a classic will do.'
		],
		success: [
			'The photographer circled {car} for an hour and declared it the muse of the season.',
			'{customer} got the cover shot, mostly thanks to {car} catching the light just so.',
			'The stylist only repainted her lips twice, and {car} looks briefly immortal in print.'
		],
		mishap: [
			'{customer} parked {car} in the tractor calendar shoot\'s spot, and there is now a scheduling war.',
			'A wind machine toppled onto {car}, leaving it lightly draped in expensive designer silk.',
			'{customer}\'s assistant waxed {car} with the wrong stuff and it gleams like a boiled sweet.'
		],
		disaster: [
			'The sprinkler system chose the exact moment {car} was perfectly positioned, and {customer} has quit the whole editorial.',
			'Escaped farm animals from the next field licked {car} into a matte finish while {customer} watched, helpless.'
		]
	},
	{
		id: 'concours',
		name: 'Classic car show (concours)',
		feeMin: 500,
		feeMax: 1500,
		minD: 7,
		minR: 5,
		minCond: 7,
		wearMin: 0.1,
		wearMax: 0.4,
		blurbs: [
			'{customer} is showing at the concours and needs something with pedigree, correct badges and no excuses.',
			'{customer} has a concours lawn spot, and the club chairman is famously unforgiving about patina.',
			'{customer} needs a proper classic for the show, as the judges have brought binoculars this year.'
		],
		success: [
			'{car} took the class trophy, and the club chairman wrote its number down approvingly.',
			'{customer} accepted a rosette the size of a dinner plate on {car}\'s behalf.',
			'Three separate judges used the word "original", and {car} has never been so admired.'
		],
		mishap: [
			'{car} stalled while coasting past the judges\' stand, and {customer} performed a quiet bow to cover it.',
			'{customer} was caught polishing {car} with the wrong cloth, and a retired colonel has written a letter.',
			'A wasp nest formed in {car}\'s door pocket overnight, and {customer} discovered this mid-judging.'
		],
		disaster: [
			'The display ramp collapsed beneath {car} during judging, dropping it into the ornamental fish pond in front of {customer}.',
			'Bees from a neighbouring hive moved into {car}\'s exhaust, and {customer} is now a formal matter for the beekeepers.'
		]
	},
	{
		id: 'period',
		name: 'TV costume drama',
		feeMin: 900,
		feeMax: 2200,
		minD: 7,
		minR: 5,
		minCond: 5,
		wearMin: 0.3,
		wearMax: 0.8,
		blurbs: [
			'{customer} is producing a television costume drama and needs a carriage that actually goes.',
			'{customer} needs a period-appropriate motor for a Sunday night drama, and the director keeps saying "authenticity".',
			'{customer} is filming a costume drama in the village, and the lead actress refuses anything modern.'
		],
		success: [
			'{car} delivered {customer}\'s duchess to the manor gate without a single anachronism in frame.',
			'The director called {car} the finest supporting actor on set, and {customer} got the shot.',
			'{customer}\'s drama wrapped early, because {car} required no retakes whatsoever.'
		],
		mishap: [
			'{car} backfired during the emotional deathbed scene, and {customer} has decided it is now canon.',
			'{customer} parked {car} in shot of a satellite dish, and continuity has filed a formal complaint.',
			'The leading man\'s cape snagged on {car}\'s door handle, and the take is ruined for everyone.'
		],
		disaster: [
			'The flood scene used real river water, and {car} is now technically a narrowboat; {customer} has gone very quiet.',
			'A fog machine with attitude exploded beside {car}, and {customer}\'s leading lady has left for a rival drama.'
		]
	}
];
