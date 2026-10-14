"""Colour ramps for the pixel stage (card CB11).

Pure numpy, no bpy: the same formula is re-run in JavaScript (card CC04 paintRamp)
so a repainted car matches the baked one exactly. Keep the constants in step with
docs/art/CB.md and docs/art/CARS_ALIGN.md.

Rows are LINEAR rgb (float arrays, 0..1). Use lin_hex() to get '#rrggbb' back.
"""

import numpy as np

LUMA = np.array([0.2126, 0.7152, 0.0722], dtype=np.float64)

# Pixel-stage constants (all CB11-CB20 cards use exactly these).
MULT = [0.10, 0.20, 0.38, 0.65, 1.0, 1.5, 2.3]
SW = [0.35, 0.28, 0.18, 0.08, 0.0, 0.0, 0.0]          # shadow tint weights
HW = [0.0, 0.0, 0.0, 0.0, 0.0, 0.20, 0.55]            # highlight weights
SHADOW_TINT = '#2a1a5c'
CREAM = '#fff2cc'
OUTLINE = '#120a1e'

FIXED_HEX = {
    'chrome': ['#1b1830', '#3c3f66', '#7a86b0', '#b7c6e2', '#eaf2ff', '#ffffff'],
    'glass': ['#0c141c', '#1d2f3d', '#4a6f86', '#bfe0ee'],
    'tyre': ['#0d0d12', '#1a1a22', '#2b2b36'],
    'wall': ['#8f8a7c', '#cfc8b4', '#f2ecd8'],
    'lamp': ['#ffd870', '#fffbe0'],
    'trim': ['#08080c', '#1c1c26'],
    'tail': ['#7a0e10', '#e02418'],
}


def srgb_to_linear(c):
    c = np.clip(c, 0.0, 1.0)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def linear_to_srgb(c):
    c = np.clip(c, 0.0, 1.0)
    return np.where(c <= 0.0031308, c * 12.92,
                    1.055 * np.power(c, 1.0 / 2.4) - 0.055)


def hex_rgb(s):
    """'#rrggbb' -> float sRGB array 0..1."""
    value = s.strip().lstrip('#')
    if len(value) != 6:
        raise ValueError('pixramp: hex colour wants #rrggbb, got %r' % s)
    return np.array([int(value[i:i + 2], 16) / 255.0 for i in (0, 2, 4)],
                    dtype=np.float64)


def lin_hex(lin3):
    """Linear rgb -> '#rrggbb' (sRGB, rounded to 8 bit)."""
    srgb = linear_to_srgb(np.asarray(lin3, dtype=np.float64))
    bytes_ = [int(round(float(v) * 255.0)) for v in srgb]
    bytes_ = [min(255, max(0, v)) for v in bytes_]
    return '#%02x%02x%02x' % tuple(bytes_)


def paint_ramp(hexs):
    """Seven linear steps made from the paint's sRGB hex; step 4 is the base."""
    base_srgb = hex_rgb(hexs)
    if float(base_srgb.max()) < 0x20 / 255.0:
        base_srgb = hex_rgb('#202028')  # near-black paints still need shading
    b = srgb_to_linear(base_srgb)
    tint = srgb_to_linear(hex_rgb(SHADOW_TINT))
    tint_luma = float(tint @ LUMA)
    if float(b @ LUMA) >= 0.5:
        top = np.ones(3, dtype=np.float64)
    else:
        top = srgb_to_linear(hex_rgb(CREAM))
    rows = np.zeros((7, 3), dtype=np.float64)
    for i in range(7):
        c = np.clip(b * MULT[i], 0.0, 1.0)
        # Shadow tint: move toward the violet tint but keep this row's luma.
        c_luma = float(c @ LUMA)
        tinted = tint * (c_luma / tint_luma)
        c = c + (tinted - c) * SW[i]
        # Highlight: move toward cream (or white for light bases).
        c = c * (1.0 - HW[i]) + top * HW[i]
        rows[i] = np.clip(c, 0.0, 1.0)
    return rows


