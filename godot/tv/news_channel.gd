class_name NewsChannel
extends ChannelBase

# NEWS channel (port of src/ui/scenes/news.js, GDU14): the front page of The Daily Sprocket, the month-end
# bills page when there is one, and a BACK ISSUES page. OK and the NEXT button turn the page; BACK returns
# to the front page. The static helpers are pure (they take the state), so the tests need no scene.

const MAX_EVENTS := 5
const EVENT_CHARS := 48
const BACK_SHOWN := 8
const GOLD_TAG := "GOLD NUMBER PLATE"

var page: int = 0
var next_btn: UiButton

var _last_day: int = -1


func _init() -> void:
	super()
	title = "NEWS"


static func page_kinds(st: Dictionary) -> Array[String]:
	var out: Array[String] = ["front", "back"]
	var today: Dictionary = st.get("today", {})
	if today.get("monthReport") != null:
		out = ["front", "month", "back"]
	return out


static func front(st: Dictionary) -> Dictionary:
	var day: int = int(st.get("day", 1))
	var when: String = CoreFormat.date_text(day) if day >= 1 and day <= 365 else "YEAR END"
	var today: Dictionary = st.get("today", {})
	var events: Array = today.get("events", [])
	var shown: Array = []
	for i in range(mini(events.size(), MAX_EVENTS)):
		shown.append(UiText.ellipsize(str(events[i]), EVENT_CHARS))
	if events.size() > MAX_EVENTS:
		shown.append("...and more")
	return {
		"dateline": "DAY %d  -  %s" % [day, when],
		"headline": UiText.wrap(str(today.get("headline", "")).to_upper(), 36, 3),
		"events": shown,
	}


static func month_lines(report: Dictionary) -> Array[String]:
	var out: Array[String] = [
		"Rent " + CoreFormat.money(float(report.get("rent", 0))),
		"Running costs " + CoreFormat.money(float(report.get("running", 0))),
		"Garage lease " + CoreFormat.money(float(report.get("lease", 0))),
		"TOTAL " + CoreFormat.money(float(report.get("total", 0))),
		"Cash now " + CoreFormat.money(float(report.get("cashAfter", 0))),
	]
	var faults: Array = report.get("newFaults", [])
	for i in range(mini(faults.size(), 4)):
		out.append(UiText.ellipsize("Fault: " + str(faults[i]), 40))
	return out


func _ready() -> void:
	if next_btn != null:
		return
	next_btn = UiButton.new()
	next_btn.name = "NextBtn"
	next_btn.text = "NEXT"
	next_btn.position = Vector2(552, 368)
	next_btn.size = Vector2(80, 72)
	next_btn.activated.connect(next_page)
	add_child(next_btn)


func kinds() -> Array[String]:
	return NewsChannel.page_kinds(state())


func kind() -> String:
	var ks: Array[String] = kinds()
	return ks[clampi(page, 0, ks.size() - 1)]


func next_page() -> void:
	page = (page + 1) % kinds().size()
	queue_redraw()


func on_ok() -> void:
	next_page()


func on_back() -> bool:
	if page > 0:
		page = 0
		queue_redraw()
		return true
	return false


func _on_enter() -> void:
	page = 0
	_last_day = _day()


func refresh() -> void:
	var d: int = _day()
	if d != _last_day:
		page = 0
		_last_day = d
	page = mini(page, kinds().size() - 1)
	queue_redraw()


func _day() -> int:
	return int(state().get("day", 1))


func _paint() -> void:
	var ink: Color = UiTheme.color("ink")
	UiTheme.draw_box(self, Rect2(16, 48, 608, 310), UiTheme.color("paper"), ink, 4, true)
	UiTheme.draw_text(self, "THE DAILY SPROCKET", Vector2(0, 58), "h2", ink, 640, HORIZONTAL_ALIGNMENT_CENTER)
	var k: String = kind()
	if k == "front":
		_paint_front()
	elif k == "month":
		_paint_month()
	else:
		_paint_back()
	UiTheme.draw_text(self, "%d/%d" % [page + 1, kinds().size()], Vector2(16, 330), "caption", UiTheme.color("midgrey"), 592, HORIZONTAL_ALIGNMENT_RIGHT)


func _paint_front() -> void:
	var ink: Color = UiTheme.color("ink")
	var f: Dictionary = front(state())
	draw_rect(Rect2(32, 94, 576, 3), ink)
	UiTheme.draw_text(self, str(f["dateline"]), Vector2(0, 100), "caption", UiTheme.color("darkgrey"), 640, HORIZONTAL_ALIGNMENT_CENTER)
	var y: float = 124.0
	for line in f["headline"]:
		UiTheme.draw_text(self, str(line), Vector2(32, y), "h3", ink)
		y += 22.0
	draw_rect(Rect2(32, 192, 576, 2), ink)
	UiTheme.draw_text(self, "TODAY IN WEBB'S WHEELS:", Vector2(32, 198), "h3", ink)
	var ey: float = 220.0
	for e in f["events"]:
		var s: String = str(e)
		var col: Color = UiTheme.color("gold") if s.contains(GOLD_TAG) else ink
		UiTheme.draw_text(self, "* " + s, Vector2(32, ey), "caption", col)
		ey += 20.0


func _paint_month() -> void:
	var ink: Color = UiTheme.color("ink")
	var today: Dictionary = state().get("today", {})
	var report: Dictionary = today.get("monthReport", {})
	UiTheme.draw_text(self, "MONTH END: " + str(report.get("monthName", "")).to_upper(), Vector2(32, 100), "h3", ink)
	var y: float = 132.0
	for line in month_lines(report):
		var col: Color = UiTheme.color("bad") if line.begins_with("Fault:") else ink
		UiTheme.draw_text(self, line, Vector2(32, y), "caption", col)
		y += 28.0


func _paint_back() -> void:
	var ink: Color = UiTheme.color("ink")
	UiTheme.draw_text(self, "BACK ISSUES", Vector2(32, 100), "h3", ink)
	var hs: Array = state().get("headlines", [])
	if hs.is_empty():
		UiTheme.draw_text(self, "No back issues yet.", Vector2(32, 130), "caption", ink)
		return
	var y: float = 130.0
	for i in range(mini(hs.size(), BACK_SHOWN)):
		UiTheme.draw_text(self, UiText.ellipsize(str(hs[i]), 52), Vector2(32, y), "caption", ink)
		y += 26.0
