import { pool } from '../src/lib/db';
import { migrar } from '../src/lib/migraciones';

const aplicadas = await migrar(pool());
console.log(aplicadas.length ? `Migraciones aplicadas: ${aplicadas.join(', ')}` : 'Base de datos al día.');
await pool().end();
