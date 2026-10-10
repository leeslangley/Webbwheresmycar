// Customer job types, set C (DESIGN.md 8.2 rows surprise, estate, parade, hen).
// Where the silly callers live: retirement surprises, estate agent brochures,
// civic pageantry and hen weekends. Pure data; no randomness here, text
// templates use {customer} and {car} placeholders filled in by the sim.

export const JOBS_C = [
	{
		id: 'surprise',
		name: 'Retirement surprise',
		feeMin: 250,
		feeMax: 700,
		minD: 3,
		minR: 4,
		minCond: 4,
		wearMin: 0.1,
		wearMax: 0.4,
		blurbs: [
			'{customer} here. We are surprising a colleague who retires on Friday, and we want to collect them from the office in something splendid.',
			"It's {customer}. The retirement do needs a proper classic car to deliver the guest of honour, and they must not find out. They won't. Probably.",
			'{customer} needs a lovely old car for a retirement surprise. There will be a banner, a cake, and forty people hiding behind a van.'
		],
		success: [
			'The retirement collectee arrived in {car} to a cheer that startled the postman, and {customer} reports there was not a dry eye in the car park.',
			'{car} glided up to the gates with the banner flapping proudly, and {customer} says the retiree has told the story eleven times since.',
			'The surprise went off without a hitch, and {customer} insists {car} now counts as a family member. The fee arrives with a slice of cake taped to the envelope.'
		],
		mishap: [
			'The retiree spotted everyone hiding behind the van two streets early, and {customer} had to improvise a very unconvincing car boot sale.',
			'{car} arrived wearing most of a paper banner, and {customer} spends the afternoon unpeeling sticky tape from the windscreen.',
			'A colleague reversed into a hedge while filming the surprise on their phone, and {customer} asks quietly if the hedge is covered.'
		],
		disaster: [
			'The surprise banner jammed in {car}\'s windscreen wipers, the retiree honked the horn in panic, and a nearby flock of pigeons made everything worse while {customer} watched.',
			'The retirement cake was travelling in the boot of {car} when the driver took a corner, and {customer} now faces a village fete committee armed with icing and grievances.'
		]
	},
	{
		id: 'estate',
		name: 'Estate agent brochure',
		feeMin: 200,
		feeMax: 600,
		minD: 4,
		minR: 3,
		minCond: 3,
		wearMin: 0.1,
		wearMax: 0.3,
		blurbs: [
			'{customer} is selling a manor house and wants a classic car parked on the gravel for the brochure photo. Three hours, one driveway, endless angles.',
			"It's {customer} from the estate agency. My seller insists the brochure has a beautiful old car outside, or they will not sign. Their words, not mine.",
			'{customer} needs something dignified for an estate agent photo shoot. The property has a fountain, a peacock and a seller with strong opinions.'
		],
		success: [
			'The brochure photograph came out so well that the house sold in a week, and {customer} swears it was {car} that sealed the deal.',
			'{car} posed on the gravel like it had been to drama school, and {customer} reports the buyers kept asking if the car came with the house.',
			'{customer} pays in full and sends a copy of the brochure, in which {car} has somehow upstaged a twelve-bedroom manor.'
		],
		mishap: [
			'The peacock took a liking to {car}\'s bonnet and refused to move for two hours, and {customer} has the photographs to prove it.',
			'The seller insisted on leaning on {car} for every photograph, and {customer} spends the morning politely repositioning an elbow.',
			'A garden sprinkler caught {car} mid-shoot and the "stately home" look became a "damp Tuesday" look. {customer} pays a little less and laughs a lot.'
		],
		disaster: [
			'The gravel driveway hid a pothole of legend, {car} sank to the axles in front of the buyers, and {customer} had to describe it as a "period feature".',
			'The prize bull escaped during the photo shoot and used {car} as a scratching post, and {customer} now must explain to both the farmer and the sellers.'
		]
	},
	{
		id: 'parade',
		name: "Mayor's carnival parade",
		feeMin: 400,
		feeMax: 900,
		minD: 5,
		minR: 4,
		minCond: 4,
		wearMin: 0.4,
		wearMax: 1.0,
		blurbs: [
			'{customer} organises the town carnival and needs a splendid classic car to lead the parade with the mayor waving from the back. Bunting provided.',
			"It's {customer}. The carnival committee has voted, and our float this year is simply a lovely old car. Please do not ask. There was an incident with a float once.",
			'{customer} needs a dignified car for the carnival parade. The town brass band will be walking behind, playing whatever they feel like.'
		],
		success: [
			'{car} led the parade at a stately four miles an hour while the whole town waved, and {customer} declares it the finest carnival in living memory.',
			'The mayor was so delighted with {car} that the wave lasted the entire route, and {customer} pays in full with a commemorative pennant.',
			'{car} outshone every float in the parade, and {customer} says the marching brass band struck up a tune as it passed. Nobody knows which one.'
		],
		mishap: [
			'The bunting snagged on {car}\'s aerial and unwound gracefully down the high street, and {customer} calls it "an intentional design choice".',
			'A marching tuba player collided gently with {car}\'s wing mirror, and {customer} pays slightly less and offers the town\'s apologies.',
			'The mayor\'s ceremonial chain jammed in {car}\'s door, and the parade set off twelve minutes late to mild applause.'
		],
		disaster: [
			'A runaway carnival float shaped like a teapot veered into the parade route, and {car} spent the afternoon in the duck pond while {customer} negotiated with a very wet mayor.',
			'The carnival queen\'s confetti cannon went off inside {car}, and a passing swarm of bees decided the sticky paintwork was a picnic, while {customer} telephoned for backup.'
		]
	},
	{
		id: 'hen',
		name: 'Hen weekend',
		feeMin: 400,
		feeMax: 950,
		minD: 4,
		minR: 3,
		minCond: 3,
		wearMin: 0.8,
		wearMax: 2.0,
		blurbs: [
			'{customer} is organising a hen weekend and wants a proper old car for a tour of the seaside towns. There will be glitter. There is always glitter.',
			"It's {customer}. Ten of us, one classic car, a playlist of wedding discos, and a route involving four tea rooms. Bold, but fair.",
			'{customer} needs something glamorous for a hen weekend. The bride-to-be has planned the whole thing on a napkin and refuses to change a detail.'
		],
		success: [
			'Ten hens, one car, zero casualties, and {customer} reports the bride-to-be cried happily at the sight of {car} wearing the bow.',
			'{car} survived the entire hen weekend with only glitter in the carpets, and {customer} says the tea room photos are already legendary.',
			'The tour went off without a hitch and {car} was serenaded outside the third pub. {customer} pays in full and leaves a lanyard as a souvenir.'
		],
		mishap: [
			'A sash of glitter glue dried overnight inside {car}, and {customer} promises the sparkle is "mostly decorative".',
			'The hen party sang the entire playlist on the coast road, and {car}\'s aerial vibrated in protest until someone sat on it. {customer} pays a little less.',
			'One hen attempted a party trick on the bonnet of {car} and slid off with dignity mostly intact, and {customer} asks if the wax will fix it.'
		],
		disaster: [
			'The hen party opened a farm gate to photograph some calves, and the calves found the leather seats of {car} delicious, while {customer} negotiated with a farmer.',
			'The route planning by {customer} relied entirely on a fold-out map from a petrol station, and {car} ended up in a river ford that the map described as a shortcut.'
		]
	}
];
