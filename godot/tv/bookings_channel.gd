class_name BookingsChannel
extends ChannelBase

# The BOOKINGS channel, display half (port of src/ui/scenes/bookings.js): the hire diary. A scrolling list of
# customer requests, a detail panel (fee and needs, OK or NO for the chosen car) and a strip of the player's own
# cars, three per page, greyed out with the reason when a car cannot take the job. ACCEPT JOB (GDU25) explains
# every refusal with a toast, then runs the job and shows its result on a panel that OK or BACK dismisses.

const PER_PAGE := 3

var sel_req: String = ""
var sel_car: String = ""
var car_page: int = 0
# Empty = no result showing. Otherwise {"text", "type", "paid"} from the last accepted job.
var result: Dictionary = {}

var Requests: UiList
var PrevBtn: UiButton
var NextBtn: UiButton
var Car0: UiButton
var Car1: UiButton
var Car2: UiButton
var AcceptBtn: UiButton
var OkBtn: UiButton
var _slots: Array[UiButton] = []


func _init() -> void:
	super()
	title = "BOOKINGS"


func _ready() -> void:
	Requests = UiList.new()
	Requests.position = Vector2(8, 48)
	Requests.size = Vector2(300, 248)
	Requests.row_h = 72
	Requests.row_painter = Callable(self, "_paint_req_row")
	Requests.row_tapped.connect(_on_req)
	add_child(Requests)

	PrevBtn = _make_btn("<", Rect2(8, 300, 72, 72), "button", "normal")
	NextBtn = _make_btn(">", Rect2(560, 300, 72, 72), "button", "normal")
	PrevBtn.activated.connect(page_cars.bind(-1))
	NextBtn.activated.connect(page_cars.bind(1))

	Car0 = _make_btn("", Rect2(88, 300, 150, 72), "caption", "card")
	Car1 = _make_btn("", Rect2(244, 300, 150, 72), "caption", "card")
	Car2 = _make_btn("", Rect2(400, 300, 150, 72), "caption", "card")
	_slots = [Car0, Car1, Car2]
	for s in range(PER_PAGE):
		_slots[s].activated.connect(_on_car.bind(s))
		_slots[s].blocked.connect(_on_car.bind(s))

	AcceptBtn = _make_btn("ACCEPT JOB", Rect2(8, 376, 624, 72), "button", "primary")
	AcceptBtn.activated.connect(_accept)
	AcceptBtn.blocked.connect(_accept)
	OkBtn = _make_btn("OK", Rect2(8, 376, 624, 72), "button", "primary")
	OkBtn.visible = false
	OkBtn.activated.connect(dismiss)


func _make_btn(label_text: String, r: Rect2, role: String, kind: String) -> UiButton:
	var b := UiButton.new()
	b.text = label_text
	b.role = role
	b.kind = kind
	b.position = r.position
	b.size = r.size
	add_child(b)
	return b


func requests() -> Array:
	return state().get("requests", [])


func cars() -> Array:
	return BookingsMath.owned_cars(state(), ChannelBase.models_by_id())


func req_by_id(id: String) -> Dictionary:
	for q in requests():
		if str(q.id) == id:
			return q
	return {}


func car_by_id(id: String) -> Dictionary:
	for c in state().get("cars", []):
		if str(c.id) == id:
			return c
	return {}


func _id_in(list: Array, id: String) -> bool:
	for item in list:
		if str(item.id) == id:
			return true
	return false


func _on_req(i: int) -> void:
	sel_req = str(requests()[i].id)
	refresh()


func page_cars(d: int) -> void:
	var pages := maxi(1, int(ceil(cars().size() / float(PER_PAGE))))
	car_page = clampi(car_page + d, 0, pages - 1)
	refresh()


func _on_car(slot: int) -> void:
	var list := cars()
	var idx := car_page * PER_PAGE + slot
	if idx >= list.size():
		return
	var car: Dictionary = list[idx]
	var model := ChannelBase.model_of(str(car.modelId))
	var why := BookingsMath.block_reason(state(), car, req_by_id(sel_req), model)
	if why != "":
		toast("That car is not fit for this booking: " + why.to_lower())
		return
	sel_car = str(car.id)
	refresh()


# The reason ACCEPT JOB cannot run yet, checked in the order of the JS onAccept; "" = fine to accept.
static func accept_refusal(st: Dictionary, req: Dictionary, car: Dictionary, model: Dictionary) -> String:
	if car.is_empty():
		return "Pick a car first"
	if BookingsMath.block_reason(st, car, {}, model) != "":
		return "That car is not fit to go out"
	if req.is_empty():
		return "Pick a booking first"
	if BookingsMath.eff_d(model, car) < float(req.minDesirability):
		return "That car is too plain for this booking"
	if BookingsMath.eff_r(model, car) < float(req.minReliability):
		return "That car is too flaky for this booking"
	if float(car.condition) < float(req.minCondition):
		return "That car is too scruffy for this booking"
	return ""


