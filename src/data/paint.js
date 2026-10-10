// Paint colours for the car drawer (DESIGN.md section 7.1).
// One entry per catalogue car id. Period-appropriate classic colours only.
// Pure data: no DOM, no randomness, no dates (DESIGN.md section 9.1).

export const PAINT = {
	// Tier 1: Bangers and Bargains
	t1_allergy: '#8E8455', // dismal drab sage
	t1_robbin: '#C9A227', // mustard
	t1_chimp: '#C96F32', // burnt orange
	t1_maurice: '#A8C4D4', // powder blue
	t1_volksbeagle: '#5FA8A0', // seafoam turquoise
	t1_trumpet: '#C8102E', // rosso red
	t1_cooker: '#1E4D2B', // British racing green
	t1_fjord: '#EDEAE0', // ermine white
	t1_mgbee: '#223A5E', // midnight blue
	t1_alpaca: '#F4E9C8', // old English cream

	// Tier 2: Proper Classics
	t2_fjordcapri: '#D98E32', // amber
	t2_trsixish: '#D9C24A', // mimosa yellow
	t2_spyder: '#A61C2B', // deep Alfa rosso
	t2_serious: '#6B7A3A', // olive bronze green
	t2_zed: '#C75B12', // salsa orange
	t2_eclair: '#F2E8C9', // lotus cream
	t2_lancer: '#6E8F6A', // sage green
	t2_healthy: '#9BBFD4', // healey ice blue
	t2_morganish: '#2E4B3C', // racing green
	t2_dees: '#B08D57', // champagne bronze

	// Tier 3: Dream Machines
	t3_mercedez: '#5B6770', // anthracite grey
	t3_porshe: '#F0EAD6', // light ivory
	t3_delorean: '#B8B8B8', // brushed stainless steel
	t3_jagwar: '#6C7F94', // opalescent silver blue
	t3_cloudy: '#1C1C1C', // coach black
	t3_cobbra: '#1F5FA8', // guard's blue
	t3_dinosore: '#D40000', // rosso corsa
	t3_lamborgonzo: '#F2C230', // countach yellow
	t3_gtforty: '#6FA8DC', // gulf light blue
	t3_blowhard: '#153F2A', // deep British green
	t3_aston: '#7B8794', // silver grey
};

// Returns the paint colour for a car id, or a neutral grey for unknown ids.
export function paintOf(id) {
	if (Object.prototype.hasOwnProperty.call(PAINT, id)) {
		return PAINT[id];
	}
	return '#888888';
}
