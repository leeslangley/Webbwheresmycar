"""Blender-python tests for quantise() in tools/art/pixramp.py (card CB13).

    /opt/homebrew/bin/blender --background --python-exit-code 1 --python tests/pixramp_quant_test.py 2>&1 | tail -1

Plain asserts: an uncaught exception makes Blender exit 1. Prints PIXRAMP QUANT OK last.
"""

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), 'tools', 'art'))
sys.path.insert(0, os.path.join(os.getcwd(), 'tools', 'art'))

import numpy as np  # noqa: E402
import pixramp as p  # noqa: E402

PAINT = '#C96F32'


def paint_patch():
    """32x64 paint: luma ramps 0.02 -> 0.8 across the 64 columns, rows identical."""
    base = p.srgb_to_linear(p.hex_rgb(PAINT))
    base_luma = float(base @ p.LUMA)
    target = np.linspace(0.02, 0.8, 64)
    rgb = np.zeros((32, 64, 3), dtype=np.float64)
    for x in range(64):
        rgb[:, x, :] = base * (target[x] / base_luma)
    opaque = np.ones((32, 64), dtype=bool)
    cls = np.zeros((32, 64), dtype=np.int64)
    return rgb, opaque, cls


def check_bayer():
    b = p.bayer4()
    assert b.shape == (4, 4)
    assert abs(float(b.min()) + 0.5) < 1e-12, float(b.min())
    assert abs(float(b.max()) - (15.0 / 16.0 - 0.5)) < 1e-12, float(b.max())
    # Raw Bayer values are 0..15/16 with mean 120/256; minus 0.5 gives -1/32.
    assert abs(float(b.mean()) - (120.0 / 256.0 - 0.5)) < 1e-12, float(b.mean())


def check_paint_dither0():
    rgb, opaque, cls = paint_patch()
    out, idx = p.quantise(rgb, opaque, cls, PAINT, dither=0.0)
    rows = p.paint_ramp(PAINT)
    colours = set(map(tuple, out.reshape(-1, 3).round(12).tolist()))
    assert 1 <= len(colours) <= 7, len(colours)
    ramp_set = set(map(tuple, rows.round(12).tolist()))
    for c in colours:
        assert c in ramp_set, c
    # The pixel whose luma is nearest the median is step 4 (the base colour).
    luma = rgb @ p.LUMA
    median = float(np.median(luma))
    y, x = np.unravel_index(int(np.argmin(np.abs(luma - median))), luma.shape)
    assert idx[y, x] == 4, idx[y, x]
    assert np.allclose(out[y, x], rows[4], atol=1e-12), (out[y, x], rows[4])
    # Steps never go down along a row (luma rises with x).
    for row in idx:
        assert np.all(np.diff(row) >= 0), row.tolist()
    # Every paint pixel gets a step, nothing else does.
    assert int(idx.min()) == 0 and int(idx.max()) == 6, (int(idx.min()), int(idx.max()))


def check_paint_dither_half():
    rgb, opaque, cls = paint_patch()
    out0, idx0 = p.quantise(rgb, opaque, cls, PAINT, dither=0.0)
    out5, idx5 = p.quantise(rgb, opaque, cls, PAINT, dither=0.5)
    changed = float(np.mean(idx5 != idx0))
    print('dither 0.5 changed fraction: %.4f' % changed)
    assert 0.02 <= changed <= 0.45, changed


def check_steps():
    rgb, opaque, cls = paint_patch()
    out, idx = p.quantise(rgb, opaque, cls, PAINT, dither=0.5, steps=(1, 3, 4, 5, 6))
    seen = set(int(v) for v in np.unique(idx) if v >= 0)
    assert seen <= {1, 3, 4, 5, 6}, seen
    assert seen == {1, 3, 4, 5, 6}, seen


def check_paint2():
    rgb, opaque, cls = paint_patch()
    cls2 = cls.copy()
    cls2[:, 32:] = 8
    out, idx = p.quantise(rgb, opaque, cls2, PAINT, color2='#1c2a6e', dither=0.0)
    left = out[:, :32].reshape(-1, 3)
    right = out[:, 32:].reshape(-1, 3)
    red_rows = set(map(tuple, p.paint_ramp(PAINT).round(12).tolist()))
    blue_rows = set(map(tuple, p.paint_ramp('#1c2a6e').round(12).tolist()))
    assert set(map(tuple, left.round(12).tolist())) <= red_rows
    assert set(map(tuple, right.round(12).tolist())) <= blue_rows
    # paint2 with no color2 falls back to the paint colour.
    out_fb, _ = p.quantise(rgb, opaque, cls2, PAINT, color2=None, dither=0.0)
    assert set(map(tuple, out_fb[:, 32:].reshape(-1, 3).round(12).tolist())) <= red_rows


def check_chrome():
    srgb = np.zeros((8, 4), dtype=np.float64)
    srgb[:, :2] = 0.05
    srgb[:, 2:] = 0.99
    lin = p.srgb_to_linear(srgb)
    rgb = np.stack([lin, lin, lin], axis=2)
    opaque = np.ones((8, 4), dtype=bool)
    cls = np.ones((8, 4), dtype=np.int64)
    out, idx = p.quantise(rgb, opaque, cls, PAINT)
    assert p.lin_hex(out[0, 3]) == '#ffffff', p.lin_hex(out[0, 3])
    assert p.lin_hex(out[0, 0]) == p.FIXED_HEX['chrome'][0], p.lin_hex(out[0, 0])
    assert int(idx.max()) == -1 and int(idx.min()) == -1


def check_other_classes_untouched_idx():
    rgb, opaque, cls = paint_patch()
    cls[:, :8] = 5          # lamp
    out, idx = p.quantise(rgb, opaque, cls, PAINT)
    assert np.all(idx[:, :8] == -1)
    assert np.all(idx[:, 8:] >= 0)
    lamp = set(map(tuple, out[:, :8].reshape(-1, 3).round(12).tolist()))
    lamp_ramp = set(map(tuple, p.fixed_ramp('lamp').round(12).tolist()))
    assert lamp <= lamp_ramp, lamp


def main():
    check_bayer()
    check_paint_dither0()
    check_paint_dither_half()
    check_steps()
    check_paint2()
    check_chrome()
    check_other_classes_untouched_idx()
    print('PIXRAMP QUANT OK')
    # Blender prints its own "Blender quit" banner after the script ends, which
    # would push PIXRAMP QUANT OK off the last line. Flush, then exit at once so it
    # stays last. Failures never reach this point: they raise and Blender exits 1.
    sys.stdout.flush()
    os._exit(0)


main()
