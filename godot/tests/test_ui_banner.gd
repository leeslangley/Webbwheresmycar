extends "res://tests/harness.gd"


func test_tail() -> void:
	eq(UiBanner.tail_bx(100.0, 1232.0), 84, "tail at 100")
	eq(UiBanner.tail_bx(-500.0, 1232.0), 16, "tail far left clamps to 4 G")
	eq(UiBanner.tail_bx(5000.0, 1232.0), 1204, "tail far right clamps to w - 7 G")


func test_say_reveal() -> void:
	var b := UiBanner.new()
	var finished_n := [0]
	var revealed: Array = []
	b.finished.connect(func() -> void: finished_n[0] += 1)
	b.char_revealed.connect(func(c: int) -> void: revealed.append(c))
	b.say("hello world")
	eq(b.full_text, "HELLO WORLD", "upper-cased text")
	eq(b.lines, ["HELLO WORLD"], "one line")
	eq(b.total_chars(), 11, "total chars")
	eq(b.visible_chars(), 0, "nothing shown yet")
	ok(not b.is_done(), "typing, not done")
	b.advance(0.125)
	eq(b.visible_chars(), 5, "5 chars after 0.125 s")
	ok(revealed.size() > 0 and revealed[0] == 5, "first char_revealed value is 5")
	b.advance(10.0)
	eq(b.visible_chars(), 11, "all chars shown")
	ok(b.is_done(), "done")
	eq(finished_n[0], 1, "finished emitted once")
	b.advance(1.0)
	eq(finished_n[0], 1, "finished stays at 1")
	b.free()


func test_skip() -> void:
	var b := UiBanner.new()
	var finished_n := [0]
	b.finished.connect(func() -> void: finished_n[0] += 1)
	b.say("abc")
	b.skip()
	ok(b.is_done(), "done after skip")
	eq(b.visible_chars(), 3, "all chars shown after skip")
	eq(finished_n[0], 1, "finished once after skip")
	b.skip()
	eq(finished_n[0], 1, "second skip leaves finished at 1")
	b.free()


func test_wrap_three_lines() -> void:
	var b := UiBanner.new()
	b.size = Vector2(200, 112)
	eq(b.max_chars(), 14, "max chars for 200 px")
	b.say("one two three four five six seven eight nine ten")
	eq(b.lines, ["ONE TWO THREE", "FOUR FIVE SIX", "SEVEN EIGHT..."], "three lines, last one with dots")
	b.free()


func test_empty() -> void:
	var b := UiBanner.new()
	b.say("")
	ok(b.is_done(), "empty text is done at once")
	eq(b.total_chars(), 0, "no chars")
	b.free()


# The banner is transient: hidden with nothing to say, fades in on say(), holds HOLD s after typing ends,
# then fades out. It never takes input.
func test_fade_in_hold_out() -> void:
	var b := UiBanner.new()
	eq(b.fade_alpha(), 0.0, "hidden at start")
	eq(b.modulate.a, 0.0, "modulate alpha 0 at start")
	eq(b.mouse_filter, Control.MOUSE_FILTER_IGNORE, "banner never takes taps")
	ok(not b.wants_show(), "nothing to say, nothing to show")
	b.advance(0.5)
	eq(b.fade_alpha(), 0.0, "stays hidden without text")
	b.say("abcd")
	ok(b.wants_show(), "wants to show once it has text")
	b.advance(UiBanner.FADE_IN * 0.5)
	near(b.fade_alpha(), 0.5, 1e-6, "half faded in")
	b.advance(UiBanner.FADE_IN)
	eq(b.fade_alpha(), 1.0, "fully shown")
	eq(b.modulate.a, 1.0, "modulate follows the fade")
	ok(b.is_done(), "typing finished (4 chars at 40 cps)")
	b.advance(UiBanner.HOLD - 0.1)
	eq(b.fade_alpha(), 1.0, "still shown inside the hold")
	b.advance(0.2)
	ok(not b.wants_show(), "hold is over")
	ok(b.fade_alpha() < 1.0, "fading out after the hold")
	b.advance(UiBanner.FADE_OUT)
	eq(b.fade_alpha(), 0.0, "hidden again")
	b.free()


func test_say_again_reshows() -> void:
	var b := UiBanner.new()
	b.say("first")
	b.skip()
	b.advance(UiBanner.HOLD + UiBanner.FADE_OUT + 1.0)
	eq(b.fade_alpha(), 0.0, "first line has faded out")
	b.say("second")
	b.advance(UiBanner.FADE_IN)
	eq(b.fade_alpha(), 1.0, "a new line fades the banner back in")
	b.clear()
	b.advance(UiBanner.FADE_OUT)
	eq(b.fade_alpha(), 0.0, "clear hides it")
	b.free()
