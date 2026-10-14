extends Control

# Screenshot scene for the car paint colour (GDA21): a mid-grey backdrop and ONE CarView (t1_chimp, side view,
# wear 0) painted the default orange, centred at 640x360 and sized 800x400. Size 1280x720.


func _ready() -> void:
	size = Vector2(1280, 720)
	var bg := ColorRect.new()
	bg.color = Color("#808080")
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)
	var cv := CarView.new()
	cv.size = Vector2(800, 400)
	cv.position = Vector2(240, 160)
	add_child(cv)
	cv.set_car("t1_chimp")
	cv.set_view("side")
	cv.set_wear(0.0)
	cv.set_paint(Color("c96f32"))
