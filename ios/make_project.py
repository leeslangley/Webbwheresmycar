#!/usr/bin/env python3
"""Generate ios/WebbWheresMyCar.xcodeproj (project.pbxproj + shared scheme).

Run from the repo root:

	python3 ios/make_project.py

Also bootstraps an empty ios/www/index.html when ios/www is missing, so the
project builds on its own. Object identifiers are 24 hex characters derived
deterministically from md5(name), so regenerating gives identical output.
Set BUILD_NUMBER to stamp CURRENT_PROJECT_VERSION (default 1).
"""

import hashlib
import os
from pathlib import Path

IOS = Path(__file__).resolve().parent
PROJECT_DIR = IOS / "WebbWheresMyCar.xcodeproj"

APP_NAME = "WebbWheresMyCar"
BUNDLE_ID = "com.leelangley.webbwheresmycar"
DEVELOPMENT_TEAM = "G3G9X5XV82"
ASSETS_NAME = "Assets.xcassets"
BUILD_NUMBER = os.environ.get("BUILD_NUMBER", "1")


def oid(name):
	"""Deterministic 24-hex-character object id from md5(name)."""
	return hashlib.md5(name.encode("utf-8")).hexdigest()[:24]


swift_sources = sorted(p.name for p in (IOS / "Sources").glob("*.swift"))
if not swift_sources:
	raise SystemExit("no Swift sources found in ios/Sources")

NAMES = {
	"project": "Project object",
	"main_group": "main",
	"products_group": "Products",
	"sources_group": "Sources",
	"target": "target:" + APP_NAME,
	"product": "product:" + APP_NAME + ".app",
	"phase_sources": "phase:Sources",
	"phase_frameworks": "phase:Frameworks",
	"phase_resources": "phase:Resources",
	"cfglist_target": "cfglist:target:" + APP_NAME,
	"cfglist_project": "cfglist:project",
	"cfg_target_debug": "config:target:Debug",
	"cfg_target_release": "config:target:Release",
	"cfg_project_debug": "config:project:Debug",
	"cfg_project_release": "config:project:Release",
	"file:" + ASSETS_NAME: "file:" + ASSETS_NAME,
	"buildfile:" + ASSETS_NAME: "buildfile:" + ASSETS_NAME,
	"file:www": "file:www",
	"buildfile:www": "buildfile:www",
}
for src in swift_sources:
	NAMES["file:" + src] = "file:" + src
	NAMES["buildfile:" + src] = "buildfile:" + src

ID = {}
_seen = set()
for _key, _name in NAMES.items():
	_digest = oid(_name)
	if _digest in _seen:
		raise SystemExit("object id collision for md5(%r)" % _name)
	_seen.add(_digest)
	ID[_key] = _digest


def pbx_build_file(bf_key, fr_key, name, phase):
	return (
		"\t\t%s /* %s in %s */ = {isa = PBXBuildFile; fileRef = %s /* %s */; };\n"
		% (ID[bf_key], name, phase, ID[fr_key], name)
	)


def pbx_file_ref(fr_key, name, file_type):
	return (
		'\t\t%s /* %s */ = {isa = PBXFileReference; lastKnownFileType = %s; path = %s; sourceTree = "<group>"; };\n'
		% (ID[fr_key], name, file_type, name)
	)


