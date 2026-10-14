extends "res://tests/harness.gd"


func test_colors() -> void:
	eq(UiTheme.color("ink"), UiTokens.col("ink"), "ink comes from UiTokens")
	eq(UiTheme.color("gold"), Color("#E8B923"), "gold")
	eq(UiTheme.color("nope"), Color.MAGENTA, "unknown key is magenta")


func test_roles() -> void:
	eq(UiTheme.size_for("h1"), 32, "h1")
	eq(UiTheme.size_for("number"), 48, "number")
	eq(UiTheme.size_for("body"), 28, "body")
	eq(UiTheme.size_for("caption"), 24, "caption")
	eq(UiTheme.size_for("zzz"), 28, "unknown role is 28")
	for role in UiTheme.ROLES:
		var kind: String = UiTheme.ROLES[role][0]
		var px: int = UiTheme.ROLES[role][1]
		if kind == "title":
			ok(px >= UiTokens.FLOOR["title"], "title floor for " + role)
		elif kind == "body":
			ok(px >= UiTokens.FLOOR["body"], "body floor for " + role)
		else:
			fail("unknown kind for " + role)


func test_fonts() -> void:
	ok(UiTheme.font_for("h1") != null, "h1 font exists")
	ok(UiTheme.title_font() != UiTheme.body_font(), "title and body fonts differ")
	eq(UiTheme.font_for("zzz"), UiTheme.body_font(), "unknown role uses body font")
	var tf: Font = UiTheme.title_font()
	if tf is FontFile:
		eq((tf as FontFile).antialiasing, TextServer.FONT_ANTIALIASING_NONE, "title font is not antialiased")


func test_bar_fill_width() -> void:
	near(UiTheme.bar_fill_width(Rect2(0, 0, 104, 10), 0.5), 50.0, 1e-9, "half")
	near(UiTheme.bar_fill_width(Rect2(0, 0, 104, 10), 2.0), 100.0, 1e-9, "over 1 clamps")
	near(UiTheme.bar_fill_width(Rect2(0, 0, 104, 10), -1.0), 0.0, 1e-9, "under 0 clamps")


func test_touch() -> void:
	eq(UiTheme.TOUCH, 64, "touch target")


func test_theme_resource() -> void:
	var t := load("res://ui/theme.tres") as Theme
	ok(t != null, "theme.tres loads as Theme")
	if t == null:
		return
	ok(t.default_font != null, "default font set")
	eq(t.default_font_size, 28, "default font size")
	ok(t.get_stylebox("normal", "Button") != null, "Button normal stylebox")
