// Export the car profile outlines (src/art/profiles.js) to JSON for the
// Blender pipeline (docs/ART_BIBLE.md). Run with: make art-profiles
// Prints JSON to stdout; the Makefile redirects it to tools/art/profiles.json.

import { PROFILES } from '../../src/art/profiles.js';

print(JSON.stringify(PROFILES, null, 1));
