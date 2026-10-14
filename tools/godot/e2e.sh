#!/bin/bash
# e2e.sh: run the end-to-end Godot tests (godot/e2e/e2e_*.gd) headless on CASE, in a live tree. Prints the Godot
# output; last line is E2E OK (exit 0) or E2E FAIL (exit 1). Unit tests stay in gtest.sh.
. "$(dirname "$0")/_common.sh"
ship
OUT=$(ssh -o BatchMode=yes "$HOST" "cd $RDIR && timeout 600 $GODOT_REMOTE --headless --path . --import >/dev/null 2>&1; timeout 600 $GODOT_REMOTE --headless --path . -s res://e2e/e2e_runner.gd" 2>&1); RC=$?
printf '%s\n' "$OUT" | grep -v -E "^(Godot Engine|Vulkan|OpenGL API)"
# Godot keeps running after a runtime error inside a test, so a script error can hide behind a passing exit code.
if printf '%s\n' "$OUT" | grep -q -E 'SCRIPT ERROR|Parse Error'; then echo 'E2E FAIL (script errors above)'; exit 1; fi
exit $RC
