#!/usr/bin/env python3
"""Tests for tools/art/surface.py (card CA02). Plain asserts, no pytest.

Run: python3 tests/test_surface.py   (prints SURFACE OK)
"""

import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools", "art"))

from surface import Surface, default_details  # noqa: E402


def load(car_id):
    with open(os.path.join(ROOT, "docs", "cars", car_id + ".json")) as f:
        return json.load(f)


d = load("t1_chimp")
s = Surface(d, 25.3)

assert abs(s.top(0) - 37.97) < 0.1, s.top(0)
assert abs(s.bottom(0) - 5.8) < 0.1, s.bottom(0)
assert abs(s.half_width(0, 20) - 20.35) < 0.2, s.half_width(0, 20)
assert s.half_width(0, 37.5) < 0.9 * 20.35, s.half_width(0, 37.5)
# Tumblehome must narrow the body above the belt (k=0.16 gives about 19.6 here).
assert s.half_width(0, 30) < 0.99 * 20.35, s.half_width(0, 30)
assert s.half_width(-49.9, 10) < 12, s.half_width(-49.9, 10)
assert s.half_width(0, 80) == 0.0
# Out-of-range x must not crash and must give a non-negative width.
assert s.half_width(-60, 10) >= 0.0
assert s.half_width(60, 10) >= 0.0

ring = s.ring(0)
assert len(ring) == 16, len(ring)
assert all(lat <= 20.4 for lat, _ in ring), max(lat for lat, _ in ring)
ys = [y for _, y in ring]
assert all(ys[i] < ys[i + 1] for i in range(len(ys) - 1)), ys

det = default_details(d)
assert det["version"] == 2
assert det["id"] == d["id"]
assert det["parts"] == []
assert isinstance(det["windows"], list) and len(det["windows"]) > 0
assert isinstance(det["windows"][0][0], list)
lowest_gh = min(p[1] for p in d["greenhouse"])
assert abs(det["belt_y"] - lowest_gh) < 0.01, (det["belt_y"], lowest_gh)
assert det["wheel"]["style"] == d["wheels"][0]["style"]
assert det["caricature"] == {"eyes": 1.0, "mouth": 1.0, "wheels": 1.0, "bumper": 1.0}

print("SURFACE OK")
