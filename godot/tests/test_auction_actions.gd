extends "res://tests/harness.gd"

# AuctionRoom actions (GDR28): BID +1 and BID +3, the four reveal rows and LEAVE & SETTLE. Every
# action goes through Game.act (a TestFakeGame here). The room gets the fake before _ready, and tests
# run outside the scene tree, so _ready is called by hand. Taps go through TapUtil.

const SCENE := "res://scenes/auction.tscn"
const REVEAL_STATS := ["desirability", "maintenance", "reliability", "condition"]


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
	room.enter({})
	return room


func _done(room: AuctionRoom) -> void:
	room.free()


func _collect(room: AuctionRoom) -> Dictionary:
	var got := {"toasts": [], "requests": []}
	room.toast.connect(func(t: String) -> void: got["toasts"].append(t))
	room.request_scene.connect(func(id: StringName, params: Dictionary) -> void: got["requests"].append([id, params]))
	return got


func _btn(room: AuctionRoom, id: StringName) -> UiButton:
	return room.hotspots[id] as UiButton


func _reveal(room: AuctionRoom, i: int) -> RoomHotspot:
	return room.hotspots[StringName("reveal%d" % i)] as RoomHotspot


func test_bid_labels() -> void:
	var fake := _fake_on_auction_day()
	var room := _room(fake)
	var lot: Dictionary = room.current_lot()
	var bid1 := _btn(room, &"bid1")
	var bid3 := _btn(room, &"bid3")
	eq(bid1.text, "BID +1 " + CoreFormat.money(float(SimAuction.min_bid(lot))), "BID +1 shows the minimum bid")
	eq(bid3.text, "BID +3 " + CoreFormat.money(float(SimAuction.min_bid(lot) + 2 * SimAuction.bid_step(lot))), "BID +3 shows three steps up")
	ok(bid1.visible and bid1.enabled, "BID +1 is visible and enabled with a lot")
	ok(bid3.visible and bid3.enabled, "BID +3 is visible and enabled with a lot")
	ok(_btn(room, &"leave").visible, "LEAVE & SETTLE is visible")
	_done(room)


func test_bid_one_and_three_steps() -> void:
	var fake := _fake_on_auction_day()
	var room := _room(fake)
	var lot_id: String = room.current_lot()["lotId"]
	TapUtil.tap(_btn(room, &"bid1"))
	eq(fake.acts.back(), {"action": "place_bid", "params": {"lotId": lot_id, "steps": 1}}, "BID +1 places a one-step bid")
	TapUtil.tap(_btn(room, &"bid3"))
	eq(fake.acts.back(), {"action": "place_bid", "params": {"lotId": lot_id, "steps": 3}}, "BID +3 places a three-step bid")
	_done(room)


func test_bid_success_toasts_its_message() -> void:
	var fake := _fake_on_auction_day()
	var room := _room(fake)
	var got := _collect(room)
	fake.next_result = {"ok": true, "msg": "You lead."}
	TapUtil.tap(_btn(room, &"bid1"))
	eq(got["toasts"], ["You lead."], "a successful bid toasts its message")
	_done(room)


func test_bid_refusal_is_toasted_once_by_the_game() -> void:
	var fake := _fake_on_auction_day()
	var room := _room(fake)
	var got := _collect(room)
	fake.next_result = {"ok": false, "msg": "Too low"}
	TapUtil.tap(_btn(room, &"bid1"))
	eq(got["toasts"], [], "the room does not toast a refusal")
	eq(fake.toasts, ["Too low"], "the Game toasts the refusal once")
	_done(room)


func test_bid_counts_only_for_the_lot_pressed() -> void:
	var fake := _fake_on_auction_day()
	var room := _room(fake)
	var before: int = fake.acts.size()
	TapUtil.press(_btn(room, &"bid1"))
	room.step(1)
	TapUtil.release(_btn(room, &"bid1"))
	eq(fake.acts.size(), before, "a bid pressed on one lot and released after a step makes no call")
	_done(room)


