class_name OfficeRoom
extends RoomBase

# The office: the Webb TV dead centre, Mark and Dave in chairs in front of its lower corners, and
# flat-colour placeholders around it. Layout only; hotspots and the menu come in GDR02.

signal news_closed

const MENU_ITEMS: Array[String] = ["GARAGE", "AUCTION", "NEXT DAY", "SETTINGS"]

const R_TV := Rect2(260, 60, 760, 560)
const R_GARAGE_DOOR := Rect2(30, 124, 200, 160)
const R_WINDOW := Rect2(1040, 124, 110, 110)
const R_POSTER := Rect2(1164, 124, 96, 110)
const R_CALENDAR := Rect2(1060, 244, 130, 140)
const R_DESK := Rect2(1020, 464, 260, 126)
const R_PHONE := Rect2(1046, 400, 72, 64)
const R_NEWSPAPER := Rect2(1122, 408, 78, 56)
const R_KETTLE := Rect2(1208, 396, 56, 70)
const R_MARK := Rect2(300, 470, 110, 150)
const R_DAVE := Rect2(870, 470, 110, 150)
const R_MENU := Rect2(8, 290, 280, 272)

var menu: UiMenu
var _chat_day := -1
var _news_open := false


func _ready() -> void:
	build_layers()
	strip_color = Color("6C5EB5")
	OfficeArt.build(self)
	_build_hotspots()
	_build_menu()
	_setup_tv()
	_connect_game()
	refresh()


func _exit_tree() -> void:
	var g = get_game()
	if g == null:
		return
	if g.day_advanced.is_connected(_on_day_advanced):
		g.day_advanced.disconnect(_on_day_advanced)
	if g.changed.is_connected(refresh):
		g.changed.disconnect(refresh)


# The Game's state Dictionary, or an empty one when no Game is present.
var state: Dictionary:
	get:
		var g = get_game()
		return g.state if g != null else {}


func _build_hotspots() -> void:
	add_hotspot(&"garage_door", R_GARAGE_DOOR)
	add_hotspot(&"poster", R_POSTER)
	add_hotspot(&"calendar", R_CALENDAR)
	add_hotspot(&"phone", R_PHONE)
	add_hotspot(&"newspaper", R_NEWSPAPER)
	add_hotspot(&"kettle", R_KETTLE)


func _on_hotspot(id: StringName) -> void:
	match id:
		&"garage_door":
			go_garage()
		&"poster":
			go_auction()
		&"calendar":
			_calendar_toast()
		&"phone":
			show_channel("bookings")
		&"newspaper":
			show_channel("news")
		&"kettle":
			next_day()


# The pop-up menu beside the TV. It stays on screen after every choice.
func _build_menu() -> void:
	menu = UiMenu.new()
	menu.name = "Menu"
	ui().add_child(menu)
	menu.chosen.connect(_on_menu_chosen)
	_open_menu()


func _open_menu() -> void:
	menu.open(MENU_ITEMS, R_MENU.position)


func _on_menu_chosen(index: int) -> void:
	match index:
		0:
			go_garage()
		1:
			go_auction()
		2:
			next_day()
		3:
			open_settings()
	_open_menu()


func go_garage() -> void:
	request_scene.emit(&"garage", {})


func go_auction() -> void:
	if _is_auction_day():
		request_scene.emit(&"auction", {})
	else:
		toast.emit("Auction day is the 24th of every month")


func open_settings() -> void:
	request_scene.emit(&"settings", {"overlay": true})


# The kettle: one day passes. The Game toasts a refusal itself and emits day_advanced on success.
func next_day() -> void:
	get_game().act("wait_day")


func _calendar_toast() -> void:
	var day := int(state.get("day", 0))
	if day < 1 or day > 365:
		toast.emit("The year is over")
		return
	toast.emit(CoreFormat.date_text(day) + " - " + str(365 - day) + " days left")


func _tv():
	return get_node_or_null("Props/Tv")


# Hands the game to the TV and listens for its close. The TV needs its own screen (the Viewport its _ready
# builds) before setup(), so setup waits for that.
func _setup_tv() -> void:
	var tv = _tv()
	if tv == null:
		return
	if tv.has_method("setup") and tv.has_node("Viewport"):
		tv.setup(get_game())
	if tv.has_signal("closed") and not tv.closed.is_connected(_on_tv_closed):
		tv.closed.connect(_on_tv_closed)


# The CRT filter setting (Flow.apply_settings): passed on to the TV.
func set_crt(on: bool) -> void:
	var tv = _tv()
	if tv != null and tv.has_method("set_crt"):
		tv.set_crt(on)


func show_channel(channel: String) -> void:
	var tv = _tv()
	if tv != null and tv.has_method("tune"):
		tv.tune(channel)
	else:
		toast.emit("The telly is not plugged in yet")


# Tunes the TV to NEWS and reports news_closed once the TV is closed again.
func show_news() -> void:
	_news_open = true
	var tv = _tv()
	if tv != null and tv.has_method("tune"):
		tv.tune("news")
	else:
		toast.emit("The telly is not plugged in yet")
		_news_open = false
		news_closed.emit()


func _on_tv_closed() -> void:
	if _news_open:
		_news_open = false
		news_closed.emit()


func _is_auction_day() -> bool:
	return not state.is_empty() and CoreClock.is_auction_day(int(state.day))


func refresh() -> void:
	if state.is_empty():
		return
	hotspots[&"phone"].set_glow(state.requests.size() > 0)
	hotspots[&"poster"].set_glow(_is_auction_day())
	placeholder("Characters").get_node("Mark").set_meta("mood", OfficeChat.mood_for(state))


# Dave's one line per day: said on the first visit and again whenever the day changes.
func say_today() -> void:
	if state.is_empty():
		return
	var day := int(state.day)
	if day != _chat_day:
		_chat_day = day
		chatter.emit(OfficeChat.line_for(state))


func enter(_params: Dictionary = {}) -> void:
	refresh()
	say_today()


func _on_day_advanced() -> void:
	refresh()
	say_today()


func _connect_game() -> void:
	var g = get_game()
	if g == null:
		return
	if not g.day_advanced.is_connected(_on_day_advanced):
		g.day_advanced.connect(_on_day_advanced)
	if not g.changed.is_connected(refresh):
		g.changed.connect(refresh)


# Keys for the Mac window. Returns true when the key did something.
func handle_key(keycode: int) -> bool:
	match keycode:
		KEY_G:
			go_garage()
		KEY_K:
			next_day()
		KEY_A:
			if not _is_auction_day():
				return false
			go_auction()
		KEY_P:
			show_channel("bookings")
		KEY_N:
			show_channel("news")
		_:
			return false
	return true


func _unhandled_key_input(event: InputEvent) -> void:
	var key := event as InputEventKey
	if key == null or not key.pressed or key.echo or not visible:
		return
	if handle_key(key.keycode):
		get_viewport().set_input_as_handled()
