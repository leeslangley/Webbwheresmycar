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
