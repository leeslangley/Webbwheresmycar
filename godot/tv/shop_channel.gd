class_name ShopChannel
extends ChannelBase

# SHOP channel (port of src/ui/scenes/tvshop.js, display half): the week's listings in a scrolling list on
# the left, and the selected car with its portrait, quip and stat bars on the right, and BUY and RENT under it (GDU23).

const LIST := Rect2(8, 48, 300, 320)
const DETAIL := Rect2(316, 48, 316, 320)
const ROW_H := 72
const BUY_AT := Vector2(316, 376)
const RENT_AT := Vector2(482, 376)
const ACT_SIZE := Vector2(150, 72)

var _list: UiList
var _portrait: CarPortrait
var _buy_btn: UiButton
var _rent_btn: UiButton


func _init() -> void:
	super()
	title = "SHOP"


func _ready() -> void:
	_list = UiList.new()
	_list.name = "List"
	_list.position = LIST.position
	_list.size = LIST.size
	_list.row_h = ROW_H
	_list.row_painter = _paint_row
	_list.row_tapped.connect(_on_row)
	add_child(_list)
	_portrait = CarPortrait.new()
	_portrait.name = "Portrait"
	_portrait.position = DETAIL.position
	_portrait.size = Vector2(316, 150)
	add_child(_portrait)
	_buy_btn = _action_button("BuyBtn", "BUY", "primary", BUY_AT)
	_buy_btn.activated.connect(_do_buy)
	_buy_btn.blocked.connect(_do_buy)
	_rent_btn = _action_button("RentBtn", "RENT", "normal", RENT_AT)
	_rent_btn.activated.connect(_do_rent)
	_rent_btn.blocked.connect(_do_rent)


func _action_button(node_name: String, label: String, kind_name: String, at: Vector2) -> UiButton:
	var b := UiButton.new()
	b.name = node_name
	b.text = label
	b.kind = kind_name
	b.position = at
	b.size = ACT_SIZE
	add_child(b)
	return b


func _on_row(_i: int) -> void:
	_show_selected()


func _do_buy() -> void:
	_do("sale")


func _do_rent() -> void:
	_do("rent")


# One path for BUY and RENT taps (enabled or not): a refusal is explained by a toast before any action is sent.
# A failed action is toasted by Game itself, so only the success text is toasted here.
func _do(mode: String) -> void:
	var l := selected_listing()
	var why := ShopChannel.refusal(state(), l, mode)
	if why != "":
		toast(why)
		return
	var action := "buy_car" if mode == "sale" else "rent_car"
	var res: Dictionary = game.act(action, {"listing_id": l.listingId})
	if res.get("ok", false) and str(res.get("msg", "")) != "":
		toast(str(res.get("msg", "")))


# OK on the remote: BUY or RENT the selected car, as the listing says.
func on_ok() -> void:
	var l := selected_listing()
	if l.is_empty():
		return
	_do(str(l.mode))


func listings() -> Array:
	return state().get("shop", {}).get("listings", [])


func selected_listing() -> Dictionary:
	var ls := listings()
	if _list.selected >= 0 and _list.selected < ls.size():
		return ls[_list.selected]
	return {}


static func wear_for(condition: float) -> int:
	return CarPortrait.wear_for(condition)


# Why BUY (mode "sale") or RENT (mode "rent") must refuse, or "" when the deal may go ahead.
# Same order as tvshop.js: the listing kind first, then the garage slot, then the money.
static func refusal(st: Dictionary, listing: Dictionary, mode: String) -> String:
	if listing.is_empty() or str(listing.get("mode", "")) != mode:
		return "That one is not for sale" if mode == "sale" else "That one is not for rent"
	if st.cars.size() >= int(st.garageSlots):
		return "No free garage slot"
	if float(st.cash) < float(listing.price):
		return "Not enough money"
	return ""


func refresh() -> void:
	_list.set_count(listings().size())
	if _list.selected < 0 and listings().size() > 0:
		_list.select(0)
	_show_selected()
	queue_redraw()


