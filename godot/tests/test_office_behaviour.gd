extends "res://tests/harness.gd"

# GDR02 office behaviour: hotspots, the pop-up menu, the kettle day, the TV hookup, Dave's chatter,
# glow hints and the Mac keys. _ready does not fire under the runner, so each room is built by hand.
# Three ways to build the room: _room (TV present but not set up), _room_with_tv (real TV set up),
# _room_stand_in (a plain Control with no tune/setup, as the spec allows).

const HOT_IDS := [&"garage_door", &"poster", &"calendar", &"phone", &"newspaper", &"kettle"]


func _room(fake: TestFakeGame) -> OfficeRoom:
	var ps := load("res://scenes/office.tscn") as PackedScene
	var room := ps.instantiate() as OfficeRoom
	room.game = fake
	tree().root.add_child(room)
	room._ready()
	return room


func _room_with_tv(fake: TestFakeGame) -> OfficeRoom:
	var room := _room(fake)
	var tv = room.get_node("Props/Tv")
	tv.call("_ready")
	room._setup_tv()
	return room


func _room_stand_in(fake: TestFakeGame) -> OfficeRoom:
	var room := _room(fake)
	var props := room.layer("Props")
	var real = props.get_node("Tv")
	props.remove_child(real)
	real.free()
	var stub := Control.new()
	stub.name = "Tv"
	props.add_child(stub)
	room._setup_tv()
	return room


func _drop(room: OfficeRoom) -> void:
	tree().root.remove_child(room)
	room.free()


# Collects the room's signals: requests as [id, params], toast texts, chatter lines, news_closed count.
func _collect(room: OfficeRoom) -> Dictionary:
	var got := {"reqs": [], "toasts": [], "chatter": [], "news": []}
	room.request_scene.connect(func(i, p): got.reqs.append([i, p]))
	room.toast.connect(func(t): got.toasts.append(t))
	room.chatter.connect(func(t): got.chatter.append(t))
	room.news_closed.connect(func(): got.news.append(true))
	return got


func _row(i: int) -> Vector2:
	return Vector2(20, 8 + 64 * i + 10)


func test_hotspots_exist_and_fit() -> void:
	var room := _room(TestFakeGame.new())
	var tableau := Rect2(0, 120, 1280, 470)
	var rects: Array[Rect2] = []
	for id in HOT_IDS:
		ok(room.hotspots.has(id), "hotspot " + str(id) + " exists")
		var hs := room.hotspots.get(id) as Control
		if hs == null:
			continue
		ok(hs.size.x >= 64.0 and hs.size.y >= 64.0, str(id) + " is at least 64x64")
		var r := hs.get_rect()
		var inside := r.position.x >= tableau.position.x and r.position.y >= tableau.position.y \
			and r.end.x <= tableau.end.x and r.end.y <= tableau.end.y
		ok(inside, str(id) + " lies inside the tableau y 120..590")
		rects.append(r)
	for i in range(rects.size()):
		for j in range(i + 1, rects.size()):
			ok(not rects[i].intersects(rects[j]), "hotspots %d and %d do not overlap" % [i, j])
	ok(not room.hotspots.has(&"tv"), "the TV has no hotspot of its own")
	_drop(room)


func test_menu_geometry() -> void:
	var room := _room(TestFakeGame.new())
	ok(room.menu is UiMenu, "menu is a UiMenu")
	ok(room.menu.visible, "menu is open at the start")
	eq(room.menu.position, OfficeRoom.R_MENU.position, "menu position")
	eq(room.menu.size, Vector2(280, 272), "menu size")
	eq(room.menu.items, ["GARAGE", "AUCTION", "NEXT DAY", "SETTINGS"], "menu captions")
	_drop(room)


func test_garage_door_tap() -> void:
	var room := _room(TestFakeGame.new())
	var got := _collect(room)
	TapUtil.tap(room.hotspots[&"garage_door"])
	ok(got.reqs.size() == 1 and got.reqs[0] == [&"garage", {}], "garage door requests the garage")
	_drop(room)


