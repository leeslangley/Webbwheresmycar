class_name LedgerChannel
extends ChannelBase

# The LEDGER channel (port of the ledger tab of src/ui/scenes/ledger.js): the books on the left, the four
# Gold Number Plates on the right and the small SALES chart under the plates. Display only.
# The WORKSHOP tab (GDU24, port of drawWorkshop) shows the garage board: bays in use and BUY SLOT.

const MAX_SLOTS := 8
const SLOT_COST := 3000

var Chart: UiSalesChart
var TabBtn: UiButton
var BuySlotBtn: UiButton
var tab: String = "books"


func _init() -> void:
	super()
	title = "LEDGER"


func _ready() -> void:
	if Chart == null:
		Chart = UiSalesChart.new()
		Chart.position = Vector2(336, 256)
		Chart.size = Vector2(296, 112)
		add_child(Chart)
	if TabBtn != null:
		return
	TabBtn = UiButton.new()
	TabBtn.position = Vector2(8, 376)
	TabBtn.size = Vector2(200, 72)
	TabBtn.text = "WORKSHOP"
	TabBtn.activated.connect(func() -> void: set_tab("workshop" if tab == "books" else "books"))
	add_child(TabBtn)
	BuySlotBtn = UiButton.new()
	BuySlotBtn.kind = "primary"
	BuySlotBtn.position = Vector2(232, 376)
	BuySlotBtn.size = Vector2(400, 72)
	BuySlotBtn.visible = false
	BuySlotBtn.activated.connect(_buy_slot)
	BuySlotBtn.blocked.connect(_buy_slot)
	add_child(BuySlotBtn)
	set_tab(tab)


# The reason a garage slot cannot be bought, or "" when it can (port of the buySlot checks in src/sim/actions.js).
static func slot_refusal(st: Dictionary) -> String:
	if int(st.get("garageSlots", 0)) >= MAX_SLOTS:
		return "Garage is full-size already"
	if float(st.get("cash", 0)) < float(SLOT_COST):
		return "Not enough money"
	return ""


func set_tab(t: String) -> void:
	tab = "workshop" if t == "workshop" else "books"
	if Chart != null:
		Chart.visible = (tab == "books")
	if BuySlotBtn != null:
		BuySlotBtn.visible = (tab == "workshop")
	if TabBtn != null:
		TabBtn.text = "WORKSHOP" if tab == "books" else "BOOKS"
	queue_redraw()


func _on_enter() -> void:
	set_tab("books")


func on_ok() -> void:
	if tab == "workshop":
		_buy_slot()


# true = handled here (the workshop goes back to the books), so the manager does not leave the TV.
func on_back() -> bool:
	if tab == "workshop":
		set_tab("books")
		return true
	return false


func _buy_slot() -> void:
	var why := slot_refusal(state())
	if why != "":
		toast(why)
		return
	var res: Dictionary = game.act("buy_slot")
	if res.get("ok", false) == true:
		toast(str(res.get("msg", "")))


func refresh() -> void:
	if game == null:
		return
	if UiCashHistory.count() < 2:
		UiCashHistory.record(int(state().get("day", 1)), float(state().get("cash", 0)))
	if Chart != null:
		Chart.set_values(UiCashHistory.values(14))
	if BuySlotBtn != null:
		BuySlotBtn.text = "BUY SLOT " + CoreFormat.money(SLOT_COST)
		BuySlotBtn.enabled = slot_refusal(state()) == ""
	queue_redraw()


