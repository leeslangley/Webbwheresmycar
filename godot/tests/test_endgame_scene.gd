extends "res://tests/harness.gd"

# EndgameRoom (scenes/endgame.tscn): the heading and subline statics, the score lines, and the built
# scene. The room is added to the tree so its _ready runs; the game is a TestFakeGame set before that.
# Taps go through TapUtil.

const SCENE := "res://scenes/endgame.tscn"


func _room(fake: Object) -> EndgameRoom:
	var room := (load(SCENE) as PackedScene).instantiate() as EndgameRoom
	room.game = fake
	tree().root.add_child(room)
	# The test runner does not fire _ready for nodes added to the tree, so it is called by hand.
	# _build() is idempotent, so a real _ready that does fire is harmless.
	room._ready()
	return room


func _done(room: EndgameRoom) -> void:
	tree().root.remove_child(room)
	room.free()


func test_heading_for() -> void:
	eq(EndgameRoom.heading_for({"reason": "won"}), "GOLD! MARK'S A LEGEND", "won heading")
	eq(EndgameRoom.heading_for({"reason": "year-end"}), "THE YEAR IS UP", "year-end heading")
	eq(EndgameRoom.heading_for({"reason": "bankrupt"}), "BANKRUPT! THE BAILIFFS ARRIVE", "bankrupt heading")
	eq(EndgameRoom.heading_for({}), "GAME OVER", "a missing reason falls back to GAME OVER")


func test_subline_for() -> void:
	eq(EndgameRoom.subline_for({"reason": "won"}), "All four Gold Number Plates in one year. Mark buys a round.", "won subline")
	eq(EndgameRoom.subline_for({"reason": "year-end"}), "The bank manager is smiling politely.", "year-end subline")
	eq(EndgameRoom.subline_for({"reason": "bankrupt"}), "Dave takes the kettle. Mark takes the bus.", "bankrupt subline")
	eq(EndgameRoom.subline_for({}), "The year at Webb's Wheels is done.", "fallback subline")


func test_score_lines() -> void:
	var state := TestFakeGame.sample_state()
	var won_lines: Array = EndgameRoom.score_lines(state, true)
	eq(won_lines.size(), 5, "five score lines")
	eq(won_lines[0], "Final score " + str(SimEndGame.final_score(state)), "final score line")
	ok(str(won_lines[1]).begins_with("Rank: GOLD "), "a won rank line carries GOLD")
	var plain_lines: Array = EndgameRoom.score_lines(state, false)
	ok(str(plain_lines[1]).begins_with("Rank: "), "a plain rank line starts with Rank:")
	ok(not str(plain_lines[1]).begins_with("Rank: GOLD"), "a plain rank line has no GOLD")
	eq(won_lines[2], "Net worth " + CoreFormat.money(SimEndGame.net_worth(state)), "net worth line")
	eq(won_lines[3], "Reputation 40", "reputation line")
	eq(won_lines[4], "Jobs done 2", "jobs done line")


