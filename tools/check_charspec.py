#!/usr/bin/env python3
"""Character spec checker for docs/characters/<id>.json (card GC02).

Usage: python3 tools/check_charspec.py <spec.json> [more.json ...]

Prints "CHARSPEC OK <id> palette=<n>" for each valid file and one
"CHARSPEC FAIL <file>: <reason>" line per problem. Checks every file
before exiting. Exits 2 if any file failed, else 0. Standard library only.
"""

import json
import re
import sys

REQUIRED_KEYS = (
    "id",
    "name",
    "head_scale",
    "frames",
    "render",
    "palette",
    "body",
    "head",
    "face",
    "bust_faces",
)
OPTIONAL_KEYS = ("hair", "glasses", "moustache")
FRAME_NAMES = ("world", "head", "bust")
PAINT_RE = re.compile(r"^#[0-9a-fA-F]{6}$")
MIN_PALETTE = 15


def is_num(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def is_int(v):
    return isinstance(v, int) and not isinstance(v, bool)


def check_file(path, problems):
    """Append one problem string per fault found in path. Returns the id or None."""

    def fail(reason):
        problems.append(reason)

    try:
        with open(path, "rb") as f:
            raw = f.read()
    except OSError as e:
        fail("cannot read file: %s" % e.strerror)
        return None

    try:
        d = json.loads(raw.decode("utf-8"))
    except (ValueError, UnicodeDecodeError) as e:
        fail("not valid JSON: %s" % e)
        return None

    if not isinstance(d, dict):
        fail("top level value is not an object")
        return None

    # required keys (optional keys may be absent or null)
    for key in REQUIRED_KEYS:
        if key not in d:
            fail("missing key: %s" % key)
    for key in OPTIONAL_KEYS:
        if key in d and d[key] is not None and not isinstance(d[key], dict):
            fail("key %s must be an object or null" % key)

    char_id = d.get("id") if isinstance(d.get("id"), str) else None
    if "id" in d and char_id is None:
        fail("key id must be a string")
    if "name" in d and not isinstance(d["name"], str):
        fail("key name must be a string")

    # head_scale
    if "head_scale" in d:
        hs = d["head_scale"]
        if not is_num(hs) or not 1.0 <= hs <= 1.6:
            fail("head_scale must be a number between 1.0 and 1.6")

    # frames
    frames = d.get("frames", {})
    if not isinstance(frames, dict):
        fail("frames must be an object")
        frames = {}
    for name in FRAME_NAMES:
        fr = frames.get(name)
        if not isinstance(fr, dict):
            fail("frames.%s missing or not an object" % name)
            continue
        for k in ("w", "h"):
            if not is_int(fr.get(k)) or not 32 <= fr[k] <= 256:
                fail("frames.%s.%s must be an integer between 32 and 256" % (name, k))
        ortho = fr.get("ortho")
        if not isinstance(ortho, float) or ortho <= 0:
            fail("frames.%s.ortho must be a positive float" % name)

    # palette
    palette = d.get("palette", {})
    if not isinstance(palette, dict):
        fail("palette must be an object")
        palette = {}
    else:
        for name, value in palette.items():
            if not isinstance(value, str) or not PAINT_RE.match(value):
                fail("palette.%s must be a hex colour like #rrggbb" % name)
        if len(palette) < MIN_PALETTE:
            fail("palette must have at least %d entries (found %d)" % (MIN_PALETTE, len(palette)))

    # render
    render = d.get("render", {})
    if not isinstance(render, dict):
        fail("render must be an object")
        render = {}
    colors = render.get("colors")
    if not is_int(colors) or not 16 <= colors <= 48:
        fail("render.colors must be an integer between 16 and 48")

    # sections that must be objects
    for key in ("body", "head", "face"):
        if key in d and not isinstance(d[key], dict):
            fail("%s must be an object" % key)

    # face colour names must exist in the palette
    face = d.get("face", {})
    if isinstance(face, dict) and "brow_color" in face:
        if not isinstance(face["brow_color"], str) or face["brow_color"] not in palette:
            fail("face.brow_color %r is not a palette colour" % (face["brow_color"],))

    moustache = d.get("moustache")
    if isinstance(moustache, dict):
        if "color" not in moustache:
            fail("moustache missing key: color")
        elif not isinstance(moustache["color"], str) or moustache["color"] not in palette:
            fail("moustache.color %r is not a palette colour" % (moustache["color"],))

    # bust_faces
    bust_faces = d.get("bust_faces")
    if "bust_faces" in d:
        if not isinstance(bust_faces, list) or not bust_faces:
            fail("bust_faces must be a non-empty list of strings")
        elif not all(isinstance(s, str) for s in bust_faces):
            fail("bust_faces entries must be strings")

    return char_id


def main(argv):
    if len(argv) < 2:
        print("Usage: python3 tools/check_charspec.py <spec.json> [more.json ...]")
        return 2
    any_failed = False
    for path in argv[1:]:
        problems = []
        char_id = check_file(path, problems)
        if problems:
            any_failed = True
            for reason in problems:
                print("CHARSPEC FAIL %s: %s" % (path, reason))
        else:
            # the palette count was validated above, so reload it for the report
            with open(path, "rb") as f:
                n = len(json.loads(f.read().decode("utf-8"))["palette"])
            print("CHARSPEC OK %s palette=%d" % (char_id, n))
    return 2 if any_failed else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
