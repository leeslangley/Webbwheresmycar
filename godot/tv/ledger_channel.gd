class_name LedgerChannel
extends ChannelBase

# The LEDGER channel (port of the ledger tab of src/ui/scenes/ledger.js): the books on the left, the four
# Gold Number Plates on the right and the small SALES chart under the plates. Display only.

var Chart: UiSalesChart


func _init() -> void:
	super()
	title = "LEDGER"


func _ready() -> void:
	if Chart != null:
		return
	Chart = UiSalesChart.new()
	Chart.position = Vector2(336, 256)
	Chart.size = Vector2(296, 112)
	add_child(Chart)


func refresh() -> void:
	if game == null:
		return
	if UiCashHistory.count() < 2:
		UiCashHistory.record(int(state().get("day", 1)), float(state().get("cash", 0)))
	if Chart != null:
		Chart.set_values(UiCashHistory.values(14))
	queue_redraw()


func _paint() -> void:
	if state().is_empty():
		return
	var st: Dictionary = state()
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
