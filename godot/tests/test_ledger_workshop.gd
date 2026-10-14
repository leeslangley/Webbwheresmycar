extends "res://tests/harness.gd"

# Tests for the LEDGER workshop tab (tv/ledger_channel.gd, GDU24): the slot refusal rules, the tab switch, the
# BUY SLOT button and the back key. _ready does not fire in tests, so each test adds the channel to the tree and
# calls _ready by hand. Taps go through TapUtil (a real left-button press and release on the control).


func _make() -> LedgerChannel:
	var ch := (load("res://tv/ledger_channel.tscn") as PackedScene).instantiate() as LedgerChannel
	tree().root.add_child(ch)
	ch.call("_ready")
	return ch


func _tap(btn: UiButton) -> void:
	TapUtil.tap(btn)


func test_refusal() -> void:
	eq(LedgerChannel.slot_refusal(TestFakeGame.sample_state()), "", "the sample state can buy a slot")
	var full := TestFakeGame.sample_state()
	full.garageSlots = 8
	full.cash = 0
	eq(LedgerChannel.slot_refusal(full), "Garage is full-size already", "a full garage is refused even with no cash")
	var poor := TestFakeGame.sample_state()
	poor.cash = 2999
	eq(LedgerChannel.slot_refusal(poor), "Not enough money", "2999 is not enough for a slot")
	poor.cash = 3000
	eq(LedgerChannel.slot_refusal(poor), "", "3000 is enough for a slot")


func test_tabs() -> void:
	var ch := _make()
	var g := TestFakeGame.new()
	ch.enter(g)
	eq(ch.tab, "books", "the channel opens on the books")
	ok(ch.Chart.visible, "the sales chart shows on the books tab")
	ok(not ch.BuySlotBtn.visible, "no buy button on the books tab")
	_tap(ch.TabBtn)
	eq(ch.tab, "workshop", "tapping the tab opens the workshop")
	eq(ch.TabBtn.text, "BOOKS", "the tab button now says BOOKS")
	ok(ch.BuySlotBtn.visible, "the buy button shows in the workshop")
	ok(not ch.Chart.visible, "the sales chart hides in the workshop")
	_tap(ch.TabBtn)
	eq(ch.tab, "books", "tapping the tab again returns to the books")
	eq(ch.TabBtn.text, "WORKSHOP", "the tab button says WORKSHOP again")
	ch.leave()
	ch.free()


func test_buy() -> void:
	var ch := _make()
	var g := TestFakeGame.new()
	ch.enter(g)
	ch.set_tab("workshop")
	_tap(ch.BuySlotBtn)
	eq(g.acts, [{"action": "buy_slot", "params": {}}], "tapping BUY SLOT sends one buy_slot act")
	eq(g.toasts, ["Done"], "the success text is toasted")
	ch.leave()
	ch.free()


func test_refused_buy() -> void:
	var ch := _make()
	var g := TestFakeGame.new()
	ch.enter(g)
	ch.set_tab("workshop")
	g.state.cash = 10
	g.changed.emit()
	ok(not ch.BuySlotBtn.enabled, "BUY SLOT is disabled when the cash is too low")
	_tap(ch.BuySlotBtn)
	eq(g.acts.size(), 0, "a refused tap sends no act")
	eq(g.toasts, ["Not enough money"], "the refusal is toasted")
	ch.leave()
	ch.free()


func test_back() -> void:
	var ch := _make()
	var g := TestFakeGame.new()
	ch.enter(g)
	ch.set_tab("workshop")
	ok(ch.on_back(), "BACK in the workshop is handled there")
	eq(ch.tab, "books", "BACK in the workshop returns to the books")
	ok(not ch.on_back(), "BACK on the books is not handled by the channel")
	ch.leave()
	ch.free()


func test_button_sizes() -> void:
	var ch := _make()
	var g := TestFakeGame.new()
	ch.enter(g)
	ok(ch.TabBtn.size.y >= 72.0, "the tab button is at least 72 px tall")
	ok(ch.BuySlotBtn.size.y >= 72.0, "the buy button is at least 72 px tall")
	ch.leave()
	ch.free()