func test_kettle_waits_a_day() -> void:
	var fake := TestFakeGame.new()
	var room := _room(fake)
	var got := _collect(room)
	TapUtil.tap(room.hotspots[&"kettle"])
	eq(fake.acts.back(), {"action": "wait_day", "params": {}}, "kettle acts wait_day")
	eq(got.reqs.size(), 0, "kettle makes no request")
	fake.next_result = {"ok": false, "msg": "Nope"}
	TapUtil.tap(room.hotspots[&"kettle"])
	eq(fake.toasts, ["Nope"], "the Game toasts a refused day")
	eq(got.toasts.size(), 0, "the room emits no toast of its own for a refusal")
	_drop(room)


func test_poster_and_auction_day() -> void:
	var fake := TestFakeGame.new()
	var room := _room(fake)
	var got := _collect(room)
	TapUtil.tap(room.hotspots[&"poster"])
	eq(got.toasts, ["Auction day is the 24th of every month"], "poster off auction day toasts")
	eq(got.reqs.size(), 0, "poster off auction day requests nothing")
	ok(not room.hotspots[&"poster"].glow, "poster does not glow on day 12")
	fake.state["day"] = 24
	room.refresh()
	ok(room.hotspots[&"poster"].glow, "poster glows on day 24")
	TapUtil.tap(room.hotspots[&"poster"])
	ok(got.reqs.size() == 1 and got.reqs[0] == [&"auction", {}], "poster on day 24 requests the auction")
	_drop(room)


func test_calendar_toast() -> void:
	var room := _room(TestFakeGame.new())
	var got := _collect(room)
	TapUtil.tap(room.hotspots[&"calendar"])
	eq(got.toasts, ["12 January - 353 days left"], "calendar on day 12")
	_drop(room)


func test_menu_rows() -> void:
	var fake := TestFakeGame.new()
	var room := _room(fake)
	var got := _collect(room)
	TapUtil.tap(room.menu, _row(3))
	ok(got.reqs.size() == 1 and got.reqs[0] == [&"settings", {"overlay": true}], "row 3 opens settings as an overlay")
	ok(room.menu.visible, "menu is open again after a choice")
	TapUtil.tap(room.menu, _row(0))
	ok(got.reqs.size() == 2 and got.reqs[1] == [&"garage", {}], "row 0 requests the garage")
	ok(room.menu.visible, "menu is open again after row 0")
	TapUtil.tap(room.menu, _row(2))
	eq(fake.acts.back(), {"action": "wait_day", "params": {}}, "row 2 waits a day")
	ok(room.menu.visible, "menu is open again after row 2")
	TapUtil.tap(room.menu, _row(1))
	eq(got.toasts, ["Auction day is the 24th of every month"], "row 1 off auction day toasts")
	ok(room.menu.visible, "menu is open again after row 1")
	_drop(room)


func test_phone_glow() -> void:
	var fake := TestFakeGame.new()
	var room := _room(fake)
	ok(room.hotspots[&"phone"].glow, "phone glows with two requests")
	fake.state["requests"] = []
	room.refresh()
	ok(not room.hotspots[&"phone"].glow, "phone stops glowing with no requests")
	_drop(room)


func test_keys() -> void:
	var fake := TestFakeGame.new()
	var room := _room(fake)
	var got := _collect(room)
	ok(room.handle_key(KEY_G), "G is handled")
	ok(got.reqs.size() == 1 and got.reqs[0] == [&"garage", {}], "G requests the garage")
	ok(room.handle_key(KEY_K), "K is handled")
	eq(fake.acts.back(), {"action": "wait_day", "params": {}}, "K waits a day")
	ok(not room.handle_key(KEY_A), "A is not handled off auction day")
	ok(not room.handle_key(KEY_Q), "Q is not handled")
	_drop(room)


