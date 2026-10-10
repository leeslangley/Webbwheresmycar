// Customer job types, set B (DESIGN.md 8.2 rows musicvideo, stag, prom, film).
// The silly end of the booking book: rock bands, stag parties, teenagers in
// ball gowns and film villains. Pure data; no randomness here, text templates
// use {customer} and {car} placeholders filled in by the sim.

export const JOBS_B = [
	{
		id: 'musicvideo',
		name: 'Rock band music video',
		feeMin: 1200,
		feeMax: 3000,
		minD: 6,
		minR: 4,
		minCond: 4,
		wearMin: 0.8,
		wearMax: 2.0,
		blurbs: [
			'{customer} is managing a rock band that needs a classic car for their new music video. They promise to be gentle. They will not be gentle.',
			"It's {customer} here. Our band wants to lip-sync on the bonnet of something classy for the video. Smoke machines are involved.",
			'{customer} needs a beautiful old car for a music video shoot. The lead singer insists on standing on the roof. Please say yes.'
		],
		success: [
			'The band loved {car} so much they wrote a song about it. {customer} pays in full and promises to send a copy of the DVD.',
			'The shoot wrapped early because {car} upstaged the lead singer. {customer} hands over the fee and a torn backstage lanyard.',
			'{car} looked magnificent in the video and the single crept to number forty. {customer} reports the bonnet has barely any footprints.'
		],
		mishap: [
			'The smoke machine set off the fire alarms and the shoot was cut short. {customer} still got the chorus, somehow.',
			"The drummer used {car} as a drum riser. The roof survived. The drummer didn't get paid, and {customer} asks for a discount.",
			"{customer}'s band mistook {car} for a props van and filled the boot with foam fingers. It took three hours to vacuum out."
		],
		disaster: [
			"The pyrotechnics went off early and scorched the paintwork. {car} now smells of burnt guitar strings, and {customer} has vanished behind a wall of dry ice.",
			"The band's tour bus rolled backwards over {car} during the big finale, and {customer} says the insurance covers 'artistic differences'."
		]
	},
	{
		id: 'stag',
		name: 'Stag do driving day',
		feeMin: 500,
		feeMax: 1100,
		minD: 4,
		minR: 3,
		minCond: 3,
		wearMin: 1.0,
		wearMax: 2.5,
		blurbs: [
			'{customer} has organised a stag do and wants a proper old car for a day of country lanes. What could possibly go wrong?',
			"It's {customer}: eight chaps, one classic car, and a spirit level for the drinking games. We leave at dawn.",
			"{customer} needs something sturdy for a brother's stag do. The best man has promised to behave. Nobody believes him."
		],
		success: [
			'All eight of them came back with {car} intact and only mild sunburn. {customer} calls it the best day of the groom\'s life.',
			'{car} managed the whole route with just one hubcap missing, and {customer} swears the groom wept with joy at the wheel.',
			'The country lanes were kind and {car} handled them beautifully. {customer} has already asked about hiring something for the next wedding.'
		],
		mishap: [
			"The best man reversed {car} into a hedge while parking 'for a laugh'. The hedge came off worse, and so did his dignity.",
			"{customer} dropped the keys in a river, then found them in the groom's pocket. {car} waited patiently.",
			'Someone fed the groom a pub chilli and the boot of {car} became an emergency. {customer} pays a little less and apologises a lot.'
		],
		disaster: [
			'The stag tried a handbrake turn on a farm track and ploughed into a flock of sheep. {car} is wearing wool, and {customer} faces a farmer with strong opinions.',
			'Half the stag party ended up in a duck pond with {car}, and {customer} says the vicar who fished them out has asked for danger money.'
		]
	},
	{
		id: 'prom',
		name: 'School prom arrival',
		feeMin: 300,
		feeMax: 800,
		minD: 5,
		minR: 5,
		minCond: 5,
		wearMin: 0.2,
		wearMax: 0.6,
		blurbs: [
			"{customer}'s daughter wants to arrive at the school prom like royalty, and the other parents have already hired limousines. No pressure.",
			"It's {customer}. The prom theme is 'old Hollywood' and my son wants a proper classic car to match. He has been practising his wave.",
			'{customer} needs something elegant for a school prom. The teenagers will be taking four hundred photographs, minimum.'
		],
		success: [
			'{car} swept up to the school gates like a film premiere, and {customer} says the teenager was voted best arrival at prom, earning {car} a round of applause.',
			'The pupils applauded as {car} glided past, and {customer} says the daughter has finally forgiven the family for the estate car.',
			'Every photograph at the prom ended up featuring {car}. {customer} has had one framed and pays the fee with a thank-you card.'
		],
		mishap: [
			"{car}'s door stuck at the school gates and the teenager had to climb out in a ball gown. {customer} filmed it, and now it is on the noticeboard.",
			"A dinner lady mistook {car} for the head's own car and tried to give it a parking ticket. {customer} talked her down, eventually.",
			'The corsage caught in {car}\'s window and there was a small shrieking incident. {customer} pays slightly less and apologises twice.'
		],
		disaster: [
			'The school photographer reversed into {car} during the grand arrival, and {customer} spent the evening mediating between him and a head teacher with a clipboard.',
			'A swarm of bees took a liking to {car}\'s radiator grille just as the prom queen arrived, and {customer} had to explain the screaming to the sixth form.'
		]
	},
	{
		id: 'film',
		name: 'Film villain getaway',
		feeMin: 1500,
		feeMax: 3800,
		minD: 7,
		minR: 5,
		minCond: 5,
		wearMin: 1.0,
		wearMax: 3.0,
		blurbs: [
			'{customer} is producing a spy film and needs a classic car for the villain\'s getaway. There will be a controlled skid. Probably.',
			"It's {customer} from the film studio. Our villain needs something elegant and menacing for the final chase across the moors.",
			'{customer} wants a classic car for one getaway scene: a bank, a chase, and a stuntman who insists he has done this before.'
		],
		success: [
			'The getaway scene was nailed in two takes, and {customer} says {car} is the most menacing thing on screen since the last villain.',
			'The director fell in love with {car} and rewrote the ending so the villain escapes. {customer} pays in full and promises cinema tickets.',
			'The stunt went perfectly and {car} drifted round the market square like a professional. {customer} applauds. The crew applauds. A seagull applauds.'
		],
		mishap: [
			"The villain's coat caught in {car}'s door and the take was lost to laughter. {customer} says the outtakes alone are worth the fee.",
			'A controlled skid turned out to be rather less controlled than advertised, and {car} took out two traffic cones. {customer} pays for the cones.',
			"{customer}'s leading man insisted on doing his own driving and flattened a market barrow. The take was, everyone agrees, unforgettable."
		],
		disaster: [
			'The stunt went spectacularly wrong and {car} ended up in the canal alongside a rubber shark. {customer} is calling the scene "the villain\'s watery end".',
			'A generator burst on set and covered {car} in green paint meant for the monster suit. {customer} has stopped answering the production phone.'
		]
	}
];
