#!/bin/bash
# gtest.sh [test_name ...]: run the Godot tests headless on CASE. Prints the Godot output; last line is
# GDTEST OK (exit 0) or GDTEST FAIL (exit 1). With names, runs only those test files (test_<name>.gd stems).
. "$(dirname "$0")/_common.sh"
ship
ssh -o BatchMode=yes "$HOST" "cd $RDIR && timeout 600 $GODOT_REMOTE --headless --path . --import >/dev/null 2>&1; timeout 600 $GODOT_REMOTE --headless --path . -s res://tests/runner.gd -- $*" 2>&1 | grep -v -E "^(Godot Engine|Vulkan|OpenGL API)"
exit ${PIPESTATUS[0]}
