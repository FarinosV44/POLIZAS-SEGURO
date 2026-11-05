import { types } from 'pg';

// DATE (1082) como texto 'YYYY-MM-DD'; NUMERIC (1700) como texto para no perder céntimos.
types.setTypeParser(1082, (v) => v);
types.setTypeParser(1700, (v) => v);
