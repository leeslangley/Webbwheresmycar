import { emit } from './golden_common.mjs';

emit({ numbers: [1, 2.5, 0.1 + 0.2, -3], text: 'ok', nested: { list: [true, null, 'x'], empty: {} } });
