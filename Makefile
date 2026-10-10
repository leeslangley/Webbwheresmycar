JSC ?= /System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc
export JSC

.PHONY: test serve

test:
	sh tools/run_tests.sh

serve:
	sh tools/serve.sh