func _accept() -> void:
	var req := req_by_id(sel_req)
	var car := car_by_id(sel_car)
	var model := ChannelBase.model_of(str(car.get("modelId", "")))
	var why := BookingsChannel.accept_refusal(state(), req, car, model)
	if why != "":
		toast(why)
		return
	var res: Dictionary = game.act("accept_job", {"request_id": req.id, "car_id": car.id})
	if not res.get("ok", false):
		return
	var outcome: Dictionary = res.get("outcome", {})
	result = {
		"text": str(res.get("msg", "")),
		"type": str(outcome.get("type", "success")),
		"paid": int(outcome.get("paid", 0)),
	}
	sel_req = ""
	sel_car = ""
	refresh()
	queue_redraw()


func dismiss() -> void:
	result = {}
	refresh()
	queue_redraw()


# Screenshot and test hook: shows a result panel exactly as an accepted job does.
func _test_show_result(r: Dictionary) -> void:
	result = r
	refresh()
	queue_redraw()


func on_ok() -> void:
	if result.is_empty():
		_accept()
	else:
		dismiss()


func on_back() -> bool:
	if not result.is_empty():
		dismiss()
		return true
	return false


static func type_label(t: String) -> String:
	var labels := {"success": "JOB DONE", "mishap": "MISHAP", "breakdown": "BREAKDOWN", "disaster": "DISASTER"}
	return str(labels.get(t, "JOB DONE"))


static func paid_text(paid: int) -> String:
	if paid > 0:
		return "Paid " + CoreFormat.money(paid)
	if paid < 0:
		return "Compensation " + CoreFormat.money(-paid)
	return "Paid nothing"


static func type_color_name(t: String) -> String:
	match t:
		"mishap":
			return "warn"
		"breakdown", "disaster":
			return "bad"
	return "good"


func refresh() -> void:
	if req_by_id(sel_req).is_empty():
		sel_req = ""
	var list := cars()
	if not _id_in(list, sel_car):
		sel_car = ""
	var n := list.size()
	var pages := maxi(1, int(ceil(n / float(PER_PAGE))))
	car_page = clampi(car_page, 0, pages - 1)
	var showing := not result.is_empty()

	var reqs := requests()
	Requests.visible = not showing
	Requests.set_count(reqs.size())
	Requests.selected = -1
	for i in range(reqs.size()):
		if str(reqs[i].id) == sel_req:
			Requests.selected = i
			break
	Requests.queue_redraw()

	var req := req_by_id(sel_req)
	for s in range(PER_PAGE):
		var idx := car_page * PER_PAGE + s
		var slot: UiButton = _slots[s]
		if showing or idx >= n:
			slot.text = ""
			slot.visible = false
			continue
		var car: Dictionary = list[idx]
		var model := ChannelBase.model_of(str(car.modelId))
		var why := BookingsMath.block_reason(state(), car, req, model)
		slot.visible = true
		var bottom := why if why != "" else "Cond " + CoreFormat.one_dp(float(car.condition))
		slot.text = UiText.ellipsize(str(model.name), 12) + "\n" + bottom
		slot.enabled = why == ""
		slot.hot = str(car.id) == sel_car
	PrevBtn.visible = not showing
	NextBtn.visible = not showing
	PrevBtn.enabled = car_page > 0
	NextBtn.enabled = (car_page + 1) * PER_PAGE < n

	var car_now := car_by_id(sel_car)
	var model_now := ChannelBase.model_of(str(car_now.get("modelId", "")))
	AcceptBtn.visible = not showing
	OkBtn.visible = showing
	AcceptBtn.text = "ACCEPT JOB " + (CoreFormat.money(float(req.fee)) if not req.is_empty() else "")
	AcceptBtn.enabled = accept_refusal(state(), req, car_now, model_now) == ""
	queue_redraw()


