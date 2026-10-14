extends Control

# Screenshot scene for the TV with the channel manager wired: a black 1280x720 backdrop, the TV at (260, 40),
# tuned to SHOP (no channel scene yet, so the placeholder shows NO SIGNAL under the SHOP title).
# Two harness constraints shape this file. tools/godot/shot.gd loads the scene inside its _init, before the
# Data autoload exists, so the Tv classes must not be named here (they would compile too early); the Tv is
# built in a deferred call instead, and typed as Control. The fake game is preloaded by path because the
# TestFakeGame class_name does not resolve under gshot.

const FakeGame := preload("res://tests/fake_game.gd")


func _ready() -> void:
	size = Vector2(1280, 720)
	var backdrop := ColorRect.new()
	backdrop.color = Color.BLACK
	backdrop.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(backdrop)
	call_deferred("_build_tv")


func _build_tv() -> void:
	var tv: Control = (load("res://tv/tv.tscn") as PackedScene).instantiate() as Control
	tv.position = Vector2(260, 40)
	add_child(tv)
	tv.call("setup", FakeGame.new())
	tv.call("tune", "shop")
