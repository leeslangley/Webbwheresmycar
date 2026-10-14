extends "res://tests/harness.gd"


func test_date_parts() -> void:
	eq(UiCalendarSheet.date_parts(1), {"month": 1, "dom": 1, "weekday": 0}, "day 1")
	eq(UiCalendarSheet.date_parts(31), {"month": 1, "dom": 31, "weekday": 2}, "day 31")
	eq(UiCalendarSheet.date_parts(32), {"month": 2, "dom": 1, "weekday": 3}, "day 32")
	eq(UiCalendarSheet.date_parts(59), {"month": 2, "dom": 28, "weekday": 2}, "day 59")
	eq(UiCalendarSheet.date_parts(60), {"month": 3, "dom": 1, "weekday": 3}, "day 60")
	eq(UiCalendarSheet.date_parts(365), {"month": 12, "dom": 31, "weekday": 0}, "day 365")
	eq(UiCalendarSheet.date_parts(0), UiCalendarSheet.date_parts(1), "day 0 clamps to 1")
	eq(UiCalendarSheet.date_parts(400), UiCalendarSheet.date_parts(365), "day 400 clamps to 365")


func test_labels() -> void:
	var s := UiCalendarSheet.new()
	eq(s.label_for(1), "MON JAN", "label day 1")
	eq(s.label_for(32), "THU FEB", "label day 32")
	eq(s.number_for(60), "1", "number day 60")
	eq(s.number_for(365), "31", "number day 365")
	s.free()


func test_tear() -> void:
	var s := UiCalendarSheet.new()
	s.set_day(2, false)
	eq(s.day, 2, "day after set_day(2, false)")
	near(s.tear_progress(), 1.0, 1e-9, "no tear when not animated")
	s.set_day(3, true)
	near(s.tear_progress(), 0.0, 1e-9, "tear starts at 0")
	s.advance(0.175)
	near(s.tear_progress(), 0.5, 1e-9, "half way after 0.175 s")
	s.set_day(3)
	near(s.tear_progress(), 0.5, 1e-9, "same day does not restart the tear")
	s.advance(1.0)
	near(s.tear_progress(), 1.0, 1e-9, "tear clamps at 1")
	s.set_day(3)
	near(s.tear_progress(), 1.0, 1e-9, "same day after finish stays finished")
	s.free()


func test_clamp() -> void:
	var s := UiCalendarSheet.new()
	s.set_day(999, false)
	eq(s.day, 365, "999 clamps to 365")
	s.set_day(-4, false)
	eq(s.day, 1, "-4 clamps to 1")
	s.free()
