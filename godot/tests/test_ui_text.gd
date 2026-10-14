extends "res://tests/harness.gd"


func test_wrap_basic() -> void:
	eq(UiText.wrap("ONE TWO THREE FOUR", 9, 3), ["ONE TWO", "THREE", "FOUR"], "greedy wrap")
	eq(UiText.wrap("", 10, 3), [], "empty text")
	eq(UiText.wrap("HELLO", 3, 3), ["HELLO"], "long word keeps its own line")
	eq(UiText.wrap("AAAA BBBB CCCC DDDD", 4, 3), ["AAAA", "BBBB", "C..."], "overflow ellipsis")
	eq(UiText.wrap("AA BB CC", 5, 0), ["AA BB", "CC"], "no line limit")
	eq(UiText.wrap("A B C D", 3, 2), ["A B", "C D"], "exactly two lines, no overflow")


func test_wrap_newline_is_space() -> void:
	eq(UiText.wrap("AA\nBB", 5, 0), ["AA BB"], "newline replaced by a space")


func test_ellipsize() -> void:
	eq(UiText.ellipsize("HELLO WORLD", 8), "HELLO...", "long text")
	eq(UiText.ellipsize("HELLO", 8), "HELLO", "short text unchanged")
	eq(UiText.ellipsize("HELLO", 3), "HEL", "max 3 cuts without dots")
	eq(UiText.ellipsize("HELLO", 5), "HELLO", "exact length unchanged")


func test_pips() -> void:
	eq(UiText.pips(3), "***-------", "three of ten")
	eq(UiText.pips(0), "----------", "zero")
	eq(UiText.pips(12), "**********", "clamped high")
	eq(UiText.pips(-1), "----------", "clamped low")
	eq(UiText.pips(2, 4), "**--", "custom total")


func test_upper_height() -> void:
	eq(UiText.upper("ab"), "AB", "upper")
	eq(UiText.lines_height(3, 30), 90, "line height")