def fixed_ramp(name):
    """Fixed ramp by name (see FIXED_HEX) -> (k,3) linear rgb."""
    if name not in FIXED_HEX:
        raise KeyError('pixramp: no fixed ramp named %r' % name)
    return np.array([srgb_to_linear(hex_rgb(h)) for h in FIXED_HEX[name]],
                    dtype=np.float64)


# ------------------------------------------------------------ class map (CB12)

# The 9 mask classes, in class-index order. MASK_FILE is cbmat.MASK_RGB / 255
# (raw file values 0..1); tests/pixramp_class_test.py checks the two agree.
CLASS_NAMES = ['paint', 'chrome', 'glass', 'tyre', 'wall', 'lamp', 'trim',
               'tail', 'paint2']
MASK_FILE = {
    'paint': (255 / 255.0, 0 / 255.0, 0 / 255.0),
    'chrome': (0 / 255.0, 255 / 255.0, 0 / 255.0),
    'glass': (0 / 255.0, 0 / 255.0, 255 / 255.0),
    'tyre': (255 / 255.0, 255 / 255.0, 0 / 255.0),
    'wall': (255 / 255.0, 255 / 255.0, 255 / 255.0),
    'lamp': (255 / 255.0, 0 / 255.0, 255 / 255.0),
    'trim': (0 / 255.0, 255 / 255.0, 255 / 255.0),
    'tail': (0 / 255.0, 0 / 255.0, 0 / 255.0),
    'paint2': (128 / 255.0, 0 / 255.0, 0 / 255.0),
}


def box_weights(src_n, dst_n):
    """Weights (dst_n, src_n) for a box-filter resize; every row sums to 1.
    Same idea as box_weights in tools/art/pixelate.py (copied, not imported)."""
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


def class_map(mask_rgba, out_w, out_h):
    """Majority vote of the full-size game mask down to the sprite grid.

    mask_rgba: (h, w, 4) float array of RAW file values 0..1, top row first.
    Every source pixel with alpha >= 0.5 votes for its nearest class colour
    (squared distance to MASK_FILE). The votes are area-averaged down to
    (out_h, out_w) with box weights; each destination pixel takes the argmax.

    Returns (classes, opaque): classes is an int array (out_h, out_w) of class
    indexes into CLASS_NAMES, opaque a bool array (out_h, out_w) = the
    area-averaged alpha >= 0.5. A class is only meaningful where opaque is True.
    """
    mask = np.asarray(mask_rgba, dtype=np.float64)
    if mask.ndim != 3 or mask.shape[2] != 4:
        raise ValueError('pixramp: class_map wants a (h, w, 4) array')
    h, w = mask.shape[0], mask.shape[1]
    palette = np.array([MASK_FILE[name] for name in CLASS_NAMES],
                       dtype=np.float64)                       # (9, 3)
    rgb = mask[:, :, :3]
    dist = ((rgb[:, :, None, :] - palette[None, None, :, :]) ** 2).sum(axis=3)
    nearest_class = np.argmin(dist, axis=2)                    # (h, w)

    voters = mask[:, :, 3] >= 0.5
    onehot = np.zeros((h, w, len(CLASS_NAMES)), dtype=np.float64)
    ys, xs = np.nonzero(voters)
    onehot[ys, xs, nearest_class[ys, xs]] = 1.0

    wy = box_weights(h, out_h)                                 # (out_h, h)
    wx = box_weights(w, out_w)                                 # (out_w, w)
    across = np.einsum('hwc,xw->hxc', onehot, wx)              # (h, out_w, 9)
    votes = np.einsum('yh,hxc->yxc', wy, across)               # (out_h, out_w, 9)
    alpha = wy @ (mask[:, :, 3] @ wx.T)                        # (out_h, out_w)
    classes = np.argmax(votes, axis=2).astype(np.int64)
    return classes, alpha >= 0.5


# ------------------------------------------------------- ramp quantiser (CB13)

# The 4x4 Bayer matrix of tools/art/pixelate.py (BAYER4), copied not imported.
_BAYER4 = np.array([[0, 8, 2, 10],
                    [12, 4, 14, 6],
                    [3, 11, 1, 9],
                    [15, 7, 13, 5]], dtype=np.float64) / 16.0

