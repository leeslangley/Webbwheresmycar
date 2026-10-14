extends SceneTree

# End-to-end runner: godot --headless --path godot -s res://e2e/e2e_runner.gd
# Runs every test_* method of res://e2e/e2e_*.gd (except this file) from a live tree, after the first frames,
# so Main and Flow get _ready and enter() the way they do in the game. The unit runner (tests/runner.gd) never
# runs these files. Last printed line is E2E OK (exit 0) or E2E FAIL (exit 1).

var _failures: int = 0
var _tests_run: int = 0


func _initialize() -> void:
	call_deferred("_go")


func _go() -> void:
	await process_frame
	await process_frame
	var files: Array[String] = []
	for f in DirAccess.get_files_at("res://e2e"):
		if f.begins_with("e2e_") and f.ends_with(".gd") and f != "e2e_runner.gd":
			files.append(f)
	files.sort()
	for file in files:
		_run_file(file)
	if _failures == 0 and _tests_run > 0:
		print("E2E OK")
		quit(0)
	else:
		print("E2E FAIL")
		quit(1)


func _run_file(file: String) -> void:
	var sc = load("res://e2e/" + file)
	if sc == null or not sc.can_instantiate():
		print("FAIL " + file + ": could not load or parse")
		_failures += 1
		return
	var t = sc.new()
	if t == null:
		print("FAIL " + file + ": could not load or parse")
		_failures += 1
		return
	var names: Array[String] = []
	for m in t.get_method_list():
		var n: String = m["name"]
		if n.begins_with("test_"):
			names.append(n)
	names.sort()
	for test_name in names:
		t.current_test = test_name
		t.before_each()
		var before: int = t.checks
		t.call(test_name)
		_tests_run += 1
		if t.checks == before:
			t.failures.append(test_name + ": made no checks")
	var fails: Array = t.failures
	if fails.is_empty():
		print("PASS %s (%d checks)" % [file, t.checks])
	else:
		print("FAIL " + file)
		for f in fails:
			print("  " + str(f))
		_failures += fails.size()
