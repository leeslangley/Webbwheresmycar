extends "res://tests/harness.gd"

# Tests for the NEWS channel (tv/news_channel.gd, GDU14). The pure helpers run on the sample state. The scene
# tests add the channel to the tree and call _ready() by hand, because _ready does not fire under the runner.


func _mb(pos: Vector2, down: bool) -> InputEventMouseButton:
	var ev := InputEventMouseButton.new()
	ev.button_index = MOUSE_BUTTON_LEFT
	ev.pressed = down
	ev.position = pos
	return ev


func _report() -> Dictionary:
	return {
		"monthName": "January",
		"rent": 240,
		"running": 300,
		"lease": 400,
		"total": 940,
		"cashAfter": 5000,
		"newFaults": ["Flat tyre"],
	}


func _news(g: TestFakeGame) -> NewsChannel:
	var n := (load("res://tv/news_channel.tscn") as PackedScene).instantiate() as NewsChannel
	tree().root.add_child(n)
	n._ready()
	n.enter(g)
	return n


func _done(n: NewsChannel) -> void:
	n.leave()
	n.free()


func test_page_kinds() -> void:
	var st := TestFakeGame.sample_state()
	eq(NewsChannel.page_kinds(st), ["front", "back"], "no month report: front and back")
	st.today.monthReport = _report()
	eq(NewsChannel.page_kinds(st), ["front", "month", "back"], "month report adds the month page")


func test_front() -> void:
	var st := TestFakeGame.sample_state()
	eq(NewsChannel.front(st)["dateline"], "DAY 12  -  12 January", "dateline for day 12")
	eq(NewsChannel.front(st)["headline"], ["LOCAL VICAR BUYS ROUND OF TEA"], "headline in capitals")
	eq(NewsChannel.front(st)["events"], ["Bought nothing. Lovely.", "Dave found a spanner."], "two events")

	var many: Array = []
	for i in range(8):
		many.append("Event number %d" % i)
	st.today.events = many
	var f: Dictionary = NewsChannel.front(st)
	eq(f["events"].size(), 6, "five events plus one more line")
	eq(f["events"][5], "...and more", "last line says and more")

	var long := ""
	for i in range(100):
		long += "x"
	st.today.events = [long]
	var cut: String = NewsChannel.front(st)["events"][0]
	eq(cut.length(), 48, "long event is cut to 48 characters")
	ok(cut.ends_with("..."), "cut event ends in ...")

	st.day = 400
	ok(str(NewsChannel.front(st)["dateline"]).ends_with("YEAR END"), "day 400 is YEAR END")


func test_month_lines() -> void:
	var lines: Array[String] = NewsChannel.month_lines(_report())
	eq(lines, [
		"Rent " + CoreFormat.money(240),
		"Running costs " + CoreFormat.money(300),
		"Garage lease " + CoreFormat.money(400),
		"TOTAL " + CoreFormat.money(940),
		"Cash now " + CoreFormat.money(5000),
		"Fault: Flat tyre",
	], "month report lines")


func test_pages() -> void:
	var g := TestFakeGame.new()
	var n := _news(g)
	eq(n.kind(), "front", "starts on the front page")
	n.on_ok()
	eq(n.kind(), "back", "no month report: OK goes to back issues")
	n.on_ok()
	eq(n.kind(), "front", "OK wraps back to the front")

	g.state.today.monthReport = _report()
	g.changed.emit()
	eq(n.kind(), "front", "month report arrives, still on the front")
	n.on_ok()
	eq(n.kind(), "month", "front then month")
	n.on_ok()
	eq(n.kind(), "back", "month then back")
	n.on_ok()
	eq(n.kind(), "front", "back wraps to the front")

	n.on_ok()
	ok(n.on_back(), "BACK on page 1 is handled")
	eq(n.page, 0, "BACK returns to the front page")
	eq(n.on_back(), false, "BACK on the front page is not handled")
	_done(n)


func test_next_button() -> void:
	var g := TestFakeGame.new()
	var n := _news(g)
	var b: UiButton = n.next_btn
	ok(b != null, "NextBtn exists")
	eq(b.name, "NextBtn", "button is named NextBtn")
	ok(b.size.y >= 72.0, "NEXT is at least 72 px tall")
	var c: Vector2 = b.size / 2.0
	b.handle_event(_mb(c, true))
	b.handle_event(_mb(c, false))
	eq(n.kind(), "back", "tapping NEXT advances the page")
	_done(n)


func test_new_day_resets_page() -> void:
	var g := TestFakeGame.new()
	var n := _news(g)
	n.next_page()
	eq(n.page, 1, "on page 1")
	g.state.day = 13
	g.changed.emit()
	eq(n.page, 0, "a new day returns to the front page")
	_done(n)
