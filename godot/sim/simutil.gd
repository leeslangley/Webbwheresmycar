class_name SimUtil
extends RefCounted

# JS-compatible number helpers used by every sim port. Pure static helpers, no state.


# JS Math.round: halves go UP (2.5 -> 3, -2.5 -> -2). GDScript round() does not do this.
static func jround(x: float) -> int:
	return int(floor(x + 0.5))


# Number as text the way JS String(x) shows it for these values: integral -> no decimals, else shortest form.
static func num_str(x: float) -> String:
	if x == floor(x):
		return str(int(x))
	return String.num(x)
