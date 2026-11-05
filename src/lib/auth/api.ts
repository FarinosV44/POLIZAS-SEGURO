import { cookies } from 'next/headers';
import { usuarioDeToken } from './sesiones';
import { nombreCookie } from './servidor';
import { NoEncontrado } from '../errores';

const CABECERAS = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };

/** Rutas de descarga: sin sesión o sin permiso responden 404 (como si no existiera). */
export async function descarga(fn: (u: NonNullable<Awaited<ReturnType<typeof usuarioDeToken>>>) => Promise<{ nombre: string; tipo: string; datos: Uint8Array | string }>) {
  const u = await usuarioDeToken((await cookies()).get(nombreCookie())?.value);
  if (!u) return new Response('No encontrado', { status: 404, headers: CABECERAS });
  try {
    const r = await fn(u);
    return new Response(r.datos as BodyInit, {
      headers: { ...CABECERAS, 'Content-Type': r.tipo, 'Content-Disposition': `attachment; filename="${r.nombre.replace(/[^\x20-\x7e]/g, '_').replace(/"/g, '')}"; filename*=UTF-8''${encodeURIComponent(r.nombre)}` },
    });
  } catch (e) {
    if (e instanceof NoEncontrado) return new Response('No encontrado', { status: 404, headers: CABECERAS });
    throw e;
  }
}
