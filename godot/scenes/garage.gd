class_name GarageRoom
extends RoomBase

# The garage (the stable): the layout of src/ui/scenes/garage.js refitted to the tableau y 120..590.
# GDR03 builds the layout and placeholder art (rooms/garage_art.gd). GDR04 adds the car list (five rows
# per page), selection, paging, BACK and the detail panel. The action buttons come in GDR27 (_on_action,
# _refresh_buttons are its hooks).

const R_BACK := Rect2(30, 126, 150, 64)
const R_PAGE_UP := Rect2(190, 126, 100, 64)
const R_PAGE_DOWN := Rect2(300, 126, 100, 64)
const R_LIST := Rect2(30, 196, 370, 360)
const ROW_H := 72
const ROWS_PER_PAGE := 5
const R_DETAIL := Rect2(420, 126, 830, 300)
const R_CARVIEW := Rect2(440, 196, 480, 220)
const BAR_X := 940.0
const BAR_W := 290.0
const BTN_RECTS := {
	&"tinker": Rect2(420, 438, 270, 64),
	&"service": Rect2(700, 438, 270, 64),
	&"fix": Rect2(980, 438, 270, 64),
	&"restore": Rect2(420, 514, 270, 64),
	&"sell": Rect2(700, 514, 270, 64),
	&"consign": Rect2(980, 514, 270, 64),
}
const ACTION_IDS := [&"tinker", &"service", &"fix", &"restore", &"sell", &"consign"]

var sel_id := ""
var page := 0
var _rows: Array = []


static func row_rect(i: int) -> Rect2:
	return Rect2(30, 196 + i * ROW_H, 370, 68)


func _ready() -> void:
	build_layers()
	strip_color = Color("444444")
	GarageArt.build(self)
	_build_controls()
	# Outside the tree (the test runner calls _ready by hand) there is no Game unless a test set one.
	if game != null or is_inside_tree():
		_connect_game()
		refresh()


func _exit_tree() -> void:
	if game != null and game.changed.is_connected(refresh):
		game.changed.disconnect(refresh)


func _build_controls() -> void:
	if not _rows.is_empty():
		return
	add_button(&"back", R_BACK, "BACK")
	add_button(&"page_up", R_PAGE_UP, "UP")
	add_button(&"page_down", R_PAGE_DOWN, "DOWN")
	for i in range(ROWS_PER_PAGE):
		_rows.append(add_button(StringName("row%d" % i), row_rect(i), "", "card"))
	for id in ACTION_IDS:
		add_button(id, BTN_RECTS[id], "", "normal")


# Data helpers. With no game (a bare scene) the state is empty and the garage shows as empty.
func state() -> Dictionary:
	var g = get_game()
	if g == null:
		return {}
	return g.state


func cars() -> Array:
	return state().get("cars", [])


func selected_car() -> Dictionary:
	var idx := _index_of(sel_id)
	if idx < 0:
		return {}
	return cars()[idx]


func row_car_ids() -> Array:
	var all := cars()
	var out: Array = []
	var start := page * ROWS_PER_PAGE
	for i in range(start, mini(start + ROWS_PER_PAGE, all.size())):
		out.append(String(all[i].id))
	return out


func page_count() -> int:
	return maxi(1, ceili(cars().size() / float(ROWS_PER_PAGE)))


func select(car_id: String) -> void:
	sel_id = car_id
	page = _page_for(car_id)
	refresh()


func page_move(delta: int) -> void:
	page = clampi(page + delta, 0, page_count() - 1)
	refresh()


func enter(params: Dictionary = {}) -> void:
	sel_id = String(params.get("carId", ""))
	if _index_of(sel_id) < 0:
		sel_id = _first_id()
	page = _page_for(sel_id)
	refresh()


func refresh() -> void:
	if _index_of(sel_id) < 0:
		sel_id = _first_id()
		page = _page_for(sel_id)
	page = clampi(page, 0, page_count() - 1)
	var all := cars()
	var st := state()
	var today := int(st.get("day", 0))

	for i in range(ROWS_PER_PAGE):
		var b := _rows[i] as UiButton
		var idx := page * ROWS_PER_PAGE + i
		if idx < all.size():
			var car: Dictionary = all[idx]
			var model := GarageCosts.model_of(String(car.modelId))
			var line := ("OWN" if car.get("owned", false) else "RENT") + "  COND " + CoreFormat.one_dp(float(car.condition))
			if car.get("fault") != null:
				line += "  FAULT"
			if int(car.get("impoundedUntil", 0)) > today:
				line += "  IMPOUNDED"
			b.text = String(model.get("name", car.modelId)) + "\n" + line
			b.hot = String(car.id) == sel_id
			b.visible = true
			b.enabled = true
		else:
			b.hot = false
			b.visible = false
			b.enabled = false

	(ui().get_node("StableLabel") as Label).text = "STABLE %d/%d" % [all.size(), int(st.get("garageSlots", 0))]
	(ui().get_node("EmptyLabel") as Label).visible = all.is_empty()
	(hotspots[&"page_up"] as UiButton).enabled = page > 0
	(hotspots[&"page_down"] as UiButton).enabled = page < page_count() - 1

	_refresh_detail()
	_refresh_buttons()


