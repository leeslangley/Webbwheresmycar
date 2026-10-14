class_name SimAdSim
extends RefCounted

# Port of src/sim/adsim.js (DESIGN.md sections 4.8, 8.1). Pay a medium's cost, roll its outcome table,
# gain buzz (and sometimes lose reputation), and read a funny result. One advert costs one day, like every action.
# Pure: randomness only through CoreRng on state.rng, no node access, no dates.


# advertise(state, media_id) -> Dictionary {ok, msg, outcome?}. Mutates state in place.
# ok true means a day has passed; ok false means nothing changed and no day passed.
static func advertise(state: Dictionary, media_id: String) -> Dictionary:
	var medium: Dictionary = SimData.advert_by_id(media_id)
	if medium.is_empty():
		return {"ok": false, "msg": "No such advert"}
	if state["cash"] < medium["cost"]:
		return {"ok": false, "msg": "Not enough money"}

	# Pay up front, then roll the gamble.
	state["cash"] -= medium["cost"]
	var outcome: Dictionary = CoreRng.weighted(state, medium["outcomes"])

	# Buzz and reputation move, both held inside 0-100.
	state["buzz"] = CoreRng.clamp_value(float(state["buzz"]) + float(outcome["buzz"]), 0.0, 100.0)
	state["reputation"] = CoreRng.clamp_value(float(state["reputation"]) + float(outcome["rep"]), 0.0, 100.0)
	state["stats"]["adsRun"] += 1

	# The result note goes in the tray; {medium} becomes the medium's name.
	var picked: String = CoreRng.pick(state, outcome["texts"])
	var text: String = picked.replace("{medium}", String(medium["name"]))
	state["pending"].append(text)

	# A huge buzz gain is worth reacting to on the front page tomorrow.
	if outcome["buzz"] >= 80:
		state["sit"].append("viral")

	SimAdvance.advance_day(state)
	return {
		"ok": true,
		"msg": text,
		"outcome": {"id": outcome["id"], "buzz": outcome["buzz"], "rep": outcome["rep"], "mediaId": media_id},
	}
