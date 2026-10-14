#!/usr/bin/env python3
"""Dossier checker for docs/cars/<id>.json spec files (card R00).

Usage: python3 tools/check_dossier.py <file.json> [more.json ...]

Prints "DOSSIER OK <id>" for each valid file and one
"DOSSIER FAIL <file>: <reason>" line per problem. Exits 1 if any file
failed, else 0. Standard library only.
"""

import json
import os
import re
import sys

CONFIDENCES = ("high", "medium", "low")
DIM_KEYS = (
    "length",
    "width",
    "height",
    "wheelbase",
    "track_front",
    "track_rear",
    "tyre_overall_diameter",
)
PAINT_RE = re.compile(r"^#[0-9a-fA-F]{6}$")
HEX_DIGITS = set("0123456789abcdefABCDEF")


def is_num(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def is_pair(v):
    return (
        isinstance(v, list)
        and len(v) == 2
        and is_num(v[0])
        and is_num(v[1])
    )


def check_file(path, problems):
    """Append one problem string per fault found in path."""

    def fail(reason):
        problems.append(reason)

    try:
        with open(path, "rb") as f:
            raw = f.read()
    except OSError as e:
        fail("cannot read file: %s" % e.strerror)
        return None

    # (1) pure ASCII
    if any(b > 127 for b in raw):
        fail("text is not pure ASCII (non-ASCII character found)")

    # (1) parses as JSON
    try:
        d = json.loads(raw.decode("ascii", errors="replace"))
    except (ValueError, UnicodeDecodeError) as e:
        fail("not valid JSON: %s" % e)
        return None

    if not isinstance(d, dict):
        fail("top level value is not an object")
        return None

    # (2) required keys and types
    for key in ("id", "real_car", "game_name", "body_style", "wheel_arch", "notes"):
        if key not in d:
            fail("missing key: %s" % key)
        elif not isinstance(d[key], str):
            fail("key %s must be a string" % key)

    # (9) game_name must be a real game name, not the fixture's game title
    game_name = d.get("game_name")
    if isinstance(game_name, str):
        if not game_name or not game_name.isascii():
            fail("game_name must be a non-empty ASCII string")
        elif "Webb" in game_name or game_name == "wheres my car":
            fail("game_name looks copied from the fixture")

    if "id" in d and isinstance(d["id"], str):
        car_id = d["id"]
    else:
        car_id = None

    dims = d.get("dims_mm")
    if not isinstance(dims, dict):
        fail("dims_mm must be an object")
        dims = {}
    for key in DIM_KEYS:
        if key not in dims:
            fail("dims_mm missing key: %s" % key)
        elif not is_num(dims[key]):
            fail("dims_mm.%s must be a number" % key)
        elif dims[key] <= 0:
            fail("dims_mm.%s must be positive" % key)

    if "dims_confidence" not in d:
        fail("missing key: dims_confidence")
    elif d["dims_confidence"] not in CONFIDENCES:
        fail("dims_confidence must be one of high, medium, low")

    doors = d.get("doors")
    if "doors" not in d:
        fail("missing key: doors")
    elif isinstance(doors, bool) or not isinstance(doors, int):
        fail("doors must be an integer")
    elif not 0 <= doors <= 5:
        fail("doors must be between 0 and 5")

    wheels = d.get("wheels")
    wheel_xs = []
    if "wheels" not in d:
        fail("missing key: wheels")
    elif not isinstance(wheels, list):
        fail("wheels must be a list")
    elif len(wheels) not in (2, 3):
        fail("wheels must have 2 or 3 entries (found %s)" % (len(wheels) if isinstance(wheels, list) else "?"))
    else:
        for i, w in enumerate(wheels):
            if not isinstance(w, dict):
                fail("wheels[%d] must be an object" % i)
                continue
            if "x" not in w:
                fail("wheels[%d] missing x" % i)
            elif not is_num(w["x"]):
                fail("wheels[%d].x must be a number" % i)
            else:
                wheel_xs.append(w["x"])
            if "r" not in w:
                fail("wheels[%d] missing r" % i)
            elif not is_num(w["r"]):
                fail("wheels[%d].r must be a number" % i)
            # (8) wheel radius range
            elif not 2 <= w["r"] <= 14:
                fail("wheels[%d].r must be between 2 and 14" % i)
            if "style" not in w:
                fail("wheels[%d] missing style" % i)
            elif not isinstance(w["style"], str):
                fail("wheels[%d].style must be a string" % i)

    profile = check_side_profile(d, fail)
    green_pts = check_greenhouse(d, fail)

    roof = d.get("roof")
    if "roof" not in d:
        fail("missing key: roof")
    elif not isinstance(roof, dict):
        fail("roof must be an object")
    elif "type" not in roof:
        fail("roof missing key: type")
    elif not isinstance(roof["type"], str):
        fail("roof.type must be a string")

    plan = d.get("plan")
    if not isinstance(plan, dict):
        fail("plan must be an object")
        plan = {}
    for key in ("width_units", "nose_width_pct", "tail_width_pct"):
        if key not in plan:
            fail("plan missing key: %s" % key)
        elif not is_num(plan[key]):
            fail("plan.%s must be a number" % key)

    for key in ("front", "rear"):
        if key not in d:
            fail("missing key: %s" % key)
        elif not isinstance(d[key], dict):
            fail("%s must be an object" % key)

    for key in ("side_features", "special"):
        if key not in d:
            fail("missing key: %s" % key)
        elif not isinstance(d[key], list) or not all(
            isinstance(s, str) for s in d[key]
        ):
            fail("%s must be a list of strings" % key)

    paint = d.get("typical_paint")
    if "typical_paint" not in d:
        fail("missing key: typical_paint")
    elif not isinstance(paint, list):
        fail("typical_paint must be a list")
    elif len(paint) not in (3, 4):
        fail("typical_paint must have 3 or 4 colours (found %s)" % len(paint))
    elif not all(isinstance(s, str) and PAINT_RE.match(s) for s in paint):
        fail("typical_paint entries must be strings like #rrggbb")

    refs = d.get("ref_urls")
    if "ref_urls" not in d:
        fail("missing key: ref_urls")
    elif not isinstance(refs, list):
        fail("ref_urls must be a list")
    elif len(refs) not in (2, 3):
        fail("ref_urls must have 2 or 3 entries (found %s)" % len(refs))
    elif not all(isinstance(s, str) and s.startswith("https://") for s in refs):
        fail("ref_urls entries must be strings starting with https://")

    # (3) file name (without .json) equals id
    base = os.path.basename(path)
    stem = base[:-5] if base.endswith(".json") else base
    if car_id is not None and stem != car_id:
        fail("file name %r does not match id %r" % (base, car_id))

    # (4)-(7) proportion checks need dims and the profile
    length = dims.get("length") if is_num(dims.get("length")) else None

    if profile is not None and length:
        xs = [p[0] for p in profile]
        ys = [p[1] for p in profile]
        # (4) x span
        if min(xs) > -49.0 or max(xs) < 49.0:
            fail(
                "side_profile x span must reach at least -49.0 to +49.0 (found %s to %s)"
                % (min(xs), max(xs))
            )
        out_of_range = [x for x in xs if x < -51 or x > 51]
        if out_of_range:
            fail("side_profile x values outside -51..51 (e.g. %s)" % out_of_range[0])

        # (5) height check
        height = dims.get("height")
        all_pts = profile + green_pts
        max_y = max(p[1] for p in all_pts) if all_pts else None
        if is_num(height) and max_y is not None:
            expected = height / length * 100.0
            if abs(max_y - expected) > 1.0:
                fail(
                    "height check failed: max profile y %s vs expected %s (dims_mm.height / length * 100)"
                    % (round(max_y, 2), round(expected, 2))
                )

    if wheel_xs and length:
        # (6) wheelbase check (skip when 3 wheels)
        if len(wheel_xs) == 2:
            wheelbase = dims.get("wheelbase")
            if is_num(wheelbase):
                span = max(wheel_xs) - min(wheel_xs)
                expected = wheelbase / length * 100.0
                if abs(span - expected) > 1.5:
                    fail(
                        "wheelbase check failed: wheel x span %s vs expected %s (dims_mm.wheelbase / length * 100)"
                        % (round(span, 2), round(expected, 2))
                    )

    if is_num(plan.get("width_units")) and length:
        # (7) plan width check
        width = dims.get("width")
        if is_num(width):
            expected = width / length * 100.0
            if abs(plan["width_units"] - expected) > 1.0:
                fail(
                    "width check failed: plan.width_units %s vs expected %s (dims_mm.width / length * 100)"
                    % (round(plan["width_units"], 2), round(expected, 2))
                )

    return car_id


def check_side_profile(d, fail):
    """Validate side_profile; return its points, or None if unusable."""
    if "side_profile" not in d:
        fail("missing key: side_profile")
        return None
    profile = d["side_profile"]
    if not isinstance(profile, list):
        fail("side_profile must be a list of [x,y] pairs")
        return None
    if not 20 <= len(profile) <= 40:
        fail("side_profile must have 20 to 40 points (found %s)" % len(profile))
    bad = [i for i, p in enumerate(profile) if not is_pair(p)]
    if bad:
        fail("side_profile entries must be [x,y] number pairs (bad at index %s)" % bad[0])
        return None
    return profile


def check_greenhouse(d, fail):
    """Validate greenhouse; return the flattened [x,y] points (may be empty)."""
    if "greenhouse" not in d:
        fail("missing key: greenhouse")
        return []
    gh = d["greenhouse"]
    if not isinstance(gh, list) or not gh:
        fail("greenhouse must be a non-empty list")
        return []
    if all(is_pair(p) for p in gh):
        # single polygon of [x,y] pairs
        return [list(p) for p in gh]
    # otherwise: a list of polygons
    pts = []
    ok = True
    for i, poly in enumerate(gh):
        if not isinstance(poly, list) or not poly:
            fail("greenhouse[%d] must be a non-empty list of [x,y] pairs" % i)
            ok = False
            continue
        bad = [j for j, p in enumerate(poly) if not is_pair(p)]
        if bad:
            fail(
                "greenhouse[%d] entries must be [x,y] number pairs (bad at index %s)"
                % (i, bad[0])
            )
            ok = False
            continue
        pts.extend([list(p) for p in poly])
    return pts if ok else []


def main(argv):
    if len(argv) < 2:
        print("Usage: python3 tools/check_dossier.py <file.json> [more.json ...]")
        return 2
    any_failed = False
    for path in argv[1:]:
        problems = []
        car_id = check_file(path, problems)
        if problems:
            any_failed = True
            for reason in problems:
                print("DOSSIER FAIL %s: %s" % (path, reason))
        else:
            print("DOSSIER OK %s" % (car_id if car_id is not None else path))
    return 1 if any_failed else 0


if __name__ == "__main__":
    raise SystemExit(main(__import__("sys").argv))
