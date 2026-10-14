extends Control

# Screenshot scene for the chrome: main.tscn driven into the office with a fresh game, a line in the speech
# banner, two toasts and a few days of cash history so the HUD strip (plates, CASH, portrait, calendar,
# SALES chart) is fully dressed. Built in a deferred call so the Game autoload exists first.

const LINE := "Mark! The kettle's on and there's a punter in the yard asking about the yellow one. Says it smells of crisps."

var _main: Control = null


func _ready() -> void:
	size = Vector2(1280, 720)
	call_deferred("_build")


func _build() -> void:
	var main: Control = (load("res://scenes/main.tscn") as PackedScene).instantiate() as Control
	add_child(main)
	var g: Node = get_node("/root/Game")
	g.call("new_game", 7)
	var flow: Node = main.get("flow")
	flow.call("go", &"office", {}, "")
	var s: Dictionary = g.get("state")
	s["plates"]["fatcat"] = true
	s["plates"]["household"] = true
	s["reputation"] = 46
	s["buzz"] = 28
	UiCashHistory.reset()
	var cash := [8000.0, 7400.0, 7900.0, 9100.0, 8800.0, 10400.0, 11900.0, 11200.0, 12650.0]
	for i in range(cash.size()):
		UiCashHistory.record(i + 1, cash[i])
	s["day"] = cash.size() + 1
	s["cash"] = 13480
	var hud: Node = main.get_node("Stage/Hud")
	hud.call("refresh", s)
	(hud.get_node("Portrait") as Node).call("set_car", "t1_robbin", Color(Data.paint_of("t1_robbin")), 0.0)
	_main = main
	_say()
	g.emit_signal("toast_requested", "Sold: the Robbin for a tidy profit")
	g.emit_signal("toast_requested", "Reputation up")


# Keeps the transient banner on screen for the shot (software GL frames are slow, so it would fade out).
func _say() -> void:
	_main.call("say", LINE, 360.0)
	(_main.get_node("Stage/Banner") as Node).call("skip")


func _process(_dt: float) -> void:
	if _main != null:
		_say()
