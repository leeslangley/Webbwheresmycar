class_name UiSkin
extends RefCounted

# The painted-cartoon chrome: textures baked by tools/art/ui_bake.py into res://art/ui/, drawn as 9-slices,
# plus the bold display font (Inter, OFL) and outlined-text helpers. Static only; helpers that draw are
# called from inside a _draw() of a CanvasItem. A missing texture draws nothing (never an error).

const DIR := "res://art/ui/"
const DISPLAY_FONT_PATH := "res://ui/fonts/Inter.woff2"

# 9-slice margins (left, top, right, bottom) for each baked texture.
const MARGINS := {
	"btn": Vector4(22, 18, 22, 22),
	"shadow9": Vector4(24, 24, 24, 24),
	"glow9": Vector4(32, 32, 32, 32),
	"panel_paper9": Vector4(26, 26, 26, 26),
	"panel_night9": Vector4(30, 30, 30, 30),
	"row_hot9": Vector4(20, 20, 20, 20),
	"toast9": Vector4(26, 22, 22, 22),
	"tip9": Vector4(16, 16, 16, 16),
	"frame9": Vector4(18, 18, 18, 18),
	"plaque": Vector4(14, 0, 14, 0),
}

static var _tex: Dictionary = {}
static var _boxes: Dictionary = {}
static var _display: Dictionary = {}


static func tex(tex_name: String) -> Texture2D:
	if _tex.has(tex_name):
		return _tex[tex_name]
	var path := DIR + tex_name + ".png"
	var t: Texture2D = null
	if ResourceLoader.exists(path):
		t = load(path) as Texture2D
	_tex[tex_name] = t
	return t


static func box(tex_name: String, margin_key: String = "") -> StyleBoxTexture:
	var key := tex_name + "|" + margin_key
	if _boxes.has(key):
		return _boxes[key]
	var t := tex(tex_name)
	if t == null:
		_boxes[key] = null
		return null
	var m: Vector4 = MARGINS.get(margin_key if margin_key != "" else tex_name, Vector4(16, 16, 16, 16))
	var sb := StyleBoxTexture.new()
	sb.texture = t
	sb.texture_margin_left = m.x
	sb.texture_margin_top = m.y
	sb.texture_margin_right = m.z
	sb.texture_margin_bottom = m.w
	_boxes[key] = sb
	return sb


# Draws a baked 9-slice over rect, tinted by modulate.
static func nine(item: CanvasItem, tex_name: String, rect: Rect2, modulate: Color = Color.WHITE, margin_key: String = "") -> void:
	var sb := box(tex_name, margin_key)
	if sb == null:
		return
	sb.modulate_color = modulate
	item.draw_style_box(sb, rect)


# Draws a texture at pos (top-left), tinted.
static func blit(item: CanvasItem, tex_name: String, pos: Vector2, modulate: Color = Color.WHITE) -> void:
	var t := tex(tex_name)
	if t != null:
		item.draw_texture(t, pos, modulate)


# Draws a wide baked texture into a rect of another width, keeping cap px at each end unscaled (3-slice).
static func three(item: CanvasItem, tex_name: String, rect: Rect2, cap: float, modulate: Color = Color.WHITE) -> void:
	var t := tex(tex_name)
	if t == null:
		return
	var tw := float(t.get_width())
	var th := float(t.get_height())
	var c := minf(cap, rect.size.x * 0.5)
	item.draw_texture_rect_region(t, Rect2(rect.position, Vector2(c, rect.size.y)), Rect2(0, 0, c, th), modulate)
	var mid_w := rect.size.x - 2.0 * c
	if mid_w > 0.0:
		var src_w := minf(mid_w, tw - 2.0 * c)
		var src_x := (tw - src_w) * 0.5
		item.draw_texture_rect_region(t, Rect2(rect.position + Vector2(c, 0), Vector2(mid_w, rect.size.y)), Rect2(src_x, 0, src_w, th), modulate)
	item.draw_texture_rect_region(t, Rect2(rect.position + Vector2(rect.size.x - c, 0), Vector2(c, rect.size.y)), Rect2(tw - c, 0, c, th), modulate)


# Inter at a weight (100..900). Smooth (antialiased) unlike the pixel fonts.
static func display_font(weight: int = 900) -> Font:
	if _display.has(weight):
		return _display[weight]
	var base: Font = null
	if ResourceLoader.exists(DISPLAY_FONT_PATH):
		base = load(DISPLAY_FONT_PATH) as Font
	if base == null:
		_display[weight] = UiTheme.title_font()
		return _display[weight]
	var fv := FontVariation.new()
	fv.base_font = base
	var ts := TextServerManager.get_primary_interface()
	fv.variation_opentype = {ts.name_to_tag("wght"): weight}
	_display[weight] = fv
	return fv


# Text with a drop shadow, a thick outline and a fill. pos is the TOP-LEFT of the line box.
static func text(item: CanvasItem, font: Font, s: String, pos: Vector2, px: int, fill: Color, outline: Color = UiTheme.INK, outline_px: int = 0, width: float = -1.0, align: int = HORIZONTAL_ALIGNMENT_LEFT, shadow: Vector2 = Vector2.ZERO) -> void:
	var base := pos + Vector2(0, font.get_ascent(px))
	if shadow != Vector2.ZERO:
		var sc := Color(0, 0, 0, 0.45 * fill.a)
		if outline_px > 0:
			item.draw_string_outline(font, base + shadow, s, align, width, px, outline_px, sc)
		item.draw_string(font, base + shadow, s, align, width, px, sc)
	if outline_px > 0:
		item.draw_string_outline(font, base, s, align, width, px, outline_px, outline)
	item.draw_string(font, base, s, align, width, px, fill)


# Text for a UiTheme role (pixel fonts) with an outline.
static func role_text(item: CanvasItem, s: String, pos: Vector2, role: String, fill: Color, outline: Color = UiTheme.INK, outline_px: int = 4, width: float = -1.0, align: int = HORIZONTAL_ALIGNMENT_LEFT, shadow: Vector2 = Vector2.ZERO) -> void:
	text(item, UiTheme.font_for(role), s, pos, UiTheme.size_for(role), fill, outline, outline_px, width, align, shadow)


# A smooth rounded rect (StyleBoxFlat, antialiased) with an optional border.
static func rrect(item: CanvasItem, rect: Rect2, fill: Color, radius: float, border: Color = Color(0, 0, 0, 0), bw: int = 0) -> void:
	var sb := StyleBoxFlat.new()
	sb.bg_color = fill
	sb.set_corner_radius_all(int(radius))
	sb.corner_detail = 6
	sb.anti_aliasing = true
	if bw > 0:
		sb.set_border_width_all(bw)
		sb.border_color = border
	item.draw_style_box(sb, rect)


static func fade(c: Color, a: float) -> Color:
	return Color(c.r, c.g, c.b, c.a * a)
