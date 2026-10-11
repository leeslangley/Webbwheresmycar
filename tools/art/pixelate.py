"""Pixel-art stage for Webb, where's my car? (card A04).

Turns a large transparent render into a small sprite: hard pixel edges, a limited
palette and a crisp 1px dark outline. Blender-python only: this runs in Blender,
whose Python has numpy but no PIL.

    /opt/homebrew/bin/blender --background --python tools/art/pixelate.py -- \
        --in assets/art/preview/roadster_flat.png \
        --out assets/art/preview/roadster_px.png \
        --width 320 --colors 24 --scale 4

Arguments (everything after the lone --):
    --in <png>            source render (transparent RGBA)
    --out <png>           destination sprite (grows to width+2 by height+2)
    --width <int>         target sprite width in pixels            (384)
    --colors <int>        palette size for the k-means quantiser    (24)
    --outline <#rrggbb|auto>  outline colour                       (auto)
    --dither <float>      ordered 4x4 Bayer dither strength          (0.0)
    --scale <int>         also write <out>_x<scale>.png (nearest-neighbour)

Colour management: the input is read with the 'Non-Color' colourspace so the float
values are the raw file values, then converted to linear RGB; all the averaging and
the k-means clustering happen in linear space, and the result is converted back to
sRGB before it is written.
"""

import os
import sys

import bpy
import numpy as np

DEFAULT_WIDTH = 384
DEFAULT_COLORS = 24

# Standard 4x4 ordered dither matrix, normalised to 0..1.
BAYER4 = np.array([[0, 8, 2, 10],
                   [12, 4, 14, 6],
                   [3, 11, 1, 9],
                   [15, 7, 13, 5]], dtype=np.float64) / 16.0

LUMA = np.array([0.2126, 0.7152, 0.0722], dtype=np.float64)


def parse_args(argv):
    """Parse `--key value` and bare flags after the lone `--`."""
    opts = {"width": DEFAULT_WIDTH, "colors": DEFAULT_COLORS,
            "outline": "auto", "dither": 0.0, "scale": None,
            "in": None, "out": None}
    i = 0
    while i < len(argv):
        arg = argv[i]
        if arg.startswith("--"):
            key = arg[2:]
            if key in opts:
                if i + 1 >= len(argv) or argv[i + 1].startswith("--"):
                    raise SystemExit("pixelate: --%s needs a value" % key)
                opts[key] = argv[i + 1]
                i += 2
                continue
            raise SystemExit("pixelate: unknown argument %s" % arg)
        raise SystemExit("pixelate: unexpected argument %s" % arg)
    if not opts["in"] or not opts["out"]:
        raise SystemExit("pixelate: --in and --out are required")
    opts["width"] = int(opts["width"])
    opts["colors"] = int(opts["colors"])
    opts["dither"] = float(opts["dither"])
    if opts["scale"] is not None:
        opts["scale"] = int(opts["scale"])
        if opts["scale"] < 1:
            raise SystemExit("pixelate: --scale must be >= 1")
    if opts["width"] < 1:
        raise SystemExit("pixelate: --width must be >= 1")
    if opts["colors"] < 1:
        raise SystemExit("pixelate: --colors must be >= 1")
    return opts


# ---------------------------------------------------------------- colour ---

def srgb_to_linear(c):
    c = np.clip(c, 0.0, 1.0)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def linear_to_srgb(c):
    c = np.clip(c, 0.0, 1.0)
    return np.where(c <= 0.0031308, c * 12.92,
                    1.055 * np.power(c, 1.0 / 2.4) - 0.055)


def parse_hex(text):
    """'#rrggbb' -> linear RGB float array, or None for 'auto'."""
    if text == "auto":
        return None
    value = text.strip().lstrip("#")
    if len(value) != 6:
        raise SystemExit("pixelate: --outline wants #rrggbb or auto, got %r" % text)
    try:
        return np.array([int(value[i:i + 2], 16) / 255.0 for i in (0, 2, 4)],
                        dtype=np.float64)
    except ValueError:
        raise SystemExit("pixelate: --outline wants #rrggbb or auto, got %r" % text)


