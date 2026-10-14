class_name UiCashHistory
extends RefCounted

# Recent cash series for the LEDGER and the small SALES chart. Static only: one day -> one value,
# capped at MAX entries, oldest dropped first. A day that goes back in time (new or loaded game) clears the series.

const MAX := 30

static var _days: Array[int] = []
static var _vals: Array[float] = []


# Record the cash for a day. The same day replaces the last value; an earlier day starts a fresh series.
static func record(day: int, cash: float) -> void:
	if not _days.is_empty() and day == _days.back():
		_vals[_vals.size() - 1] = cash
	else:
		if not _days.is_empty() and day < _days.back():
			_days.clear()
			_vals.clear()
		_days.append(day)
		_vals.append(cash)
	while _days.size() > MAX:
		_days.pop_front()
		_vals.pop_front()


# The last n values, oldest first (all of them when there are fewer).
static func values(n: int = 14) -> Array[float]:
	var out: Array[float] = []
	var start: int = maxi(0, _vals.size() - n)
	for i in range(start, _vals.size()):
		out.append(_vals[i])
	return out


static func count() -> int:
	return _days.size()


static func reset() -> void:
	_days.clear()
	_vals.clear()