CHROME_EDGES = [0.10, 0.25, 0.50, 0.72, 0.92]   # sRGB edges, 6 steps


def bayer4():
    """The 4x4 ordered-dither matrix as floats, centred on 0 (-0.5..0.44)."""
    return _BAYER4 - 0.5


def _dither_field(h, w):
    """Bayer value for every pixel, from its position on the sprite grid."""
    rows = np.arange(h)[:, None] % 4
    cols = np.arange(w)[None, :] % 4
    return bayer4()[rows, cols]


def _paint_index(luma, median, field, dither, steps):
    """Ramp step 0..6 for each pixel of one paint class (log-luma bands)."""
    ln_mult = np.log(np.array(MULT, dtype=np.float64))
    bnd = (ln_mult[:-1] + ln_mult[1:]) / 2.0
    bw = float(np.mean(np.diff(ln_mult)))
    r = np.log(np.maximum(luma, 1e-5) / median)
    i = np.searchsorted(bnd, r + field * dither * bw)
    i = np.clip(i, 0, 6)
    allowed = np.array(sorted(set(steps)), dtype=np.int64)
    if len(allowed) < 7:
        nearest = np.argmin(np.abs(i[..., None] - allowed), axis=-1)
        i = allowed[nearest]
    return i


def quantise(rgb, opaque, cls, color, color2=None, dither=0.5,
             steps=(0, 1, 2, 3, 4, 5, 6), glass_dither=0.3):
    """Snap every material pixel onto its material's ramp (card CB13).

    rgb: (h, w, 3) LINEAR area-averaged render colour. opaque: bool (h, w).
    cls: int class map (CLASS_NAMES order). color: paint hex; color2: hex for
    class 8 (paint2), or the paint hex when None.

    Returns (out, idx): out (h, w, 3) linear colours, idx (h, w) int with the
    ramp step 0..6 for paint and paint2 pixels, -1 everywhere else.
    """
    arr = np.asarray(rgb, dtype=np.float64)
    if arr.ndim != 3 or arr.shape[2] != 3:
        raise ValueError('pixramp: quantise wants a (h, w, 3) array')
    h, w = arr.shape[0], arr.shape[1]
    opq = np.asarray(opaque, dtype=bool)
    cls = np.asarray(cls, dtype=np.int64)
    steps = tuple(steps)
    if not steps or any(s not in range(7) for s in steps):
        raise ValueError('pixramp: steps must be indices in 0..6, got %r' % (steps,))
    luma = arr @ LUMA
    field = _dither_field(h, w)
    out = np.zeros((h, w, 3), dtype=np.float64)
    idx = np.full((h, w), -1, dtype=np.int64)

    # Paint (class 0) and paint2 (class 8): each with its own ramp and median.
    paint_ramps = {
        0: paint_ramp(color),
        8: paint_ramp(color2 if color2 is not None else color),
    }
    for k, rows in paint_ramps.items():
        m = opq & (cls == k)
        if not m.any():
            continue
        median = max(float(np.median(luma[m])), 1e-5)
        i = _paint_index(luma, median, field, dither, steps)
        idx[m] = i[m]
        out[m] = rows[i[m]]

    # Every other class: fixed ramp, classes with fewer than 4 pixels stay black.
    for k, name in enumerate(CLASS_NAMES):
        if k in paint_ramps:
            continue
        m = opq & (cls == k)
        if int(m.sum()) < 4:
            continue
        ramp = fixed_ramp(name)
        n_steps = ramp.shape[0]
        s = linear_to_srgb(luma[m])
        if name == 'chrome':
            edges = np.array(CHROME_EDGES, dtype=np.float64)
            s_used = s
        else:
            edges = np.linspace(np.percentile(s, 2), np.percentile(s, 99),
                                n_steps + 1)[1:-1]
            s_used = s
            if name in ('glass', 'tyre'):
                s_used = s + field[m] * 0.08 * glass_dither
        j = np.clip(np.searchsorted(edges, s_used), 0, n_steps - 1)
        out[m] = ramp[j]
    return out, idx


# ------------------------------------------------------ outlines (CB14)

