extends "res://tests/harness.gd"

# CoreClock vs the JS reference (src/core/clock.js), via the golden fixture godot/tests/golden/clock.json.


func _fixture() -> Dictionary:
	var fx: Dictionary = GoldenUtil.load_golden("clock")
	ok(fx.has("dates"), "clock fixture loaded")
	return fx


func _days_where(check: Callable) -> Array:
	var out: Array = []
	for d in range(1, CoreClock.DAYS_IN_YEAR + 1):
		if check.call(d):
			out.append(d)
	return out


func test_dates_all_365() -> void:
	var rows: Array = _fixture().get("dates", [])
	eq(rows.size(), 365, "365 date rows in fixture")
	for row in rows:
		var want := {"month": row[1], "dayOfMonth": row[2], "monthName": row[3]}
		eq(CoreClock.date_of(row[0]), want, "date_of(%d)" % row[0])


func test_month_starts() -> void:
	var got: Array = []
	for m in range(1, 13):
		got.append(CoreClock.day_of_year_start(m))
	eq(got, _fixture().get("monthStarts", []), "day_of_year_start 1..12 vs fixture")
	eq(got, [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335], "month starts literal")


func test_month_start_days() -> void:
	var got: Array = _days_where(func(d: int) -> bool: return CoreClock.is_month_start(d))
	eq(got, _fixture().get("monthStartDays", []), "is_month_start days vs fixture")
	eq(got.size(), 12, "exactly 12 month starts")


func test_auction_days() -> void:
	var got: Array = _days_where(func(d: int) -> bool: return CoreClock.is_auction_day(d))
	eq(got, _fixture().get("auctionDays", []), "is_auction_day days vs fixture")
	eq(got.size(), 12, "exactly 12 auction days")
	eq(got[0], 24, "first auction day is 24")
	eq(got[got.size() - 1], 358, "last auction day is 358")


func test_days_left() -> void:
	var got: Array = []
	for d in range(1, CoreClock.DAYS_IN_YEAR + 1):
		got.append(CoreClock.days_left_in_month(d))
	eq(got, _fixture().get("daysLeft", []), "days_left_in_month 1..365 vs fixture")
	eq(CoreClock.days_left_in_month(1), 30, "Jan 1 leaves 30")
	eq(CoreClock.days_left_in_month(31), 0, "Jan 31 leaves 0")
	eq(CoreClock.days_left_in_month(32), 27, "Feb 1 leaves 27")


func test_constants() -> void:
	var c: Dictionary = _fixture().get("constants", {})
	eq(CoreClock.MONTH_NAMES, c.get("names"), "month names vs fixture")
	eq(CoreClock.MONTH_LENGTHS, c.get("lengths"), "month lengths vs fixture")
	eq(CoreClock.DAYS_IN_YEAR, c.get("year"), "days in year vs fixture")
	eq(CoreClock.AUCTION_DAY_OF_MONTH, c.get("auction"), "auction day vs fixture")
	var total := 0
	for n in CoreClock.MONTH_LENGTHS:
		total += n
	eq(total, 365, "lengths sum to 365")
	eq(CoreClock.MONTH_NAMES.size(), 12, "12 month names")


func test_out_of_range() -> void:
	eq(CoreClock.date_of(0), {}, "date_of(0) is empty")
	eq(CoreClock.date_of(366), {}, "date_of(366) is empty")
	eq(CoreClock.date_of(1.5), {}, "date_of(1.5) is empty")
	eq(CoreClock.date_of("3"), {}, "date_of(string) is empty")
	ok(CoreClock.valid_day(365), "valid_day(365)")
	ok(CoreClock.valid_day(365.0), "valid_day(365.0)")
	ok(not CoreClock.valid_day(0), "valid_day(0) false")
	ok(not CoreClock.valid_day(365.5), "valid_day(365.5) false")
	ok(not CoreClock.valid_day("3"), "valid_day(string) false")
	eq(CoreClock.day_of_year_start(0), -1, "day_of_year_start(0) is -1")
	eq(CoreClock.day_of_year_start(13), -1, "day_of_year_start(13) is -1")
	ok(not CoreClock.is_month_start(0), "is_month_start(0) false")
	ok(not CoreClock.is_auction_day(0), "is_auction_day(0) false")
	eq(CoreClock.days_left_in_month(400), -1, "days_left_in_month(400) is -1")
	eq(CoreClock.days_left_in_month(0), -1, "days_left_in_month(0) is -1")
