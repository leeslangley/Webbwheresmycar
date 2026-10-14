extends "res://tests/harness.gd"


func test_instant() -> void:
	var c := UiCounter.new()
	c.set_value(1000.0, false)
	near(c.value_shown(), 1000.0, 0.01, "instant value")
	eq(c.text(), CoreFormat.money(1000), "instant text")
	eq(c.is_animating(), false, "instant is not animating")
	c.free()


func test_roll_up() -> void:
	var c := UiCounter.new()
	c.set_value(0.0, false)
	c.set_value(1000.0, true)
	eq(c.is_animating(), true, "roll up starts animating")
	eq(c.current_color(), UiTheme.color("good"), "rising is green")
	c.advance(0.35)
	near(c.value_shown(), 875.0, 0.001, "roll up halfway (eased 0.875)")
	c.advance(0.35)
	near(c.value_shown(), 1000.0, 0.01, "roll up finished")
	eq(c.is_animating(), false, "roll up no longer animating")
	eq(c.current_color(), c.base_color, "finished colour is base")
	c.free()


func test_roll_down_and_retarget() -> void:
	var c := UiCounter.new()
	c.set_value(1000.0, false)
	c.set_value(500.0, true)
	eq(c.current_color(), UiTheme.color("bad"), "falling is red")
	c.advance(0.35)
	near(c.value_shown(), 562.5, 0.01, "roll down halfway")
	c.set_value(0.0, true)
	c.advance(0.35)
	near(c.value_shown(), 70.3125, 0.01, "retarget starts from the shown value")
	c.free()


func test_number_mode() -> void:
	var c := UiCounter.new()
	c.money_mode = false
	c.prefix = "x"
	c.suffix = "!"
	c.set_value(7.4, false)
	eq(c.text(), "x7!", "number mode rounds down")
	c.set_value(7.5, false)
	eq(c.text(), "x8!", "number mode rounds halves up")
	c.free()


func test_zero_dt() -> void:
	var c := UiCounter.new()
	c.set_value(42.0, false)
	c.advance(0.0)
	near(c.value_shown(), 42.0, 0.01, "zero dt on a finished counter changes nothing")
	eq(c.is_animating(), false, "still finished")
	c.free()
