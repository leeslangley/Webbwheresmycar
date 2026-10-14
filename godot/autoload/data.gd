extends Node

# Data singleton (GDF03): the JSON tables exported from src/data/*.js by tools/godot/export_data.sh.
# Each table is read once and cached. Lookup helpers return {} or "" for unknown ids; they never error.
# The JS data-module functions (chatterFor, ownerName, customerName, fillText...) are not ported here.

const FALLBACK_PAINT: String = "#888888"

var _cache: Dictionary = {}


func _table(stem: String) -> Variant:
	if not _cache.has(stem):
		_cache[stem] = CoreJson.load_file("res://data/" + stem + ".json")
	return _cache[stem]


func _find_by_id(list: Array, id: String) -> Dictionary:
	for item in list:
		if item is Dictionary and item.get("id") == id:
			return item
	return {}


func adverts() -> Array:
	return _table("adverts")


func archetypes() -> Array:
	return _table("archetypes")


func cars() -> Array:
	return _table("cars")


func chatter() -> Dictionary:
	return _table("chatter")


func faults() -> Array:
	return _table("faults")["faults"]


func faults_tier_mult() -> Dictionary:
	return _table("faults")["tier_mult"]


func headlines() -> Dictionary:
	return _table("headlines")


func jobtypes() -> Array:
	return _table("jobtypes")


func jobs() -> Array:
	return jobtypes()


func names() -> Dictionary:
	return _table("names")


func owners() -> Array:
	return _table("owners")


func paint() -> Dictionary:
	return _table("paint")


func car_by_id(id: String) -> Dictionary:
	return _find_by_id(cars(), id)


func job_type_by_id(id: String) -> Dictionary:
	return _find_by_id(jobtypes(), id)


func advert_by_id(id: String) -> Dictionary:
	return _find_by_id(adverts(), id)


func fault_by_id(id: String) -> Dictionary:
	return _find_by_id(faults(), id)


func paint_of(id: String) -> String:
	var table: Dictionary = paint()
	if table.has(id):
		return str(table[id])
	return FALLBACK_PAINT
