class_name CoreClock
extends RefCounted

# Port of src/core/clock.js: calendar maths for the 365-day game year (no leap years, no time zones).
# Pure static helpers, no state. Where the JS throws a RangeError, these return a sentinel
# ({} / -1 / false) and never error.

const MONTH_NAMES: Array[String] = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const MONTH_LENGTHS: Array[int] = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const DAYS_IN_YEAR := 365
const AUCTION_DAY_OF_MONTH := 24


# 1-based day number of the 1st of month m (1..12): sum of the previous month lengths plus 1.
static func _month_start(m: int) -> int:
	var day := 1
	for i in range(m - 1):
		day += MONTH_LENGTHS[i]
	return day


# True for a whole number (int, or a float with no fraction) from 1 to 365.
static func valid_day(day: Variant) -> bool:
	if typeof(day) != TYPE_INT and typeof(day) != TYPE_FLOAT:
		return false
	var f: float = float(day)
	if f != floor(f):
		return false
	return f >= 1.0 and f <= float(DAYS_IN_YEAR)


# {"month": m, "dayOfMonth": d, "monthName": name} for a valid day, else {}.
static func date_of(day: Variant) -> Dictionary:
	if not valid_day(day):
		return {}
	var d: int = int(day)
	var m: int = 12
	while d < _month_start(m):
		m -= 1
	return {"month": m, "dayOfMonth": d - _month_start(m) + 1, "monthName": MONTH_NAMES[m - 1]}


# 1-based day number of the 1st of the month, or -1 when month is not 1..12.
static func day_of_year_start(month: int) -> int:
	if month < 1 or month > 12:
		return -1
	return _month_start(month)


static func is_month_start(day: Variant) -> bool:
	if not valid_day(day):
		return false
	return date_of(day)["dayOfMonth"] == 1


static func is_auction_day(day: Variant) -> bool:
	if not valid_day(day):
		return false
	return date_of(day)["dayOfMonth"] == AUCTION_DAY_OF_MONTH


# Days after this one until the end of its month (0 on the last day), or -1 when the day is invalid.
static func days_left_in_month(day: Variant) -> int:
	if not valid_day(day):
		return -1
	var info: Dictionary = date_of(day)
	return MONTH_LENGTHS[int(info["month"]) - 1] - int(info["dayOfMonth"])
