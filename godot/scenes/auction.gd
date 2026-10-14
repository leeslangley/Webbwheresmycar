class_name AuctionRoom
extends RoomBase

# The auction hall (port of src/ui/scenes/auction.js). Every rect here is a contract for
# the art cards (GDA) and the scene test: the lot's car sits in R_CARVIEW on the plank stage, the four
# stat rows and the YOUR LOTS panel sit on the left, the bid block and the leave button on the right.
# Lot browsing, stat labels, the YOUR LOTS panel, the bid info and BACK are GDR06. Buying and
# revealing are GDR28.

const R_BACK := Rect2(30, 126, 120, 64)
const R_PREV := Rect2(30, 200, 120, 100)
const R_NEXT := Rect2(1130, 200, 120, 100)
const R_STAGE := Rect2(170, 126, 940, 190)
const R_CARVIEW := Rect2(440, 184, 400, 130)
const R_STAT_ROWS := [Rect2(40, 322, 290, 64), Rect2(40, 386, 290, 64), Rect2(40, 450, 290, 64), Rect2(40, 514, 290, 64)]
const R_YOURS := Rect2(350, 322, 300, 256)
const R_INFO := Rect2(680, 322, 560, 80)
const R_BID1 := Rect2(680, 410, 270, 64)
const R_BID3 := Rect2(970, 410, 270, 64)
const R_LEAVE := Rect2(680, 490, 560, 64)
const STAT_LABELS := ["STYLE", "UPKEEP", "GRIT", "CONDITION"]
const YOURS_ROWS := 7
const STAT_BAR_MAX := 10.0
const STAT_BAR_PX := 160.0

var lot_index := 0
var shown_lot_id := ""
var _t := 0.0


func _ready() -> void:
	build_layers()
	strip_color = Color("14102A")
	AuctionArt.build(self)
	_build_controls()
	_connect_game()
	refresh()


func _build_controls() -> void:
	if hotspots.has(&"back"):
		return
	add_button(&"back", R_BACK, "BACK")
	add_button(&"prev", R_PREV, "<\nPREV")
	add_button(&"next", R_NEXT, ">\nNEXT")


func _connect_game() -> void:
	var g = _game()
	if g != null and not g.changed.is_connected(refresh):
		g.changed.connect(refresh)


# The Game (or the test double set on game). Outside the scene tree there is no autoload to find.
func _game() -> Object:
	if game != null or is_inside_tree():
		return get_game()
	return null


func enter(_params: Dictionary = {}) -> void:
	lot_index = 0
	if not _is_auction_day():
		toast.emit("The auction is only on the 24th")
		request_scene.emit(&"office", {})
		return
	refresh()


# The game state, or an empty dictionary when no game is connected.
func state() -> Dictionary:
	var g = _game()
	if g == null or not (g.state is Dictionary):
		return {}
	return g.state


func lots() -> Array:
	var auction: Dictionary = state().get("auction", {})
	return auction.get("lots", [])


func current_lot() -> Dictionary:
	var list := lots()
	if lot_index < 0 or lot_index >= list.size():
		return {}
	return list[lot_index]


func current_view() -> Dictionary:
	var lot := current_lot()
	if lot.is_empty():
		return {}
	var view = SimAuction.lot_view(state(), lot["lotId"])
	if view is Dictionary:
		return view
	return {}


func player_leads() -> bool:
	for lot in lots():
		if lot.get("leader", "") == "player":
			return true
	return false


# Moves the lot index by delta places, wrapping around both ends.
func step(delta: int) -> void:
	var n := lots().size()
	if n == 0:
		return
	lot_index = ((lot_index + delta) % n + n) % n
	refresh()


# A stat value as the player reads it: whole numbers bare, otherwise one decimal place.
static func fmt_stat(v) -> String:
	var f := float(v)
	if is_equal_approx(f, roundf(f)):
		return str(int(roundf(f)))
	return CoreFormat.one_dp(f)


func _is_auction_day() -> bool:
	return CoreClock.is_auction_day(int(state().get("day", 0)))


# Reads the game state and sets every label, stat row, paddle and YOUR LOTS row from it.
# With no game state at all (the bare scene) the art's own defaults stay on screen.
func refresh() -> void:
	if state().is_empty():
		return
	var n := lots().size()
	lot_index = ((lot_index % n) + n) % n if n > 0 else 0
	var view := current_view()
	var lot := current_lot()
	shown_lot_id = str(lot.get("lotId", "")) if not view.is_empty() else ""

	var lot_no := ui().get_node("LotNo") as Label
	var lot_name := ui().get_node("LotName") as Label
	var lot_info := ui().get_node("LotInfo") as Label
	var no_lots := ui().get_node("NoLotsLabel") as Label
	if view.is_empty():
		lot_no.text = ""
		lot_name.text = ""
		lot_info.text = ""
		no_lots.visible = true
	else:
		lot_no.text = "LOT %d/%d" % [lot_index + 1, n]
		lot_name.text = str(view["name"])
		lot_info.text = str(view["year"]) + "   Estimate " + CoreFormat.money(float(view["estLow"])) + " to " + CoreFormat.money(float(view["estHigh"]))
		no_lots.visible = false

	_refresh_stats(view)
	_refresh_bid(view, lot)
	_refresh_yours()

	var chars := placeholder("Characters")
	for i in range(AuctionArt.PADDLE_COUNT):
		var paddle := chars.get_node("Paddle%d" % i) as Node2D
		paddle.visible = not view.is_empty() and view["leader"] == "player"
	_refresh_buttons()


