// Daily Sprocket reactive headline templates, keyed by game situation
// (DESIGN.md 8.4 and 9.4). Each situation has 5 strings. Placeholders:
// {car} a car name, {customer} a customer name, {cash} a money amount.
// Situations: broke (cash under 1,000 quid), rich (over 50,000 quid),
// breakdown (a car failed on a job), bigwin (a job paid 2,000 quid or
// more), viral (an advert went viral), fullgarage (no free slots),
// emptygarage (no cars at all), monthend (the bills landed), auctionday
// (auction day is here). Pure data, no randomness.

export const REACTIVE = {
	broke: [
		'Webb\'s Wheels down to {cash}; mechanic paid in hugs and biscuits',
		'Till reveals {cash} and one button; owner calls it a fortune',
		'Bank manager laughs for six minutes at garage\'s {cash}',
		'Cashbox holds {cash}; accountant observed weeping into ledger',
		'{cash} left in the tin; piggy bank refuses further comment'
	],
	rich: [
		'Webb\'s Wheels awash with {cash}; tea break upgraded to two biscuits',
		'Owner spotted grinning at {cash} balance; staff demand pay rise',
		'{cash} in the vault; town declares the garage a national treasure',
		'Councillors demand tour of garage that somehow earned {cash}',
		'{cash} counted twice; paper boy now accepts cheques'
	],
	breakdown: [
		'{car} gives up on dual carriageway; recovery driver cycles over',
		'{car} stops dead outside church; congregation suspects a miracle',
		'Broken {car} towed home by donkey; donkey demands union recognition',
		'{car} coughs, splutters and retires to the hard shoulder',
		'Job abandoned after {car} declares itself a garden ornament'
	],
	bigwin: [
		'{customer} pays triple for express delivery; owner faints at till',
		'Big fee lands as {customer} tips a full tank of petrol',
		'{customer} pays over the odds; till demands a holiday',
		'Ledger trembles as {customer} settles the bill in full',
		'{customer} books the deluxe package; biscuits upgraded to jam ones'
	],
	viral: [
		'Webb\'s Wheels advert goes viral; queue reaches the next county',
		'Advert viewed by millions; phone line melts under traffic',
		'Garage jingle declared an earworm; whole town hums it badly',
		'Internet falls for garage advert; server begs for mercy',
		'Viral advert stars a spanner; viewers demand the full film'
	],
	fullgarage: [
		'Every ramp full; toolbox sleeps in the car park tonight',
		'Garage at capacity; owner turns away a confused bendy bus',
		'No slots left; hopeful queue forms with folding chairs',
		'Full house in the workshop; spanners declare themselves spent',
		'Garage bulging at the seams; kettle now takes bookings too'
	],
	emptygarage: [
		'Garage emptier than a pub on mug night',
		'Not one car on the books; tumbleweed rents a bay',
		'Empty ramps echo; owner interviews a wheelbarrow for company',
		'Showroom so bare that pigeons file a planning complaint',
		'Zero cars, zero hope, one kettle; Webb\'s Wheels soldiers on'
	],
	monthend: [
		'Bills arrive in convoy; postman refuses tips this month',
		'Month-end paperwork lands; tea consumption doubles at once',
		'Invoices swarm like wasps; owner guards the biscuit tin',
		'Ledger lands with a thud; calculator seeks stress leave',
		'Envelope avalanche hits the doormat; cat claims squatters\' rights'
	],
	auctionday: [
		'Auction day dawns; saleroom full of shifty nods and clipboards',
		'Bidding paddock opens; locals practise their innocent faces',
		'Hammer poised at the saleroom; wallets arrive already trembling',
		'Auction day: numbered paddle declared the top local accessory',
		'Saleroom opens at nine; sensible hats confiscated at the door'
	]
};
