// Customer job types, set D (DESIGN.md 8.2 rows proposal, vicar, panto, chef).
// The gentle and occasional end of the booking book: proposals, blessings,
// village pantomimes and television chefs. Pure data; no randomness here, text
// templates use {customer} and {car} placeholders filled in by the sim.

export const JOBS_D = [
	{
		id: 'proposal',
		name: 'Marriage proposal',
		feeMin: 350,
		feeMax: 900,
		minD: 6,
		minR: 5,
		minCond: 6,
		wearMin: 0.1,
		wearMax: 0.3,
		blurbs: [
			'{customer} wants to propose to their partner in the back of a proper classic car. The ring is currently in a box the size of a shoebox.',
			"It's {customer} here. My partner thinks we are going to the garden centre. I need something romantic with a gentle rumble.",
			'{customer} needs a beautiful old car for a marriage proposal at sunset. The booking is for seven and the sunset, we are assured, is at six.'
		],
		success: [
			'The proposal went perfectly with {car} as the backdrop, and {customer} reports the answer was yes before the question had finished.',
			'{customer} slipped the ring onto the right finger beside {car}, and the engine idling to a stop got a round of applause from a passing bus.',
			'The partner said yes at once, then spent ten minutes admiring {car} instead. {customer} calls it the cheapest victory of the year.'
		],
		mishap: [
			'The ring fell through a gap in {car}\'s seat and it took twenty minutes and a coat hanger to recover it. {customer} missed the sunset.',
			'{customer} rehearsed the speech for weeks but got down on one knee in a puddle, and the proposal was finished from a picnic blanket.',
			'A farmer\'s tractor chose the exact moment to trundle past the viewpoint, and {customer} had to pause the proposal until the ploughing was done.'
		],
		disaster: [
			'The celebratory champagne cork fired off with some violence and landed in the engine bay of {car}, and {customer} spent the sunset fixing a hose instead of proposing.',
			'A bold flock of geese surrounded {car} at the crucial moment and made off with the ring box, and {customer} chased them round the park for an hour.'
		]
	},
	{
		id: 'vicar',
		name: "Vicar's blessing tour",
		feeMin: 250,
		feeMax: 600,
		minD: 3,
		minR: 4,
		minCond: 4,
		wearMin: 0.1,
		wearMax: 0.3,
		blurbs: [
			"{customer} is arranging a vicar's blessing tour of three parishes and needs something dignified for the drive between the churches.",
			"It's {customer}. Our vicar wants to bless the harvest from the back of a classic car this year. Two hymns, one bonnet, no rushing.",
			'{customer} needs a gentle old car to ferry the choir to a blessing by the harbour. The organ music will be provided on cassette.'
		],
		success: [
			'The tour went beautifully and the vicar blessed {car} as well, free of charge. {customer} reports a fine turnout at all three parishes.',
			'{car} purred between the churches like a low hymn, and {customer} says the parishioners queued afterwards to polish the headlamps.',
			'The village turned out in force, the choir found its harmony by the second verse, and {customer} says {car} has never looked so holy.'
		],
		mishap: [
			'A cassock caught in {car}\'s door and the first blessing ran twenty minutes late. {customer} apologised to the whole parish with a fruitcake.',
			'{customer} took a wrong turning and blessed the wrong village entirely, and the second parish had to wait for {car} to circle back.',
			'A wasp got in during the second blessing and the congregation did an unplanned circuit of {car}. Nobody was hurt, but the hymn sheets scattered.'
		],
		disaster: [
			'The travelling font tipped over on a country bend and soaked the back seat of {car}, and {customer} now owes the parish two towels and an apology.',
			'A flock of sheep mistook {car} for the shepherd\'s truck and followed it into the churchyard, and {customer} is still writing letters to the parish council.'
		]
	},
	{
		id: 'panto',
		name: 'Amateur panto',
		feeMin: 300,
		feeMax: 700,
		minD: 4,
		minR: 3,
		minCond: 3,
		wearMin: 0.5,
		wearMax: 1.5,
		blurbs: [
			'{customer} is directing the village panto and needs a classic car for the transformation scene. There will be glitter. There is always glitter.',
			"It's {customer} from the village hall. Cinderella needs to arrive in something proper, and the pumpkin trailer broke down in March.",
			'{customer} wants a beautiful old car for the panto finale. The stage is nine feet wide and the doors must open for the big number.'
		],
		success: [
			'The finale brought the house down and {car} got the biggest cheer of the night. {customer} has already asked about next year.',
			'{car} cleared the village hall doors with an inch to spare, and {customer} says the children booed the baddie for a full ten minutes.',
			'The glitter settled, the audience roared, and {customer} admits {car} upstaged the dame in the largest wig of the century.'
		],
		mishap: [
			'The stage crew covered {car} in glitter for the transformation scene, and three months later it still turns up in the upholstery. {customer} apologises.',
			'A foam pumpkin fell off the flats and bounced off the roof of {car} mid-song. {customer} swears the audience thought it was part of the show.',
			"{customer}'s dame got a sleeve caught in {car}'s window and improvised a whole new verse about it. The band kept playing. Just about."
		],
		disaster: [
			'The smoke machine jammed, the pantomime horse bolted, and {car} rolled through the scenery. {customer} is arguing with the insurance over an act of dame.',
			'The village hall roof leaked during the matinee and a trough of water landed in {car}, and {customer} had to explain the ducks now living under the bonnet.'
		]
	},
	{
		id: 'chef',
		name: 'Celebrity chef taxi',
		feeMin: 700,
		feeMax: 1800,
		minD: 7,
		minR: 6,
		minCond: 6,
		wearMin: 0.2,
		wearMax: 0.6,
		blurbs: [
			'{customer} is producing a television cookery programme and needs a classic car to deliver a famous chef to a village fete. The chef is never on time.',
			"It's {customer}. Our chef insists on arriving at food festivals in something handsome, and the last car still smells of previous ingredients.",
			'{customer} needs a beautiful car for a chef touring four farm shops before lunch. The itinerary is ambitious and the pastry will not wait.'
		],
		success: [
			'The chef arrived rested and almost on time, and {customer} says the fete scones sold out by noon. {car} gets a mention in the credits.',
			'{car} swept into the festival to a small round of applause, and {customer} reports the chef wrote a dedication in pastry on the bonnet.',
			'All four farm shops were visited, and {car} carried home more cheese than the boot could legally hold. {customer} pays in full, plus a wheel of stilton.'
		],
		mishap: [
			'The chef insisted on a live demonstration in the passenger seat, and the smell of fried onions will never leave {car}. {customer} pays a little less.',
			'A crate of prize tomatoes took a corner too briskly and redecorated the inside of {car}. {customer} apologised on television, twice.',
			"{customer} took a detour after a van selling pastries, and the chef arrived late but called it 'research'. {car} smells of garlic."
		],
		disaster: [
			'The chef\'s portable fondue rig detonated over the back seat of {car}, and {customer} says the cheese is now a structural feature of the interior.',
			'A herd of cows surrounded {car} outside the farm shop and licked the doors clean of the sauce spill, and {customer} filmed everything from a safe distance.'
		]
	}
];
