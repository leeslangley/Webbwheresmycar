// Advertising media: the seven places Mark Webb can advertise.
// Transcribed exactly from docs/DESIGN.md sections 4.8 and 8.1.
// Each medium: {id, name, cost, blurb, outcomes:[{id, w, buzz, rep, texts:[t1,t2]}]}.
// Outcome weights sum to 100. Texts may use '{medium}' as a placeholder
// for the medium name. Buzz is a gain (0-100); rep is an optional change.

export const ADVERTS = [
	{
		id: 'paper',
		name: 'Parish Pump Gazette',
		cost: 150,
		blurb: 'The parish newsletter: half the village reads it, the other half is the crossword.',
		outcomes: [
			{
				id: 'flop',
				w: 30,
				buzz: 0,
				rep: 0,
				texts: [
					'Your ad ran next to the fête notices and was used to line a budgie cage by Tuesday.',
					'The Gazette printed your advert upside down. Readers assumed it was a typo and moved on.'
				]
			},
			{
				id: 'ok',
				w: 60,
				buzz: 8,
				rep: 0,
				texts: [
					'Your {medium} advert got a nod from the postman and two of his round.',
					'A kindly pensioner cut your {medium} ad out and stuck it on her fridge. Momentum.'
				]
			},
			{
				id: 'good',
				w: 10,
				buzz: 15,
				rep: 0,
				texts: [
					'The {medium} put your advert above the church fete results. Village legend status.',
					'Your {medium} ad is now the talk of the Tuesday bring-and-buy sale.'
				]
			}
		]
	},
	{
		id: 'internet',
		name: 'Webb-Book banner ads',
		cost: 300,
		blurb: 'Banner ads on Webb-Book, where your target audience goes to argue about wheel trims.',
		outcomes: [
			{
				id: 'flop',
				w: 40,
				buzz: 0,
				rep: 0,
				texts: [
					'Your banner was blocked as "suspicious popup" by everyone including your mum.',
					'The banner ads loaded so slowly that viewers finished their tea and left first.'
				]
			},
			{
				id: 'ok',
				w: 45,
				buzz: 10,
				rep: 0,
				texts: [
					'Your {medium} campaign got 40 clicks. Admittedly 39 were Dave, refreshing.',
					'The {medium} banner did the rounds on a local motoring group. Mild approval.'
				]
			},
			{
				id: 'good',
				w: 14,
				buzz: 20,
				rep: 0,
				texts: [
					'Your {medium} ads went semi-viral in the "Classic Motors of Lincolnshire" group.',
					'Strangers started tagging their uncles under your {medium} banner. Traction!'
				]
			},
			{
				id: 'viral',
				w: 1,
				buzz: 60,
				rep: 0,
				texts: [
					'Your {medium} banner got screenshotted onto a national motoring forum. Bedlam.',
					'An influencer shared your {medium} ad with the caption "peak Britain". Insane reach.'
				]
			}
		]
	},
	{
		id: 'magazine',
		name: 'Classic & Sporty Wheels',
		cost: 600,
		blurb: 'A glossy monthly for men who say "only 82,000 miles" with a straight face.',
		outcomes: [
			{
				id: 'flop',
				w: 20,
				buzz: 0,
				rep: 0,
				texts: [
					'Your {medium} ad was printed on the page that sticks to the perfume sample.',
					'The magazine misspelled "Webb" as "Web". Calls have slowed to a trickle.'
				]
			},
			{
				id: 'ok',
				w: 50,
				buzz: 20,
				rep: 0,
				texts: [
					'A tidy quarter-page in the {medium} has the readers squinting thoughtfully.',
					'Your {medium} ad sits nicely between an oil advert and a Morris Minor dodger club.'
				]
			},
			{
				id: 'good',
				w: 25,
				buzz: 32,
				rep: 0,
				texts: [
					'The {medium} editor gave your ad a friendly mention in his editorial. Cracking response.',
					'Half a page in the {medium}! Enquiries from as far away as the next county.'
				]
			},
			{
				id: 'great',
				w: 5,
				buzz: 45,
				rep: 0,
				texts: [
					'The {medium} ran your ad opposite the centre-fold MGB. The phone has not stopped.',
					'Your {medium} advert won "Ad of the Month". Readers are cutting it out and framing it.'
				]
			}
		]
	},
	{
		id: 'youtube',
		name: 'WheelTube video',
		cost: 800,
		blurb: 'A promotional video on WheelTube. Cheap, fast, and entirely capable of going humiliatingly wrong.',
		outcomes: [
			{
				id: 'cringe',
				w: 55,
				buzz: 0,
				rep: -3,
				texts: [
					'Your {medium} video ends with you trapping your thumb in the bonnet. 1.2m views, all mocking.',
					'The {medium} video\'s background music is 40 seconds of you humming. The comments are merciless.'
				]
			},
			{
				id: 'ok',
				w: 20,
				buzz: 15,
				rep: 0,
				texts: [
					'The {medium} video got a solid 200 views and one "not bad" comment.',
					'Your {medium} upload survives without a single dislike. Small mercies.'
				]
			},
			{
				id: 'good',
				w: 15,
				buzz: 35,
				rep: 0,
				texts: [
					'The {medium} video of Dave falling in the grease trap is genuinely charming people.',
					'Your {medium} video got 3,000 views and a pinned comment from a bloke in Kent.'
				]
			},
			{
				id: 'viral',
				w: 10,
				buzz: 80,
				rep: 0,
				texts: [
					'Your {medium} video is on the front page of WheelTube. The phone is red hot.',
					'Half a million views on {medium}! Two of them were the Queen\'s people. Allegedly.'
				]
			}
		]
	},
	{
		id: 'radio',
		name: 'Radio Gaga FM',
		cost: 900,
		blurb: 'Local drive-time radio, sandwiched between the traffic report and a jingle for shoes.',
		outcomes: [
			{
				id: 'flop',
				w: 25,
				buzz: 0,
				rep: 0,
				texts: [
					'Your {medium} slot aired at 3am to a nation of lorry drivers who already have garages.',
					'The {medium} host read your ad while eating a pasty. Nobody understood a word.'
				]
			},
			{
				id: 'ok',
				w: 45,
				buzz: 22,
				rep: 0,
				texts: [
					'A decent {medium} read-out at drive time. Three people honked in solidarity.',
					'Your {medium} ad ran just before the traffic report. Perfectly adequate exposure.'
				]
			},
			{
				id: 'good',
				w: 25,
				buzz: 38,
				rep: 0,
				texts: [
					'The {medium} breakfast DJ gave your garage a shout-out and called it "an institution".',
					'Listeners are phoning the {medium} station just to ask where Webb\'s Wheels is. Blitz!'
				]
			},
			{
				id: 'great',
				w: 5,
				buzz: 50,
				rep: 0,
				texts: [
					'The {medium} DJ played your jingle twice and hummed it himself afterwards. Golden.',
					'You have become "that garage from the {medium} advert". Radio fame is still fame.'
				]
			}
		]
	},
	{
		id: 'billboard',
		name: 'A-road billboard',
		cost: 1500,
		blurb: 'A big painted board on the A-road, where bored drivers have nothing else to read.',
		outcomes: [
			{
				id: 'flop',
				w: 15,
				buzz: 0,
				rep: 0,
				texts: [
					'A lorry tore off your {medium} poster and it now flaps dramatically near the roundabout.',
					'The {medium} board faces the wrong way. Cows have seen it. Cows do not drive.'
				]
			},
			{
				id: 'ok',
				w: 55,
				buzz: 28,
				rep: 0,
				texts: [
					'Motorists are honking approvingly at your {medium} board. A few nearly slowed down.',
					'The {medium} advert is legible at 60mph, which is the entire point. Well done.'
				]
			},
			{
				id: 'good',
				w: 30,
				buzz: 40,
				rep: 0,
				texts: [
					'Your {medium} board caused two near-misses and four new bookings. Worth every penny.',
					'Someone photographed the {medium} billboard and put it on the telly news. Blimey.'
				]
			}
		]
	},
	{
		id: 'tv',
		name: 'Channel Fore TV spot',
		cost: 4000,
		blurb: 'A proper television advert on Channel Fore, between the darts and the sheep pricing.',
		outcomes: [
			{
				id: 'flop',
				w: 10,
				buzz: 5,
				rep: 0,
				texts: [
					'Your advert aired during a power cut. Only the cat saw it.',
					'The {medium} spot ran at 3am against a test card. Somewhere, one insomniac is interested.'
				]
			},
			{
				id: 'ok',
				w: 30,
				buzz: 40,
				rep: 0,
				texts: [
					'The {medium} advert went out during the darts. Competent, warm, mildly memorable.',
					'Your {medium} spot got the thumbs-up from Dave\'s mum, who is frankly a tough audience.'
				]
			},
			{
				id: 'good',
				w: 40,
				buzz: 60,
				rep: 0,
				texts: [
					'Your {medium} advert is the one with the whistling kettle. The nation is charmed.',
					'People are quoting your {medium} tagline in the pub. The phone has not stopped ringing.'
				]
			},
			{
				id: 'great',
				w: 20,
				buzz: 90,
				rep: 0,
				texts: [
					'Your {medium} advert ran just before the cup final. Webb\'s Wheels is now a household name.',
					'The {medium} spot is being talked about at bus stops nationwide. Absolute television gold.'
				]
			}
		]
	}
];

// Quick lookup by medium id.
export const ADVERT_BY_ID = {};
for (let i = 0; i < ADVERTS.length; i++) {
	ADVERT_BY_ID[ADVERTS[i].id] = ADVERTS[i];
}
