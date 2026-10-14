class_name ChannelManager
extends Node

# Registry of TV channels plus the tuning logic: tune(id), step(dir), OK and BACK routing. A channel change
# plays the static transition (TvStatic): the swap happens at its midpoint. A tune made while the static is
# already in its second half waits and starts a fresh transition once the current one finishes.

signal tuned(id: String, title: String, index: int)
signal exit_requested

const DEFAULTS: Array = [
	{"id": "shop", "title": "SHOP", "scene": "res://tv/shop_channel.tscn"},
	{"id": "news", "title": "NEWS", "scene": "res://tv/news_channel.tscn"},
	{"id": "adverts", "title": "ADVERTS", "scene": "res://tv/adverts_channel.tscn"},
	{"id": "ledger", "title": "LEDGER", "scene": "res://tv/ledger_channel.tscn"},
	{"id": "bookings", "title": "BOOKINGS", "scene": "res://tv/bookings_channel.tscn"},
]

var channels: Array = DEFAULTS.duplicate(true)
var host: Control
var game: Object
var fx: TvStatic

var _current: ChannelBase
var _index: int = -1
var _pending: int = -1


func setup(h: Control, g: Object, f: TvStatic = null) -> void:
	host = h
	game = g
	fx = f
	if f != null:
		f.midpoint.connect(_on_midpoint)
		f.finished.connect(_on_finished)


func register(id: String, title: String, scene: String) -> void:
	var entry := {"id": id, "title": title, "scene": scene}
	var i := index_of(id)
	if i >= 0:
		channels[i] = entry
	else:
		channels.append(entry)


func index_of(id: String) -> int:
	for i in range(channels.size()):
		if str(channels[i].get("id", "")) == id:
			return i
	return -1


func current_id() -> String:
	if _current == null or _index < 0:
		return ""
	return str(channels[_index].get("id", ""))


func current() -> ChannelBase:
	return _current


func current_index() -> int:
	return _index


func tune(id: String) -> bool:
	var i := index_of(id)
	if i < 0:
		return false
	return _request(i)


func step(dir: int) -> void:
	var n := channels.size()
	if n == 0:
		return
	var target: int
	if _index < 0 and dir > 0:
		target = 0
	elif _index < 0 and dir < 0:
		target = n - 1
	else:
		target = posmod(_index + dir, n)
	_request(target)


func _request(i: int) -> bool:
	if fx != null and fx.is_playing():
		_pending = i
		return true
	if i == _index:
		return true
	if fx == null or _current == null:
		_swap(i)
		return true
	_pending = i
	fx.play(0.4)
	return true


func _on_midpoint() -> void:
	if _pending >= 0:
		var i := _pending
		_pending = -1
		_swap(i)


func _on_finished() -> void:
	if _pending >= 0:
		var i := _pending
		_pending = -1
		_request(i)


func _swap(i: int) -> void:
	if _current != null:
		_current.leave()
		host.remove_child(_current)
		_current.queue_free()
		_current = null
	var entry: Dictionary = channels[i]
	var ch: ChannelBase = null
	if ResourceLoader.exists(entry.scene):
		ch = (load(entry.scene) as PackedScene).instantiate() as ChannelBase
	if ch == null:
		ch = ChannelBase.new()
		ch.placeholder = true
		ch.title = entry.title
	host.add_child(ch)
	host.move_child(ch, 1)
	ch.done.connect(func(): exit_requested.emit())
	_current = ch
	_index = i
	ch.enter(game)
	tuned.emit(entry.id, entry.title, i)


func ok() -> void:
	if _current != null:
		_current.on_ok()


# true when the current channel handled BACK; otherwise the TV is asked to close.
func back() -> bool:
	if _current != null and _current.on_back():
		return true
	exit_requested.emit()
	return false


func stop() -> void:
	if _current != null:
		_current.leave()
		host.remove_child(_current)
		_current.queue_free()
		_current = null
	_index = -1
