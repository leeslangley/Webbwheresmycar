extends "res://tests/harness.gd"

var d: Node = autoload("Data")


func test_counts_match_js() -> void:
	var c = CoreJson.load_file("res://tests/golden/data_counts.json")
	ok(c is Dictionary, "golden data_counts.json loads")
	if not (c is Dictionary):
		return
	eq(d.adverts().size(), c["adverts"], "adverts count")
	eq(d.archetypes().size(), c["archetypes"], "archetypes count")
	eq(d.cars().size(), c["cars"], "cars count")
	eq(d.chatter().size(), c["chatter"], "chatter count")
	eq(d.faults().size(), c["faults"], "faults count")
	eq(d.faults_tier_mult().size(), c["faults_tier_mult"], "faults tier_mult count")
	eq(d.headlines()["generic"].size(), c["headlines_generic"], "headlines generic count")
	eq(d.headlines()["carworld"].size(), c["headlines_carworld"], "headlines carworld count")
	eq(d.headlines()["reactive"].size(), c["headlines_reactive"], "headlines reactive count")
	eq(d.jobtypes().size(), c["jobtypes"], "jobtypes count")
	eq(d.jobs().size(), d.jobtypes().size(), "jobs alias matches jobtypes")
	eq(d.names()["first"].size(), c["names_first"], "names first count")
	eq(d.names()["last"].size(), c["names_last"], "names last count")
	eq(d.names()["prefix"].size(), c["names_prefix"], "names prefix count")
	eq(d.owners().size(), c["owners"], "owners count")
	eq(d.paint().size(), c["paint"], "paint count")


func test_spot_values() -> void:
	var first_car: Dictionary = d.cars()[0]
	eq(first_car["id"], "t1_allergy", "first car id")
	eq(first_car["basePrice"], 3500, "first car basePrice")
	ok(typeof(first_car["basePrice"]) == TYPE_INT, "basePrice is an int")
	eq(d.car_by_id("t3_aston")["tier"], 3, "aston tier")
	eq(d.car_by_id("nope"), {}, "unknown car is empty dictionary")
	eq(d.paint()["t1_robbin"], "#C9A227", "robbin paint")
	eq(d.paint_of("nope"), "#888888", "unknown paint is grey")
	near(float(d.faults_tier_mult()["2"]), 1.8, 1e-9, "tier 2 multiplier")
	eq(d.fault_by_id("puncture")["severity"], "minor", "puncture severity")
	eq(d.advert_by_id("paper")["name"], "Parish Pump Gazette", "paper advert name")
	ok(typeof(d.owners()[0]) == TYPE_STRING, "first owner is a string")
	eq(d.archetypes()[0], "micro", "first archetype")


func test_cars_unique_ids() -> void:
	var seen: Dictionary = {}
	var keys: Array = ["id", "name", "year", "archetype", "tier", "basePrice"]
	for car in d.cars():
		var id: String = car["id"]
		ok(not seen.has(id), "duplicate car id " + id)
		seen[id] = true
		for key in keys:
			ok(car.has(key), id + " is missing " + key)
