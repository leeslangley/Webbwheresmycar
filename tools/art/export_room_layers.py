#!/usr/bin/env python3
"""Export the Blender room plates to Godot layer PNGs plus one JSON per room.

Reads <src>/manifest.json (written by tools/art/build_rooms.sh) and, for each room, writes
<out>/<room>_mid.png, <out>/<room>_front.png (when the manifest has a front plate) and
<out>/<room>.json with the layer list (parallax), the window sky rectangle and the light
positions that RoomPlate turns into PointLight2D nodes. Python standard library only.
"""

import argparse
import copy
import contextlib
import io
import json
import os
import shutil
import struct
import sys
import tempfile
import zlib

ROOMS = ["office", "garage", "auction", "title", "ledger", "bookings"]
FRONT_PARALLAX = [6, 3]


def _light(light_id, kind, pos, color, energy, radius, flicker, seed):
    return {
        "id": light_id,
        "kind": kind,
        "pos": pos,
        "color": color,
        "energy": energy,
        "radius": radius,
        "flicker": flicker,
        "seed": seed,
    }


# Stage pixels in the 1280x720 stage (plates are 640x360 shown at x2).
LIGHTS = {
    "office": [
        _light("lamp", "lamp", [388, 328], "#ffab55", 0.45, 170, 0.12, 1.3),
        _light("tv", "tv", [625, 301], "#78b4ff", 0.30, 230, 0.25, 4.1),
        _light("window", "window", [110, 235], "#b4c8e6", 0.35, 200, 0.0, 0.0),
    ],
    "garage": [
        _light("strip1", "strip", [320, 130], "#dff1ff", 0.35, 240, 0.30, 2.0),
        _light("strip2", "strip", [640, 130], "#dff1ff", 0.35, 240, 0.30, 5.5),
        _light("strip3", "strip", [960, 130], "#dff1ff", 0.35, 240, 0.30, 8.1),
    ],
    "auction": [
        _light("spot", "spot", [640, 330], "#ffe2a0", 0.60, 300, 0.0, 0.0),
        _light("sconce1", "sconce", [120, 300], "#ffb070", 0.25, 120, 0.15, 3.3),
        _light("sconce2", "sconce", [1160, 300], "#ffb070", 0.25, 120, 0.15, 6.6),
    ],
    "title": [
        _light("lamp1", "lamp", [200, 330], "#ffb15c", 0.40, 160, 0.10, 1.1),
        _light("lamp2", "lamp", [460, 330], "#ffb15c", 0.40, 160, 0.10, 2.2),
        _light("lamp3", "lamp", [820, 330], "#ffb15c", 0.40, 160, 0.10, 3.3),
        _light("lamp4", "lamp", [1080, 330], "#ffb15c", 0.40, 160, 0.10, 4.4),
    ],
    "ledger": [
        _light("lamp", "lamp", [260, 300], "#ffab55", 0.40, 150, 0.10, 1.3),
    ],
    "bookings": [
        _light("lamp", "lamp", [260, 300], "#ffab55", 0.40, 150, 0.10, 2.3),
    ],
}

# Window / sky rectangle in stage px, or None.
SKY = {
    "office": [30, 150, 160, 170],
    "title": [0, 0, 1280, 720],
}


def export_room(src, out, room, entry):
    """Copy one room's plates and write its JSON. Returns (layer_count, light_count) or None if skipped."""
    plate = entry.get("file", "")
    src_plate = os.path.join(src, plate)
    if not plate or not os.path.isfile(src_plate):
        print("WARN missing %s" % plate)
        return None

    shutil.copyfile(src_plate, os.path.join(out, room + "_mid.png"))
    layers = [{"name": "mid", "file": room + "_mid.png", "parallax": [0, 0]}]

    front = entry.get("front")
    if front:
        src_front = os.path.join(src, front)
        if os.path.isfile(src_front):
            shutil.copyfile(src_front, os.path.join(out, room + "_front.png"))
            layers.append({
                "name": "front",
                "file": room + "_front.png",
                "parallax": list(FRONT_PARALLAX),
            })
        else:
            print("WARN missing %s" % front)

    sky_rect = SKY.get(room)
    data = {
        "version": 1,
        "room": room,
        "scale": entry.get("scale"),
        "size": [entry.get("w"), entry.get("h")],
        "sky": {"rect": list(sky_rect)} if sky_rect is not None else None,
        "layers": layers,
        "lights": copy.deepcopy(LIGHTS.get(room, [])),
    }
    with open(os.path.join(out, room + ".json"), "w") as f:
        json.dump(data, f, indent=1, sort_keys=True)
        f.write("\n")
    return len(layers), len(data["lights"])


def run_export(src, out, room):
    """Export the chosen room (or all manifest rooms). Returns the process exit code."""
    manifest_path = os.path.join(src, "manifest.json")
    if not os.path.isfile(manifest_path):
        print("NO SOURCE: run sh tools/art/build_rooms.sh first")
        return 3
    try:
        with open(manifest_path) as f:
            manifest = json.load(f)
    except ValueError as err:
        print("BAD MANIFEST %s: %s" % (manifest_path, err))
        return 1

    rooms = sorted(manifest) if room == "all" else [room]
    os.makedirs(out, exist_ok=True)
    exported = 0
    skipped = 0
    for name in rooms:
        entry = manifest.get(name)
        if entry is None:
            print("WARN no manifest entry for %s" % name)
            skipped += 1
            continue
        counts = export_room(src, out, name, entry)
        if counts is None:
            skipped += 1
            continue
        print("EXPORTED %s layers=%d lights=%d" % (name, counts[0], counts[1]))
        exported += 1
    if exported == 0:
        return 1
    return 1 if skipped else 0