# ------------------------------------------------------------------ image ---

def load_rgba(path):
    """Load a PNG as a top-to-bottom (h, w, 4) float array of LINEAR rgb."""
    if not os.path.isfile(path):
        raise SystemExit("pixelate: no such input file: %s" % path)
    image = bpy.data.images.load(path)
    image.colorspace_settings.name = "Non-Color"
    w, h = image.size
    flat = np.array(image.pixels[:], dtype=np.float64).reshape(h, w, 4)
    flat = flat[::-1]  # Blender stores rows bottom-to-top
    flat[:, :, :3] = srgb_to_linear(flat[:, :, :3])
    return flat


def save_rgba(path, rgba):
    """Write a top-to-bottom (h, w, 4) LINEAR rgb array as an 8-bit RGBA PNG."""
    h, w = rgba.shape[0], rgba.shape[1]
    srgb = linear_to_srgb(rgba[:, :, :3])
    alpha = np.where(rgba[:, :, 3] >= 0.5, 1.0, 0.0)
    srgb = np.where(alpha[:, :, None] > 0.0, srgb, 0.0)  # tidy hidden rgb
    out = np.zeros((h, w, 4), dtype=np.float64)
    out[:, :, :3] = srgb
    out[:, :, 3] = alpha
    image = bpy.data.images.new(os.path.basename(path), width=w, height=h,
                               alpha=True)
    image.colorspace_settings.name = "Non-Color"
    image.pixels.foreach_set(out[::-1].reshape(-1))  # back to bottom-to-top
    image.file_format = "PNG"
    image.filepath_raw = path
    image.save()


def box_weights(src_n, dst_n):
    """Weights (dst_n, src_n) for a box-filter resize; every row sums to 1."""
    weights = np.zeros((dst_n, src_n), dtype=np.float64)
    scale = src_n / float(dst_n)
    for j in range(dst_n):
        a = j * scale
        b = a + scale
        k0 = int(a) if a >= 0.0 else 0
        k1 = min(int(np.ceil(b)), src_n)
        for k in range(k0, k1):
            lo = a if a > k else float(k)
            hi = b if b < k + 1 else float(k + 1)
            if hi > lo:
                weights[j, k] = hi - lo
    totals = weights.sum(axis=1, keepdims=True)
    totals[totals == 0.0] = 1.0
    return weights / totals


def resize_premultiplied(src, out_w, out_h):
    """Area-average downscale of a premultiplied (h, w, 4) array."""
    h, w = src.shape[0], src.shape[1]
    wx = box_weights(w, out_w)
    wy = box_weights(h, out_h)
    mid = np.tensordot(src, wx, axes=([1], [1]))    # (h, out_w, 4)
    return np.tensordot(wy, mid, axes=([1], [0]))   # (out_h, out_w, 4)


def downscale(src, out_w, out_h):
    """Premultiply by alpha, area-average down to (out_h, out_w), un-premultiply."""
    premultiplied = src.copy()
    premultiplied[:, :, :3] *= src[:, :, 3:4]
    small = resize_premultiplied(premultiplied, out_w, out_h)
    alpha = np.clip(small[:, :, 3], 0.0, 1.0)
    rgb = np.zeros((out_h, out_w, 3), dtype=np.float64)
    opaque = alpha > 0.0
    rgb[opaque] = small[:, :, :3][opaque] / alpha[opaque][:, None]
    return np.clip(rgb, 0.0, 1.0), alpha


# ---------------------------------------------------------------- palette ---

def kmeans(data, k, iterations=12):
    """k-means in linear RGB with a deterministic luminance-spaced start."""
    n = data.shape[0]
    k = max(1, min(int(k), n))
    lum = data @ LUMA
    order = np.argsort(lum, kind="stable")
    picks = np.linspace(0, n - 1, k).astype(np.int64)
    centres = data[order[picks]].copy()
    for _ in range(iterations):
        labels = nearest(data, centres)
        previous = centres
        centres = centres.copy()
        for cluster in range(k):
            selected = labels == cluster
            if selected.any():
                centres[cluster] = data[selected].mean(axis=0)
        if np.array_equal(centres, previous):
            break
    return centres


