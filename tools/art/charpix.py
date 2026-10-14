"""Character pixel stage for Webb, where's my car? (card GC17).

Turns a folder of raw character renders into pixel sprites that share ONE palette
per character, so every frame of an animation uses the same colours. Ordered dither
on the sprite grid, a dark outline drawn INSIDE the frame (the frame never grows)
and alpha only 0 or 255.

    /opt/homebrew/bin/blender --background --python-exit-code 1 \
        --python tools/art/charpix.py -- \
        --in-dir /tmp/gc16 --out-dir /tmp/gc17 --w 144 --h 144 \
        --palette /tmp/gc17_pal.json --build-palette --colors 32

Arguments (everything after the lone --):
    --in-dir <dir>        folder of raw PNG renders
    --out-dir <dir>       destination folder (created if missing)
    --w <int>             final sprite width in pixels
    --h <int>             final sprite height in pixels
    --palette <json>      palette file: written by --build-palette, read otherwise
    --build-palette       cluster the opaque pixels of ALL inputs into the palette
    --colors <int>        palette size for the k-means clustering   (32)
    --dither <float>      ordered 4x4 Bayer dither strength          (0.18)
    --outline <#rrggbb>   outline colour                            (#14102a)
    --outline-px <int>    outline thickness in pixels                (1)
    --glob <pattern>      which files in --in-dir to use             (*.png)

Prints one line and exits 0:  CHARPIX OK n=<files> w=<w> h=<h> palette=<colours> max_used=<n>
(palette counts the outline colour too; max_used is the largest number of distinct
colours in any single output.)
Prints CHARPIX FAIL <reason> and exits 2 when a margin rule is broken: no opaque
pixel may lie within outline_px pixels of the frame border.
"""

import argparse
import glob
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import numpy as np

import pixelate

ALPHA_CUT = 0.5
POOL_LIMIT = 400000
POOL_STEP = 3


def parse_args(argv):
    parser = argparse.ArgumentParser(prog="charpix")
    parser.add_argument("--in-dir", required=True)
    parser.add_argument("--out-dir", required=True)
    parser.add_argument("--w", required=True, type=int)
    parser.add_argument("--h", required=True, type=int)
    parser.add_argument("--palette", required=True)
    parser.add_argument("--build-palette", action="store_true")
    parser.add_argument("--colors", type=int, default=32)
    parser.add_argument("--dither", type=float, default=0.18)
    parser.add_argument("--outline", default="#14102a")
    parser.add_argument("--outline-px", type=int, default=1)
    parser.add_argument("--glob", default="*.png")
    args = parser.parse_args(argv)
    if args.w < 1 or args.h < 1:
        raise SystemExit("charpix: --w and --h must be >= 1")
    if args.colors < 1:
        raise SystemExit("charpix: --colors must be >= 1")
    if args.dither < 0.0:
        raise SystemExit("charpix: --dither must be >= 0")
    if args.outline_px < 0:
        raise SystemExit("charpix: --outline-px must be >= 0")
    return args


def fail(reason):
    print("CHARPIX FAIL %s" % reason)
    sys.stdout.flush()
    sys.exit(2)


def to_hex(linear):
    srgb = pixelate.linear_to_srgb(np.asarray(linear, dtype=np.float64))
    values = np.round(np.clip(srgb, 0.0, 1.0) * 255.0).astype(np.int64)
    return "#%02x%02x%02x" % tuple(int(v) for v in values)


def hex_to_linear(text):
    value = pixelate.parse_hex(text)
    if value is None:
        fail("colour must be #rrggbb, got %r" % text)
    return value


def list_inputs(in_dir, pattern):
    if not os.path.isdir(in_dir):
        fail("no such input folder: %s" % in_dir)
    files = sorted(p for p in glob.glob(os.path.join(in_dir, pattern))
                   if os.path.isfile(p))
    if not files:
        fail("no files matching %s in %s" % (pattern, in_dir))
    return files


def downscaled(path, w, h):
    rgba = pixelate.load_rgba(path)
    return pixelate.downscale(rgba, w, h)


def build_palette(files, w, h, colours):
    pools = []
    for path in files:
        rgb, alpha = downscaled(path, w, h)
        pools.append(rgb[alpha >= ALPHA_CUT])
    pool = np.concatenate(pools, axis=0)
    if pool.shape[0] == 0:
        fail("no opaque pixels in any input")
    if pool.shape[0] > POOL_LIMIT:
        pool = pool[::POOL_STEP]
    centres = pixelate.kmeans(pool, colours)
    order = np.argsort(centres @ pixelate.LUMA, kind="stable")
    hexes = []
    for index in order:
        value = to_hex(centres[index])
        if value not in hexes:
            hexes.append(value)
    return hexes


