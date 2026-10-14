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
