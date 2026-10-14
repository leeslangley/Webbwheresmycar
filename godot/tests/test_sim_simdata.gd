extends "res://tests/harness.gd"


func _cases(fn_name: String) -> Array:
	var out: Array = []
	for c in GoldenUtil.load_golden("simdata")["cases"]:
		if c["fn"] == fn_name:
			out.append(c)
	return out


func _check(c: Dictionary, res: Variant, st: Variant = null) -> void:
	var d := GoldenUtil.diff(res, c["result"])
	ok(d == "", "%s result %s" % [c["name"], d])
	if c.has("after"):
		var d2 := GoldenUtil.diff(st, c["after"])
		ok(d2 == "", "%s state %s" % [c["name"], d2])


func test_counts() -> void:
	var cs := _cases("counts")
	ok(cs.size() >= 1, "counts: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var rk: Array = SimData.headline_reactive().keys()
		rk.sort()
		var cd := {"cars": SimData.cars().size(), "job_types": SimData.job_types().size(), "faults": SimData.faults().size(), "adverts": SimData.adverts().size(), "first": SimData.first_names().size(), "last": SimData.last_names().size(), "prefix": SimData.prefixes().size(), "owners": SimData.owners().size(), "generic": SimData.headline_generic().size(), "carworld": SimData.headline_carworld().size(), "reactive_keys": rk}
		_check(c, cd)


func test_model_of() -> void:
	var cs := _cases("model_of")
	ok(cs.size() >= 3, "model_of: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		_check(c, SimData.model_of(a[0]))


func test_job_type_of() -> void:
	var cs := _cases("job_type_of")
	ok(cs.size() >= 2, "job_type_of: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		_check(c, SimData.job_type_of(a[0]))


func test_advert_by_id() -> void:
	var cs := _cases("advert_by_id")
	ok(cs.size() >= 2, "advert_by_id: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		_check(c, SimData.advert_by_id(a[0]))


func test_faults_of_severity() -> void:
	var cs := _cases("faults_of_severity")
	ok(cs.size() >= 3, "faults_of_severity: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var ids: Array = []
		for f in SimData.faults_of_severity(a[0]):
			ids.append(f["id"])
		_check(c, ids)


func test_tier_mult() -> void:
	var cs := _cases("tier_mult")
	ok(cs.size() >= 3, "tier_mult: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		_check(c, SimData.tier_mult(a[0]))
		_check(c, SimData.tier_mult(float(a[0])))


func test_fill_text() -> void:
	var cs := _cases("fill_text")
	ok(cs.size() >= 5, "fill_text: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		_check(c, SimData.fill_text(a[0], a[1]))


func test_customer_name_seq() -> void:
	var cs := _cases("customer_name_seq")
	ok(cs.size() >= 2, "customer_name_seq: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		var out: Array = []
		for i in range(int(a[0])):
			out.append(SimData.customer_name(st))
		_check(c, out, st)


func test_owner_name_seq() -> void:
	var cs := _cases("owner_name_seq")
	ok(cs.size() >= 1, "owner_name_seq: enough golden cases")
	for c: Dictionary in cs:
		var a: Array = c["args"]
		var st: Dictionary = GoldenUtil.copy(c["state"])
		var out: Array = []
		for i in range(int(a[0])):
			out.append(SimData.owner_name(st))
		_check(c, out, st)


func test_simutil() -> void:
	eq(SimUtil.jround(2.5), 3, "jround 2.5")
	eq(SimUtil.jround(-2.5), -2, "jround -2.5")
	eq(SimUtil.jround(0.49), 0, "jround 0.49")
	eq(SimUtil.jround(1234.5), 1235, "jround 1234.5")
	eq(SimUtil.jround(7.0), 7, "jround 7.0")
	ok(typeof(SimUtil.jround(7.0)) == TYPE_INT, "jround returns an int")
	eq(SimUtil.num_str(4), "4", "num_str 4")
	eq(SimUtil.num_str(4.0), "4", "num_str 4.0")
	eq(SimUtil.num_str(2.5), "2.5", "num_str 2.5")
	eq(SimUtil.num_str(0.1), "0.1", "num_str 0.1")
	eq(SimUtil.num_str(-3), "-3", "num_str -3")


func test_fill_text_unknown_var() -> void:
	eq(SimData.fill_text("{car} {customer}", {"car": "X"}), "X {customer}", "missing customer stays as written")
