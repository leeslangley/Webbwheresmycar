"""Blender-python tests for tools/art/pixramp.py (card CB11).

    /opt/homebrew/bin/blender --background --python-exit-code 1 --python tests/pixramp_test.py 2>&1 | tail -1

Plain asserts: an uncaught exception makes Blender exit 1. Prints PIXRAMP OK last.
"""

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), 'tools', 'art'))
sys.path.insert(0, os.path.join(os.getcwd(), 'tools', 'art'))

import numpy as np  # noqa: E402
import pixramp as p  # noqa: E402


def luma(row):
    return float(np.asarray(row, dtype=np.float64) @ p.LUMA)


def close_hex(a, b):
    """True when two '#rrggbb' strings have every channel within 1."""
    ca = [int(a[i:i + 2], 16) for i in (1, 3, 5)]
    cb = [int(b[i:i + 2], 16) for i in (1, 3, 5)]
    return all(abs(x - y) <= 1 for x, y in zip(ca, cb))


def check_constants():
    assert p.MULT == [0.10, 0.20, 0.38, 0.65, 1.0, 1.5, 2.3]
    assert p.SW == [0.35, 0.28, 0.18, 0.08, 0, 0, 0]
    assert p.HW == [0, 0, 0, 0, 0, 0.20, 0.55]
    assert p.SHADOW_TINT == '#2a1a5c'
    assert p.CREAM == '#fff2cc'
    assert p.OUTLINE == '#120a1e'
    assert p.LUMA.tolist() == [0.2126, 0.7152, 0.0722]


def check_round_trip():
    # Linear -> hex -> linear keeps the 8-bit value.
    for h in ['#000000', '#7f7f7f', '#ffffff', '#c96f32']:
        assert p.lin_hex(p.srgb_to_linear(p.hex_rgb(h))) == h
    assert p.hex_rgb('#FF8000').tolist()[0] == 1.0


def check_paints():
    for h in ['#C96F32', '#b02a2a', '#3b4a2f', '#1c2a6e', '#e5e0cf']:
        rows = p.paint_ramp(h)
        assert rows.shape == (7, 3)
        assert p.lin_hex(rows[4]) == h.lower(), (h, p.lin_hex(rows[4]))
        hexes = [p.lin_hex(r) for r in rows]
        assert len(set(hexes)) == 7, (h, hexes)
        lumas = [luma(r) for r in rows]
        for a, b in zip(lumas, lumas[1:]):
            assert b >= a - 1e-12, (h, lumas)
        assert lumas[6] > 0.45, (h, lumas[6])
        if h != '#e5e0cf':
            assert lumas[0] < 0.04, (h, lumas[0])


def check_lift():
    rows = p.paint_ramp('#101010')
    assert p.lin_hex(rows[4]) == '#202028', p.lin_hex(rows[4])


def check_white():
    rows = p.paint_ramp('#ffffff')
    hexes = [p.lin_hex(r) for r in rows]
    assert len(set(hexes)) >= 5, hexes
    lumas = [luma(r) for r in rows]
    for a, b in zip(lumas, lumas[1:]):
        assert b >= a - 1e-12, lumas


def check_reference_rows():
    # Literal rows shared with the JavaScript port (card CC04). Never change them.
    want = {
        '#C96F32': ['#3e203d', '#59304e', '#7c4458', '#a25a53',
                    '#c96f32', '#f4a36f', '#ffd3a3'],
        '#1E4D2B': ['#0a121d', '#111d27', '#172c2f', '#1b3d31',
                    '#1e4d2b', '#808d6c', '#c6c6a1'],
    }
    for h, literal in want.items():
        rows = p.paint_ramp(h)
        for i, r in enumerate(rows):
            got = p.lin_hex(r)
            assert close_hex(got, literal[i]), (h, i, got, literal[i])


def check_fixed():
    sizes = {'chrome': 6, 'glass': 4, 'tyre': 3, 'wall': 3,
             'lamp': 2, 'trim': 2, 'tail': 2}
    assert sorted(p.FIXED_HEX) == sorted(sizes)
    for name, n in sizes.items():
        ramp = p.fixed_ramp(name)
        assert ramp.shape == (n, 3), (name, ramp.shape)
        assert [p.lin_hex(r) for r in ramp] == p.FIXED_HEX[name], name
    try:
        p.fixed_ramp('nope')
        assert False, 'unknown fixed ramp must raise'
    except KeyError:
        pass


def main():
    check_constants()
    check_round_trip()
    check_paints()
    check_lift()
    check_white()
    check_reference_rows()
    check_fixed()
    print('PIXRAMP OK')
    # Blender prints its own "Blender quit" banner after the script ends, which
    # would push PIXRAMP OK off the last line. Flush, then exit at once so it
    # stays last. Failures never reach this point: they raise and Blender exits 1.
    sys.stdout.flush()
    os._exit(0)


main()
