class_name CoreFormat
extends RefCounted

# Port of src/core/format.js: money, one decimal, day-of-year dates, stars and plurals. Pure static helpers.
# Source stays ASCII: the pound sign and the stars are built with char() codes.

const _MONTH_NAMES = [
	"January", "February", "March", "April", "May", "June",
	"July", "August", "September", "October", "November", "December",
]

const _MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]


static func pound() -> String:
	return char(163)


# Insert comma thousands separators into a digit string: "1234567" -> "1,234,567".
static func _comma_group(digits: String) -> String:
	var out := ""
	var n: int = digits.length()
	for i in range(n):
		if i > 0 and (n - i) % 3 == 0:
			out += ","
		out += digits[i]
	return out


# money(12.6) -> pound + "13"; halves round up (JS Math.round), so -12.5 -> "-" + pound + "12". Never "-" + pound + "0".
static func money(n: float) -> String:
	var rounded: int = int(floor(n + 0.5))
	var sign_text := "-" if rounded < 0 else ""
	return sign_text + pound() + _comma_group(str(absi(rounded)))


# one_dp(7.46) -> "7.5". Tiny epsilon so halves land the right way; never "-0.0".
static func one_dp(n: float) -> String:
	var s := "%.1f" % (n + 1e-9)
	if s == "-0.0":
		return "0.0"
	return s


# date_text(55) -> "24 February". Returns "" for a day outside 1..365.
static func date_text(day: int) -> String:
	if day < 1 or day > 365:
		return ""
	var rest: int = day
	for m in range(12):
		if rest <= _MONTH_LENGTHS[m]:
			return str(rest) + " " + _MONTH_NAMES[m]
		rest -= _MONTH_LENGTHS[m]
	return ""


# stars(7) -> 7 filled stars then 3 empty stars (10 characters). n is rounded and clamped to 0..10.
static func stars(n: float) -> String:
	var v: int = clampi(int(floor(n + 0.5)), 0, 10)
	return char(9733).repeat(v) + char(9734).repeat(10 - v)


# plural(1, "car", "cars") -> "1 car"; plural(3, "car", "cars") -> "3 cars".
static func plural(n: int, one: String, many: String) -> String:
	return str(n) + " " + (one if n == 1 else many)
