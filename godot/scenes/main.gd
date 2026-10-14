class_name Main
extends Control

# Root scene of the Godot rebuild. A dark Backdrop fills any window. A centred 1280x720 Stage holds everything
# interactive, drawn in this order: Scenes (SceneHost), Hud (UiHud), Banner (UiBanner), Toasts (UiToast),
# Tooltip (UiTooltip) and Fade (a black ColorRect for transitions). stage_safe says how far a phone's
# safe-area inset cuts into the Stage (all zeros when there is no safe area to read).

const STAGE := Vector2(1280, 720)

var stage_safe: Dictionary = {"left": 0.0, "top": 0.0, "right": 0.0, "bottom": 0.0}
var auto_start := true
var flow: Flow = null


func _ready() -> void:
	build()
	layout()
	if not is_inside_tree():
		# Headless tests run outside the tree, so the flow is made here too.
		make_flow()
		return
	var vp := get_viewport()
	if not vp.size_changed.is_connected(layout):
		vp.size_changed.connect(layout)
	var g := get_node_or_null("/root/Game")
	if g != null and g.get("state") != null:
		bind_game(g)
	make_flow()


# Creates the Flow child once and hands it this Main (which starts the first room when auto_start is set).
func make_flow() -> void:
	if flow != null:
		return
	flow = Flow.new()
	flow.name = "Flow"
	flow.auto_start = auto_start
	add_child(flow)
	flow.attach(self)


# Creates the layers once. Does nothing when they already exist.
func build() -> void:
	if get_node_or_null("Backdrop") != null:
		return
	var backdrop := ColorRect.new()
	backdrop.name = "Backdrop"
	backdrop.set_anchors_preset(Control.PRESET_FULL_RECT)
	backdrop.color = UiTheme.color("ink")
	backdrop.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(backdrop)

	var stage := Control.new()
	stage.name = "Stage"
	stage.size = STAGE
	add_child(stage)

	var scenes := SceneHost.new()
	scenes.name = "Scenes"
	scenes.position = Vector2.ZERO
	scenes.size = STAGE
	stage.add_child(scenes)

	var hud := UiHud.new()
	hud.name = "Hud"
	hud.position = Vector2(0, 590)
	stage.add_child(hud)

	var banner := UiBanner.new()
	banner.name = "Banner"
	banner.position = Vector2(24, 4)
	stage.add_child(banner)

	var toasts := UiToast.new()
	toasts.name = "Toasts"
	toasts.size = STAGE
	stage.add_child(toasts)

	var tooltip := UiTooltip.new()
	tooltip.name = "Tooltip"
	stage.add_child(tooltip)

	var fade := ColorRect.new()
	fade.name = "Fade"
	fade.size = STAGE
	fade.color = Color(0, 0, 0, 0)
	fade.mouse_filter = Control.MOUSE_FILTER_IGNORE
	stage.add_child(fade)


# Centres the Stage in the window and works out the safe-area insets for it.
func layout() -> void:
	var canvas := get_viewport_rect().size if is_inside_tree() else STAGE
	var stage: Control = get_node("Stage")
	stage.position = stage_position(canvas)
	var win := Vector2(DisplayServer.window_get_size())
	if win.x <= 0.0 or win.y <= 0.0:
		stage_safe = {"left": 0.0, "top": 0.0, "right": 0.0, "bottom": 0.0}
		return
	var safe := Rect2(DisplayServer.get_display_safe_area())
	stage_safe = stage_insets(safe_insets(win, safe, canvas), stage.position)


func bind_game(game: Object) -> void:
	if not game.is_connected("toast_requested", _on_toast):
		game.connect("toast_requested", _on_toast)
	get_node("Stage/Hud").bind(game)


func show_hud(on: bool) -> void:
	get_node("Stage/Hud").visible = on


func say(text: String, tail_x: float = -1.0) -> void:
	get_node("Stage/Banner").say(text, tail_x)


# Fades the Fade layer to alpha. A duration of 0 or less sets it at once and returns null.
func fade_to(alpha: float, duration: float = 0.25) -> Tween:
	var fade: ColorRect = get_node("Stage/Fade")
	if duration <= 0.0:
		var c := fade.color
		c.a = alpha
		fade.color = c
		return null
	var tw := create_tween()
	tw.tween_property(fade, "color:a", alpha, duration)
	return tw


func scenes() -> SceneHost:
	return get_node("Stage/Scenes") as SceneHost


func _on_toast(text: String) -> void:
	get_node("Stage/Toasts").show_text(text)


static func stage_position(canvas: Vector2) -> Vector2:
	return Vector2(floorf(maxf(0.0, canvas.x - STAGE.x) / 2.0), floorf(maxf(0.0, canvas.y - STAGE.y) / 2.0))


# Converts the safe area (window pixels) into canvas units: the distance from each window edge to the safe rect.
static func safe_insets(screen: Vector2, safe: Rect2, canvas: Vector2) -> Dictionary:
	var s: float = canvas.x / screen.x
	return {
		"left": safe.position.x * s,
		"top": safe.position.y * s,
		"right": (screen.x - safe.end.x) * s,
		"bottom": (screen.y - safe.end.y) * s,
	}


# How far the safe area cuts into the Stage: the inset minus the Stage offset, never below zero.
static func stage_insets(ins: Dictionary, stage_pos: Vector2) -> Dictionary:
	return {
		"left": maxf(0.0, float(ins["left"]) - stage_pos.x),
		"right": maxf(0.0, float(ins["right"]) - stage_pos.x),
		"top": maxf(0.0, float(ins["top"]) - stage_pos.y),
		"bottom": maxf(0.0, float(ins["bottom"]) - stage_pos.y),
	}
