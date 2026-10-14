class_name UiTokens
extends RefCounted

# Design tokens: port of src/ui/tokens.js (COLOR, SPACE, ZONES, FLOOR, TYPE, MOTION, EASE) and the
# PALETTE of src/ui/theme.js. Static only: no state, no nodes. Golden vectors: godot/tests/golden/tokens.json.
# Colours stay hex strings exactly as the JS writes them; col() turns one into a Color.

const FONT_TITLE := "res://art/fonts/PressStart2P-Regular.ttf"
const FONT_BODY := "res://art/fonts/VT323-Regular.ttf"

# theme.js PALETTE (23 keys).
const PALETTE: Dictionary = {
	"black": "#000000",
	"white": "#FFFFFF",
	"red": "#68372B",
	"cyan": "#70A4B2",
	"purple": "#6F3D86",
	"green": "#588D43",
	"blue": "#352879",
	"yellow": "#B8C76F",
	"orange": "#6F4F25",
	"brown": "#433900",
	"lightred": "#9A6759",
	"darkgrey": "#444444",
	"midgrey": "#6C6C6C",
	"lightgreen": "#9AD284",
	"lightblue": "#6C5EB5",
	"lightgrey": "#959595",
	"cream": "#F4E9C8",
	"paper": "#FFF7DC",
	"lamp": "#FFD27A",
	"ink": "#14102A",
	"good": "#3FAE49",
	"bad": "#D9483B",
	"gold": "#E8B923",
}

# tokens.js COLOR (29 keys).
const COLOR: Dictionary = {
	"ink": "#14102A",
	"night": "#1B1735",
	"well": "#241E45",
	"wood": "#6B4423",
	"woodLight": "#8C5E34",
	"woodDark": "#3F2814",
	"woodGrain": "#4E3119",
	"brass": "#C9A24A",
	"brassLight": "#F2D98A",
	"brassDark": "#8A6B1F",
	"enamelRed": "#B3282D",
	"enamelGreen": "#1E5A3C",
	"enamelNavy": "#1C2E5A",
	"paper": "#FFF7DC",
	"paperShade": "#D9CBA0",
	"paperFold": "#C2B183",
	"bannerTop": "#F6CFA0",
	"bannerBottom": "#D9A66F",
	"bannerDither": "#C48B55",
	"hudBg": "#1B1735",
	"hudEdge": "#0B0818",
	"chartWhite": "#F8F6EE",
	"cashGreen": "#3FAE49",
	"cashDark": "#1F6B2E",
	"rivet": "#C9CCD2",
	"phosphor": "#7CFF8A",
	"amber": "#FFB84D",
	"warn": "#F2A93B",
	"info": "#70A4B2",
}

# Spacing grid (4 px base). sp(n) returns SPACE[n] for n in 1..7 only.
const SPACE: Dictionary = {1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32, 7: 48}

# Screen zones on the 1280x720 logical canvas. They stack top to bottom.
const ZONES: Dictionary = {
	"banner": {"x": 0, "y": 0, "w": 1280, "h": 120},
	"tableau": {"x": 0, "y": 120, "w": 1280, "h": 470},
	"hud": {"x": 0, "y": 590, "w": 1280, "h": 130},
}

# Smallest allowed logical px per font kind.
const FLOOR: Dictionary = {"title": 16, "body": 22}

# Type scale: each role names a font kind and a logical px size.
const TYPE: Dictionary = {
	"logo": {"kind": "title", "px": 64},
	"h1": {"kind": "title", "px": 32},
	"h2": {"kind": "title", "px": 24},
	"h3": {"kind": "title", "px": 16},
	"button": {"kind": "title", "px": 16},
	"bannerText": {"kind": "title", "px": 16, "lineH": 28},
	"hero": {"kind": "body", "px": 40},
	"body": {"kind": "body", "px": 28},
	"caption": {"kind": "body", "px": 24},
}

# Motion timings in milliseconds.
const MOTION: Dictionary = {
	"tap": 90,
	"press": 80,
	"toast": 260,
	"toastHold": 2500,
	"toastOut": 200,
	"bar": 450,
	"count": 700,
	"page": 320,
	"slide": 350,
	"fade": 250,
	"iris": 500,
	"static": 400,
	"flip": 700,
	"shake": 300,
	"flash": 180,
	"dayChange": 2400,
}

# Easing names in the JS EASE order.
const EASE_NAMES: Array[String] = ["linear", "outQuad", "outCubic", "inOutQuad", "outBack", "outBounce"]

const C1: float = 1.70158
const C3: float = C1 + 1.0
const N1: float = 7.5625
const D1: float = 2.75


# Colour for a COLOR key, else a PALETTE key, else magenta (with push_error).
static func col(key: String) -> Color:
	if COLOR.has(key):
		return Color(COLOR[key])
	if PALETTE.has(key):
		return Color(PALETTE[key])
	push_error("bad colour key: " + key)
	return Color.MAGENTA


# The spacing value for step n (1..7). Any other n is an error and returns 0.
static func sp(n: int) -> int:
	if not SPACE.has(n):
		push_error("bad space")
		return 0
	return SPACE[n]


# Font file for a TYPE role: title kind uses FONT_TITLE, body kind FONT_BODY. "" for an unknown role.
static func font_path(role: String) -> String:
	if not TYPE.has(role):
		return ""
	var kind: String = TYPE[role]["kind"]
	if kind == "title":
		return FONT_TITLE
	if kind == "body":
		return FONT_BODY
	return ""


# Clamp a progress value to 0..1.
static func clamp01(u: float) -> float:
	if u < 0.0:
		return 0.0
	if u > 1.0:
		return 1.0
	return u


# Linear interpolation from a to b by u (u is not clamped here).
static func lerp_to(a: float, b: float, u: float) -> float:
	return a + (b - a) * u


# Apply a named easing curve to u (clamped to 0..1). Unknown curve: push_error and return u.
static func ease_named(curve: String, u: float) -> float:
	var x: float = clamp01(u)
	match curve:
		"linear":
			return x
		"outQuad":
			return 1.0 - (1.0 - x) * (1.0 - x)
		"outCubic":
			return 1.0 - pow(1.0 - x, 3.0)
		"inOutQuad":
			if x < 0.5:
				return 2.0 * x * x
			return 1.0 - pow(-2.0 * x + 2.0, 2.0) / 2.0
		"outBack":
			return 1.0 + C3 * pow(x - 1.0, 3.0) + C1 * pow(x - 1.0, 2.0)
		"outBounce":
			return _out_bounce(x)
	push_error("bad ease")
	return u


static func _out_bounce(u: float) -> float:
	var x: float = u
	if x < 1.0 / D1:
		return N1 * x * x
	if x < 2.0 / D1:
		x -= 1.5 / D1
		return N1 * x * x + 0.75
	if x < 2.5 / D1:
		x -= 2.25 / D1
		return N1 * x * x + 0.9375
	x -= 2.625 / D1
	return N1 * x * x + 0.984375
