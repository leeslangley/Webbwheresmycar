// Tier 3 catalogue: Dream Machines (11 cars).
// Plain data, transcribed from docs/DESIGN.md section 6. No logic here.
// Columns: id | name | year | archetype | tier | basePrice | baseRent | D M R | quip.

export const CARS_T3 = [
	{
		id: 't3_mercedez',
		name: 'Mercedez Pagoda SL',
		year: 1967,
		archetype: 'roadster',
		tier: 3,
		basePrice: 42000,
		baseRent: 1900,
		desirability: 8,
		maintenance: 6,
		reliability: 6,
		quip: 'A temple on wheels. Priests not included.'
	},
	{
		id: 't3_porshe',
		name: 'Porshe 9-Eleventy',
		year: 1968,
		archetype: 'coupe',
		tier: 3,
		basePrice: 45000,
		baseRent: 2000,
		desirability: 8,
		maintenance: 6,
		reliability: 6,
		quip: 'Engine at the wrong end, owners at the wrong price.'
	},
	{
		id: 't3_delorean',
		name: 'DeLoreon DMC-Twelve',
		year: 1981,
		archetype: 'gullwing',
		tier: 3,
		basePrice: 55000,
		baseRent: 2400,
		desirability: 8,
		maintenance: 5,
		reliability: 3,
		quip: 'Needs 1.21 gigawatts and a miracle.'
	},
	{
		id: 't3_jagwar',
		name: 'Jagwar E-Type',
		year: 1963,
		archetype: 'longnose',
		tier: 3,
		basePrice: 85000,
		baseRent: 3000,
		desirability: 9,
		maintenance: 7,
		reliability: 4,
		quip: 'The most beautiful car ever made, says everyone, including the car.'
	},
	{
		id: 't3_cloudy',
		name: 'Rolls-Roice Silver Cloudy',
		year: 1961,
		archetype: 'limo',
		tier: 3,
		basePrice: 95000,
		baseRent: 3200,
		desirability: 8,
		maintenance: 8,
		reliability: 7,
		quip: 'The only sound is the clock. And your bank balance sobbing.'
	},
	{
		id: 't3_cobbra',
		name: 'Shellby Cobbra',
		year: 1965,
		archetype: 'longnose',
		tier: 3,
		basePrice: 150000,
		baseRent: 4500,
		desirability: 9,
		maintenance: 7,
		reliability: 4,
		quip: 'Hisses. Bites. Insurance company hates it.'
	},
	{
		id: 't3_dinosore',
		name: 'Furrari Dino-sore',
		year: 1970,
		archetype: 'wedge',
		tier: 3,
		basePrice: 180000,
		baseRent: 5200,
		desirability: 9,
		maintenance: 9,
		reliability: 3,
		quip: 'Extinct in all but price.'
	},
	{
		id: 't3_lamborgonzo',
		name: 'Lamborgonzo Countdown',
		year: 1975,
		archetype: 'wedge',
		tier: 3,
		basePrice: 220000,
		baseRent: 6000,
		desirability: 10,
		maintenance: 9,
		reliability: 2,
		quip: 'Doors open upwards, hopes go downwards.'
	},
	{
		id: 't3_gtforty',
		name: 'Fjord GT-Forty',
		year: 1966,
		archetype: 'coupe',
		tier: 3,
		basePrice: 260000,
		baseRent: 6800,
		desirability: 9,
		maintenance: 8,
		reliability: 4,
		quip: 'Forty inches tall. Four hundred ways to go wrong.'
	},
	{
		id: 't3_blowhard',
		name: 'Bentlee Blowhard',
		year: 1929,
		archetype: 'tourer',
		tier: 3,
		basePrice: 300000,
		baseRent: 7400,
		desirability: 9,
		maintenance: 9,
		reliability: 3,
		quip: 'Green, loud, hand-built, hand-wringing.'
	},
	{
		id: 't3_aston',
		name: 'Aston Martian DB-Fiver',
		year: 1964,
		archetype: 'coupe',
		tier: 3,
		basePrice: 320000,
		baseRent: 8000,
		desirability: 10,
		maintenance: 8,
		reliability: 5,
		quip: 'Ejector seat button is strictly decorative. Probably.'
	}
];
