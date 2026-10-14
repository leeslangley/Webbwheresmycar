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


func _draw() -> void:
	_sheet(Vector2.ZERO, day, 1.0)
	if _tear < 1.0:
		_sheet(Vector2(70.0 * _tear, 50.0 * _tear), _prev_day, 1.0 - _tear)


func _sheet(offset: Vector2, d: int, alpha: float) -> void:
	var paper: Color = _a(UiTheme.color("paper"), alpha)
	var ink: Color = _a(UiTheme.color("ink"), alpha)
	UiTheme.draw_box(self, Rect2(offset, SHEET_SIZE), paper, ink, 4, false)
	for k in range(13):
		draw_rect(Rect2(offset.x + k * 10.0, offset.y + (k % 2) * 4.0, 10.0, 4.0), ink)
	var band := Rect2(offset + Vector2(4, 12), Vector2(122, 28))
	draw_rect(band, _a(UiTheme.color("enamelRed"), alpha))
	var band_text_y: float = band.position.y + (band.size.y - float(UiTheme.size_for("h3"))) * 0.5
	UiTheme.draw_text(self, label_for(d), Vector2(band.position.x, band_text_y), "h3", _a(UiTheme.color("white"), alpha), band.size.x, HORIZONTAL_ALIGNMENT_CENTER)
	UiTheme.draw_text(self, number_for(d), offset + Vector2(0, 48), "number", ink, SHEET_SIZE.x, HORIZONTAL_ALIGNMENT_CENTER)
	UiTheme.draw_text(self, "DAY %d" % d, offset + Vector2(0, 92), "caption", _a(UiTheme.color("midgrey"), alpha), SHEET_SIZE.x, HORIZONTAL_ALIGNMENT_CENTER)


static func _a(c: Color, alpha: float) -> Color:
	return Color(c.r, c.g, c.b, c.a * alpha)