def build_pbxproj():
	src_refs = "".join(
		"\t\t\t\t%s /* %s */,\n" % (ID["file:" + s], s) for s in swift_sources
	)
	src_build_files = "".join(
		pbx_build_file("buildfile:" + s, "file:" + s, s, "Sources") for s in swift_sources
	)
	res_build_files = (
		pbx_build_file("buildfile:" + ASSETS_NAME, "file:" + ASSETS_NAME, ASSETS_NAME, "Resources")
		+ pbx_build_file("buildfile:www", "file:www", "www", "Resources")
	)
	src_file_refs = "".join(pbx_file_ref("file:" + s, s, "sourcecode.swift") for s in swift_sources)
	src_phase_files = "".join(
		"\t\t\t\t%s /* %s in Sources */,\n" % (ID["buildfile:" + s], s) for s in swift_sources
	)

	pbxproj = """// !$*UTF8*$!
{
	archiveVersion = 1;
	classes = {
	};
	objectVersion = 56;
	objects = {

/* Begin PBXBuildFile section */
__SRC_BUILD_FILES__\
__RES_BUILD_FILES__\
/* End PBXBuildFile section */

/* Begin PBXFileReference section */
__SRC_FILE_REFS__\
		__ID_FILE_ASSETS__ /* __ASSETS_NAME__ */ = {isa = PBXFileReference; lastKnownFileType = folder.assetcatalog; path = __ASSETS_NAME__; sourceTree = "<group>"; };
		__ID_FILE_WWW__ /* www */ = {isa = PBXFileReference; lastKnownFileType = folder; path = www; sourceTree = "<group>"; };
		__ID_PRODUCT__ /* __APP_NAME__.app */ = {isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = __APP_NAME__.app; sourceTree = BUILT_PRODUCTS_DIR; };
/* End PBXFileReference section */

/* Begin PBXFrameworksBuildPhase section */
		__ID_PHASE_FRAMEWORKS__ /* Frameworks */ = {
			isa = PBXFrameworksBuildPhase;
			buildActionMask = 2147483647;
			files = (
			);
			runOnlyForDeploymentPostprocessing = 0;
		};
/* End PBXFrameworksBuildPhase section */

/* Begin PBXGroup section */
		__ID_SOURCES_GROUP__ /* Sources */ = {
			isa = PBXGroup;
			children = (
__SRC_REFS__			);
			path = Sources;
			sourceTree = "<group>";
		};
		__ID_PRODUCTS_GROUP__ /* Products */ = {
			isa = PBXGroup;
			children = (
				__ID_PRODUCT__ /* __APP_NAME__.app */,
			);
			name = Products;
			sourceTree = "<group>";
		};
		__ID_MAIN_GROUP__ = {
			isa = PBXGroup;
			children = (
				__ID_SOURCES_GROUP__ /* Sources */,
				__ID_PRODUCTS_GROUP__ /* Products */,
				__ID_FILE_ASSETS__ /* __ASSETS_NAME__ */,
				__ID_FILE_WWW__ /* www */,
			);
			sourceTree = "<group>";
		};
/* End PBXGroup section */

/* Begin PBXNativeTarget section */
		__ID_TARGET__ /* __APP_NAME__ */ = {
			isa = PBXNativeTarget;
			buildConfigurationList = __ID_CFGLIST_TARGET__ /* Build configuration list for PBXNativeTarget "__APP_NAME__" */;
			buildPhases = (
				__ID_PHASE_SOURCES__ /* Sources */,
				__ID_PHASE_FRAMEWORKS__ /* Frameworks */,
				__ID_PHASE_RESOURCES__ /* Resources */,
			);
			buildRules = (
			);
			dependencies = (
			);
			name = __APP_NAME__;
			productName = __APP_NAME__;
			productReference = __ID_PRODUCT__ /* __APP_NAME__.app */;
			productType = "com.apple.product-type.application";
		};
/* End PBXNativeTarget section */

/* Begin PBXProject section */
		__ID_PROJECT__ /* Project object */ = {
			isa = PBXProject;
			attributes = {
				BuildIndependentTargetsInParallel = 1;
				LastSwiftUpdateCheck = 1400;
				LastUpgradeCheck = 1400;
				TargetAttributes = {
					__ID_TARGET__ = {
						CreatedOnToolsVersion = 14.0;
					};
				};
			};
			buildConfigurationList = __ID_CFGLIST_PROJECT__ /* Build configuration list for PBXProject "__APP_NAME__" */;
			compatibilityVersion = "Xcode 14.0";
			developmentRegion = en;
			hasScannedForEncodings = 0;
			knownRegions = (
				en,
				Base,
			);
			mainGroup = __ID_MAIN_GROUP__;
			productRefGroup = __ID_PRODUCTS_GROUP__ /* Products */;
			projectDirPath = "";
			projectRoot = "";
			targets = (
				__ID_TARGET__ /* __APP_NAME__ */,
			);
		};
/* End PBXProject section */

/* Begin PBXResourcesBuildPhase section */
		__ID_PHASE_RESOURCES__ /* Resources */ = {
			isa = PBXResourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
				__ID_BUILDFILE_ASSETS__ /* __ASSETS_NAME__ in Resources */,
				__ID_BUILDFILE_WWW__ /* www in Resources */,
			);
			runOnlyForDeploymentPostprocessing = 0;
		};
/* End PBXResourcesBuildPhase section */

/* Begin PBXSourcesBuildPhase section */
		__ID_PHASE_SOURCES__ /* Sources */ = {
			isa = PBXSourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
__SRC_PHASE_FILES__			);
			runOnlyForDeploymentPostprocessing = 0;
		};
/* End PBXSourcesBuildPhase section */

/* Begin XCBuildConfiguration section */
		__ID_CFG_PROJECT_DEBUG__ /* Debug */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				ALWAYS_SEARCH_USER_PATHS = NO;
				CLANG_ENABLE_MODULES = YES;
				CLANG_ENABLE_OBJC_ARC = YES;
				COPY_PHASE_STRIP = NO;
				DEBUG_INFORMATION_FORMAT = dwarf;
				ENABLE_STRICT_OBJC_MSGSEND = YES;
				ENABLE_TESTABILITY = YES;
				GCC_C_LANGUAGE_STANDARD = gnu11;
				GCC_DYNAMIC_NO_PIC = NO;
				GCC_NO_COMMON_BLOCKS = YES;
				GCC_OPTIMIZATION_LEVEL = 0;
				IPHONEOS_DEPLOYMENT_TARGET = 16.0;
				MTL_ENABLE_DEBUG_INFO = INCLUDE_SOURCE;
				ONLY_ACTIVE_ARCH = YES;
				SDKROOT = iphoneos;
				/* NOTE: DEBUG is deliberately NOT defined as a Swift compilation
				   condition. GameViewController.swift calls WKWebView.isInspectable
				   (iOS 16.4+) inside #if DEBUG; with the 16.0 deployment target the
				   build only succeeds when that block is compiled out. */
				SWIFT_OPTIMIZATION_LEVEL = "-Onone";
			};
			name = Debug;
		};
		__ID_CFG_PROJECT_RELEASE__ /* Release */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				ALWAYS_SEARCH_USER_PATHS = NO;
				CLANG_ENABLE_MODULES = YES;
				CLANG_ENABLE_OBJC_ARC = YES;
				COPY_PHASE_STRIP = NO;
				DEBUG_INFORMATION_FORMAT = "dwarf-with-dsym";
				ENABLE_STRICT_OBJC_MSGSEND = YES;
				GCC_C_LANGUAGE_STANDARD = gnu11;
				GCC_DYNAMIC_NO_PIC = NO;
				GCC_NO_COMMON_BLOCKS = YES;
				IPHONEOS_DEPLOYMENT_TARGET = 16.0;
				MTL_ENABLE_DEBUG_INFO = NO;
				SDKROOT = iphoneos;
				SWIFT_OPTIMIZATION_LEVEL = "-O";
				VALIDATE_PRODUCT = YES;
			};
			name = Release;
		};
		__ID_CFG_TARGET_DEBUG__ /* Debug */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
				CODE_SIGN_STYLE = Automatic;
				CURRENT_PROJECT_VERSION = "__BUILD_NUMBER__";
				DEVELOPMENT_TEAM = __DEVELOPMENT_TEAM__;
				GENERATE_INFOPLIST_FILE = NO;
				INFOPLIST_FILE = Info.plist;
				IPHONEOS_DEPLOYMENT_TARGET = 16.0;
				LD_RUNPATH_SEARCH_PATHS = (
					"$(inherited)",
					"@executable_path/Frameworks",
				);
				MARKETING_VERSION = 0.1;
				PRODUCT_BUNDLE_IDENTIFIER = __BUNDLE_ID__;
				PRODUCT_NAME = "$(TARGET_NAME)";
				SDKROOT = iphoneos;
				SWIFT_EMIT_LOC_STRINGS = YES;
				SWIFT_VERSION = 5.0;
				TARGETED_DEVICE_FAMILY = 1;
			};
			name = Debug;
		};
		__ID_CFG_TARGET_RELEASE__ /* Release */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
				CODE_SIGN_STYLE = Automatic;
				CURRENT_PROJECT_VERSION = "__BUILD_NUMBER__";
				DEVELOPMENT_TEAM = __DEVELOPMENT_TEAM__;
				GENERATE_INFOPLIST_FILE = NO;
				INFOPLIST_FILE = Info.plist;
				IPHONEOS_DEPLOYMENT_TARGET = 16.0;
				LD_RUNPATH_SEARCH_PATHS = (
					"$(inherited)",
					"@executable_path/Frameworks",
				);
				MARKETING_VERSION = 0.1;
				PRODUCT_BUNDLE_IDENTIFIER = __BUNDLE_ID__;
				PRODUCT_NAME = "$(TARGET_NAME)";
				SDKROOT = iphoneos;
				SWIFT_EMIT_LOC_STRINGS = YES;
				SWIFT_VERSION = 5.0;
				TARGETED_DEVICE_FAMILY = 1;
			};
			name = Release;
		};
/* End XCBuildConfiguration section */

/* Begin XCConfigurationList section */
		__ID_CFGLIST_PROJECT__ /* Build configuration list for PBXProject "__APP_NAME__" */ = {
			isa = XCConfigurationList;
			buildConfigurations = (
				__ID_CFG_PROJECT_DEBUG__ /* Debug */,
				__ID_CFG_PROJECT_RELEASE__ /* Release */,
			);
			defaultConfigurationIsVisible = 0;
			defaultConfigurationName = Release;
		};
		__ID_CFGLIST_TARGET__ /* Build configuration list for PBXNativeTarget "__APP_NAME__" */ = {
			isa = XCConfigurationList;
			buildConfigurations = (
				__ID_CFG_TARGET_DEBUG__ /* Debug */,
				__ID_CFG_TARGET_RELEASE__ /* Release */,
			);
			defaultConfigurationIsVisible = 0;
			defaultConfigurationName = Release;
		};
/* End XCConfigurationList section */
	};
	rootObject = __ID_PROJECT__ /* Project object */;
}
"""

	repl = {
		"__SRC_BUILD_FILES__": src_build_files,
		"__RES_BUILD_FILES__": res_build_files,
		"__SRC_FILE_REFS__": src_file_refs,
		"__SRC_REFS__": src_refs,
		"__SRC_PHASE_FILES__": src_phase_files,
		"__APP_NAME__": APP_NAME,
		"__ASSETS_NAME__": ASSETS_NAME,
		"__BUNDLE_ID__": BUNDLE_ID,
		"__DEVELOPMENT_TEAM__": DEVELOPMENT_TEAM,
		"__BUILD_NUMBER__": BUILD_NUMBER,
	}
	for key, value in ID.items():
		repl["__ID_" + key.upper() + "__"] = value
	# Keys containing ":" (file/buildfile entries) get underscore aliases too.
	aliases = {
		"__ID_FILE_ASSETS__": ID["file:" + ASSETS_NAME],
		"__ID_BUILDFILE_ASSETS__": ID["buildfile:" + ASSETS_NAME],
		"__ID_FILE_WWW__": ID["file:www"],
		"__ID_BUILDFILE_WWW__": ID["buildfile:www"],
	}
	repl.update(aliases)
	for token, value in repl.items():
		pbxproj = pbxproj.replace(token, value)
	return pbxproj


