import { timingSafeEqual } from 'node:crypto';
import { tareaAvisos } from '@/lib/avisos/tarea';
import { procesarColaIA } from '@/lib/ia/siniestro';
import { procesarColaExtraccion } from '@/lib/ia/extraccion';

export const maxDuration = 300;

export const dynamic = 'force-dynamic';

/**
 * Tarea programada por HTTP (GitHub Actions cada 10 minutos en el despliegue gratuito, o cualquier cron): POST con «Authorization: Bearer CRON_SECRET».
 * Sin CRON_SECRET configurado, la ruta no existe (404).
 */
export async function POST(req: Request) {
  const secreto = process.env.CRON_SECRET;
  const recibido = req.headers.get('authorization')?.replace(/^Bearer /, '') ?? '';
  if (!secreto || secreto.length < 32) return new Response('No encontrado', { status: 404 });
  const a = Buffer.from(recibido), b = Buffer.from(secreto);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return new Response('No autorizado', { status: 401 });
  const avisos = await tareaAvisos();
  // Lecturas y análisis pendientes (respaldo de los que no terminaron al pedirlos).
  const ia = (await procesarColaExtraccion()) + (await procesarColaIA());
  return Response.json({ ...avisos, ia });
}
