import { createReadStream } from 'node:fs';
import { mkdir, rename, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { randomUUID } from 'node:crypto';

/**
 * Almacenamiento privado de documentos (#8). Dos implementaciones con la misma interfaz:
 *  - «disco» (por defecto): carpeta STORAGE_DIR fuera de public/, para un servidor propio.
 *  - «supabase»: bucket PRIVADO de Supabase Storage, para despliegues sin disco (Vercel). Solo el servidor
 *    tiene la clave secreta; el navegador sube con una autorización de un solo uso y nunca puede leer.
 * En ambos casos los archivos solo se sirven por /api/documentos/[id] tras comprobar permisos.
 */
export interface Almacen {
  nombre: 'disco' | 'supabase';
  guardar(prefijo: string, datos: Buffer, mime?: string): Promise<string>;
  leer(clave: string): Promise<{ stream: NodeJS.ReadableStream; bytes: number }>;
  leerBuffer(clave: string): Promise<Buffer>;
  borrar(clave: string): Promise<void>;
  /** Solo «supabase»: URL de subida de un solo uso para esa clave. */
  autorizarSubida?(clave: string): Promise<string>;
}

export const nuevaClave = (prefijo: string) => `${prefijo}/${randomUUID()}`;

function validarClave(clave: string) {
  // Las claves las genera la aplicación (uuid/uuid); se rechaza cualquier otra forma.
  if (!/^[0-9a-f-]{36}\/[0-9a-f-]{36}$/.test(clave)) throw new Error('Clave de almacén no válida');
  return clave;
}

const raiz = () => path.resolve(/* turbopackIgnore: true */ process.env.STORAGE_DIR ?? './datos/documentos');
const ruta = (clave: string) => path.join(/* turbopackIgnore: true */ raiz(), validarClave(clave));

async function aBuffer(stream: NodeJS.ReadableStream) {
  const t: Buffer[] = [];
  for await (const x of stream as AsyncIterable<Buffer>) t.push(Buffer.from(x));
  return Buffer.concat(t);
}

export const almacenDisco: Almacen = {
  nombre: 'disco',
  async guardar(prefijo, datos) {
    const clave = nuevaClave(prefijo);
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
  async leerBuffer(clave) {
    return aBuffer((await this.leer(clave)).stream);
  },
  async borrar(clave) {
    await unlink(ruta(clave)).catch((e) => { if (e.code !== 'ENOENT') throw e; });
  },
};

// ---------------------------------------------------------------- Supabase Storage (API REST, sin SDK)
function configSupabase() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const clave = process.env.SUPABASE_SECRET_KEY;
  const bucket = process.env.SUPABASE_BUCKET ?? 'seguros-documentos';
  if (!url || !clave) throw new Error('Almacén Supabase sin configurar: faltan SUPABASE_URL y SUPABASE_SECRET_KEY.');
  // Claves nuevas (sb_secret_…) van en «apikey»; las antiguas (JWT service_role) también como Bearer.
  const cabeceras: Record<string, string> = { apikey: clave };
  if (clave.startsWith('eyJ')) cabeceras.Authorization = `Bearer ${clave}`;
  return { url, bucket, cabeceras };
}

async function fallo(r: Response, que: string) {
  return new Error(`Almacén: no se ha podido ${que} (${r.status} ${(await r.text()).slice(0, 200)})`);
}

export const almacenSupabase: Almacen = {
  nombre: 'supabase',
  async guardar(prefijo, datos, mime = 'application/octet-stream') {
    const { url, bucket, cabeceras } = configSupabase();
    const clave = nuevaClave(prefijo);
    const r = await fetch(`${url}/storage/v1/object/${bucket}/${validarClave(clave)}`, {
      method: 'POST', headers: { ...cabeceras, 'content-type': mime, 'x-upsert': 'false' }, body: new Uint8Array(datos),
    });
    if (!r.ok) throw await fallo(r, 'guardar el archivo');
    return clave;
  },
  async leer(clave) {
    const { url, bucket, cabeceras } = configSupabase();
    const r = await fetch(`${url}/storage/v1/object/authenticated/${bucket}/${validarClave(clave)}`, { headers: cabeceras });
    if (!r.ok || !r.body) throw await fallo(r, 'leer el archivo');
    return { stream: Readable.fromWeb(r.body as import('node:stream/web').ReadableStream), bytes: Number(r.headers.get('content-length') ?? 0) };
  },
  async leerBuffer(clave) {
    const { url, bucket, cabeceras } = configSupabase();
    const r = await fetch(`${url}/storage/v1/object/authenticated/${bucket}/${validarClave(clave)}`, { headers: cabeceras });
    if (!r.ok) throw await fallo(r, 'leer el archivo');
    return Buffer.from(await r.arrayBuffer());
  },
  async borrar(clave) {
    const { url, bucket, cabeceras } = configSupabase();
    const r = await fetch(`${url}/storage/v1/object/${bucket}`, {
      method: 'DELETE', headers: { ...cabeceras, 'content-type': 'application/json' }, body: JSON.stringify({ prefixes: [validarClave(clave)] }),
    });
    if (!r.ok && r.status !== 404) throw await fallo(r, 'borrar el archivo');
  },
  async autorizarSubida(clave) {
    const { url, bucket, cabeceras } = configSupabase();
    const r = await fetch(`${url}/storage/v1/object/upload/sign/${bucket}/${validarClave(clave)}`, {
      method: 'POST', headers: { ...cabeceras, 'content-type': 'application/json' }, body: '{}',
    });
    if (!r.ok) throw await fallo(r, 'autorizar la subida');
    const j = await r.json() as { url: string };
    return `${url}/storage/v1${j.url}`;
  },
};

export const almacen = (): Almacen => (process.env.STORAGE_DRIVER === 'supabase' ? almacenSupabase : almacenDisco);
/** ¿El navegador sube directamente al almacén? (necesario en Vercel, que limita las peticiones a 4,5 MB) */
export const subidaDirecta = () => process.env.STORAGE_DRIVER === 'supabase';
