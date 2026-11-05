import { q1 } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Comprobación de salud para el balanceador o el monitor: sin datos ni configuración. */
export async function GET() {
  try {
    await q1('SELECT 1');
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ ok: false }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