def build_scheme():
	return """<?xml version="1.0" encoding="UTF-8"?>
<Scheme
   LastUpgradeVersion = "1400"
   version = "1.7">
   <BuildAction
      parallelizeBuildables = "YES"
      buildImplicitDependencies = "YES">
      <BuildActionEntries>
         <BuildActionEntry
            buildForTesting = "YES"
            buildForRunning = "YES"
            buildForProfiling = "YES"
            buildForArchiving = "YES"
            buildForAnalyzing = "YES">
            <BuildableReference
               BuildableIdentifier = "primary"
               BlueprintIdentifier = "__ID_TARGET__"
               BuildableName = "__APP_NAME__.app"
               BlueprintName = "__APP_NAME__"
               ReferencedContainer = "container:WebbWheresMyCar.xcodeproj">
            </BuildableReference>
         </BuildActionEntry>
      </BuildActionEntries>
   </BuildAction>
   <TestAction
      buildConfiguration = "Debug"
      selectedDebuggerIdentifier = "Xcode.DebuggerFoundation.Debugger.LLDB"
      selectedLauncherIdentifier = "Xcode.DebuggerFoundation.Launcher.LLDB"
      shouldUseLaunchSchemeArgsEnv = "YES"
      shouldAutocreateTestScheme = "YES">
      <Testables>
      </Testables>
   </TestAction>
   <LaunchAction
      buildConfiguration = "Debug"
      selectedDebuggerIdentifier = "Xcode.DebuggerFoundation.Debugger.LLDB"
      selectedLauncherIdentifier = "Xcode.DebuggerFoundation.Launcher.LLDB"
      launchStyle = "0"
      useCustomWorkingDirectory = "NO"
      ignoresPersistentStateOnLaunch = "NO"
      debugDocumentVersioning = "YES"
      debugServiceExtension = "internal"
      allowLocationSimulation = "YES">
      <BuildableProductRunnable
         runnableIdentifier = "primary">
         <BuildableReference
            BuildableIdentifier = "primary"
            BlueprintIdentifier = "__ID_TARGET__"
            BuildableName = "__APP_NAME__.app"
            BlueprintName = "__APP_NAME__"
            ReferencedContainer = "container:WebbWheresMyCar.xcodeproj">
         </BuildableReference>
      </BuildableProductRunnable>
   </LaunchAction>
   <ProfileAction
      buildConfiguration = "Release"
      shouldUseLaunchSchemeArgsEnv = "YES"
      savedToolIdentifier = ""
      useCustomWorkingDirectory = "NO"
      debugDocumentVersioning = "YES">
      <BuildableProductRunnable
         runnableIdentifier = "primary">
         <BuildableReference
            BuildableIdentifier = "primary"
            BlueprintIdentifier = "__ID_TARGET__"
            BuildableName = "__APP_NAME__.app"
            BlueprintName = "__APP_NAME__"
            ReferencedContainer = "container:WebbWheresMyCar.xcodeproj">
         </BuildableReference>
      </BuildableProductRunnable>
   </ProfileAction>
   <AnalyzeAction
      buildConfiguration = "Debug">
   </AnalyzeAction>
   <ArchiveAction
      buildConfiguration = "Release"
      revealArchiveInOrganizer = "YES">
   </ArchiveAction>
</Scheme>
""".replace("__ID_TARGET__", ID["target"]).replace("__APP_NAME__", APP_NAME)


def main():
	www = IOS / "www"
	if not www.is_dir():
		www.mkdir(parents=True)
		(www / "index.html").write_text("", encoding="utf-8")

	scheme_dir = PROJECT_DIR / "xcshareddata" / "xcschemes"
	scheme_dir.mkdir(parents=True, exist_ok=True)
	(PROJECT_DIR / "project.pbxproj").write_text(build_pbxproj(), encoding="utf-8")
	(scheme_dir / (APP_NAME + ".xcscheme")).write_text(build_scheme(), encoding="utf-8")
	print("wrote " + str(PROJECT_DIR / "project.pbxproj"))
	print("wrote " + str(scheme_dir / (APP_NAME + ".xcscheme")))


if __name__ == "__main__":
	main()
