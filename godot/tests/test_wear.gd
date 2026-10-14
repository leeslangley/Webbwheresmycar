extends "res://tests/harness.gd"

const KEYS := ["dirt", "rust", "pit", "fade", "dent", "crack"]


func test_at_zero_is_clean() -> void:
	var d: Dictionary = Wear.at(0.0)
	for k in KEYS:
		ok(d.has(k), "key " + k)
		near(float(d.get(k, 1.0)), 0.0, 1e-9, k)


func test_at_three_is_full() -> void:
	var d: Dictionary = Wear.at(3.0)
	near(float(d["dirt"]), 0.4, 1e-6, "dirt")
	near(float(d["rust"]), 0.28, 1e-6, "rust")
	near(float(d["pit"]), 0.18, 1e-6, "pit")
	near(float(d["fade"]), 0.5, 1e-6, "fade")
	near(float(d["dent"]), 1.0, 1e-6, "dent")
	near(float(d["crack"]), 1.0, 1e-6, "crack")


func test_at_between_steps() -> void:
	near(float(Wear.at(1.5)["dirt"]), 0.17, 1e-6, "dirt at 1.5")
	near(float(Wear.at(2.0)["rust"]), 0.10, 1e-6, "rust at 2.0")


func test_at_clamps() -> void:
	eq(Wear.at(9.0), Wear.at(3.0), "above 3 clamps to 3")
	eq(Wear.at(-1.0), Wear.at(0.0), "below 0 clamps to 0")


func test_clamp_level_nan() -> void:
	near(Wear.clamp_level(NAN), 0.0, 1e-9, "NaN gives 0")
	near(Wear.clamp_level(7.5), 3.0, 1e-9, "high clamps to 3")
	near(Wear.clamp_level(1.25), 1.25, 1e-9, "in range unchanged")


func test_state_from_condition() -> void:
	eq(Wear.state_from_condition(8.0), 0, "8 is mint")
	eq(Wear.state_from_condition(7.9), 1, "7.9 is worn")
	eq(Wear.state_from_condition(5.0), 1, "5 is worn")
	eq(Wear.state_from_condition(4.99), 2, "4.99 is tatty")
	eq(Wear.state_from_condition(2.5), 2, "2.5 is tatty")
	eq(Wear.state_from_condition(2.49), 3, "2.49 is wreck")
	eq(Wear.state_from_condition(NAN), 0, "NaN is mint")


func test_faded_colour() -> void:
	var c: Color = Color8(201, 111, 50)
	var got: Color = Wear.faded(c, 3.0)
	var want: Color = Color8(192, 140, 100)
	near(got.r, want.r, 1.5 / 255.0, "red")
	near(got.g, want.g, 1.5 / 255.0, "green")
	near(got.b, want.b, 1.5 / 255.0, "blue")
	eq(Wear.faded(c, 0.0), c, "level 0 leaves the colour alone")


func test_shader_include_has_the_pieces() -> void:
	var path := "res://art/car_wear.gdshaderinc"
	ok(FileAccess.file_exists(path), "include file exists")
	var txt: String = FileAccess.get_file_as_string(path)
	for needle in [
		"float wr_tab(",
		"float wr_noise(",
		"float wr_pit(",
		"void wr_apply_paint(",
		"void wr_apply_chrome(",
		"void wr_apply_glass(",
		"vec4(0.0, 0.1, 0.24, 0.4)",
		"vec4(0.0, 0.0, 0.10, 0.28)",
	]:
		ok(txt.contains(needle), "include contains " + needle)
	ok(not txt.contains("shader_type"), "include has no shader_type line")
