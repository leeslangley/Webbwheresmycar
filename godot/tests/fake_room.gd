class_name FakeRoom
extends RoomBase

# Test stand-in for a room or an overlay: records enter and exit, and has the room signals.

signal finished
signal closed
signal news_closed
signal new_game
signal continue_game
signal open_settings
signal play_again
signal to_title

var entered_with: Dictionary = {}
var left := false
var news_calls := 0
var crt_calls: Array = []


func enter(p: Dictionary = {}) -> void:
	entered_with = p


func exit() -> void:
	left = true


func show_news() -> void:
	news_calls += 1


func set_crt(on: bool) -> void:
	crt_calls.append(on)