func _show_selected() -> void:
	var l := selected_listing()
	if l.is_empty():
		_portrait.clear()
	else:
		var id := str(l.modelId)
		_portrait.set_car(id, ChannelBase.paint_of(id), wear_for(float(l.condition)))
	# The flags follow the selection too (not only refresh), so the buttons grey out on any row change.
	_buy_btn.enabled = ShopChannel.refusal(state(), l, "sale") == ""
	_rent_btn.enabled = ShopChannel.refusal(state(), l, "rent") == ""
	queue_redraw()


func _paint_row(list: Control, i: int, r: Rect2, sel: bool) -> void:
	var l: Dictionary = listings()[i]
	var m := ChannelBase.model_of(str(l.modelId))
	UiTheme.draw_box(list, r.grow(-2), UiTheme.color("paper"), UiTheme.color("ink"), 4, false)
	UiTheme.draw_text(list, UiText.ellipsize(str(m.get("name", l.modelId)), 20), r.position + Vector2(14, 8), "caption", UiTheme.color("ink"))
	var sale := str(l.mode) == "sale"
	var tag := "FOR SALE" if sale else "TO RENT"
	var tag_col := UiTheme.color("good") if sale else UiTheme.color("warn")
	UiTheme.draw_text(list, tag, r.position + Vector2(14, 42), "h3", tag_col)
	var price := CoreFormat.money(float(l.price)) + ("" if sale else "/mo")
	UiTheme.draw_text(list, price, Vector2(r.position.x, r.position.y + 42), "caption", UiTheme.color("ink"), r.size.x - 14, HORIZONTAL_ALIGNMENT_RIGHT)
	if sel:
		list.draw_rect(r.grow(-2), UiTheme.color("lamp"), false, 4.0)
		UiTheme.draw_text(list, ">", r.position + Vector2(2, 24), "h3", UiTheme.color("lamp"))


func _paint() -> void:
	var l := selected_listing()
	var dx := DETAIL.position.x
	if l.is_empty():
		UiTheme.draw_text(self, "Nothing on the telly.", Vector2(8, 200), "body", UiTheme.color("cream"), 624, HORIZONTAL_ALIGNMENT_CENTER)
		UiTheme.draw_text(self, "Try again next week.", Vector2(8, 232), "body", UiTheme.color("cream"), 624, HORIZONTAL_ALIGNMENT_CENTER)
		return
	var m := ChannelBase.model_of(str(l.modelId))
	UiTheme.draw_text(self, UiText.ellipsize(str(m.get("name", "")).to_upper(), 19), Vector2(dx, 204), "h3", UiTheme.color("phosphor"))
	var y := 226.0
	var quip := "%d. %s" % [int(m.get("year", 0)), str(m.get("quip", ""))]
	for line in UiText.wrap(quip, 29, 2):
		UiTheme.draw_text(self, line, Vector2(dx, y), "caption", UiTheme.color("white"))
		y += 24.0
	if str(l.mode) == "rent":
		UiTheme.draw_text(self, UiText.ellipsize("Owner: " + str(l.owner), 29), Vector2(dx, y), "caption", UiTheme.color("white"))
	_stat_row("STYLE", float(m.get("desirability", 0)), "good", 298.0)
	_stat_row("UPKEEP", float(m.get("maintenance", 0)), "warn", 316.0)
	_stat_row("GRIT", float(m.get("reliability", 0)), "cyan", 334.0)
	_stat_row("COND " + CoreFormat.one_dp(float(l.condition)), float(l.condition), "cyan", 352.0)


func _stat_row(text: String, value: float, col_key: String, y: float) -> void:
	UiTheme.draw_text(self, text, Vector2(DETAIL.position.x, y - 4), "caption", UiTheme.color("cream"))
	UiTheme.draw_bar(self, Rect2(DETAIL.position.x + 120, y, 190, 12), value / 10.0, UiTheme.color(col_key))
