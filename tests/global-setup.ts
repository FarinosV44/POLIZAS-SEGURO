import { Pool } from 'pg';
import { migrar } from '../src/lib/migraciones';

// Base de datos de pruebas: se vacía y se migra desde cero en cada ejecución. Solo datos sintéticos.
export default async function prepararBaseDePruebas() {
  const url = process.env.DATABASE_URL_TEST ?? 'postgres://polizas:polizas@localhost:5432/polizas_test';
  if (!/test/.test(url)) throw new Error('DATABASE_URL_TEST debe apuntar a una base de datos de pruebas (con «test» en el nombre).');
  process.env.DATABASE_URL = url;
  const pool = new Pool({ connectionString: url });
  await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await migrar(pool);
  await pool.end();
}
