class_name TestFakeGame
extends RefCounted

# Stand-in for the Game autoload in channel and widget tests: same state shape, act() and signals.

signal changed
signal toast_requested(text: String)
signal day_advanced
signal game_over

var state: Dictionary
var acts: Array = []
var toasts: Array[String] = []
var next_result: Dictionary = {"ok": true, "msg": "Done"}


func _init() -> void:
	state = TestFakeGame.sample_state()
	toast_requested.connect(_on_toast)


func _on_toast(t: String) -> void:
	toasts.append(t)


func act(action: String, params: Dictionary = {}) -> Dictionary:
	acts.append({"action": action, "params": params})
	var r: Dictionary = next_result.duplicate(true)
	if r.get("ok", false) == false and str(r.get("msg", "")) != "":
		toast_requested.emit(str(r.msg))
	if r.get("ok", false) == true:
		changed.emit()
	return r


static func sample_state() -> Dictionary:
	return {
		"day": 12,
		"cash": 12345,
		"reputation": 40,
		"buzz": 10,
		"garageSlots": 3,
		"nextId": 20,
		"market": {"priceMult": 1},
		"cars": [
			{
				"id": "c1",
				"modelId": "t1_allergy",
				"owned": true,
				"owner": null,
				"rentMonthly": 0,
				"paid": 3500,
				"condition": 6.0,
				"fault": null,
				"lastServiceDay": 1,
				"jobsDone": 0,
				"boughtDay": 1,
				"impoundedUntil": 0,
				"rentedAtCondition": null,
			},
			{
				"id": "c2",
				"modelId": "t1_robbin",
				"owned": true,
				"owner": null,
				"rentMonthly": 0,
				"paid": 3500,
				"condition": 9.0,
				"fault": {"faultId": "puncture", "label": "Flat tyre", "cost": 80, "severity": "minor"},
				"lastServiceDay": 1,
				"jobsDone": 0,
				"boughtDay": 1,
				"impoundedUntil": 0,
				"rentedAtCondition": null,
			},
		],
		"shop": {
			"listings": [
				{"listingId": "L1", "modelId": "t1_chimp", "mode": "sale", "price": 4000, "condition": 7.0, "owner": null},
				{"listingId": "L2", "modelId": "t1_maurice", "mode": "rent", "price": 240, "condition": 5.5, "owner": "Old Mrs Pym"},
				{"listingId": "L3", "modelId": "t1_cooker", "mode": "sale", "price": 5200, "condition": 8.0, "owner": null},
			],
			"refreshedDay": 10,
		},
		"requests": [
			{
				"id": "Q1",
				"jobTypeId": "wedding",
				"customer": "Mrs Pym",
				"fee": 900,
				"minDesirability": 3,
				"minReliability": 3,
				"minCondition": 6,
				"expiresDay": 14,
				"blurb": "Mrs Pym needs something posh.",
			},
			{
				"id": "Q2",
				"jobTypeId": "wedding",
				"customer": "Mr Trent",
				"fee": 700,
				"minDesirability": 9,
				"minReliability": 3,
				"minCondition": 6,
				"expiresDay": 13,
				"blurb": "Mr Trent wants a grand arrival.",
			},
		],
		"stats": {"jobsDone": 2, "jobsFailed": 1, "adsRun": 3, "carsBought": 1, "carsSold": 0, "bestAuctionSale": 0, "faults": 1},
		"plates": {"fatcat": false, "stable": false, "household": false, "hammer": false},
		"headlines": ["Local vicar buys round of tea", "Pigeon wins raffle"],
		"today": {
			"day": 12,
			"headline": "Local vicar buys round of tea",
			"events": ["Bought nothing. Lovely.", "Dave found a spanner."],
			"monthReport": null,
		},
		"flags": {"gameOver": false, "won": false, "reason": ""},
		"auction": {"month": 1, "lots": [], "consigned": [], "lastResults": []},
		"pending": [],
		"sit": [],
		"log": [],
	}
