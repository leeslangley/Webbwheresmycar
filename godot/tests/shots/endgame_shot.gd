extends Control

# Screenshot scene for the endgame in one of its moods: meta "reason" is "won" or "bankrupt". A fake game
# carries the flags (and, for a win, all four plates). Built deferred so the autoloads exist first.

const FakeGame := preload("res://tests/fake_game.gd")


func _ready() -> void:
	size = Vector2(1280, 720)
	call_deferred("_build")


func _build() -> void:
	var fake = FakeGame.new()
	var reason := str(get_meta("reason", "won"))
	fake.state["flags"] = {"gameOver": true, "won": reason == "won", "reason": reason}
	if reason == "won":
		for k in ["fatcat", "stable", "household", "hammer"]:
			fake.state["plates"][k] = true
	var room: Control = (load("res://scenes/endgame.tscn") as PackedScene).instantiate() as Control
	room.set("game", fake)
	add_child(room)
	room.call("enter")
	room.call("apply_time", 1.3)
