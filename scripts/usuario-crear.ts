// Alta de una cuenta desde el servidor (no hay registro público).
//   npm run usuario:crear -- --email tu@correo.es --nombre "Tu nombre" [--rol admin|colaborador]
// La contraseña se pide por teclado (no queda en el historial) o se lee de USUARIO_CLAVE.
import { createInterface } from 'node:readline';
import { parseArgs } from 'node:util';
import { pool } from '../src/lib/db';
import { crearUsuario } from '../src/lib/datos/usuarios';
import { Invalido } from '../src/lib/errores';

const { values } = parseArgs({ options: { email: { type: 'string' }, nombre: { type: 'string' }, rol: { type: 'string', default: 'admin' } } });
if (!values.email || !values.nombre) {
  console.error('Uso: npm run usuario:crear -- --email tu@correo.es --nombre "Tu nombre" [--rol admin|colaborador]');
  process.exit(1);
}

async function pedirClave(): Promise<string> {
  if (process.env.USUARIO_CLAVE) return process.env.USUARIO_CLAVE;
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  const salida = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
  process.stdout.write('Contraseña (mín. 12 caracteres): ');
  salida._writeToOutput = () => {};
  const clave = await new Promise<string>((r) => rl.question('', r));
  rl.close();
  process.stdout.write('\n');
  return clave;
}

try {
  const id = await crearUsuario(null, { email: values.email, nombre: values.nombre, rol: values.rol, clave: await pedirClave() });
  console.log(`Cuenta creada (${values.rol}): ${values.email} · ${id}`);
} catch (e) {
  console.error(e instanceof Invalido ? Object.values(e.campos).join('\n') : (e as Error).message);
  process.exitCode = 1;
} finally {
  await pool().end();
}