def _png_bytes(width, height, rgb):
    def chunk(tag, body):
        crc = zlib.crc32(tag + body) & 0xFFFFFFFF
        return struct.pack(">I", len(body)) + tag + body + struct.pack(">I", crc)

    row = b"\x00" + bytes(rgb) * width
    raw = row * height
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(raw))
        + chunk(b"IEND", b"")
    )


def _write_manifest(folder, entries):
    with open(os.path.join(folder, "manifest.json"), "w") as f:
        json.dump(entries, f, indent=1, sort_keys=True)
        f.write("\n")


def _read_json(path):
    with open(path) as f:
        return json.load(f)


def selftest():
    failures = []

    def check(ok, message):
        if not ok:
            failures.append(message)

    with tempfile.TemporaryDirectory(prefix="room_export_") as tmp:
        src = os.path.join(tmp, "src")
        out = os.path.join(tmp, "out")
        os.makedirs(src)
        for name, rgb in (("office.png", (200, 100, 50)),
                          ("office_front.png", (50, 100, 200)),
                          ("garage.png", (10, 200, 10))):
            with open(os.path.join(src, name), "wb") as f:
                f.write(_png_bytes(4, 4, rgb))
        _write_manifest(src, {
            "office": {"file": "office.png", "w": 640, "h": 360, "scale": 2,
                       "front": "office_front.png"},
            "garage": {"file": "garage.png", "w": 640, "h": 360, "scale": 2},
        })

        code = run_export(src, out, "all")
        check(code == 0, "export of office and garage returned %d" % code)

        office = _read_json(os.path.join(out, "office.json"))
        check([layer["name"] for layer in office["layers"]] == ["mid", "front"],
              "office layers are not mid, front")
        front_layers = [layer for layer in office["layers"] if layer["name"] == "front"]
        check(front_layers and front_layers[0]["parallax"] == [6, 3],
              "office front parallax is not [6, 3]")
        check(office["sky"] == {"rect": [30, 150, 160, 170]}, "office sky rect is wrong")
        check(len(office["lights"]) == 3, "office does not have 3 lights")
        lights = {light["id"]: light for light in office["lights"]}
        check(lights.get("lamp", {}).get("color") == "#ffab55", "office lamp colour is wrong")
        check(lights.get("window", {}).get("flicker") == 0.0, "office window flicker is not 0.0")

        garage = _read_json(os.path.join(out, "garage.json"))
        check(len(garage["layers"]) == 1, "garage does not have 1 layer")
        check(garage["sky"] is None, "garage sky is not null")
        check(len(garage["lights"]) == 3, "garage does not have 3 lights")

        check(os.path.isfile(os.path.join(out, "office_mid.png")), "office_mid.png missing")
        check(os.path.isfile(os.path.join(out, "office_front.png")), "office_front.png missing")

        before = {}
        for name in os.listdir(out):
            with open(os.path.join(out, name), "rb") as f:
                before[name] = f.read()
        run_export(src, out, "all")
        identical = True
        for name, body in before.items():
            with open(os.path.join(out, name), "rb") as f:
                identical = identical and f.read() == body
        check(identical and sorted(before) == sorted(os.listdir(out)),
              "a second export run is not byte-identical")

        src_missing = os.path.join(tmp, "src_missing")
        out_missing = os.path.join(tmp, "out_missing")
        os.makedirs(src_missing)
        with open(os.path.join(src_missing, "office.png"), "wb") as f:
            f.write(_png_bytes(4, 4, (1, 2, 3)))
        _write_manifest(src_missing, {
            "office": {"file": "office.png", "w": 640, "h": 360, "scale": 2},
            "auction": {"file": "auction.png", "w": 640, "h": 360, "scale": 2},
        })
        captured = io.StringIO()
        with contextlib.redirect_stdout(captured):
            run_export(src_missing, out_missing, "all")
        text = captured.getvalue()
        check("WARN missing auction.png" in text, "missing auction plate did not print WARN")
        check(not os.path.exists(os.path.join(out_missing, "auction.json")),
              "auction.json written for a missing plate")
        check(os.path.isfile(os.path.join(out_missing, "office.json")),
              "office.json not written next to a skipped room")

    if failures:
        for message in failures:
            print("FAIL: %s" % message)
        print("ROOM EXPORT SELFTEST FAIL")
        return 1
    print("ROOM EXPORT SELFTEST OK")
    return 0


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--src", default="assets/art/rooms")
    parser.add_argument("--out", default="godot/art/rooms")
    parser.add_argument("--room", default="all", choices=ROOMS + ["all"])
    parser.add_argument("--selftest", action="store_true")
    args = parser.parse_args(argv)
    if args.selftest:
        return selftest()
    return run_export(args.src, args.out, args.room)


if __name__ == "__main__":
    sys.exit(main())
