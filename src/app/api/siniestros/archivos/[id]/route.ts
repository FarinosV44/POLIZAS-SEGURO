import { Readable } from 'node:stream';
import { cookies } from 'next/headers';
import { usuarioDeToken } from '@/lib/auth/sesiones';
import { nombreCookie } from '@/lib/auth/servidor';
import { archivoParaDescarga } from '@/lib/datos/siniestros';
import { almacen } from '@/lib/almacen';
import { auditar } from '@/lib/auditoria';
import { NoEncontrado } from '@/lib/errores';

export const dynamic = 'force-dynamic';
const no = () => new Response('No encontrado', { status: 404, headers: { 'Cache-Control': 'no-store' } });

/** Archivos de un siniestro: solo con sesión y permiso sobre su titular. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await usuarioDeToken((await cookies()).get(nombreCookie())?.value);
  if (!u) return no();
  let a;
  try { a = await archivoParaDescarga(u, (await params).id); } catch (e) { if (e instanceof NoEncontrado) return no(); throw e; }
  const { stream, bytes } = await almacen().leer(a.clave_almacen);
  const descargar = new URL(req.url).searchParams.has('descargar');
  await auditar(u.id, 'siniestro_archivo_descargado', 'siniestro_archivo', a.id, a.titular_id);
  return new Response(Readable.toWeb(stream as Readable) as ReadableStream, {
    headers: {
      'Content-Type': a.mime, 'Content-Length': String(bytes),
      'Content-Disposition': `${descargar ? 'attachment' : 'inline'}; filename="${a.nombre_original.replace(/[^\x20-\x7e]/g, '_').replace(/"/g, '')}"; filename*=UTF-8''${encodeURIComponent(a.nombre_original)}`,
      'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; object-src 'self'; frame-ancestors 'self'",
      'Cross-Origin-Resource-Policy': 'same-origin',
    },
  });
}
