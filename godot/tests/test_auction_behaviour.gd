extends "res://tests/harness.gd"

# AuctionRoom behaviour (GDR06): lot browsing, the lot header, stat rows, the bid block, YOUR LOTS,
# the paddles and BACK. The room gets a TestFakeGame before _ready, and tests run outside the scene
# tree, so _ready is called by hand. Taps go through TapUtil.

const SCENE := "res://scenes/auction.tscn"


func _fake_on_auction_day() -> TestFakeGame:
	var fake := TestFakeGame.new()
	var s: Dictionary = fake.state
	CoreRng.seed_rng(s, 7)
	s["day"] = 24
	SimAuction.prepare_auction(s)
	return fake


func _room(fake: Object) -> AuctionRoom:
	var room := (load(SCENE) as PackedScene).instantiate() as AuctionRoom
	room.game = fake
	room._ready()
	return room


func _done(room: AuctionRoom) -> void:
	room.free()


func _lot(fake: Object, i: int) -> Dictionary:
	return fake.state["auction"]["lots"][i]


func _collect(room: AuctionRoom) -> Dictionary:
	var got := {"toasts": [], "requests": []}
	room.toast.connect(func(t: String) -> void: got["toasts"].append(t))
	room.request_scene.connect(func(id: StringName, params: Dictionary) -> void: got["requests"].append([id, params]))
	return got


func test_enter_shows_first_lot() -> void:
	var fake := _fake_on_auction_day()
	var room := _room(fake)
	room.enter({})
	eq((room.ui().get_node("LotNo") as Label).text, "LOT 1/6", "lot number starts at 1")
	var view := room.current_view()
	eq((room.ui().get_node("LotName") as Label).text, view["name"], "lot name is the view name")
	var info := (room.ui().get_node("LotInfo") as Label).text
	ok(info.contains(str(view["year"])), "lot info carries the year")
	ok(info.contains(CoreFormat.money(float(view["estLow"]))), "lot info carries the low estimate")
	ok(info.contains(CoreFormat.money(float(view["estHigh"]))), "lot info carries the high estimate")
	eq((room.ui().get_node("NoLotsLabel") as Label).visible, false, "no-lots label hidden with lots")
	_done(room)


func test_step_and_wrap() -> void:
	var fake := _fake_on_auction_day()
	var room := _room(fake)
	room.enter({})
	room.step(1)
	eq((room.ui().get_node("LotNo") as Label).text, "LOT 2/6", "step forward")
	room.step(-1)
	room.step(-1)
	eq((room.ui().get_node("LotNo") as Label).text, "LOT 6/6", "step back from lot 1 wraps to lot 6")
	room.step(1)
	eq((room.ui().get_node("LotNo") as Label).text, "LOT 1/6", "step forward from lot 6 wraps to lot 1")
	_done(room)


func test_prev_next_taps() -> void:
	var fake := _fake_on_auction_day()
	var room := _room(fake)
	room.enter({})
	TapUtil.tap(room.hotspots[&"next"])
	eq((room.ui().get_node("LotNo") as Label).text, "LOT 2/6", "NEXT tap steps forward")
	TapUtil.tap(room.hotspots[&"prev"])
	TapUtil.tap(room.hotspots[&"prev"])
	eq((room.ui().get_node("LotNo") as Label).text, "LOT 6/6", "PREV taps wrap to lot 6")
	_done(room)


func test_handle_key() -> void:
	var fake := _fake_on_auction_day()
	var room := _room(fake)
	room.enter({})
	ok(room.handle_key(KEY_RIGHT), "KEY_RIGHT is taken")
	eq((room.ui().get_node("LotNo") as Label).text, "LOT 2/6", "KEY_RIGHT steps forward")
	ok(room.handle_key(KEY_LEFT), "KEY_LEFT is taken")
	eq((room.ui().get_node("LotNo") as Label).text, "LOT 1/6", "KEY_LEFT steps back")
	ok(not room.handle_key(KEY_A), "other keys are not taken")
	var got := _collect(room)
	ok(room.handle_key(KEY_ESCAPE), "KEY_ESCAPE is taken")
	eq(got["requests"], [[&"office", {}]], "ESCAPE leaves for the office")
	_done(room)


func test_fmt_stat() -> void:
	eq(AuctionRoom.fmt_stat(6.0), "6", "whole float bare")
	eq(AuctionRoom.fmt_stat(6.4), "6.4", "fraction one decimal")
	eq(AuctionRoom.fmt_stat(7), "7", "whole int bare")


func test_stat_rows_hidden_then_revealed() -> void:
	var fake := _fake_on_auction_day()
	var room := _room(fake)
	room.enter({})
	var ui := room.ui()
	eq((ui.get_node("StatValue0") as Label).text, "???", "stat starts hidden")
	eq((ui.get_node("StatBar0") as ColorRect).size.x, 0.0, "hidden stat bar has no width")
	eq((ui.get_node("StatHint0") as Label).text, "REVEAL " + CoreFormat.money(float(SimAuction.AUCTION_REVEAL_COST)), "hidden stat offers the reveal price")
	eq((ui.get_node("StatHint0") as Label).visible, true, "hint shown while hidden")

	var lot := _lot(fake, 0)
	SimAuction.reveal_stat(fake.state, lot["lotId"], "desirability")
	room.refresh()
	var view := room.current_view()
	var value = view["values"]["desirability"]
	eq((ui.get_node("StatValue0") as Label).text, AuctionRoom.fmt_stat(value), "revealed stat shows its value")
	eq((ui.get_node("StatHint0") as Label).visible, false, "hint hidden once revealed")
	near((ui.get_node("StatBar0") as ColorRect).size.x, 160.0 * float(value) / 10.0, 1e-3, "revealed bar width is 160 * value / 10")
	eq((ui.get_node("StatValue1") as Label).text, "???", "other stats stay hidden")
	_done(room)