func test_scene_won() -> void:
	var fake := TestFakeGame.new()
	fake.state["flags"] = {"gameOver": true, "won": true, "reason": "won"}
	fake.state["plates"]["fatcat"] = true
	var room := _room(fake)
	room.enter()
	var heading := room.ui().get_node("Heading") as Label
	var subline := room.ui().get_node("Subline") as Label
	eq(heading.text, "GOLD! MARK'S A LEGEND", "heading is the won heading")
	eq(heading.get_theme_color("font_color"), UiTheme.color("gold"), "won heading is gold")
	eq(subline.text, "All four Gold Number Plates in one year. Mark buys a round.", "subline is the won subline")
	eq((room.ui().get_node("PlateState0") as Label).text, "WON", "fatcat plate shows WON")
	eq((room.ui().get_node("PlateState1") as Label).text, "missed", "stable plate shows missed")
	eq((room.ui().get_node("PlateName0") as Label).text, SimEndGame.plate_info()["fatcat"]["name"], "first plate is Fat Cat")
	eq((room.ui().get_node("Score0") as Label).text, "Final score " + str(SimEndGame.final_score(fake.state)), "score block is filled")
	eq((room.ui().get_node("BestSale") as Label).text, "Best auction sale " + CoreFormat.money(0.0), "best auction sale line")
	var confetti := room.ui().get_node("Confetti") as Control
	var cloud := room.ui().get_node("Cloud") as Node2D
	eq(confetti.visible, true, "confetti shows for a win")
	eq(cloud.visible, false, "no cloud for a win")

	fake.state["flags"] = {"gameOver": true, "won": false, "reason": "bankrupt"}
	room.refresh()
	eq(heading.text, "BANKRUPT! THE BAILIFFS ARRIVE", "heading follows the bankrupt reason")
	eq(heading.get_theme_color("font_color"), UiTheme.color("ink"), "bankrupt heading is ink")
	eq(confetti.visible, false, "confetti hidden for a bankruptcy")
	eq(cloud.visible, true, "cloud shows for a bankruptcy")
	_done(room)


func test_scene_without_game() -> void:
	var fake := TestFakeGame.new()
	fake.state = {}
	var room := _room(fake)
	room.enter()
	eq((room.ui().get_node("Heading") as Label).text, "GAME OVER", "no game falls back to a fresh state with GAME OVER")
	_done(room)


func test_apply_time() -> void:
	var room := _room(TestFakeGame.new())
	room.apply_time(0.0)
	var confetti := room.ui().get_node("Confetti") as Control
	eq((confetti.get_node("Confetti0") as ColorRect).position, Vector2(100, 50), "piece 0 at the sky's top left")
	var c7 := confetti.get_node("Confetti7") as ColorRect
	near(c7.position.x, 100.0 + round(1 * 180.0) + 11.0, 1e-6, "piece 7 column and lane offset")
	near(c7.position.y, 50.0 + fposmod(287.0, 140.0), 1e-6, "piece 7 fall offset")
	var cloud := room.ui().get_node("Cloud") as Node2D
	eq(cloud.position, Vector2(-50, 150), "cloud starts left of the board")
	room.apply_time(1.0)
	eq((confetti.get_node("Confetti0") as ColorRect).position, Vector2(100, 70), "piece 0 falls 160 px in one second")
	eq(cloud.position, Vector2(-4, 150), "cloud drifts 46 px in one second")
	_done(room)


func test_buttons_and_taps() -> void:
	var room := _room(TestFakeGame.new())
	var again := room.hotspots[&"again"] as UiButton
	var title := room.hotspots[&"title"] as UiButton
	ok(again != null and title != null, "both buttons are stored in hotspots")
	eq(again.kind, "primary", "PLAY AGAIN is the primary button")
	ok(again.size.x >= 64.0 and again.size.y >= 64.0, "PLAY AGAIN is at least 64x64")
	ok(title.size.x >= 64.0 and title.size.y >= 64.0, "TITLE is at least 64x64")
	ok(not Rect2(again.position, again.size).intersects(Rect2(title.position, title.size)), "the two buttons do not overlap")
	var got: Array = []
	room.play_again.connect(func(): got.append("again"))
	room.to_title.connect(func(): got.append("title"))
	TapUtil.tap(again)
	eq(got, ["again"], "a tap on PLAY AGAIN emits play_again")
	TapUtil.tap(title)
	eq(got, ["again", "title"], "a tap on TITLE emits to_title")
	TapUtil.tap_away(again)
	eq(got.size(), 2, "press inside and release outside does not activate")
	eq(room.handle_key(KEY_ENTER), true, "Enter is taken")
	eq(got, ["again", "title", "again"], "Enter emits play_again")
	eq(room.handle_key(KEY_A), false, "other keys are not taken")
	eq(got.size(), 3, "other keys emit nothing")
	_done(room)
