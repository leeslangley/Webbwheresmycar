// Fixed office room layout (DESIGN.md section 5, 7.2): where every prop sits
// in logical 1280x720 coordinates. Pure data, no drawing. Characters (mark,
// dave), the speech bubble and the TV screen content are drawn by later
// cards; these rectangles are their anchor points and hotspots.

export const FLOOR_Y = 520;
export const WALL_TOP = 56;

export const OFFICE = {
	hud: { x: 0, y: 0, w: 1280, h: 56 },
	calendar: { x: 36, y: 84, w: 190, h: 240 },
	workshop: { x: 36, y: 344, w: 190, h: 140 },
	tv: { x: 250, y: 110, w: 330, h: 400 },
	tvScreen: { x: 276, y: 136, w: 278, h: 206 },
	poster: { x: 620, y: 100, w: 120, h: 170 },
	window: { x: 770, y: 100, w: 150, h: 140 },
	ledger: { x: 900, y: 290, w: 90, h: 230 },
	garageDoor: { x: 1060, y: 110, w: 190, h: 400 },
	desk: { x: 600, y: 420, w: 330, h: 110 },
	phone: { x: 618, y: 372, w: 70, h: 52 },
	laptop: { x: 710, y: 358, w: 130, h: 66 },
	newspaper: { x: 850, y: 398, w: 70, h: 28 },
	kettle: { x: 300, y: 530, w: 120, h: 100 },
	mark: { x: 690, y: 250, w: 120, h: 190 },
	dave: { x: 1000, y: 300, w: 96, h: 210 },
	bubble: { x: 900, y: 200, w: 300, h: 90 },
};
