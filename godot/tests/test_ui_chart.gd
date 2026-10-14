extends "res://tests/harness.gd"


func test_history_record() -> void:
	UiCashHistory.reset()
	UiCashHistory.record(1, 100.0)
	UiCashHistory.record(2, 150.0)
	UiCashHistory.record(2, 160.0)
	eq(UiCashHistory.values(), [100.0, 160.0], "same day replaces the last value")
	eq(UiCashHistory.count(), 2, "two days")
	UiCashHistory.reset()


func test_history_cap() -> void:
	UiCashHistory.reset()
	for d in range(1, 41):
		UiCashHistory.record(d, float(d))
	eq(UiCashHistory.count(), 30, "capped at 30")
	eq(UiCashHistory.values(3), [38.0, 39.0, 40.0], "newest three")
	eq(UiCashHistory.values(100).size(), 30, "values(100) returns all 30")
	UiCashHistory.reset()


func test_history_rewind() -> void:
	UiCashHistory.reset()
	for d in range(1, 6):
		UiCashHistory.record(d, float(d))
	UiCashHistory.record(2, 9.0)
	eq(UiCashHistory.values(), [9.0], "earlier day clears the series")
	UiCashHistory.reset()


func test_scale_points() -> void:
	eq(UiSalesChart.scale_points([0.0, 10.0, 5.0], Rect2(0, 0, 100, 50)), PackedVector2Array([Vector2(0, 50), Vector2(50, 0), Vector2(100, 25)]), "three points")
	eq(UiSalesChart.scale_points([3.0, 3.0], Rect2(0, 0, 100, 50)), PackedVector2Array([Vector2(0, 25), Vector2(100, 25)]), "flat series sits in the middle")
	eq(UiSalesChart.scale_points([5.0], Rect2(0, 0, 100, 50)), PackedVector2Array([Vector2(50, 25)]), "one value is centred")
	eq(UiSalesChart.scale_points([], Rect2(0, 0, 100, 50)).size(), 0, "empty input")


func test_chart_values() -> void:
	var c := UiSalesChart.new()
	c.set_values([1, 2, 3])
	eq(c.values, [1.0, 2.0, 3.0], "values are floats")
	eq(c.plot_rect(), Rect2(12, 34, 296, 68), "plot rect at default size")
	c.free()
