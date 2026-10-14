class_name UiTheme
extends RefCounted

# Shared look for every widget: font roles, pixel-crisp font loading and the boxed-panel drawing helpers.
# Static only. Colours are not defined here: color() asks UiTokens (godot/ui/tokens.gd).
# Helpers that draw are meant to be called from inside a _draw() of a CanvasItem.

const TOUCH := 64
const GRID := 4

const FONT_TITLE_PATH := "res://ui/fonts/PressStart2P-Regular.ttf"
const FONT_BODY_PATH := "res://ui/fonts/VT323-Regular.ttf"

# role -> [font kind, px] (logical px on the 1280x720 stage).
const ROLES: Dictionary = {
	"number": ["title", 48],
	"h1": ["title", 32],
	"h2": ["title", 24],
	"h3": ["title", 16],
	"button": ["title", 16],
	"hero": ["body", 40],
	"body": ["body", 28],
	"caption": ["body", 24],
}

const DEFAULT_BODY_PX := 28
const INK := Color(0.0784, 0.0627, 0.1647, 1.0)

static var _fonts: Dictionary = {}


static func _load(path: String) -> Font:
	if _fonts.has(path):
		return _fonts[path]
	var f := load(path) as FontFile
	var out: Font = ThemeDB.fallback_font
	if f != null:
		f.antialiasing = TextServer.FONT_ANTIALIASING_NONE
		f.hinting = TextServer.HINTING_NONE
		f.subpixel_positioning = TextServer.SUBPIXEL_POSITIONING_DISABLED
		out = f
	_fonts[path] = out
	return out


static func title_font() -> Font:
	return _load(FONT_TITLE_PATH)


static func body_font() -> Font:
	return _load(FONT_BODY_PATH)


static func font_for(role: String) -> Font:
	var kind: String = "body"
	if ROLES.has(role):
		kind = ROLES[role][0]
	if kind == "title":
		return title_font()
	return body_font()


static func size_for(role: String) -> int:
	if not ROLES.has(role):
		return DEFAULT_BODY_PX
	return int(ROLES[role][1])


static func color(key: String) -> Color:
	return UiTokens.col(key)


# Boxed panel: optional hard drop shadow, a filled border bw px thick INSIDE rect, then the fill.
static func draw_box(item: CanvasItem, rect: Rect2, fill: Color, border: Color = INK, bw: int = 4, shadow: bool = true) -> void:
	if shadow:
		item.draw_rect(Rect2(rect.position + Vector2(4, 4), rect.size), Color(0, 0, 0, 0.35))
	item.draw_rect(rect, border)
	item.draw_rect(rect.grow(-float(bw)), fill)


# Text for a role. pos is the TOP-LEFT of the line.
static func draw_text(item: CanvasItem, text: String, pos: Vector2, role: String, col: Color, width: float = -1.0, align: int = HORIZONTAL_ALIGNMENT_LEFT) -> void:
	var f: Font = font_for(role)
	var s: int = size_for(role)
	item.draw_string(f, pos + Vector2(0, f.get_ascent(s)), text, align, width, s, col)


# Bar: a back rect, then a fill inset 2 px that is ratio (0..1) of the width.
static func draw_bar(item: CanvasItem, rect: Rect2, ratio: float, fill: Color, back: Color = INK) -> void:
	item.draw_rect(rect, back)
	item.draw_rect(Rect2(rect.position + Vector2(2, 2), Vector2(bar_fill_width(rect, ratio), rect.size.y - 4)), fill)


static func bar_fill_width(rect: Rect2, ratio: float) -> float:
	return (rect.size.x - 4.0) * clampf(ratio, 0.0, 1.0)
