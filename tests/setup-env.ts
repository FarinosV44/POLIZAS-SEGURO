import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

process.env.DATABASE_URL = process.env.DATABASE_URL_TEST ?? 'postgres://polizas:polizas@localhost:5432/polizas_test';
process.env.STORAGE_DIR = mkdtempSync(path.join(tmpdir(), 'polizas-docs-'));
process.env.MAX_UPLOAD_MB = '2';
