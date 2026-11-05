import { timingSafeEqual } from 'node:crypto';
import { tareaAvisos } from '@/lib/avisos/tarea';

export const dynamic = 'force-dynamic';

/**
 * Alternativa al worker para plataformas con cron por HTTP: POST con «Authorization: Bearer CRON_SECRET».
 * Sin CRON_SECRET configurado, la ruta no existe (404).
 */
export async function POST(req: Request) {
  const secreto = process.env.CRON_SECRET;
  const recibido = req.headers.get('authorization')?.replace(/^Bearer /, '') ?? '';
  if (!secreto || secreto.length < 32) return new Response('No encontrado', { status: 404 });
  const a = Buffer.from(recibido), b = Buffer.from(secreto);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return new Response('No autorizado', { status: 401 });
  return Response.json(await tareaAvisos());
}