func _refresh_detail() -> void:
	var car := selected_car()
	var name_label := ui().get_node("NameLabel") as Label
	var quip_label := ui().get_node("QuipLabel") as Label
	var des_label := ui().get_node("DesLabel") as Label
	var rel_label := ui().get_node("RelLabel") as Label
	var cond_label := ui().get_node("CondLabel") as Label
	var value_label := ui().get_node("ValueLabel") as Label
	var cost_label := ui().get_node("CostLabel") as Label
	var fault_label := ui().get_node("FaultLabel") as Label
	var des_bar := ui().get_node("DesBar") as ColorRect
	var rel_bar := ui().get_node("RelBar") as ColorRect
	var cond_bar := ui().get_node("CondBar") as ColorRect

	if car.is_empty():
		name_label.text = ""
		quip_label.text = ""
		des_label.text = ""
		rel_label.text = ""
		cond_label.text = ""
		value_label.text = ""
		cost_label.text = ""
		fault_label.text = ""
		des_bar.size = Vector2(0, des_bar.size.y)
		rel_bar.size = Vector2(0, rel_bar.size.y)
		cond_bar.size = Vector2(0, cond_bar.size.y)
		return

	var model := GarageCosts.model_of(String(car.modelId))
	var condition := float(car.condition)
	var eff_d := SimCarStats.eff_d(model, car)
	var eff_r := SimCarStats.eff_r(model, car)

	name_label.text = String(model.get("name", ""))
	quip_label.text = String(model.get("quip", ""))
	des_label.text = "DESIRABILITY " + CoreFormat.one_dp(eff_d)
	rel_label.text = "RELIABILITY " + CoreFormat.one_dp(eff_r)
	cond_label.text = "CONDITION " + CoreFormat.one_dp(condition)
	des_bar.size = Vector2(BAR_W * clampf(eff_d / 10.0, 0.0, 1.0), des_bar.size.y)
	rel_bar.size = Vector2(BAR_W * clampf(eff_r / 10.0, 0.0, 1.0), rel_bar.size.y)
	cond_bar.size = Vector2(BAR_W * clampf(condition / 10.0, 0.0, 1.0), cond_bar.size.y)
	if condition >= 7.0:
		cond_bar.color = Color("3FAE49")
	elif condition >= 4.0:
		cond_bar.color = Color("FFD27A")
	else:
		cond_bar.color = Color("D9483B")

	value_label.text = "Value " + CoreFormat.money(float(SimCarStats.market_value(state(), model, car)))
	if car.get("owned", false):
		cost_label.text = "Running cost/month " + CoreFormat.money(float(SimCarStats.running_cost(model, car)))
	else:
		cost_label.text = "Rent/month " + CoreFormat.money(float(car.get("rentMonthly", 0)))
	var fault = car.get("fault")
	if fault != null:
		fault_label.text = "FAULT: " + String(fault.label) + " (fix " + CoreFormat.money(float(fault.cost)) + ")"
	else:
		fault_label.text = ""


func _action_button(id: StringName) -> UiButton:
	return hotspots[id] as UiButton


func _set_action(id: StringName, text: String, on: bool) -> void:
	var b := _action_button(id)
	b.text = text
	b.enabled = on


# Sets the six action buttons for the selected car. A greyed button (enabled = false) still takes the tap.
func _refresh_buttons() -> void:
	var c := selected_car()
	for id in ACTION_IDS:
		_action_button(id).visible = not c.is_empty()
		_action_button(id).enabled = false
	if c.is_empty():
		return
	var st := state()
	var m := GarageCosts.model_of(String(c.modelId))
	var cash := int(st.get("cash", 0))
	var fault = c.get("fault")
	var fc := 0
	if fault != null:
		fc = int(fault.cost)
	var consigned := GarageCosts.is_consigned(st, String(c.id))

	var tc := GarageCosts.tinker_cost(m)
	_set_action(&"tinker", "TINKER " + CoreFormat.money(tc), float(c.condition) < 10.0 and cash >= tc)
	var sc := GarageCosts.service_cost(m)
	_set_action(&"service", "SERVICE " + CoreFormat.money(sc), float(c.condition) < 10.0 and cash >= sc)
	_set_action(&"fix", ("FIX FAULT " + CoreFormat.money(fc)) if fault != null else "FIX FAULT", fault != null and cash >= fc)
	var rc := GarageCosts.restore_cost(m)
	var perfect := float(c.condition) >= 10.0 and fault == null
	_set_action(&"restore", "RESTORE " + CoreFormat.money(rc), not perfect and cash >= rc)

	if c.get("owned", false):
		var price := GarageCosts.dealer_price(st, m, c)
		_set_action(&"sell", "SELL " + CoreFormat.money(price), not consigned)
		_set_action(&"consign", "WITHDRAW" if consigned else "CONSIGN", consigned or not CoreClock.is_auction_day(int(st.get("day", 0))))
	else:
		var fee := GarageCosts.damage_fee(m, c)
		_set_action(&"sell", "RETURN " + CoreFormat.money(fee), cash >= fee)
		_action_button(&"consign").visible = false