func test_bid_block_states() -> void:
	var fake := _fake_on_auction_day()
	var room := _room(fake)
	room.enter({})
	var ui := room.ui()
	var lot := _lot(fake, 0)
	eq((ui.get_node("BidLabel") as Label).text, "Bid: none", "no bid yet")
	eq((ui.get_node("LeaderLabel") as Label).text, "Nobody", "nobody leads")
	eq((ui.get_node("MinLabel") as Label).text, "Min next " + CoreFormat.money(float(SimAuction.min_bid(lot))), "minimum next bid")
	for i in range(5):
		eq(room.placeholder("Characters").get_node("Paddle%d" % i).visible, false, "paddle %d hidden with no player lead" % i)

	lot["leader"] = "player"
	lot["currentBid"] = 1234
	room.refresh()
	eq((ui.get_node("BidLabel") as Label).text, "Bid: " + CoreFormat.money(1234.0), "bid amount shown")
	eq((ui.get_node("LeaderLabel") as Label).text, "You", "player leads")
	eq(room.placeholder("Characters").get_node("Paddle0").visible, true, "paddle 0 waves while player leads")
	eq(room.placeholder("Characters").get_node("Paddle4").visible, true, "paddle 4 waves while player leads")

	room._process(0.25)
	near(room.placeholder("Characters").get_node("Paddle2").rotation, sin(0.25 * 5.0 + 2 * 1.7) * 0.5, 1e-6, "paddle rocks with time")

	lot["leader"] = "ai"
	room.refresh()
	eq((ui.get_node("LeaderLabel") as Label).text, "Rival bidder", "AI leads")
	eq(room.placeholder("Characters").get_node("Paddle0").visible, false, "paddles hidden when AI leads")
	_done(room)


func test_back_refuses_while_player_leads() -> void:
	var fake := _fake_on_auction_day()
	var room := _room(fake)
	room.enter({})
	var got := _collect(room)
	var lot := _lot(fake, 0)
	lot["leader"] = "player"
	room.refresh()
	TapUtil.tap(room.hotspots[&"back"])
	eq(got["toasts"], ["You are winning a lot. Settle first"], "BACK toasts while player leads")
	eq(got["requests"], [], "BACK does not leave while player leads")

	lot["leader"] = "house"
	room.refresh()
	TapUtil.tap(room.hotspots[&"back"])
	eq(got["requests"], [[&"office", {}]], "BACK leaves to the office once nothing is led")
	_done(room)


func test_your_lots_panel() -> void:
	var fake := _fake_on_auction_day()
	var room := _room(fake)
	room.enter({})
	var ui := room.ui()
	eq((ui.get_node("YoursEmpty") as Label).visible, true, "nothing consigned at first")
	fake.state["auction"]["consigned"].append({"carId": "c1", "reserve": 2500})
	room.refresh()
	eq((ui.get_node("YoursRow0") as Label).text, "Austen Allergy", "consigned car name")
	eq((ui.get_node("YoursRes0") as Label).text, CoreFormat.money(2500.0), "consigned reserve")
	eq((ui.get_node("YoursEmpty") as Label).visible, false, "empty label hidden with a consigned car")
	eq((ui.get_node("YoursRow1") as Label).text, "", "unused row stays empty")

	fake.state["auction"]["consigned"].clear()
	room.refresh()
	eq((ui.get_node("YoursEmpty") as Label).visible, true, "empty label back once unconsigned")
	eq((ui.get_node("YoursRow0") as Label).text, "", "row cleared")
	_done(room)


func test_no_lots() -> void:
	var fake := _fake_on_auction_day()
	fake.state["auction"]["lots"] = []
	var room := _room(fake)
	room.enter({})
	var ui := room.ui()
	eq((ui.get_node("NoLotsLabel") as Label).visible, true, "no-lots label shown")
	eq((ui.get_node("LotName") as Label).text, "", "no lot name")
	eq((ui.get_node("LotNo") as Label).text, "", "no lot number")
	eq((ui.get_node("StatValue0") as Label).text, "???", "stats read hidden with no lots")
	eq((ui.get_node("StatHint0") as Label).visible, false, "no reveal hint with no lots")
	room.step(1)
	eq((ui.get_node("LotNo") as Label).text, "", "stepping with no lots does nothing")
	_done(room)


func test_enter_off_auction_day() -> void:
	var fake := _fake_on_auction_day()
	fake.state["day"] = 12
	var room := _room(fake)
	var got := _collect(room)
	room.enter({})
	eq(got["toasts"], ["The auction is only on the 24th"], "off-day toast")
	eq(got["requests"], [[&"office", {}]], "off-day returns to the office")
	_done(room)
