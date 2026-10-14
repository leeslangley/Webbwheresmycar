extends "res://tests/harness.gd"

# OfficeChat vs the office.js helpers (daveSit, daveLine, ownedCount, mood line). State from the fake game sample.


func _state() -> Dictionary:
	var s: Dictionary = TestFakeGame.sample_state()
	s["cars"][1]["owned"] = true
	return s


func test_owned_count() -> void:
	eq(OfficeChat.owned_count(_state()), 2, "both sample cars are owned")
	var s: Dictionary = _state()
	s["cars"][0]["owned"] = false
	eq(OfficeChat.owned_count(s), 1, "one car not owned leaves one")


func test_sit_idle() -> void:
	eq(OfficeChat.sit_for(_state()), "idle", "day 12 sample is idle")


func test_sit_newmonth() -> void:
	var s: Dictionary = _state()
	s["day"] = 1
	eq(OfficeChat.sit_for(s), "newmonth", "day 1 is a month start")
	s["day"] = 32
	eq(OfficeChat.sit_for(s), "newmonth", "day 32 is a month start")


func test_sit_auctionday() -> void:
	var s: Dictionary = _state()
	s["day"] = 24
	eq(OfficeChat.sit_for(s), "auctionday", "day 24 is an auction day")


func test_sit_broke_has_priority() -> void:
	var s: Dictionary = _state()
	s["day"] = 24
	s["cash"] = 500
	eq(OfficeChat.sit_for(s), "broke", "broke beats auction day")


func test_sit_rich() -> void:
	var s: Dictionary = _state()
	s["cash"] = 60000
	eq(OfficeChat.sit_for(s), "rich", "cash 60000 is rich")


func test_sit_breakdown() -> void:
	var s: Dictionary = _state()
	s["today"]["events"] = ["The van broke down"]
	eq(OfficeChat.sit_for(s), "breakdown", "last event says broke down")


func test_sit_fullgarage() -> void:
	var s: Dictionary = _state()
	s["garageSlots"] = 2
	eq(OfficeChat.sit_for(s), "fullgarage", "2 owned in 2 slots is full")


func test_sit_emptygarage() -> void:
	var s: Dictionary = _state()
	s["cars"][0]["owned"] = false
	s["cars"][1]["owned"] = false
	eq(OfficeChat.sit_for(s), "emptygarage", "no owned cars is empty")


func test_mood() -> void:
	var s: Dictionary = _state()
	s["cash"] = 31000
	eq(OfficeChat.mood_for(s), "happy", "31000 is happy")
	s["cash"] = 30000
	eq(OfficeChat.mood_for(s), "normal", "30000 is normal")
	s["cash"] = 5000
	eq(OfficeChat.mood_for(s), "normal", "5000 is normal")
	s["cash"] = 1500
	eq(OfficeChat.mood_for(s), "normal", "1500 is normal")
	s["cash"] = 1499
	eq(OfficeChat.mood_for(s), "worried", "1499 is worried")


func test_line_for_from_pool() -> void:
	var s: Dictionary = _state()
	var line: String = OfficeChat.line_for(s)
	ok(line != "", "line is non-empty")
	var pool: Array = Data.chatter()[OfficeChat.sit_for(s)]
	ok(pool.has(line), "line comes from the pool for the situation")


func test_line_for_stable_within_day() -> void:
	var s: Dictionary = _state()
	eq(OfficeChat.line_for(s), OfficeChat.line_for(s), "same state gives the same line twice")


func test_line_for_leaves_rng_alone() -> void:
	var s: Dictionary = _state()
	ok(not s.has("rng"), "sample state has no rng key")
	OfficeChat.line_for(s)
	ok(not s.has("rng"), "line_for does not add an rng key")
	var t: Dictionary = _state()
	t["rng"] = 77
	OfficeChat.line_for(t)
	eq(t["rng"], 77, "line_for keeps an existing rng unchanged")