func _paint_req_row(list: Control, i: int, r: Rect2, sel: bool) -> void:
	var q: Dictionary = requests()[i]
	var paper := UiTheme.color("paper")
	var ink := UiTheme.color("ink")
	var box := Rect2(r.position + Vector2(4, 4), r.size - Vector2(8, 8))
	UiTheme.draw_box(list, box, paper, ink, 4, false)

	var days := BookingsMath.days_left(state(), q)
	var job := UiText.ellipsize(ChannelBase.job_name(str(q.jobTypeId)).to_upper(), 14)
	UiTheme.draw_text(list, job, r.position + Vector2(12, 8), "h3", ink)
	var days_col := UiTheme.color("bad") if days <= 1 else UiTheme.color("darkgrey")
	UiTheme.draw_text(list, "%dd left" % days, r.position + Vector2(0, 8), "caption", days_col, r.size.x - 12.0, HORIZONTAL_ALIGNMENT_RIGHT)

	UiTheme.draw_text(list, UiText.ellipsize(str(q.customer), 16), r.position + Vector2(12, 38), "caption", ink)
	UiTheme.draw_text(list, CoreFormat.money(float(q.fee)), r.position + Vector2(0, 38), "caption", UiTheme.color("good"), r.size.x - 12.0, HORIZONTAL_ALIGNMENT_RIGHT)

	if sel:
		var lamp := UiTheme.color("lamp")
		list.draw_rect(Rect2(box.position.x, box.position.y, box.size.x, 4.0), lamp)
		list.draw_rect(Rect2(box.position.x, box.position.y + box.size.y - 4.0, box.size.x, 4.0), lamp)
		list.draw_rect(Rect2(box.position.x, box.position.y, 4.0, box.size.y), lamp)
		list.draw_rect(Rect2(box.position.x + box.size.x - 4.0, box.position.y, 4.0, box.size.y), lamp)


func _paint() -> void:
	if not result.is_empty():
		_paint_result()
		return
	var paper := UiTheme.color("paper")
	var ink := UiTheme.color("ink")
	var good := UiTheme.color("good")
	var bad := UiTheme.color("bad")
	UiTheme.draw_box(self, Rect2(316, 48, 316, 248), paper, ink, 4, false)

	if requests().is_empty():
		_text_lines(UiText.wrap("No bookings. The phone is suspiciously quiet. Try advertising.", 27, 4), Vector2(328, 60), 26.0, "caption", ink)
		return
	var q := req_by_id(sel_req)
	if q.is_empty():
		_text_lines(UiText.wrap("Pick a booking on the left, then pick a car for the job.", 27, 4), Vector2(328, 60), 26.0, "caption", ink)
		return

	UiTheme.draw_text(self, ChannelBase.job_name(str(q.jobTypeId)), Vector2(328, 56), "h3", ink)
	_text_lines(UiText.wrap(str(q.blurb), 29, 4), Vector2(328, 80), 22.0, "caption", ink)
	UiTheme.draw_text(self, "Fee " + CoreFormat.money(float(q.fee)), Vector2(328, 176), "caption", good)

	var labels: Array[String] = [
		"Style %d" % int(q.minDesirability),
		"Reliab %d" % int(q.minReliability),
		"Cond %d" % int(q.minCondition),
	]
	var car := car_by_id(sel_car)
	var model := ChannelBase.model_of(str(car.get("modelId", ""))) if not car.is_empty() else {}
	var have_car := not car.is_empty() and not model.is_empty()
	var vals: Array[float] = [0.0, 0.0, 0.0]
	if have_car:
		vals = [BookingsMath.eff_d(model, car), BookingsMath.eff_r(model, car), float(car.condition)]
	var needs: Array[float] = [float(q.minDesirability), float(q.minReliability), float(q.minCondition)]
	for i in range(3):
		var y := 202.0 + 24.0 * float(i)
		UiTheme.draw_text(self, labels[i], Vector2(328, y), "caption", ink)
		if have_car:
			var pass_ok := vals[i] >= needs[i]
			UiTheme.draw_text(self, "OK" if pass_ok else "NO", Vector2(470, y), "h3", good if pass_ok else bad)
			UiTheme.draw_text(self, CoreFormat.one_dp(vals[i]), Vector2(530, y), "caption", ink)


# The job result panel: shown alone until OK or BACK dismisses it.
func _paint_result() -> void:
	var paper := UiTheme.color("paper")
	var ink := UiTheme.color("ink")
	var t := str(result.get("type", "success"))
	UiTheme.draw_box(self, Rect2(8, 48, 624, 316), paper, ink, 4, true)
	UiTheme.draw_text(self, type_label(t), Vector2(0, 62), "h1", UiTheme.color(type_color_name(t)), 640.0, HORIZONTAL_ALIGNMENT_CENTER)
	UiTheme.draw_text(self, paid_text(int(result.get("paid", 0))), Vector2(0, 108), "h2", ink, 640.0, HORIZONTAL_ALIGNMENT_CENTER)
	_text_lines(UiText.wrap(str(result.get("text", "")), 48, 6), Vector2(28, 156), 26.0, "caption", ink)


func _text_lines(lines: Array[String], pos: Vector2, pitch: float, role: String, col: Color) -> void:
	for i in range(lines.size()):
		UiTheme.draw_text(self, lines[i], pos + Vector2(0, pitch * float(i)), role, col)
