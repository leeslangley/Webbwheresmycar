# CA03: the material set for the part modules. It is cbmat's set (CB01) plus the
# extra names part cards use. Every material name must be a key of
# cbmat.MASK_CLASS, because the mask pass classifies by name.
# Blender only: this module imports bpy through carlib and cbmat.
import carlib
import cbmat


def make_all(hexs, finish='solid', hex2=None):
    """The part material set for one car: cbmat.make_all(hexs, finish, hex2) plus
    the extra names. black, dark, vinyl, fabric and leather are the same object as
    trim; lamp_white is lamp; lamp_red is tail."""
    mats = cbmat.make_all(hexs, finish, hex2 or '#ffffff')
    for alias in ('black', 'dark', 'vinyl', 'fabric', 'leather'):
        mats[alias] = mats['trim']
    mats['lamp_white'] = mats['lamp']
    mats['lamp_red'] = mats['tail']
    mats['alloy'] = carlib.make_mat('alloy', carlib.hex_to_rgb('#c8ccd4'),
                                    metallic=1.0, roughness=0.25)
    mats['brass'] = carlib.make_mat('brass', carlib.hex_to_rgb('#b08a3a'),
                                    metallic=1.0, roughness=0.3)
    mats['lamp_amber'] = carlib.make_mat('lamp_amber', carlib.hex_to_rgb('#ff9a1a'),
                                         emission=carlib.hex_to_rgb('#ff9a1a'),
                                         emission_strength=0.8)
    mats['plate_white'] = carlib.make_mat('plate_white',
                                          carlib.hex_to_rgb('#f4f4f0'),
                                          roughness=0.5)
    mats['plate_yellow'] = carlib.make_mat('plate_yellow',
                                           carlib.hex_to_rgb('#f2c418'),
                                           roughness=0.5)
    return mats