def nearest(data, centres):
    """Index of the closest centre for every row of data (deterministic ties)."""
    dist = ((data[:, None, :] - centres[None, :, :]) ** 2).sum(axis=2)
    return np.argmin(dist, axis=1)


def apply_dither(rgb, strength):
    """Nudge luminance with a 4x4 Bayer matrix; 0 strength means no change."""
    if strength <= 0.0:
        return rgb
    h, w = rgb.shape[0], rgb.shape[1]
    rows = np.arange(h)[:, None] % 4
    cols = np.arange(w)[None, :] % 4
    factor = 1.0 + (BAYER4[rows, cols] - 0.5) * strength
    return np.clip(rgb * factor[:, :, None], 0.0, 1.0)


def add_outline(rgb, alpha, outline_colour):
    """Pad by one transparent pixel, then darken the ring touching the sprite."""
    h, w = rgb.shape[0], rgb.shape[1]
    padded_rgb = np.zeros((h + 2, w + 2, 3), dtype=np.float64)
    padded_alpha = np.zeros((h + 2, w + 2), dtype=np.float64)
    padded_rgb[1:-1, 1:-1] = rgb
    padded_alpha[1:-1, 1:-1] = alpha

    opaque = padded_alpha >= 0.5
    neighbours = []
    up = np.zeros_like(opaque); up[1:, :] = opaque[:-1, :]
    down = np.zeros_like(opaque); down[:-1, :] = opaque[1:, :]
    left = np.zeros_like(opaque); left[:, 1:] = opaque[:, :-1]
    right = np.zeros_like(opaque); right[:, :-1] = opaque[:, 1:]
    neighbours = [up, down, left, right]
    touches = np.zeros_like(opaque)
    for mask in neighbours:
        touches |= mask

    ring = (~opaque) & touches
    filled = np.zeros_like(opaque)
    for mask in neighbours:
        take = ring & mask & (~filled)
        padded_rgb[take] = padded_rgb[take] * 0.30
        filled |= take
    padded_alpha[ring] = 1.0
    if outline_colour is not None:
        padded_rgb[ring] = outline_colour
    return padded_rgb, padded_alpha


# -------------------------------------------------------------------- run ---

def main(argv):
    opts = parse_args(argv)
    width = opts["width"]
    outline_colour = parse_hex(opts["outline"])

    src = load_rgba(opts["in"])
    src_h, src_w = src.shape[0], src.shape[1]
    out_h = max(1, int(round(src_h * width / float(src_w))))
    rgb, alpha = downscale(src, width, out_h)

    opaque = alpha >= 0.5
    if opaque.any():
        pixels = rgb[opaque]
        data = apply_dither(pixels, opts["dither"])
        centres = kmeans(data, opts["colors"])
        labels = nearest(data, centres)
        palette = centres[labels]
        rgb[:] = 0.0
        rgb[opaque] = palette
    alpha[:] = np.where(opaque, 1.0, 0.0)

    rgb, alpha = add_outline(rgb, alpha, outline_colour)
    save_rgba(opts["out"], np.dstack((rgb, alpha[:, :, None])))

    if opts["scale"] is not None:
        scale = opts["scale"]
        stem = opts["out"][:-4] if opts["out"].lower().endswith(".png") else opts["out"]
        big = np.repeat(np.repeat(rgb, scale, axis=0), scale, axis=1)
        big_alpha = np.repeat(np.repeat(alpha, scale, axis=0), scale, axis=1)
        save_rgba("%s_x%d.png" % (stem, scale),
                  np.dstack((big, big_alpha[:, :, None])))

    print("PIXELATE OK out=%s size=%dx%d colors=%d" %
          (opts["out"], rgb.shape[1], rgb.shape[0], int(opts["colors"])))
    return 0


if __name__ == "__main__":
    if "--" in sys.argv:
        ARGV = sys.argv[sys.argv.index("--") + 1:]
    else:
        ARGV = []
    sys.exit(main(ARGV))
