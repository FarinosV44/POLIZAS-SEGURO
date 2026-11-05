import webpush from 'web-push';

/** Web Push estándar (VAPID). Si faltan las claves, el canal queda «sin configurar»: no se simula ningún envío. */
export const pushConfigurado = () => !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT);
export const clavePublicaVapid = () => process.env.VAPID_PUBLIC_KEY ?? null;

let listo = false;
function preparar() {
  if (!pushConfigurado()) throw new Error('Push sin configurar: faltan VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY o VAPID_SUBJECT.');
  if (!listo) { webpush.setVapidDetails(process.env.VAPID_SUBJECT!, process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!); listo = true; }
}

export type ResultadoPush = { ok: true } | { ok: false; caducada: boolean; error: string };

export async function enviarPush(sub: { endpoint: string; p256dh: string; auth: string }, carga: object): Promise<ResultadoPush> {
  preparar();
  try {
    await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify(carga), { TTL: 86400, urgency: 'normal' });
    return { ok: true };
  } catch (e) {
    const st = (e as { statusCode?: number }).statusCode;
    return { ok: false, caducada: st === 404 || st === 410, error: `${st ?? ''} ${(e as Error).message}`.trim().slice(0, 300) };
  }
}
