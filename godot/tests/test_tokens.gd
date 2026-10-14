extends "res://tests/harness.gd"


func test_palette_matches_js() -> void:
	var fx: Dictionary = GoldenUtil.fixture("tokens")
	ok(GoldenUtil.same(UiTokens.PALETTE, fx["PALETTE"]), GoldenUtil.diff(UiTokens.PALETTE, fx["PALETTE"]))
	ok(GoldenUtil.same(UiTokens.COLOR, fx["COLOR"]), GoldenUtil.diff(UiTokens.COLOR, fx["COLOR"]))
	eq(UiTokens.COLOR.size(), 29, "COLOR key count")
	eq(UiTokens.PALETTE.size(), 23, "PALETTE key count")
	var hex := RegEx.new()
	hex.compile("^#[0-9A-Fa-f]{6}$")
	for table in [UiTokens.PALETTE, UiTokens.COLOR]:
		for key in table:
			ok(hex.search(table[key]) != null, "hex value for " + str(key))


func test_col() -> void:
	eq(UiTokens.col("ink"), Color("#14102A"), "ink")
	eq(UiTokens.col("gold"), Color("#E8B923"), "gold from PALETTE")
	eq(UiTokens.col("woodLight"), Color("#8C5E34"), "woodLight from COLOR")
	eq(UiTokens.col("nope"), Color.MAGENTA, "unknown key is magenta")


func test_space() -> void:
	var fx: Dictionary = GoldenUtil.fixture("tokens")
	for n in range(1, 8):
		eq(UiTokens.sp(n), fx["SPACE"][str(n)], "sp(%d)" % n)
	eq(UiTokens.sp(3), 12, "sp(3)")
	eq(UiTokens.sp(0), 0, "sp(0) is off the grid")
	eq(UiTokens.sp(8), 0, "sp(8) is off the grid")


func test_zones_type_motion_floor() -> void:
	var fx: Dictionary = GoldenUtil.fixture("tokens")
	ok(GoldenUtil.same(UiTokens.ZONES, fx["ZONES"]), GoldenUtil.diff(UiTokens.ZONES, fx["ZONES"]))
	ok(GoldenUtil.same(UiTokens.FLOOR, fx["FLOOR"]), GoldenUtil.diff(UiTokens.FLOOR, fx["FLOOR"]))
	ok(GoldenUtil.same(UiTokens.TYPE, fx["TYPE"]), GoldenUtil.diff(UiTokens.TYPE, fx["TYPE"]))
	ok(GoldenUtil.same(UiTokens.MOTION, fx["MOTION"]), GoldenUtil.diff(UiTokens.MOTION, fx["MOTION"]))


func test_zones_stack() -> void:
	var banner: Dictionary = UiTokens.ZONES["banner"]
	var tableau: Dictionary = UiTokens.ZONES["tableau"]
	var hud: Dictionary = UiTokens.ZONES["hud"]
	eq(banner["y"] + banner["h"], tableau["y"], "banner bottom is tableau top")
	eq(tableau["y"] + tableau["h"], hud["y"], "tableau bottom is hud top")
	eq(hud["y"] + hud["h"], 720, "hud bottom is 720")


func test_eases() -> void:
	var fx: Dictionary = GoldenUtil.fixture("tokens")
	var eases: Dictionary = fx["eases"]
	eq(eases.size(), UiTokens.EASE_NAMES.size(), "one fixture entry per curve")
	for curve in UiTokens.EASE_NAMES:
		var samples: Array = eases[curve]
		eq(samples.size(), 9, curve + " sample count")
		for pair in samples:
			near(UiTokens.ease_named(curve, pair[0]), pair[1], 1e-9, "%s(%s)" % [curve, str(pair[0])])


func test_lerp_clamp() -> void:
	var fx: Dictionary = GoldenUtil.fixture("tokens")
	for c in fx["lerp"]:
		near(UiTokens.lerp_to(c[0], c[1], c[2]), c[3], 1e-9, "lerp_to(%s, %s, %s)" % [c[0], c[1], c[2]])
	for c in fx["clamp01"]:
		near(UiTokens.clamp01(c[0]), c[1], 1e-9, "clamp01(%s)" % str(c[0]))


func test_font_path() -> void:
	eq(UiTokens.font_path("h1"), UiTokens.FONT_TITLE, "h1 uses the title font")
	eq(UiTokens.font_path("body"), UiTokens.FONT_BODY, "body uses the body font")
	eq(UiTokens.font_path("zzz"), "", "unknown role")


func test_ascii_source() -> void:
	var bytes: PackedByteArray = FileAccess.get_file_as_bytes("res://ui/tokens.gd")
	ok(bytes.size() > 0, "tokens.gd is readable")
	var high := 0
	for b in bytes:
		if b >= 128:
			high += 1
	eq(high, 0, "bytes >= 128 in tokens.gd")
