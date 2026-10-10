// Characters module (DESIGN.md 7.3): the single import point for the
// character pieces. Pure re-exports only — the drawing itself lives in the
// underlying modules and is covered by their own tests.

export { drawMark, drawMarkBody, drawMarkHead } from './characters_mark.js';
export { drawDave } from './characters_dave.js';
export { speechBubble } from './speech.js';
