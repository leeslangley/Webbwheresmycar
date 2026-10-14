extends SceneTree

# Headless test runner: godot --headless --path godot -s res://tests/runner.gd -- [test_name ...]
# No names: every res://tests/test_*.gd. Last printed line is GDTEST OK (exit 0) or GDTEST FAIL (exit 1).

var _failures: int = 0
var _tests_run: int = 0


func _initialize() -> void:
	var args: PackedStringArray = OS.get_cmdline_user_args()
	var files: Array[String] = []
	if args.is_empty():
		for f in DirAccess.get_files_at("res://tests"):
			if f.begins_with("test_") and f.ends_with(".gd"):
				files.append(f)
		files.sort()
	else:
		for a in args:
			var stem: String = a
			if not stem.begins_with("test_"):
				stem = "test_" + stem
			if not stem.ends_with(".gd"):
				stem += ".gd"
			files.append(stem)
	for file in files:
		_run_file(file)
	if _failures == 0 and _tests_run > 0:
		print("GDTEST OK")
		quit(0)
	else:
		print("GDTEST FAIL")
		quit(1)


func _run_file(file: String) -> void:
	var sc = load("res://tests/" + file)
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
