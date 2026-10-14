extends "res://tests/harness.gd"


func test_kinds_and_durations() -> void:
	ok(TransMath.is_kind("iris"), "iris is a kind")
	ok(not TransMath.is_kind("wipe"), "wipe is not a kind")
	eq(TransMath.duration_ms("fade"), 250, "fade duration")
	eq(TransMath.duration_ms("slide-up"), 350, "slide-up duration")
	eq(TransMath.duration_ms("iris"), 500, "iris duration")
	eq(TransMath.duration_ms("static"), 400, "static duration")
	eq(TransMath.duration_ms("pageturn"), 320, "pageturn duration")
	eq(TransMath.duration_ms("nope"), -1, "unknown kind duration")


func test_progress_and_done() -> void:
	near(TransMath.progress(100, 250, 225), 0.5, 1e-9, "midway progress")
	near(TransMath.progress(100, 250, 50), 0.0, 1e-9, "progress before start clamps to 0")
	near(TransMath.progress(100, 250, 999), 1.0, 1e-9, "progress after end clamps to 1")
	ok(not TransMath.is_done(100, 250, 349), "not done one ms before end")
	ok(TransMath.is_done(100, 250, 350), "done at end")


func test_easing() -> void:
	near(TransMath.ease_in_out_quad(0.0), 0.0, 1e-9, "inOutQuad 0")
	near(TransMath.ease_in_out_quad(0.25), 0.125, 1e-9, "inOutQuad 0.25")
	near(TransMath.ease_in_out_quad(0.5), 0.5, 1e-9, "inOutQuad 0.5")
	near(TransMath.ease_in_out_quad(0.75), 0.875, 1e-9, "inOutQuad 0.75")
	near(TransMath.ease_in_out_quad(1.0), 1.0, 1e-9, "inOutQuad 1")
	near(TransMath.ease_out_cubic(0.0), 0.0, 1e-9, "outCubic 0")
	near(TransMath.ease_out_cubic(0.5), 0.875, 1e-9, "outCubic 0.5")
	near(TransMath.ease_out_cubic(1.0), 1.0, 1e-9, "outCubic 1")
	near(TransMath.fade_alpha(0.25), 0.125, 1e-9, "fade alpha follows inOutQuad")


func test_slide_offsets() -> void:
	var size := Vector2(1280, 720)
	eq(TransMath.slide_offsets("slide-left", 0.5, size), [Vector2(-640, 0), Vector2(640, 0)], "slide-left")
	eq(TransMath.slide_offsets("slide-right", 0.5, size), [Vector2(640, 0), Vector2(-640, 0)], "slide-right")
	eq(TransMath.slide_offsets("slide-up", 0.25, size), [Vector2(0, -180), Vector2(0, 540)], "slide-up")
	eq(TransMath.slide_offsets("slide-down", 0.25, size), [Vector2(0, 180), Vector2(0, -540)], "slide-down")
	eq(TransMath.slide_offsets("fade", 0.5, size), [], "fade has no slide offsets")


func test_iris() -> void:
	var size := Vector2(1280, 720)
	var full: float = 734.3023900274328

	var r0: Dictionary = TransMath.iris(0.0, size)
	near(r0["radius"], full, 1e-6, "iris radius at 0")
	eq(r0["showing"], "from", "iris at 0 shows from")

	var r25: Dictionary = TransMath.iris(0.25, size)
	near(r25["radius"], full / 2.0, 1e-6, "iris radius at 0.25")
	eq(r25["showing"], "from", "iris at 0.25 shows from")

	var r5: Dictionary = TransMath.iris(0.5, size)
	near(r5["radius"], 0.0, 1e-6, "iris radius at 0.5")

	var r75: Dictionary = TransMath.iris(0.75, size)
	near(r75["radius"], full / 2.0, 1e-6, "iris radius at 0.75")
	eq(r75["showing"], "to", "iris at 0.75 shows to")

	var r1: Dictionary = TransMath.iris(1.0, size)
	near(r1["radius"], full, 1e-6, "iris radius at 1")
	eq(r1["showing"], "to", "iris at 1 shows to")


func test_static_coverage() -> void:
	near(TransMath.static_coverage(0.0), 0.0, 1e-9, "coverage at 0")
	near(TransMath.static_coverage(0.25), 0.5, 1e-9, "coverage at 0.25")
	near(TransMath.static_coverage(0.5), 1.0, 1e-9, "coverage at 0.5")
	near(TransMath.static_coverage(1.0), 0.0, 1e-9, "coverage at 1")


func test_static_cells() -> void:
	eq(TransMath.static_cells(4, 3, 0.0, 0), [], "no cells at zero coverage")

	var full: Array = TransMath.static_cells(4, 3, 1.0, 0)
	eq(full.size(), 12, "all 12 cells at full coverage")
	eq(full.slice(0, 4), [Vector3i(0, 0, 2), Vector3i(1, 0, 1), Vector3i(2, 0, 0), Vector3i(3, 0, 3)], "first four full cells")

	eq(TransMath.static_cells(4, 3, 0.5, 0), [
		Vector3i(0, 0, 2), Vector3i(1, 0, 1), Vector3i(2, 0, 0),
		Vector3i(2, 1, 0), Vector3i(1, 2, 1), Vector3i(2, 2, 0), Vector3i(3, 2, 3),
	], "half coverage cells")

	eq(TransMath.static_cells(40, 23, 0.5, 3).size(), 450, "40x23 half coverage frame 3 count")
	eq(TransMath.static_cells(40, 23, 0.5, 3), TransMath.static_cells(40, 23, 0.5, 3), "same inputs give same cells")


func test_page_turn() -> void:
	near(TransMath.page_scale(0.0), 1.0, 1e-9, "page scale at 0")
	near(TransMath.page_scale(0.5), 0.5, 1e-9, "page scale at 0.5")
	near(TransMath.page_scale(1.0), 0.0, 1e-9, "page scale at 1")
	near(TransMath.page_edge_x(0.5, 1280.0), 640.0, 1e-9, "page edge at 0.5")
	near(TransMath.page_shadow_alpha(0.0), 0.3, 1e-9, "shadow at 0")
	near(TransMath.page_shadow_alpha(0.5), 0.15, 1e-9, "shadow at 0.5")
	near(TransMath.page_shadow_alpha(1.0), 0.0, 1e-9, "shadow at 1")
