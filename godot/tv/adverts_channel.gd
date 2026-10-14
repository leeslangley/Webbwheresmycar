class_name AdvertsChannel
extends ChannelBase

# The ADVERTS channel (port of src/ui/scenes/adverts.js): the seven media as a list (name, cost, PAYS and RISK),
# a detail panel with the blurb and the numbers, a BUZZ meter, and RUN ADVERT. After a run the detail panel
# shows the result until OK (or BACK) dismisses it.

var result: Array[String] = []

var List: UiList
var RunBtn: UiButton
var OkBtn: UiButton


func _init() -> void:
	super()
	title = "ADVERTS"


func _ready() -> void:
	List = UiList.new()
	List.position = Vector2(8, 76)
	List.size = Vector2(300, 292)
	List.row_h = 72
	List.row_painter = _paint_row
	List.set_count(Data.adverts().size())
	List.select(0)
	List.row_tapped.connect(func(_i: int): refresh())
	add_child(List)

	RunBtn = UiButton.new()
	RunBtn.kind = "primary"
	RunBtn.position = Vector2(316, 376)
	RunBtn.size = Vector2(316, 72)
	RunBtn.activated.connect(_run)
	RunBtn.blocked.connect(_run)
	add_child(RunBtn)

	OkBtn = UiButton.new()
	OkBtn.text = "OK"
	OkBtn.position = Vector2(316, 376)
	OkBtn.size = Vector2(316, 72)
	OkBtn.visible = false
	OkBtn.activated.connect(dismiss)
	add_child(OkBtn)


# The selected medium, or {} when nothing is selected.
func medium() -> Dictionary:
	if List == null:
		return {}
	var all: Array = Data.adverts()
	var i: int = List.selected
	if i < 0 or i >= all.size():
		return {}
	return all[i]


func refresh() -> void:
	if RunBtn == null:
		return
	var m := medium()
	RunBtn.text = "RUN ADVERT " + CoreFormat.money(float(m.get("cost", 0)))
	RunBtn.enabled = float(state().get("cash", 0)) >= float(m.get("cost", 0))
	queue_redraw()


func _run() -> void:
	var m := medium()
	if m.is_empty():
		return
	if float(state().get("cash", 0)) < float(m.get("cost", 0)):
		toast("Not enough money")
		return
	var res: Dictionary = game.act("advertise", {"media_id": m.get("id")})
	if res.get("ok", false):
		result = AdvertsMath.result_lines(res)
		RunBtn.visible = false
		OkBtn.visible = true
		queue_redraw()


func dismiss() -> void:
	result = []
	RunBtn.visible = true
	OkBtn.visible = false
	queue_redraw()


func on_ok() -> void:
	if result.is_empty():
		_run()
	else:
		dismiss()


func on_back() -> bool:
	if not result.is_empty():
		dismiss()
		return true
	return false


func _paint_row(list: Control, i: int, r: Rect2, sel: bool) -> void:
	var m: Dictionary = Data.adverts()[i]
	var ink := UiTheme.color("ink")
	var box := Rect2(r.position + Vector2(4, 2), r.size - Vector2(8, 4))
	UiTheme.draw_box(list, box, UiTheme.color("paper"), ink, 3, false)
	UiTheme.draw_text(list, UiText.ellipsize(str(m.get("name", "")), 17), r.position + Vector2(12, 4), "caption", ink)
	UiTheme.draw_text(list, CoreFormat.money(float(m.get("cost", 0))), r.position + Vector2(0, 4), "caption", UiTheme.color("darkgrey"), r.size.x - 12.0, HORIZONTAL_ALIGNMENT_RIGHT)
	UiTheme.draw_text(list, "PAYS " + UiText.pips(AdvertsMath.pays(m)), r.position + Vector2(12, 34), "caption", UiTheme.color("good"))
	UiTheme.draw_text(list, "RISK %d%%" % AdvertsMath.flop_chance(m), r.position + Vector2(0, 34), "caption", UiTheme.color("bad"), r.size.x - 12.0, HORIZONTAL_ALIGNMENT_RIGHT)
	if sel:
		list.draw_rect(box, UiTheme.color("lamp"), false, 4.0)


func _paint() -> void:
	var ink := UiTheme.color("ink")
	var buzz := float(state().get("buzz", 0))
	UiTheme.draw_text(self, "BUZZ %d" % int(round(buzz)), Vector2(8, 50), "h3", UiTheme.color("phosphor"))
	UiTheme.draw_bar(self, Rect2(160, 50, 300, 16), buzz / 100.0, UiTheme.color("good"))

	UiTheme.draw_box(self, Rect2(316, 76, 316, 292), UiTheme.color("paper"), ink, 4, false)
	var m := medium()
	if m.is_empty():
		return
	if result.is_empty():
		_paint_detail(m, ink)
	else:
		_paint_result(ink)


func _paint_detail(m: Dictionary, ink: Color) -> void:
	UiTheme.draw_text(self, UiText.ellipsize(str(m.get("name", "")).to_upper(), 18), Vector2(328, 88), "h3", ink)
	var blurb: Array[String] = UiText.wrap(str(m.get("blurb", "")), 29, 5)
	for k in range(blurb.size()):
		UiTheme.draw_text(self, blurb[k], Vector2(328, 116 + k * 22), "caption", ink)
	UiTheme.draw_text(self, "Cost " + CoreFormat.money(float(m.get("cost", 0))), Vector2(328, 236), "caption", ink)
	UiTheme.draw_text(self, "Typical buzz +%d" % int(round(AdvertsMath.expected_buzz(m))), Vector2(328, 260), "caption", ink)
	UiTheme.draw_text(self, "Chance of a flop %d%%" % AdvertsMath.flop_chance(m), Vector2(328, 284), "caption", ink)
	UiTheme.draw_text(self, "Best case +%d buzz" % AdvertsMath.best_buzz(m), Vector2(328, 308), "caption", ink)


func _paint_result(ink: Color) -> void:
	UiTheme.draw_text(self, "THE RESULT", Vector2(328, 88), "h3", ink)
	for k in range(result.size()):
		var line := result[k]
		var col := ink
		if line.begins_with("Buzz +") or line.begins_with("Reputation +"):
			col = UiTheme.color("good")
		elif line.begins_with("Buzz -") or line.begins_with("Reputation -"):
			col = UiTheme.color("bad")
		UiTheme.draw_text(self, line, Vector2(328, 116 + k * 26), "caption", col)
