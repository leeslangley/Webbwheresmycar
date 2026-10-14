extends "res://tests/harness.gd"

# CoreFormat (godot/core/format.gd) against the card examples and the JS golden fixture (format.json).


func test_money() -> void:
	eq(CoreFormat.money(1234), CoreFormat.pound() + "1,234", "plain thousands")
	eq(CoreFormat.money(0), CoreFormat.pound() + "0", "zero")
	eq(CoreFormat.money(12.6), CoreFormat.pound() + "13", "rounds up first")
	eq(CoreFormat.money(-1234), "-" + CoreFormat.pound() + "1,234", "negative")
	eq(CoreFormat.money(-0.4), CoreFormat.pound() + "0", "never -£0")
	eq(CoreFormat.money(999), CoreFormat.pound() + "999", "no separator needed")
	eq(CoreFormat.money(12.4), CoreFormat.pound() + "12", "rounds down")
	eq(CoreFormat.money(-12.6), "-" + CoreFormat.pound() + "13", "negative rounds away from zero")
	eq(CoreFormat.money(-12.5), "-" + CoreFormat.pound() + "12", "negative half rounds up (toward +inf)")
	eq(CoreFormat.money(1000000000), CoreFormat.pound() + "1,000,000,000", "billions")
	var pairs: Array = GoldenUtil.fixture("format")["money"]
	eq(pairs.size(), 20, "money fixture has 20 pairs")
	for pair in pairs:
		var got: String = CoreFormat.money(float(pair[0]))
		eq(got, pair[1], "money golden %s" % str(pair[0]))


func test_one_dp() -> void:
	eq(CoreFormat.one_dp(2), "2.0", "integer gets .0")
	eq(CoreFormat.one_dp(7.46), "7.5", "rounds up")
	eq(CoreFormat.one_dp(7.44), "7.4", "rounds down")
	eq(CoreFormat.one_dp(-1.25), "-1.2", "negative")
	eq(CoreFormat.one_dp(-0.04), "0.0", "never -0.0")
	var pairs: Array = GoldenUtil.fixture("format")["oneDp"]
	eq(pairs.size(), 11, "oneDp fixture has 11 pairs")
	for pair in pairs:
		eq(CoreFormat.one_dp(float(pair[0])), pair[1], "oneDp golden %s" % str(pair[0]))


func test_date_text() -> void:
	eq(CoreFormat.date_text(1), "1 January", "first day")
	eq(CoreFormat.date_text(55), "24 February", "card example")
	eq(CoreFormat.date_text(59), "28 February", "end of non-leap February")
	eq(CoreFormat.date_text(60), "1 March", "first day of March")
	eq(CoreFormat.date_text(365), "31 December", "last day")
	eq(CoreFormat.date_text(0), "", "day 0 is empty")
	eq(CoreFormat.date_text(366), "", "day 366 is empty")
	var days: Array = GoldenUtil.fixture("format")["dateText"]
	eq(days.size(), 365, "dateText fixture has 365 days")
	for d in range(1, 366):
		eq(CoreFormat.date_text(d), days[d - 1], "dateText golden day %d" % d)


func test_stars() -> void:
	eq(CoreFormat.stars(7), char(9733).repeat(7) + char(9734).repeat(3), "card example")
	eq(CoreFormat.stars(3).length(), 10, "always ten characters")
	eq(CoreFormat.stars(-2), CoreFormat.stars(0), "clamped low")
	eq(CoreFormat.stars(11), CoreFormat.stars(10), "clamped high")
	eq(CoreFormat.stars(3.5), char(9733).repeat(4) + char(9734).repeat(6), "3.5 rounds up")
	eq(CoreFormat.stars(3.4), char(9733).repeat(3) + char(9734).repeat(7), "3.4 rounds down")
	var pairs: Array = GoldenUtil.fixture("format")["stars"]
	eq(pairs.size(), 8, "stars fixture has 8 pairs")
	for pair in pairs:
		eq(CoreFormat.stars(float(pair[0])), pair[1], "stars golden %s" % str(pair[0]))


func test_plural() -> void:
	eq(CoreFormat.plural(1, "car", "cars"), "1 car", "singular")
	eq(CoreFormat.plural(0, "car", "cars"), "0 cars", "zero is plural")
	eq(CoreFormat.plural(21, "car", "cars"), "21 cars", "twenty-one")
	var cases: Array = GoldenUtil.fixture("format")["plural"]
	eq(cases.size(), 5, "plural fixture has 5 cases")
	for c in cases:
		eq(CoreFormat.plural(int(c[0]), c[1], c[2]), c[3], "plural golden %s" % str(c[0]))


func test_ascii_source() -> void:
	var bytes: PackedByteArray = FileAccess.get_file_as_bytes("res://core/format.gd")
	ok(bytes.size() > 0, "format.gd is readable")
	var high: int = 0
	for b in bytes:
		if b >= 128:
			high += 1
	eq(high, 0, "format.gd has no non-ASCII bytes")


func test_pound_is_one_char() -> void:
	eq(CoreFormat.pound().length(), 1, "pound is one character")
	eq(CoreFormat.pound().unicode_at(0), 163, "pound is code 163")
