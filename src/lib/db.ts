import './tipos-pg';
import { Pool, type PoolClient, type QueryResultRow } from 'pg';

// Una sola pool por proceso (también entre recargas en desarrollo).
const global_ = globalThis as unknown as { __pool?: Pool };

export function pool(): Pool {
  if (!global_.__pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('Falta DATABASE_URL (ver .env.example).');
    global_.__pool = new Pool({ connectionString: url, max: Number(process.env.DB_POOL_MAX ?? 10), idleTimeoutMillis: 10_000 });
    // Las fechas DATE se devuelven como 'YYYY-MM-DD' y no como Date (evita desfases por zona horaria).
  }
  return global_.__pool;
}

export type Db = Pick<PoolClient, 'query'>;

export async function q<T extends QueryResultRow = QueryResultRow>(sql: string, params: unknown[] = [], db: Db = pool()) {
  const r = await db.query<T>(sql, params);
  return r.rows;
}

export async function q1<T extends QueryResultRow = QueryResultRow>(sql: string, params: unknown[] = [], db: Db = pool()) {
  const r = await db.query<T>(sql, params);
  return r.rows[0] ?? null;
}

export async function transaccion<T>(fn: (db: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');
    const r = await fn(client);
    await client.query('COMMIT');
    return r;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