func _refresh_stats(view: Dictionary) -> void:
	var revealed: Dictionary = view.get("revealed", {})
	var values: Dictionary = view.get("values", {})
	for i in range(SimAuction.STATS.size()):
		var stat: String = SimAuction.STATS[i]
		var value_label := ui().get_node("StatValue%d" % i) as Label
		var hint := ui().get_node("StatHint%d" % i) as Label
		var bar := ui().get_node("StatBar%d" % i) as ColorRect
		if revealed.get(stat, false) == true:
			var value = values.get(stat, 0)
			value_label.text = fmt_stat(value)
			hint.visible = false
			bar.size = Vector2(STAT_BAR_PX * clampf(float(value) / STAT_BAR_MAX, 0.0, 1.0), bar.size.y)
		else:
			value_label.text = "???"
			# With no lot on show the hint keeps its art text and stays hidden.
			if not view.is_empty():
				hint.text = "REVEAL " + CoreFormat.money(float(SimAuction.AUCTION_REVEAL_COST))
			hint.visible = not view.is_empty()
			bar.size = Vector2(0.0, bar.size.y)


func _refresh_bid(view: Dictionary, lot: Dictionary) -> void:
	var bid_label := ui().get_node("BidLabel") as Label
	var leader_label := ui().get_node("LeaderLabel") as Label
	var min_label := ui().get_node("MinLabel") as Label
	if view.is_empty():
		bid_label.text = ""
		leader_label.text = ""
		min_label.text = ""
		return
	var current_bid := int(view["currentBid"])
	bid_label.text = "Bid: " + (CoreFormat.money(float(current_bid)) if current_bid > 0 else "none")
	var leader := str(view["leader"])
	leader_label.text = "You" if leader == "player" else ("Rival bidder" if leader == "ai" else "Nobody")
	min_label.text = "Min next " + CoreFormat.money(float(SimAuction.min_bid(lot)))


# YOUR LOTS: one row per consigned car that is still in the stable, in consign order.
func _refresh_yours() -> void:
	var s := state()
	var cars: Array = s.get("cars", [])
	var auction: Dictionary = s.get("auction", {})
	var consigned: Array = auction.get("consigned", [])
	var rows: Array = []
	for entry in consigned:
		for car in cars:
			if car.get("id", "") == entry.get("carId", ""):
				rows.append({"name": Data.car_by_id(str(car.get("modelId", ""))).get("name", ""), "reserve": entry.get("reserve", 0)})
				break
	for j in range(YOURS_ROWS):
		var row_label := ui().get_node("YoursRow%d" % j) as Label
		var res_label := ui().get_node("YoursRes%d" % j) as Label
		if j < rows.size():
			row_label.text = str(rows[j]["name"])
			res_label.text = CoreFormat.money(float(rows[j]["reserve"]))
		else:
			row_label.text = ""
			res_label.text = ""
	(ui().get_node("YoursEmpty") as Label).visible = rows.is_empty()


# Virtual: the bid and leave buttons are set by GDR28.
func _refresh_buttons() -> void:
	pass


func _process(delta: float) -> void:
	_t += delta
	var chars := placeholder("Characters")
	for i in range(AuctionArt.PADDLE_COUNT):
		var paddle := chars.get_node("Paddle%d" % i) as Node2D
		if paddle.visible:
			paddle.rotation = sin(_t * 5.0 + i * 1.7) * 0.5
	var crowd := chars.get_node("Crowd")
	for i in range(crowd.get_child_count()):
		var person := crowd.get_child(i) as Node2D
		person.position = Vector2(person.position.x, round(sin(_t * 2.0 + i) * 3.0))


func _on_hotspot(id: StringName) -> void:
	if id == &"back":
		try_leave()
	elif id == &"prev":
		step(-1)
	elif id == &"next":
		step(1)
	else:
		_on_action(id)


# Virtual: the bid and leave taps are GDR28.
func _on_action(_id: StringName) -> void:
	pass


# BACK leaves the hall, unless the player leads a lot: they must settle the day first.
func try_leave() -> void:
	if player_leads():
		toast.emit("You are winning a lot. Settle first")
	else:
		request_scene.emit(&"office", {})


# Keyboard: Left and Right browse, Escape is BACK. Returns true when the key was taken.
func handle_key(keycode: int) -> bool:
	if keycode == KEY_LEFT:
		step(-1)
		return true
	if keycode == KEY_RIGHT:
		step(1)
		return true
	if keycode == KEY_ESCAPE:
		try_leave()
		return true
	return false