func test_chatter_once_per_day() -> void:
	var fake := TestFakeGame.new()
	var room := _room(fake)
	var got := _collect(room)
	room.enter({})
	eq(got.chatter.size(), 1, "one chatter line on enter")
	ok(str(got.chatter[0]) != "", "the chatter line is not empty")
	room.say_today()
	eq(got.chatter.size(), 1, "no second line on the same day")
	fake.state["day"] = 13
	fake.day_advanced.emit()
	eq(got.chatter.size(), 2, "one more line when the day advances")
	_drop(room)


func test_mark_mood() -> void:
	var fake := TestFakeGame.new()
	var room := _room(fake)
	var mark := room.get_node("Characters/Placeholder/Mark")
	eq(mark.get_meta("mood"), "normal", "Mark is normal at cash 12345")
	fake.state["cash"] = 40000
	room.refresh()
	eq(mark.get_meta("mood"), "happy", "Mark is happy at cash 40000")
	fake.state["cash"] = 100
	fake.changed.emit()
	eq(mark.get_meta("mood"), "worried", "a changed signal refreshes Mark's mood")
	_drop(room)


func test_disconnects_on_exit() -> void:
	var fake := TestFakeGame.new()
	var room := _room(fake)
	eq(fake.day_advanced.get_connections().size(), 1, "connected to day_advanced")
	eq(fake.changed.get_connections().size(), 1, "connected to changed")
	_drop(room)
	eq(fake.day_advanced.get_connections().size(), 0, "day_advanced disconnected on exit")
	eq(fake.changed.get_connections().size(), 0, "changed disconnected on exit")


func test_real_tv_news() -> void:
	var fake := TestFakeGame.new()
	var room := _room_with_tv(fake)
	var got := _collect(room)
	var tv = room.get_node("Props/Tv")
	ok(tv is Tv, "Props/Tv is the real TV")
	room.show_news()
	eq(tv.channels.current_id(), "news", "show_news tunes NEWS")
	eq(got.news.size(), 0, "news_closed waits for the TV to close")
	tv.closed.emit()
	eq(got.news.size(), 1, "news_closed fires when the TV closes")
	tv.closed.emit()
	eq(got.news.size(), 1, "news_closed fires only once")
	_drop(room)


func test_real_tv_channels_from_widgets() -> void:
	# The real BOOKINGS scene needs its _ready (not fired under the runner), so BOOKINGS is registered
	# as a placeholder here; the bookings tests cover the real scene. Each tune uses a fresh room, since a
	# second tune starts the static transition, which needs frames to finish.
	var room := _room_with_tv(TestFakeGame.new())
	var tv = room.get_node("Props/Tv")
	tv.channels.register("bookings", "BOOKINGS", "res://tv/no_such_channel.tscn")
	TapUtil.tap(room.hotspots[&"phone"])
	eq(tv.channels.current_id(), "bookings", "phone tunes BOOKINGS")
	_drop(room)

	room = _room_with_tv(TestFakeGame.new())
	tv = room.get_node("Props/Tv")
	TapUtil.tap(room.hotspots[&"newspaper"])
	eq(tv.channels.current_id(), "news", "newspaper tunes NEWS")
	_drop(room)

	room = _room_with_tv(TestFakeGame.new())
	tv = room.get_node("Props/Tv")
	tv.channels.register("bookings", "BOOKINGS", "res://tv/no_such_channel.tscn")
	ok(room.handle_key(KEY_P), "P is handled")
	eq(tv.channels.current_id(), "bookings", "P tunes BOOKINGS")
	_drop(room)


func test_stand_in_tv_news() -> void:
	var room := _room_stand_in(TestFakeGame.new())
	var got := _collect(room)
	room.show_news()
	eq(got.toasts, ["The telly is not plugged in yet"], "stand-in TV: one toast")
	eq(got.news.size(), 1, "stand-in TV: news_closed once at once")
	_drop(room)
