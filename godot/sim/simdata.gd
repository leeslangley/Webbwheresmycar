class_name SimData
extends RefCounted

# The one sim file that reads the Data autoload. Ports the lookups and the rng-driven name builders
# of src/data/*.js (modelOf, jobTypeOf, fillText, faultsOfSeverity, TIER_MULT, ADVERT_BY_ID,
# customerName, ownerName, headline pools). Data is returned unchanged (no copies) except where noted.

static var _model_idx: Dictionary = {}
static var _job_idx: Dictionary = {}
static var _advert_idx: Dictionary = {}


# Fill the lookup indexes on first use (they stay filled: the data never changes at run time).
static func _ensure() -> void:
	if _model_idx.is_empty():
		for car in Data.cars():
			_model_idx[car["id"]] = car
	if _job_idx.is_empty():
		for job in Data.jobtypes():
			_job_idx[job["id"]] = job
	if _advert_idx.is_empty():
		for ad in Data.adverts():
			_advert_idx[ad["id"]] = ad


static func cars() -> Array:
	return Data.cars()


# Unknown id: push_error and return an empty Dictionary.
static func model_of(id: String) -> Dictionary:
	_ensure()
	if _model_idx.has(id):
		return _model_idx[id]
	push_error("unknown model " + id)
	return {}


static func job_types() -> Array:
	return Data.jobtypes()


# Unknown id: push_error and return an empty Dictionary.
static func job_type_of(id: String) -> Dictionary:
	_ensure()
	if _job_idx.has(id):
		return _job_idx[id]
	push_error("unknown job " + id)
	return {}


# Fills {customer} and {car} in ONE left-to-right pass. A substituted value is never re-scanned.
# A placeholder whose var is missing or null stays as written.
static func fill_text(template: String, vars: Dictionary) -> String:
	var out := ""
	var i := 0
	var n := template.length()
	while i < n:
		if template.substr(i, 10) == "{customer}" and vars.get("customer") != null:
			out += str(vars["customer"])
			i += 10
		elif template.substr(i, 5) == "{car}" and vars.get("car") != null:
			out += str(vars["car"])
			i += 5
		else:
			out += template.substr(i, 1)
			i += 1
	return out


static func faults() -> Array:
	return Data.faults()


# Faults with that severity, in file order.
static func faults_of_severity(sev: String) -> Array:
	var out: Array = []
	for f in Data.faults():
		if f["severity"] == sev:
			out.append(f)
	return out


# Cost multiplier per car tier. Returns a float (keys are never floats). Unknown tier: push_error, 0.0.
static func tier_mult(tier: Variant) -> float:
	match int(tier):
		1:
			return 1.0
		2:
			return 1.8
		3:
			return 3.5
	push_error("unknown tier " + str(tier))
	return 0.0


static func adverts() -> Array:
	return Data.adverts()


# Unknown id: {} silently.
static func advert_by_id(id: String) -> Dictionary:
	_ensure()
	if _advert_idx.has(id):
		return _advert_idx[id]
	return {}


static func first_names() -> Array:
	return Data.names()["first"]


static func last_names() -> Array:
	return Data.names()["last"]


static func prefixes() -> Array:
	return Data.names()["prefix"]


static func owners() -> Array:
	return Data.owners()


# One rand decides the branch (60% "First Last", 25% "Prefix Last", 15% "The Last Family").
# Each branch picks first before last.
static func customer_name(state: Dictionary) -> String:
	var r := CoreRng.rand(state)
	if r < 0.60:
		var first := str(CoreRng.pick(state, first_names()))
		var last := str(CoreRng.pick(state, last_names()))
		return first + " " + last
	if r < 0.85:
		var prefix := str(CoreRng.pick(state, prefixes()))
		var surname := str(CoreRng.pick(state, last_names()))
		return prefix + " " + surname
	var family := str(CoreRng.pick(state, last_names()))
	return "The " + family + " Family"


static func owner_name(state: Dictionary) -> String:
	return str(CoreRng.pick(state, owners()))


static func headline_generic() -> Array:
	return Data.headlines()["generic"]


static func headline_carworld() -> Array:
	return Data.headlines()["carworld"]


# Situation name -> Array of 5 template strings.
static func headline_reactive() -> Dictionary:
	return Data.headlines()["reactive"]