func test_reveal_rows_pay_for_their_stat() -> void:
	var fake := _fake_on_auction_day()
	var room := _room(fake)
	var lot_id: String = room.current_lot()["lotId"]
	for i in range(4):
		TapUtil.tap(_reveal(room, i))
		eq(fake.acts.back(), {"action": "reveal_stat", "params": {"lotId": lot_id, "stat": REVEAL_STATS[i]}}, "reveal row %d reveals %s" % [i, REVEAL_STATS[i]])
	_done(room)


func test_reveal_success_toasts_its_message() -> void:
	var fake := _fake_on_auction_day()
	var room := _room(fake)
	var got := _collect(room)
	fake.next_result = {"ok": true, "msg": "Stat revealed."}
	TapUtil.tap(_reveal(room, 0))
	eq(got["toasts"], ["Stat revealed."], "a successful reveal toasts its message")
	_done(room)


func test_reveal_refusal_is_toasted_once_by_the_game() -> void:
	var fake := _fake_on_auction_day()
	var room := _room(fake)
	var got := _collect(room)
	fake.next_result = {"ok": false, "msg": "Not enough cash for a peek."}
	TapUtil.tap(_reveal(room, 0))
	eq(got["toasts"], [], "the room does not toast a refused reveal")
	eq(fake.toasts, ["Not enough cash for a peek."], "the Game toasts the refused reveal once")
	_done(room)


func test_revealed_row_is_disabled() -> void:
	var fake := _fake_on_auction_day()
	var room := _room(fake)
	var lot: Dictionary = room.current_lot()
	lot["revealed"]["desirability"] = true
	room.refresh()
	eq(_reveal(room, 0).enabled, false, "a revealed row is disabled")
	eq(_reveal(room, 1).enabled, true, "hidden rows stay enabled")
	var before: int = fake.acts.size()
	TapUtil.tap(_reveal(room, 0))
	eq(fake.acts.size(), before, "a tap on a disabled reveal row makes no call")
	_done(room)


func test_leave_settles_and_goes_to_office() -> void:
	var fake := _fake_on_auction_day()
	var room := _room(fake)
	var got := _collect(room)
	TapUtil.tap(_btn(room, &"leave"))
	eq(fake.acts.back(), {"action": "attend_auction", "params": {}}, "LEAVE & SETTLE attends the auction")
	eq(got["requests"], [[&"office", {}]], "a settled day takes the player to the office")
	_done(room)


func test_leave_refused_stays_in_the_hall() -> void:
	var fake := _fake_on_auction_day()
	var room := _room(fake)
	var got := _collect(room)
	fake.next_result = {"ok": false, "msg": "Already been"}
	TapUtil.tap(_btn(room, &"leave"))
	eq(got["requests"], [], "a refused settle does not leave the hall")
	eq(fake.toasts, ["Already been"], "the Game toasts the refused settle")
	_done(room)


func test_no_lots() -> void:
	var fake := _fake_on_auction_day()
	fake.state["auction"]["lots"] = []
	var room := _room(fake)
	ok(not _btn(room, &"bid1").visible, "BID +1 is hidden with no lots")
	ok(not _btn(room, &"bid3").visible, "BID +3 is hidden with no lots")
	for i in range(4):
		eq(_reveal(room, i).enabled, false, "reveal row %d is disabled with no lots" % i)
	ok(_btn(room, &"leave").visible, "LEAVE & SETTLE is still shown with no lots")
	var before: int = fake.acts.size()
	TapUtil.tap(_btn(room, &"bid1"))
	eq(fake.acts.size(), before, "no bid can be placed without a lot")
	_done(room)


func test_bare_scene_hides_bid_buttons() -> void:
	var room := (load(SCENE) as PackedScene).instantiate() as AuctionRoom
	room._ready()
	ok(not _btn(room, &"bid1").visible, "BID +1 is hidden with no game")
	ok(not _btn(room, &"bid3").visible, "BID +3 is hidden with no game")
	for i in range(4):
		eq(_reveal(room, i).enabled, false, "reveal row %d is disabled with no game" % i)
	_done(room)
