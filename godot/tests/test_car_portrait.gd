extends "res://tests/harness.gd"


func test_api() -> void:
	var p := CarPortrait.new()
	p.set_car("t1_allergy", Color("#8E8455"), 2)
	eq(p.get_car_id(), "t1_allergy", "car id")
	eq(p.get_paint(), Color("#8E8455"), "paint")
	eq(p.get_wear(), 2, "wear")
	eq(p.display_name(), "AUSTEN ALLERGY", "display name from Data")
	near(p.body_color().r, Color("#8E8455").darkened(0.24).r, 0.0001, "body colour darkened by wear")
	p.free()


func test_clamp() -> void:
	var p := CarPortrait.new()
	p.set_car("t1_allergy", Color.RED, 9)
	eq(p.get_wear(), 3, "wear 9 clamps to 3")
	p.set_car("t1_allergy", Color.RED, -4)
	eq(p.get_wear(), 0, "wear -4 clamps to 0")
	p.free()


func test_unknown_and_clear() -> void:
	var p := CarPortrait.new()
	p.set_car("zzz", Color.RED)
	eq(p.display_name(), "ZZZ", "unknown model shows id upper-cased")
	p.clear()
	eq(p.get_car_id(), "", "clear empties id")
	eq(p.display_name(), "", "clear gives empty name")
	p.free()


func test_wear_for() -> void:
	eq(CarPortrait.wear_for(10.0), 0, "pristine")
	eq(CarPortrait.wear_for(8.0), 0, "8 is still 0")
	eq(CarPortrait.wear_for(7.5), 1, "7.5 is 1")
	eq(CarPortrait.wear_for(5.0), 2, "5 is 2")
	eq(CarPortrait.wear_for(2.5), 3, "2.5 is 3")
	eq(CarPortrait.wear_for(0.0), 3, "0 is 3")
	eq(CarPortrait.wear_for(12.0), 0, "over 10 clamps to 0")


func test_default_size() -> void:
	var p := CarPortrait.new()
	eq(p.size, Vector2(200, 114), "default size")
	p.free()
