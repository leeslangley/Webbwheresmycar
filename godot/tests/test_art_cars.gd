extends "res://tests/harness.gd"

# GDA19: every car in the manifest loads as a glb, shows in a CarView with the part classes the game needs,
# and has the manifest facts the game relies on. Tests build the scene and call build() themselves; no SceneTree.


func test_every_car() -> void:
	var cars: Dictionary = CarView.manifest().get("cars", {})
	ok(cars.size() >= 8, "manifest has 8 cars")
	var cv := (load("res://art/carview.tscn") as PackedScene).instantiate() as CarView
	cv.build()
	var ids: Array = cars.keys()
	ids.sort()
	for id in ids:
		var entry: Dictionary = cars[id]
		var ps: Resource = load("res://art/cars/%s.glb" % id)
		ok(ps is PackedScene, "%s: glb loads as a PackedScene" % id)
		ok(cv.set_car(id), "%s: set_car is true" % id)
		var classes := cv.surface_classes()
		for k in classes.keys():
			ok(CarMats.CLASSES.has(k), "%s: part class '%s' is a known class" % [id, k])
		ok(int(classes.get("paint", 0)) >= 1, "%s: paint surfaces >= 1" % id)
		ok(int(classes.get("tyre", 0)) >= 3, "%s: tyre surfaces >= 3" % id)

		var len_mm := float(entry.get("len_mm", 0))
		ok(len_mm >= 2500.0 and len_mm <= 7000.0, "%s: len_mm %s is between 2500 and 7000" % [id, str(len_mm)])
		var bmin: Array = entry.get("bbox_min", [0.0, 0.0, 0.0])
		var bmax: Array = entry.get("bbox_max", [0.0, 0.0, 0.0])
		var span := float(bmax[0]) - float(bmin[0])
		ok(span >= 9.5 and span <= 10.6, "%s: bbox x span %s is between 9.5 and 10.6" % [id, str(span)])
		var lift := float(bmin[1])
		ok(lift >= -0.05 and lift <= 1.0, "%s: bbox_min y %s is between -0.05 and 1.0" % [id, str(lift)])
		ok(int(entry.get("wheels", 0)) >= 2, "%s: wheels is at least 2" % id)

		var gname := str(entry.get("game_name", ""))
		ok(gname != "", "%s: game_name is not empty" % id)
		var ascii := true
		for i in range(gname.length()):
			var code: int = gname.unicode_at(i)
			if code > 126:
				ascii = false
		ok(ascii, "%s: game_name '%s' is ASCII" % [id, gname])

		var paints: Array = entry.get("paints", [])
		ok(paints.size() >= 1, "%s: paints has at least 1 entry" % id)
		for p in paints:
			var hex := str(p)
			ok(hex.begins_with("#") and hex.length() == 7, "%s: paint '%s' is #RRGGBB" % [id, hex])

		cv.set_wear(3.0)
		cv.set_paint(Color("3b4a2f"))
		ok(not cv.paint_materials().is_empty(), "%s: paint_materials is not empty after wear and paint" % id)
	cv.free()


func test_names() -> void:
	var cars: Dictionary = CarView.manifest().get("cars", {})
	var seen := {}
	for id in cars.keys():
		var gname := str(cars[id].get("game_name", ""))
		ok(not seen.has(gname), "%s: game_name '%s' is not unique" % [id, gname])
		seen[gname] = true
