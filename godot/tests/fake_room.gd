class_name FakeRoom
extends RoomBase

# Test stand-in for a room or an overlay: records enter and exit, and has the room signals.

signal finished
signal closed
signal news_closed

var entered_with: Dictionary = {}
var left := false
var news_calls := 0


func enter(p: Dictionary = {}) -> void:
	entered_with = p


func exit() -> void:
	left = true


func show_news() -> void:
	news_calls += 1
