JSC ?= /System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc
export JSC

.PHONY: test serve playbot

test:
	sh tools/run_tests.sh

playbot:
	$(JSC) -m tools/playbot.mjs

serve:
	sh tools/serve.sh
