class_name UiCalendarSheet
extends Control

# Torn-off wall-calendar day sheet for the bottom HUD (weekday + month on a red band, big day-of-month
# number, tiny DAY n line). Day 1 of the year is a Monday; 365 days, no leap years (src/art/calendar.js).
# When the day changes the old sheet is torn off and flutters away over TEAR seconds. Time is stepped
# by advance(dt) so tests drive it by hand.

const MONTH_LENGTHS: Array[int] = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const MONTHS: Array[String] = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
const WEEKDAYS: Array[String] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
const TEAR := 0.35
const DAYS_IN_YEAR := 365
const SHEET_SIZE := Vector2(130, 114)

var day: int = 1
var _prev_day: int = 0
var _tear: float = 1.0


func _init() -> void:
	size = SHEET_SIZE
	mouse_filter = MOUSE_FILTER_IGNORE
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR


# Month (1..12), day of month (1..31) and weekday (0 = MON) for a day of the year (clamped to 1..365).
static func date_parts(day_in: int) -> Dictionary:
	var d: int = clampi(day_in, 1, DAYS_IN_YEAR)
	var rest: int = d
	var month: int = 12
	for i in range(MONTH_LENGTHS.size()):
		if rest <= MONTH_LENGTHS[i]:
			month = i + 1
			break
		rest -= MONTH_LENGTHS[i]
	return {"month": month, "dom": rest, "weekday": (d - 1) % 7}


func set_day(d: int, animate: bool = true) -> void:
	var nd: int = clampi(d, 1, DAYS_IN_YEAR)
	if nd == day:
		return
	_prev_day = day
	day = nd
	_tear = 0.0 if animate else 1.0
	queue_redraw()


func advance(dt: float) -> void:
	if _tear < 1.0:
		_tear = minf(1.0, _tear + dt / TEAR)
		queue_redraw()


func _process(dt: float) -> void:
	advance(dt)


func tear_progress() -> float:
	return _tear


func label_for(d: int) -> String:
	var p: Dictionary = date_parts(d)
	return "%s %s" % [WEEKDAYS[p["weekday"]], MONTHS[p["month"] - 1]]


func number_for(d: int) -> String:
	return str(date_parts(d)["dom"])


# The current sheet, and while tearing the old one flipping up and away (rotating, fading).
func _draw() -> void:
	_sheet(day, 1.0)
	if _tear < 1.0:
		var e := UiTokens.ease_named("outQuad", _tear)
		var pivot := Vector2(SHEET_SIZE.x * 0.5, 4.0)
		draw_set_transform(pivot + Vector2(90.0 * e, -30.0 * e + 120.0 * e * e), -0.9 * e, Vector2.ONE * (1.0 - 0.2 * e))
		_sheet(_prev_day, 1.0 - _tear, -pivot)
		draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)


func _sheet(d: int, alpha: float, offset: Vector2 = Vector2.ZERO) -> void:
	var ink: Color = _a(UiTheme.color("ink"), alpha)
	if UiSkin.tex("calendar") == null:
		UiTheme.draw_box(self, Rect2(offset, SHEET_SIZE), _a(UiTheme.color("paper"), alpha), ink, 4, false)
	else:
		UiSkin.blit(self, "calendar", offset - Vector2(8, 8), Color(1, 1, 1, alpha))
	var band := Rect2(offset + Vector2(6, 15), Vector2(118, 26))
	var band_text_y: float = band.position.y + (band.size.y - float(UiTheme.size_for("h3"))) * 0.5 + 1.0
	UiSkin.role_text(self, label_for(d), Vector2(band.position.x, band_text_y), "h3", _a(UiTheme.color("white"), alpha), _a(Color("5E0E12"), alpha), 4, band.size.x, HORIZONTAL_ALIGNMENT_CENTER)
	var big := UiSkin.display_font(900)
	UiSkin.text(self, big, number_for(d), offset + Vector2(0, 38), 50, ink, ink, 0, SHEET_SIZE.x, HORIZONTAL_ALIGNMENT_CENTER)
	UiTheme.draw_text(self, "DAY %d" % d, offset + Vector2(0, 86), "caption", _a(Color("8A7A5C"), alpha), SHEET_SIZE.x, HORIZONTAL_ALIGNMENT_CENTER)


static func _a(c: Color, alpha: float) -> Color:
	return Color(c.r, c.g, c.b, c.a * alpha)
