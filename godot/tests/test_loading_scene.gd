extends "res://tests/harness.gd"

# LoadingRoom: segment bar, road dashes, car marker, status line and the leave rule. The runner never
# enters the scene tree, so _ready does not fire: _room() calls _ready() by hand after progress_fn is set.
# No frames run and _process is never called; tick() is called by hand.

const GREEN := Color("3FAE49")


func _room(fn: Callable = Callable()) -> LoadingRoom:
	var r := LoadingRoom.new()
	r.progress_fn = fn
	r._ready()
	return r


func _drop(r: Node) -> void:
	r.free()


func _seg(r: LoadingRoom, i: int) -> ColorRect:
	return r.find_child("Seg%d" % i, true, false) as ColorRect


func _dash(r: LoadingRoom, k: int) -> ColorRect:
	return r.find_child("Dash%d" % k, true, false) as ColorRect


func _car(r: LoadingRoom) -> Node2D:
	return r.find_child("Car", true, false) as Node2D


func _status(r: LoadingRoom) -> Label:
	return r.find_child("Status", true, false) as Label


func test_nothing_to_load_leaves_at_once() -> void:
	var r := _room()
	var got: Array = []
	r.finished.connect(func(): got.append(1))
	r.tick(0.0)
	eq(got.size(), 1, "finished fires on the first tick when nothing is preloaded")
	r.tick(0.1)
	eq(got.size(), 1, "finished fires only once")
	_drop(r)


func test_partial_then_ready() -> void:
	var st := {"done": 5, "total": 20, "ready": false}
	var r := _room(func(): return st)
	var got: Array = []
	r.finished.connect(func(): got.append(1))
	r.tick(0.1)
	for i in 5:
		eq(_seg(r, i).color, GREEN, "Seg%d is lit" % i)
	ok(_seg(r, 5).color != GREEN, "Seg5 is not lit")
	near(_car(r).position.x, 490.0, 1e-6, "car at 25 percent of the road")
	eq(_status(r).text, "REVVING UP", "status at elapsed 0.1")
	eq(got.size(), 0, "no finished while partly loaded")
	r.tick(0.3)
	eq(_status(r).text, "REVVING UP.", "one dot at elapsed 0.4")
	st.done = 20
	st.ready = true
	r.tick(0.1)
	eq(got.size(), 0, "no finished below MIN_SHOW once ready (elapsed 0.5)")
	r.tick(0.2)
	eq(got.size(), 1, "finished fires once ready and past MIN_SHOW (elapsed 0.7)")
	for i in 20:
		eq(_seg(r, i).color, GREEN, "Seg%d is lit when ready" % i)
	near(_car(r).position.x, 940.0, 1e-6, "car at the end of the road when ready")
	_drop(r)


func test_timeout_goes_anyway() -> void:
	var st := {"done": 3, "total": 20, "ready": false}
	var r := _room(func(): return st)
	var got: Array = []
	r.finished.connect(func(): got.append(1))
	r.tick(8.0)
	eq(got.size(), 1, "finished fires at MAX_SHOW even if never ready")
	eq(_status(r).text, "STILL REVVING - GOING ANYWAY", "timeout status line")
	r.tick(0.5)
	eq(got.size(), 1, "still only one finished after the timeout")
	_drop(r)


func test_dashes_scroll() -> void:
	var r := _room(func(): return {"done": 0, "total": 20, "ready": false})
	r.tick(0.0)
	eq(_dash(r, 0).position.x, 0.0, "Dash0 at 0 when elapsed is 0")
	_drop(r)
	var r2 := _room(func(): return {"done": 0, "total": 20, "ready": false})
	r2.tick(0.5)
	eq(_dash(r2, 0).position.x, -5.0, "Dash0 scrolled by fposmod(45, 40) = 5")
	eq(_dash(r2, 1).position.x, 35.0, "Dash1 one period after Dash0")
	_drop(r2)
