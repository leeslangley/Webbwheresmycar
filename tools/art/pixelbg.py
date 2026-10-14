"""Pixel stage for room plates in Webb, where's my car? (card GE03).

Turns a 1280x720 room render into a 640x360 limited-palette pixel plate: hard
pixel edges, no outline, alpha kept as holes (alpha is exactly 0 or 1). Blender
python only: this runs in Blender, whose Python has numpy but no PIL.

    /opt/homebrew/bin/blender --background --python-exit-code 1 \
        --python tools/art/pixelbg.py -- \
        --in room.png --out plate.png --width 640 --colors 96 --dither 0.22 \
        --preview plate_x2.png

Arguments (everything after the lone --):
    --in <png>         source room render (required)
    --out <png>        destination plate (required)
    --width <int>      plate width in pixels; height follows the aspect    (640)
    --colors <int>     palette size for the k-means quantiser              (96)
    --dither <float>   ordered 4x4 Bayer dither strength                   (0.22)
    --preview <png>    optional: also write the plate scaled x2 (nearest)

Bad or missing arguments print 'pixelbg: <reason>' and exit 2.
"""

import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pixelate as P  # noqa: E402  (helpers: load_rgba, downscale, kmeans, ...)

DEFAULT_WIDTH = 640
DEFAULT_COLORS = 96
DEFAULT_DITHER = 0.22
KMEANS_ITERATIONS = 16


def fail(reason):
    print("pixelbg: %s" % reason)
    sys.exit(2)


def parse_args(argv):
    """Parse `--key value` pairs after the lone `--`."""
    opts = {"in": None, "out": None, "width": DEFAULT_WIDTH,
            "colors": DEFAULT_COLORS, "dither": DEFAULT_DITHER,
            "preview": None}
    i = 0
    while i < len(argv):
        arg = argv[i]
        if not arg.startswith("--"):
            fail("unexpected argument %s" % arg)
        key = arg[2:]
        if key not in opts:
            fail("unknown argument %s" % arg)
        if i + 1 >= len(argv) or argv[i + 1].startswith("--"):
            fail("--%s needs a value" % key)
        opts[key] = argv[i + 1]
        i += 2
    if not opts["in"] or not opts["out"]:
        fail("--in and --out are required")
    try:
        opts["width"] = int(opts["width"])
        opts["colors"] = int(opts["colors"])
        opts["dither"] = float(opts["dither"])
    except ValueError:
        fail("--width and --colors want integers, --dither a number")
    if opts["width"] < 1:
        fail("--width must be >= 1")
    if opts["colors"] < 1:
        fail("--colors must be >= 1")
    if opts["dither"] < 0.0:
        fail("--dither must be >= 0")
    return opts


def main(argv):
    opts = parse_args(argv)
    if not os.path.isfile(opts["in"]):
        fail("no such input file: %s" % opts["in"])

    width = opts["width"]
    src = P.load_rgba(opts["in"])
    src_h, src_w = src.shape[0], src.shape[1]
    out_h = max(1, int(round(src_h * width / float(src_w))))
    rgb, alpha = P.downscale(src, width, out_h)

    opaque = alpha >= 0.5
    colours = 0
    if opaque.any():
        centres = P.kmeans(rgb[opaque], opts["colors"], KMEANS_ITERATIONS)
        labels = P.nearest(P.apply_dither(rgb, opts["dither"])[opaque], centres)
        rgb[:] = 0.0
        rgb[opaque] = centres[labels]
        colours = len(np.unique(labels))
    alpha[:] = np.where(opaque, 1.0, 0.0)

    plate = np.dstack((rgb, alpha[:, :, None]))
    P.save_rgba(opts["out"], plate)

    if opts["preview"] is not None:
        big = np.repeat(np.repeat(plate, 2, axis=0), 2, axis=1)
        P.save_rgba(opts["preview"], big)

    print("PIXBG OK out=%s size=%dx%d colors=%d" %
          (opts["out"], plate.shape[1], plate.shape[0], colours))
    return 0


if __name__ == "__main__":
    ARGV = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    sys.exit(main(ARGV))