func _paint() -> void:
	if state().is_empty():
		return
	var st: Dictionary = state()
	if tab == "workshop":
		_paint_workshop(st)
		return
	var models: Dictionary = ChannelBase.models_by_id()
	var paper := UiTheme.color("paper")
	var ink := UiTheme.color("ink")
	var darkgrey := UiTheme.color("darkgrey")
	var gold := UiTheme.color("gold")

	# The books.
	UiTheme.draw_box(self, Rect2(8, 48, 320, 320), paper, ink, 4, false)
	UiTheme.draw_text(self, "THE BOOKS", Vector2(24, 56), "h3", ink)
	var rows: Array[String] = [
		"Cash " + CoreFormat.money(float(st.get("cash", 0))),
		"Net worth " + CoreFormat.money(LedgerMath.net_worth(st, models)),
		"Stable value " + CoreFormat.money(LedgerMath.stable_value(st, models)),
		"Next bills " + CoreFormat.money(LedgerMath.expected_bills(st, models)),
		"Reputation %d/100" % int(st.get("reputation", 0)),
		"Buzz %d" % int(st.get("buzz", 0)),
	]
	for k in range(rows.size()):
		UiTheme.draw_text(self, rows[k], Vector2(24, 84 + k * 26), "caption", ink)
	UiTheme.draw_text(self, "STATS", Vector2(24, 248), "h3", ink)
	var stat_rows: Array[String] = LedgerMath.stat_lines(st)
	for k in range(stat_rows.size()):
		UiTheme.draw_text(self, stat_rows[k], Vector2(24, 272 + k * 22), "caption", darkgrey)

	# The Gold Number Plates.
	UiTheme.draw_box(self, Rect2(336, 48, 296, 204), paper, ink, 4, false)
	UiTheme.draw_text(self, "GOLD NUMBER PLATES", Vector2(348, 52), "caption", UiTheme.color("woodDark"))
	var plates: Dictionary = st.get("plates", {})
	for k in range(LedgerMath.PLATE_KEYS.size()):
		var key: String = LedgerMath.PLATE_KEYS[k]
		var y: int = 78 + k * 42
		var won: bool = plates.get(key, false) == true
		UiTheme.draw_text(self, LedgerMath.PLATE_NAMES[key], Vector2(348, y), "caption", gold if won else ink)
		if won:
			UiTheme.draw_text(self, "WON", Vector2(348, y), "caption", gold, 272, HORIZONTAL_ALIGNMENT_RIGHT)
		var progress: String = UiText.ellipsize(LedgerMath.plate_progress(st, key, models), 27)
		UiTheme.draw_text(self, progress, Vector2(348, y + 20), "caption", darkgrey)


# The workshop tab: the garage board, one bay per garage slot (filled when a car is in it), and the bays in use.
func _paint_workshop(st: Dictionary) -> void:
	var paper := UiTheme.color("paper")
	var ink := UiTheme.color("ink")
	var darkgrey := UiTheme.color("darkgrey")
	var cream := UiTheme.color("cream")
	var good := UiTheme.color("good")
	var white := UiTheme.color("white")
	var slots: int = int(st.get("garageSlots", 0))
	var in_use: int = (st.get("cars", []) as Array).size()

	UiTheme.draw_box(self, Rect2(8, 48, 624, 316), paper, ink, 4, false)
	UiTheme.draw_text(self, "WORKSHOP BOARD", Vector2(24, 58), "h3", ink)
	UiTheme.draw_text(self, "Garage slots %d/%d" % [slots, MAX_SLOTS], Vector2(24, 58), "caption", ink, 600, HORIZONTAL_ALIGNMENT_RIGHT)
	UiTheme.draw_text(self, "Garage bays", Vector2(24, 120), "caption", darkgrey)
	var num_px: int = UiTheme.size_for("h3")
	for i in range(slots):
		var bx: float = 24.0 + float(i * 74)
		var filled: bool = i < in_use
		UiTheme.draw_box(self, Rect2(bx, 150, 68, 80), good if filled else cream, ink, 4, false)
		var ny: float = 150.0 + (80.0 - float(num_px)) * 0.5
		UiTheme.draw_text(self, str(i + 1), Vector2(bx, ny), "h3", white if filled else darkgrey, 68, HORIZONTAL_ALIGNMENT_CENTER)
	UiTheme.draw_text(self, "%d of %d bays in use" % [in_use, slots], Vector2(24, 250), "caption", ink)