# Runs one garage action on the selected car, then refreshes. The Game toasts any refusal itself.
func _act(action: String, params: Dictionary) -> Dictionary:
	var g = get_game()
	var r = g.act(action, params)
	refresh()
	if r is Dictionary:
		return r
	return {}


# A tap on an action button (enabled or greyed) or its key. Greyed buttons still reach the sim.
func _on_action(id: StringName) -> void:
	var c := selected_car()
	if c.is_empty():
		return
	var car_id := String(c.id)
	match id:
		&"tinker":
			_act("service_car", {"car_id": car_id, "kind": "quick"})
		&"service":
			_act("service_car", {"car_id": car_id, "kind": "full"})
		&"fix":
			_act("fix_fault", {"car_id": car_id})
		&"restore":
			_act("restore_car", {"car_id": car_id})
		&"sell":
			if c.get("owned", false):
				_act("sell_to_dealer", {"car_id": car_id})
			else:
				_act("return_rental", {"car_id": car_id})
		&"consign":
			_consign(c)


func _consign(c: Dictionary) -> void:
	var st := state()
	var car_id := String(c.id)
	if GarageCosts.is_consigned(st, car_id):
		_act("unconsign", {"car_id": car_id})
		return
	if CoreClock.is_auction_day(int(st.get("day", 0))):
		toast.emit("Too late, the auction is today")
		return
	var model := GarageCosts.model_of(String(c.modelId))
	var reserve := GarageCosts.consign_reserve(st, model, c)
	var r := _act("consign_car", {"car_id": car_id, "reserve": reserve})
	if r.get("ok", false):
		toast.emit("Consigned. Reserve " + CoreFormat.money(reserve))


# Input.
func _on_hotspot(id: StringName) -> void:
	if id == &"back":
		request_scene.emit(&"office", {})
	elif id == &"page_up":
		page_move(-1)
	elif id == &"page_down":
		page_move(1)
	elif String(id).begins_with("row"):
		var i := int(String(id).substr(3))
		var ids := row_car_ids()
		if i < ids.size():
			select(String(ids[i]))
	else:
		_on_action(id)


func _on_button_blocked(id: StringName) -> void:
	# A dimmed action button still takes the tap: the Game explains the refusal.
	if id in [&"tinker", &"service", &"fix", &"restore", &"sell", &"consign"]:
		_on_action(id)


# KEY_UP / KEY_DOWN move the selection (no wrap), KEY_ESCAPE goes back. True when the key was handled.
func handle_key(keycode: int) -> bool:
	if keycode == KEY_ESCAPE:
		request_scene.emit(&"office", {})
		return true
	if keycode == KEY_S or keycode == KEY_T or keycode == KEY_F:
		if selected_car().is_empty():
			return false
		if keycode == KEY_S:
			_on_action(&"service")
		elif keycode == KEY_T:
			_on_action(&"tinker")
		else:
			_on_action(&"fix")
		return true
	if keycode != KEY_UP and keycode != KEY_DOWN:
		return false
	var all := cars()
	if all.is_empty():
		return false
	var idx := _index_of(sel_id)
	var target := 0
	if idx >= 0:
		if keycode == KEY_UP:
			target = maxi(idx - 1, 0)
		else:
			target = mini(idx + 1, all.size() - 1)
	select(String(all[target].id))
	return true


func _unhandled_key_input(event: InputEvent) -> void:
	var key := event as InputEventKey
	if not visible or key == null or not key.pressed or key.echo:
		return
	if handle_key(key.keycode):
		get_viewport().set_input_as_handled()


func _connect_game() -> void:
	var g = get_game()
	if g != null and not g.changed.is_connected(refresh):
		g.changed.connect(refresh)


func _index_of(car_id: String) -> int:
	var all := cars()
	for i in range(all.size()):
		if String(all[i].id) == car_id:
			return i
	return -1


func _first_id() -> String:
	var all := cars()
	if all.is_empty():
		return ""
	return String(all[0].id)


# The page that holds a car; page 0 when the car is not in the garage.
func _page_for(car_id: String) -> int:
	var idx := _index_of(car_id)
	if idx < 0:
		return 0
	return int(floor(float(idx) / float(ROWS_PER_PAGE)))
