JSC ?= /System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc
export JSC

.PHONY: test serve playbot art-profiles gtest

test:
	sh tests/run_dossier_check.sh
	sh tools/run_tests.sh

art-profiles:
	$(JSC) -m tools/art/export_profiles.mjs > tools/art/profiles.json

playbot:
	$(JSC) -m tools/playbot.mjs

serve:
	sh tools/serve.sh

gtest:
	sh tools/godot/gtest.sh
