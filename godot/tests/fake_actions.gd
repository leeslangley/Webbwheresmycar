extends RefCounted

# Test helper for test_game.gd: fake sim actions. Static, state Dictionary first, like the real sim ports.


static func double_cash(state: Dictionary, n: int) -> Dictionary:
	state.cash = state.cash * n
	return {"ok": true, "msg": "doubled"}


static func refuse(_state: Dictionary) -> Dictionary:
	return {"ok": false, "msg": "No way"}


static func end_it(state: Dictionary) -> Dictionary:
	state.flags.gameOver = true
	return {"ok": true, "msg": "over"}


static func plain(_state: Dictionary) -> int:
	return 5