def _four_neighbours(a, fill):
    """Four shifted copies of a 2-d array: each out[y, x] is the named
    neighbour of a[y, x]; cells beyond the edge take `fill`."""
    up = np.full(a.shape, fill, dtype=a.dtype)
    down = np.full(a.shape, fill, dtype=a.dtype)
    left = np.full(a.shape, fill, dtype=a.dtype)
    right = np.full(a.shape, fill, dtype=a.dtype)
    up[1:, :] = a[:-1, :]
    down[:-1, :] = a[1:, :]
    left[:, 1:] = a[:, :-1]
    right[:, :-1] = a[:, 1:]
    return [up, down, left, right]


def add_outlines(out, cls, idx, opaque, color, color2=None):
    """Pad by 1 px and draw the selective outlines (card CB14).

    out: (h, w, 3) LINEAR colours from quantise(); cls, idx, opaque: the class
    map, ramp steps and opaque mask of the same grid. color / color2: paint hex
    (color2 None means paint2 uses color), as in quantise().

    Silhouette: each transparent cell 4-adjacent to an opaque cell becomes
    OUTLINE with alpha 1. Inner lines: a paint or paint2 cell with an opaque
    4-neighbour of another class goes to its ramp step 0; a glass or wall cell
    with such a neighbour goes to glass step 0. Chrome, lamp, tail, trim and
    tyre cells never change. All decisions use the original classes.

    Returns (rgb, alpha, cls2, idx2) on the padded (h+2, w+2) grid: cls2 is -1
    on outline and transparent cells, idx2 is -1 except on opaque cells (paint
    cells changed by an inner line get 0).
    """
    arr = np.asarray(out, dtype=np.float64)
    if arr.ndim != 3 or arr.shape[2] != 3:
        raise ValueError('pixramp: add_outlines wants a (h, w, 3) array')
    h, w = arr.shape[0], arr.shape[1]
    opq = np.asarray(opaque, dtype=bool)
    cls = np.asarray(cls, dtype=np.int64)
    idx = np.asarray(idx, dtype=np.int64)
    if opq.shape != (h, w) or cls.shape != (h, w) or idx.shape != (h, w):
        raise ValueError('pixramp: add_outlines wants cls, idx, opaque of shape (h, w)')

    H, W = h + 2, w + 2
    pop = np.zeros((H, W), dtype=bool)
    pop[1:-1, 1:-1] = opq
    pcls = np.full((H, W), -1, dtype=np.int64)
    pcls[1:-1, 1:-1] = np.where(opq, cls, -1)
    pidx = np.full((H, W), -1, dtype=np.int64)
    pidx[1:-1, 1:-1] = np.where(opq, idx, -1)

    # Silhouette ring: transparent cells touching an opaque cell.
    touch = np.zeros((H, W), dtype=bool)
    for n in _four_neighbours(pop, False):
        touch |= n
    ring = (~pop) & touch

    # Inner lines: opaque cells with an opaque neighbour of another class.
    diff = np.zeros((H, W), dtype=bool)
    for n_cls, n_op in zip(_four_neighbours(pcls, -1), _four_neighbours(pop, False)):
        diff |= n_op & (n_cls != pcls)
    inner = pop & diff
    paint_inner = inner & (pcls == 0)
    paint2_inner = inner & (pcls == 8)
    glass_inner = inner & ((pcls == 2) | (pcls == 4))

    outline = srgb_to_linear(hex_rgb(OUTLINE))
    rgb = np.zeros((H, W, 3), dtype=np.float64)
    rgb[1:-1, 1:-1][opq] = arr[opq]
    rgb[ring] = outline
    rgb[paint_inner] = paint_ramp(color)[0]
    rgb[paint2_inner] = paint_ramp(color2 if color2 is not None else color)[0]
    rgb[glass_inner] = fixed_ramp('glass')[0]

    alpha = np.zeros((H, W), dtype=np.float64)
    alpha[pop | ring] = 1.0

    cls2 = pcls.copy()
    idx2 = pidx.copy()
    idx2[paint_inner | paint2_inner] = 0
    return rgb, alpha, cls2, idx2
