import { createReadStream } from 'node:fs';
import { mkdir, rename, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

/**
 * Almacenamiento privado de documentos en disco, fuera de public/ (#8).
 * Los archivos solo se sirven a través de /api/documentos/[id] tras comprobar permisos.
 * La interfaz permite sustituirlo por un almacén S3 compatible sin tocar el resto de la aplicación.
 */
export interface Almacen {
  guardar(prefijo: string, datos: Buffer): Promise<string>;
  leer(clave: string): Promise<{ stream: NodeJS.ReadableStream; bytes: number }>;
  borrar(clave: string): Promise<void>;
}

const raiz = () => path.resolve(/* turbopackIgnore: true */ process.env.STORAGE_DIR ?? './datos/documentos');

function ruta(clave: string) {
  // Las claves las genera la aplicación (uuid/uuid); se rechaza cualquier otra forma.
  if (!/^[0-9a-f-]{36}\/[0-9a-f-]{36}$/.test(clave)) throw new Error('Clave de almacén no válida');
  return path.join(/* turbopackIgnore: true */ raiz(), clave);
}

export const almacenDisco: Almacen = {
  async guardar(prefijo, datos) {
    const clave = `${prefijo}/${randomUUID()}`;
    const destino = ruta(clave);
    await mkdir(path.dirname(destino), { recursive: true, mode: 0o700 });
    const tmp = `${destino}.subiendo`;
    await writeFile(tmp, datos, { mode: 0o600 });
    await rename(tmp, destino);
    return clave;
  },
  async leer(clave) {
    const r = ruta(clave);
    const s = await stat(r);
    return { stream: createReadStream(r), bytes: s.size };
  },
  async borrar(clave) {
    await unlink(ruta(clave)).catch((e) => { if (e.code !== 'ENOENT') throw e; });
  },
};

export const almacen = (): Almacen => almacenDisco;