def load_palette(path):
    if not os.path.isfile(path):
        fail("no palette file: %s" % path)
    try:
        with open(path) as handle:
            data = json.load(handle)
    except ValueError:
        fail("palette is not valid JSON: %s" % path)
    colours = data.get("colors") if isinstance(data, dict) else None
    if not colours:
        fail("palette has no colors: %s" % path)
    return colours


def margin_violators(opaque, px):
    h, w = opaque.shape
    inner = np.zeros_like(opaque)
    inner[px:h - px, px:w - px] = True
    return int(np.count_nonzero(opaque & ~inner))


def dilate(mask):
    out = np.zeros_like(mask)
    out[1:, :] |= mask[:-1, :]
    out[:-1, :] |= mask[1:, :]
    out[:, 1:] |= mask[:, :-1]
    out[:, :-1] |= mask[:, 1:]
    return out


def grow_outline(opaque, px):
    filled = opaque.copy()
    outline = np.zeros_like(opaque)
    for _ in range(px):
        grow = dilate(filled) & ~filled
        outline |= grow
        filled |= grow
    return outline


def make_sprite(rgb, alpha, palette_linear, dither, outline_linear, outline_px):
    opaque = alpha >= ALPHA_CUT
    dithered = pixelate.apply_dither(rgb, dither)
    out_rgb = np.zeros_like(rgb)
    out_alpha = np.zeros(alpha.shape, dtype=np.float64)
    if opaque.any():
        labels = pixelate.nearest(dithered[opaque], palette_linear)
        out_rgb[opaque] = palette_linear[labels]
    out_alpha[opaque] = 1.0
    outline = grow_outline(opaque, outline_px)
    out_rgb[outline] = outline_linear
    out_alpha[outline] = 1.0
    return out_rgb, out_alpha


def used_colours(rgb, alpha):
    opaque = alpha >= ALPHA_CUT
    if not opaque.any():
        return 0
    srgb = np.clip(pixelate.linear_to_srgb(rgb[opaque]), 0.0, 1.0)
    values = np.round(srgb * 255.0).astype(np.int64)
    return int(len(np.unique(values, axis=0)))


def main(argv):
    args = parse_args(argv)
    w, h = args.w, args.h
    files = list_inputs(args.in_dir, args.glob)
    outline_linear = hex_to_linear(args.outline)

    if args.build_palette:
        hexes = build_palette(files, w, h, args.colors)
        with open(args.palette, "w") as handle:
            json.dump({"colors": hexes}, handle, indent=2)
            handle.write("\n")
    else:
        hexes = load_palette(args.palette)
    palette_linear = np.array([hex_to_linear(c) for c in hexes], dtype=np.float64)

    # Pass 1: downscale every input and check the margin rule before writing anything.
    grids = []
    bad = []
    for path in files:
        rgb, alpha = downscaled(path, w, h)
        count = margin_violators(alpha >= ALPHA_CUT, args.outline_px)
        if count > 0:
            bad.append("%s=%d" % (os.path.basename(path), count))
        grids.append((os.path.basename(path), rgb, alpha))
    if bad:
        fail("opaque pixels within %d px of the frame border (violators): %s"
             % (args.outline_px, " ".join(bad)))

    # Pass 2: map to the shared palette, add the outline, write.
    os.makedirs(args.out_dir, exist_ok=True)
    max_used = 0
    for name, rgb, alpha in grids:
        out_rgb, out_alpha = make_sprite(rgb, alpha, palette_linear, args.dither,
                                         outline_linear, args.outline_px)
        pixelate.save_rgba(os.path.join(args.out_dir, name),
                           np.dstack((out_rgb, out_alpha[:, :, None])))
        max_used = max(max_used, used_colours(out_rgb, out_alpha))

    print("CHARPIX OK n=%d w=%d h=%d palette=%d max_used=%d"
          % (len(files), w, h, len(hexes) + 1, max_used))
    sys.stdout.flush()
    return 0


if __name__ == "__main__":
    if "--" in sys.argv:
        ARGV = sys.argv[sys.argv.index("--") + 1:]
    else:
        ARGV = []
    sys.exit(main(ARGV))
