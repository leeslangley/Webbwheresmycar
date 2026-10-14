"""Sprite checker for Webb, where's my car? (card A04).

    /opt/homebrew/bin/blender --background --python tools/art/check_sprite.py -- \
        assets/art/preview/roadster_px.png --max-colors 30

Prints exactly one line:

    SPRITE OK size=<w>x<h> colors=<n> alpha01=<True|False>

`colors` is the number of distinct RGB values among the opaque pixels and
`alpha01` is True when every alpha value is 0 or 255. Exits with status 2 (and
prints a SPRITE FAIL line) when --max-colors is given and exceeded, or when
alpha01 is False.
"""

import os
import sys

import bpy
import numpy as np


def parse_args(argv):
    if not argv:
        raise SystemExit("check_sprite: usage: <png> [--max-colors N]")
    path = argv[0]
    max_colors = None
    i = 1
    while i < len(argv):
        arg = argv[i]
        if arg == "--max-colors":
            if i + 1 >= len(argv):
                raise SystemExit("check_sprite: --max-colors needs a value")
            try:
                max_colors = int(argv[i + 1])
            except ValueError:
                raise SystemExit("check_sprite: --max-colors must be an integer")
            i += 2
            continue
        raise SystemExit("check_sprite: unexpected argument %s" % arg)
    return path, max_colors


def main(argv):
    path, max_colors = parse_args(argv)
    if not os.path.isfile(path):
        raise SystemExit("check_sprite: no such file: %s" % path)

    try:
        image = bpy.data.images.load(path)
    except RuntimeError as exc:
        print("check_sprite: cannot load %s: %s" % (path, exc))
        sys.exit(2)
    image.colorspace_settings.name = "Non-Color"
    w, h = image.size
    if w < 1 or h < 1:
        print("check_sprite: cannot read %s as an image (size %dx%d)"
              % (path, w, h))
        sys.exit(2)
    flat = np.array(image.pixels[:], dtype=np.float64).reshape(h, w, 4)

    alpha8 = np.round(np.clip(flat[:, :, 3], 0.0, 1.0) * 255.0).astype(np.uint8)
    alpha01 = bool(np.all((alpha8 == 0) | (alpha8 == 255)))

    opaque = alpha8 > 0
    if opaque.any():
        rgb8 = np.round(np.clip(flat[opaque][:, :3], 0.0, 1.0) * 255.0)
        colors = int(len(np.unique(rgb8.astype(np.uint8), axis=0)))
    else:
        colors = 0

    too_many = max_colors is not None and colors > max_colors
    if alpha01 and not too_many:
        print("SPRITE OK size=%dx%d colors=%d alpha01=%s" %
              (w, h, colors, alpha01))
        return 0
    print("SPRITE FAIL size=%dx%d colors=%d alpha01=%s max_colors=%s" %
          (w, h, colors, alpha01,
           "none" if max_colors is None else max_colors))
    sys.exit(2)


if __name__ == "__main__":
    if "--" in sys.argv:
        ARGV = sys.argv[sys.argv.index("--") + 1:]
    else:
        ARGV = []
    sys.stdout.flush()
    sys.exit(main(ARGV))
